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
require('dotenv').config();
const { ObjectId } = require('mongodb');
const objectId = new ObjectId();
const socketIo = require('socket.io');
const http = require('http');

const app = express();
const PORT = process.env.PORT || 3000;
const server = http.createServer(app);
const io = socketIo(server);

const sessionSecret = require('crypto').randomBytes(64).toString('hex');

// Middleware, um statische Dateien aus dem "public"-Verzeichnis zu servieren
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'html')));
app.use('/js', express.static(path.join(__dirname, 'js')));
app.use('/css', express.static(path.join(__dirname, 'css')));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(bodyParser.json());
app.use(cors());
app.use(session({
    secret: sessionSecret,
    resave: false,
    saveUninitialized: true
}));

const uri = process.env.MONGODB_URI;
const dbName = process.env.DB_NAME;
let db;
let usersCollection;
let postsCollection;

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
        postsCollection = db.collection('posts');
        blogCollection = db.collection('blogs');
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

app.post('/profile/:username/pin-post/:postId', (req, res) => {
    const { username, postId } = req.params;

    postsCollection.updateOne(
        { _id: new ObjectId(postId) }, // Konvertiere postId in ObjectId
        { $set: { pinned: true } },
        (err, result) => {
            if (err) {
                console.error('Failed to pin post:', err);
                res.status(500).send('Failed to pin post');
                return;
            }
            res.status(200).send('Post pinned successfully.');
        }
    );
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

app.put('/api/profile/:username/true', async (req, res) => {
    let encodedUsername = req.params.username;
    let username = decodeURIComponent(encodedUsername);
    try {
        const user = await usersCollection.findOneAndUpdate(
            { username },
            { $set: { admin: true } }, // Setze den Benutzer auf "admin"
            { returnOriginal: false }
        );
        if (!user) {
            return res.status(404).json({ error: 'Benutzer nicht gefunden' });
        }
        res.status(200).json({ message: `Benutzer ${username} erfolgreich zum Admin ernannt` });
    } catch (error) {
        console.error('Fehler beim Hinzufügen von Admin des Benutzers:', error);
        res.status(500).json({ error: 'Interner Serverfehler' });
    }
});

app.put('/api/profile/:username/false', async (req, res) => {
    let encodedUsername = req.params.username;
    let username = decodeURIComponent(encodedUsername);
    try {
        const user = await usersCollection.findOneAndUpdate(
            { username },
            { $set: { admin: false } }, // Setze den Benutzer auf "admin"
            { returnOriginal: false }
        );
        if (!user) {
            return res.status(404).json({ error: 'Benutzer nicht gefunden' });
        }
        res.status(200).json({ message: `Benutzer ${username} erfolgreich Admin entfernt` });
    } catch (error) {
        console.error('Fehler beim Entfernen von Admin des Benutzers:', error);
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

app.post('/profile/:username/pin-post/:postId', (req, res) => {
    const { username, postId } = req.params;

    const postsCollection = db.collection('posts');

    postsCollection.updateOne(
        { _id: ObjectId(postId) }, // Konvertiere postId in ObjectId
        { $set: { pinned: true } },
        (err, result) => {
            if (err) {
                console.error('Failed to pin post:', err);
                res.status(500).send('Failed to pin post');
                return;
            }
            res.status(200).send('Post pinned successfully.');
        }
    );
});

app.get('/profile/:postId', (req, res) => {
    const { postId } = req.params;

    postsCollection.findOne({ _id: postId }, (err, post) => {
        if (err) {
            console.error('Failed to fetch post:', err);
            res.status(500).send('Failed to fetch post');
            return;
        }
        if (!post) {
            res.status(404).send('Post not found');
            return;
        }
        res.json(post);
    });
});

app.put('/edit-post/:postId', (req, res) => {
    const { postId } = req.params;
    const { content, codesnippet, date } = req.body;

    const postsCollection = db.collection('posts');

    console.log('Received PUT request to edit post:', postId);

    postsCollection.updateOne(
        { _id: new ObjectId(postId) },
        { $set: { content: content, codesnippet: codesnippet, date: date  } }, // Aktualisierten Inhalt des Posts
        (err, result) => {
            if (err) {
                console.error('Failed to edit post:', err);
                res.status(500).send('Failed to edit post');
                return;
            }
            res.status(200).send('Post edited successfully.');
        }
    );    
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
    const page = parseInt(req.query.page) || 1; // Aktuelle Seite, standardmäßig 1
    const limit = parseInt(req.query.limit) || 10; // Anzahl der Posts pro Seite, standardmäßig 10

    try {
        const skip = (page - 1) * limit; // Anzahl der zu überspringenden Posts

        const postsCount = await db.collection('posts').countDocuments();
        const totalPages = Math.ceil(postsCount / limit);

        const posts = await db.collection('posts')
            .find()
            .skip(skip)
            .limit(limit)
            .toArray();

        // Transformieren Sie das Datum jedes Posts und fügen Sie das Bildfeld hinzu
        const postsWithFormattedData = await Promise.all(posts.map(async post => {
            const user = await db.collection('users').findOne({ username: post.username });
            const imageUrl = user ? user.pb : null; // Profilbild-URL aus Benutzerdaten abrufen
            return {
                ...post,
                date: formatDateForDisplay(post.date),
                imageUrl,
            };
        }));
        
        res.status(200).json({
            totalPages,
            currentPage: page,
            posts: postsWithFormattedData
        });
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
            replies: [],
            pinned: false,
        });

        const newPost = {
            _id: result.insertedId,
            content,
            username: identifier,
            date: formatDateForDisplay(date), // Datum im gewünschten Format zurückgeben
            codesnippet,
            likes: 0,
            replies: 0,
            pinned: false,
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
        await usersCollection.insertOne({ 
            email,
            password,
            username,
            bio: "Hello, Im New Here!",
            follower: 0,
            followers: [],
            badges: [],
            admin: false,
            googlelogin: false,
            githubLogin: false,
            banned: false,
            pb,
        });

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

// Route zum Löschen der Posts-Sammlung
app.delete('/admin/delete-posts', async (req, res) => {
    try {
        const collection = db.collection('posts');
        await collection.deleteMany({});
        res.status(200).json({ message: 'Posts collection deleted successfully' });
    } catch (error) {
        console.error('Error deleting posts collection:', error);
        res.status(500).json({ message: 'Failed to delete posts collection' });
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
            banned: user.banned,
            badges: user.badges,
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


app.delete('/api/posts/delete/:postId', async (req, res) => {
    try {
        // Überprüfen, ob die postId in der Anfrage vorhanden ist
        const postId = req.params.postId;
        if (!postId) {
            console.error('Error deleting post: Post ID not provided');
            return res.status(400).send('Post ID not provided');
        }

        console.log(`Deleting post with ID: ${postId}`);

        // Den Post aus der Datenbank entfernen
        const deletionResult = await postsCollection.deleteOne({ _id: new ObjectId(postId) });

        if (deletionResult.deletedCount === 0) {
            console.log(`No post found with ID: ${postId}`);
            return res.status(404).send('Post not found');
        }

        console.log(`Post successfully deleted with ID: ${postId}`);
        res.status(200).send('Post successfully deleted');
    } catch (error) {
        console.error('Error deleting post:', error);
        res.status(500).send('Internal Server Error');
    }
});

// Route zum Speichern eines Likes für einen Beitrag
app.post('/posts/:postId/like', async (req, res) => {
    try {
        const postId = req.params.postId;
        const postsCollection = db.collection('posts');

        const result = await postsCollection.updateOne(
            { _id: new ObjectId(postId) },
            { $inc: { likes: 1 } }
        );

        if (result.matchedCount === 0) {
            return res.status(404).json({ message: 'Beitrag nicht gefunden' });
        }

        res.json({ message: 'Like gespeichert' });
    } catch (error) {
        console.error('Fehler beim Speichern des Likes:', error);
        res.status(500).json({ message: 'Interner Serverfehler' });
    }
});

// Server
app.get('/posts/:postId', async (req, res) => {
    try {
        const postId = req.params.postId;
        const postsCollection = db.collection('posts');

        const post = await postsCollection.findOne({ _id: new ObjectId(postId) });

        if (!post) {
            return res.status(404).json({ message: 'Beitrag nicht gefunden' });
        }

        res.json({ likes: post.likes });
    } catch (error) {
        console.error('Fehler beim Abrufen des Beitrags:', error);
        res.status(500).json({ message: 'Interner Serverfehler' });
    }
});

// Server
app.post('/posts/:postId/unlike', async (req, res) => {
    try {
        const postId = req.params.postId;
        const postsCollection = db.collection('posts');

        const result = await postsCollection.updateOne(
            { _id: new ObjectId(postId) },
            { $inc: { likes: -1 } } // Verringere die Anzahl der Likes um 1
        );

        if (result.matchedCount === 0) {
            return res.status(404).json({ message: 'Beitrag nicht gefunden' });
        }

        res.json({ message: 'Like entfernt' });
    } catch (error) {
        console.error('Fehler beim Entfernen des Likes:', error);
        res.status(500).json({ message: 'Interner Serverfehler' });
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
const GoogleStrategy = require('passport-google-oauth20').Strategy;

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_CALLBACK_URL,
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
                githubLogin: false,
                banned: false,
                follower: 0, 
                followers: [],
                badges: [],
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

//GITHUB

//TODO Wenn der Username gleich ist wie der Username von GitHub soll der Account genommen werden (wenn der Username schon vergeben ist zu einem Anderen User soll einfach eine Random Zahl Dahinter gepackt werden z.b prodbyeagle435)

const { v4: uuidv4 } = require('uuid');
const GitHubStrategy = require('passport-github2').Strategy;

passport.use(new GitHubStrategy({
    clientID: process.env.GITHUB_CLIENT_ID,
    clientSecret: process.env.GITHUB_CLIENT_SECRET,
    callbackURL: process.env.GITHUB_CALLBACK_URL,
    scope: [ 'user:email' ],
}, async (accessToken, refreshToken, profile, done) => {
    console.log(profile);
    const collection = db.collection('users');
    
    try {
        const userEmail = profile.emails ? profile.emails[0].value : null;
        const userPhoto = profile.photos ? profile.photos[0].value : null;

        const existingUser = await collection.findOne({ email: userEmail });

        if (existingUser) {
            return done(null, existingUser);
        } else {
            const randomPassword = uuidv4(); // Generate a random password
            const newUser = {
                username: profile.username || profile.displayName,
                email: userEmail,
                password: randomPassword,
                pb: userPhoto,
                bio: "Hello, I'm New here!",
                admin: false,
                googlelogin: false,
                githubLogin: true,
                banned: false,
                followers: [],
                badges: [],
            };

            await collection.insertOne(newUser);
            return done(null, newUser);
        }
    } catch (error) {
        console.error('Error processing GitHub authentication:', error);
        return done(error, null);
    }
}));

// POST route for GitHub authentication
app.post('/auth/github/callback', 
    passport.authenticate('github', { failureRedirect: '/login' }),
    (req, res) => {
        res.status(200).json({ 
            username: req.user.username, 
            password: req.user.password,
        });
    }
);

app.get('/auth/github/callback',
    passport.authenticate('github', { failureRedirect: '/login' }),
    (req, res) => {

        if (req.user && req.user.username && req.user.password) {

            // Redirect to the home page with user data as URL parameter
            const user = {
                identifier: req.user.username,
                password: req.user.password
            };
            res.redirect('/login?user=' + encodeURIComponent(JSON.stringify(user)));
        } else {
            console.error('Error: User username or password not found.');
            res.redirect('/login'); // Redirect to login page or handle error accordingly
        }
    }
);

passport.serializeUser((user, done) => {
    done(null, user);
});

passport.deserializeUser((user, done) => {
    done(null, user);
});

app.get('/auth/github', passport.authenticate('github'));
app.use(passport.initialize());
app.use(passport.session());

//ERROR

// Fehlerliste mit eindeutigen IDs
let errorList = [];
let errorIdCounter = 1;

// API-Endpunkt zum Empfangen von Fehlermeldungen
app.post('/api/admin/error', (req, res) => {
    try {
        const { message } = req.body;
        
        if (!message) {
            throw new Error('Message is required');
        }

        // Prüfen, ob ein Fehler mit dem gleichen Text bereits vorhanden ist
        const existingError = errorList.find(error => error.message === message);

        if (existingError) {
            existingError.count++; // Erhöhe den Zähler des vorhandenen Fehlers
            console.log('Error message stacked:', message);
        } else {
            // Generiere eine eindeutige ID für den Fehler
            const errorId = generateErrorId();

            // Füge den neuen Fehler zur Liste hinzu
            errorList.push({ id: errorId, message, count: 1, timestamp: new Date() });
            console.log('New error message received:', message);
        }

        res.status(201).json({ success: true });
    } catch (error) {
        console.error('Error receiving error message:', error.message);
        res.status(400).json({ success: false, error: error.message });
    }
});

// Funktion zur Generierung einer eindeutigen ID
function generateErrorId() {
    return errorIdCounter++;
}

// API-Endpunkt zum Löschen eines einzelnen Fehlers basierend auf der Fehler-ID
app.delete('/api/admin/errors/:errorId', (req, res) => {
    try {
        const errorId = req.params.errorId;
        
        // Überprüfe, ob die Fehler-ID gültig ist
        if (!errorId || isNaN(errorId)) {
            throw new Error('Invalid Error ID');
        }
        
        // Finde den Index des Fehlers in der Fehlerliste
        const index = errorList.findIndex(error => error.id == errorId);

        // Wenn der Fehler gefunden wurde, entferne ihn aus der Liste
        if (index !== -1) {
            errorList.splice(index, 1);
            res.status(200).json({ success: true });
        } else {
            // Wenn der Fehler nicht gefunden wurde, sende einen Fehler zurück
            res.status(404).json({ success: false, error: 'Error not found' });
        }
    } catch (error) {
        console.error('Error deleting error:', error.message);
        res.status(400).json({ success: false, error: error.message });
    }
});

// API-Endpunkt zum Abrufen der Fehlerliste
app.get('/api/admin/errors', (req, res) => {
    try {
        res.json(errorList);
    } catch (error) {
        console.error('Error retrieving error log:', error.message);
        res.status(500).json({ success: false, error: 'Internal Server Error' });
    }
});

// Beispiel: Route zum Abrufen aller Badges
app.get('/api/admin/badges', async (req, res) => {
    try {
        const badgesCollection = db.collection('badges');
        const badges = await badgesCollection.find({}).toArray();
        res.json(badges);
    } catch (error) {
        console.error('Fehler beim Abrufen der Badges:', error);
        res.status(500).json({ error: 'Fehler beim Abrufen der Badges' });
    }
});

// Route zum Abrufen der Badges für einen bestimmten Benutzer
app.get('/api/:username/badges', async (req, res) => {
    const username = req.params.username;

    try {
        // Überprüfen, ob der Benutzer existiert
        const user = await db.collection('users').findOne({ username: username });
        if (!user) {
            return res.status(404).json({ error: 'Benutzer nicht gefunden' });
        }

        // Badges für den Benutzer abrufen
        const userBadges = user.badges;
        res.json({ badges: userBadges });
    } catch (error) {
        console.error('Fehler beim Abrufen der Badges:', error);
        res.status(500).json({ error: 'Interner Serverfehler' });
    }
});

// API-Route zum Hinzufügen eines neuen Badges
app.post('/api/admin/badges', async (req, res) => {
    try {
        const { name, image, description, active } = req.body;

        // Validierung der Eingabedaten
        if (!name || !image || !description) {
            return res.status(400).json({ error: 'Alle Felder sind erforderlich' });
        }

        const badgesCollection = db.collection('badges');
        await badgesCollection.insertOne({ name, image, description, active });

        res.json({ message: 'Badge erfolgreich hinzugefügt', /* insertedId: result.insertedId */ });
    } catch (error) {
        console.error('Fehler beim Hinzufügen des Badges:', error);
        res.status(500).json({ error: 'Fehler beim Hinzufügen des Badges' });
    }
});

app.post('/api/admin/assign-badge', async (req, res) => {
    const { badgeName, badgeImage, badgeDescription, username } = req.body;
    try {
        // Überprüfe, ob der Benutzer in der Datenbank existiert
        const userExists = await db.collection('users').findOne({ username: username });
        if (!userExists) {
            throw new Error('Benutzer nicht gefunden');
        }

        // Wenn der Benutzer existiert, aktualisiere seine Badges mit allen Informationen
        const result = await db.collection('users').findOneAndUpdate(
            { username: username },
            { 
                $push: { 
                    badges: { 
                        name: badgeName,
                        image: badgeImage,
                        description: badgeDescription
                    } 
                } 
            },
            { returnOriginal: false }
        );

        res.json(result.value); // Antwort kann je nach Anwendungsfall variieren
    } catch (error) {
        console.error('Fehler beim Zuweisen des Badges zum Benutzer:', error);
        res.status(500).json({ error: error.message });
    }
});

// Route für das Löschen eines Badges
app.delete('/api/admin/badges/:name', async (req, res) => {
    const badgeName = req.params.name;
    const badgesCollection = db.collection('badges');
    
    try {
        // Suche nach dem Badge in der Datenbank
        const badge = await badgesCollection.findOne({ name: badgeName });
        
        // Wenn das Badge gefunden wurde, lösche es aus der Datenbank
        if (badge) {
            await badgesCollection.deleteOne({ name: badgeName });

            // Benutzerdaten aktualisieren und Badge entfernen
            const usersCollection = db.collection('users');
            const usersWithBadge = await usersCollection.find({ 'badges.name': badgeName }).toArray();
            for (const user of usersWithBadge) {
                const updatedBadges = user.badges.filter(b => b.name !== badgeName);
                await usersCollection.updateOne({ _id: user._id }, { $set: { badges: updatedBadges } });
            }

            res.status(200).json({ message: `Badge "${badgeName}" erfolgreich gelöscht` });
        } else {
            res.status(404).json({ error: `Badge "${badgeName}" nicht gefunden` });
        }
    } catch (error) {
        console.error('Fehler beim Löschen des Badges:', error);
        res.status(500).json({ error: 'Interner Serverfehler' });
    }
});

// API-Route zum Aktualisieren eines Badges
app.put('/api/admin/badges/:name', async (req, res) => {
    const badgeName = req.params.name;
    const { name, image, description } = req.body;

    try {
        const badgesCollection = db.collection('badges');
        // Suche nach dem zu aktualisierenden Badge
        const badge = await badgesCollection.findOne({ name: badgeName });

        // Wenn das Badge gefunden wurde, aktualisiere es
        if (badge) {
            // Überprüfe, welche Felder aktualisiert werden sollen
            let updateFields = {};
            if (name) updateFields.name = name;
            if (image) updateFields.image = image;
            if (description) updateFields.description = description;

            await badgesCollection.updateOne(
                { name: badgeName },
                { $set: updateFields }
            );
            res.status(200).json({ message: `Badge "${badgeName}" erfolgreich aktualisiert` });
        } else {
            res.status(404).json({ error: `Badge "${badgeName}" nicht gefunden` });
        }
    } catch (error) {
        console.error('Fehler beim Aktualisieren des Badges:', error);
        res.status(500).json({ error: 'Interner Serverfehler' });
    }
});

// API-Route zum Aktivieren oder Deaktivieren eines Badges
app.put('/api/admin/badges/:name/activate', async (req, res) => {
    const badgeName = req.params.name;
    const { active } = req.body;

    try {
        const badgesCollection = db.collection('badges');
        // Suche nach dem zu aktivierenden oder deaktivierenden Badge
        const badge = await badgesCollection.findOne({ name: badgeName });

        // Wenn das Badge gefunden wurde, aktualisiere das active-Feld
        if (badge) {
            await badgesCollection.updateOne(
                { name: badgeName },
                { $set: { active: active } }
            );
            res.status(200).json({ message: `Badge "${badgeName}" erfolgreich ${active ? 'aktiviert' : 'deaktiviert'}` });
        } else {
            res.status(404).json({ error: `Badge "${badgeName}" nicht gefunden` });
        }
    } catch (error) {
        console.error('Fehler beim Aktivieren oder Deaktivieren des Badges:', error);
        res.status(500).json({ error: 'Interner Serverfehler' });
    }
});

// API-Route zum Deaktivieren aller Badges
app.put('/api/admin/badges/deactivate-all', async (req, res) => {
    try {
        // Badges-Sammlung auswählen
        const badgesCollection = db.collection('badges');

        // Alle Badges deaktivieren
        await badgesCollection.updateMany(
            { active: true }, // Filter: Nur aktive Badges
            { $set: { active: false } }
        );

        res.status(200).json({ message: 'Alle Badges erfolgreich deaktiviert' });

    } catch (error) {
        console.error('Fehler beim Deaktivieren aller Badges:', error);
        res.status(500).json({ error: 'Interner Serverfehler' });
    }
});

// API-Route zum Abrufen aller aktiven Abzeichen
app.get('/api/badges/active', async (req, res) => {
    try {
        const badgesCollection = db.collection('badges');
        const activeBadges = await badgesCollection.find({ active: true }).toArray();
        res.json(activeBadges);
    } catch (error) {
        console.error('Fehler beim Abrufen der aktiven Badges:', error);
        res.status(500).json({ error: 'Fehler beim Abrufen der aktiven Badges' });
    }
});

// Route zum Hinzufügen eines neuen Blog-Beitrags
app.post('/api/blogs', async (req, res) => {
    const { title, content, author, date, reactions } = req.body;
  
    // Blog-Beitrag zur Datenbank hinzufügen
    try {
      const newPost = { title, content, author, date, reactions }; // Feld "reactions" hinzugefügt
      const result = await blogCollection.insertOne(newPost);
      console.log(`Blog-Beitrag mit ID ${result.insertedId} hinzugefügt`);
      res.status(201).json(newPost);
    } catch (error) {
      console.error('Fehler beim Hinzufügen des Blog-Beitrags:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
});

// Route zum Abrufen aller Blog-Beiträge
app.get('/api/blogs', async (req, res) => {
    try {
      const blogPosts = await blogCollection.find({}).toArray();
      res.status(200).json(blogPosts);
    } catch (error) {
      console.error('Fehler beim Abrufen der Blog-Beiträge:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
});

// Serverseite: Route zum Abrufen von Reaktionen für einen Blogbeitrag
app.get('/api/blogs/:postId/reactions', async (req, res) => {
    const { postId } = req.params;

    try {
        // Finde den Blogbeitrag anhand der postId und gib die Reaktionen zurück
        const blogPost = await blogCollection.findOne({ _id: new ObjectId(postId) });
        if (!blogPost) {
            return res.status(404).json({ error: 'Blog post not found' });
        }

        const reactions = blogPost.reactions || {};
        res.status(200).json({ reactions });
    } catch (error) {
        console.error('Error getting reactions:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Route zum Hinzufügen einer Reaktion zu einem Blogbeitrag
app.post('/api/blogs/:postId/reactions', async (req, res) => {
    const { postId } = req.params;
    const { reaction, userIdentifier } = req.body; // Hier sollte der Benutzername oder die Kennung übergeben werden

    try {
        const result = await blogCollection.updateOne(
            { _id: new ObjectId(postId) },
            { $addToSet: { reactions: { emoji: reaction, username: userIdentifier } } }
        );

        if (result.modifiedCount === 1) {
            res.status(200).json({ message: 'Reaction added successfully' });
        } else {
            res.status(404).json({ error: 'Post not found' });
        }
    } catch (error) {
        console.error('Error adding reaction:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Serverroute zum Entfernen einer Reaktion von einem Blogbeitrag
app.post('/api/blogs/:postId/reactions/remove', async (req, res) => {
    const { reaction, userIdentifier } = req.body;
    const { postId } = req.params;
  
    try {
        // Suchen Sie den Blogbeitrag anhand der postId und aktualisieren Sie das Reactions-Feld, um die Reaktion für den angegebenen Benutzer zu entfernen
        const result = await blogCollection.updateOne(
            { _id: new ObjectId(postId) }, // Hier verwenden Sie `new` um die ObjectId zu initialisieren
            { $pull: { reactions: { emoji: reaction, username: userIdentifier } } } // Entfernen Sie die Reaktion für den angegebenen Benutzer und das angegebene Emoji
        );
  
        if (result.modifiedCount === 1) {
            res.status(200).json({ message: 'Reaction removed successfully' });
        } else {
            res.status(404).json({ error: 'Post not found or reaction not found' });
        }
    } catch (error) {
        console.error('Error removing reaction:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.post('/api/blogs/:postId/reactions', async (req, res) => {
    const { reaction } = req.body;
    const { postId } = req.params;

    try {
        const result = await blogCollection.updateOne(
            { _id: new ObjectId(postId) },
            { $inc: { [`reactions.${reaction}`]: 1 } }
        );

        if (result.modifiedCount === 1) {
            res.status(200).json({ message: 'Reaction added successfully' });
        } else {
            res.status(404).json({ error: 'Post not found' });
        }
    } catch (error) {
        console.error('Error adding reaction:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});


// Route zum Entfernen einer Reaktion von einem Blogbeitrag
app.delete('/api/blogs/:postId/reactions/:emoji', async (req, res) => {
    const { postId, emoji } = req.params;
    const userIdentifier = req.body.userIdentifier; // Hier sollten Sie den Benutzernamen oder die Kennung erhalten

    try {
        const result = await blogCollection.updateOne(
            { _id: new ObjectId(postId) },
            { $pull: { reactions: { emoji: emoji, username: userIdentifier } } }
        );

        if (result.modifiedCount === 1) {
            res.status(200).json({ message: 'Reaction removed successfully' });
        } else {
            res.status(404).json({ error: 'Post or reaction not found' });
        }
    } catch (error) {
        console.error('Error removing reaction:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.get('/api/blogs/:postId', async (req, res) => {
    const postId = new ObjectId(req.params.postId);
    try {
        const blogPost = await blogCollection.findOne({ _id: ObjectId(postId) });
        res.status(200).json(blogPost);
    } catch (error) {
        console.error('Fehler beim Abrufen des Blog-Beitrags:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// -----------------------

const pages = ['home', 'explore', 'settings', 'profile', 'login', 'signup', 'preferences', 'admin', 'blog'];
const adminpages = ['badges'];

pages.forEach(page => {
    app.get(`/${page}`, (req, res) => {
        res.sendFile(path.join(__dirname, 'html', `${page}.html`));
    });
});

adminpages.forEach(page => {
    app.get(`/admin/${page}`, (req, res) => {
        res.sendFile(path.join(__dirname, 'html', `${page}.html`));
    });
});

app.listen(PORT, () => {
    run().catch(error => console.error('Fehler beim Starten des Servers:', error));
    console.log('Link: http://localhost:' + PORT + '/home');
});