document.addEventListener("DOMContentLoaded", async () => {
  try {
    // Benutzerdaten abrufen und aktualisieren
    const userData = await fetchUserData();
    updateUserData(userData);

    // Diagrammdaten abrufen und aktualisieren
    await fetchDataAndRenderChart();
    startChartRefreshTimer();
  } catch (error) {
    console.error("There was a problem with your fetch operation:", error);
  }
});

async function fetchUserData() {
  const response = await fetch("/api/username");
  if (!response.ok) {
    throw new Error("Failed to fetch user data");
  }
  const userData = await response.json();

  // Überprüfen, ob der Benutzer ein Administrator ist
  const currentUser = JSON.parse(localStorage.getItem("user"));
  const isAdmin = userData.users.find(
    (user) => user.username === currentUser.identifier && user.admin
  );
  if (!isAdmin) {
    window.location.href = "/home"; // Weiterleitung zur Startseite, wenn kein Administrator
  }

  return userData;
}

async function updateUserData(userData) {
  // Anzahl der Benutzer
  const totalUsersCount = userData.users.length;
  document.getElementById("totalUsers").textContent = totalUsersCount;

  // Zählen der gebannten Benutzer
  const bannedUsersCount = userData.users.filter(
    (user) => user.banned === true
  ).length;
  document.getElementById("bannedUsers").textContent = bannedUsersCount;

  // Zählen der Administratoren
  const adminCount = userData.users.filter((user) => user.admin).length;
  document.getElementById("adminCount").textContent = adminCount;

  // Restlicher Code für die Benutzerliste und andere Funktionen
  const savedUser = localStorage.getItem("user");
  const formData = {
    username: JSON.parse(localStorage.getItem("user")).identifier,
  };

  const response = await fetch("/admin", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(formData),
  });
  if (!response.ok) {
    throw new Error("Network response was not ok");
  }
  const contentType = response.headers.get("content-type");
  let data;
  if (contentType && contentType.includes("application/json")) {
    data = await response.json();
  } else {
    data = await response.text();
  }
  if (Array.isArray(data)) {
    const userList = document.getElementById("userList");
    if (!userList) {
      console.error("userList not found");
      return;
    }

    data.forEach((user) => {
      const userDiv = document.createElement("div");
      userDiv.classList.add(
        "border-b",
        "border-gray-300",
        "py-2",
        "flex",
        "items-center"
      );
      userDiv.innerHTML = `
                <img src="${
                  user.pb
                }" alt="Profile Picture" class="w-10 h-10 rounded-full mr-4">
                <div>
                    <p class="text-lg font-underline user-link">${
                      user.username
                    }</p>
                    <p>Preferences: ${
                      user.preferences ? user.preferences.join(", ") : "None!"
                    }</p>
                    <p>Banned: ${user.banned ? "❌ Yes!" : "✅ No!"}</p>
                    <p>Admin: ${user.admin ? "✅ Yes!" : "❌ No!"}</p>
                    <p>Google Acc: ${
                      user.googlelogin ? "✅ Yes!" : "❌ No!"
                    }</p>
                    <p>GitHub Acc: ${
                      user.githublogin ? "✅ Yes!" : "❌ No!"
                    }</p>
                </div>
                <div class="ml-auto">
                    <button onclick="toggleBan('${user.username}', ${
        user.banned
      }, this)" class="neumorphism-button text-blue-600">${
        user.banned ? "Unban" : "Ban"
      }</button>
                    <button onclick="toggleAdmin('${user.username}', ${
        user.admin
      }, this)" class="neumorphism-button text-blue-600">${
        user.admin ? "False" : "True"
      }</button>
                </div>
            `;

      userList.appendChild(userDiv);
    });
  } else {
    console.error("Invalid Response from Server:", data);
    console.error("Invalid Response from Server: " + error.message);
  }
}

