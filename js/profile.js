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

document.addEventListener("DOMContentLoaded", () => {
  const userData = JSON.parse(localStorage.getItem("user"));
  if (userData) {
    const currentUsername = userData.identifier;
    fetchUserPosts(currentUsername);
    fetchAndDisplayFollowerCount(currentUsername);
    displayPinnedPosts;
  } else {
    console.error("User data not found in localStorage.");
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

async function fetchUserPosts(username) {
  try {
    const response = await fetch(`/api/${username}/posts`);
    const postsData = await response.json();
    if (postsData.length === 0) {
      renderNoPostsMessage();
    } else {
      renderPosts(postsData);
    }
  } catch (error) {
    console.error("Error fetching user posts:", error);
  }
}

function renderNoPostsMessage() {
  const postsContainer = document.getElementById("user-posts");
  postsContainer.innerHTML = ""; // Clear previous posts

  const messageElement = document.createElement("p");
  messageElement.textContent =
    "😭 No Posts! ...you can make an posts on your /home page";
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
  const editMenuItem = createMenuItem("✒️ Edit Post", "showEditForm", postId);
  const pinMenuItem = createMenuItem("📌 Pin Post", "pinPost", postId);
  const deleteMenuItem = createMenuItem("🚯 Delete Post", "deletePost", postId);

  contextMenu.appendChild(editMenuItem);
  contextMenu.appendChild(pinMenuItem);
  contextMenu.appendChild(deleteMenuItem);

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

window.onload = async function () {
  try {
    const userDataString = localStorage.getItem("user");
    if (!userDataString) {
      console.error("User data not found in localStorage.");
      return;
    }

    const userData = JSON.parse(userDataString);
    const identifier = userData.identifier;

    const response = await fetch(`/api/${identifier}/badges`);
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

    const responseUser = await fetch(`/api/username`);
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
    const profileUsernameElement = document.getElementById("profile-username");
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
      badgeImageElement.classList.add("badge-image");
      badgeImageElement.width = 15;
      badgeImageElement.height = 15;
      badgeImageElement.style.marginLeft = "10px";
      badgeImageElement.style.borderRadius = "25%";
      profileUsernameElement.appendChild(badgeImageElement);
    }
  } catch (error) {
    console.error("Error fetching user data:", error);
  }
};

// Funktion zum Anzeigen des Overlays
function showOverlay() {
  document.getElementById("bio-overlay").classList.remove("hidden");
}

// Funktion zum Schließen des Overlays
function closeOverlay() {
  document.getElementById("bio-overlay").classList.add("hidden");
  console.log("Close overlay");
}

// Funktion zum Speichern der Biografie
async function saveBio() {
  try {
    // Neue Biografie aus dem Eingabefeld abrufen
    const newBio = document.getElementById("bio-input").value;

    if (newBio.trim() === "") {
      Toastify({
        text: "You are very funny! but type something!!!",
        duration: 1000,
        close: false,
        gravity: "top", // Optionen: 'top', 'bottom', 'center'
        position: "right", // Optionen: 'left', 'right', 'center'
        backgroundColor: "linear-gradient(to right, #e74c3c, #e67e22)",
      }).showToast();
      return;
    }

    // Biografie-Anzeige im Profil aktualisieren
    document.getElementById("profile-description").innerText = newBio;

    // Benutzerdaten aus dem Local Storage abrufen
    const userData = JSON.parse(localStorage.getItem("user"));
    if (!userData) {
      console.error("User data not found in localStorage.");
      return;
    }

    // Benutzername und neue Biografie für die API-Anfrage vorbereiten
    const username = userData.identifier;

    // API-Anfrage senden, um die Biografie des Benutzers zu aktualisieren
    const response = await fetch("/api/update/bio", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ username, newBio }),
    });

    Toastify({
      text: "Bio was updated successfully",
      duration: 3000,
      close: true,
      gravity: "top", // Optionen: 'top', 'bottom', 'center'
      position: "right", // Optionen: 'left', 'right', 'center'
      backgroundColor: "linear-gradient(to right, #00b09b, #96c93d)",
    }).showToast();

    if (!response.ok) {
      throw new Error("Failed to update bio.");
    }

    // Overlay schließen
    closeBioOverlay();
  } catch (error) {
    console.error("Error saving bio:", error);
    // Hier können Sie eine Fehlermeldung anzeigen oder entsprechend reagieren
  }
}

function closeBioOverlay() {
  document.getElementById("bio-overlay").classList.add("hidden");
  console.log("Close overlay");
}

