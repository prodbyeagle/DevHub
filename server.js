const express = require("express");
const path = require("path");
const bodyParser = require("body-parser");
const cors = require("cors");
const { MongoClient, ServerApiVersion } = require("mongodb");
const session = require("express-session");
const crypto = require("crypto");
require("dotenv").config();
const { ObjectId } = require("mongodb");
const http = require("http");

const app = express();
const PORT = process.env.PORT || 3000;
const server = http.createServer(app);

const sessionSecret = require("crypto").randomBytes(64).toString("hex");


app.use(express.static(path.join(__dirname, "public")));
app.use(express.static(path.join(__dirname, "html")));
app.use("/js", express.static(path.join(__dirname, "js")));
app.use("/css", express.static(path.join(__dirname, "css")));
app.use('/assets', express.static(path.join(__dirname, 'assets')));

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));
app.use(bodyParser.json());
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
      
      return res.status(404).send("Benutzer nicht gefunden");
    }

    
    res.sendFile(path.join(__dirname, "public", "profile.html"));
  } catch (error) {
    console.error("Fehler beim Laden des Benutzerprofils:", error);
    
    res.status(500).send("Interner Serverfehler");
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
    res.status(500).json({ error: "Interner Serverfehler" });
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
        res.status(500).send("Failed to pin post");
        return;
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
    res.status(500).json({ error: "Interner Serverfehler" });
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
    res.status(500).json({ error: "Interner Serverfehler" });
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
    res.status(500).json({ error: "Interner Serverfehler" });
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
    res.status(500).json({ error: "Interner Serverfehler" });
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
    res.status(500).json({ error: "Internal Server Error" });
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
        res.status(500).send("Failed to pin post");
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
      res.status(500).send("Failed to fetch post");
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
        res.status(500).send("Failed to edit post");
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
    res.status(500).json({ error: "Internal Server Error" });
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
    res.status(500).json({ error: "Internal Server Error" });
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
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.post("/login", async (req, res) => {
  const { identifier, password } = req.body; 

  try {
    
    const user = await usersCollection.findOne({
      $or: [{ username: identifier }],
    });

    if (user && user.password === password) {
      
      console.log(
        `Successful login for user: ${identifier} at ${new Date().toISOString()}`
      );
      req.session.userId = user._id;
      return res.redirect("/home");
    } else {
      return res.status(401).send("Invalid email or password");
    }
  } catch (error) {
    
    console.error("Error during Login:", error);
    return res.status(500).send("Internal Server Error");
  }
});

app.post("/signup", async (req, res) => {
  const { email, password, username, pb } = req.body;

  try {
    const existingUserByUsername = await usersCollection.findOne({ username });

    if (existingUserByUsername) {
      return res.status(400).send("Username already taken");
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
    res.status(500).send("Internal Server Error");
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

    res
      .status(200)
      .json({
        message: "Benutzervorlieben erfolgreich aktualisiert",
        user: updatedUser.value,
      });
  } catch (err) {
    console.error("Fehler beim Aktualisieren der Benutzervorlieben:", err);
    res.status(500).json({ message: "Interner Serverfehler" });
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
    res.status(500).json({ message: "Interner Serverfehler" });
  }
});


app.delete("/admin/delete-posts", async (req, res) => {
  try {
    const collection = db.collection("posts");
    await collection.deleteMany({});
    res.status(200).json({ message: "Posts collection deleted successfully" });
  } catch (error) {
    console.error("Error deleting posts collection:", error);
    res.status(500).json({ message: "Failed to delete posts collection" });
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
    res.status(500).json({ error: "Internal Server Error" });
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
    return res.status(500).json({ error: "Internal Server Error" });
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
    return res.status(500).json({ error: "Internal Server Error" });
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
    return res.status(500).json({ error: "Internal Server Error" });
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
    return res.status(500).json({ error: "Internal Server Error" });
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
    return res.status(500).json({ error: "Internal Server Error" });
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
    return res.status(500).json({ error: "Internal Server Error" });
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
    res.status(500).send("Internal Server Error");
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
    res.status(500).send("Internal Server Error");
  }
});


app.post("/posts/:postId/like", async (req, res) => {
  try {
    const postId = req.params.postId;
    const postsCollection = db.collection("posts");

    const result = await postsCollection.updateOne(
      { _id: new ObjectId(postId) },
      { $inc: { likes: 1 } }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ message: "Beitrag nicht gefunden" });
    }

    res.json({ message: "Like gespeichert" });
  } catch (error) {
    console.error("Fehler beim Speichern des Likes:", error);
    res.status(500).json({ message: "Interner Serverfehler" });
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
    res.status(500).json({ message: "Interner Serverfehler" });
  }
});