async function toggleAdmin(username, isAdmin, button) {
  console.log("toggleAdmin function is executing...");
  const action = isAdmin ? "false" : "true"; // Reversing action

  // Checking if the user is already an admin
  if (isAdmin) {
    const confirmation = confirm(
      `Are you sure you want to remove admin status from user ${username}?`
    );
    if (!confirmation) {
      return; // Abort if the user cancels the action
    }
  }

  // Checking if the user is trying to change their own admin status
  const currentUser = JSON.parse(localStorage.getItem("user"));
  if (currentUser.identifier === username) {
    alert("You cannot remove your own admin status.");
    return; // Abort if the user tries to change their own admin status
  }

  try {
    const response = await fetch(`/api/profile/${username}/${action}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ action }),
    });
    if (!response.ok) {
      throw new Error("Error updating admin status");
    }
    const userDataResponse = await fetch(`/api/profile/${username}`);
    if (!userDataResponse.ok) {
      throw new Error("Error fetching user data");
    }
    const userData = await userDataResponse.json();

    const userDiv = button.closest(".flex.items-center");
    const adminParagraph = userDiv.querySelector("p:nth-of-type(4)");
    if (adminParagraph) {
      adminParagraph.innerHTML = `<p>Admin: ${
        userData.admin ? "✅ True!" : "❌ False!"
      }</p>`;
      if (userData.admin) {
        adminParagraph.classList.remove("text-green-600");
        adminParagraph.classList.add("text-red-600");
      } else {
        adminParagraph.classList.remove("text-red-600");
        adminParagraph.classList.add("text-green-600");
      }
      location.reload();
    } else {
      console.error("Admin paragraph not found");
      console.error("Admin paragraph not found");
    }
  } catch (error) {
    console.error("Error toggling admin status:", error);
    console.error("Error toggling admin status: " + error.message);
  }
}

async function toggleBan(username, isBanned, button) {
  console.log("toggleBan function is executing...");
  const action = isBanned ? "unban" : "ban"; // Reversing action
  try {
    const response = await fetch(`/api/profile/${username}/${action}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ action }),
    });
    if (!response.ok) {
      throw new Error("Error updating ban status");
    }
    const userDataResponse = await fetch(`/api/profile/${username}`);
    if (!userDataResponse.ok) {
      throw new Error("Error fetching user data");
    }
    const userData = await userDataResponse.json();

    const userDiv = button.closest(".flex.items-center");
    const bannedParagraph = userDiv.querySelector("p:nth-of-type(3)");
    if (bannedParagraph) {
      bannedParagraph.innerHTML = `<p>Banned: ${
        userData.banned ? "❌ Yes!" : "✅ No!"
      }</p>`;
      if (userData.banned) {
        bannedParagraph.classList.remove("text-green-600");
        bannedParagraph.classList.add("text-red-600");
      } else {
        bannedParagraph.classList.remove("text-red-600");
        bannedParagraph.classList.add("text-green-600");
      }
      location.reload();
    } else {
      console.error("Banned paragraph not found");
      console.error("Banned paragraph not found");
    }
  } catch (error) {
    console.error("Error toggling ban status:", error);
    console.error("Error toggling ban status: " + error.message);
  }

  // Load mode preference value
  loadModePreference();
}

// Event-Handler für die Benutzersuche
const searchInput = document.getElementById("searchInput");
if (searchInput) {
  searchInput.addEventListener("input", () => {
    const searchTerm = searchInput.value.toLowerCase();

    const userDivs = document.querySelectorAll("#userList .border-b");
    let foundUser = false;
    userDivs.forEach((userDiv) => {
      const username = userDiv
        .querySelector(".text-lg")
        .textContent.toLowerCase();
      if (username.includes(searchTerm)) {
        userDiv.style.display = "block";
        foundUser = true;
      } else {
        userDiv.style.display = "none";
      }
    });

    // Anzeige der Nachricht, wenn kein Benutzer gefunden wurde
    const noUserFoundMessage = document.getElementById("noUserFoundMessage");
    if (noUserFoundMessage) {
      if (!foundUser) {
        noUserFoundMessage.style.display = "block";
      } else {
        noUserFoundMessage.style.display = "none";
      }
    }
  });
} else {
  console.error("Search input not found");
}

function formatDate(dateString) {
  const [datePart, timePart] = dateString.split(", ");
  const [day, month, year] = datePart.split(".");
  const [hours, minutes, seconds] = timePart.split(":");
  const formattedDate = `${year}-${month}-${day}, ${hours}:${minutes}:${seconds}`;
  return formattedDate;
}

function loadModePreference() {
  const mode = localStorage.getItem("mode");
  if (mode === "light") {
    document.body.classList.remove("dark-mode");
    document.body.classList.add("light-mode");
  } else {
    document.body.classList.remove("light-mode");
    document.body.classList.add("dark-mode");
  }
  console.log("Mode Loaded:", mode);
}

document.addEventListener("DOMContentLoaded", async () => {
  const graphContainer = document.getElementById("graphContainer");

  try {
    await fetchDataAndRenderChart();
    startChartRefreshTimer();
  } catch (error) {
    console.error("There was a problem with your fetch operation:", error);
  }
});

