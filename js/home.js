document.addEventListener("DOMContentLoaded", async function() {
    const username = localStorage.getItem("user");

    if (username) {
        document.getElementById("loginLink").style.display = "none";
        document.getElementById("signupLink").style.display = "none";
        document.getElementById("signoutLink").style.display = "block";
    } else {
        document.getElementById("loginLink").style.display = "block";
        document.getElementById("signupLink").style.display = "block";
        document.getElementById("signoutLink").style.display = "none";
    }

    getPosts();
    fetchAdminUserData();
});

async function fetchAdminUserData() {
    const response = await fetch('/api/username');
    if (!response.ok) {
        throw new Error('Failed to fetch user data');
    }
    const userData = await response.json();

    // Überprüfen, ob der Benutzer ein Administrator ist
    const currentUser = JSON.parse(localStorage.getItem('user'));
    const isAdmin = userData.users.find(user => user.username === currentUser.identifier && user.admin);

    if (isAdmin) {
        document.getElementById("adminLink").style.display = "block";
        document.getElementById("usernameLink").style.display = "block";
        document.getElementById("preferencesLink").style.display = "block";
        document.getElementById("postsLink").style.display = "block";
        document.getElementById("badgesLink").style.display = "block";
        document.getElementById("badgesapiLink").style.display = "block";
        devHeader.style.display = "block";
    } else {
        document.getElementById("adminLink").style.display = "none";
        document.getElementById("usernameLink").style.display = "none";
        document.getElementById("preferencesLink").style.display = "none";
        document.getElementById("postsLink").style.display = "none";
        document.getElementById("badgesLink").style.display = "none";
        document.getElementById("badgesapiLink").style.display = "none";
        devHeader.style.display = "none";
    }
}

    // Überprüfen Sie die Benutzersperrstatus
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
                document.body.classList.add('content-container');
            }
        } catch (error) {
            console.error('Error fetching user data:', error);
        }
    }
    
    function showNormalContent() {
        // Zeige den normalen Inhalt an
        document.body.classList.add('content-container');
    }

    async function showWelcomeMessage() {
    try {
        const savedUser = localStorage.getItem('user'); // Benutzerdaten aus dem Speicher abrufen
        if (savedUser) {
            const { identifier } = JSON.parse(savedUser);

            // Überprüfen, ob der Identifier eine E-Mail-Adresse ist
            if (isValidEmail(identifier)) {
                // Wenn ja, die E-Mail-Adresse verwenden, um den Benutzernamen zu finden
                const response = await fetch('/api/username');
                const userData = await response.json();

                // Finde den Benutzer, der die angegebene E-Mail-Adresse hat
                const matchedUser = userData.users.find(user => user.email === identifier);
                
                if (matchedUser) {
                    // Benutzer gefunden, verwende den Benutzernamen für die Begrüßung
                    document.getElementById('username').textContent = matchedUser.username;
                } else {
                    console.error('User with specified email not found');
                }
            } else {
                // Der Identifier ist kein eine E-Mail-Adresse, daher direkt verwenden
                document.getElementById('username').textContent = identifier;
            }
        } else {
            // Benutzer ist nicht authentifiziert, leite ihn auf die Login-Seite weiter
            window.location.href = '/login';
        }
    } catch (error) {
        console.error('Error fetching user data:', error);
    }
}


const searchBtn = document.getElementById('search-btn');
const closeButton = document.getElementById('closeButton');
const overlay = document.querySelector('.overlay');
const searchOverlay = document.getElementById('searchOverlay'); // geändert, um das Suchoverlay zu korrekt zu wählen

searchBtn.addEventListener('click', () => {
    // Überprüfen, ob das Suchoverlay angezeigt oder ausgeblendet ist
    if (!searchOverlay.classList.contains('active')) {
        // Wenn ausgeblendet, dann einblenden
        searchOverlay.classList.add('active');
        overlay.style.display = 'block'; // Overlay anzeigen
    } else {
        // Wenn angezeigt, dann ausblenden
        searchOverlay.classList.remove('active');
        overlay.style.display = 'none'; // Overlay ausblenden
    }
});

closeButton.addEventListener('click', () => {
    // Bei Klick auf den Close-Button das Overlay ausblenden
    searchOverlay.classList.remove('active');
    overlay.style.display = 'none'; // Overlay ausblenden
});

// Suchfunktion
const searchInput = document.getElementById('searchInput');
const searchButton = document.getElementById('searchButton');