app.post("/posts/:postId/unlike", async (req, res) => {
  try {
    const postId = req.params.postId;
    const postsCollection = db.collection("posts");

    const result = await postsCollection.updateOne(
      { _id: new ObjectId(postId) },
      { $inc: { likes: -1 } } 
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ message: "Beitrag nicht gefunden" });
    }

    res.json({ message: "Like entfernt" });
  } catch (error) {
    console.error("Fehler beim Entfernen des Likes:", error);
    res.status(500).json({ message: "Interner Serverfehler" });
  }
});


function generateRandomPassword() {
  const length = 10; 
  return crypto
    .randomBytes(Math.ceil(length / 2))
    .toString("hex") 
    .slice(0, length); 
}


function sanitizeUsername(username) {
  const regex = /^[a-zA-Z0-9_]+$/;
  if (!regex.test(username)) {
    username = username.replace(/[^a-zA-Z0-9_]/g, "_");
  }
  return username;
}

const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL,
    },
    async (accessToken, refreshToken, profile, done) => {
      const collection = db.collection("users");

      try {
        const userEmail =
          profile.emails && profile.emails.length > 0
            ? profile.emails[0].value
            : null;
        const userPhoto =
          profile.photos && profile.photos.length > 0
            ? profile.photos[0].value
            : null;

        const existingUser = await collection.findOne({ email: userEmail });

        if (existingUser) {
          return done(null, existingUser);
        } else {
          const randomPassword = generateRandomPassword(); 
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
        console.error("Error processing Google authentication:", error);
        return done(error, null);
      }
    }
  )
);


app.post(
  "/auth/google/callback",
  passport.authenticate("google", { failureRedirect: "/login" }),
  (req, res) => {
    res.status(200).json({
      username: req.user.username,
      password: req.user.password,
    });
  }
);

app.get(
  "/auth/google/callback",
  passport.authenticate("google", { failureRedirect: "/login" }),
  (req, res) => {
    if (req.user && req.user.username && req.user.password) {
      
      const user = {
        identifier: req.user.username,
        password: req.user.password,
      };
      res.redirect("/login?user=" + encodeURIComponent(JSON.stringify(user)));
    } else {
      console.error("Error: User username or password not found.");
      res.redirect("/login"); 
    }
  }
);

passport.serializeUser((user, done) => {
  done(null, user);
});

