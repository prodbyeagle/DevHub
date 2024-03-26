const express = require("express");
const path = require("path");
const bodyParser = require("body-parser");
const cors = require("cors");
const { MongoClient, ServerApiVersion } = require("mongodb");
const session = require("express-session");
const crypto = require("crypto");
require("dotenv").config();
const { ObjectId } = require("mongodb");
const objectId = new ObjectId();
const socketIo = require("socket.io");
const http = require("http");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const cookieParser = require("cookie-parser");
const fs = require("fs");

const app = express();
const PORT = process.env.PORT || 3000;
const server = http.createServer(app);
const io = socketIo(server);

const sessionSecret = require("crypto").randomBytes(64).toString("hex");

app.use(express.static(path.join(__dirname, "public")));
app.use("/public", express.static(path.join(__dirname, "public")));
app.use(express.static(path.join(__dirname, "html")));
app.use("/js", express.static(path.join(__dirname, "js")));
app.use("/css", express.static(path.join(__dirname, "css")));
app.use("/assets", express.static(path.join(__dirname, "assets")));

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));
app.use(bodyParser.json());
app.use(cookieParser());
app.use(cors());
app.use(
  session({
    secret: sessionSecret,
    resave: false,
    saveUninitialized: true,
  })
);

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
    },
  });

  try {
    await client.connect();
    db = client.db(dbName);
    usersCollection = db.collection("users");
    postsCollection = db.collection("posts");
    blogCollection = db.collection("blogs");
    console.log("Connected to MongoDB successfully!");
  } catch (error) {
    console.error("Error connecting to MongoDB:", error);
  }
}

function formatDateForDisplay(date) {
  const options = {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  };
  return new Date(date).toLocaleString("de-DE", options);
}

app.get("/u/:username", async (req, res) => {
  const username = req.params.username;

  try {
    const user = await usersCollection.findOne({ username });

    if (!user) {
      return res.status(404).sendFile(path.join(__dirname, "html", "404.html"));
    }

    res.sendFile(path.join(__dirname, "public", "profile.html"));
  } catch (error) {
    console.error("Fehler beim Laden des Benutzerprofils:", error);

    return res.status(500).sendFile(path.join(__dirname, "html", "500.html"));
  }
});

app.get("/api/profile/:username", async (req, res) => {
  let encodedUsername = req.params.username;
  let username = decodeURIComponent(encodedUsername);

  try {
    const user = await usersCollection.findOne({ username });
    if (!user) {
      return res.status(404).json({ error: "Benutzer nicht gefunden" });
    }
    res.json(user);
  } catch (error) {
    console.error("Fehler beim Abrufen der Benutzerdaten:", error);
    return res.status(500).sendFile(path.join(__dirname, "html", "500.html"));
  }
});

app.post("/profile/:username/pin-post/:postId", (req, res) => {
  const { username, postId } = req.params;

  postsCollection.updateOne(
    { _id: new ObjectId(postId) },
    { $set: { pinned: true } },
    (err, result) => {
      if (err) {
        console.error("Failed to pin post:", err);
        return res
          .status(500)
          .sendFile(path.join(__dirname, "html", "500.html"));
      }
      res.status(200).send("Post pinned successfully.");
    }
  );
});

app.put("/api/profile/:username/ban", async (req, res) => {
  let encodedUsername = req.params.username;
  let username = decodeURIComponent(encodedUsername);
  try {
    const user = await usersCollection.findOneAndUpdate(
      { username },
      { $set: { banned: true } },
      { returnOriginal: false }
    );
    if (!user) {
      return res.status(404).json({ error: "Benutzer nicht gefunden" });
    }
    res
      .status(200)
      .json({ message: `Benutzer ${username} erfolgreich gebannt` });
  } catch (error) {
    console.error("Fehler beim Bannen des Benutzers:", error);
    return res.status(500).sendFile(path.join(__dirname, "html", "500.html"));
  }
});

app.put("/api/profile/:username/unban", async (req, res) => {
  let encodedUsername = req.params.username;
  let username = decodeURIComponent(encodedUsername);
  try {
    const user = await usersCollection.findOneAndUpdate(
      { username },
      { $set: { banned: false } },
      { returnOriginal: false }
    );
    if (!user) {
      return res.status(404).json({ error: "Benutzer nicht gefunden" });
    }
    res
      .status(200)
      .json({ message: `Ban für Benutzer ${username} erfolgreich aufgehoben` });
  } catch (error) {
    console.error("Fehler beim Aufheben des Bans des Benutzers:", error);
    return res.status(500).sendFile(path.join(__dirname, "html", "500.html"));
  }
});

app.put("/api/profile/:username/true", async (req, res) => {
  let encodedUsername = req.params.username;
  let username = decodeURIComponent(encodedUsername);
  try {
    const user = await usersCollection.findOneAndUpdate(
      { username },
      { $set: { admin: true } },
      { returnOriginal: false }
    );
    if (!user) {
      return res.status(404).json({ error: "Benutzer nicht gefunden" });
    }
    res
      .status(200)
      .json({ message: `Benutzer ${username} erfolgreich zum Admin ernannt` });
  } catch (error) {
    console.error("Fehler beim Hinzufügen von Admin des Benutzers:", error);
    return res.status(500).sendFile(path.join(__dirname, "html", "500.html"));
  }
});

