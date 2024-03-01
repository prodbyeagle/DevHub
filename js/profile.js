const userData = JSON.parse(localStorage.getItem('user'));
if (!userData || !userData.identifier) {
    console.error('User identifier not found in local storage');
} else {
    const username = userData.identifier;
    checkUserBanStatus(username);
}

async function checkUserBanStatus(username) {
    try {
        const userResponse = await fetch(`/api/profile/${username}`);
        const userDataResponse = await userResponse.json();
        if (userDataResponse.banned) {
            alert('You are Suspended from this Platform. ~ @admin');
            localStorage.clear();
            window.location.href = '/login';
        } else {
            document.body.classList.add('dark-mode');
        }
    } catch (error) {
        console.error('Error fetching user data:', error);
    }
}

function showNormalContent() {
    // Zeige den normalen Inhalt an
    document.body.classList.add('dark-mode');
}


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
            console.error('Error fetching user posts:', error);
        }
    }
    
    function renderNoPostsMessage() {
        const postsContainer = document.getElementById('user-posts');
        postsContainer.innerHTML = ''; // Clear previous posts
    
        const messageElement = document.createElement('p');
        messageElement.textContent = '😭 No Posts! ...you can make an posts on your /home page';
        postsContainer.appendChild(messageElement);
    }

    function renderPosts(posts) {
        const postsContainer = document.getElementById('user-posts');
        postsContainer.innerHTML = ''; // Clear previous posts
    
        posts.forEach(post => {
            const postElement = document.createElement('div');
            postElement.classList.add('post', 'p-4', 'rounded', 'shadow', 'mb-4', 'relative');
    
            const usernameElement = document.createElement('h3');
            usernameElement.textContent = `@${post.username} (${post.date})`;
    
            const contentElement = document.createElement('p');
            contentElement.textContent = post.content;
            contentElement.setAttribute('id', 'content_' + post._id);
    
            const codeSnippetElement = document.createElement('pre');
            const codeSnippetText = post.codesnippet;
            codeSnippetElement.classList.add('bg-gray-800', 'text-white', 'p-4', 'rounded', 'text-xs');
            codeSnippetElement.style.maxWidth = '100%';
            codeSnippetElement.setAttribute('id', 'codesnippet_' + post._id);
    
            if (codeSnippetText.length > 200) {
                const formattedCodeSnippet = codeSnippetText.replace(/(.{200})/g, "$1\n");
                codeSnippetElement.textContent = formattedCodeSnippet;
            } else {
                codeSnippetElement.textContent = codeSnippetText;
            }
    
            const threeDotMenu = document.createElement('div');
            threeDotMenu.classList.add('absolute', 'top-0', 'right-0');
    
            const threeDotButton = document.createElement('button');
            threeDotButton.classList.add('neumorphism-button', 'text-red-600');
            threeDotButton.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" width="25" height="25" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M10 12a2 2 0 100-4 2 2 0 000 4zm0 2a2 2 0 100-4 2 2 0 000 4zm0 2a2 2 0 100-4 2 2 0 000 4z" />
                </svg>
            `;
            threeDotButton.setAttribute('id', 'menu-btn_' + post._id);
    
            const threeDotMenuContent = document.createElement('div');
            threeDotMenuContent.classList.add('hidden', 'origin-top-left', 'absolute', 'left-0', 'mt-2', 'rounded-md', 'shadow-lg', 'bg-white', 'ring-1', 'ring-black', 'ring-opacity-5', 'flex', 'flex-col', 'text-sm');
            threeDotMenuContent.setAttribute('id', 'ham-burger-menu_' + post._id);
    
            threeDotButton.onclick = function(e) {
                e.stopPropagation(); // Prevent click event from bubbling up to document
                const menuId = 'ham-burger-menu_' + post._id;
                const menu = document.getElementById(menuId);
                menu.classList.toggle('hidden');
            };
    
            document.addEventListener('click', function(e) {
                const menuId = 'ham-burger-menu_' + post._id;
                const menu = document.getElementById(menuId);
                if (!threeDotMenu.contains(e.target)) {
                    menu.classList.add('hidden');
                }
            });
    
            const deleteButton = document.createElement('button');
            deleteButton.textContent = 'Delete Post';
            deleteButton.classList.add('neumorphism-button', 'text-red-600', 'py-2', 'px-4', 'hover:bg-gray-100', 'hover:text-gray-900');
            deleteButton.dataset.postId = post._id;
            deleteButton.addEventListener('click', function() {
                const postId = this.dataset.postId;
                deletePost(postId);
            });
    
            const pinButton = document.createElement('button');
            pinButton.textContent = 'Pin Post';
            pinButton.classList.add('neumorphism-button', 'text-red-600', 'py-2', 'px-4', 'hover:bg-gray-100', 'hover:text-gray-900');
            pinButton.dataset.postId = post._id;
            pinButton.setAttribute('onclick', `pinPost('${post._id}')`);
    
            const editButton = document.createElement('button');
            editButton.textContent = 'Edit Post';
            editButton.classList.add('neumorphism-button', 'text-red-600', 'py-2', 'px-4', 'hover:bg-gray-100', 'hover:text-gray-900');
            editButton.dataset.postId = post._id;
            editButton.setAttribute('onclick', `showEditForm('${post._id}')`);
    
            threeDotMenuContent.appendChild(deleteButton);
            threeDotMenuContent.appendChild(pinButton);
            threeDotMenuContent.appendChild(editButton);
    
            threeDotMenu.appendChild(threeDotButton);
            threeDotMenu.appendChild(threeDotMenuContent);
    
            postElement.appendChild(usernameElement);
            postElement.appendChild(contentElement);
            postElement.appendChild(codeSnippetElement);
            postElement.appendChild(threeDotMenu);
            postsContainer.appendChild(postElement);
        });
    }

    applyHoverEffectToPosts();

    function applyHoverEffect(postElement) {
        postElement.addEventListener("mouseenter", function() {
            this.style.transform = "scale(1.03)";
            this.style.boxShadow = "0 0 16px rgba(0, 0, 0, 0.1)";
        });
        postElement.addEventListener("mouseleave", function() {
            this.style.transform = "scale(1)";
            this.style.boxShadow = "4px 4px 8px rgba(0, 0, 0, 0.1), -4px -4px 8px rgba(255, 255, 255, 0.5)";
        });
    }    
    
    function applyHoverEffectToPosts() {
        const posts = document.querySelectorAll(".post");
        posts.forEach(post => {
            addHoverEffect(post);
        });
    }

    document.addEventListener('DOMContentLoaded', () => {
        const userData = JSON.parse(localStorage.getItem('user'));
        if (userData) {
            const currentUsername = userData.identifier;
            fetchUserPosts(currentUsername);
            fetchAndDisplayFollowerCount(currentUsername);
            displayPinnedPosts;
        } else {
            console.error('User data not found in localStorage.');
        }
    });

    function loadModePreference() {
        const mode = localStorage.getItem('mode');
        if (mode === 'light') {
            document.body.classList.remove('dark-mode');
            document.body.classList.add('light-mode');
        } else {
            document.body.classList.remove('light-mode');
            document.body.classList.add('dark-mode');
        }
        console.log('Mode Loaded:', mode);
    }
    loadModePreference();

    window.onload = async function() {
try {
    const userDataString = localStorage.getItem('user');
    if (!userDataString) {
        console.error('User data not found in localStorage.');
        return;
    }

    const userData = JSON.parse(userDataString);
    const identifier = userData.identifier;

    const response = await fetch(`/api/username`);
    const data = await response.json();
    const users = data.users;
    let currentUser = null;

    for (let i = 0; i < users.length; i++) {
        if (users[i].username === identifier) {
            currentUser = users[i];
            break;
        }
    }

    if (!currentUser) {
        console.error('User not found in the database.');
        return;
    }

    document.getElementById('profile-picture').src = currentUser.pb;
    document.getElementById('profile-username').innerText = currentUser.username;
    const profileUsernameElement = document.getElementById('profile-username');
    profileUsernameElement.textContent = `@${currentUser.username}`;

    // Anzeigen der Biografie im Profil
    const profileDescriptionElement = document.getElementById('profile-description');
    if (currentUser.bio) {
        profileDescriptionElement.innerText = currentUser.bio;
    } else {
        profileDescriptionElement.innerText = "❌ Bio not available";
    }
} catch (error) {
    console.error("Error fetching user data:", error);
}
};

    // Funktion zum Anzeigen des Overlays
    function showOverlay() {
        document.getElementById('overlay').classList.remove('hidden');
    }

    // Funktion zum Schließen des Overlays
    function closeOverlay() {
        document.getElementById('overlay').classList.add('hidden');
    }

    // Funktion zum Speichern der Biografie
    async function saveBio() {
        try {
            // Neue Biografie aus dem Eingabefeld abrufen
            const newBio = document.getElementById('bio-input').value;

            if (newBio.trim() === '') {
                return;
            }

            // Biografie-Anzeige im Profil aktualisieren
            document.getElementById('profile-description').innerText = newBio;
    
            // Benutzerdaten aus dem Local Storage abrufen
            const userData = JSON.parse(localStorage.getItem('user'));
            if (!userData) {
                console.error('User data not found in localStorage.');
                return;
            }
    
            // Benutzername und neue Biografie für die API-Anfrage vorbereiten
            const username = userData.identifier;
    
            // API-Anfrage senden, um die Biografie des Benutzers zu aktualisieren
            const response = await fetch('/api/update/bio', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username, newBio })
            });
    
            if (!response.ok) {
                throw new Error('Failed to update bio.');
            }
    
            // Overlay schließen
            closeOverlay();
        } catch (error) {
            console.error('Error saving bio:', error);
            // Hier können Sie eine Fehlermeldung anzeigen oder entsprechend reagieren
        }
    }

// Funktion zum Anzeigen der Zeichenanzahl und Anpassen der Farbe
function updateCharCount() {
const bioInput = document.getElementById('bio-input');
const charCountElement = document.getElementById('char-count');
const remainingChars = 32 - bioInput.value.length;

// Ändere die Farbe basierend auf der verbleibenden Zeichenanzahl
if (remainingChars <= 10) {
    const redIntensity = Math.max(0, Math.min(255, remainingChars * 25));
    charCountElement.style.color = `rgb(255, ${redIntensity}, ${redIntensity})`;
} else if (remainingChars <= 15) {
    charCountElement.style.color = 'white';
} else {
    charCountElement.style.color = 'white'; // Standardfarbe
}

charCountElement.textContent = `${remainingChars} left`;
}

// Event-Listener für das Eingabefeld, um die Zeichenanzahl zu aktualisieren
document.getElementById('bio-input').addEventListener('input', updateCharCount);

    // Function to scroll to the top of the page with animation
    function scrollToTop() {
        const c = document.documentElement.scrollTop || document.body.scrollTop;
        if (c > 0) {
            window.requestAnimationFrame(scrollToTop);
            window.scrollTo(0, c - c / 8);
        }
    }

window.onscroll = function() {
    scrollFunction();
};

function scrollFunction() {
    const scrollToTopButton = document.querySelector('.scroll-to-top');
    const scrollPosition = document.documentElement.scrollTop || document.body.scrollTop;
    
    // Adjust the threshold value (50) to your desired scroll position before showing the button
    if (scrollPosition > 1200) {
        scrollToTopButton.style.display = "block";
    } else {
        scrollToTopButton.style.display = "none";
    }
}

// PROFILBILD UPLOAD 

document.getElementById('profile-picture-upload').addEventListener('change', async function(event) {
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
    console.error('Error uploading profile picture:', error);
    // Hier können Sie eine Fehlermeldung anzeigen oder entsprechend reagieren
}
});

async function compressImage(file) {
return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = function(event) {
        const img = new Image();
        img.src = event.target.result;
        img.onload = function() {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');

            let maxSize = 100; // Maximale Breite und Höhe für das Bild

            // Überprüfen, ob das Bild größer als maxSize x maxSize ist
            if (img.width > maxSize || img.height > maxSize) {
                Toastify({
                    text: `Das Bild wird auf ${maxSize}x${maxSize} skaliert.`,
                    backgroundColor: 'linear-gradient(to right, #ff416c, #ff4b2b)',
                    className: 'info-toast'
                }).showToast();

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

                canvas.toBlob((blob) => {
                    const compressedFile = new File([blob], file.name, { type: 'image/jpeg', lastModified: Date.now() });
                    resolve(compressedFile);
                }, 'image/jpeg', 0.7); // 0.7 ist die Bildqualität (0.0 - 1.0), ändern Sie dies nach Bedarf
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
    // Benutzerdaten aus dem Local Storage abrufen
    const userDataString = localStorage.getItem('user');
    if (!userDataString) {
        throw new Error('Benutzerdaten nicht im Local Storage gefunden.');
    }
    const userData = JSON.parse(userDataString);
    if (!userData || !userData.identifier) {
        throw new Error('Ungültige Benutzerdaten im Local Storage.');
    }
    const username = userData.identifier;

    // Konvertieren des Bilds in einen Base64-codierten String
    const reader = new FileReader();
    reader.readAsDataURL(imageFile);
    reader.onload = async function () {
        const base64Image = reader.result;

        // Erstellen des JSON-Datenobjekts
        const jsonData = {
            username: username,
            newPB: base64Image,
        };

        const response = await fetch('/api/update/pb', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(jsonData),
        });

        if (!response.ok) {
            throw new Error('Fehler beim Aktualisieren des Profilbildes.');
        }

        Toastify({
            text: 'Profilbild erfolgreich aktualisiert.',
            duration: 3000,
            close: true,
            gravity: 'top', // Optionen: 'top', 'bottom', 'center'
            position: 'center', // Optionen: 'left', 'right', 'center'
            backgroundColor: 'linear-gradient(to right, #00b09b, #96c93d)',
        }).showToast();

        // Bild im Profil aktualisieren
        document.getElementById('profile-picture').src = base64Image;
    };
} catch (error) {
    Toastify({
        text: 'Fehler beim Aktualisieren des Profilbildes: ' + error.message,
        duration: 3000,
        close: true,
        gravity: 'top', // Optionen: 'top', 'bottom', 'center'
        position: 'center', // Optionen: 'left', 'right', 'center'
        backgroundColor: 'linear-gradient(to right, #e74c3c, #e67e22)',
    }).showToast();
}
}

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
        console.error('Ungültige API-Antwort:', data);
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
    const followingNamesElement = document.getElementById('following-names');
    followingNamesElement.textContent = followingNames;

    const followerCountElement = document.getElementById('follower-count');
    followerCountElement.textContent = followerCount;
} catch (error) {
    console.error('Fehler beim Abrufen der Anzahl der Follower:', error);
}
}

function deletePost(postId) {
    try {
        if (!postId) {
            throw new Error('Post ID is undefined');
        }

        // Zeige eine Bestätigungsdialog an
        const confirmed = confirm('This will delete your post permanently! Are you sure you want this?');

        // Wenn der Benutzer die Aktion bestätigt hat
        if (confirmed) {
            // Senden der Anfrage zum Löschen des Posts
            fetch(`/api/posts/delete/${postId}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json'
                }
            }).then(response => {
                if (!response.ok) {
                    throw new Error('Failed to delete post');
                }
                // Post erfolgreich gelöscht
                console.log(`Post with ID ${postId} successfully deleted`);
                // Seite neu laden
                window.location.reload();
            }).catch(error => {
                console.error('Error deleting post:', error);
                // Hier könntest du eine Benachrichtigung anzeigen oder eine andere Fehlerbehandlung durchführen
            });
        }
    } catch (error) {
        console.error('Error deleting post:', error);
        // Hier könntest du eine Benachrichtigung anzeigen oder eine andere Fehlerbehandlung durchführen
    }
}

