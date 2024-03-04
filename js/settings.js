document.addEventListener('DOMContentLoaded', async function() {
    try {
        const savedUser = localStorage.getItem('user');
        if (!savedUser) {
            sendErrorToAdminPanel('User not found in local storage');
            return;
        }
        const { identifier, password, email } = JSON.parse(savedUser);

        const response = await fetch('/api/username');
        const userData = await response.json();

        // Find the user that matches the stored user data
        const matchedUser = userData.users.find(user => (user.username === identifier || user.email === identifier) && user.password === password);

        if (matchedUser) {
            // Check if the user is banned
            if (matchedUser.banned) {
                // The user is banned, show the banned overlay
                showBannedOverlay(matchedUser.username);
            } else {
                // The user is not banned, display the user data
                document.getElementById('username').textContent = matchedUser.username;
                document.getElementById('email').textContent = '********************';
                document.getElementById('password').textContent = '********************';
                // Set the password in an attribute to restore it later
                document.getElementById('password').setAttribute('data-real-password', matchedUser.password);
                document.getElementById('email').setAttribute('data-real-email', matchedUser.email);
            }
        } else {
            sendErrorToAdminPanel('User data does not match stored user');
        }
    } catch (error) {
        sendErrorToAdminPanel('Error fetching user data:', error);
    }
});

// Überprüfen Sie die Benutzersperrstatus
const userData = JSON.parse(localStorage.getItem('user'));
if (!userData || !userData.identifier) {
    sendErrorToAdminPanel('User identifier not found in local storage');
} else {
    const username = userData.identifier;
    checkUserBanStatus(username);
}

async function checkUserBanStatus(username) {
    try {
        const userResponse = await fetch(`/api/profile/${username}`);
        const userDataResponse = await userResponse.json();
        if (userDataResponse.banned) {
            localStorage.clear();
            window.location.href = '/login';
        } else {
        }
    } catch (error) {
        sendErrorToAdminPanel('Error fetching user data:', error);
    }
}

// JavaScript für das Anzeigen/Verbergen des Passworts
document.getElementById('togglePasswordVisibility').addEventListener('click', function() {
    const passwordField = document.getElementById('password');
    const realPassword = passwordField.getAttribute('data-real-password');

    // Überprüfe, ob das Passwortfeld bereits sichtbar ist
    if (passwordField.textContent === realPassword) {
        // Ändere den Text auf '******', um das Passwort zu verbergen
        passwordField.textContent = '*****************';
    } else {
        // Zeige das echte Passwort an
        passwordField.textContent = realPassword;
    }
});

// JavaScript für das Anzeigen/Verbergen der E-Mail
document.getElementById('toggleEmailVisibility').addEventListener('click', function() {
    const emailField = document.getElementById('email');
    const realEmail = emailField.getAttribute('data-real-email');

    // Überprüfe, ob das E-Mail-Feld bereits sichtbar ist
    if (emailField.textContent === realEmail) {
        // Ändere den Text auf '******', um das E-Mail zu verbergen
        emailField.textContent = '*****************';
    } else {
        // Zeige die echte E-Mail an
        emailField.textContent = realEmail;
    }
});

    // JavaScript für Dark/White Mode Switch und das Speichern des Moduswerts im Benutzerprofil
    const modeSwitch = document.getElementById('modeSwitch');
    modeSwitch.addEventListener('change', () => {
        if (modeSwitch.checked) {
            document.body.classList.remove('light-mode');
            document.body.classList.add('dark-mode');
            saveModePreference('dark');
        } else {
            document.body.classList.remove('dark-mode');
            document.body.classList.add('light-mode');
            saveModePreference('light');
        }
    });
    
    function saveModePreference(mode) {
        // Hier wird der Moduswert im Benutzerprofil gespeichert
        localStorage.setItem('mode', mode);
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
        }
        loadModePreference();
    
// JavaScript, um das Passwortänderungs-Overlay zu öffnen
document.getElementById('openChangePasswordOverlayBtn').addEventListener('click', function() {
    document.getElementById('changePasswordOverlay').classList.remove('hidden');
});

// JavaScript, um das Passwortänderungs-Overlay zu schließen
document.getElementById('closePasswordOverlay').addEventListener('click', function() {
    document.getElementById('changePasswordOverlay').classList.add('hidden');
});

