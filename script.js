window.onload = function () {
  /* Elements */
  const form = document.querySelector("form");
  const input = document.querySelector(".form-control");
  const output = document.getElementById("rulesText");
  const image = document.querySelector(".cardImage");
  const explainBtn = document.getElementById("explainBtn");

  const SUMMARY_API_URL = "https://YOUR_CLOUDFLARE_WORKER_DOMAIN/summarize";

  function getImageUrl(cardData) {
    if (cardData?.image_uris?.normal) {
      return cardData.image_uris.normal;
    }
    if (cardData?.card_faces?.length && cardData.card_faces[0]?.image_uris?.normal) {
      return cardData.card_faces[0].image_uris.normal;
    }
    return "";
  }

  async function loadRulings(cardData) {
    if (!cardData?.rulings_uri) {
      output.textContent = "No rulings found for this card.";
      return;
    }

    const rulingsResponse = await fetch(cardData.rulings_uri);
    const rulingsData = await rulingsResponse.json();
    const rulings = (rulingsData?.data || []).map((ruling) => ruling.comment);
    const rulingsText = rulings.join(" ");
    output.textContent = rulingsText || "There are no rules for this card.";
  }

  /* Random Card */
  (async function loadRandomCard() {
    try {
      const response = await fetch("https://api.scryfall.com/cards/random");
      const cardData = await response.json();
      image.src = getImageUrl(cardData);
      await loadRulings(cardData);
    } catch (error) {
      console.log("Error:", error);
      output.textContent = "Failed to load card data. Try again!";
    }
  })();

  /* User Search */
  async function sendToModel(cardName) {
    const endpoint = `https://api.scryfall.com/cards/named?exact=${encodeURIComponent(cardName)}`;

    try {
      const response = await fetch(endpoint);
      const cardData = await response.json();
      image.src = getImageUrl(cardData);
      await loadRulings(cardData);
    } catch (error) {
      console.log("There was an error: ", error);
      output.textContent = "Failed to load card data. Try again!";
    }
  }

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const userInput = input.value.trim();
    if (!userInput) {
      output.textContent = "Please enter a card name.";
      return;
    }
    sendToModel(userInput);
  });

  /* Explain the Card (Cloudflare Worker) */
  explainBtn.addEventListener("click", async function () {
    const rulesText = output.textContent.trim();
    if (!rulesText) {
      output.textContent = "No rules to summarize.";
      return;
    }

    try {
      const response = await fetch(SUMMARY_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ inputs: rulesText }),
      });

      if (!response.ok) {
        throw new Error("Failed to fetch summary");
      }

      const result = await response.json();
      const summary = result?.summary_text || result?.[0]?.summary_text;
      output.textContent = summary || "No summary available.";
    } catch (error) {
      console.log("An error occurred:", error);
      output.textContent = "Failed to summarize. Try again!";
    }
  });
};
