document.addEventListener('DOMContentLoaded', async () => {
    try {
        // Benutzerdaten abrufen und aktualisieren
        const userData = await fetchUserData();
        updateUserData(userData);

        // Diagrammdaten abrufen und aktualisieren
        await fetchDataAndRenderChart();
        startChartRefreshTimer();

        // Interval für das Abrufen von Fehlerprotokollen festlegen
        setInterval(fetchErrorLogAndUpdate, 2500);

        // Console.error umleiten, um es im Fehlerprotokollbereich anzuzeigen
        const originalConsoleError = console.error;
        console.error = function(...args) {
            originalConsoleError.apply(console, args);
            const errorMessage = args.join(' '); // Fehlermeldung aus den Argumenten zusammensetzen
            sendErrorToAdminPanel(errorMessage); // Fehler an das Fehlerprotokoll senden
        };

        // Fetch-Fehlerprotokoll sofort beim Laden der Seite
        await fetchErrorLogAndUpdate();
    } catch (error) {
        console.error('There was a problem with your fetch operation:', error);
    }
});

async function fetchErrorLogAndUpdate() {
    try {
        const response = await fetch('/api/admin/errors');
        const data = await response.json();
        const errorLogList = document.getElementById('errorLog');

        // Clear previous entries
        errorLogList.innerHTML = '';

        data.forEach((error) => {
            const errorMessage = error.message;
            const errorId = error.id; // Annahme: Der Server stellt eine eindeutige Fehler-ID bereit
            
            const listItem = document.createElement('li');
            listItem.textContent = `${errorMessage}`;
            listItem.dataset.errorId = errorId;

            // Create a checkbox for each error message
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.id = `errorCheckbox${errorId}`;
            listItem.prepend(checkbox);

            // Add event listener to remove the error message when checkbox is checked
            checkbox.addEventListener('change', async () => {
                if (checkbox.checked) {
                    listItem.remove();
                    // Fehlermeldung vom Server entfernen
                    try {
                        await removeErrorFromServer(errorId);
                    } catch (error) {
                        console.error('Error removing error from server:', error);
                    }
                }
            });

            errorLogList.appendChild(listItem);
        });

        errorLogList.style.overflowY = 'scroll';
        errorLogList.style.maxHeight = '150px';
    } catch (fetchError) {
        console.error('Error fetching error log:', fetchError);
        sendErrorToAdminPanel('Error fetching error log: ' + fetchError.message);
    }
}

// Update error log in real-time when a new error occurs
document.addEventListener('newError', fetchErrorLogAndUpdate);

// Function to emit event when a new error occurs
async function sendErrorToAdminPanel(errorMessage) {
    try {
        const response = await fetch('/api/admin/error', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ message: errorMessage })
        });
        if (!response.ok) {
            throw new Error('Failed to send error message to server');
        }
        console.log('Error message sent to server successfully');

        // Emit custom event to trigger error log update
        document.dispatchEvent(new Event('newError'));
    } catch (sendError) {
        console.error('Error sending error message to server:', sendError);
    }
}

async function removeErrorFromServer(errorId) {
    const response = await fetch(`/api/admin/errors/${errorId}`, {
        method: 'DELETE'
    });
    if (!response.ok) {
        throw new Error('Failed to remove error from server');
    }
}

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

