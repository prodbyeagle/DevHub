document.addEventListener('DOMContentLoaded', function() {
  const newBlogBtn = document.getElementById('new-blog-btn');
  const sendBlogBtn = document.getElementById('send-blog-btn');
  const cancelBtn = document.getElementById('cancel-btn');
  const newBlogOverlay = document.getElementById('neumorphism-form');

  // Ereignislistener für das Klicken auf den Button "Neuen Blog-Beitrag erstellen"
  newBlogBtn.addEventListener('click', function() {
    newBlogOverlay.classList.remove('hidden');
    newBlogOverlay.style.display = 'flex';
  });

  // Ereignislistener für das Klicken auf den Abbrechen-Button
  cancelBtn.addEventListener('click', function() {
    newBlogOverlay.classList.add('hidden');
    newBlogOverlay.style.display = 'none';
  });

  // Ereignislistener zum Hinzufügen eines neuen Blog-Beitrags beim Absenden des Formulars
  sendBlogBtn.addEventListener('click', addBlogPost);

  updateDateTexts();
  renderBlogPosts();
  checkUserPermissions();

  function loadModePreference() {
    const mode = localStorage.getItem('mode');
    if (mode === 'light') {
      document.body.classList.remove('dark-mode');
      document.body.classList.add('light-mode');
    } else {
      document.body.classList.remove('light-mode');
      document.body.classList.add('dark-mode');
    }
  }

  loadModePreference();

  // Funktion zum Formatieren des Datums in ein lesbares Format
  function formatDateTime(dateTime) {
    const postDate = new Date(dateTime);
    const now = new Date();
    const diff = Math.floor((now - postDate) / 1000); // Differenz in Sekunden

    if (diff < 60) {
      return `${diff}s ago`;
    } else if (diff < 3600) {
      const minutes = Math.floor(diff / 60);
      return `${minutes}m ago`;
    } else if (diff < 86400) {
      const hours = Math.floor(diff / 3600);
      return `${hours}h ago`;
    } else if (diff < 604800) {
      const days = Math.floor(diff / 86400);
      return `${days}d ago`;
    } else {
      const weeks = Math.floor(diff / 604800);
      return `${weeks}w ago`;
    }
  }

  // Fetch-Benutzerinformationen und überprüfen Sie die Berechtigungen
  async function checkUserPermissions() {
    try {
      // Den identifier aus dem Local Storage abrufen
      const userDataString = localStorage.getItem('user');
      const usernameData = JSON.parse(userDataString); // String in ein JavaScript-Objekt umwandeln
      const username = usernameData.identifier;

      // Die API-Route mit dem identifier aufrufen
      const response = await fetch(`/api/profile/${username}`); // Anpassen des Endpunkts entsprechend deiner API
      const userData = await response.json();

      if (userData.admin === false) {
        newBlogBtn.style.display = 'none'; // Verstecke den Button für Nicht-Admin-Benutzer
      }
    } catch (error) {
      console.error('Fehler beim Abrufen von Benutzerinformationen:', error);
    }
  }

  // Funktion zum Abrufen der echten Blog-Beiträge vom Backend
  async function fetchBlogPosts() {
    try {
      const response = await fetch('/api/blogs'); // Anpassen des Endpunkts entsprechend deiner API
      const blogPosts = await response.json();
      return blogPosts;
    } catch (error) {
      console.error('Fehler beim Abrufen der Blog-Beiträge:', error);
      return [];
    }
  }

  async function fetchProfilePicture(username) {
    try {
        const response = await fetch(`/api/profile/${username}`);
        if (!response.ok) {
            throw new Error('Failed to fetch profile picture');
        }
        const profile = await response.json();
        const profilePicture = profile.pb; // Retrieve the profile picture URL
        console.log('Profile picture URL for user', username + ':', profilePicture); // Log the profile picture URL
        return profilePicture; // Return the profile picture URL
    } catch (error) {
        console.error('Error fetching profile picture:', error);
        return null; // Return null if there's an error
    }
}

/// Funktion zum Rendern der Blog-Beiträge auf der Seite
async function renderBlogPosts() {
    const blogPosts = await fetchBlogPosts();
    const blogPostsContainer = document.getElementById('blog-posts');

    // Überprüfen, ob Blog-Beiträge vorhanden sind
    if (blogPosts.length === 0) {
        const noPostsMessage = document.createElement('p');
        noPostsMessage.textContent = '🥺 No blog posts!';
        blogPostsContainer.appendChild(noPostsMessage);
        return;
    }

    let lastActiveBadge; // Variable für das letzte aktive Badge
    let profilePicture;

    try {
        const userDataString = localStorage.getItem('user');
        const usernameData = JSON.parse(userDataString); // String in ein JavaScript-Objekt umwandeln
        const username = usernameData.identifier;
        const badgeResponse = await fetch(`/api/${username}/badges`);
        const badgeData = await badgeResponse.json();
        const profilePicture = await fetchProfilePicture(username); // Fetch profile picture

        // Überprüfen, ob die Antwort erfolgreich war
        if (badgeResponse.ok) {
            const badges = badgeData.badges;

            // Überprüfen, ob badges definiert ist und ein Array ist
            if (badges && Array.isArray(badges)) {
                // Filtern der aktiven Badges
                const activeBadges = badges.filter((badge) => badge.active);

                // Überprüfen, ob der Benutzer aktive Badges hat
                if (activeBadges.length > 0) {
                    // Nur das letzte aktive Badge des Benutzers verwenden
                    lastActiveBadge = activeBadges[activeBadges.length - 1];
                }
            }
        }
    } catch (error) {
        console.error('Fehler beim Abrufen der Badges:', error);
    }

    // Render blog posts
    for (const post of blogPosts.reverse()) {
        const postId = post._id;
        const postElement = document.createElement("article");
        postElement.classList.add("blog-post");

        const profilePictureHTML = profilePicture ? `<img src="${profilePicture}" alt="profile-picture" width="15" height="15" style="border-radius: 50%;">` : '';
        const authorInfo = `${profilePictureHTML} ${post.author}`;

        postElement.innerHTML = `
            <h2>${post.title}</h2>
            <p>${makeLinksClickable(post.content)}</p>
            <div class="post-image-container"></div>
            <p style="display: inline-block;">Author: ${authorInfo} ${lastActiveBadge ? `<img src="${lastActiveBadge.image}" alt="badge-icon" width="15" height="15" style="border-radius: 25%;">` : ''}</p>
            <p class="post-date" data-date-time="${post.date}">${formatDateTime(post.date)}</p>
        `;

        // Reaktionspanel für den Blog-Beitrag erstellen
        const reactionPanel = document.createElement('div');
        reactionPanel.classList.add('reaction-panel');

        // Reaktionen oder Reaktionsmöglichkeiten für den Blog-Beitrag anzeigen
        displayReactionsOrOptions(reactionPanel, postId); // Hier postId übergeben

        // Bild hinzufügen, wenn vorhanden
        if (post.image) {
            const imgElement = document.createElement("img");
            imgElement.src = post.image;
            imgElement.style.maxWidth = '100px';
            imgElement.style.maxHeight = '100px';
            imgElement.style.marginBottom = '10px'; 
            imgElement.style.borderRadius = '10px';
            imgElement.addEventListener('click', () => {
                displayImageOverlay(post.image);
            });

            // Das Bild in den Container einfügen
            const imageContainer = postElement.querySelector('.post-image-container');
            imageContainer.appendChild(imgElement);
        }

        postElement.appendChild(reactionPanel); // Reaktionspanel zum Blogbeitrag hinzufügen
        blogPostsContainer.appendChild(postElement);
    }
}

// Funktion zum Anzeigen eines Overlays mit dem vergrößerten Bild
function displayImageOverlay(imageSrc) {
  const overlay = document.createElement('div');
  overlay.classList.add('overlay');

  const enlargedImage = document.createElement('img');
  enlargedImage.src = imageSrc;
  enlargedImage.style.borderRadius = '10px'; // Abrundung des Bildes

  overlay.appendChild(enlargedImage);

  overlay.addEventListener('click', () => {
    overlay.remove(); // Overlay schließen, wenn darauf geklickt wird
  });

  document.body.appendChild(overlay);
}

  // Funktion zum Aktualisieren der Datumstexte auf der Seite
  function updateDateTexts() {
    const dateElements = document.querySelectorAll('.post-date');

    dateElements.forEach(element => {
      const dateTimeString = element.getAttribute('data-date-time');
      const formattedDateTime = formatDateTime(dateTimeString);

      element.textContent = formattedDateTime;
    });
  }

// Funktion zum Hinzufügen eines neuen Blog-Beitrags
async function addBlogPost(event) {
  event.preventDefault();

  const title = document.getElementById('title').value.trim(); // Trimmen, um Leerzeichen zu entfernen
  const content = document.getElementById('content').value.trim(); // Trimmen, um Leerzeichen zu entfernen
  
  // Überprüfen, ob Titel und Inhalt nicht leer sind
  if (!title || !content) {
    return;
  }

  const userDataString = localStorage.getItem('user');
  const usernameData = JSON.parse(userDataString);
  const author = usernameData.identifier;

  let base64Image = null; // Default-Wert für das Bild

  // Überprüfen, ob ein Bild ausgewählt wurde
  const imageFile = document.getElementById('image').files[0];
  if (imageFile) {
    base64Image = await convertImageToBase64(imageFile, 0.8, 1280, 720);
  }

  const newBlogPost = {
    title: title,
    content: content,
    author: author,
    date: new Date().toISOString(),
    reactions: [],
    image: base64Image,
  };

  try {
    const response = await fetch('/api/blogs', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(newBlogPost)
    });

    if (!response.ok) {
      throw new Error('Fehler beim Hinzufügen des Blog-Beitrags');
    }

    // Aktualisiere die Seite, um den neuen Blog-Beitrag anzuzeigen
    location.reload();
  } catch (error) {
    console.error('Fehler:', error);
  }
}

    setInterval(updateDateTexts, 1000);

});

