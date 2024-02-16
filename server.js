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
console.log('Session secret:', sessionSecret);

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
        usersCollection = db.collection('users'); // Benutzer unter der Sammlung "Users" speichern
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

async function FetchUserByUsername(username) {
    try {
        // Suchen des Benutzernamens in der Datenbank
        const existingUser = await usersCollection.findOne({ username });

        if (existingUser) {
            // Wenn der Benutzer gefunden wurde, geben Sie den Benutzer zurück
            return existingUser;
        } else {
            // Wenn der Benutzer nicht gefunden wurde, geben Sie null zurück
            return null;
        }
    } catch (error) {
        console.error('Error fetching user:', error);
        throw new Error('An error occurred while fetching the user');
    }
}

console.log('usersCollection:', usersCollection);

//TODO: Route für das Hochladen eines Profilbilds mit Cooldown

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

        console.log('updatedUser:', updatedUser);

        res.status(200).json({ message: 'Benutzervorlieben erfolgreich aktualisiert', user: updatedUser.value });
    } catch (err) {
        console.error('Fehler beim Aktualisieren der Benutzervorlieben:', err);
        res.status(500).json({ message: 'Interner Serverfehler' });
    }
});

app.post('/admin', async (req, res) => {
    try {
        // Extrahiere den Benutzernamen aus dem Anfrage-Body
        const { username } = req.body;
        
        // Benutzer anhand des Benutzernamens aus der Datenbank abrufen
        const existingUser = await FetchUserByUsername(username);
        
        if (!existingUser) {
            // Benutzer nicht gefunden
            return res.status(400).send('Benutzer nicht gefunden');
        }  

        // Überprüfen, ob der Benutzer ein Administrator ist
        if (existingUser.admin === true) {
            // Wenn der Benutzer ein Administrator ist, sende "true"
            return res.status(200).json({ admin: true });
        } else {
            // Wenn der Benutzer kein Administrator ist, sende "false"
            return res.status(200).json({ admin: false });
        }
    } catch (err) {
        console.error('Fehler beim Überprüfen des Benutzers:', err);
        res.status(500).send('Interner Serverfehler');
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
    console.log('Der Server läuft auf Port', PORT);
    console.log('Link: http://localhost:' + PORT + '/home');
});