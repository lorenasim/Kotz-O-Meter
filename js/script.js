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
        zeigeSeite(0); // Seite 0 = Startseite
        localStorage.setItem("aktuelleSeite", 0); // optional: speichern
      });
    
  }

  document.getElementById("startButton")?.addEventListener("click", () => zeigeSeite(1));
  document.querySelectorAll(".weiter, .eingabe").forEach(btn => btn.addEventListener("click", () => {
    if (aktuelleSeite < seitenIds.length - 1) zeigeSeite(aktuelleSeite + 1);
  }));
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
    popup.textContent = "Du solltest besser nach Hause gehen und ein Aspirin zu dir nehmen.";
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

  function updateBarometer() {
    const marker = document.querySelector(".marker");
    const bar = document.querySelector(".barometer");
    if (!marker || !bar) return;

    const clamped = Math.max(-10, Math.min(10, kotzLevel));
    const percent = ((clamped + 10) / 20) * 100;
    const newLeft = (percent / 100) * (bar.clientWidth - marker.offsetWidth);
    marker.style.left = `${newLeft}px`;

    popup.style.display = percent >= 90 ? "block" : "none";
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

const geburtsjahrInput = document.querySelector('#geburtsjahr input');

if (geburtsjahrInput) {

  geburtsjahrInput.value = localStorage.getItem('geburtsjahr') || '';

  geburtsjahrInput.addEventListener('input', () => {
    localStorage.setItem('geburtsjahr', geburtsjahrInput.value);
  });
}


const gewichtInput = document.querySelector('#gewicht input');

if (gewichtInput) {
  gewichtInput.value = localStorage.getItem('gewicht') || '';

  gewichtInput.addEventListener('input', () => {
    localStorage.setItem('gewicht', gewichtInput.value);
  });
}

const drinkRadios = document.querySelectorAll('#trinken input[name="drink"]');
const gespeichertesTrinken = localStorage.getItem('trinkverhalten');

if (gespeichertesTrinken) {
  const gespeichertesRadio = document.querySelector(`#trinken input[value="${gespeichertesTrinken}"]`);
  if (gespeichertesRadio) gespeichertesRadio.checked = true;
}

drinkRadios.forEach(radio => {
  radio.addEventListener('change', () => {
    if (radio.checked) {
      localStorage.setItem('trinkverhalten', radio.value);
    }
  });
});