async function fetchDataAndRenderChart() {
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

      const dates = postData.posts.map((post) => {
        const [datePart, timePart] = post.date.split(", ");
        const [day, month, year] = datePart.split(".");
        const [hours, minutes, seconds] = timePart.split(":");
        return new Date(
          `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`
        );
      });
      postDates.push(...dates);

      currentPage++;
    } while (currentPage <= totalPages);
    dataLoaded = true;

    const currentDate = new Date();
    const postsLast24Hours = postDates.filter(
      (date) => date.getTime() > currentDate.getTime() - 24 * 60 * 60 * 1000
    );

    renderChart(postsLast24Hours);
  } catch (error) {
    console.error("Error fetching posts data: " + error.message);
  } finally {
  }
}

function renderChart(data) {
  const labels = Array.from({ length: 24 }, (_, i) => {
    const d = new Date();
    d.setHours(d.getHours() - (23 - i));
    return d.getHours() + ":00";
  });

  const counts = Array.from({ length: 24 }, () => 0);
  data.forEach((date, index, array) => {
    const hour = date.getHours();
    counts[hour]++;
  });

  // Entferne Dezimalstellen aus den Counts
  counts.forEach((count, index) => {
    counts[index] = Math.round(count);
  });

  const canvas = document.createElement("canvas");
  chartContainer.innerHTML = ""; // Clear previous content
  chartContainer.appendChild(canvas);

  const backgroundColors = [];
  const borderColors = [];

  // Setze die Farben basierend auf den Änderungen
  for (let i = 0; i < counts.length; i++) {
    if (i > 0) {
      if (counts[i] > counts[i - 1]) {
        backgroundColors.push("rgba(0, 255, 0, 0.5)"); // Grün
        borderColors.push("rgba(0, 255, 0, 1)"); // Grün
      } else if (counts[i] < counts[i - 1]) {
        backgroundColors.push("rgba(255, 0, 0, 0.5)"); // Rot
        borderColors.push("rgba(255, 0, 0, 1)"); // Rot
      } else {
        backgroundColors.push("rgba(255, 255, 255, 0.5)"); // Weiß
        borderColors.push("rgba(255, 255, 255, 1)"); // Weiß
      }
    } else {
      backgroundColors.push("rgba(255, 255, 255, 0.1)"); // Weiß
      borderColors.push("rgba(255, 255, 255, 1)"); // Weiß
    }
  }

  const chartData = {
    labels: labels,
    datasets: [
      {
        label: "Number of Posts",
        data: counts,
        backgroundColor: backgroundColors,
        borderColor: borderColors,
        borderWidth: 2,
      },
    ],
  };

  const chartConfig = {
    type: "line",
    data: chartData,
    options: {
      scales: {
        y: { beginAtZero: true, title: { display: true, text: "Posts" } },
      },
      elements: {
        line: {
          tension: 0.4, // Aktiviert Bezierkurven und setzt die Krümmung
          borderWidth: 2, // Setzt die Linienbreite
        },
      },
    },
  };

  const chart = new Chart(canvas, chartConfig);

  chart.update(); // Aktualisiere das Diagramm, um die Änderungen anzuwenden
}
function startChartRefreshTimer() {
  setInterval(fetchDataAndRenderChart, 30000); // Refresh every 30s
}

startChartRefreshTimer();

// document.addEventListener('newError', fetchErrorLogAndUpdate);
const deletePostsButton = document.getElementById("deletePostsButton");

deletePostsButton.addEventListener("click", async () => {
  try {
    const response = await fetch("/admin/delete-posts", { method: "DELETE" });
    if (response.ok) {
      console.log("Posts collection deleted successfully");
      window.location.reload();
    } else {
      throw new Error("Failed to delete posts collection");
    }
  } catch (error) {
    console.error("Error deleting posts collection:", error.message);
  }
});

// Funktion zum Laden der bevorzugten Anzeigemodus
function loadModePreference() {
  // Lade den gespeicherten Moduswert aus dem Local Storage
  const mode = localStorage.getItem("mode");
  if (mode === "light") {
    // Wenn der Modus dunkel ist, füge die entsprechende Klasse hinzu
    document.body.classList.remove("dark-mode");
    document.body.classList.add("light-mode");
  } else {
    // Andernfalls füge die Klasse für den hellen Modus hinzu
    document.body.classList.remove("light-mode");
    document.body.classList.add("dark-mode");
  }
}

loadModePreference();

console.log(
  "%cWARNING! %cBe cautious!\nIf someone instructs you to paste something in here, it could be a scammer or hacker attempting to exploit your system. The Devolution Team would never ask for an Password!",
  "font-size: 20px; color: yellow;",
  "font-size: 14px; color: white;"
);
console.log(
  "%cWARNING! %cBe cautious!\nIf someone instructs you to paste something in here, it could be a scammer or hacker attempting to exploit your system. The Devolution Team would never ask for an Password!",
  "font-size: 20px; color: yellow;",
  "font-size: 14px; color: white;"
);
