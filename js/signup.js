document.addEventListener('DOMContentLoaded', () => {
    const storedUser = localStorage.getItem('user');

    if (storedUser) {
        alert('You are already logged in. Please log out first to change your account.');
        window.location.href = '/home';
    }

    const urlParams = new URLSearchParams(window.location.search);
    const user = urlParams.get('user');

    if (user) {
        // Benutzerdaten aus der URL extrahieren und im localStorage speichern
        localStorage.setItem('user', user);
        window.location.href = '/home'; // Optional: Weiterleitung zur Home-Seite
    }
});

// Event-Listener für das Absenden des Anmeldeformulars
document.getElementById('signupForm').addEventListener('submit', async (event) => {
    event.preventDefault(); // Standardformularübermittlung verhindern

    const email = document.getElementById('email').value;
    const identifier = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;

    // Überprüfen, ob das Passwort und die Bestätigung übereinstimmen
    if (password !== confirmPassword) {
        console.error('Password and confirmation do not match');
        return;
    }

    // Überprüfen, ob der Benutzername spezielle Zeichen oder Leerzeichen enthält
    const regex = /^[a-zA-Z0-9_]+$/;
    if (!regex.test(identifier)) {
        alert('Username can only contain letters, numbers, and underscores.');
        return;
    }

    try {
        const response = await fetch('/signup', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email: email,
                username: identifier,
                password: password,
                bio: "none",
                pb: "https://placehold.co/80x80",
                admin: false,
            })
        });
        const data = await response.text();

        if (response.status === 201) {
            localStorage.setItem('user', JSON.stringify({ identifier, password }));
            window.location.href = '/intro';
        } else {
            alert('Sign up failed! Please try again.');
        }
    } catch (error) {
        console.error('Error signing up:', error);
        alert('An error occurred while signing up. Please try again later.');
    }
});

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