const changePasswordForm = document.getElementById('changePasswordForm'); // Ändern Sie die ID hier
changePasswordForm.addEventListener('submit', async (event) => {
    event.preventDefault(); // Verhindert das Standardverhalten des Formulars (z. B. Neuladen der Seite)

    const currentPassword = document.getElementById('currentPassword').value;
    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;

    try {
        // Überprüfen, ob der Benutzer im Local Storage vorhanden ist
        const savedUser = localStorage.getItem('user');
        if (!savedUser) {
            sendErrorToAdminPanel('User not found in local storage');
            return;
        }

        // Parse die Benutzerdaten aus dem Local Storage
        const { identifier, password } = JSON.parse(savedUser);

        console.log('Sending password change request...');
        console.log('Current Password:', currentPassword);
        console.log('New Password:', newPassword);

        // Senden der Passwortänderungsanforderung an den Server
        const response = await fetch('/api/profile/change/passwort', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                username: identifier, // Verwende den Benutzernamen aus dem Local Storage
                currentPassword: currentPassword, // Hier wird das aktuelle Passwort gesendet
                newPassword: newPassword
            })
        });

        console.log('Response received:', response);

        if (response.ok) {
            const savedUser = JSON.parse(localStorage.getItem('user'));
            savedUser.password = newPassword;
            localStorage.setItem('user', JSON.stringify(savedUser));
            Toastify({
                text: 'Password changed successfully',
                duration: 3000,
                close: true,
                backgroundColor: 'linear-gradient(to right, #00b09b, #96c93d)',
            }).showToast();
            document.getElementById('changePasswordOverlay').classList.add('hidden');
        } else {
            sendErrorToAdminPanel('Failed to change password:', response.statusText);
            // Hier kannst du eine Fehlermeldung anzeigen
            Toastify({
                text: 'Failed to change password: ' + response.statusText,
                duration: 3000,
                close: true,
                backgroundColor: 'linear-gradient(to right, #ff416c, #ff4b2b)',
            }).showToast();
        }
    } catch (error) {
        sendErrorToAdminPanel('Error changing password:', error);
        // Hier kannst du eine Fehlermeldung anzeigen
        Toastify({
            text: 'Error changing password: ' + error,
            duration: 3000,
            close: true,
            backgroundColor: 'linear-gradient(to right, #ff416c, #ff4b2b)',
        }).showToast();
    }
});

// // JavaScript, um das Benutzernamenänderungs-Overlay zu öffnen
// document.getElementById('openChangeUsernameOverlayBtn').addEventListener('click', function() {
//     document.getElementById('changeUsernameOverlay').classList.remove('hidden');
// });
// 
// // JavaScript, um das Benutzernamenänderungs-Overlay zu schließen
// document.getElementById('closeUsernameOverlay').addEventListener('click', function() {
//     document.getElementById('changeUsernameOverlay').classList.add('hidden');
// });
// 
// const changeUsernameForm = document.getElementById('changeUsernameForm');
// changeUsernameForm.addEventListener('submit', async (event) => {
//     event.preventDefault(); // Verhindert das Standardverhalten des Formulars (z. B. Neuladen der Seite)
// 
//     const currentUsername = document.getElementById('currentUsername').value; // Aktuelles Passwort
//     const newUsername = document.getElementById('newUsername').value; // Neuer Benutzername
//     const confirmUsername = document.getElementById('confirmUsername').value; // Bestätigung des neuen Benutzernamens
// 
//     try {
//         // Überprüfen, ob der Benutzer im Local Storage vorhanden ist
//         const savedUser = localStorage.getItem('user');
//         if (!savedUser) {
//             sendErrorToAdminPanel('User not found in local storage');
//             return;
//         }
// 
//         // Parse die Benutzerdaten aus dem Local Storage
//         const { identifier } = JSON.parse(savedUser);
// 
//         // Überprüfen, ob das neue Benutzernamenfeld nicht leer ist
//         if (!newUsername) {
//             sendErrorToAdminPanel('New username cannot be empty');
//             return;
//         }
// 
//         // Überprüfen, ob der neue Benutzername mit der Bestätigung übereinstimmt
//         if (newUsername !== confirmUsername) {
//             sendErrorToAdminPanel('New username and confirm username do not match');
//             return;
//         }
// 
//         console.log('Sending username change request...');
//         console.log('New Username:', newUsername);
// 
//         // Senden der Benutzernamenänderungsanforderung an den Server
//         const response = await fetch('/api/profile/change/username', {
//             method: 'POST',
//             headers: {
//                 'Content-Type': 'application/json'
//             },
//             body: JSON.stringify({
//                 username: identifier, // Aktueller Benutzername
//                 currentUsername: currentUsername, // Aktuelles Passwort
//                 newUsername: newUsername // Neuer Benutzername
//             })
//         });
// 
//         console.log('Response received:', response);
// 
//         if (response.ok) {
//             const savedUser = JSON.parse(localStorage.getItem('user'));
//             savedUser.identifier = newUsername; // Aktualisieren Sie den Benutzernamen im Local Storage
//             localStorage.setItem('user', JSON.stringify(savedUser));
//             Toastify({
//                 text: 'Username changed successfully',
//                 duration: 3000,
//                 close: true,
//                 backgroundColor: 'linear-gradient(to right, #00b09b, #96c93d)',
//             }).showToast();
//             document.getElementById('changeUsernameOverlay').classList.add('hidden');
//         } else {
//             sendErrorToAdminPanel('Failed to change username:', response.statusText);
//             // Hier kannst du eine Fehlermeldung anzeigen
//             Toastify({
//                 text: 'Failed to change username: ' + response.statusText,
//                 duration: 3000,
//                 close: true,
//                 backgroundColor: 'linear-gradient(to right, #ff416c, #ff4b2b)',
//             }).showToast();
//         }
//     } catch (error) {
//         sendErrorToAdminPanel('Error changing username:', error);
//         // Hier kannst du eine Fehlermeldung anzeigen
//         Toastify({
//             text: 'Error changing username: ' + error,
//             duration: 3000,
//             close: true,
//             backgroundColor: 'linear-gradient(to right, #ff416c, #ff4b2b)',
//         }).showToast();
//     }
// });


