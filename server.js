//server.js
// noinspection SpellCheckingInspection

const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const cors = require('cors');
const { MongoClient, ServerApiVersion } = require('mongodb');
const multer = require('multer');
const bcrypt = require('bcrypt');
const session = require('express-session');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 3000;

const sessionSecret = require('crypto').randomBytes(64).toString('hex');

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
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
        hour: '2-digit', 
        minute: '2-digit',
        second: '2-digit',
        day: '2-digit', 
        month: '2-digit', 
        year: 'numeric' 
    };
    return new Date(date).toLocaleString('de-DE', options);
}

app.get('/u/:username', async (req, res) => {
    const username = req.params.username; // Den Benutzernamen aus der URL-Parameter erhalten

    try {
        // Annahme: 'users' ist deine MongoDB-Sammlung, die Benutzerprofile enthält
        const user = await usersCollection.findOne({ username });

        if (!user) {
            // Wenn der Benutzer nicht gefunden wurde, sende eine entsprechende Fehlermeldung oder zeige eine Fehlerseite an
            return res.status(404).send('Benutzer nicht gefunden');
        }

        // Sende die HTML-Seite mit den Benutzerdaten
        res.sendFile(path.join(__dirname, 'public', 'profile.html'));
    } catch (error) {
        console.error('Fehler beim Laden des Benutzerprofils:', error);
        // Bei Fehlern sende eine entsprechende Fehlermeldung oder zeige eine Fehlerseite an
        res.status(500).send('Interner Serverfehler');
    }
});

app.get('/api/profile/:username', async (req, res) => {
    let encodedUsername = req.params.username; // Benutzername mit Codierung (z.B. "Noah%20Hecht")
    let username = decodeURIComponent(encodedUsername); // Benutzername ohne Codierung (z.B. "Noah Hecht")

    try {
        const user = await usersCollection.findOne({ username });
        if (!user) {
            return res.status(404).json({ error: 'Benutzer nicht gefunden' });
        }
        res.json(user); // Sende die Benutzerdaten als JSON zurück
    } catch (error) {
        console.error('Fehler beim Abrufen der Benutzerdaten:', error);
        res.status(500).json({ error: 'Interner Serverfehler' });
    }
});

app.put('/api/profile/:username/ban', async (req, res) => {
    let encodedUsername = req.params.username;
    let username = decodeURIComponent(encodedUsername);
    try {
        const user = await usersCollection.findOneAndUpdate(
            { username },
            { $set: { banned: true } }, // Setze den Benutzer auf "gebannen"
            { returnOriginal: false }
        );
        if (!user) {
            return res.status(404).json({ error: 'Benutzer nicht gefunden' });
        }
        res.status(200).json({ message: `Benutzer ${username} erfolgreich gebannt` });
    } catch (error) {
        console.error('Fehler beim Bannen des Benutzers:', error);
        res.status(500).json({ error: 'Interner Serverfehler' });
    }
});

app.put('/api/profile/:username/unban', async (req, res) => {
    let encodedUsername = req.params.username;
    let username = decodeURIComponent(encodedUsername);
    try {
        const user = await usersCollection.findOneAndUpdate(
            { username },
            { $set: { banned: false } }, // Setze den Benutzer auf "nicht gebannen"
            { returnOriginal: false }
        );
        if (!user) {
            return res.status(404).json({ error: 'Benutzer nicht gefunden' });
        }
        res.status(200).json({ message: `Ban für Benutzer ${username} erfolgreich aufgehoben` });
    } catch (error) {
        console.error('Fehler beim Aufheben des Bans des Benutzers:', error);
        res.status(500).json({ error: 'Interner Serverfehler' });
    }
});

