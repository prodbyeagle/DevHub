const userData = JSON.parse(localStorage.getItem("user"));
if (!userData || !userData.identifier) {
  console.error("User identifier not found in local storage");
} else {
  const username = userData.identifier;
  checkUserBanStatus(username);
}

async function checkUserBanStatus(username) {
  try {
    const userResponse = await fetch(`/api/profile/${username}`);
    const userDataResponse = await userResponse.json();
    if (userDataResponse.banned) {
      alert("You are Suspended from this Platform. ~ @admin");
      localStorage.clear();
      window.location.href = "/login";
    } else {
      document.body.classList.add("dark-mode");
    }
  } catch (error) {
    console.error("Error fetching user data:", error);
  }
}

function showNormalContent() {
  // Zeige den normalen Inhalt an
  document.body.classList.add("dark-mode");
}

async function fetchUserPosts() {
  const currentPath = window.location.pathname;
  const username = currentPath.split("/").pop().replace(/_/g, " "); // Benutzernamen extrahieren und Unterstriche durch Leerzeichen ersetzen
  try {
    const response = await fetch(`/api/${encodeURIComponent(username)}/posts`);
    const postsData = await response.json();
    if (postsData.length === 0) {
      renderNoPostsMessage(username); // Benutzernamen übergeben
    } else {
      renderPosts(postsData);
    }
  } catch (error) {
    console.error("Error fetching user posts:", error);
  }
}

const loggedInUser = localStorage.getItem("user");
const currentPath = window.location.pathname;
const username = decodeURIComponent(
  currentPath.split("/").pop().replace(/_/g, " ")
); // Leerzeichen im Benutzernamen behandeln
if (loggedInUser) {
  const loggedInUsername = JSON.parse(loggedInUser).identifier;
  if (loggedInUsername === username) {
    window.location.href = "/profile";
  }
}

function renderNoPostsMessage() {
  const currentPath = window.location.pathname;
  const username = decodeURIComponent(
    currentPath.split("/").pop().replace(/_/g, " ")
  ); // Leerzeichen im Benutzernamen behandeln
  const postsContainer = document.getElementById("user-posts");
  postsContainer.innerHTML = ""; // Clear previous posts

  const messageElement = document.createElement("p");
  messageElement.innerHTML = `😭 ${username} has no Posts! Tell him to post ASAP!`;
  postsContainer.appendChild(messageElement);
}

let activeContextMenu = null;