app.put("/api/profile/:username/false", async (req, res) => {
  let encodedUsername = req.params.username;
  let username = decodeURIComponent(encodedUsername);
  try {
    const user = await usersCollection.findOneAndUpdate(
      { username },
      { $set: { admin: false } },
      { returnOriginal: false }
    );
    if (!user) {
      return res.status(404).json({ error: "Benutzer nicht gefunden" });
    }
    res
      .status(200)
      .json({ message: `Benutzer ${username} erfolgreich Admin entfernt` });
  } catch (error) {
    console.error("Fehler beim Entfernen von Admin des Benutzers:", error);
    return res.status(500).sendFile(path.join(__dirname, "html", "500.html"));
  }
});

app.get("/api/:username/posts", async (req, res) => {
  const { username } = req.params;

  try {
    const posts = await db.collection("posts").find({ username }).toArray();

    const postsWithFormattedData = await Promise.all(
      posts.map(async (post) => {
        const user = await db
          .collection("users")
          .findOne({ username: post.username });
        const imageUrl = user ? user.pb : null;
        return {
          ...post,
          date: formatDateForDisplay(post.date),
          imageUrl,
        };
      })
    );

    res.status(200).json(postsWithFormattedData);
  } catch (error) {
    console.error("Fehler beim Abrufen der Beiträge:", error);
    return res.status(500).sendFile(path.join(__dirname, "html", "500.html"));
  }
});

app.post("/profile/:username/pin-post/:postId", (req, res) => {
  const { username, postId } = req.params;

  const postsCollection = db.collection("posts");

  postsCollection.updateOne(
    { _id: ObjectId(postId) },
    { $set: { pinned: true } },
    (err, result) => {
      if (err) {
        console.error("Failed to pin post:", err);
        return res
          .status(500)
          .sendFile(path.join(__dirname, "html", "500.html"));
        return;
      }
      res.status(200).send("Post pinned successfully.");
    }
  );
});

app.get("/profile/:postId", (req, res) => {
  const { postId } = req.params;

  postsCollection.findOne({ _id: postId }, (err, post) => {
    if (err) {
      console.error("Failed to fetch post:", err);
      return res.status(500).sendFile(path.join(__dirname, "html", "500.html"));
      return;
    }
    if (!post) {
      res.status(404).send("Post not found");
      return;
    }
    res.json(post);
  });
});

app.put("/edit-post/:postId", (req, res) => {
  const { postId } = req.params;
  const { content, codesnippet, date } = req.body;

  const postsCollection = db.collection("posts");

  console.log("Received PUT request to edit post:", postId);

  postsCollection.updateOne(
    { _id: new ObjectId(postId) },
    { $set: { content: content, codesnippet: codesnippet, date: date } },
    (err, result) => {
      if (err) {
        console.error("Failed to edit post:", err);
        return res
          .status(500)
          .sendFile(path.join(__dirname, "html", "500.html"));
        return;
      }
      res.status(200).send("Post edited successfully.");
    }
  );
});

app.delete("/api/:username/posts", async (req, res) => {
  const { username } = req.params;

  try {
    await db.collection("posts").deleteMany({ username });

    res.status(200).json({ message: "All user posts deleted successfully" });
  } catch (error) {
    console.error("Fehler beim Löschen der Beiträge:", error);
    return res.status(500).sendFile(path.join(__dirname, "html", "500.html"));
  }
});

app.get("/api/posts", async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;

  try {
    const skip = (page - 1) * limit;

    const postsCount = await db.collection("posts").countDocuments();
    const totalPages = Math.ceil(postsCount / limit);

    const posts = await db
      .collection("posts")
      .find()
      .skip(skip)
      .limit(limit)
      .toArray();

    const postsWithFormattedData = await Promise.all(
      posts.map(async (post) => {
        const user = await db
          .collection("users")
          .findOne({ username: post.username });
        const imageUrl = user ? user.pb : null;
        return {
          ...post,
          date: formatDateForDisplay(post.date),
          imageUrl,
        };
      })
    );

    res.status(200).json({
      totalPages,
      currentPage: page,
      posts: postsWithFormattedData,
    });
  } catch (error) {
    console.error("Fehler beim Abrufen der Beiträge:", error);
    return res.status(500).sendFile(path.join(__dirname, "html", "500.html"));
  }
});

