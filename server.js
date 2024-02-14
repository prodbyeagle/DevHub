const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const cors = require('cors');
const { MongoClient, ServerApiVersion } = require('mongodb');
const bcrypt = require('bcrypt');
const multer = require('multer');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(bodyParser.json());
app.use(cors());

// MongoDB Verbindung
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

// Konfiguration für Multer
const upload = multer({ dest: 'uploads/' }); // Speicherort für hochgeladene Dateien

// Speichern der Zeitpunkte der letzten Aktionen
const actionCooldowns = {};

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

// Beispiel: Route für das Hochladen eines Profilbilds mit Cooldown
app.post('/api/profile/upload', cooldownMiddleware('profileUpload', 60000), upload.single('profileImage'), async (req, res) => {
    // Verarbeiten Sie das hochgeladene Bild und speichern Sie es an einem sicheren Speicherort
    const filename = req.file.filename; // Dateiname des hochgeladenen Bildes
    console.log('Profile picture uploaded successfully:', filename);
    
    // Aktualisieren Sie das Profilbild für den aktuellen Benutzer in der Datenbank (wenn Benutzername gesendet wurde)
    const { username } = req.body;
    if (username) {
        try {
            await usersCollection.updateOne({ username }, { $set: { profileImage: filename } });
        } catch (error) {
            console.error("Fehler beim Aktualisieren des Profilbilds:", error);
            return res.status(500).json({ success: false, error: 'Interner Serverfehler' });
        }
    }
    
    // Hier können Sie weitere Verarbeitungsschritte durchführen, z.B. Speichern des Dateinamens in der Datenbank
    res.status(200).json({ success: true, message: 'Profile image uploaded successfully', filename: filename });
});

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

// Route zum Erstellen eines neuen Posts
app.post('/api/posts', async (req, res) => {
    const { content, username } = req.body; // Benutzername aus Anfrage extrahieren
    const date = new Date(); // Aktuelles Datum erstellen

    try {
        const result = await db.collection('posts').insertOne({ content, username, date }); // Benutzername und Datum hinzufügen
        const newPost = { 
            _id: result.insertedId, 
            content, 
            username, 
            date: formatDateForDisplay(date) // Datum im gewünschten Format zurückgeben
        };
        res.status(201).json(newPost);
    } catch (error) {
        console.error("Error creating new post:", error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Route zum Speichern der Benutzerdaten
app.post('/api/users', async (req, res) => {
    const { username, password, profileImage } = req.body;

    try {
        // Überprüfen, ob der Benutzer bereits existiert
        const existingUser = await usersCollection.findOne({ username });
        if (existingUser) {
            return res.status(400).json({ success: false, message: 'Benutzername bereits vergeben' });
        }

        // Passwort hashen
        const hashedPassword = await bcrypt.hash(password, 10); // 10 Saltrunden

        // Benutzerdaten in die Datenbank einfügen
        await usersCollection.insertOne({ username, password: hashedPassword, profileImage });

        return res.status(201).json({ success: true, message: 'Benutzer erfolgreich erstellt' });
    } catch (error) {
        console.error("Fehler beim Erstellen eines Benutzers:", error);
        res.status(500).json({ success: false, error: 'Interner Serverfehler' });
    }
});

// Route für den Login
app.post('/login', async (req, res) => {
    const { identifier, password } = req.body; // "identifier" kann der Benutzername oder die E-Mail sein
    try {
        console.log('Login-Versuch:', identifier); // Ausgabe des Benutzernamens oder der E-Mail
        // Suchen Sie nach dem Benutzer in der Datenbank
        const user = await db.collection('users').findOne({
            $or: [{ username: identifier }, { email: identifier }]
        });

        console.log('Gefundener Benutzer:', user); // Ausgabe des gefundenen Benutzers

        if (!user) {
            console.log('Benutzer nicht gefunden:', identifier); // Ausgabe, wenn der Benutzer nicht gefunden wurde
            return res.status(401).json({ success: false, message: 'Benutzer nicht gefunden' });
        }

        // Vergleichen Sie die Passwörter
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            console.log('Falsches Passwort für Benutzer:', identifier); // Ausgabe, wenn das Passwort falsch ist
            return res.status(401).json({ success: false, message: 'Falsches Passwort' });
        }

        // Wenn Benutzer gefunden und Passwort korrekt ist, senden Sie Erfolgsmeldung zurück
        console.log('Anmeldung erfolgreich für Benutzer:', identifier); // Ausgabe, wenn die Anmeldung erfolgreich ist
        return res.status(200).json({ success: true, message: 'Anmeldung erfolgreich' });
    } catch (error) {
        console.error("Fehler bei der Anmeldung:", error);
        res.status(500).json({ success: false, error: 'Interner Serverfehler' });
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