// Funktion zum Anzeigen der Zeichenanzahl und Anpassen der Farbe
function updateCharCount() {
  const bioInput = document.getElementById("bio-input");
  const charCountElement = document.getElementById("char-count");
  const remainingChars = 32 - bioInput.value.length;

  // Ändere die Farbe basierend auf der verbleibenden Zeichenanzahl
  if (remainingChars <= 10) {
    const redIntensity = Math.max(0, Math.min(255, remainingChars * 25));
    charCountElement.style.color = `rgb(255, ${redIntensity}, ${redIntensity})`;
  } else if (remainingChars <= 15) {
    charCountElement.style.color = "white";
  } else {
    charCountElement.style.color = "white"; // Standardfarbe
  }

  charCountElement.textContent = `${remainingChars} left`;
}

// Event-Listener für das Eingabefeld, um die Zeichenanzahl zu aktualisieren
document.getElementById("bio-input").addEventListener("input", updateCharCount);

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

  if (scrollPosition > 1200) {
    scrollToTopButton.style.display = "block";
  } else {
    scrollToTopButton.style.display = "none";
  }
}

// PROFILBILD UPLOAD

document
  .getElementById("profile-picture-upload")
  .addEventListener("change", async function (event) {
    try {
      const file = event.target.files[0]; // Die ausgewählte Datei aus dem Eingabefeld lesen
      if (!file) return;

      // Überprüfen, ob die Dateigröße größer als 1 MB ist
      if (file.size > 1024 * 1024) {
        // Wenn die Dateigröße größer als 1 MB ist, komprimiere das Bild
        const compressedFile = await compressImage(file);
        if (!compressedFile) return;
        uploadImage(compressedFile);
      } else {
        // Wenn die Dateigröße kleiner oder gleich 1 MB ist, lade das Bild ohne Komprimierung hoch
        uploadImage(file);
      }
    } catch (error) {
      console.error("Error uploading profile picture:", error);
      // Hier können Sie eine Fehlermeldung anzeigen oder entsprechend reagieren
    }
  });

async function compressImage(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = function (event) {
      const img = new Image();
      img.src = event.target.result;
      img.onload = function () {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");

        let maxSize = 100; // Maximale Breite und Höhe für das Bild

        // Überprüfen, ob das Bild größer als maxSize x maxSize ist
        if (img.width > maxSize || img.height > maxSize) {
          // Toastify({
          //     text: `Das Bild wird auf ${maxSize}x${maxSize} skaliert.`,
          //     backgroundColor: 'linear-gradient(to right, #ff416c, #ff4b2b)',
          //     className: 'info-toast'
          // }).showToast();

          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > maxSize) {
              height *= maxSize / width;
              width = maxSize;
            }
          } else {
            if (height > maxSize) {
              width *= maxSize / height;
              height = maxSize;
            }
          }

          canvas.width = width;
          canvas.height = height;
          ctx.drawImage(img, 0, 0, width, height);

          canvas.toBlob(
            (blob) => {
              const compressedFile = new File([blob], file.name, {
                type: "image/jpeg",
                lastModified: Date.now(),
              });
              resolve(compressedFile);
            },
            "image/jpeg",
            0.7
          ); // 0.7 ist die Bildqualität (0.0 - 1.0), ändern Sie dies nach Bedarf
        } else {
          // Bild ist bereits kleiner als die maximale Größe, daher keine Komprimierung erforderlich
          resolve(file);
        }
      };
    };
    reader.readAsDataURL(file);
  });
}

async function uploadImage(imageFile) {
  try {
    // Retrieve user data from local storage
    const userDataString = localStorage.getItem("user");
    if (!userDataString) {
      throw new Error("User data not found in local storage.");
    }
    const userData = JSON.parse(userDataString);
    if (!userData || !userData.identifier) {
      throw new Error("Invalid user data in local storage.");
    }
    const username = userData.identifier;

    // Convert the image to a base64 encoded string
    const reader = new FileReader();
    reader.readAsDataURL(imageFile);
    reader.onload = async function () {
      const base64Image = reader.result;

      // Create the JSON data object
      const jsonData = {
        username: username,
        newPB: base64Image,
      };

      const response = await fetch("/api/update/pb", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(jsonData),
      });

      if (!response.ok) {
        throw new Error("Error updating profile picture.");
      }

      Toastify({
        text: "Profile picture updated successfully.",
        duration: 3000,
        close: true,
        gravity: "top", // Options: 'top', 'bottom', 'center'
        position: "right", // Options: 'left', 'right', 'center'
        backgroundColor: "linear-gradient(to right, #00b09b, #96c93d)",
      }).showToast();

      // Update the profile picture
      document.getElementById("profile-picture").src = base64Image;
    };
  } catch (error) {
    Toastify({
      text: "Error updating profile picture: " + error.message,
      duration: 3000,
      close: true,
      gravity: "top", // Options: 'top', 'bottom', 'center'
      position: "right", // Options: 'left', 'right', 'center'
      backgroundColor: "linear-gradient(to right, #e74c3c, #e67e22)",
    }).showToast();
  }
}