// Event-Listener für das Klicken auf den Suchbutton
searchButton.addEventListener('click', async function() {
    search();
});

// Event-Listener für das Drücken der Enter-Taste im Eingabefeld
searchInput.addEventListener('keypress', async function(e) {
    if (e.key === 'Enter') {
        search();
    }
});

async function search() {
    const username = searchInput.value.trim();

    if (!username) {
        return;
    }

    if (username) {
        const response = await fetch(`/api/profile/${username}`);
        const userData = await response.json();

        if (userData.username) {
            window.location.href = `/u/${username}`; // Weiterleitung zum Benutzerprofil
        } else {
            Toastify({
                text: "User not found",
                duration: 3000,
                close: true
            }).showToast();
        }
    }
}

// Autocomplete-Funktion
async function autocomplete() {
    const searchInput = document.getElementById("searchInput");
    const searchTerm = searchInput.value.trim().toLowerCase();
    const searchResultsDiv = document.getElementById("searchResults");

    if (searchTerm.length === 0) {
    searchResultsDiv.innerHTML = "<div></div>"; // Anzeige der Platzhaltermeldung
    return;
}

    const response = await fetch(`/api/username`); // API-Endpunkt für die Benutzernamen
    if (response.ok) {
        const userData = await response.json();
        const users = userData.users;

        const filteredResults = users.filter(user => user.username.toLowerCase().startsWith(searchTerm)); // Filtere Benutzernamen, die mit dem Suchbegriff beginnen

        if (filteredResults.length > 0) {
            // Erstelle HTML für Suchergebnisse mit Links zu den Benutzerprofilen
            const resultHTML = filteredResults.map((user, index) => {
            const profilePic = user.pb ? `<img src="${user.pb}" alt="Profile Pic" style="width: 30px; height: 30px; border-radius: 50%; margin-right: 5px; float: left;"/>` : ''; // Wenn ein Profilbild vorhanden ist, füge es hinzu
            const marginBottom = index === filteredResults.length - 1 ? '0' : '10px'; // Bestimme den margin-bottom-Wert
            return `<div class="search-results-item" style="margin-bottom: ${marginBottom};">${profilePic}<a href="/u/${user.username}">${user.username}</a></div>`;
        }).join("");
            searchResultsDiv.innerHTML = resultHTML; // Zeige Suchergebnisse an
        } else {
            searchResultsDiv.innerHTML = "<div>❌ No results found</div>"; // Zeige Meldung an, wenn keine Ergebnisse gefunden wurden
        }
    } else {
        console.error('❌ Error fetching search results');
    }
}

// Event-Handler für das searchInput-Element hinzufügen, um das Autocomplete-Verhalten zu aktivieren
document.getElementById("searchInput").addEventListener("input", autocomplete);

// Funktion zur Überprüfung, ob eine Zeichenkette eine gültige E-Mail-Adresse ist
function isValidEmail(email) {
    // Einfache Überprüfung durch eine Reguläre Ausdruck
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

async function createPost(event) {
    event.preventDefault(); // Verhindert das Standardformularverhalten

    const postContent = document.getElementById('postContent').value;
    const postDescription = document.getElementById('postDescription').value;

    if (!postContent.trim()) {
        return;
    }

    try {
        const savedUser = localStorage.getItem('user'); // Benutzerdaten aus dem Speicher abrufen
            if (savedUser) {
                const { identifier: identifier } = JSON.parse(savedUser); // Benutzername extrahieren

                const response = await fetch('/api/username');
                const userData = await response.json();
                const matchedUser = userData.users.find(user => user.email === identifier);

            // Überprüfen, ob der Benutzer den Cooldown erreicht hat
            const lastPostTime = localStorage.getItem('lastPostTime');
            const postCount = parseInt(localStorage.getItem('postCount')) || 0;
            const currentTime = Date.now();
            const cooldownDuration = postCount >= 10 ? 5000 : 15000; // 1 Minute Cooldown, wenn mehr als 10 Posts, sonst 15 Sekunden

            if (!lastPostTime || currentTime - parseInt(lastPostTime) >= cooldownDuration) {
                const response = await fetch('/api/posts', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ 
                        codesnippet: postContent, 
                        identifier: identifier, 
                        content: postDescription, 
                        likes: 0,
                        replies: [],
                        pinned: false,
                    })
                });
                const data = await response.json();
                document.getElementById('postContent').value = '';
                document.getElementById('postDescription').value = '';
                await getPosts();
                window.location.reload();

                // Cooldown zurücksetzen und aktualisieren
                localStorage.setItem('lastPostTime', currentTime);
                localStorage.setItem('postCount', postCount >= 10 ? 10 : postCount + 1);

                // Code-Snippet im localStorage speichern
                localStorage.setItem('lastPostedCode', postContent);
            } else {
                // Benutzer hat den Cooldown nicht erreicht, Anzeige einer Toast-Nachricht
                Toastify({
                    text: `You've posted too frequently. Please wait before posting again.`,
                    style: {
                        background: 'linear-gradient(to right, #ff416c, #ff4b2b)',
                    },
                    className: 'rounded', // Abgerundete Ecken hinzufügen
                    duration: 3000
                }).showToast();
            }
        } else {
            // Benutzerdaten sind nicht im lokalen Speicher gespeichert
            window.location.href = '/login';
        }
    } catch (error) {
        console.error('Error creating post:', error);
    }
}