function pinPost(postId) {
const username = JSON.parse(localStorage.getItem('user'));
console.log("Post ID:", postId); // Überprüfen der Post-ID

const requestOptions = {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json'
    }
};

fetch(`/profile/${username}/pin-post/${postId}`, requestOptions)
    .then(response => {
        if (!response.ok) {
            throw new Error('Failed to pin post.');
        }
        return response.json(); // Parse the response body as JSON
    })
    .then(data => {
        console.log(data); // Log the parsed JSON response
        alert('Post pinned successfully.');
    })
    .catch(error => {
        console.error('Error:', error);
    });
}

async function displayPinnedPosts(postId) {
const username = JSON.parse(localStorage.getItem('user'));
console.log("Post ID:", postId);
try {
    const response = await fetch(`/profile/${postId}`);
    if (!response.ok) {
        throw new Error('Failed to fetch posts.');
    }
    const posts = await response.json();

    const postsContainer = document.getElementById('user-posts');
    postsContainer.innerHTML = ''; // Clear previous posts

    posts.forEach(post => {
        const postElement = createPostElement(post);
        if (post.pinned) {
            postsContainer.prepend(postElement); // Append pinned post at the beginning
        } else {
            postsContainer.appendChild(postElement); // Append unpinned post at the end
        }
    });
} catch (error) {
    console.error('Error:', error);
}
}

