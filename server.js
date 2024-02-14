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

// Middleware
app.use(bodyParser.json());
app.use(cors());

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

// Funktion zum Prüfen des Cooldowns für eine bestimmte Aktion
function checkCooldown(action, cooldownTime) {
    const lastActionTime = actionCooldowns[action];
    if (!lastActionTime) {
        return false; // Kein Cooldown vorhanden
    }

    const elapsedTime = Date.now() - lastActionTime;
    return elapsedTime < cooldownTime; // True, wenn das Cooldown noch nicht abgelaufen ist
}

// Middleware zum Überprüfen des Cooldowns vor einer Aktion
function cooldownMiddleware(action, cooldownTime) {
    return (req, res, next) => {
        if (checkCooldown(action, cooldownTime)) {
            return res.status(429).json({ success: false, message: 'Chill... too fast' });
        } else {
            actionCooldowns[action] = Date.now(); // Aktualisieren Sie den Zeitpunkt der letzten Aktion
            next(); // Fahren Sie mit der Ausführung der Aktion fort
        }
    };
}

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
    const { content, username, codesnippet } = req.body; // Inhalte, Benutzername und Codeschnipsel aus der Anfrage extrahieren
    const date = new Date(); // Aktuelles Datum erstellen

    try {
        const result = await db.collection('posts').insertOne({
            content,
            username,
            date,
            codesnippet
        });

        const newPost = {
            _id: result.insertedId,
            content,
            username,
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
            // Fehlgeschlagener Login
            console.log(`Failed login attempt for user: ${identifier} at ${new Date().toISOString()}`);
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
        // Überprüfen, ob der Benutzer bereits existiert
        const existingUser = await usersCollection.findOne({ email });
        if (existingUser) {
            return res.status(400).send('User already exists');
        }

        // Überprüfen, ob der Benutzer bereits existiert
        const existingUsername = await usersCollection.findOne({ username });
        if (existingUser) {
            return res.status(400).send('username already taken');
        }        

        // Neuen Benutzer erstellen
        await usersCollection.insertOne({ email, password, username });

        res.status(201).send('User created successfully');
    } catch (error) {
        console.error('Error during sign up:', error);
        res.status(500).send('Internal Server Error');
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

app.listen(PORT, () => {
    run().catch(error => console.error('Error starting server:', error));
    console.log('Server is running on port', PORT);
});