// Function to fetch and display the number of followers for a specific user
async function fetchAndDisplayFollowerCount(username) {
  try {
    // Create URL-decoded username
    const decodedUsername = decodeURIComponent(username);

    // Fetch API response with user data
    const response = await fetch(`/api/profile/${decodedUsername}`);

    const data = await response.json();

    // Check if the API response contains valid data
    if (!data || !data.follower) {
      console.error("Invalid API response:", data);
      return;
    }

    // Retrieve and display the user's follower count
    let followerCount = data.follower || 0; // Use default value of 0 if no followers exist
    if (followerCount < 0) {
      followerCount = 0; // Ensure the count is not negative
    }

    const followerCountElement = document.getElementById("follower-count");
    followerCountElement.textContent = followerCount;
  } catch (error) {
    console.error("Error fetching follower count:", error);
  }
}

function deletePost(postId) {
  try {
    if (!postId) {
      throw new Error("Post ID is undefined");
    }

    // Zeige eine Bestätigungsdialog an
    const confirmed = confirm(
      "This will delete your post permanently! Are you sure you want this?"
    );

    // Wenn der Benutzer die Aktion bestätigt hat
    if (confirmed) {
      // Senden der Anfrage zum Löschen des Posts
      fetch(`/api/posts/delete/${postId}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      })
        .then((response) => {
          if (!response.ok) {
            throw new Error("Failed to delete post");
          }
          // Post erfolgreich gelöscht
          console.log(`Post with ID ${postId} successfully deleted`);
          // Seite neu laden
          window.location.reload();
        })
        .catch((error) => {
          console.error("Error deleting post:", error);
          // Hier könntest du eine Benachrichtigung anzeigen oder eine andere Fehlerbehandlung durchführen
        });
    }
  } catch (error) {
    console.error("Error deleting post:", error);
    // Hier könntest du eine Benachrichtigung anzeigen oder eine andere Fehlerbehandlung durchführen
  }
}

function pinPost(postId) {
  const username = JSON.parse(localStorage.getItem("user"));
  console.log("Post ID:", postId); // Überprüfen der Post-ID

  const requestOptions = {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
  };

  fetch(`/profile/${username}/pin-post/${postId}`, requestOptions)
    .then((response) => {
      if (!response.ok) {
        throw new Error("Failed to pin post.");
      }
      return response.json(); // Parse the response body as JSON
    })
    .then((data) => {
      console.log(data); // Log the parsed JSON response
      alert("Post pinned successfully.");
    })
    .catch((error) => {
      console.error("Error:", error);
    });
}

async function displayPinnedPosts(postId) {
  const username = JSON.parse(localStorage.getItem("user"));
  console.log("Post ID:", postId);
  try {
    const response = await fetch(`/profile/${postId}`);
    if (!response.ok) {
      throw new Error("Failed to fetch posts.");
    }
    const posts = await response.json();

    const postsContainer = document.getElementById("user-posts");
    postsContainer.innerHTML = ""; // Clear previous posts

    posts.forEach((post) => {
      const postElement = createPostElement(post);
      if (post.pinned) {
        postsContainer.prepend(postElement); // Append pinned post at the beginning
      } else {
        postsContainer.appendChild(postElement); // Append unpinned post at the end
      }
    });
  } catch (error) {
    console.error("Error:", error);
  }
}

function togglePostMenu(postId, event) {
  const menu = document.getElementById(`ham-burger-menu-content-${postId}`);

  if (!menu) {
    console.log(`Menu nicht gefunden`);
    return;
  }

  menu.classList.toggle("hidden");

  // Verhindern, dass das Klick-Event sich auf übergeordnete Elemente ausbreitet
  event.stopPropagation();
}

// Fügen Sie den Event-Listener für das Burger-Menü hinzu
document.addEventListener("click", function (event) {
  if (event.target.classList.contains("ham-burger-menu-btn")) {
    const postId = event.target.dataset.postId;
    if (postId) {
      togglePostMenu(postId);
    }
  } else {
    // Menü schließen, wenn außerhalb des Menübereichs geklickt wird
    const menus = document.querySelectorAll(".ham-burger-menu");
    menus.forEach((menu) => {
      if (!menu.contains(event.target)) {
        menu.classList.add("hidden");
      }
    });
  }
});

function showEditForm(postId) {
  const postsContainer = document.getElementById("user-posts");
  if (!postsContainer) {
    console.error("Posts container element not found.");
    return;
  }

  const postElement = postsContainer.querySelector(
    `[data-post-id="${postId}"]`
  );
  if (!postElement) {
    console.error(`Post element with ID ${postId} not found.`);
    return;
  }

  const contentElement = document.getElementById(`content_${postId}`);
  const codeSnippetElement = document.getElementById(`codesnippet_${postId}`);

  if (!contentElement || !codeSnippetElement) {
    console.error(
      "Content or Code snippet element not found within post element."
    );
    return;
  }

  const menuContent = document.getElementById(`ham-burger-menu-${postId}`);
  if (menuContent) {
    menuContent.style.display = "none";
  } else {
    console.error("Menu content element not found.");
  }

  const editContentInput = document.createElement("textarea");
  editContentInput.classList.add(
    "w-full",
    "p-2",
    "border",
    "border-grey-300",
    "rounded-md",
    "mb-4",
    "neumorphism-input"
  );
  editContentInput.setAttribute(
    "style",
    "resize: none; white-space: nowrap; font-family: Cascadia Code, sans-serif"
  );
  editContentInput.value = contentElement.textContent;

  const editCodeSnippetInput = document.createElement("textarea");
  editCodeSnippetInput.classList.add(
    "w-full",
    "p-2",
    "border",
    "border-grey-300",
    "rounded-md",
    "mb-4",
    "neumorphism-input"
  );
  editCodeSnippetInput.setAttribute(
    "style",
    "white-space: nowrap; font-family: Cascadia Code, sans-serif"
  );
  editCodeSnippetInput.value = codeSnippetElement.textContent;

  const saveButton = document.createElement("button");
  saveButton.textContent = "Save";
  saveButton.classList.add("neumorphism-button", "text-red-600", "mr-2");
  saveButton.onclick = function () {
    const conent = editContentInput.value;
    const codesnippet = editCodeSnippetInput.value;
    editPost(postId, conent, codesnippet);
    location.reload();
  };

  const cancelButton = document.createElement("button");
  cancelButton.textContent = "Cancel";
  cancelButton.classList.add("neumorphism-button", "text-red-600");
  cancelButton.onclick = function () {
    // Aktualisieren Sie die Seite, um den Bearbeitungsmodus zu beenden
    location.reload();
  };

  // Ersetzen Sie den bestehenden Inhalt und das Code-Snippet durch Bearbeitungseingaben
  contentElement.innerHTML = "";
  contentElement.appendChild(editContentInput);
  codeSnippetElement.innerHTML = "";
  codeSnippetElement.appendChild(editCodeSnippetInput);
  // Fügen Sie Speichern- und Abbrechen-Buttons hinzu
  contentElement.appendChild(saveButton);
  contentElement.appendChild(cancelButton);

  editButton.removeEventListener("click", showEditForm);
  deleteButton.removeEventListener("click", deletePost);
  pinButton.removeEventListener("click", pinPost);
}

// Funktion zum Bearbeiten eines Posts über eine Fetch-Anfrage
function editPost(postId, content, codesnippet) {
  console.log(postId);
  console.log(content);
  console.log(codesnippet);

  if (content.length === 0 && codesnippet.length === 0) {
    deletePost(postId);
    return; // Beende die Funktion, um sicherzustellen, dass nichts weiter ausgeführt wird
  }

  const date = new Date().toISOString();
  fetch(`/edit-post/${postId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      content: content,
      codesnippet: codesnippet,
      date: date,
    }),
  })
    .then((response) => {
      console.log("Response received:", response);
      if (!response.ok) {
        throw new Error("Failed to edit post.");
      }
      alert("Post edited successfully.");
    })
    .catch((error) => {
      console.error("Error editing post:", error);
    });
}

