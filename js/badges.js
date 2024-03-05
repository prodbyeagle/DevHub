document.addEventListener('DOMContentLoaded', () => {
    const addBadgeButton = document.getElementById('add-badge-button');
    const addBadgeOverlay = document.getElementById('add-badge-overlay');
    const closeOverlayButton = document.getElementById('close-overlay-button');
    const badgeForm = document.getElementById('badge-form');
    const assignBadgeButton = document.getElementById('assign-badge-button');
    const assignBadgeOverlay = document.getElementById('assign-badge-overlay');
    const closeAssignOverlayButton = document.getElementById('close-assign-overlay-button');
    const assignBadgeForm = document.getElementById('assign-badge-form');

    // Event-Listener für den Add Badge Button
    addBadgeButton.addEventListener('click', () => {
        addBadgeOverlay.style.display = 'flex';
    });

    // Event-Listener für den Close Overlay Button
    closeOverlayButton.addEventListener('click', () => {
        addBadgeOverlay.style.display = 'none';
    });

    // Event-Listener für den Close Overlay Button
    closeAssignOverlayButton.addEventListener('click', () => {
        assignBadgeOverlay.style.display = 'none';
    });

    document.getElementById('badge-form').addEventListener('submit', async (event) => {
        event.preventDefault();
    
        // Badge-Daten aus dem Formular abrufen
        const name = document.getElementById('badge-name').value;
        const imageFile = document.getElementById('badge-image').files[0];
        const description = document.getElementById('badge-description').value;
    
        try {
            // Überprüfe, ob ein Badge mit demselben Namen bereits existiert
            const existingBadgesResponse = await fetch('/api/admin/badges');
            const existingBadges = await existingBadgesResponse.json();
            const badgeExists = existingBadges.some(badge => badge.name === name);
            if (badgeExists) {
                throw new Error('Ein Badge mit diesem Namen existiert bereits.');
            }
    
            // Konvertiere das Bild in Base64
            const imageBase64 = await convertImageToBase64(imageFile, 0.9, 50, 50);
    
            // Erstellen des JSON-Datenobjekts
            const badgeData = {
                name: name,
                image: imageBase64,
                description: description
            };
    
            // Senden der Badge-Daten an den Server
            const response = await fetch('/api/admin/badges', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(badgeData)
            });
    
            if (!response.ok) {
                throw new Error('Fehler beim Hinzufügen des Badges');
            }
            const data = await response.json();
            console.log('Response:', data);
            addBadgeOverlay.style.display = 'none'; // Overlay schließen
            location.reload();
        } catch (error) {
            console.error('Fehler beim Hinzufügen des Badges:', error);
            // Fehlermeldung im Overlay anzeigen
            const errorMessage = document.getElementById('error-message');
            errorMessage.innerHTML = `<img width="13" height="13" src="https://img.icons8.com/material-rounded/13/FA5252/high-priority.png" alt="high-priority"/> ${error.message}`;
            errorMessage.style.display = 'block';
    
            // Wenn bereits ein Timeout aktiv ist, löschen Sie es
            if (errorMessage.timeoutId) {
                clearTimeout(errorMessage.timeoutId);
            }
    
            // Fehlermeldung nach 5 Sekunden ausblenden
            errorMessage.timeoutId = setTimeout(() => {
                errorMessage.innerHTML = '';
                errorMessage.style.display = 'none';
            }, 5000);
        }
    });
});

async function fetchUserData() {
    const response = await fetch('/api/username');
    if (!response.ok) {
        throw new Error('Failed to fetch user data');
    }
    const userData = await response.json();

    // Überprüfen, ob der Benutzer ein Administrator ist
    const currentUser = JSON.parse(localStorage.getItem('user'));
    const isAdmin = userData.users.find(user => user.username === currentUser.identifier && user.admin);
    if (!isAdmin) {
        window.location.href = '/home'; // Weiterleitung zur Startseite, wenn kein Administrator
    }

    return userData;
}

fetchUserData();

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
const badgeList = document.getElementById('badges-container');
let contextMenu = null; // Variable, um das aktuelle Dropdown-Menü zu speichern