app.post("/api/posts", async (req, res) => {
  const { content, identifier, codesnippet } = req.body;
  const date = new Date();

  try {
    const result = await db.collection("posts").insertOne({
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
      date: formatDateForDisplay(date),
      codesnippet,
      likes: 0,
      replies: 0,
      pinned: false,
    };
    res.status(201).json(newPost);
  } catch (error) {
    console.error("Error creating new post:", error);
    return res.status(500).sendFile(path.join(__dirname, "html", "500.html"));
  }
});

app.get("/api/posts/all", async (req, res) => {
  try {
    const postsCollection = db.collection("posts");
    const allPosts = await postsCollection.find({}).toArray();
    res.json(allPosts);
  } catch (error) {
    console.error("Fehler beim Abrufen aller Posts:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// // server secure

// // Middleware zum Überprüfen des Server-Tokens
// function verifyServerToken(req, res, next) {
//   let token = null;

//   // Überprüfe, ob ein Token im Cookie vorhanden ist
//   if (req.cookies && (req.cookies.token || req.cookies.devolution_token)) {
//     token = req.cookies.token || req.cookies.devolution_token;
//   } else {
//     // Wenn kein Cookie vorhanden ist, verwende den Server-Token
//     token = process.env.SERVER_TOKEN;
//   }

//   // Überprüfe, ob ein Token vorhanden ist
//   if (!token) {
//     console.error("Ungültiger oder fehlender Token");
//     return res.status(403).sendFile(path.join(__dirname, "html", "403.html"));
//   }

//   try {
//     // Überprüfe das Token
//     const decoded = jwt.verify(token, process.env.SERVER_SECRET);
//     if (decoded.server !== true) {
//       console.error("Ungültiges Token: Server-Berechtigung fehlt");
//       return res.status(403).sendFile(path.join(__dirname, "html", "403.html"));
//     }
//     console.log("Server-Token erfolgreich überprüft");
//     console.log("Decodierte Token-Daten:", decoded);
//     next();
//   } catch (error) {
//     console.error("Fehler beim Überprüfen des Tokens:", error.message);
//     // Wenn ein Fehler beim Überprüfen des Tokens auftritt, sende 403
//     return res.status(403).sendFile(path.join(__dirname, "html", "403.html"));
//   }
// }

// // Pfad zur .env-Datei
// const envFilePath = path.resolve(__dirname, '.env');

// // Funktion zum Aktualisieren des Tokens in der .env-Datei
// function updateEnvFile(token) {
//   try {
//     // Lese den aktuellen Inhalt der .env-Datei
//     let envContent = fs.readFileSync(envFilePath, 'utf8');

//     // Ersetze den aktuellen Token-Wert mit dem neuen Token
//     envContent = envContent.replace(/SERVER_TOKEN=(.*)/, `SERVER_TOKEN=${token}`);

//     // Schreibe den aktualisierten Inhalt zurück in die .env-Datei
//     fs.writeFileSync(envFilePath, envContent, 'utf8');

//     console.log('Server-Token in der .env-Datei aktualisiert');
//   } catch (error) {
//     console.error('Fehler beim Aktualisieren des Server-Tokens in der .env-Datei:', error);
//   }
// }

// // Generiere einen neuen Server-Token und setze ihn in den Environment-Variablen alle 2 Stunden
// setInterval(() => {
//   const newToken = generateServerToken();
//   updateEnvFile(newToken);
// }, 2 * 60 * 60 * 1000); // Alle 2 Stunden

// // Initialisiere den Server-Token
// const initialToken = generateServerToken();
// updateEnvFile(initialToken);

// // Generiere einen neuen Server-Token
// function generateServerToken() {
//   // Generiere den Token
//   const token = jwt.sign({ server: true }, process.env.SERVER_SECRET, { expiresIn: '2h' });

//   // Speichere den Token in der globalen Variable
//   serverToken = token;
//   console.log(serverToken);
//   return token;
// }

//userlogin

// Funktion zum Erstellen eines JWT-Tokens
function createToken(username) {
  const token = jwt.sign({ username: username }, process.env.SECRET, {
    expiresIn: "12h",
  });
  return token;
}

// Middleware zum Überprüfen des JWT-Tokens
function verifyToken(req, res, next) {
  const token = req.cookies.token; // Annahme: Token im Cookie mit dem Namen "token"
  if (!token) {
    console.log("Kein Token gefunden. Weiterleitung zum Login.");
    return res.redirect("/login"); // Weiterleitung zum Login, wenn kein Token vorhanden ist
  }

  jwt.verify(token, process.env.SECRET, (err, decoded) => {
    if (err) {
      // Fehler beim Verifizieren des Tokens
      console.error("Fehler beim Verifizieren des Tokens:", err.message);
      res.clearCookie("token"); // Löschen des Tokens im Cookie
      console.log(
        "Ungültiger oder abgelaufener Token. Weiterleitung zum Login."
      );
      return res.redirect("/login"); // Weiterleitung zum Login
    }
    req.username = decoded.username; // Extrahieren des Benutzernamens aus dem Token
    next(); // Weiterleitung an die nächste Middleware oder den nächsten Handler
  });
}

app.post("/login", async (req, res) => {
  const { identifier, password } = req.body;

  try {
    // Fetch user from database
    const user = await usersCollection.findOne({
      $or: [{ username: identifier }, { email: identifier }],
    });

    // Check if user exists
    if (!user) {
      console.log(`Benutzer mit dem Identifier ${identifier} nicht gefunden`);
      return res.status(401).send("Invalid credentials");
    }

    if (password !== user.password) {
      console.log(
        `Incorrect password for user with identifier ${identifier} ${user.password}`
      );
      return res.status(401).send("Invalid email or password");
    }

    // Generate JWT token
    const token = createToken(user.username);
    res.cookie("devolution_token", token, { httpOnly: true });

    // Return token and user details
    res.json({
      token: token,
      user: { username: user.username, email: user.email },
    });
  } catch (error) {
    console.error("Fehler während des Logins:", error);
    return res.status(500).sendFile(path.join(__dirname, "html", "500.html"));
  }
});

// GOOGLE

app.post("/signup", async (req, res) => {
  const { email, password, username, pb } = req.body;

  try {
    const existingUserByUsername = await usersCollection.findOne({ username });

    if (existingUserByUsername) {
      return res
        .status(400)
        .send(`${existingUserByUsername.username} Username already taken`);
    }

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

    res.status(201).send("User created successfully");
  } catch (error) {
    console.error("Error during sign up:", error);
    return res.status(500).sendFile(path.join(__dirname, "html", "500.html"));
  }
});

app.post("/api/update", async (req, res) => {
  const { username, preferences } = req.body;

  try {
    const existingUser = await usersCollection.findOne({ username });
    if (!existingUser) {
      return res.status(400).send("Benutzer nicht gefunden");
    }

    const updatedUser = await usersCollection.findOneAndUpdate(
      { username: username },
      { $set: { preferences: preferences.split(",") } },
      { returnOriginal: false }
    );

    res.status(200).json({
      message: "Benutzervorlieben erfolgreich aktualisiert",
      user: updatedUser.value,
    });
  } catch (err) {
    console.error("Fehler beim Aktualisieren der Benutzervorlieben:", err);
    return res.status(500).sendFile(path.join(__dirname, "html", "500.html"));
  }
});

app.post("/admin", async (req, res) => {
  try {
    const { username } = req.body;
    const collection = db.collection("users");
    const existingUser = await collection.findOne({ username });

    if (!existingUser) {
      console.log("User not found.");
      return res.status(400).send("Benutzer nicht gefunden");
    }

    if (existingUser.admin === true) {
      const userData = await collection.find().toArray();
      return res.status(200).json(userData);
    } else {
      return res.status(200).json({ message: false });
    }
  } catch (err) {
    console.error("Fehler beim Überprüfen des Benutzers:", err);
    return res.status(500).sendFile(path.join(__dirname, "html", "500.html"));
  }
});

app.delete("/admin/delete-posts", async (req, res) => {
  try {
    const collection = db.collection("posts");
    await collection.deleteMany({});
    res.status(200).json({ message: "Posts collection deleted successfully" });
  } catch (error) {
    console.error("Error deleting posts collection:", error);
    return res.status(500).sendFile(path.join(__dirname, "html", "500.html"));
  }
});

app.get("/api/username", async (req, res) => {
  try {
    const collection = db.collection("users");
    const users = await collection.find().toArray();
    const userData = users.map((user) => ({
      username: user.username,
      email: user.email,
      password: user.password,
      pb: user.pb,
      bio: user.bio,
      admin: user.admin,
      banned: user.banned,
      badges: user.badges,
    }));

    res.json({ users: userData });
  } catch (error) {
    return res.status(500).sendFile(path.join(__dirname, "html", "500.html"));
  }
});

app.post("/api/update/bio", async (req, res) => {
  try {
    const { username, newBio } = req.body;
    const collection = db.collection("users");

    const user = await collection.findOne({ username });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    await collection.updateOne({ username }, { $set: { bio: newBio } });
    return res.status(200).json({ message: "Bio updated successfully" });
  } catch (error) {
    return res.status(500).sendFile(path.join(__dirname, "html", "500.html"));
  }
});

app.post("/api/update/pb", async (req, res) => {
  try {
    const { username, newPB } = req.body;
    const collection = db.collection("users");
    const user = await collection.findOne({ username });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    await collection.updateOne({ username }, { $set: { pb: newPB } });

    return res.status(200).json({ message: "PB updated successfully" });
  } catch (error) {
    return res.status(500).sendFile(path.join(__dirname, "html", "500.html"));
  }
});

app.post("/api/update/follower", async (req, res) => {
  try {
    const { followerUsername, followedUsername } = req.body;

    if (followerUsername === followedUsername) {
      return res.status(400).json({ error: "Cannot follow yourself" });
    }

    const collection = db.collection("users");

    const user = await collection.findOne({ username: followedUsername });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const isAlreadyFollowing = user.followers.includes(followerUsername);

    if (isAlreadyFollowing) {
      await collection.updateOne(
        { username: followedUsername },
        { $pull: { followers: followerUsername }, $inc: { follower: -1 } }
      );
      return res.status(201).json({ message: "User unfollowed successfully" });
    } else {
      await collection.updateOne(
        { username: followedUsername },
        { $push: { followers: followerUsername }, $inc: { follower: 1 } }
      );
      return res.status(200).json({ message: "User followed successfully" });
    }
  } catch (error) {
    console.error("Fehler beim Ändern des Follow-Status:", error);
    return res.status(500).sendFile(path.join(__dirname, "html", "500.html"));
  }
});

app.post("/api/profile/change/passwort", async (req, res) => {
  try {
    const { username, currentPassword, newPassword } = req.body;
    const collection = db.collection("users");

    const user = await collection.findOne({ username });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    if (user.password !== currentPassword) {
      return res.status(400).json({ error: "Current password is incorrect" });
    }

    await collection.updateOne(
      { username },
      { $set: { password: newPassword } }
    );

    return res.status(200).json({ message: "Password changed successfully" });
  } catch (error) {
    console.error("Error processing request:", error);
    return res.status(500).sendFile(path.join(__dirname, "html", "500.html"));
  }
});

app.post("/api/profile/change/email", async (req, res) => {
  try {
    const { username, currentEmail, newEmail } = req.body;
    const collection = db.collection("users");

    const user = await collection.findOne({ username });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    if (user.email !== currentEmail) {
      return res.status(400).json({ error: "Current Email is incorrect" });
    }

    await collection.updateOne({ username }, { $set: { email: newEmail } });

    return res.status(200).json({ message: "Email changed successfully" });
  } catch (error) {
    console.error("Error processing request:", error);
    return res.status(500).sendFile(path.join(__dirname, "html", "500.html"));
  }
});

app.post("/api/profile/change/username", async (req, res) => {
  try {
    const { username, currentUsername, newUsername } = req.body;
    const collection = db.collection("users");

    console.log("Received request to change username...");
    console.log("Username:", username);
    console.log("Current Username:", currentUsername);
    console.log("New Username:", newUsername);

    const user = await collection.findOne({ username });

    if (!user) {
      console.log("User not found");
      return res.status(404).json({ error: "User not found" });
    }

    if (user.username !== currentUsername) {
      console.log("Current username is incorrect");
      return res.status(400).json({ error: "Current Username is incorrect" });
    }

    await collection.updateOne(
      { username },
      { $set: { username: newUsername } }
    );

    console.log("Username changed successfully");
    return res.status(200).json({ message: "Username changed successfully" });
  } catch (error) {
    console.error("Error processing request:", error);
    return res.status(500).sendFile(path.join(__dirname, "html", "500.html"));
  }
});

app.delete("/api/profile/delete/:username", async (req, res) => {
  try {
    const username = req.params.username;
    if (!username) {
      console.error("Error deleting account: Username not provided");
      return res.status(400).send("Username not provided");
    }

    console.log(`Deleting account for username: ${username}`);

    const deletionResult = await usersCollection.deleteOne({ username });

    if (deletionResult.deletedCount === 0) {
      console.log(`No account found for username: ${username}`);
      return res.status(404).send("Account not found");
    }

    console.log(`Account successfully deleted for username: ${username}`);
    res.status(200).send("Account successfully deleted");
  } catch (error) {
    console.error("Error deleting account:", error);
    return res.status(500).sendFile(path.join(__dirname, "html", "500.html"));
  }
});

app.delete("/api/posts/delete/:postId", async (req, res) => {
  try {
    const postId = req.params.postId;
    if (!postId) {
      console.error("Error deleting post: Post ID not provided");
      return res.status(400).send("Post ID not provided");
    }

    console.log(`Deleting post with ID: ${postId}`);

    const deletionResult = await postsCollection.deleteOne({
      _id: new ObjectId(postId),
    });

    if (deletionResult.deletedCount === 0) {
      console.log(`No post found with ID: ${postId}`);
      return res.status(404).send("Post not found");
    }

    console.log(`Post successfully deleted with ID: ${postId}`);
    res.status(200).send("Post successfully deleted");
  } catch (error) {
    console.error("Error deleting post:", error);
    return res.status(500).sendFile(path.join(__dirname, "html", "500.html"));
  }
});

// Route zum Liken eines Posts
app.post("/posts/:username/:postId/like", async (req, res) => {
  const postsCollection = db.collection("posts");
  const { postId, username } = req.params;

  try {
    const post = await postsCollection.findOne({ _id: new ObjectId(postId) });
    if (!post) {
      console.error("Post not found");
      return res.status(404).json({ message: "Post not found" });
    }

    // Überprüfen, ob das Feld 'liked' definiert ist und ein Array ist
    if (!post.hasOwnProperty("liked") || !Array.isArray(post.liked)) {
      post.liked = [];
    }

    if (!post.liked.includes(username)) {
      post.liked.push(username);
      post.likes++;
      await postsCollection.updateOne(
        { _id: new ObjectId(postId) },
        { $set: { likes: post.likes, liked: post.liked } }
      );
    }

    res.json({ message: "Post liked successfully" });
  } catch (error) {
    console.error("Error liking post:", error);
    return res.status(500).sendFile(path.join(__dirname, "html", "500.html"));
  }
});

app.post("/posts/:username/:postId/unlike", async (req, res) => {
  const postsCollection = db.collection("posts");
  const { postId, username } = req.params;

  try {
    const post = await postsCollection.findOne({ _id: new ObjectId(postId) });
    if (!post) {
      console.error("Post not found");
      return res.status(404).json({ message: "Post not found" });
    }

    if (!Array.isArray(post.liked)) {
      post.liked = [];
    }

    const index = post.liked.indexOf(username);
    if (index !== -1) {
      post.liked.splice(index, 1);
      post.likes--;

      await postsCollection.updateOne(
        { _id: new ObjectId(postId) },
        { $set: { likes: post.likes, liked: post.liked } }
      );
    }
    res.json({ message: "Post unliked successfully" });
  } catch (error) {
    console.error("Error unliking post:", error);
    return res.status(500).sendFile(path.join(__dirname, "html", "500.html"));
  }
});

app.get("/posts/:postId/likes", async (req, res) => {
  try {
    const { postId } = req.params;
    const postsCollection = db.collection("posts");

    const post = await postsCollection.findOne({ _id: new ObjectId(postId) });

    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    res.json({ likes: post.likes });
  } catch (error) {
    console.error("Error getting likes:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

app.get("/posts/:username/:postId/check-like", async (req, res) => {
  const { postId, username } = req.params;

  try {
    const post = await postsCollection.findOne({ _id: new ObjectId(postId) });
    if (!post) {
      console.error("Post not found");
      return res.status(404).json({ message: "Post not found" });
    }

    // Überprüfen, ob das liked-Feld vorhanden und ein Array ist
    if (!Array.isArray(post.liked)) {
      console.error("Liked field is not an array");
      return res.status(500).json({ message: "Internal server error" });
    }

    if (post.liked.includes(username)) {
      res.json({ liked: true });
    } else {
      res.json({ liked: false });
    }
  } catch (error) {
    console.error("Error checking if liked:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

app.get("/posts/:postId", async (req, res) => {
  try {
    const postId = req.params.postId;
    const postsCollection = db.collection("posts");

    const post = await postsCollection.findOne({ _id: new ObjectId(postId) });

    if (!post) {
      return res.status(404).json({ message: "Beitrag nicht gefunden" });
    }

    res.json({ likes: post.likes });
  } catch (error) {
    console.error("Fehler beim Abrufen des Beitrags:", error);
    return res.status(500).sendFile(path.join(__dirname, "html", "500.html"));
  }
});

//BADGES

app.get("/api/admin/badges", async (req, res) => {
  try {
    const badgesCollection = db.collection("badges");
    const badges = await badgesCollection.find({}).toArray();
    res.json(badges);
  } catch (error) {
    console.error("Fehler beim Abrufen der Badges:", error);
    return res.status(500).sendFile(path.join(__dirname, "html", "500.html"));
  }
});

app.get("/api/:username/badges", async (req, res) => {
  const username = req.params.username;

  try {
    const user = await db.collection("users").findOne({ username: username });
    if (!user) {
      return res.status(404).json({ error: "Benutzer nicht gefunden" });
    }

    const userBadges = user.badges;
    res.json({ badges: userBadges });
  } catch (error) {
    console.error("Fehler beim Abrufen der Badges:", error);
    return res.status(500).sendFile(path.join(__dirname, "html", "500.html"));
  }
});

app.post("/api/admin/badges", async (req, res) => {
  try {
    const { name, image, description, active } = req.body;

    if (!name || !image || !description) {
      return res.status(400).json({ error: "Alle Felder sind erforderlich" });
    }

    const badgesCollection = db.collection("badges");
    await badgesCollection.insertOne({ name, image, description, active });

    res.json({
      message: "Badge erfolgreich hinzugefügt",
    });
  } catch (error) {
    console.error("Fehler beim Hinzufügen des Badges:", error);
    return res.status(500).sendFile(path.join(__dirname, "html", "500.html"));
  }
});

app.post("/api/admin/assign-badge", async (req, res) => {
  const { badgeName, badgeImage, badgeDescription, username } = req.body;
  try {
    // Überprüfen, ob der Benutzer existiert
    const userExists = await db
      .collection("users")
      .findOne({ username: username });
    if (!userExists) {
      throw new Error("Benutzer nicht gefunden");
    }

    // Überprüfen, ob der Benutzer bereits das Badge hat
    const hasBadge = userExists.badges.some(
      (badge) => badge.name === badgeName
    );
    if (hasBadge) {
      return res.status(400).json({ error: "Benutzer hat das Badge bereits" });
    }

    // Badge dem Benutzer hinzufügen
    const result = await db.collection("users").findOneAndUpdate(
      { username: username },
      {
        $push: {
          badges: {
            name: badgeName,
            image: badgeImage,
            description: badgeDescription,
            active: true,
          },
        },
      },
      { returnOriginal: false }
    );

    res.json(result.value); // Gibt den aktualisierten Benutzer zurück
  } catch (error) {
    console.error("Fehler beim Zuweisen des Badges zum Benutzer:", error);
    return res.status(500).sendFile(path.join(__dirname, "html", "500.html"));
  }
});

app.delete("/api/admin/badges/:name", async (req, res) => {
  const badgeName = req.params.name;
  const badgesCollection = db.collection("badges");

  try {
    const badge = await badgesCollection.findOne({ name: badgeName });

    if (badge) {
      await badgesCollection.deleteOne({ name: badgeName });

      const usersCollection = db.collection("users");
      const usersWithBadge = await usersCollection
        .find({ "badges.name": badgeName })
        .toArray();
      for (const user of usersWithBadge) {
        const updatedBadges = user.badges.filter((b) => b.name !== badgeName);
        await usersCollection.updateOne(
          { _id: user._id },
          { $set: { badges: updatedBadges } }
        );
      }

      res
        .status(200)
        .json({ message: `Badge "${badgeName}" erfolgreich gelöscht` });
    } else {
      res.status(404).json({ error: `Badge "${badgeName}" nicht gefunden` });
    }
  } catch (error) {
    console.error("Fehler beim Löschen des Badges:", error);
    return res.status(500).sendFile(path.join(__dirname, "html", "500.html"));
  }
});

app.put("/api/admin/badges/:name", async (req, res) => {
  const badgeName = req.params.name;
  const { name, image, description } = req.body;

  try {
    const badgesCollection = db.collection("badges");

    const badge = await badgesCollection.findOne({ name: badgeName });

    if (badge) {
      let updateFields = {};
      if (name) updateFields.name = name;
      if (image) updateFields.image = image;
      if (description) updateFields.description = description;

      await badgesCollection.updateOne(
        { name: badgeName },
        { $set: updateFields }
      );
      res
        .status(200)
        .json({ message: `Badge "${badgeName}" erfolgreich aktualisiert` });
    } else {
      res.status(404).json({ error: `Badge "${badgeName}" nicht gefunden` });
    }
  } catch (error) {
    console.error("Fehler beim Aktualisieren des Badges:", error);
    return res.status(500).sendFile(path.join(__dirname, "html", "500.html"));
  }
});

app.put("/api/:username/badges/:name/activate", async (req, res) => {
  const { username, name } = req.params;
  const { active } = req.body;

  try {
    const badge = await usersCollection.findOne({
      username: username,
      "badges.name": name,
    });

    if (badge) {
      // Aktualisieren Sie das aktive Badge des Benutzers entsprechend
      await usersCollection.updateOne(
        { username: username, "badges.name": name },
        { $set: { "badges.$.active": active } }
      );

      res.status(200).json({
        message: `Badge "${name}" erfolgreich ${
          active ? "aktiviert" : "deaktiviert"
        }`,
      });
    } else {
      console.log(`Badge ${name} nicht gefunden`);

      res.status(404).json({ error: `Badge "${name}" nicht gefunden` });
    }
  } catch (error) {
    console.error(
      "Fehler beim Aktivieren oder Deaktivieren des Badges:",
      error
    );
    return res.status(500).sendFile(path.join(__dirname, "html", "500.html"));
  }
});

app.put("/api/:username/badges/deactivate-all/:badgeName", async (req, res) => {
  const { username, badgeName } = req.params; // Benutzername und Name des ausgewählten Badges aus den Anforderungsparametern
  let skippedBadgeName = null; // Variable zum Speichern des Namens des übersprungenen Badges

  try {
    // Holen Sie sich den Benutzer und seine Badges
    const user = await usersCollection.findOne({ username: username });
    const badges = user.badges;

    // Deaktivieren Sie alle Badges des Benutzers, die aktiv sind, außer dem ausgewählten Badge
    for (let i = 0; i < badges.length; i++) {
      if (badges[i].name === badgeName) {
        skippedBadgeName = badgeName; // Speichern Sie den Namen des übersprungenen Badges
        continue; // Überspringen Sie das ausgewählte Badge
      }

      if (badges[i].active === true) {
        await usersCollection.updateOne(
          { username: username, "badges.name": badges[i].name },
          { $set: { "badges.$.active": false } }
        );
      }
    }

    res
      .status(200)
      .json({
        message: `Alle Badges außer dem ausgewählten Badge erfolgreich deaktiviert. Übersprungenes Badge: ${skippedBadgeName}`,
      });
  } catch (error) {
    console.error(
      "Fehler beim Deaktivieren aller Badges außer dem ausgewählten Badge:",
      error
    );
    return res.status(500).sendFile(path.join(__dirname, "html", "500.html"));
  }
});

app.get("/api/badges/active", async (req, res) => {
  try {
    const activeBadges = await usersCollection.find({ active: true }).toArray();
    res.json(activeBadges);
  } catch (error) {
    console.error("Fehler beim Abrufen der aktiven Badges:", error);
    return res.status(500).sendFile(path.join(__dirname, "html", "500.html"));
  }
});

//BLOGS

app.post("/api/blogs", async (req, res) => {
  const { title, content, author, date, reactions, image } = req.body;
  try {
    const newPost = { title, content, author, date, reactions, image };
    const result = await blogCollection.insertOne(newPost);
    console.log(`Blog-Beitrag mit ID ${result.insertedId} hinzugefügt`);
    res.status(201).json(newPost);
  } catch (error) {
    console.error("Fehler beim Hinzufügen des Blog-Beitrags:", error);
    return res.status(500).sendFile(path.join(__dirname, "html", "500.html"));
  }
});

app.get("/api/blogs", async (req, res) => {
  try {
    const blogPosts = await blogCollection.find({}).toArray();
    res.status(200).json(blogPosts);
  } catch (error) {
    console.error("Fehler beim Abrufen der Blog-Beiträge:", error);
    return res.status(500).sendFile(path.join(__dirname, "html", "500.html"));
  }
});

app.get("/api/blogs/:postId/reactions", async (req, res) => {
  const { postId } = req.params;
  try {
    const blogPost = await blogCollection.findOne({
      _id: new ObjectId(postId),
    });
    if (!blogPost) {
      return res.status(404).json({ error: "Blog post not found" });
    }

    const reactions = blogPost.reactions || {};
    res.status(200).json({ reactions });
  } catch (error) {
    console.error("Error getting reactions:", error);
    return res.status(500).sendFile(path.join(__dirname, "html", "500.html"));
  }
});

app.post("/api/blogs/:postId/reactions", async (req, res) => {
  const { postId } = req.params;
  const { reaction, userIdentifier } = req.body;

  try {
    const result = await blogCollection.updateOne(
      { _id: new ObjectId(postId) },
      {
        $addToSet: { reactions: { emoji: reaction, username: userIdentifier } },
      }
    );

    if (result.modifiedCount === 1) {
      res.status(200).json({ message: "Reaction added successfully" });
    } else {
      res.status(404).json({ error: "Post not found" });
    }
  } catch (error) {
    console.error("Error adding reaction:", error);
    return res.status(500).sendFile(path.join(__dirname, "html", "500.html"));
  }
});

app.post("/api/blogs/:postId/reactions/remove", async (req, res) => {
  const { reaction, userIdentifier } = req.body;
  const { postId } = req.params;

  try {
    const result = await blogCollection.updateOne(
      { _id: new ObjectId(postId) },
      { $pull: { reactions: { emoji: reaction, username: userIdentifier } } }
    );

    if (result.modifiedCount === 1) {
      res.status(200).json({ message: "Reaction removed successfully" });
    } else {
      res.status(404).json({ error: "Post not found or reaction not found" });
    }
  } catch (error) {
    console.error("Error removing reaction:", error);
    return res.status(500).sendFile(path.join(__dirname, "html", "500.html"));
  }
});

app.post("/api/blogs/:postId/reactions", async (req, res) => {
  const { reaction } = req.body;
  const { postId } = req.params;

  try {
    const result = await blogCollection.updateOne(
      { _id: new ObjectId(postId) },
      { $inc: { [`reactions.${reaction}`]: 1 } }
    );

    if (result.modifiedCount === 1) {
      res.status(200).json({ message: "Reaction added successfully" });
    } else {
      res.status(404).json({ error: "Post not found" });
    }
  } catch (error) {
    console.error("Error adding reaction:", error);
    return res.status(500).sendFile(path.join(__dirname, "html", "500.html"));
  }
});

app.delete("/api/blogs/:postId/reactions/:emoji", async (req, res) => {
  const { postId, emoji } = req.params;
  const userIdentifier = req.body.userIdentifier;

  try {
    const result = await blogCollection.updateOne(
      { _id: new ObjectId(postId) },
      { $pull: { reactions: { emoji: emoji, username: userIdentifier } } }
    );

    if (result.modifiedCount === 1) {
      res.status(200).json({ message: "Reaction removed successfully" });
    } else {
      res.status(404).json({ error: "Post or reaction not found" });
    }
  } catch (error) {
    console.error("Error removing reaction:", error);
    return res.status(500).sendFile(path.join(__dirname, "html", "500.html"));
  }
});

app.get("/api/blogs/:postId", async (req, res) => {
  const postId = new ObjectId(req.params.postId);
  try {
    const blogPost = await blogCollection.findOne({ _id: ObjectId(postId) });
    res.status(200).json(blogPost);
  } catch (error) {
    console.error("Fehler beim Abrufen des Blog-Beitrags:", error);
    return res.status(500).sendFile(path.join(__dirname, "html", "500.html"));
  }
});

// Just the Sites

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "html", "landing.html"));
});

app.get("/login", (req, res) => {
  res.sendFile(path.join(__dirname, "html", "login.html"));
});

app.get("/signup", (req, res) => {
  res.sendFile(path.join(__dirname, "html", "signup.html"));
});

app.get("/wiki", (req, res) => {
  res.redirect("https://youtu.be/dQw4w9WgXcQ?si=CdhFErEl5dFB0Kj");
});

const pages = [
  "home",
  "explore",
  "settings",
  "profile",
  "preferences",
  "admin",
  "blog",
];

const errorPages = [
  400, // Bad Request
  401, // Unauthorized
  403, // Forbidden
  404, // Not Found
  405, // Method Not Allowed
  500, // Internal Server Error
  503, // Service Unavailable
];

errorPages.forEach((errorCode) => {
  app.get(`/${errorCode}`, verifyToken, (req, res) => {
    res.sendFile(path.join(__dirname, "html", `${errorCode}.html`));
  });
});

const adminpages = ["badges"];

pages.forEach((page) => {
  app.get(`/${page}`, verifyToken, (req, res) => {
    res.sendFile(path.join(__dirname, "html", `${page}.html`));
  });
});

adminpages.forEach((page) => {
  app.get(`/admin/${page}`, (req, res) => {
    res.sendFile(path.join(__dirname, "html", `${page}.html`));
  });
});

const sendErrorPage = (statusCode, fileName) => {
  return (req, res, next) => {
    res.status(statusCode).sendFile(path.join(__dirname, "html", fileName));
  };
};

app.use(sendErrorPage(404, "404.html"));
app.use(sendErrorPage(400, "400.html"));
app.use(sendErrorPage(401, "401.html"));
app.use(sendErrorPage(403, "403.html"));
app.use(sendErrorPage(405, "405.html"));
app.use(sendErrorPage(500, "500.html"));
app.use(sendErrorPage(503, "503.html"));

app.listen(PORT, () => {
  run().catch((error) =>
    console.error("Fehler beim Starten des Servers:", error)
  );
  console.log("Link: http://localhost:" + PORT + "/home");
});