// Funktion zum Anzeigen der Badge-Info beim Überfahren des Bildes
function showBadgeInfo(name, description) {
  const badgeInfo = document.getElementById("badge-info");
  if (!badgeInfo) return;
  badgeInfo.innerHTML = `
        <h3>${name}</h3>
        <p>${description}</p>
    `;
  badgeInfo.classList.remove("hidden");
}

// Funktion zum Ausblenden der Badge-Info beim Verlassen des Bildes
function hideBadgeInfo() {
  const badgeInfo = document.getElementById("badge-info");
  if (!badgeInfo) return;
  badgeInfo.classList.add("hidden");
}

function loadBadges(username) {
  fetch(`/api/profile/${username}`)
    .then((response) => {
      if (!response.ok) {
        throw new Error("Network response was not ok");
      }
      return response.json();
    })
    .then((data) => {
      // Überprüfen, ob badges eine Eigenschaft des Datenobjekts ist und ob sie ein Array ist
      if (data.badges && Array.isArray(data.badges)) {
        displayBadges(data.badges);
      } else {
        throw new Error("Badges data is not in the expected format");
      }
    })
    .catch((error) => {
      console.error("Error loading badges:", error);
      Toastify({
        text: "Error loading badges: " + error.message,
        duration: 3000,
        gravity: "bottom",
        position: "center",
        backgroundColor: "linear-gradient(to right, #ff416c, #ff4b2b)",
      }).showToast();
    });
}