function renderPosts(posts) {
  const postsContainer = document.getElementById("user-posts");
  postsContainer.innerHTML = ""; // Clear previous posts

  posts.forEach((post) => {
    const postElement = document.createElement("div");
    postElement.classList.add(
      "post",
      "p-4",
      "rounded",
      "shadow",
      "mb-4",
      "relative"
    );

    const usernameElement = document.createElement("h3");
    usernameElement.textContent = `${post.date}`;

    const contentElement = document.createElement("p");
    const truncatedContent =
      post.content.length > 25
        ? post.content.substring(0, 25) + "..."
        : post.content;
    contentElement.textContent = truncatedContent;
    contentElement.style.maxWidth = "150px";
    contentElement.style.maxHeight = "150px";
    contentElement.style.overflowWrap = "break-word";
    contentElement.setAttribute("id", "content_" + post._id);

    const codeSnippetContainer = document.createElement("div"); // Wrapping container for code snippet
    codeSnippetContainer.classList.add("overflow-auto"); // Apply overflow-auto class for scrolling

    const truncatedCodeSnippet =
      post.codesnippet.length > 25
        ? post.codesnippet.substring(0, 25) + "..."
        : post.codesnippet;
    const codeSnippetElement = document.createElement("pre");
    codeSnippetElement.textContent = truncatedCodeSnippet;
    codeSnippetElement.style.overflowWrap = "break-word";
    codeSnippetElement.classList.add(
      "bg-gray-800",
      "text-white",
      "p-4",
      "rounded",
      "text-xs",
      "break-words" // Apply break-words class for word wrapping
    );

    postElement.addEventListener("click", function () {
      const overlayContent = document.getElementById("full-post-content");
      overlayContent.innerHTML = ""; // Clear previous content

      // Create HTML elements for post content
      const usernameHeader = document.createElement("h3");
      usernameHeader.textContent = `@${post.username} (${post.date})`;

      const contentParagraph = document.createElement("p");
      contentParagraph.textContent = post.content;

      const codeSnippetPre = document.createElement("pre");
      codeSnippetPre.classList.add(
        "bg-gray-800",
        "text-white",
        "p-4",
        "rounded",
        "text-xs",
        "break-words" // Apply break-words class for word wrapping
      );
      codeSnippetPre.textContent = post.codesnippet;

      // Add HTML elements to overlay content
      overlayContent.appendChild(usernameHeader);
      overlayContent.appendChild(contentParagraph);
      overlayContent.appendChild(codeSnippetPre);

      // Apply CSS to the overlay content to set overflow-y and word-wrap
      overlayContent.style.overflowY = "auto";
      overlayContent.style.wordWrap = "break-word";

      // Show the overlay
      const postOverlay = document.getElementById("post-overlay");
      postOverlay.classList.remove("hidden");

      // Disable scrolling of the page
      document.body.style.overflow = "hidden";

      // Add event listener to close the overlay when clicked outside
      postOverlay.addEventListener("click", function (event) {
        if (event.target === postOverlay) {
          postOverlay.classList.add("hidden");
          // Re-enable scrolling of the page
          document.body.style.overflow = "auto";
        }
      });
    });

    window.onload = async function () {
      try {
        const userDataString = localStorage.getItem("user");
        if (!userDataString) {
          console.error("User data not found in localStorage.");
          return;
        }

        const userData = JSON.parse(userDataString);
        const username = currentPath.split("/").pop().replace(/_/g, " ");

        const response = await fetch(`/api/${username}/badges`);
        const data = await response.json();
        const badges = data.badges;

        let activeBadge = null;

        // Suche nach dem aktiven Badge
        for (let i = 0; i < badges.length; i++) {
          if (badges[i].active === true) {
            activeBadge = badges[i];
            break;
          }
        }

        const responseUser = await fetch(`/api/${username}`);
        const userDataResponse = await responseUser.json();
        const users = userDataResponse.users;
        let currentUser = null;

        for (let i = 0; i < users.length; i++) {
          if (users[i].username === identifier) {
            currentUser = users[i];
            break;
          }
        }

        if (!currentUser) {
          console.error("User not found in the database.");
          return;
        }

        document.getElementById("profile-picture").src = currentUser.pb;
        document.getElementById("profile-username").innerText =
          currentUser.username;
        const profileUsernameElement =
          document.getElementById("profile-username");
        profileUsernameElement.textContent = `@${currentUser.username}`;

        // Anzeigen der Biografie im Profil
        const profileDescriptionElement = document.getElementById(
          "profile-description"
        );
        if (currentUser.bio) {
          profileDescriptionElement.innerText = currentUser.bio;
        } else {
          profileDescriptionElement.innerText = "❌ Bio not available";
        }

        // Anzeigen des aktiven Abzeichens neben dem Benutzernamen
        if (activeBadge && activeBadge.image) {
          const badgeImageElement = document.createElement("img");
          badgeImageElement.src = activeBadge.image;
          badgeImageElement.title = activeBadge.description;
          badgeImageElement.classList.add("badge-image");
          badgeImageElement.width = 20;
          badgeImageElement.height = 20;
          badgeImageElement.style.marginLeft = "10px";
          badgeImageElement.style.translate = "-5% 10%";
          badgeImageElement.style.borderRadius = "25%";
          profileUsernameElement.appendChild(badgeImageElement);
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      }
    };

    const contextMenu = createContextMenu(post._id);

    postElement.addEventListener("contextmenu", function (event) {
      event.preventDefault(); // Prevent the default right-click menu
      showContextMenu(contextMenu, event.clientX, event.clientY);
      return false;
    });

    postElement.appendChild(usernameElement);
    postElement.appendChild(contentElement);
    codeSnippetContainer.appendChild(codeSnippetElement);
    postElement.appendChild(codeSnippetContainer);
    postsContainer.appendChild(postElement);
  });
}

function createContextMenu(postId) {
  const contextMenu = document.createElement("div");
  contextMenu.classList.add(
    "dropdown-menu", // Add the class for dropdown menu styling
    "hidden",
    "absolute",
    "z-10",
    "bg-white",
    "border",
    "border-gray-200",
    "shadow",
    "rounded",
    "py-1"
  );
  contextMenu.setAttribute("id", "context-menu-" + postId);

  // Add menu items
  const ReportMenuItem = createMenuItem(
    "🛑 Report Post",
    "showEditForm",
    postId
  );

  contextMenu.appendChild(ReportMenuItem);

  // Add event listener to close context menu when clicking outside
  document.addEventListener("click", function (event) {
    if (!contextMenu.contains(event.target)) {
      hideContextMenu(contextMenu);
    }
  });

  document.body.appendChild(contextMenu);

  return contextMenu;
}

function showContextMenu(contextMenu, x, y) {
  // Close any active context menu
  if (activeContextMenu !== null) {
    hideContextMenu(activeContextMenu);
  }

  // Set new context menu position and display it
  contextMenu.style.left = x + "px";
  contextMenu.style.top = y + "px";
  contextMenu.classList.remove("hidden");
  activeContextMenu = contextMenu;
}

function hideContextMenu(contextMenu) {
  contextMenu.classList.add("hidden");
  activeContextMenu = null;
}

function createMenuItem(text, functionName, postId) {
  const menuItem = document.createElement("div");
  menuItem.textContent = text;
  menuItem.classList.add("px-4", "py-2", "hover:bg-gray-100", "cursor-pointer");
  menuItem.addEventListener("click", function () {
    // Call the corresponding function with postId
    window[functionName](postId);
    hideContextMenu(activeContextMenu); // Close context menu after clicking on a menu item
  });
  return menuItem;
}

applyHoverEffectToPosts();

function applyHoverEffect(postElement) {
  postElement.addEventListener("mouseenter", function () {
    this.style.transform = "scale(1.03)";
    this.style.boxShadow = "0 0 16px rgba(0, 0, 0, 0.1)";
  });
  postElement.addEventListener("mouseleave", function () {
    this.style.transform = "scale(1)";
    this.style.boxShadow =
      "4px 4px 8px rgba(0, 0, 0, 0.1), -4px -4px 8px rgba(255, 255, 255, 0.5)";
  });
}

function applyHoverEffectToPosts() {
  const posts = document.querySelectorAll(".post");
  posts.forEach((post) => {
    addHoverEffect(post);
  });
}

document.addEventListener("DOMContentLoaded", () => {
  const currentPath = window.location.pathname;
  const username = currentPath.split("/").pop();

  if (username) {
    fetchUserPosts(username);
    fetchAndDisplayFollowerCount(username);
  } else {
    console.error("Username not found in URL.");
  }
});

function loadModePreference() {
  const mode = localStorage.getItem("mode");
  if (mode === "light") {
    document.body.classList.remove("dark-mode");
    document.body.classList.add("light-mode");
  } else {
    document.body.classList.remove("light-mode");
    document.body.classList.add("dark-mode");
  }
  console.log("Mode Loaded:", mode);
}
loadModePreference();

window.onload = async function () {
  try {
    const currentPath = window.location.pathname;
    const username = currentPath.split("/").pop().replace(/ /g, "_");

    if (!username) {
      console.error("Username not found in URL.");
      return;
    }

    const [profileResponse, userResponse] = await Promise.all([
      fetch(`/api/profile/${username}`),
      fetch(`/api/username`),
    ]);

    const profileData = await profileResponse.json();
    const userData = await userResponse.json();

    const currentUser = userData.users.find(
      (user) => user.username === username
    );

    if (!currentUser) {
      console.error("User not found in the database.");
      return;
    }

    const profilePictureElement = document.getElementById("profile-picture");
    const profileUsernameElement = document.getElementById("profile-username");
    const profileDescriptionElement = document.getElementById(
      "profile-description"
    );

    profilePictureElement.src = currentUser.pb;
    profileUsernameElement.textContent = `@${currentUser.username}`;

    if (currentUser.bio) {
      profileDescriptionElement.innerText = currentUser.bio;
    } else {
      profileDescriptionElement.innerText = "❌ Bio not available";
    }

    const activeBadge = profileData.badges.find((badge) => badge.active);

    if (activeBadge && activeBadge.image) {
      const badgeImageElement = document.createElement("img");
      badgeImageElement.src = activeBadge.image;
      badgeImageElement.title = activeBadge.description;
      badgeImageElement.classList.add("badge-image");
      badgeImageElement.width = 20;
      badgeImageElement.height = 20;
      badgeImageElement.style.marginLeft = "10px";
      badgeImageElement.style.translate = "-5% 15%";
      badgeImageElement.style.borderRadius = "25%";
      profileUsernameElement.appendChild(badgeImageElement);
    }
  } catch (error) {
    console.error("Error fetching user data:", error);
  }
};

// Function to scroll to the top of the page with animation
function scrollToTop() {
  const c = document.documentElement.scrollTop || document.body.scrollTop;
  if (c > 0) {
    window.requestAnimationFrame(scrollToTop);
    window.scrollTo(0, c - c / 8);
  }
}

window.onscroll = function () {
  scrollFunction();
};

function scrollFunction() {
  const scrollToTopButton = document.querySelector(".scroll-to-top");
  const scrollPosition =
    document.documentElement.scrollTop || document.body.scrollTop;

  // Adjust the threshold value (50) to your desired scroll position before showing the button
  if (scrollPosition > 1200) {
    scrollToTopButton.style.display = "block";
  } else {
    scrollToTopButton.style.display = "none";
  }
}

// FOLLOWER

// Funktion zum Abrufen und Anzeigen der Anzahl der Follower für einen bestimmten Benutzer
async function fetchAndDisplayFollowerCount(username) {
  try {
    // URL-decodierten Benutzernamen erstellen
    const decodedUsername = decodeURIComponent(username);

    // API-Antwort mit den Benutzerdaten abrufen
    const response = await fetch(`/api/profile/${decodedUsername}`);

    const data = await response.json();

    // Überprüfen, ob die API-Antwort gültige Daten enthält
    if (!data || !data.follower) {
      console.error("Ungültige API-Antwort:", data);
      return;
    }

    // Anzahl der Follower des Benutzers abrufen und anzeigen
    let followerCount = data.follower || 0; // Falls kein Follower vorhanden ist, Standardwert 0 verwenden
    if (followerCount < 0) {
      followerCount = 0; // Sicherstellen, dass die Anzahl nicht negativ ist
    }

    // Anzahl der Benutzer, denen der aktuelle Benutzer folgt, abrufen
    const followingList = data.followers || []; // Liste der Benutzer, denen der aktuelle Benutzer folgt
    const followingCount = followingList.length; // Anzahl der Benutzer, denen der aktuelle Benutzer folgt

    // Namen der Benutzer, denen der aktuelle Benutzer folgt, anzeigen
    let followingNames = "";
    if (followingCount === 0) {
      followingNames = "😭 No Followers!";
    } else if (followingCount <= 3) {
      // Wenn es drei oder weniger Benutzer gibt, alle Namen anzeigen
      followingNames = followingList.join(", ");
    } else {
      // Wenn es mehr als drei Benutzer gibt, nur die ersten drei Namen anzeigen, gefolgt von "+10 andere"
      const firstThreeNames = followingList.slice(0, 3).join(", ");
      const remainingCount = followingCount - 3;
      followingNames = `${firstThreeNames} +${remainingCount} other`;
    }

    // Die angezeigten Namen in das HTML-Element einfügen
    const followingNamesElement = document.getElementById("following-names");
    followingNamesElement.textContent = followingNames;

    const followerCountElement = document.getElementById("follower-count");
    followerCountElement.textContent = followerCount;
  } catch (error) {
    console.error("Fehler beim Abrufen der Anzahl der Follower:", error);
  }
}

// Event-Listener für den Follow-Button hinzufügen
document
  .getElementById("follow-button")
  .addEventListener("click", toggleFollow);

// Funktion zum Folgen oder Entfolgen eines Benutzers
async function toggleFollow() {
  try {
    // Benutzerdaten aus dem Local Storage abrufen
    const userDataString = localStorage.getItem("user");
    if (!userDataString) {
      throw new Error("Benutzerdaten nicht im Local Storage gefunden.");
    }

    const userData = JSON.parse(userDataString);
    if (!userData || !userData.identifier) {
      throw new Error("Ungültige Benutzerdaten im Local Storage.");
    }

    const followerUsername = userData.identifier; // Benutzername des aktuellen Benutzers

    // Zielbenutzername aus dem HTML-Element entnehmen
    const followedUsernameElement = document.getElementById("profile-username");
    let followedUsername = followedUsernameElement.textContent.trim(); // Benutzername des Zielbenutzers ohne Leerzeichen am Anfang und Ende
    if (followedUsername.startsWith("@")) {
      followedUsername = followedUsername.slice(1); // Entferne das '@' am Anfang
    }

    // Daten, die an die API gesendet werden
    const requestData = {
      followerUsername: followerUsername,
      followedUsername: followedUsername,
    };

    // API-Anfrage senden, um dem ausgewählten Benutzer zu folgen oder ihn zu entfolgen
    const response = await fetch(`/api/update/follower`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestData),
    });

    if (!response.ok) {
      throw new Error("Fehler beim Ändern des Follow-Status.");
    }

    // Antwortdaten abrufen
    const responseData = await response.json();

    // Follower-Zähler aktualisieren
    const followerCountElement = document.getElementById("follower-count");
    let followerCount = parseInt(followerCountElement.textContent);

    if (response.status === 200) {
      // Benutzer hat erfolgreich den Zielbenutzer gefolgt
      followerCount++;
      document.getElementById("follow-button").textContent = "Followed";
      document.getElementById("follow-button").style.borderColor = "green";
      localStorage.setItem("followStatus", "followed"); // Follow-Status im Local Storage speichern
    } else if (response.status === 201) {
      // Benutzer hat erfolgreich den Zielbenutzer entfolgt
      followerCount--;
      document.getElementById("follow-button").textContent = "Follow";
      document.getElementById("follow-button").style.borderColor = "red";
      localStorage.setItem("followStatus", "follow"); // Follow-Status im Local Storage speichern
    }
    followerCountElement.textContent = followerCount;
  } catch (error) {
    console.error("Fehler beim Ändern des Follow-Status:", error);
  }
}
const followStatus = localStorage.getItem("followStatus");
if (followStatus === "followed") {
  document.getElementById("follow-button").textContent = "Followed";
  document.getElementById("follow-button").style.borderColor = "green";
} else if (followStatus === "follow") {
  document.getElementById("follow-button").textContent = "Follow";
  document.getElementById("follow-button").style.borderColor = "red";
}

