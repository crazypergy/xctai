window.onload = function () {
  /* Elements */
  const form = document.querySelector("form");
  const input = document.querySelector(".form-control");
  const output = document.getElementById("rulesText");
  const summaryOutput = document.getElementById("summaryText");
  const image = document.querySelector(".cardImage");
  const randomBtn = document.getElementById("randomBtn");
  const statusText = document.getElementById("statusText");
  const cardName = document.getElementById("cardName");

  const SUMMARY_API_URL = "https://xctai.ctdobrien.workers.dev/summarize";

  function getImageUrl(cardData) {
    if (cardData?.image_uris?.normal) {
      return cardData.image_uris.normal;
    }
    if (
      cardData?.card_faces?.length &&
      cardData.card_faces[0]?.image_uris?.normal
    ) {
      return cardData.card_faces[0].image_uris.normal;
    }
    return "";
  }

  function setLoading(isLoading, message) {
    if (statusText) {
      statusText.textContent = message || "";
    }
    if (randomBtn) {
      randomBtn.disabled = isLoading;
    }
  }

  async function loadRulings(cardData) {
    if (!cardData?.rulings_uri) {
      output.textContent = "No rulings found for this card.";
      summaryOutput.textContent = "No rules to summarize.";
      return;
    }

    const rulingsResponse = await fetch(cardData.rulings_uri);
    const rulingsData = await rulingsResponse.json();
    const rulings = (rulingsData?.data || []).map((ruling) => ruling.comment);
    const rulingsText = rulings.join(" ");
    output.textContent = rulingsText || "There are no rules for this card.";
    
    // Automatically summarize the rules
    if (rulingsText) {
      await summarizeRules(rulingsText);
    } else {
      summaryOutput.textContent = "No rules to summarize.";
    }
  }

  async function summarizeRules(rulesText) {
    try {
      setLoading(true, "Summarizing rules...");
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
      summaryOutput.textContent = summary || "No summary available.";
      setLoading(false, "");
    } catch (error) {
      console.log("An error occurred during summarization:", error);
      summaryOutput.textContent = "Failed to summarize rules. The rulings are displayed in the Rulings section.";
      setLoading(false, "");
    }
  }

  /* Random Card */
  async function loadRandomCard() {
    setLoading(true, "Loading random card...");
    try {
      const response = await fetch("https://api.scryfall.com/cards/random");
      const cardData = await response.json();
      cardName.textContent = cardData?.name || "Unknown Card";
      image.src = getImageUrl(cardData);
      await loadRulings(cardData);
      setLoading(false, "");
    } catch (error) {
      console.log("Error:", error);
      output.textContent = "Failed to load card data. Try again!";
      setLoading(false, "Unable to load card.");
    }
  }

  loadRandomCard();

  /* User Search */
  async function sendToModel(cardQuery) {
    const endpoint = `https://api.scryfall.com/cards/named?exact=${encodeURIComponent(cardQuery)}`;

    try {
      setLoading(true, "Searching for card...");
      const response = await fetch(endpoint);
      const cardData = await response.json();
      cardName.textContent = cardData?.name || "Unknown Card";
      image.src = getImageUrl(cardData);
      await loadRulings(cardData);
      setLoading(false, "");
    } catch (error) {
      console.log("There was an error: ", error);
      output.textContent = "Failed to load card data. Try again!";
      setLoading(false, "Unable to load card.");
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

  if (randomBtn) {
    randomBtn.addEventListener("click", () => {
      loadRandomCard();
    });
  }
};
