const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const cors = require('cors');
const { MongoClient, ServerApiVersion } = require('mongodb');
const bcrypt = require('bcrypt');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(bodyParser.json());
app.use(cors());

// MongoDB Verbindung
const uri = 'mongodb+srv://prodbyeagle:mZPLLs37Oi6x3NbR@snippetdb.wqznr37.mongodb.net/?retryWrites=true&w=majority';
const dbName = 'snippetDB';
let db;

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
        console.log("Connected to MongoDB successfully!");
    } catch (error) {
        console.error("Error connecting to MongoDB:", error);
    }
}

// Route zum Abrufen aller Posts
app.get('/api/posts', async (req, res) => {
    try {
        // Hier holen Sie alle Posts aus der Datenbank
        const posts = await db.collection('posts').find().toArray();
        res.status(200).json(posts); // Senden Sie die Posts als JSON zurück
    } catch (error) {
        console.error("Fehler beim Abrufen der Beiträge:", error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Route zum Erstellen eines neuen Posts
app.post('/api/posts', async (req, res) => {
    const { content } = req.body;
    try {
        const result = await db.collection('posts').insertOne({ content });
        const newPost = { _id: result.insertedId, content };
        res.status(201).json(newPost);
    } catch (error) {
        console.error("Error creating new post:", error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Route für die Anmeldung
app.post('/signin', async (req, res) => {
    const { email, password } = req.body;
    try {
        // Hier überprüfen Sie die Anmeldeinformationen und authentifizieren den Benutzer
        const user = await db.collection('users').findOne({ email });

        if (!user) {
            return res.status(401).json({ success: false, message: 'Benutzer nicht gefunden' });
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (isPasswordValid) {
            return res.status(200).json({ success: true, message: 'Anmeldung erfolgreich' });
        } else {
            return res.status(401).json({ success: false, message: 'Falsches Passwort' });
        }
    } catch (error) {
        console.error("Error signing in:", error);
        res.status(500).json({ success: false, error: 'Internal Server Error' });
    }
});

// Route für die Startseite
app.get('/home', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html')); // Laden Sie die index.html-Datei
});

app.get('/settings', (req, res) => {
    res.sendFile(__dirname + '/settings.html');
});

app.get('/profile', (req, res) => {
    res.sendFile(__dirname + '/profile.html');
});

app.get('/signin', (req, res) => {
    res.sendFile(__dirname + '/signin.html');
});

app.listen(PORT, () => {
    run().catch(error => console.error('Error starting server:', error));
    console.log('Server is running on port', PORT);
});