// // JavaScript, um das E-Mail-Änderungs-Overlay zu öffnen
// document.getElementById('openChangeEmailOverlayBtn').addEventListener('click', function() {
//     document.getElementById('changeEmailOverlay').classList.remove('hidden');
// });
// 
// // JavaScript, um das E-Mail-Änderungs-Overlay zu schließen
// document.getElementById('closeEmailOverlay').addEventListener('click', function() {
//     document.getElementById('changeEmailOverlay').classList.add('hidden');
// });
// 
// const changeEmailForm = document.getElementById('changeEmailForm');
// changeEmailForm.addEventListener('submit', async (event) => {
//     event.preventDefault(); // Verhindert das Standardverhalten des Formulars (z. B. Neuladen der Seite)
// 
//     const currentPassword = document.getElementById('currentPassword').value; // Aktuelles Passwort
//     const newEmail = document.getElementById('newEmail').value; // Neue E-Mail-Adresse
//     const confirmEmail = document.getElementById('confirmEmail').value; // Bestätigung der neuen E-Mail-Adresse
// 
//     try {
//         // Überprüfen, ob der Benutzer im Local Storage vorhanden ist
//         const savedUser = localStorage.getItem('user');
//         if (!savedUser) {
//             sendErrorToAdminPanel('User not found in local storage');
//             return;
//         }
// 
//         // Parse die Benutzerdaten aus dem Local Storage
//         const { identifier } = JSON.parse(savedUser);
// 
//         // Überprüfen, ob das neue E-Mail-Feld nicht leer ist
//         if (!newEmail) {
//             sendErrorToAdminPanel('New email cannot be empty');
//             return;
//         }
// 
//         // Überprüfen, ob die neue E-Mail-Adresse mit der Bestätigung übereinstimmt
//         if (newEmail !== confirmEmail) {
//             sendErrorToAdminPanel('New email and confirm email do not match');
//             return;
//         }
// 
//         console.log('Sending email change request...');
//         console.log('New Email:', newEmail);
// 
//         // Senden der E-Mail-Änderungsanforderung an den Server
//         const response = await fetch('/api/profile/change/email', {
//             method: 'POST',
//             headers: {
//                 'Content-Type': 'application/json'
//             },
//             body: JSON.stringify({
//                 username: identifier, // Aktueller Benutzername
//                 currentEmail: currentEmail, // Aktuelles Passwort
//                 newEmail: newEmail // Neue E-Mail-Adresse
//             })
//         });
// 
//         console.log('Response received:', response);
// 
//         if (response.ok) {
//             Toastify({
//                 text: 'Email changed successfully',
//                 duration: 3000,
//                 close: true,
//                 backgroundColor: 'linear-gradient(to right, #00b09b, #96c93d)',
//             }).showToast();
//             document.getElementById('changeEmailOverlay').classList.add('hidden');
//         } else {
//             sendErrorToAdminPanel('Failed to change email:', response.statusText);
//             // Hier kannst du eine Fehlermeldung anzeigen
//             Toastify({
//                 text: 'Failed to change email: ' + response.statusText,
//                 duration: 3000,
//                 close: true,
//                 backgroundColor: 'linear-gradient(to right, #ff416c, #ff4b2b)',
//             }).showToast();
//         }
//     } catch (error) {
//         sendErrorToAdminPanel('Error changing email:', error);
//         // Hier kannst du eine Fehlermeldung anzeigen
//         Toastify({
//             text: 'Error changing email: ' + error,
//             duration: 3000,
//             close: true,
//             backgroundColor: 'linear-gradient(to right, #ff416c, #ff4b2b)',
//         }).showToast();
//     }
// });

// Delete User Account

document.getElementById('deleteAccountBtn').addEventListener('click', async () => {
    try {
        // Benutzernamen aus dem lokalen Speicher abrufen
        const { identifier: username } = JSON.parse(localStorage.getItem('user'));

        // Benutzer aus der Datenbank entfernen
        const response = await fetch(`/api/profile/delete/${username}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error('Failed to delete account');
        }

        // Löschen aller Posts des Benutzers
        const deletePostsResponse = await fetch(`/api/${username}/posts`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (!deletePostsResponse.ok) {
            throw new Error('Failed to delete user posts');
        }

        localStorage.clear();

        window.location.href = '/login';
    } catch (error) {
        sendErrorToAdminPanel('Error deleting account:', error);
        // Hier könntest du eine Benachrichtigung anzeigen oder eine andere Fehlerbehandlung durchführen
    }
});