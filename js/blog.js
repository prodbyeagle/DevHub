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

/// Funktion zum Rendern der Blog-Beiträge auf der Seite
async function renderBlogPosts() {
  const blogPosts = await fetchBlogPosts();
  const blogPostsContainer = document.getElementById('blog-posts');
  
  // Überprüfen, ob Blog-Beiträge vorhanden sind
  if (blogPosts.length === 0) {
    const noPostsMessage = document.createElement('p');
    noPostsMessage.textContent = 'Keine Blog-Beiträge gefunden.';
    blogPostsContainer.appendChild(noPostsMessage);
    return;
  }
  
  // Blog-Beiträge auf der Seite rendern
  blogPosts.reverse().forEach(post => {
    const postElement = document.createElement("article");
    postElement.classList.add("blog-post");
    postElement.innerHTML = `
      <h2>${post.title}</h2>
      <p>${post.content}</p>
      <p>Author: ${post.author}</p>
      <p class="post-date" data-date-time="${post.date}">${formatDateTime(post.date)}</p>
    `;

    // Reaktionspanel für den Blog-Beitrag erstellen
    const reactionPanel = document.createElement('div');
    reactionPanel.classList.add('reaction-panel');

    // Reaktionen oder Reaktionsmöglichkeiten für den Blog-Beitrag anzeigen
    displayReactionsOrOptions(post.reactions, reactionPanel, post._id);

    if (post.images) {
      post.images.forEach(image => {
        const imgElement = document.createElement("img");
        imgElement.src = image;
        postElement.appendChild(imgElement);
      });
    }

    postElement.appendChild(reactionPanel); // Reaktionspanel zum Blogbeitrag hinzufügen
    blogPostsContainer.appendChild(postElement);
  });
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
  
      const title = document.getElementById('title').value;
      const content = document.getElementById('content').value;
      const userDataString = localStorage.getItem('user');
      const usernameData = JSON.parse(userDataString); // String in ein JavaScript-Objekt umwandeln
      const author = usernameData.identifier;
  
      const newBlogPost = {
        title: title,
        content: content,
        author: author,
        date: new Date().toISOString(),
        reactions: []
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

async function addReactionToPost(postId, reaction, userIdentifier) {
  try {
      const response = await fetch(`/api/blogs/${postId}/reactions`, {
          method: 'POST',
          headers: {
              'Content-Type': 'application/json'
          },
          body: JSON.stringify({ reaction: reaction, userIdentifier: userIdentifier }) // Benutzername hinzufügen
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

//FIXME: Reactions statt LocalStorage in Der DB laden und Fetchen

async function removeReactionFromPost(postId, reaction, userIdentifier) {
  try {
      const response = await fetch(`/api/blogs/${postId}/reactions/remove`, {
          method: 'POST',
          headers: {
              'Content-Type': 'application/json'
          },
          body: JSON.stringify({ reaction: reaction, userIdentifier: userIdentifier }) // Benutzername hinzufügen
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

// Funktion zum Abrufen von Reaktionen für einen Blogbeitrag
async function getReactionsForPost(postId) {
  try {
      const response = await fetch(`/api/blogs/${postId}/reactions`);
      if (!response.ok) {
          throw new Error('Fehler beim Abrufen der Reaktionen');
      }

      const { reactions } = await response.json();
      return reactions;
  } catch (error) {
      console.error('Fehler:', error);
      return [];
  }
}

function displayReactionsOrOptions(reactions, container, postId) {
  const fixedEmojis = ['😀', '😍', '👍', '👎', '💩', '😡', '😭', '😱', '😂'];

  const userIdentifier = JSON.parse(localStorage.getItem('user')).identifier;

  if (reactions) {
    const userReactions = JSON.parse(localStorage.getItem(`reactions_${postId}_${userIdentifier}`)) || {}; // Reaktionen des aktuellen Benutzers aus dem Local Storage lesen

    fixedEmojis.forEach(emoji => {
      const countSpan = document.createElement('span');
      countSpan.textContent = userReactions[emoji] || 0;

      const emojiElement = document.createElement('span');
      emojiElement.textContent = emoji;
      emojiElement.classList.add('emoji');
      emojiElement.appendChild(countSpan);

      if (reactions.some(item => item.emoji === emoji && item.username === userIdentifier)) {
        emojiElement.classList.add('reacted');
      }

      emojiElement.addEventListener('click', async () => {
        if (!userReactions[emoji]) {
          // Wenn der Benutzer noch keine Reaktion auf dieses Emoji abgegeben hat
          const reactionAdded = await addReactionToPost(postId, emoji, userIdentifier); // Übergeben Sie den Benutzernamen
          if (reactionAdded) {
            userReactions[emoji] = 1; // Reaktion des Benutzers speichern
            countSpan.textContent = 1;
            emojiElement.classList.add('reacted');
          }
        } else {
          // Wenn der Benutzer bereits eine Reaktion auf dieses Emoji abgegeben hat, entfernen Sie die Reaktion
          const reactionRemoved = await removeReactionFromPost(postId, emoji, userIdentifier);
          if (reactionRemoved) {
            delete userReactions[emoji]; // Reaktion des Benutzers löschen
            countSpan.textContent = 0;
            emojiElement.classList.remove('reacted');
          }
        }

        // Aktualisiere die Reaktionen im Local Storage
        localStorage.setItem(`reactions_${postId}_${userIdentifier}`, JSON.stringify(userReactions));
      });

      container.appendChild(emojiElement);
    });
  }
}
// Funktion zum Abrufen von Benutzerreaktionen aus der Datenbank
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

// Funktion zum Aktualisieren der Benutzerreaktionen in der Datenbank
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