const postsPerPage = 10;
let currentPage = 1;
let loading = false;

async function getPosts() {
    try {
        if (loading) return;
        loading = true;

        const loadingTimeout = setTimeout(() => {
            const loadingCircle = document.getElementById('loadingCircle');
            loadingCircle.classList.remove('hidden'); // Ladekreis anzeigen
        }, 500);

        // Rufen Sie die Posts ab
        const response = await fetch(`/api/posts?page=${currentPage}&limit=${postsPerPage}`);
        const responseData = await response.json();
        const totalPages = responseData.totalPages;

        // Verarbeiten und Anzeigen der Posts
        const postsContainer = document.getElementById('latestPosts');

        responseData.posts.forEach(async post => {
            const postElement = document.createElement('div');
            postElement.classList.add('post', 'p-4', 'rounded', 'shadow', 'mb-4');

            const username = post.username;

            const dateElement = document.createElement('p');
            dateElement.textContent = post.date;

            const usernameElement = document.createElement('h3');
            if (post.imageUrl) {
                const profileImageElement = document.createElement('img');
                profileImageElement.src = post.imageUrl;
                profileImageElement.alt = `user_pic`;
                profileImageElement.classList.add('profile-image');
                profileImageElement.style.width = '25px';
                profileImageElement.style.height = '25px';
                profileImageElement.style.borderRadius = '50%';
                profileImageElement.style.float = 'left';
                profileImageElement.style.marginRight = '5px';
                postElement.appendChild(profileImageElement);
            }
            usernameElement.textContent = ` @${username} (${dateElement.textContent})`;

            const contentElement = document.createElement('p');
            contentElement.textContent = post.content;

            const codeSnippetElement = document.createElement('pre');
            const codeSnippetText = post.codesnippet;
            codeSnippetElement.classList.add('bg-gray-800', 'text-white', 'p-4', 'rounded', 'text-xs');
            codeSnippetElement.style.whiteSpace = 'pre-wrap';
            codeSnippetElement.style.maxWidth = '100%';

            if (codeSnippetText.length > 200) {
                    const formattedCodeSnippet = codeSnippetText.replace(/(.{200})/g, "$1\n");
                    codeSnippetElement.textContent = formattedCodeSnippet;
                } else {
                    codeSnippetElement.textContent = codeSnippetText;
                }

            // Überprüfen, ob der Post Antworten hat, und die Anzahl der Antworten anzeigen
            const repliesElement = document.createElement('p');
            repliesElement.textContent = `Replies: ${post.replies ? post.replies.length : 0}`;
            
            const likesButton = document.createElement('button');
            likesButton.innerHTML = `<img width="25" height="25" src="https://img.icons8.com/ios/50/like--v1.png" alt="like--v1"/>`;

            // Badges abrufen und anzeigen
            const badgeResponse = await fetch(`/api/${username}/badges`);
            const badgeData = await badgeResponse.json();
            const badges = badgeData.badges;

            // Überprüfen, ob badges definiert ist und ein Array ist
            if (badges && Array.isArray(badges)) {
                // Filtern der aktiven Badges
                const activeBadges = badges.filter(badge => badge.active);
            
                // Überprüfen, ob der Benutzer aktive Badges hat
                if (activeBadges.length > 0) {
                    // Nur das letzte aktive Badge des Benutzers verwenden
                    const lastActiveBadge = activeBadges[activeBadges.length - 1];
                    const badgeIcon = document.createElement('img');
                    badgeIcon.src = lastActiveBadge.image;
                    badgeIcon.alt = 'badge-icon';
                    badgeIcon.width = 15;
                    badgeIcon.height = 15;
                    badgeIcon.style.float = 'right'; // Das Badge rechts ausrichten
                    usernameElement.appendChild(badgeIcon);
                }
            }

            let isLiked = localStorage.getItem(`liked_${post._id}`);

            if (isLiked) {
                likesButton.innerHTML = `<img width="25" height="25" src="https://img.icons8.com/ios-filled/50/FA5252/like--v1.png" alt="like--v1"/>`;
            }

            likesButton.setAttribute('onclick', `toggleLike('${post._id}')`);
            likesButton.setAttribute('id', `likesButton_` + post._id);

            // Favoriten-Button
            const favoriteButton = document.createElement('button');
            favoriteButton.innerHTML = `<img width="25" height="25" src="https://img.icons8.com/material-outlined/24/bookmark.png" alt="favorite-icon"/>`;
            // Hier müssten Sie die Funktionalität für den Favoriten-Button hinzufügen

            let isFavorite = localStorage.getItem(`favorite_${post._id}`);
            if (isFavorite) {
                favoriteButton.innerHTML = `<img width="25" height="25" src="https://img.icons8.com/material-outlined/24/bookmark.png" alt="add-to-favorites"/>`;
            }

            favoriteButton.addEventListener('click', function() {
                if (isFavorite) {
                    // Wenn der Beitrag bereits als Favorit markiert ist, entfernen Sie ihn aus den Favoriten
                    favoriteButton.innerHTML = `<img width="25" height="25" src="https://img.icons8.com/material-outlined/24/bookmark.png" alt="add-to-favorites"/>`;
                    localStorage.removeItem(`favorite_${post._id}`);
                    isFavorite = false;
                    favoriteButton.classList.add('pop');
                    Toastify({
                        text: 'Deleted Post from Favorites!',
                        duration: 3000,
                        close: true,
                        backgroundColor: 'linear-gradient(to right, #00b09b, #96c93d)',
                    }).showToast();
                } else {
                    // Andernfalls markieren Sie ihn als Favorit
                    favoriteButton.innerHTML = `<img width="25" height="25" src="https://img.icons8.com/material-rounded/24/FAB005/bookmark.png" alt="add-to-favorites"/>`;
                    localStorage.setItem(`favorite_${post._id}`, true);
                    isFavorite = true;
                    favoriteButton.classList.add('pop');
                    Toastify({
                        text: 'Added Post to Favorites!',
                        duration: 3000,
                        close: true,
                        backgroundColor: 'linear-gradient(to right, #00b09b, #96c93d)',
                    }).showToast();
                }
                // Entferne die Pop-Animation-Klasse nach einer Verzögerung von 300ms
                setTimeout(() => {
                    likesButton.classList.remove('pop');
                    favoriteButton.classList.remove('pop');
                }, 300);
            });
            
            const likesElement = document.createElement('p');
            likesElement.textContent = `Likes: ${post.likes ? post.likes : 0}`;
            likesElement.setAttribute('id', 'likesCount_' + post._id);

            const buttonsContainer = document.createElement('div');
            buttonsContainer.classList.add('d-flex', 'align-items-center');
            buttonsContainer.appendChild(likesElement);
            buttonsContainer.appendChild(likesButton);
            buttonsContainer.appendChild(favoriteButton);
            
            // Änderungen am Layout
            postElement.appendChild(usernameElement);
            postElement.appendChild(contentElement);
            postElement.appendChild(codeSnippetElement);
            postElement.appendChild(buttonsContainer); // Likes- und Favoriten-Buttons hinzufügen
            postsContainer.appendChild(postElement);
        });

        currentPage++;
        
        if (currentPage > totalPages) {
            window.removeEventListener('scroll', lazyLoadHandler);
        }

        clearTimeout(loadingTimeout);
        const loadingCircle = document.getElementById('loadingCircle');
        loadingCircle.classList.add('hidden');
        loading = false;
    } catch (error) {
        console.error('Error fetching posts:', error);
        loading = false;
    }
}