// Funktion zum Laden und Anzeigen der Badges
async function loadBadges() {
    try {
        const response = await fetch('/api/admin/badges');
        if (!response.ok) {
            throw new Error('Fehler beim Laden der Badges');
        }
        const badges = await response.json();
        // Leere den badges-container
        badgeList.innerHTML = '';
        badges.forEach(badge => {
            // Erstelle ein div-Element für das Badge
            const badgeDiv = document.createElement('div');
            badgeDiv.classList.add('badge');
        
            // Erstelle ein h2-Element für den Namen des Badges
            const nameHeading = document.createElement('h2');
            nameHeading.textContent = badge.name;
        
            // Erstelle ein img-Element für das Bild des Badges
            const imageElement = document.createElement('img');
            imageElement.src = badge.image;
            imageElement.alt = badge.name;
            imageElement.style.maxWidth = '100px';
            imageElement.style.maxHeight = '100px';
            imageElement.style.borderRadius = '50%';
        
            // Erstelle ein p-Element für die Beschreibung des Badges
            const descriptionParagraph = document.createElement('p');
            descriptionParagraph.textContent = badge.description;
        
            // Füge die erstellten Elemente dem badgeDiv hinzu
            badgeDiv.appendChild(nameHeading);
            badgeDiv.appendChild(imageElement);
            badgeDiv.appendChild(descriptionParagraph);
        
            // Füge das badgeDiv dem badgeList-Container hinzu
            badgeList.appendChild(badgeDiv);
            
            // Füge das Kontextmenü zum Badge hinzu
            badgeDiv.addEventListener('contextmenu', (event) => {
                // Verhindern, dass das Standardkontextmenü angezeigt wird
                event.preventDefault();
            
                // Position des Kontextmenüs festlegen (z.B. dort, wo der Benutzer geklickt hat)
                const x = event.clientX;
                const y = event.clientY;
            
                // Benutzerdefiniertes Kontextmenü anzeigen
                showContextMenu(x, y);
            });
        
            // Funktion zum Anzeigen des benutzerdefinierten Kontextmenüs
            function showContextMenu(x, y) {
                // Schließe das vorherige Kontextmenü, wenn eines geöffnet ist
                closeContextMenu();
                
                // Dropdown-Menü erstellen
                contextMenu = document.createElement('div');
                contextMenu.classList.add('dropdown-menu');
                
                // Optionen für das Dropdown-Menü erstellen
                const editOption = document.createElement('div');
                editOption.textContent = 'Edit Badge';
                editOption.addEventListener('click', () => {
                    console.log('Edit Badge:', badge.name);
                });

                // Innerhalb der showContextMenu-Funktion, wo du die Optionen für das Dropdown-Menü erstellst
                const assignOption = document.createElement('div');
                assignOption.textContent = 'Assign Badge';
                assignOption.addEventListener('click', () => {
                    console.log('Assign Badge:', badge.name);
                    const assignBadgeOverlay = document.getElementById('assign-badge-overlay');
                    assignBadgeOverlay.style.display = 'flex';
                    document.getElementById('badgename').value = badge.name;
                });
                
                // Optionen für das Dropdown-Menü erstellen
                const deleteOption = document.createElement('div');
                deleteOption.textContent = 'Delete Badge';
                deleteOption.addEventListener('click', () => {
                    // Bestätigungsdialog anzeigen
                    const confirmed = confirm(`Do you really want to DELETE the Badge "${badge.name}" ?`);
                    if (confirmed) {
                        deleteBadge(badge.name);
                    }
                });
                
                const showUsersOption = document.createElement('div');
                showUsersOption.textContent = 'Show All Badge Users';
                showUsersOption.addEventListener('click', () => {
                    fetchAndDisplayBadgeUsers(badge.name);
                    openOverlay(showUsersOptionContent);
                });
                
                // Optionen zum Dropdown-Menü hinzufügen
                contextMenu.appendChild(editOption);
                contextMenu.appendChild(assignOption);
                contextMenu.appendChild(deleteOption);
                contextMenu.appendChild(showUsersOption);
                
                // Position des Dropdown-Menüs festlegen
                contextMenu.style.left = `${x}px`;
                contextMenu.style.top = `${y}px`;
                
                // Dropdown-Menü zum Dokument hinzufügen
                document.body.appendChild(contextMenu);
                
                // Event-Listener zum Schließen des Dropdown-Menüs bei Klick außerhalb
                document.addEventListener('click', closeContextMenu);
            }
            
            // Funktion zum Schließen des Dropdown-Menüs
            function closeContextMenu() {
                if (contextMenu) {
                    contextMenu.remove();
                    contextMenu = null;
                    document.removeEventListener('click', closeContextMenu);
                }
            }
        });
    } catch (error) {
        console.error('Fehler beim Laden der Badges:', error);
        // Hier könntest du eine Fehlermeldung anzeigen
    }
}
// Lade die Badges, wenn die Seite geladen ist
loadBadges();

document.getElementById('assign-badge-form').addEventListener('submit', async (event) => {
    event.preventDefault();
    const badgeName = document.getElementById('badgename').value;
    const username = document.getElementById('username').value;
    
    try {
        // Hier rufst du die API auf, um die Badge-Details abzurufen
        const badgeDetailsResponse = await fetch('/api/admin/badges');
        const badgeDetails = await badgeDetailsResponse.json();
        
        // Hier suchst du die Details für das spezifische Badge basierend auf dem Namen
        const selectedBadge = badgeDetails.find(badge => badge.name === badgeName);
        
        if (!selectedBadge) {
            throw new Error('Badge nicht gefunden');
        }

        // Hier sendest du die Daten einschließlich des Badge-Namens, Bilds und der Beschreibung an den Server
        const response = await fetch('/api/admin/assign-badge', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ 
                badgeName: badgeName,
                badgeImage: selectedBadge.image,
                badgeDescription: selectedBadge.description,
                username: username 
            })
        });

        if (!response.ok) {
            throw new Error('Fehler beim Zuweisen des Badges zum Benutzer');
        }

        alert('Badge wurde dem Benutzer zugewiesen.');
    } catch (error) {
        console.error('Fehler beim Zuweisen des Badges zum Benutzer:', error);
        alert('Fehler beim Zuweisen des Badges zum Benutzer.');
    }
});

