console.log("Kotz-O-Meter geladen");

document.addEventListener("DOMContentLoaded", () => {
  const seitenIds = ["startseite", "geburtsjahr", "gewicht", "trinken", "kotzometer"];
  let aktuelleSeite = parseInt(localStorage.getItem("aktuelleSeite")) || 0;

  function zeigeSeite(index) {
    seitenIds.forEach((id, i) => {
      const seite = document.getElementById(id);
      if (seite) {
        seite.classList.toggle("hidden", i !== index);
      }
    });
    aktuelleSeite = index;
    localStorage.setItem("aktuelleSeite", aktuelleSeite);

    document.querySelector("header svg")?.addEventListener("click", () => {
        zeigeSeite(0);
        localStorage.setItem("aktuelleSeite", 0);
      });
  }

  document.getElementById("startButton")?.addEventListener("click", () => zeigeSeite(1));

  document.querySelectorAll(".eingabe").forEach(btn => {
    btn.addEventListener("click", () => {
      const currentSection = seitenIds[aktuelleSeite];

      if (currentSection === "geburtsjahr") {
        const input = document.querySelector('#geburtsjahr input');
        if (!input.value.match(/^\d{4}$/)) {
          alert("Bitte ein gültiges Geburtsjahr eingeben.");
          return;
        }
      }

      if (currentSection === "gewicht") {
        const input = document.querySelector('#gewicht input');
        if (!input.value.match(/^\d{2,3}$/)) {
          alert("Bitte dein Gewicht (in KG) eingeben.");
          return;
        }
      }

      if (currentSection === "trinken") {
        const checked = document.querySelector('#trinken input[name="drink"]:checked');
        if (!checked) {
          alert("Bitte gib dein Trinkverhalten an.");
          return;
        }
      }

      if (aktuelleSeite < seitenIds.length - 1) {
        zeigeSeite(aktuelleSeite + 1);
      }
    });
  });

  document.querySelectorAll(".zurück").forEach(btn => btn.addEventListener("click", () => {
    if (aktuelleSeite > 0) zeigeSeite(aktuelleSeite - 1);
  }));

  const categoryToApi = {
    beer: "https://api.unsplash.com/search/photos/?query=beer+glass&per_page=10&client_id=lCYUL03Crx294UMqaxQas6ypLEPDaBAsJVYR5OArNHI",
    water: "https://api.unsplash.com/search/photos/?query=water+glass&per_page=10&client_id=lCYUL03Crx294UMqaxQas6ypLEPDaBAsJVYR5OArNHI",
    food: "https://api.unsplash.com/search/photos/?query=fast+food&per_page=10&client_id=lCYUL03Crx294UMqaxQas6ypLEPDaBAsJVYR5OArNHI",
    wine: "https://api.unsplash.com/search/photos/?query=wine&per_page=10&client_id=lCYUL03Crx294UMqaxQas6ypLEPDaBAsJVYR5OArNHI",
    drink: "https://api.unsplash.com/search/photos/?query=cocktails&per_page=10&client_id=lCYUL03Crx294UMqaxQas6ypLEPDaBAsJVYR5OArNHI"
  };

  const categoryScore = {
    water: -1,
    food: -1,
    beer: 2,
    wine: 2,
    drink: 2.5
  };

  let kotzLevel = parseFloat(localStorage.getItem("kotzLevel")) || -10;

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

  let popup = document.getElementById("warning-popup");
  if (!popup) {
    popup = document.createElement("div");
    popup.id = "warning-popup";
    popup.textContent = "🤮 Du solltest besser nach Hause gehen und ein Aspirin nehmen.";
    document.body.appendChild(popup);
  }

  Object.assign(popup.style, {
    position: "fixed",
    top: "40%",
    left: "50%",
    transform: "translate(-50%, 20px)",
    background: "#e53935",
    color: "white",
    padding: "25px 50px",
    borderRadius: "25px",
    fontSize: "35px",
    fontFamily: "'Luckiest Guy', sans-serif",
    textAlign: "center",
    textShadow: "-2px -2px 0 #000, 2px -2px 0 #000, -2px 2px 0 #000, 2px 2px 0 #000",
    boxShadow: "0 10px 20px rgba(0, 0, 0, 0.3)",
    zIndex: "2000",
    display: "none",
    maxWidth: "90%",
    opacity: "0",
    transition: "opacity 0.4s ease, transform 0.4s ease"
  });

  function zeigeWarnung() {
  // Nur auf der Kotz-O-Meter-Seite anzeigen
  if (seitenIds[aktuelleSeite] !== "kotzometer") return;

  popup.style.display = "block";
  requestAnimationFrame(() => {
    popup.style.opacity = "1";
    popup.style.transform = "translate(-50%, 0)";
  });
  setTimeout(() => {
    popup.style.opacity = "0";
    popup.style.transform = "translate(-50%, 20px)";
    setTimeout(() => popup.style.display = "none", 400);
  }, 5000);
}

  function updateBarometer() {
    const marker = document.querySelector(".marker");
    const bar = document.querySelector(".barometer");
    if (!marker || !bar) return;

    const clamped = Math.max(-10, Math.min(10, kotzLevel));
    const percent = ((clamped + 10) / 20) * 100;
    const newLeft = (percent / 100) * (bar.clientWidth - marker.offsetWidth);
    marker.style.left = `${newLeft}px`;

    if (newLeft >= (bar.clientWidth - marker.offsetWidth - 5)) {
      zeigeWarnung();
    }
  }

  const savedValues = JSON.parse(localStorage.getItem("circleValues") || "{}");
  let isLoading = false;
  let hideTimeout = null;

  document.querySelectorAll(".circle").forEach(circle => {
    const category = Array.from(circle.classList).find(cls => categoryScore[cls]);
    const valueElement = circle.querySelector(".value");
    valueElement.textContent = savedValues[category] ?? "0";

    circle.addEventListener("mouseenter", async () => {
      if (isLoading || !categoryToApi[category]) return;
      clearTimeout(hideTimeout);

      const apiURL = categoryToApi[category];
      const rect = circle.getBoundingClientRect();
      const left = rect.left + rect.width / 2 - 75;
      const top = rect.top - 160;

      isLoading = true;
      previewImg.style.display = "none";

      try {
        const res = await fetch(apiURL);
        const data = await res.json();
        const images = data.results;
        if (images.length > 0) {
          const randomImg = images[Math.floor(Math.random() * images.length)];
          previewImg.onload = () => {
            previewImg.style.left = `${left}px`;
            previewImg.style.top = `${top}px`;
            previewImg.style.display = "block";
            isLoading = false;
          };
          previewImg.src = randomImg.urls.small;
        }
      } catch (err) {
        console.error("Bild konnte nicht geladen werden:", err);
        isLoading = false;
      }
    });

    circle.addEventListener("mouseleave", () => {
      hideTimeout = setTimeout(() => {
        previewImg.style.display = "none";
      }, 100);
    });

    circle.addEventListener("click", () => {
      let currentValue = parseInt(valueElement.textContent);
      currentValue++;
      valueElement.textContent = currentValue;

      if (category) {
        kotzLevel += categoryScore[category];
        updateBarometer();
        savedValues[category] = currentValue;
        localStorage.setItem("circleValues", JSON.stringify(savedValues));
        localStorage.setItem("kotzLevel", kotzLevel);
      }
    });
  });

  document.querySelector(".Resetbutton")?.addEventListener("click", () => {
    document.querySelectorAll(".circle .value").forEach(el => el.textContent = "0");
    kotzLevel = -10;
    localStorage.removeItem("circleValues");
    localStorage.removeItem("kotzLevel");
    updateBarometer();
    popup.style.display = "none";
  });

  zeigeSeite(aktuelleSeite);
  updateBarometer();
});

/* Responsive Styles */
const style = document.createElement('style');
style.textContent = `
  @media (max-width: 600px) {
    .container {
      width: 90% !important;
      padding: 20px !important;
    }
    .container h1 {
      font-size: 1.5rem;
    }
    input[type="text"] {
      font-size: 1.5rem;
      padding: 10px;
    }
    .buttons {
      gap: 10px;
    }
    button.zurück,
    button.eingabe {
      width: 50px;
      height: 50px;
      font-size: 1.2rem;
    }
    .drink-options label {
      font-size: 1rem;
      padding: 10px 14px;
      min-width: auto;
    }
  }
`;
document.head.appendChild(style);
