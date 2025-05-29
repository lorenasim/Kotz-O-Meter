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

// --- Kotzlevel startet ganz links
let kotzLevel = -10;

// --- Bild-Element erstellen
const previewImg = document.createElement("img");
previewImg.id = "image-preview";
previewImg.style.position = "absolute";
previewImg.style.width = "150px";
previewImg.style.height = "150px";
previewImg.style.objectFit = "cover";
previewImg.style.borderRadius = "15px";
previewImg.style.boxShadow = "0 4px 10px rgba(0,0,0,0.4)";
previewImg.style.display = "none";
previewImg.style.zIndex = "1000";
document.body.appendChild(previewImg);

// --- Warn-Popup erstellen (falls nicht schon im HTML)
let popup = document.getElementById("warning-popup");
if (!popup) {
    popup = document.createElement("div");
    popup.id = "warning-popup";
    popup.innerHTML = "<p>Du solltest besser nach Hause gehen und ein Aspirin zu dir nehmen.</p>";
    document.body.appendChild(popup);
}

// Popup-Styling via JS (nur wenn kein CSS da ist)
popup.style.position = "fixed";
popup.style.bottom = "30px";
popup.style.right = "30px";
popup.style.background = "rgba(255, 0, 0, 0.9)";
popup.style.color = "white";
popup.style.padding = "20px 30px";
popup.style.borderRadius = "15px";
popup.style.fontSize = "24px";
popup.style.boxShadow = "0 4px 10px rgba(0,0,0,0.5)";
popup.style.zIndex = "2000";
popup.style.display = "none";

// --- Marker aktualisieren
function updateBarometer() {
    const marker = document.querySelector(".marker");
    const clamped = Math.max(-10, Math.min(10, kotzLevel));
    const percent = ((clamped + 10) / 20) * 100;
    const barometerWidth = document.querySelector(".barometer").clientWidth;
    const newLeft = (percent / 100) * (barometerWidth - marker.offsetWidth);
    marker.style.left = `${newLeft}px`;

    // Wenn Kotzlevel zu hoch -> Popup zeigen
    if (percent >= 90) {
        popup.style.display = "block";
    } else {
        popup.style.display = "none";
    }
}

let isLoading = false;
let hideTimeout = null;

// --- Bubble-Verhalten
document.querySelectorAll(".circle").forEach(circle => {
    circle.addEventListener("mouseenter", async () => {
        if (isLoading) return;

        const category = Array.from(circle.classList).find(cls => categoryToApi[cls]);
        if (!category) return;

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

                if (previewImg.src !== newSrc) {
                    previewImg.onload = () => {
                        previewImg.style.left = `${left}px`;
                        previewImg.style.top = `${top}px`;
                        previewImg.style.display = "block";
                        isLoading = false;
                    };
                    previewImg.src = newSrc;
                } else {
                    previewImg.style.left = `${left}px`;
                    previewImg.style.top = `${top}px`;
                    previewImg.style.display = "block";
                    isLoading = false;
                }
            } else {
                isLoading = false;
            }
        } catch (err) {
            console.error("Fehler beim Laden des Bildes:", err);
            isLoading = false;
        }
    });

    circle.addEventListener("mouseleave", () => {
        hideTimeout = setTimeout(() => {
            previewImg.style.display = "none";
        }, 100);
    });

    circle.addEventListener("click", () => {
        const valueElement = circle.querySelector(".value");
        const currentValue = parseInt(valueElement.textContent);
        valueElement.textContent = currentValue + 1;

        const category = Array.from(circle.classList).find(cls => categoryScore[cls]);
        if (category) {
            kotzLevel += categoryScore[category];
            updateBarometer();
        }
    });
});

// --- RESET-Button Funktion
document.querySelector(".Resetbutton").addEventListener("click", () => {
    document.querySelectorAll(".circle .value").forEach(el => {
        el.textContent = "0";
    });
    kotzLevel = -10;
    updateBarometer();
});

// --- Beim Laden initialisieren
updateBarometer();