// Handler für Lazy Loading beim Scrollen
function lazyLoadHandler() {
    const { scrollTop, scrollHeight, clientHeight } = document.documentElement;
    if (scrollHeight - scrollTop === clientHeight) {
        getPosts(); // Rufe die nächste Seite von Posts ab, wenn das Ende der Seite erreicht ist
    }
}

// Initialisierung der Posts beim Laden der Seite
window.addEventListener('DOMContentLoaded', () => {
    getPosts(); // Rufe die ersten Posts beim Laden der Seite ab
    window.addEventListener('scroll', lazyLoadHandler); // Füge ein Scroll-Event hinzu, um beim Scrollen weitere Posts zu laden
});

    // Funktion zum Abmelden des Benutzers
    document.getElementById('signoutBtn').addEventListener('click', () => {
        localStorage.removeItem('user');
        localStorage.removeItem('mode'); 
        window.location.href = '/login'; // Auf die Login-Seite weiterleiten
    });

    document.getElementById('postForm').addEventListener('submit', createPost);

    getPosts();
    showWelcomeMessage();
    applyHoverEffectToPosts();

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

    function formatCode(text) {
    return text.replace(/\n/g);
}

// Beispielaufruf
var postContent = document.getElementById('postContent').value;
var formattedPostContent = formatCode(postContent);


    // Funktion zum Anwenden des Hover-Effekts auf alle Posts
    function applyHoverEffectToPosts() {
        const posts = document.querySelectorAll(".post");
        posts.forEach(post => {
            addHoverEffect(post); // Füge den Hover-Effekt zu jedem Post hinzu
        });
    }

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
            console.log('Mode Loaded:', mode);
            
    // console.log('Y');
    // console.log('YO');
    // console.log('YOO');
    // console.log('YOOO');
    // console.log('YOOO.');
    // console.log('YOOO. ');
    // console.log('YOOO. I');
    // console.log('YOOO. I.');
    // console.log('YOOO. I. ');
    // console.log('YOOO. I. S');
    // console.log('YOOO. I. SE');
    // console.log('YOOO. I. SEE');
    // console.log('YOOO. I. SEE.');
    // console.log('YOOO. I. SEE. ');
    // console.log('YOOO. I. SEE. Y');
    // console.log('YOOO. I. SEE. YO');
    // console.log('YOOO. I. SEE. YOU');
    // console.log('YOOO. I. SEE. YOU.');
    // console.log('YOOO. I. SEE. YOU.');
    // console.log('YOOO. I. SEE. YOU');
    // console.log('YOOO. I. SEE. YO');
    // console.log('YOOO. I. SEE. Y')
    // console.log('YOOO. I. SEE. ');
    // console.log('YOOO. I. SEE.');
    // console.log('YOOO. I. SEE');
    // console.log('YOOO. I. SE');
    // console.log('YOOO. I. S');
    // console.log('YOOO. I. ');
    // console.log('YOOO. I.');
    // console.log('YOOO. I');
    // console.log('YOOO. ');
    // console.log('YOOO.');
    // console.log('YOOO');
    // console.log('YOO');
    // console.log('YO');
    // console.log('Y');
}

    loadModePreference();

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

    async function fetchUserData(username) {
    try {
        const response = await fetch(`/api/profile/${username}`);
        const userData = await response.json();
        return userData;
    } catch (error) {
        throw new Error('Fehler beim Abrufen der Benutzerdaten.');
    }
}