function makeLinksClickable(content) {
  const linkPattern = /(https?:\/\/[^\s]+)/g;
  return content.replace(linkPattern, '<a href="$1" target="_blank">$1</a>');
}

async function displayReactionsOrOptions(container, postId) {
  const fixedEmojis = ['😀', '😍', '👍', '👎', '💩', '😡', '😭', '😱', '😂'];

  try {
      const response = await fetch(`/api/blogs/${postId}/reactions`);
      if (!response.ok) {
          throw new Error('Fehler beim Abrufen der Reaktionen');
      }

      const { reactions } = await response.json();

      if (reactions) {
          const reactionCounts = {};
          reactions.forEach(reaction => {
              const emoji = reaction.emoji;
              if (!reactionCounts[emoji]) {
                  reactionCounts[emoji] = 1;
              } else {
                  reactionCounts[emoji]++;
              }
          });

          fixedEmojis.forEach(emoji => {
              const countSpan = document.createElement('span');
              countSpan.textContent = reactionCounts[emoji] || 0;

              const emojiElement = document.createElement('span');
              emojiElement.textContent = emoji;
              emojiElement.classList.add('emoji');
              emojiElement.appendChild(countSpan);

              if (reactions.some(item => item.emoji === emoji)) {
                  emojiElement.classList.add('reacted');
              }

              emojiElement.addEventListener('click', async () => {
                  try {
                      const userIdentifier = JSON.parse(localStorage.getItem('user')).identifier;
                      const userReactions = JSON.parse(localStorage.getItem(`reactions_${postId}_${userIdentifier}`)) || {};

                      if (!userReactions[emoji]) {
                          // Benutzerreaktion hinzufügen
                          const reactionAdded = await addReactionToPost(postId, emoji, userIdentifier);
                          if (reactionAdded) {
                              userReactions[emoji] = 1;
                              countSpan.textContent = parseInt(countSpan.textContent) + 1;
                              emojiElement.classList.add('reacted');
                          }
                      } else {
                          // Benutzerreaktion entfernen
                          const reactionRemoved = await removeReactionFromPost(postId, emoji, userIdentifier);
                          if (reactionRemoved) {
                              delete userReactions[emoji];
                              countSpan.textContent = parseInt(countSpan.textContent) - 1;
                              emojiElement.classList.remove('reacted');
                          }
                      }

                      // Aktualisiere die Benutzerreaktionen im Local Storage
                      localStorage.setItem(`reactions_${postId}_${userIdentifier}`, JSON.stringify(userReactions));
                  } catch (error) {
                      console.error('Fehler:', error);
                  }
              });

              container.appendChild(emojiElement);
          });
      }
  } catch (error) {
      console.error('Fehler:', error);
  }
}