// Event-Listener für alle Anpinn-Schaltflächen hinzufügen
document.querySelectorAll(".pin-button").forEach((button) => {
  button.addEventListener("click", async () => {
    const postId = button.closest(".post").dataset.postId;
    const pinned = await togglePinStatus(postId);
    if (pinned) {
      button.textContent = "Unpin";
    } else {
      button.textContent = "Pin";
    }
  });
});

// Funktion zum Umschalten des Anpinnstatus eines Posts
async function togglePinStatus(postId) {
  try {
    // Senden Sie eine Anfrage an den Server, um den Anpinnstatus des Posts zu ändern
    const response = await fetch(`/api/posts/${postId}/pin`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ postId: postId }),
    });
    if (!response.ok) {
      throw new Error("Fehler beim Umschalten des Anpinnstatus.");
    }
    const data = await response.json();
    return data.pinned; // Rückgabe des aktualisierten Anpinnstatus
  } catch (error) {
    console.error("Fehler beim Umschalten des Anpinnstatus:", error);
    return null;
  }
}

console.log(
  "%cWARNING! %cBe cautious!\nIf someone instructs you to paste something in here, it could be a scammer or hacker attempting to exploit your system. The Devolution Team would never ask for an Password!",
  "font-size: 20px; color: yellow;",
  "font-size: 14px; color: white;"
);
console.log(
  "%cWARNING! %cBe cautious!\nIf someone instructs you to paste something in here, it could be a scammer or hacker attempting to exploit your system. The Devolution Team would never ask for an Password!",
  "font-size: 20px; color: yellow;",
  "font-size: 14px; color: white;"
);
