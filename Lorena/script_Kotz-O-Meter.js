console.log("Kotz-O-Meter geladen");

// --- API Mapping
const categoryToApi = {
    beer: "https://api.unsplash.com/search/photos/?query=beer+glass&per_page=10&client_id=lCYUL03Crx294UMqaxQas6ypLEPDaBAsJVYR5OArNHI",
    water: "https://api.unsplash.com/search/photos/?query=water+glass&per_page=10&client_id=lCYUL03Crx294UMqaxQas6ypLEPDaBAsJVYR5OArNHI",
    food: "https://api.unsplash.com/search/photos/?query=fast+food&per_page=10&client_id=lCYUL03Crx294UMqaxQas6ypLEPDaBAsJVYR5OArNHI",
    wine: "https://api.unsplash.com/search/photos/?query=wine&per_page=10&client_id=lCYUL03Crx294UMqaxQas6ypLEPDaBAsJVYR5OArNHI",
    drink: "https://api.unsplash.com/search/photos/?query=cocktails&per_page=10&client_id=lCYUL03Crx294UMqaxQas6ypLEPDaBAsJVYR5OArNHI"
};

// --- Punkteverteilung
const categoryScore = {
    water: -1,
    food: -1,
    beer: 2,
    wine: 2,
    drink: 2.5
};

// --- Kotzlevel initialisieren
let kotzLevel = parseFloat(localStorage.getItem("kotzLevel")) || -10;

// --- Bild-Element erstellen
const previewImg = document.createElement("img");
previewImg.id = "image-preview";
Object.assign(previewImg.style, {
    position: "absolute",
    width: "150px",
    height: "150px",
    objectFit: "cover",
    borderRadius: "15px",
    boxShadow: "0 4px 10px rgba(0,0,0,0.4)",
    display: "none",
    zIndex: "1000"
});
document.body.appendChild(previewImg);

// --- Warn-Popup erstellen (falls nicht im HTML)
let popup = document.getElementById("warning-popup");
if (!popup) {
    popup = document.createElement("div");
    popup.id = "warning-popup";
    popup.innerHTML = "<p>Du solltest besser nach Hause gehen und ein Aspirin zu dir nehmen.</p>";
    document.body.appendChild(popup);
}
Object.assign(popup.style, {
    position: "fixed",
    bottom: "30px",
    right: "30px",
    background: "rgba(255, 0, 0, 0.9)",
    color: "white",
    padding: "20px 30px",
    borderRadius: "15px",
    fontSize: "24px",
    boxShadow: "0 4px 10px rgba(0,0,0,0.5)",
    zIndex: "2000",
    display: "none"
});

// --- Marker aktualisieren
function updateBarometer() {
    const marker = document.querySelector(".marker");
    const clamped = Math.max(-10, Math.min(10, kotzLevel));
    const percent = ((clamped + 10) / 20) * 100;
    const barometerWidth = document.querySelector(".barometer").clientWidth;
    const newLeft = (percent / 100) * (barometerWidth - marker.offsetWidth);
    marker.style.left = `${newLeft}px`;

    if (percent >= 90) {
        popup.style.display = "block";
    } else {
        popup.style.display = "none";
    }
}

let isLoading = false;
let hideTimeout = null;

// --- Kreiswerte aus localStorage laden
const savedValues = JSON.parse(localStorage.getItem("circleValues") || "{}");
document.querySelectorAll(".circle").forEach(circle => {
    const category = Array.from(circle.classList).find(cls => categoryScore[cls]);
    const valueElement = circle.querySelector(".value");
    if (category && savedValues[category] !== undefined) {
        valueElement.textContent = savedValues[category];
    } else {
        valueElement.textContent = "0";
    }

    // --- Bildvorschau bei Hover
    circle.addEventListener("mouseenter", async () => {
        if (isLoading) return;

        if (!categoryToApi[category]) return;

        clearTimeout(hideTimeout);
        const apiURL = categoryToApi[category];
        const rect = circle.getBoundingClientRect();
        const left = rect.left + rect.width / 2 - 75;
        const top = rect.top - 160;

        isLoading = true;
        previewImg.style.display = "none";

        try {
            const response = await fetch(apiURL);
            const data = await response.json();
            const images = data.results;
            if (images.length > 0) {
                const randomImg = images[Math.floor(Math.random() * images.length)];
                const newSrc = randomImg.urls.small;

                previewImg.onload = () => {
                    previewImg.style.left = `${left}px`;
                    previewImg.style.top = `${top}px`;
                    previewImg.style.display = "block";
                    isLoading = false;
                };
                previewImg.src = newSrc;
            }
        } catch (err) {
            console.error("Fehler beim Laden des Bildes:", err);
            isLoading = false;
        }
    });

    // --- Bildvorschau verstecken
    circle.addEventListener("mouseleave", () => {
        hideTimeout = setTimeout(() => {
            previewImg.style.display = "none";
        }, 100);
    });

    // --- Klick-Logik
    circle.addEventListener("click", () => {
        let currentValue = parseInt(valueElement.textContent);
        currentValue++;
        valueElement.textContent = currentValue;

        if (category) {
            kotzLevel += categoryScore[category];
            updateBarometer();

            // --- localStorage speichern
            savedValues[category] = currentValue;
            localStorage.setItem("circleValues", JSON.stringify(savedValues));
            localStorage.setItem("kotzLevel", kotzLevel);
        }
    });
});

// --- RESET-Button
document.querySelector(".Resetbutton").addEventListener("click", () => {
    document.querySelectorAll(".circle .value").forEach(el => {
        el.textContent = "0";
    });
    kotzLevel = -10;
    updateBarometer();
    localStorage.removeItem("circleValues");
    localStorage.removeItem("kotzLevel");
});

// --- Initialer Balkenstand
window.onload = () => {
    updateBarometer();
};