async function addReactionToPost(postId, reaction, userIdentifier) {
  try {
      const response = await fetch(`/api/blogs/${postId}/reactions`, {
          method: 'POST',
          headers: {
              'Content-Type': 'application/json'
          },
          body: JSON.stringify({ reaction: reaction, userIdentifier: userIdentifier })
      });
      if (!response.ok) {
          throw new Error('Fehler beim Hinzufügen der Reaktion');
      }
      // Reaktion erfolgreich hinzugefügt
      return true;
  } catch (error) {
      console.error('Fehler:', error);
      return false;
  }
}

async function removeReactionFromPost(postId, reaction, userIdentifier) {
  try {
      const response = await fetch(`/api/blogs/${postId}/reactions/remove`, {
          method: 'POST',
          headers: {
              'Content-Type': 'application/json'
          },
          body: JSON.stringify({ reaction: reaction, userIdentifier: userIdentifier })
      });
      if (!response.ok) {
          throw new Error('Fehler beim Entfernen der Reaktion');
      }
      // Reaktion erfolgreich entfernt
      return true;
  } catch (error) {
      console.error('Fehler:', error);
      return false;
  }
}

async function getReactionCountsForPost(postId) {
  try {
      const response = await fetch(`/api/blogs/${postId}/reactions`);
      if (!response.ok) {
          throw new Error('Fehler beim Abrufen der Reaktionen');
      }

      const { reactions } = await response.json();

      // Zähler für jeden Emoji initialisieren
      const reactionCounts = {};
      reactions.forEach(reaction => {
          const emoji = reaction.emoji;
          if (!reactionCounts[emoji]) {
              reactionCounts[emoji] = 1;
          } else {
              reactionCounts[emoji]++;
          }
      });

      return reactionCounts;
  } catch (error) {
      console.error('Fehler:', error);
      return {};
  }
}