async function updateUserData(userData) {
    // Anzahl der Benutzer
    const totalUsersCount = userData.users.length;
    document.getElementById('totalUsers').textContent = totalUsersCount;

    // Zählen der gebannten Benutzer
    const bannedUsersCount = userData.users.filter(user => user.banned === true).length;
    document.getElementById('bannedUsers').textContent = bannedUsersCount;

    // Zählen der Administratoren
    const adminCount = userData.users.filter(user => user.admin).length;
    document.getElementById('adminCount').textContent = adminCount;

    // Restlicher Code für die Benutzerliste und andere Funktionen
    const savedUser = localStorage.getItem('user');
    const formData = {
        username: JSON.parse(localStorage.getItem('user')).identifier
    };

    const response = await fetch('/admin', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
    });
    if (!response.ok) {
        throw new Error('Network response was not ok');
    }
    const contentType = response.headers.get('content-type');
    let data;
    if (contentType && contentType.includes('application/json')) {
        data = await response.json();
    } else {
        data = await response.text();
    }
    if (Array.isArray(data)) {
        const userList = document.getElementById('userList');
        if (!userList) {
            console.error('userList not found');
            return;
        }

        data.forEach(user => {
            const userDiv = document.createElement('div');
            userDiv.classList.add('border-b', 'border-gray-300', 'py-2', 'flex', 'items-center');
            userDiv.innerHTML = `
                <img src="${user.pb}" alt="Profile Picture" class="w-10 h-10 rounded-full mr-4">
                <div>
                    <p class="text-lg font-underline user-link">${user.username}</p>
                    <p>Preferences: ${user.preferences ? user.preferences.join(', ') : 'None!'}</p>
                    <p>Banned: ${user.banned ? '❌ Yes!' : '✅ No!'}</p>
                    <p>Admin: ${user.admin ? '✅ Yes!' : '❌ No!'}</p>
                    <p>Google Acc: ${user.googlelogin ? '✅ Yes!' : '❌ No!'}</p>
                </div>
                <div class="ml-auto">
                    <button onclick="toggleBan('${user.username}', ${user.banned}, this)" class="neumorphism-button text-blue-600">${user.banned ? 'Unban' : 'Ban'}</button>
                    <button onclick="toggleAdmin('${user.username}', ${user.admin}, this)" class="neumorphism-button text-blue-600">${user.admin ? 'True' : 'False'}</button>
                </div>
            `;

            userList.appendChild(userDiv);
        });
    } else {
        console.error('Invalid Response from Server:', data);
        sendErrorToAdminPanel('Invalid Response from Server: ' + error.message);
    }
}

async function toggleAdmin(username, isAdmin, button) {
    console.log('toggleAdmin function is executing...');
    const action = isAdmin ? 'false' : 'true'; // Reversing action

    // Checking if the user is already an admin
    if (isAdmin) {
        const confirmation = confirm(`Are you sure you want to remove admin status from user ${username}?`);
        if (!confirmation) {
            return; // Abort if the user cancels the action
        }
    }

    // Checking if the user is trying to change their own admin status
    const currentUser = JSON.parse(localStorage.getItem('user'));
    if (currentUser.identifier === username) {
        alert("You cannot remove your own admin status.");
        return; // Abort if the user tries to change their own admin status
    }

    try {
        const response = await fetch(`/api/profile/${username}/${action}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ action })
        });
        if (!response.ok) {
            throw new Error('Error updating admin status');
        }
        const userDataResponse = await fetch(`/api/profile/${username}`);
        if (!userDataResponse.ok) {
            throw new Error('Error fetching user data');
        }
        const userData = await userDataResponse.json();

        const userDiv = button.closest('.flex.items-center');
        const adminParagraph = userDiv.querySelector('p:nth-of-type(4)');
        if (adminParagraph) {
            adminParagraph.innerHTML = `<p>Admin: ${userData.admin ? '✅ True!' : '❌ False!'}</p>`;
            if (userData.admin) {
                adminParagraph.classList.remove('text-green-600');
                adminParagraph.classList.add('text-red-600');
            } else {
                adminParagraph.classList.remove('text-red-600');
                adminParagraph.classList.add('text-green-600');
            }
            location.reload();
        } else {
            console.error('Admin paragraph not found');
            sendErrorToAdminPanel('Admin paragraph not found');
        }
    } catch (error) {
        console.error('Error toggling admin status:', error);
        sendErrorToAdminPanel('Error toggling admin status: ' + error.message);
    }
}

async function toggleBan(username, isBanned, button) {
    console.log('toggleBan function is executing...');
    const action = isBanned ? 'unban' : 'ban'; // Reversing action
    try {
        const response = await fetch(`/api/profile/${username}/${action}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ action })
        });
        if (!response.ok) {
            throw new Error('Error updating ban status');
        }
        const userDataResponse = await fetch(`/api/profile/${username}`);
        if (!userDataResponse.ok) {
            throw new Error('Error fetching user data');
        }
        const userData = await userDataResponse.json();

        const userDiv = button.closest('.flex.items-center');
        const bannedParagraph = userDiv.querySelector('p:nth-of-type(3)');
        if (bannedParagraph) {
            bannedParagraph.innerHTML = `<p>Banned: ${userData.banned ? '❌ Yes!' : '✅ No!'}</p>`;
            if (userData.banned) {
                bannedParagraph.classList.remove('text-green-600');
                bannedParagraph.classList.add('text-red-600');
            } else {
                bannedParagraph.classList.remove('text-red-600');
                bannedParagraph.classList.add('text-green-600');
            }
            location.reload();
        } else {
            console.error('Banned paragraph not found');
            sendErrorToAdminPanel('Banned paragraph not found');
        }
    } catch (error) {
        console.error('Error toggling ban status:', error);
        sendErrorToAdminPanel('Error toggling ban status: ' + error.message);
    }

    // Load mode preference value
    loadModePreference();
}

    // Event-Handler für die Benutzersuche
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', () => {
            const searchTerm = searchInput.value.toLowerCase();

            const userDivs = document.querySelectorAll('#userList .border-b');
            let foundUser = false;
            userDivs.forEach(userDiv => {
                const username = userDiv.querySelector('.text-lg').textContent.toLowerCase();
                if (username.includes(searchTerm)) {
                    userDiv.style.display = 'block';
                    foundUser = true;
                } else {
                    userDiv.style.display = 'none';
                }
            });

            // Anzeige der Nachricht, wenn kein Benutzer gefunden wurde
            const noUserFoundMessage = document.getElementById('noUserFoundMessage');
            if (noUserFoundMessage) {
                if (!foundUser) {
                    noUserFoundMessage.style.display = 'block';
                } else {
                    noUserFoundMessage.style.display = 'none';
                }
            }
        });
    } else {
        console.error('Search input not found');
    }