function showEditForm(postId) {
const postsContainer = document.getElementById('user-posts');
if (!postsContainer) {
    console.error('Posts container element not found.');
    return;
}

const postElement = postsContainer.querySelector(`[data-post-id="${postId}"]`);
if (!postElement) {
    console.error(`Post element with ID ${postId} not found.`);
    return;
}

const contentElement = document.getElementById(`content_${postId}`);
const codeSnippetElement = document.getElementById(`codesnippet_${postId}`);


if (!contentElement || !codeSnippetElement) {
    console.error('Content or Code snippet element not found within post element.');
    return;
}

const menuButton = document.getElementById('menu-btn');
const menuContent = document.getElementById('ham-burger-menu');
menuButton.style.display = 'none';
menuContent.style.display = 'none';

const editContentInput = document.createElement('textarea');
editContentInput.classList.add('w-full', 'p-2', 'border', 'border-grey-300', 'rounded-md', 'mb-4', 'neumorphism-input');
editContentInput.setAttribute('style', 'resize: none; white-space: nowrap; font-family: Font, SF Pro Medium, \'Open Sans\', sans-serif;');
editContentInput.value = contentElement.textContent;

const editCodeSnippetInput = document.createElement('textarea');
editCodeSnippetInput.classList.add('w-full', 'p-2', 'border', 'border-grey-300', 'rounded-md', 'mb-4', 'neumorphism-input');
editCodeSnippetInput.setAttribute('style', 'white-space: nowrap; font-family: Font, SF Pro Medium, \'Open Sans\', sans-serif;');
editCodeSnippetInput.value = codeSnippetElement.textContent;

const saveButton = document.createElement('button');
saveButton.textContent = 'Save';
saveButton.classList.add('neumorphism-button', 'text-red-600', 'mr-2');
saveButton.onclick = function() {
    const conent = editContentInput.value;
    const codesnippet = editCodeSnippetInput.value;
    editPost(postId, conent, codesnippet);
    location.reload();
};

const cancelButton = document.createElement('button');
cancelButton.textContent = 'Cancel';
cancelButton.classList.add('neumorphism-button', 'text-red-600');
cancelButton.onclick = function() {
    // Aktualisieren Sie die Seite, um den Bearbeitungsmodus zu beenden
    location.reload();
};

// Ersetzen Sie den bestehenden Inhalt und das Code-Snippet durch Bearbeitungseingaben
contentElement.innerHTML = '';
contentElement.appendChild(editContentInput);
codeSnippetElement.innerHTML = '';
codeSnippetElement.appendChild(editCodeSnippetInput);
// Fügen Sie Speichern- und Abbrechen-Buttons hinzu
contentElement.appendChild(saveButton);
contentElement.appendChild(cancelButton);

editButton.removeEventListener('click', showEditForm);
deleteButton.removeEventListener('click', deletePost);
pinButton.removeEventListener('click', pinPost);
}

// Funktion zum Bearbeiten eines Posts über eine Fetch-Anfrage
function editPost(postId, content, codesnippet) {
console.log(postId);
console.log(content);
console.log(codesnippet);

if(content.length === 0 && codesnippet.length === 0) {
    deletePost(postId);
    return; // Beende die Funktion, um sicherzustellen, dass nichts weiter ausgeführt wird
}

const date = new Date().toISOString();
fetch(`/edit-post/${postId}`, {
method: 'PUT',
headers: {
    'Content-Type': 'application/json'
},
body: JSON.stringify({ content: content, codesnippet: codesnippet, date: date })
})
.then(response => {
console.log('Response received:', response);
if (!response.ok) {
    throw new Error('Failed to edit post.');
}
alert('Post edited successfully.');
})
.catch(error => {
console.error('Error editing post:', error);
});
}