async function fetchFollowers(username) {
    try {
        const response = await fetch(`/api/profile/${username}`);
        const userData = await response.json();
        const followers = userData.followers || [];
        return followers;
    } catch (error) {
        throw new Error('Fehler beim Abrufen der Follower.');
    }
}

async function displayFollowersWithPictures() {
    const savedUser = localStorage.getItem('user');
    let username = null;

    if (savedUser) {
        const { identifier } = JSON.parse(savedUser);
        username = identifier;
    }

    if (username) {
        try {
            const followers = await fetchFollowers(username);
            const followerList = document.getElementById('follower-list');
            followerList.innerHTML = ''; // Leere die vorherige Liste

            const maxUsers = 5;
            let count = 0;

            for (const follower of followers) {
                if (count >= maxUsers) break;
                
                const userData = await fetchUserData(follower);
                const followerItem = document.createElement('li');

                // Erstelle das Profilbild-Element und füge die Stile hinzu
                const profilePicture = new Image();
                profilePicture.src = userData.pb;
                profilePicture.alt = `${userData.username}'s Profilbild`;
                profilePicture.style.width = '25px';
                profilePicture.style.height = '25px';
                profilePicture.style.borderRadius = '50%';
                profilePicture.style.float = 'left';
                profilePicture.style.marginRight = '5px';
                followerItem.appendChild(profilePicture);

                // Erstelle den Benutzernamen-Text und füge ihn hinzu
                const usernameElement = document.createElement('span');
                usernameElement.textContent = userData.username;
                followerItem.appendChild(usernameElement);

                // Füge den Follower der Liste hinzu
                followerList.appendChild(followerItem);

                count++;
            }

            // Falls es mehr als fünf Benutzer gibt, füge einen "Other" Button hinzu
            if (followers.length > maxUsers) {
                const otherButton = document.createElement('button');
                otherButton.textContent = 'Other';
                otherButton.addEventListener('click', () => {
                    // Funktion, um das Overlay anzuzeigen, wenn auf den "Other" Button geklickt wird
                });
                followerList.appendChild(otherButton);
            }
        } catch (error) {
            console.error('Fehler:', error);
        }
    } else {
        console.error('Benutzername nicht gefunden.');
    }
}