function showBadgeOverlay() {
  loadBadges(); // Lade die Badges des Benutzers
  const badgeOverlay = document.getElementById("badgeOverlay");
  badgeOverlay.classList.remove("hidden");
}

function closeBadgeOverlay() {
  const badgeOverlay = document.getElementById("badgeOverlay");
  badgeOverlay.classList.add("hidden");
}

async function loadBadges() {
  try {
    const userData = JSON.parse(localStorage.getItem("user"));
    const username = userData.identifier;
    const response = await fetch(`/api/profile/${username}`);
    const data = await response.json();

    if (response.ok) {
      displayBadges(data.badges);
    } else {
      throw new Error(data.error || "Failed to load badges");
    }
  } catch (error) {
    console.error("Error loading badges:", error);
  }
}

function displayBadges(badges) {
  const badgesContainer = document.getElementById("badges-container");
  badgesContainer.innerHTML = "";

  badges.forEach((badge) => {
    const badgeElement = document.createElement("img");
    badgeElement.src = badge.image;
    badgeElement.alt = badge.name;
    badgeElement.title = badge.name; // Setzen Sie den Namen als Titel-Attribut
    badgeElement.style.borderRadius = "25%";
    badgeElement.style.cursor = "pointer";
    badgeElement.style.margin = "10px";
    badgeElement.style.boxSizing = "border-box"; // Berücksichtigt die Border-Größe in der Elementgröße
    badgeElement.style.border = "1px solid transparent"; // Anfangs keine Umrandung
    badgeElement.classList.add("badge");

    badgeElement.addEventListener("mouseenter", () => {
      badgeElement.style.borderColor = "#ffffff"; // Ändere die Farbe der Umrandung beim Überfahren
      badgeElement.style.boxShadow = "0 0 0 1px #ffffff"; // Füge einen Schatten hinzu, um die Auswahl zu zeigen
    });

    badgeElement.addEventListener("mouseleave", () => {
      badgeElement.style.borderColor = "transparent"; // Setze die Umrandung zurück, wenn die Maus das Badge verlässt
      badgeElement.style.boxShadow = "none"; // Entferne den Schatten beim Verlassen des Badges
    });

    if (badge.active) {
      badgeElement.classList.add("active");
    }

    badgeElement.onclick = () => changeActiveBadge(badge.name);
    badgesContainer.appendChild(badgeElement);
  });
}

async function changeActiveBadge(badgeName) {
  try {
    // Benutzerdaten aus dem LocalStorage abrufen
    const userData = JSON.parse(localStorage.getItem("user"));
    const username = userData.identifier;

    // Deaktiviere alle Badges des Benutzers
    const deactivateResponse = await fetch(
      `/api/${username}/badges/deactivate-all/${badgeName}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ active: false }), // Deaktiviere alle Badges
      }
    );

    if (!deactivateResponse.ok) {
      throw new Error("Failed to deactivate badges");
    }

    // Aktiviere den ausgewählten Badge des Benutzers
    const activateResponse = await fetch(
      `/api/${username}/badges/${badgeName}/activate`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ active: true }), // Stelle sicher, dass das neue Badge aktiviert wird
      }
    );

    if (!activateResponse.ok) {
      throw new Error("Failed to activate badge");
    }

    Toastify({
      text: `${badgeName} was Activated!`,
      duration: 3000,
      close: true,
      gravity: "top", // Optionen: 'top', 'bottom', 'center'
      position: "right", // Optionen: 'left', 'right', 'center'
      backgroundColor: "linear-gradient(to right, #00b09b, #96c93d)",
    }).showToast();

    loadBadges();
    closeBadgeOverlay();
  } catch (error) {
    console.error("Error changing active badge:", error);
    // Fehlerbehandlung durchführen, z.B. Benutzernachricht anzeigen
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
