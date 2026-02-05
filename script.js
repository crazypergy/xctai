window.onload = function () {
  /* Elements */
  const form = document.querySelector("form");
  const input = document.querySelector(".form-control");
  const output = document.getElementById("rulesText");
  const image = document.querySelector(".cardImage");
  const explainBtn = document.getElementById("explainBtn");
  const randomBtn = document.getElementById("randomBtn");
  const statusText = document.getElementById("statusText");
  const cardName = document.getElementById("cardName");
  const summaryModal = document.getElementById("summaryModal");
  const summaryText = document.getElementById("summaryText");
  const closeModalBtn = document.getElementById("closeModalBtn");

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
    explainBtn.disabled = isLoading;
    if (randomBtn) {
      randomBtn.disabled = isLoading;
    }
  }

  function openSummaryModal(text) {
    if (!summaryModal || !summaryText) {
      return;
    }
    summaryText.textContent = text;
    summaryModal.classList.add("is-open");
    summaryModal.setAttribute("aria-hidden", "false");
  }

  function closeSummaryModal() {
    if (!summaryModal) {
      return;
    }
    summaryModal.classList.remove("is-open");
    summaryModal.setAttribute("aria-hidden", "true");
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

  /* Explain the Card (Cloudflare Worker) */
  explainBtn.addEventListener("click", async function () {
    const rulesText = output.textContent.trim();
    if (!rulesText) {
      output.textContent = "No rules to summarize.";
      return;
    }

    try {
      setLoading(true, "Summarizing...");
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
      openSummaryModal(summary || "No summary available.");
      setLoading(false, "");
    } catch (error) {
      console.log("An error occurred:", error);
      output.textContent = "Failed to summarize. Try again!";
      setLoading(false, "Summarization failed.");
    }
  });

  if (summaryModal) {
    summaryModal.addEventListener("click", (event) => {
      if (event.target === summaryModal) {
        closeSummaryModal();
      }
    });
  }

  if (closeModalBtn) {
    closeModalBtn.addEventListener("click", closeSummaryModal);
  }

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeSummaryModal();
    }
  });

  if (randomBtn) {
    randomBtn.addEventListener("click", () => {
      loadRandomCard();
    });
  }
};