// Rufe die Funktion zum Anzeigen der Follower mit Profilbildern auf
displayFollowersWithPictures();

async function toggleLike(postId) {
    const likesButton = document.getElementById(`likesButton_${postId}`);
    if (!likesButton) return; // Wenn der Button nicht gefunden wird, brechen Sie ab

    let isLiked = localStorage.getItem(`liked_${postId}`) === 'true';


    try {
        if (isLiked) {
            await removeLike(postId);
            likesButton.innerHTML = `<img width="25" height="25" src="https://img.icons8.com/ios/50/like--v1.png" alt="like--v1"/>`;
            isLiked = false;
            localStorage.removeItem(`liked_${postId}`);
        } else {
            await saveLike(postId);
            likesButton.innerHTML = `<img width="25" height="25" src="https://img.icons8.com/ios-filled/50/FA5252/like--v1.png" alt="like--v1"/>`;
            isLiked = true;
            localStorage.setItem(`liked_${postId}`, true);
        }

        const updatedLikesCount = await getLikes(postId);
        updateLikesElement(postId, updatedLikesCount);

        // Füge die Pop-Animation-Klasse hinzu
        likesButton.classList.add('pop');

        // Entferne die Pop-Animation-Klasse nach einer Verzögerung von 300ms
        setTimeout(() => {
            likesButton.classList.remove('pop');
        }, 300);
    } catch (error) {
        console.error('Fehler:', error);
    }
}

// Fügen Sie den Event-Listener für den Like-Button hinzu
document.addEventListener('click', function(event) {
    if (event.target.classList.contains('like-button')) {
        const postId = event.target.dataset.postId;
        if (postId) {
            toggleLike(postId);
        }
    }
});

async function saveLike(postId) {
    try {
        const response = await fetch(`/posts/${postId}/like`, {
            method: 'POST'
        });

        if (!response.ok) {
            throw new Error('Fehler beim Speichern des Likes');
        }

        const data = await response.json();
        (data.message); // Erfolgsmeldung vom Server
    } catch (error) {
        console.error('Fehler:', error);
    }
}

async function removeLike(postId) {
    try {
        const response = await fetch(`/posts/${postId}/unlike`, {
            method: 'POST'
        });

        if (!response.ok) {
            throw new Error('Fehler beim Entfernen des Likes');
        }

        const data = await response.json();
        (data.message); // Erfolgsmeldung vom Server
    } catch (error) {
        console.error('Fehler:', error);
    }
}

async function getLikes(postId) {
    try {
        (postId)
        const response = await fetch(`/posts/${postId}`);
        if (!response.ok) {
            throw new Error('Fehler beim Abrufen der Likes');
        }
        const data = await response.json();
        return data.likes;
    } catch (error) {
        console.error('Fehler:', error);
        return 0; // Standardwert, falls ein Fehler auftritt
    }
}

function updateLikesElement(postId, updatedLikesCount) {
    const likesElement = document.getElementById(`likesCount_${postId}`);
    if (likesElement) {
        likesElement.textContent = `Likes: ${updatedLikesCount}`;
    }
}

// IEFHIEFH

// Event-Listener für den Button "Generate Posts" hinzufügen
document.getElementById('generatePostsBtn').addEventListener('click', createGenPosts);