function formatDate(dateString) {
    const [datePart, timePart] = dateString.split(', ');
    const [day, month, year] = datePart.split('.');
    const [hours, minutes, seconds] = timePart.split(':');
    const formattedDate = `${year}-${month}-${day}, ${hours}:${minutes}:${seconds}`;
    return formattedDate;
}

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

document.addEventListener('DOMContentLoaded', async () => {
    const graphContainer = document.getElementById('graphContainer');

    try {
        await fetchDataAndRenderChart();
        startChartRefreshTimer();
    } catch (error) {
        console.error('There was a problem with your fetch operation:', error);
    }
});

async function fetchDataAndRenderChart() {
    const loadingSpinner = document.getElementById('loadingSpinner');
    loadingSpinner.style.display = 'block'; // Ladekreis anzeigen

    let postDates = []; // Variable postDates deklarieren

    try {
        let totalPages = 0;
        let currentPage = 1;

        do {
            const postsDataResponse = await fetch(`/api/posts?page=${currentPage}`);
            if (!postsDataResponse.ok) {
                throw new Error(`Failed to fetch posts data from page ${currentPage}`);
            }
            const postData = await postsDataResponse.json();
            totalPages = postData.totalPages;

            const dates = postData.posts.map(post => {
                const [datePart, timePart] = post.date.split(', ');
                const [day, month, year] = datePart.split('.');
                const [hours, minutes, seconds] = timePart.split(':');
                return new Date(`${year}-${month}-${day}T${hours}:${minutes}:${seconds}`);
            });
            postDates.push(...dates);

            currentPage++;
        } while (currentPage <= totalPages);
        dataLoaded = true;

        const currentDate = new Date();
        const postsLast24Hours = postDates.filter(date => date.getTime() > (currentDate.getTime() - 24 * 60 * 60 * 1000));

        renderChart(postsLast24Hours);
    } catch (error) {
        console.error('Error fetching posts data:', error);
        sendErrorToAdminPanel('Error fetching posts data: ' + error.message);
    } finally {
        loadingSpinner.style.display = 'none'; // Ladekreis verstecken
    }
}

function renderChart(data) {
    const labels = Array.from({ length: 24 }, (_, i) => {
        const d = new Date();
        d.setHours(d.getHours() - (23 - i));
        return d.getHours() + ':00';
    });

    const counts = Array.from({ length: 24 }, () => 0);
    data.forEach(date => {
        const hour = date.getHours();
        counts[hour]++;
    });

    const canvas = document.createElement('canvas');
    chartContainer.innerHTML = ''; // Clear previous content
    chartContainer.appendChild(canvas);

    // Generate random color for the line
    const randomColor = '#' + Math.floor(Math.random()*16777215).toString(16);

    const chartData = {
        labels: labels,
        datasets: [{
            label: 'Number of Posts',
            data: counts,
            backgroundColor: randomColor + '33', // Adding alpha for transparency
            borderColor: randomColor,
            borderWidth: 2
        }]
    };

    const chartConfig = {
        type: 'line',
        data: chartData,
        options: {
            scales: {
                y: { beginAtZero: true, title: { display: true, text: 'Number of Posts' } }
            }
        }
    };

    new Chart(canvas, chartConfig);
}

function startChartRefreshTimer() {
    setInterval(fetchDataAndRenderChart, 3600000); // Refresh every hour
}

startChartRefreshTimer();