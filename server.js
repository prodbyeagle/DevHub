//server.js

const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const cors = require('cors');
const { MongoClient, ServerApiVersion } = require('mongodb');
const bcrypt = require('bcrypt');
const session = require('express-session');

const app = express();
const PORT = process.env.PORT || 3000;

const sessionSecret = require('crypto').randomBytes(64).toString('hex');

app.use(bodyParser.json());
app.use(cors());
app.use(session({
    secret: sessionSecret,
    resave: false,
    saveUninitialized: true
}));

const uri = 'mongodb+srv://prodbyeagle:mZPLLs37Oi6x3NbR@snippetdb.wqznr37.mongodb.net/?retryWrites=true&w=majority';
const dbName = 'snippetDB';
let db;
let usersCollection;

async function run() {
    console.log("URI:", uri); // Überprüfe die URI
    const client = new MongoClient(uri, {
        serverApi: {
            version: ServerApiVersion.v1,
            strict: true,
            deprecationErrors: true,
        }
    });

    try {
        await client.connect();
        db = client.db(dbName);
        usersCollection = db.collection('users');
        console.log("Connected to MongoDB successfully!");
    } catch (error) {
        console.error("Error connecting to MongoDB:", error);
    }
}

// Funktion zum Formatieren des Datums in Ihrem gewünschten Format
function formatDateForDisplay(date) {
    const options = { 
        hour: 'numeric', 
        minute: '2-digit',
        second: '2-digit',
        day: '2-digit', 
        month: '2-digit', 
        year: 'numeric' 
    };
    return new Date(date).toLocaleString('de-DE', options);
}

