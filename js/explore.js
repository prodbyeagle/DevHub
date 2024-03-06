async function fetchProfilePicture(username) {
    try {
        const response = await fetch(`/api/profile/${username}`);
        if (!response.ok) {
            throw new Error('Failed to fetch profile picture');
        }
        const profile = await response.json();
        const profilePicture = profile.pb; // Profilbild des Benutzers
        // Hier können Sie das Profilbild verwenden, z.B. anzeigen oder weiterverarbeiten
        console.log('Profilbild für Benutzer', username + ':', profilePicture);
    } catch (error) {
        console.error('Error fetching profile picture:', error);
    }
}

async function fetchAndDisplayPosts() {
    try {
        let currentPage = 1;
        let totalPages = 1;

        // Schleife zum Durchlaufen aller Seiten
        while (currentPage <= totalPages) {
            // Beiträge von der API abrufen
            const response = await fetch(`/api/posts?page=${currentPage}`);
            if (!response.ok) {
                throw new Error('Failed to fetch posts');
            }
            const responseData = await response.json(); // Daten von der API abrufen
            const posts = responseData.posts; // Extrahiere die Posts aus den JSON-Daten

            console.log('Number of posts received for page', currentPage, ':', posts.length); // Logging hinzufügen

            // Posts auf der Seite anzeigen
            const postsContainer = document.getElementById('posts-container');
            posts.forEach(post => {
                const postElement = document.createElement('div');
                postElement.classList.add('post');

                // Nur anzeigen, wenn sowohl content als auch codesnippet vorhanden sind
                if (post.content && post.codesnippet) {
                    // Profilbild und Benutzername in den Post einfügen
                    postElement.innerHTML = `
                        <h3>${post.content}</h3>
                        <p>${truncateText(post.codesnippet, 200)}</p>
                        <div class="user-info">
                            <img src="${post.imageUrl}" alt="Profilbild" style="width: 30px; height: 30px; border-radius: 50%; margin-right: 5px; float: left;">
                            <p>Author: ${post.username}</p>
                        </div>
                    `;
                    postsContainer.appendChild(postElement);
                }
            });

            totalPages = responseData.totalPages; // Aktualisiere die Gesamtseitenzahl
            currentPage++;
        }
    } catch (error) {
        console.error('Error fetching posts:', error);
    }
}


// Funktion zum Anzeigen des gesperrten Benutzers
function showSuspendedUser(username) {
    const suspendedUserDiv = document.getElementById('suspendedUser');
    const suspendedUsernameSpan = document.getElementById('suspendedUsername');
    suspendedUsernameSpan.textContent = `@${username}`;
    suspendedUserDiv.style.display = 'block'; // Anzeigen der gesperrten Benachrichtigung
}

function showBannedOverlay(username) {
    // Verstecke den normalen Inhalt
    document.getElementById('posts-container').style.display = 'none';
    
    // Zeige das Banned-Overlay an
    const overlay = document.createElement('div');
    overlay.classList.add('banned-overlay');
    overlay.innerHTML = `
        <p>The user ${username} is suspended.</p>
    `;
    document.body.appendChild(overlay);
}

function showNormalContent() {
    document.getElementById('posts-container').style.display = 'block';
}

// Funktion zum Mischen eines Arrays (Fisher-Yates Algorithmus)
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

// Funktion zum Kürzen des Textes
function truncateText(text, maxLength) {
    if (text.length > maxLength) {
        return text.slice(0, maxLength) + '...';
    }
    return text;
}

// Funktion zum Anwenden des Hover-Effekts auf alle Posts
function applyHoverEffectToPosts() {
    const posts = document.querySelectorAll(".post");
    posts.forEach(post => {
        addHoverEffect(post); // Füge den Hover-Effekt zu jedem Post hinzu
        checkTextHeight(post); // Überprüfe die Höhe des Textbereichs und ändere den Schatten entsprechend
    });
}

// Funktion zum Hinzufügen des Hover-Effekts zu einem einzelnen Post
function addHoverEffect(post) {
    post.addEventListener("mouseenter", function() {
        this.style.transform = "scale(1.03)";
        this.style.boxShadow = "0 0 16px rgba(0, 0, 0, 0.1)";
    });
    post.addEventListener("mouseleave", function() {
        this.style.transform = "scale(1)";
        this.style.boxShadow = "4px 4px 8px rgba(0, 0, 0, 0.1), -4px -4px 8px rgba(255, 255, 255, 0.5)";
    });
}

// Seite lädt, Beiträge abrufen und anzeigen
document.addEventListener("DOMContentLoaded", function() {
    fetchAndDisplayPosts();
    applyHoverEffectToPosts();
});

// Funktion zum Laden der bevorzugten Anzeigemodus
function loadModePreference() {
    // Lade den gespeicherten Moduswert aus dem Local Storage
    const mode = localStorage.getItem('mode');
    if (mode === 'light') {
        // Wenn der Modus dunkel ist, füge die entsprechende Klasse hinzu
        document.body.classList.remove('dark-mode');
        document.body.classList.add('light-mode');
    } else {
        // Andernfalls füge die Klasse für den hellen Modus hinzu
        document.body.classList.remove('light-mode');
        document.body.classList.add('dark-mode');
    }
}

loadModePreference();