// GET '/api/username/posts'
app.get('/api/:username/posts', async (req, res) => {
    const { username } = req.params;

    try {
        const posts = await db.collection('posts').find({ username }).toArray();

        // Transformieren Sie das Datum jedes Posts und fügen Sie das Bildfeld hinzu
        const postsWithFormattedData = await Promise.all(posts.map(async post => {
            const user = await db.collection('users').findOne({ username: post.username });
            const imageUrl = user ? user.pb : null; // Profilbild-URL aus Benutzerdaten abrufen
            return {
                ...post,
                date: formatDateForDisplay(post.date),
                imageUrl // Profilbild-URL in den Post einfügen
            };
        }));

        res.status(200).json(postsWithFormattedData);
    } catch (error) {
        console.error("Fehler beim Abrufen der Beiträge:", error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// DELETE '/api/:username/posts'
app.delete('/api/:username/posts', async (req, res) => {
    const { username } = req.params;

    try {
        await db.collection('posts').deleteMany({ username });

        res.status(200).json({ message: 'All user posts deleted successfully' });
    } catch (error) {
        console.error("Fehler beim Löschen der Beiträge:", error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// GET '/api/posts'
app.get('/api/posts', async (req, res) => {
    try {
        const posts = await db.collection('posts').find().toArray();
        
        // Transformieren Sie das Datum jedes Posts und fügen Sie das Bildfeld hinzu
        const postsWithFormattedData = await Promise.all(posts.map(async post => {
            const user = await db.collection('users').findOne({ username: post.username });
            const imageUrl = user ? user.pb : null; // Profilbild-URL aus Benutzerdaten abrufen
            return {
                ...post,
                date: formatDateForDisplay(post.date),
                imageUrl // Profilbild-URL in den Post einfügen
            };
        }));
        
        res.status(200).json(postsWithFormattedData);
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
            codesnippet,
            likes: 0,
            replies: []
        });

        const newPost = {
            _id: result.insertedId,
            content,
            username: identifier,
            date: formatDateForDisplay(date), // Datum im gewünschten Format zurückgeben
            codesnippet,
            likes: 0,
            replies: 0
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
            $or: [ { username: identifier }]
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
    const { email, password, username, pb } = req.body;

    try {
        const existingUserByUsername = await usersCollection.findOne({ username });

        if (existingUserByUsername) {
            return res.status(400).send('Username already taken');
        }        

        // Neuen Benutzer erstellen
        await usersCollection.insertOne({ email, password, username, bio: "Hello, Im New Here!", follower: 0, followers: [], admin: false, googlelogin: false, banned: false, pb });
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
            return res.status(200).json({ message: false }); // JSON-Objekt zurückgeben
        }
    } catch (err) {
        console.error('Fehler beim Überprüfen des Benutzers:', err);
        res.status(500).json({ message: 'Interner Serverfehler' });
    }
});

// API-Route zum Abrufen der Benutzernamen
app.get('/api/username', async (req, res) => {
    try {
        const collection = db.collection('users');
        const users = await collection.find().toArray();
        const userData = users.map(user => ({
            username: user.username,
            email: user.email,
            password: user.password,
            pb: user.pb,
            bio: user.bio,
            admin: user.admin,
            banned: user.banned
        }));
        
        // JSON-Antwort mit Benutzerdaten senden
        res.json({ users: userData });

    } catch (error) {
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// API-Route zum Aktualisieren der Benutzer-Biografie
app.post('/api/update/bio', async (req, res) => {
    try {
        const { username, newBio } = req.body;
        const collection = db.collection('users');

        // Überprüfen, ob der Benutzer vorhanden ist
        const user = await collection.findOne({ username });

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Biografie des Benutzers aktualisieren
        await collection.updateOne({ username }, { $set: { bio: newBio } });
        return res.status(200).json({ message: 'Bio updated successfully' });
    } catch (error) {
        return res.status(500).json({ error: 'Internal Server Error' });
    }
});

// API-Route zum Aktualisieren des ProfilBilds
app.post('/api/update/pb', async (req, res) => {
    try {
        const { username, newPB } = req.body;
        const collection = db.collection('users');
        const user = await collection.findOne({ username });

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Biografie des Benutzers aktualisieren
        await collection.updateOne({ username }, { $set: { pb: newPB } });

        return res.status(200).json({ message: 'PB updated successfully' });
    } catch (error) {
        return res.status(500).json({ error: 'Internal Server Error' });
    }
});

// API-Route zum Aktualisieren der Follower
app.post('/api/update/follower', async (req, res) => {
    try {
        const { followerUsername, followedUsername } = req.body;

        // Überprüfen, ob der Follower sich selbst folgt
        if (followerUsername === followedUsername) {
            return res.status(400).json({ error: 'Cannot follow yourself' });
        }

        const collection = db.collection('users');

        // Benutzer mit dem angegebenen followedUsername finden
        const user = await collection.findOne({ username: followedUsername });

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Überprüfen, ob der Zielbenutzer bereits gefolgt wird
        const isAlreadyFollowing = user.followers.includes(followerUsername);

        if (isAlreadyFollowing) {
            // Entferne den Follower
            await collection.updateOne({ username: followedUsername }, { $pull: { followers: followerUsername }, $inc: { follower: -1 } });
            return res.status(201).json({ message: 'User unfollowed successfully' });
        } else {
            // Füge den Follower hinzu
            await collection.updateOne({ username: followedUsername }, { $push: { followers: followerUsername }, $inc: { follower: 1 } });
            return res.status(200).json({ message: 'User followed successfully' });
        }
    } catch (error) {
        console.error("Fehler beim Ändern des Follow-Status:", error);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.post('/api/profile/change/passwort', async (req, res) => {
    try {
        const { username, currentPassword, newPassword } = req.body;
        const collection = db.collection('users');
        
        // Überprüfen, ob der Benutzer vorhanden ist
        const user = await collection.findOne({ username });

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Überprüfen, ob das aktuelle Passwort korrekt ist
        if (user.password !== currentPassword) {
            return res.status(400).json({ error: 'Current password is incorrect' });
        }

        // Passwort aktualisieren
        await collection.updateOne({ username }, { $set: { password: newPassword } });

        return res.status(200).json({ message: 'Password changed successfully' });
    } catch (error) {
        console.error("Error processing request:", error);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.post('/api/profile/change/email', async (req, res) => {
    try {
        const { username, currentEmail, newEmail } = req.body;
        const collection = db.collection('users');
        
        // Überprüfen, ob der Benutzer vorhanden ist
        const user = await collection.findOne({ username });

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Überprüfen, ob das aktuelle Passwort korrekt ist
        if (user.email !== currentEmail) {
            return res.status(400).json({ error: 'Current Email is incorrect' });
        }

        // Passwort aktualisieren
        await collection.updateOne({ username }, { $set: { email: newEmail } });

        return res.status(200).json({ message: 'Email changed successfully' });
    } catch (error) {
        console.error("Error processing request:", error);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.post('/api/profile/change/username', async (req, res) => {
    try {
        const { username, currentUsername, newUsername } = req.body;
        const collection = db.collection('users');
        
        console.log('Received request to change username...');
        console.log('Username:', username);
        console.log('Current Username:', currentUsername);
        console.log('New Username:', newUsername);

        // Überprüfen, ob der Benutzer vorhanden ist
        const user = await collection.findOne({ username });

        if (!user) {
            console.log('User not found');
            return res.status(404).json({ error: 'User not found' });
        }

        // Überprüfen, ob das aktuelle Username korrekt ist
        if (user.username !== currentUsername) {
            console.log('Current username is incorrect');
            return res.status(400).json({ error: 'Current Username is incorrect' });
        }

        // Username aktualisieren
        await collection.updateOne({ username }, { $set: { username: newUsername } });

        console.log('Username changed successfully');
        return res.status(200).json({ message: 'Username changed successfully' });
    } catch (error) {
        console.error("Error processing request:", error);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.delete('/api/profile/delete/:username', async (req, res) => {
    try {
        // Überprüfen, ob der Benutzername in der Anfrage vorhanden ist
        const username = req.params.username;
        if (!username) {
            console.error('Error deleting account: Username not provided');
            return res.status(400).send('Username not provided');
        }

        console.log(`Deleting account for username: ${username}`);

        // Den Benutzer aus der Datenbank entfernen
        const deletionResult = await usersCollection.deleteOne({ username });

        if (deletionResult.deletedCount === 0) {
            console.log(`No account found for username: ${username}`);
            return res.status(404).send('Account not found');
        }

        console.log(`Account successfully deleted for username: ${username}`);
        res.status(200).send('Account successfully deleted');
    } catch (error) {
        console.error('Error deleting account:', error);
        res.status(500).send('Internal Server Error');
    }
});

// Function to generate random password
function generateRandomPassword() {
    const length = 10; // Länge des generierten Passworts
    return crypto.randomBytes(Math.ceil(length / 2))
        .toString('hex') // Konvertieren Sie die zufälligen Bytes in hexadezimale Zeichen
        .slice(0, length); // Begrenzen Sie die Länge auf die gewünschte Anzahl von Zeichen
}

// Function to sanitize username extracted from Google profile
function sanitizeUsername(username) {
    const regex = /^[a-zA-Z0-9_]+$/;
    if (!regex.test(username)) {
        username = username.replace(/[^a-zA-Z0-9_]/g, '_');
    }
    return username;
}

const passport = require('passport');
const { randomUUID, randomBytes } = require('crypto');
const GoogleStrategy = require('passport-google-oauth20').Strategy;

passport.use(new GoogleStrategy({
    clientID: '1058877753013-d83q1elt7pf185pd8v9i1a51fp8dlg7n.apps.googleusercontent.com',
    clientSecret: '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',
    callbackURL: 'http://localhost:3000/auth/google/callback'
}, async (accessToken, refreshToken, profile, done) => {
    const collection = db.collection('users');
    
    try {
        const userEmail = (profile.emails && profile.emails.length > 0) ? profile.emails[0].value : null;
        const userPhoto = (profile.photos && profile.photos.length > 0) ? profile.photos[0].value : null;

        const existingUser = await collection.findOne({ email: userEmail });

        if (existingUser) {
            return done(null, existingUser);
        } else {
            const randomPassword = generateRandomPassword(); // Function to generate random password
            const newUser = {
                username: sanitizeUsername(profile.displayName),
                email: userEmail,
                password: randomPassword,
                follower: 0,
                pb: userPhoto,
                bio: "Hello, I'm New here!",
                admin: false,
                googlelogin: true,
                banned: false,
                follower: 0, 
                followers: [],
            };

            await collection.insertOne(newUser);
            return done(null, newUser);
        }
    } catch (error) {
        console.error('Error processing Google authentication:', error);
        return done(error, null);
    }
}));

// POST-Route für die Google-Authentifizierung
app.post('/auth/google/callback', 
    passport.authenticate('google', { failureRedirect: '/login' }),
    (req, res) => {
        res.status(200).json({ 
            username: req.user.username, 
            password: req.user.password,
        });
    }
);

app.get('/auth/google/callback',
    passport.authenticate('google', { failureRedirect: '/login' }),
    (req, res) => {

        if (req.user && req.user.username && req.user.password) {

            // Weiterleitung zur Home-Seite mit Benutzerdaten als URL-Parameter
            const user = {
                identifier: req.user.username,
                password: req.user.password
            };
            res.redirect('/login?user=' + encodeURIComponent(JSON.stringify(user)));
        } else {
            console.error('Error: User username or password not found.');
            res.redirect('/login'); // Weiterleitung zur Login-Seite oder Fehlerbehandlung entsprechend
        }
    }
);

passport.serializeUser((user, done) => {
    done(null, user);
});

passport.deserializeUser((user, done) => {
    done(null, user);
});
app.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));
app.use(passport.initialize());
app.use(passport.session());

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

app.get('/explore', (req, res) => {
    res.sendFile(__dirname + '/explore.html');
});

app.listen(PORT, () => {
    run().catch(error => console.error('Fehler beim Starten des Servers:', error));
    console.log('Link: http://localhost:' + PORT + '/home');
});