passport.deserializeUser((user, done) => {
  done(null, user);
});
app.get(
  "/auth/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);
app.use(passport.initialize());
app.use(passport.session());





const { v4: uuidv4 } = require("uuid");
const GitHubStrategy = require("passport-github2").Strategy;

passport.use(
  new GitHubStrategy(
    {
      clientID: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
      callbackURL: process.env.GITHUB_CALLBACK_URL,
      scope: ["user:email"],
    },
    async (accessToken, refreshToken, profile, done) => {
      const collection = db.collection("users");

      try {
        const userEmail = profile.emails ? profile.emails[0].value : null;
        const userPhoto = profile.photos ? profile.photos[0].value : null;

        let existingUser = await collection.findOne({ email: userEmail });

        if (existingUser) {
          if (existingUser.githubUsername === profile.username) {
            console.log('Logging in with existing user:', existingUser);
            return done(null, existingUser);
          } else {
            // Wenn der GitHub-Benutzername mit einem anderen Konto verknüpft ist,
            // können Sie ihn hier behandeln, z.B. eine Nachricht zurückgeben
            console.log('GitHub username already associated with another account');
            return done(null, false, { message: 'GitHub username already associated with another account' });
          }
        } else {
          const randomPassword = uuidv4();
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
        console.error("Error processing GitHub authentication:", error);
        return done(error, null);
      }
    }
  )
);

app.post(
  "/auth/github/callback",
  passport.authenticate("github", { failureRedirect: "/login" }),
  (req, res) => {
    // Benutzerdaten aus der Anfrage abrufen
    const { username, password } = req.user;

    // Benutzerdaten an das Frontend senden
    res.status(200).json({ username, password });
  }
);

app.get(
  "/auth/github/callback",
  passport.authenticate("github", { failureRedirect: "/login" }),
  async (req, res) => {
    if (req.user && req.user.username && req.user.password) {
      const user = {
        identifier: req.user.username,
        password: req.user.password,
      };

      try {
        // Überprüfen, ob der Benutzername bereits vorhanden ist
        const existingUser = await db.collection("users").findOne({ username: user.identifier });

        if (existingUser) {
          console.log(`User ${user.identifier} already exists`);
          // Benutzername bereits vorhanden, also vorhandenen Benutzer einloggen
          res.redirect("/login?user=" + encodeURIComponent(JSON.stringify(user)));
        } else {
          // Benutzername nicht vorhanden, neuen Benutzer hinzufügen
          await db.collection("users").insertOne({
            username: user.identifier,
            password: user.password,
            // Andere Benutzerdaten hier hinzufügen
          });

          // Neue Benutzerdaten einloggen
          res.redirect("/login?user=" + encodeURIComponent(JSON.stringify(user)));
        }
      } catch (error) {
        console.error("Error checking username or adding new user:", error);
        res.redirect("/login");
      }
    } else {
      console.error("Error: User username or password not found.");
      res.redirect("/login"); 
    }
  }
);

passport.serializeUser((user, done) => {
  done(null, user);
});

passport.deserializeUser((user, done) => {
  done(null, user);
});

app.get("/auth/github", passport.authenticate("github"));
app.use(passport.initialize());
app.use(passport.session());




let errorList = [];
let errorIdCounter = 1;


app.post("/api/admin/error", (req, res) => {
  try {
    const { message } = req.body;

    if (!message) {
      throw new Error("Message is required");
    }

    
    const existingError = errorList.find((error) => error.message === message);

    if (existingError) {
      existingError.count++; 
      console.log("Error message stacked:", message);
    } else {
      
      const errorId = generateErrorId();

      
      errorList.push({ id: errorId, message, count: 1, timestamp: new Date() });
      console.log("New error message received:", message);
    }

    res.status(201).json({ success: true });
  } catch (error) {
    console.error("Error receiving error message:", error.message);
    res.status(400).json({ success: false, error: error.message });
  }
});


function generateErrorId() {
  return errorIdCounter++;
}


app.delete("/api/admin/errors/:errorId", (req, res) => {
  try {
    const errorId = req.params.errorId;

    
    if (!errorId || isNaN(errorId)) {
      throw new Error("Invalid Error ID");
    }

    
    const index = errorList.findIndex((error) => error.id == errorId);

    
    if (index !== -1) {
      errorList.splice(index, 1);
      res.status(200).json({ success: true });
    } else {
      
      res.status(404).json({ success: false, error: "Error not found" });
    }
  } catch (error) {
    console.error("Error deleting error:", error.message);
    res.status(400).json({ success: false, error: error.message });
  }
});


app.get("/api/admin/errors", (req, res) => {
  try {
    res.json(errorList);
  } catch (error) {
    console.error("Error retrieving error log:", error.message);
    res.status(500).json({ success: false, error: "Internal Server Error" });
  }
});


app.get("/api/admin/badges", async (req, res) => {
  try {
    const badgesCollection = db.collection("badges");
    const badges = await badgesCollection.find({}).toArray();
    res.json(badges);
  } catch (error) {
    console.error("Fehler beim Abrufen der Badges:", error);
    res.status(500).json({ error: "Fehler beim Abrufen der Badges" });
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
    res.status(500).json({ error: "Interner Serverfehler" });
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
      message:
        "Badge erfolgreich hinzugefügt",
    });
  } catch (error) {
    console.error("Fehler beim Hinzufügen des Badges:", error);
    res.status(500).json({ error: "Fehler beim Hinzufügen des Badges" });
  }
});

app.post("/api/admin/assign-badge", async (req, res) => {
  const { badgeName, badgeImage, badgeDescription, username } = req.body;
  try {
    
    const userExists = await db
      .collection("users")
      .findOne({ username: username });
    if (!userExists) {
      throw new Error("Benutzer nicht gefunden");
    }

    
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

    res.json(result.value); 
  } catch (error) {
    console.error("Fehler beim Zuweisen des Badges zum Benutzer:", error);
    res.status(500).json({ error: error.message });
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
    res.status(500).json({ error: "Interner Serverfehler" });
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
    res.status(500).json({ error: "Interner Serverfehler" });
  }
});


app.put("/api/:username/badges/:name/activate", async (req, res) => {
  const { username, name } = req.params;
  const { active } = req.body;

  try {
    console.log(`Aktiviere Badge ${name} für Benutzer ${username}`);

    const badge = await usersCollection.findOne({ username: username, "badges.name": name });

    if (badge) {
      // Aktiviere das ausgewählte Badge des Benutzers
      await usersCollection.updateOne(
        { name: name, username: username },
        { $set: { active: active } }
      );

      console.log(`Badge ${name} erfolgreich ${active ? "aktiviert" : "deaktiviert"}`);
      
      res.status(200).json({
        message: `Badge "${name}" erfolgreich ${active ? "aktiviert" : "deaktiviert"}`,
      });
    } else {
      console.log(`Badge ${name} nicht gefunden`);

      res.status(404).json({ error: `Badge "${name}" nicht gefunden` });
    }
  } catch (error) {
    console.error("Fehler beim Aktivieren oder Deaktivieren des Badges:", error);
    res.status(500).json({ error: "Interner Serverfehler" });
  }
});