// Funktion zum Öffnen eines Overlays mit dem übergebenen Inhalt
function openOverlay(content) {
    // Erstelle das Overlay-Element
    const overlay = document.createElement('div');
    overlay.classList.add('overlay');

    const overlayContent = document.createElement('div');
    overlayContent.classList.add('overlay-content');
    overlayContent.innerHTML = content;
    overlay.appendChild(overlayContent);
    document.body.appendChild(overlay);

    const closeButton = document.createElement('span');
    closeButton.classList.add('close-button');
    closeButton.innerHTML = '&times;';
    closeButton.addEventListener('click', function() {
        closeOverlay(overlay);
    });
    overlayContent.appendChild(closeButton);

    function closeOverlay(overlay) {
        overlay.remove();
    }
}

// Zuerst den HTML-Inhalt für das Overlay erstellen (hier verwenden wir einfach den Text von showUsersOption)
const showUsersOptionContent = `
    <h2>Show All Badge Users</h2>
`;

async function fetchAndDisplayBadgeUsers(badgeName) {
    try {
        const response = await fetch('/api/username');
        if (!response.ok) {
            throw new Error('Fehler beim Laden der Benutzerdaten');
        }
        const userData = await response.json();
        const badgeUsers = userData.users.filter(user => user.badges.some(b => b.name === badgeName));
        if (badgeUsers.length > 0) {
            const overlay = document.querySelector('.overlay-content');
            displayBadgeUsers(badgeUsers, overlay);
        } else {
            console.log('User does not have the specified badge.');
        }
    } catch (error) {
        console.error('Fehler beim Laden der Benutzerdaten:', error);
        // Hier könntest du eine Fehlermeldung anzeigen
    }
}

// Funktion zum Anzeigen der Benutzer mit einem bestimmten Badge im Overlay
function displayBadgeUsers(users, overlay) {
    // Überprüfen, ob das Overlay-Element vorhanden ist
    if (!overlay) {
        console.error('Overlay nicht gefunden.');
        return;
    }

    // Das Overlay-Inhalt-Element erstellen
    const overlayContent = document.createElement('div');
    overlayContent.classList.add('overlay-content');

    // Wenn Benutzer vorhanden sind, füge sie der Benutzerliste hinzu
    if (users.length > 0) {
        const userList = document.createElement('ul');
        users.forEach(user => {
            const listItem = document.createElement('li');
            listItem.textContent = user.username;
            userList.appendChild(listItem);
        });
        overlayContent.appendChild(userList);
    } else {
        // Wenn keine Benutzer vorhanden sind, füge einen Platzhalter hinzu
        const placeholderItem = document.createElement('p');
        placeholderItem.textContent = 'Keine Benutzer mit diesem Badge gefunden.';
        overlayContent.appendChild(placeholderItem);
    }

    // Das Overlay-Inhalt-Element zum Overlay hinzufügen
    overlay.appendChild(overlayContent);
}

async function deleteBadge(badgeName) {
    try {
        // Schritt 1: Badge aus der Datenbank löschen
        const deleteResponse = await fetch(`/api/admin/badges/${badgeName}`, {
            method: 'DELETE'
        });
        
        if (!deleteResponse.ok) {
            throw new Error('Fehler beim Löschen des Badges');
        }
        
        console.log(`Das Badge "${badgeName}" wurde erfolgreich gelöscht.`);

        // Schritt 2: Benutzerdaten abrufen
        const response = await fetch('/api/username');
        if (!response.ok) {
            throw new Error('Fehler beim Laden der Benutzerdaten');
        }
        const userData = await response.json();

        // Schritt 3: Badge aus der Liste der Badges jedes Benutzers entfernen
        const updatedUsers = userData.users.map(user => {
            const updatedBadges = user.badges.filter(badge => badge.name !== badgeName);
            return { ...user, badges: updatedBadges };
        });

        // Schritt 4: Aktualisierte Benutzerdaten an den Server senden
        const updateResponse = await fetch('/api/username', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ users: updatedUsers })
        });

        if (!updateResponse.ok) {
            throw new Error('Fehler beim Aktualisieren der Benutzerdaten');
        }

        console.log(`Das Badge "${badgeName}" wurde erfolgreich von den Benutzern entfernt.`);

        // Schritt 5: Seite neu laden, um die Änderungen anzuzeigen
        location.reload();
    } catch (error) {
        console.error('Fehler beim Löschen des Badges:', error);
        // Hier könnten Sie eine Fehlermeldung anzeigen
    }
}