async function getUserReactions(postId, userIdentifier) {
  try {
    const response = await fetch(`/api/blogs/${postId}/userReactions/${userIdentifier}`);
    if (!response.ok) {
      throw new Error('Fehler beim Abrufen der Benutzerreaktionen');
    }

    const { userReactions } = await response.json();
    return userReactions;
  } catch (error) {
    console.error('Fehler:', error);
    return {};
  }
}

async function updateUserReactions(postId, userIdentifier, userReactions) {
  try {
    const response = await fetch(`/api/blogs/${postId}/userReactions/${userIdentifier}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ userReactions })
    });
    if (!response.ok) {
      throw new Error('Fehler beim Aktualisieren der Benutzerreaktionen');
    }
  } catch (error) {
    console.error('Fehler:', error);
  }
}

// BILDER

// Funktion zum Konvertieren des Bilds in Base64 mit bestimmter Qualität und maximaler Größe
function convertImageToBase64(file, quality, maxWidth, maxHeight) {
  return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
          const img = new Image();
          img.onload = () => {
              let width = img.width;
              let height = img.height;

              // Überprüfe, ob die Breite oder Höhe größer als die maximale Größe ist
              if (width > maxWidth || height > maxHeight) {
                  // Skaliere das Bild proportional, um es auf die maximale Größe zu bringen
                  const ratio = Math.min(maxWidth / width, maxHeight / height);
                  width *= ratio;
                  height *= ratio;
              }

              const canvas = document.createElement('canvas');
              const ctx = canvas.getContext('2d');
              canvas.width = width;
              canvas.height = height;
              ctx.drawImage(img, 0, 0, width, height);

              const base64String = canvas.toDataURL('image/jpeg', quality);
              resolve(base64String);
          };
          img.onerror = reject;
          img.src = reader.result;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
  });
}



console.log('%cWARNING! %cBe cautious!\nIf someone instructs you to paste code here, it could be a scammer or hacker attempting to exploit your system.', 'font-size: 20px; color: yellow;', 'font-size: 14px; color: white;');
console.log('%cWARNING! %cBe cautious!\nIf someone instructs you to paste code here, it could be a scammer or hacker attempting to exploit your system.', 'font-size: 20px; color: yellow;', 'font-size: 14px; color: white;');
console.log('%cWARNING! %cBe cautious!\nIf someone instructs you to paste code here, it could be a scammer or hacker attempting to exploit your system.', 'font-size: 20px; color: yellow;', 'font-size: 14px; color: white;');
console.log('%cWARNING! %cBe cautious!\nIf someone instructs you to paste code here, it could be a scammer or hacker attempting to exploit your system.', 'font-size: 20px; color: yellow;', 'font-size: 14px; color: white;');