app.put("/api/:username/badges/deactivate-all/:badgeName", async (req, res) => {
  const { username, badgeName } = req.params; // Benutzername und Name des ausgewählten Badges aus den Anforderungsparametern
  let skippedBadgeName = null; // Variable zum Speichern des Namens des übersprungenen Badges

  try {
    console.log(`Deaktiviere alle Badges außer dem ausgewählten Badge für Benutzer ${username}`);
    console.log("------");

    // Holen Sie sich den Benutzer und seine Badges
    const user = await usersCollection.findOne({ username: username });
    const badges = user.badges;

    // Deaktivieren Sie alle Badges des Benutzers, die aktiv sind, außer dem ausgewählten Badge
    for (let i = 0; i < badges.length; i++) {
      if (badges[i].name === badgeName) {
        skippedBadgeName = badgeName; // Speichern Sie den Namen des übersprungenen Badges
        console.log(`Badge "${badgeName}" übersprungen`);
        continue; // Überspringen Sie das ausgewählte Badge
      }
    
      if (badges[i].active === true) {
        console.log(`Deaktiviere Badge "${badges[i].name}"`);
        await usersCollection.updateOne(
          { username: username, "badges.name": badges[i].name },
          { $set: { "badges.$.active": false } }
        );
        console.log(`Badge "${badges[i].name}" erfolgreich deaktiviert`);
      }
    }

    console.log(`Alle Badges außer dem ausgewählten Badge erfolgreich deaktiviert. Übersprungenes Badge: ${skippedBadgeName}`);
    console.log("------");

    res.status(200).json({ message: `Alle Badges außer dem ausgewählten Badge erfolgreich deaktiviert. Übersprungenes Badge: ${skippedBadgeName}` });
  } catch (error) {
    console.error("Fehler beim Deaktivieren aller Badges außer dem ausgewählten Badge:", error);
    res.status(500).json({ error: "Interner Serverfehler" });
  }
});

app.get("/api/badges/active", async (req, res) => {
  try {
    const activeBadges = await usersCollection
      .find({ active: true })
      .toArray();
    res.json(activeBadges);
  } catch (error) {
    console.error("Fehler beim Abrufen der aktiven Badges:", error);
    res.status(500).json({ error: "Fehler beim Abrufen der aktiven Badges" });
  }
});


app.post("/api/blogs", async (req, res) => {
  const { title, content, author, date, reactions, image } = req.body;

  
  try {
    const newPost = { title, content, author, date, reactions, image }; 
    const result = await blogCollection.insertOne(newPost);
    console.log(`Blog-Beitrag mit ID ${result.insertedId} hinzugefügt`);
    res.status(201).json(newPost);
  } catch (error) {
    console.error("Fehler beim Hinzufügen des Blog-Beitrags:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});


app.get("/api/blogs", async (req, res) => {
  try {
    const blogPosts = await blogCollection.find({}).toArray();
    res.status(200).json(blogPosts);
  } catch (error) {
    console.error("Fehler beim Abrufen der Blog-Beiträge:", error);
    res.status(500).json({ error: "Internal server error" });
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
    res.status(500).json({ error: "Internal server error" });
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
    res.status(500).json({ error: "Internal server error" });
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
    res.status(500).json({ error: "Internal server error" });
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
    res.status(500).json({ error: "Internal server error" });
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
    res.status(500).json({ error: "Internal server error" });
  }
});

app.get("/api/blogs/:postId", async (req, res) => {
  const postId = new ObjectId(req.params.postId);
  try {
    const blogPost = await blogCollection.findOne({ _id: ObjectId(postId) });
    res.status(200).json(blogPost);
  } catch (error) {
    console.error("Fehler beim Abrufen des Blog-Beitrags:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

const pages = [
  "home",
  "explore",
  "settings",
  "profile",
  "login",
  "signup",
  "preferences",
  "admin",
  "blog",
];
const adminpages = ["badges"];

pages.forEach((page) => {
  app.get(`/${page}`, (req, res) => {
    res.sendFile(path.join(__dirname, "html", `${page}.html`));
  });
});

adminpages.forEach((page) => {
  app.get(`/admin/${page}`, (req, res) => {
    res.sendFile(path.join(__dirname, "html", `${page}.html`));
  });
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'html', 'landing.html'));
});

app.listen(PORT, () => {
    run().catch((error) =>
      console.error("Fehler beim Starten des Servers:", error)
    );
    console.log("Link: http://localhost:" + PORT + "/home");
  });
  