// Route zum Abrufen aller Posts
app.get('/api/posts', async (req, res) => {
    try {
        // Hier holen Sie alle Posts aus der Datenbank
        const posts = await db.collection('posts').find().toArray();
        
        // Transformieren Sie das Datum jedes Posts vor dem Senden an den Client
        const postsWithFormattedDate = posts.map(post => ({
            ...post,
            date: formatDateForDisplay(post.date)
        }));
        
        res.status(200).json(postsWithFormattedDate); // Senden Sie die Posts mit formatiertem Datum als JSON zurück
    } catch (error) {
        console.error("Fehler beim Abrufen der Beiträge:", error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.post('/api/posts', async (req, res) => {
    const { content, identifier, codesnippet } = req.body; // Inhalte, Benutzername und Codeschnipsel aus der Anfrage extrahieren
    const date = new Date(); // Aktuelles Datum erstellen

    try {
        const result = await db.collection('posts').insertOne({
            content,
            username: identifier,
            date,
            codesnippet
        });

        const newPost = {
            _id: result.insertedId,
            content,
            username: identifier,
            date: formatDateForDisplay(date), // Datum im gewünschten Format zurückgeben
            codesnippet,
        };
        res.status(201).json(newPost);
    } catch (error) {
        console.error("Error creating new post:", error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.post('/login', async (req, res) => {
    const { identifier, password } = req.body; // "identifier" kann E-Mail oder Benutzername sein

    try {
        // Suche nach Benutzer mit der angegebenen E-Mail oder dem angegebenen Benutzernamen
        const user = await usersCollection.findOne({
            $or: [{ email: identifier }, { username: identifier }]
        });

        if (user && user.password === password) {
            // Erfolgreicher Login
            console.log(`Successful login for user: ${identifier} at ${new Date().toISOString()}`);
            req.session.userId = user._id;
            return res.redirect('/home');
        } else {
            return res.status(401).send('Invalid email or password');
        }
    } catch (error) {
        // Fehler beim Login
        console.error('Error during Login:', error);
        return res.status(500).send('Internal Server Error');
    }
});

app.post('/signup', async (req, res) => {
    const { email, password, username } = req.body;

    try {
        console.log('Received signup request for:', email, username);

        // Überprüfen, ob der Benutzer bereits existiert
        const existingUserByEmail = await usersCollection.findOne({ email });
        console.log('Existing user by email:', existingUserByEmail);

        if (existingUserByEmail) {
            console.log('User already exists with email:', email);
            return res.status(400).send('User already exists');
        }

        // Überprüfen, ob der Benutzername bereits verwendet wird
        const existingUserByUsername = await usersCollection.findOne({ username });
        console.log('Existing user by username:', existingUserByUsername);

        if (existingUserByUsername) {
            console.log('Username already taken:', username);
            return res.status(400).send('Username already taken');
        }        

        // Neuen Benutzer erstellen
        console.log('Creating new user:', email, username);
        await usersCollection.insertOne({ email, password, username, admin: false });
        
        console.log('User created successfully:', email, username);
        res.status(201).send('User created successfully');
    } catch (error) {
        console.error('Error during sign up:', error);
        res.status(500).send('Internal Server Error');
    }
});

app.post('/api/update', async (req, res) => {
    const { username, preferences } = req.body;

    try {
        // Überprüfen, ob der Benutzername mit dem in der Datenbank übereinstimmt
        const existingUser = await usersCollection.findOne({ username });
        if (!existingUser) {
            return res.status(400).send('Benutzer nicht gefunden');
        }  

        // Führen Sie die Aktualisierung in der Datenbank durch
        const updatedUser = await usersCollection.findOneAndUpdate(
            { username: username },
            { $set: { preferences: preferences.split(',') } }, // Ausgewählte Sprachen in Array aufsplitten
            { returnOriginal: false }
        );

        res.status(200).json({ message: 'Benutzervorlieben erfolgreich aktualisiert', user: updatedUser.value });
    } catch (err) {
        console.error('Fehler beim Aktualisieren der Benutzervorlieben:', err);
        res.status(500).json({ message: 'Interner Serverfehler' });
    }
});

app.post('/admin', async (req, res) => {
    try {
        const { username } = req.body;

        const collection = db.collection('users');

        const existingUser = await collection.findOne({ username });

        if (!existingUser) {
            console.log('User not found.');
            return res.status(400).send('Benutzer nicht gefunden');
        }

        if (existingUser.admin === true) {
            // Wenn der Benutzer ein Administrator ist, senden Sie die erforderlichen Benutzerdaten zurück
            const userData = await collection.find().toArray(); // Alle Benutzerdaten abrufen
            return res.status(200).json(userData);
        } else {
            return res.status(200).send('False');
        }
    } catch (err) {
        console.error('Fehler beim Überprüfen des Benutzers:', err);
        res.status(500).send('Interner Serverfehler');
    }
});


// API-Route zum Abrufen der Benutzernamen
app.get('/api/username', async (req, res) => {
    try {
        const collection = db.collection('users');
        const users = await collection.find().toArray();
        
        // Extrahieren Sie Benutzernamen, E-Mails und Passwörter aus den Benutzerdaten
        const userData = users.map(user => ({
            username: user.username,
            email: user.email,
            password: user.password
        }));
        
        // JSON-Antwort mit Benutzerdaten senden
        res.json({ users: userData });

    } catch (error) {
        console.error("Error fetching userdata:", error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.post('/api/username', async (req, res) => {
    try {
        const { username, currentPassword, newPassword } = req.body;
        const collection = db.collection('users');
        
        // Überprüfen, ob der Benutzer vorhanden ist
        const user = await collection.findOne({ username });

        if (!user) {
            console.log(`User "${username}" not found`);
            return res.status(404).json({ error: 'User not found' });
        }

        // Überprüfen, ob das aktuelle Passwort korrekt ist
        if (user.password !== currentPassword) {
            console.log(`Incorrect current password provided for user "${username}"`);
            return res.status(400).json({ error: 'Current password is incorrect' });
        }

        // Passwort aktualisieren
        await collection.updateOne({ username }, { $set: { password: newPassword } });

        console.log(`Password changed successfully for user "${username}"`);
        return res.status(200).json({ message: 'Password changed successfully' });
    } catch (error) {
        console.error("Error processing request:", error);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.get('/home', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html')); // Laden Sie die index.html-Datei
});

app.get('/settings', (req, res) => {
    res.sendFile(__dirname + '/settings.html');
});

app.get('/profile', (req, res) => {
    res.sendFile(__dirname + '/profile.html');
});

app.get('/login', (req, res) => {
    res.sendFile(__dirname + '/login.html');
});

app.get('/signup', (req, res) => {
    res.sendFile(__dirname + '/signup.html');
});

app.get('/intro', (req, res) => {
    res.sendFile(__dirname + '/intro.html');
});

app.get('/admin', (req, res) => {
    res.sendFile(__dirname + '/admin.html');
});

app.listen(PORT, () => {
    run().catch(error => console.error('Fehler beim Starten des Servers:', error));
    console.log('Link: http://localhost:' + PORT + '/home');
});