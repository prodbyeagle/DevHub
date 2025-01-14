const userData = JSON.parse(localStorage.getItem("user"));
if (!userData || !userData.identifier) {
  console.error("User identifier not found in local storage");
} else {
  const username = userData.identifier;
  checkUserBanStatus(username);
}

async function checkUserBanStatus(username) {
  try {
    const userResponse = await fetch(`/api/profile/${username}`);
    const userDataResponse = await userResponse.json();
    if (userDataResponse.banned) {
      alert("You are Suspended from this Platform. ~ @admin");
      localStorage.clear();
      window.location.href = "/login";
    } else {
      document.body.classList.add("dark-mode");
    }
  } catch (error) {
    console.error("Error fetching user data:", error);
  }
}

// Funktion zum Erstellen des Tooltips
function createTooltip() {
  const tooltip = document.createElement("div");
  tooltip.classList.add("tooltip");
  tooltip.style.position = "absolute";
  tooltip.style.zIndex = "999";
  tooltip.style.backgroundColor = "#272727d8";
  tooltip.style.color = "white";
  tooltip.style.padding = "5px";
  tooltip.style.borderRadius = "5px";
  tooltip.style.pointerEvents = "none"; // Damit das Tooltip keine Ereignisse blockiert
  tooltip.style.display = "none"; // Standardmäßig ausgeblendet
  document.body.appendChild(tooltip);
  return tooltip;
}

// Funktion zum Anzeigen des Tooltips und Verfolgen der Mausposition beim Überfahren des Submit-Buttons
function tooltip(message) {
  const submitButton = document.querySelector(".submit-button");

  // Überprüfen, ob bereits ein Tooltip vorhanden ist
  const existingTooltip = document.querySelector(".tooltip");
  if (existingTooltip) {
    existingTooltip.remove(); // Entferne das alte Tooltip, falls vorhanden
  }

  const tooltip = createTooltip(); // Tooltipelement erstellen
  tooltip.innerText = message;

  // Eventlistener für das Bewegen der Maus über den Submit-Button
  submitButton.addEventListener("mouseenter", () => {
    tooltip.style.display = "block";
  });

  // Eventlistener für das Verlassen des Submit-Buttons
  submitButton.addEventListener("mouseleave", () => {
    tooltip.style.display = "none";
  });

  // Eventlistener für das Bewegen der Maus innerhalb des Submit-Buttons
  submitButton.addEventListener("mousemove", (event) => {
    tooltip.style.left = event.pageX + 10 + "px";
    tooltip.style.top = event.pageY + 10 + "px";
  });
}

function updateSubmitButtonStatus() {
  const submitButton = document.querySelector(".submit-button");
  const selectedLanguages = document.querySelectorAll(
    ".language-button.selected"
  );

  if (selectedLanguages.length > 0) {
    // Wenn mindestens eine Sprache ausgewählt ist, aktiviere den Submit-Button
    submitButton.disabled = false;
    submitButton.style.cursor = "pointer"; // Ändere den Cursor auf Zeiger, wenn der Button klickbar ist
    tooltip("✅ Save changes!"); // Tooltip anzeigen
  } else {
    // Andernfalls deaktiviere den Submit-Button
    submitButton.disabled = true;
    submitButton.style.cursor = "not-allowed"; // Ändere den Cursor auf 'not-allowed', wenn der Button nicht klickbar ist
    tooltip("❌ Please select at least one language!"); // Tooltip anzeigen
  }
}

function showNormalContent() {
  // Zeige den normalen Inhalt an
  document.body.classList.add("dark-mode");
}

// Funktion zum Erfassen der ausgewählten Sprachen und Senden an den Server
const preferencesForm = document.getElementById("preferencesForm");
preferencesForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const formData = new FormData(preferencesForm);
  const selectedLanguages = Array.from(
    document.querySelectorAll(".language-button.selected")
  ).map((btn) => btn.getAttribute("data-language"));

  // POST-Anfrage an den Server senden
  fetch("/api/update", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      username: JSON.parse(localStorage.getItem("user")).identifier, // Benutzername aus dem localStorage
      preferences: selectedLanguages.join(","), // Ausgewählte Sprachen als String
    }),
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error("Network response was not ok");
      }
      // Überprüfen, ob die Antwort JSON ist
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        return response.json();
      } else {
        // Wenn die Antwort keine JSON ist, geben Sie den Text zurück
        return response.text().then((text) => ({ message: text }));
      }
    })
    .then((data) => {
      console.log(data.message);
      preferencesForm.style.display = "none"; // preferences-Formular ausblenden
      document.querySelector("h1").style.display = "none"; // Willkommensnachricht ausblenden

      // Alle .language-button ausblenden
      const languageButtons = document.querySelectorAll(".language-button");
      languageButtons.forEach((button) => {
        button.style.display = "none";
      });

      // Submit-Button ausblenden
      const submitButton = document.querySelector(".submit-button");
      document.querySelector(".max-w-lg").style.display = "none";
      submitButton.style.display = "none";

      const confirmationMessage = document.createElement("div");
      confirmationMessage.textContent = "✅ Thanks for submitting!";
      confirmationMessage.classList.add("confirmation-message");
      document.body.appendChild(confirmationMessage);
      setTimeout(() => {
        window.location.href = "/home";
      }, 3000); // Weiterleitung nach 3 Sekunden
    })
    .catch((error) => {
      console.error("There was a problem with your fetch operation:", error);
    });
});

const languageButtons = document.querySelectorAll(".language-button");
const codingLanguagesInput = document.getElementById("codingLanguages");

languageButtons.forEach((button) => {
  button.addEventListener("click", () => {
    button.classList.toggle("selected");
    const selectedLanguages = Array.from(
      document.querySelectorAll(".language-button.selected")
    ).map((btn) => btn.getAttribute("data-language"));
    codingLanguagesInput.value = selectedLanguages.join(",");

    // Update des Submit-Button-Status und Anzeige des Tooltips
    updateSubmitButtonStatus();
  });
});

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
  console.log("Mode Loaded:", mode);
}
loadModePreference();
updateSubmitButtonStatus();

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