// Funktion zum Generieren einer zufälligen Anzahl von Beiträgen
async function createGenPosts(event) {
    event.preventDefault(); // Verhindert das Standardformularverhalten

    const numberOfPosts = parseInt(prompt('How many posts do you want to create? (1 - 500)'));

    // Überprüfen, ob die eingegebene Anzahl gültig ist
    if (isNaN(numberOfPosts) || numberOfPosts < 1 || numberOfPosts > 500) {
        alert('Please enter a valid number between 1 and 500.');
        return;
    }

    try {
        // Schleife zum Erstellen der angegebenen Anzahl von Beiträgen
        for (let i = 0; i < numberOfPosts; i++) {
            // Generiere einen zufälligen Inhalt und eine zufällige Beschreibung für den Beitrag
            const postContent = generateRandomContent();
            const postDescription = generateRandomDescription();

            // POST-Anfrage zum Erstellen des Beitrags
            const response = await fetch('/api/posts', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ 
                    codesnippet: postContent, 
                    username: username, 
                    content: postDescription, 
                    likes: 0,
                    replies: [],
                    pinned: false,
                })
            });

            // Überprüfen, ob die POST-Anfrage erfolgreich war
            if (!response.ok) {
                throw new Error('Failed to create post');
            }

            (`Post ${i + 1} created successfully.`);
        }

        // Hier können Sie eine Erfolgsmeldung anzeigen oder andere Aktionen ausführen
        alert(`${numberOfPosts} posts created successfully.`);
    } catch (error) {
        console.error('Error creating posts:', error);
        // Hier können Sie eine Fehlermeldung anzeigen oder andere Fehlerbehandlungen durchführen
        alert('An error occurred while creating posts.');
    }
}


// Funktion zum Generieren eines zufälligen Inhalts für den Beitrag
function generateRandomContent() {
    const contentOptions = [
        'Lorem ipsum dolor sit amet, consectetur adipiscing elit.',
        'Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
        'Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.',
        'Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.',
        'Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.'
    ];
    const randomIndex = Math.floor(Math.random() * contentOptions.length);
    return contentOptions[randomIndex];
}

// Funktion zum Generieren einer zufälligen Beschreibung für den Beitrag
function generateRandomDescription() {
    const descriptionOptions = [
        'Lorem ipsum dolor sit amet, consectetur adipiscing elit.',
        'Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
        'Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.',
        'Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.',
        'Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.'
    ];
    const randomIndex = Math.floor(Math.random() * descriptionOptions.length);
    return descriptionOptions[randomIndex];
}

async function fetchAllUserBadges() {
    try {
        // API-Anfrage, um alle Benutzer abzurufen
        const response = await fetch(`/api/username`);
        const data = await response.json();

        // Überprüfen, ob die Antwort erfolgreich war
        if (response.ok) {
            // Iteriere über jeden Benutzer und rufe seine Badges ab
            for (const user of data.users) {
                const username = user.username;
                // API-Anfrage, um die Badges für den aktuellen Benutzer abzurufen
                const badgeResponse = await fetch(`/api/${username}/badges`);
                const badgeData = await badgeResponse.json();
                const badges = badgeData.badges;
                (`Badges für Benutzer ${username}:`);
                
                // Überprüfen, ob der Benutzer Badges hat
                if (badges.length > 0) {
                    // Nur das letzte Badge des Benutzers verwenden
                    const lastBadge = badges[badges.length - 1];
                    const badgeElement = document.createElement('img');
                    badgeElement.src = lastBadge.image;
                    badgeElement.alt = lastBadge.name;
                    badgeElement.style.width = '10px';
                    badgeElement.style.height = '10px';
                    badgeElement.style.float = 'right';
                    
                    // Benutzername mit dem Badge anzeigen
                    (`Benutzer ${username} hat das folgende Badge:`);
                    (lastBadge);
                    ('------');
                    
                    // Hier fügen Sie das Badge-Element zum Benutzername-Element hinzu
                    const usernameElement = document.createElement('span');
                    usernameElement.textContent = `@${username}`;
                    usernameElement.appendChild(badgeElement);
                
                } else {
                    (`Benutzer ${username} hat keine Badges.`);
                }
            }
        } else {
            console.error('Fehler beim Abrufen der Benutzer und Badges:', data.error);
        }
    } catch (error) {
        console.error('Fehler beim Abrufen der Benutzer und Badges:', error);
    }
}

// Aufruf der Funktion zum Abrufen aller Benutzer und ihrer Badges
fetchAllUserBadges();

