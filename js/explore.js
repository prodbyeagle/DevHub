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
                    // Textinhalt des Posts einfügen
                    const contentParagraph = document.createElement('p');
                    contentParagraph.textContent = truncateText(post.content, 25);
                    postElement.appendChild(contentParagraph);

                    const codesnippetParagraph = document.createElement('p');
                    codesnippetParagraph.textContent = truncateText(post.codesnippet, 125);
                    contentParagraph.style.fontSize = '20px'; 
                    contentParagraph.style.fontWeight = 'bold';
                    postElement.appendChild(codesnippetParagraph);

                    // Benutzerinformationen einfügen
                    const userInfoDiv = document.createElement('div');
                    userInfoDiv.classList.add('user-info');
                    const profileImg = document.createElement('img');
                    profileImg.src = post.imageUrl;
                    profileImg.alt = '❌';
                    profileImg.style.width = '30px';
                    profileImg.style.height = '30px';
                    profileImg.style.borderRadius = '50%';
                    profileImg.style.marginRight = '5px';
                    profileImg.style.float = 'left';
                    const usernameParagraph = document.createElement('p');
                    usernameParagraph.textContent = `Author: ${post.username}`;
                    userInfoDiv.appendChild(profileImg);
                    userInfoDiv.appendChild(usernameParagraph);
                    postElement.appendChild(userInfoDiv);

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

console.log('%cWARNING! %cBe cautious!\nIf someone instructs you to paste something in here, it could be a scammer or hacker attempting to exploit your system. The Devolution Team would never ask for an Password!', 'font-size: 20px; color: yellow;', 'font-size: 14px; color: white;');
console.log('%cWARNING! %cBe cautious!\nIf someone instructs you to paste something in here, it could be a scammer or hacker attempting to exploit your system. The Devolution Team would never ask for an Password!', 'font-size: 20px; color: yellow;', 'font-size: 14px; color: white;');