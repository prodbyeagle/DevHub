document.addEventListener('DOMContentLoaded', () => {
    const loggedInStatus = document.getElementById('loggedInStatus');

    const storedUser = localStorage.getItem('user');
    const urlParams = new URLSearchParams(window.location.search);
    const user = urlParams.get('user');

    if (storedUser) {
        const usernameData = JSON.parse(storedUser);
        const username = usernameData.identifier;
        loggedInStatus.textContent = `⚠️ Already logged in with: ${username}`;
    } else if (user) {
        // Benutzerdaten aus der URL extrahieren und im localStorage speichern
        localStorage.setItem('user', user);
        console.log('User data saved in localStorage:', user);
        window.location.href = '/home'; // Optional: Weiterleitung zur Home-Seite
    }
});

    document.getElementById('loginForm').addEventListener('submit', async (event) => {
        event.preventDefault(); // Standardformularübermittlung verhindern

        const identifier = document.getElementById('identifier').value;
        const password = document.getElementById('password').value;
        const rememberMe = document.getElementById('rememberMe').checked;

        try {
            const response = await fetch('/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    identifier: identifier, // Hier wird entweder die E-Mail-Adresse oder der Benutzername übermittelt
                    password: password
                })
            });

            if (response.ok) {
                // Wenn "Remember me" ausgewählt ist, Benutzerdaten im lokalen Speicher überschreiben
                if (rememberMe) {
                    localStorage.setItem('user', JSON.stringify({ identifier, password }));
                } else {
                    localStorage.setItem('user', JSON.stringify({ identifier, password }));
                }

                window.location.href = '/home'; // Weiterleitung zur Startseite nach erfolgreicher Anmeldung
            } else if (response.status === 401) {
                // Fehlermeldung anzeigen, wenn Anmeldeinformationen ungültig sind
                Toastify({
                    text: 'Invalid username, or password (You need to use your username (Email not Valid)',
                    style: {
                        background: 'linear-gradient(to right, #ff416c, #ff4b2b)',
                    },
                    className: 'rounded', // Abgerundete Ecken hinzufügen
                    duration: 3000
                }).showToast();
            } else {
                // Fehlermeldung anzeigen, wenn Anmeldung fehlgeschlagen ist
                Toastify({
                    text: 'Login failed! Please try again.',
                    style: {
                        background: 'linear-gradient(to right, #ff416c, #ff4b2b)',
                    },
                    className: 'rounded', // Abgerundete Ecken hinzufügen
                    duration: 3000
                }).showToast();
            }
        } catch (error) {
            console.error('Error logging in:', error);
            // Fehlermeldung anzeigen, wenn ein Fehler beim Einloggen aufgetreten ist
            Toastify({
                text: 'An error occurred while logging in. Please try again later.',
                style: {
                    background: 'linear-gradient(to right, #ff416c, #ff4b2b)',
                },
                className: 'rounded', // Abgerundete Ecken hinzufügen
                duration: 3000
            }).showToast();
        }
    });

    window.onload = async () => {
        try {
            const savedUser = localStorage.getItem('user');
            if (savedUser) {
                const { identifier, password, provider } = JSON.parse(savedUser);
                document.getElementById('identifier').value = identifier;

            }
        } catch (error) {
            console.error('Error loading saved user:', error);
        }
    };

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
        }
        loadModePreference();


console.log('%cWARNING! %cBe cautious!\nIf someone instructs you to paste code here, it could be a scammer or hacker attempting to exploit your system.', 'font-size: 20px; color: yellow;', 'font-size: 14px; color: white;');
console.log('%cWARNING! %cBe cautious!\nIf someone instructs you to paste code here, it could be a scammer or hacker attempting to exploit your system.', 'font-size: 20px; color: yellow;', 'font-size: 14px; color: white;');
console.log('%cWARNING! %cBe cautious!\nIf someone instructs you to paste code here, it could be a scammer or hacker attempting to exploit your system.', 'font-size: 20px; color: yellow;', 'font-size: 14px; color: white;');
console.log('%cWARNING! %cBe cautious!\nIf someone instructs you to paste code here, it could be a scammer or hacker attempting to exploit your system.', 'font-size: 20px; color: yellow;', 'font-size: 14px; color: white;');
