window.onload = function () {
  /* Elements */
  const form = document.querySelector("form");
  const input = document.getElementById("search-input");
  const suggestions = document.getElementById("suggestions");
  // Autocomplete for card names
  async function fetchSuggestions(query) {
    if (!query || query.length < 2) {
      suggestions.innerHTML = "";
      suggestions.style.display = "none";
      return;
    }
    try {
      const resp = await fetch(
        `https://api.scryfall.com/cards/autocomplete?q=${encodeURIComponent(query)}`,
      );
      const data = await resp.json();
      const names = data?.data || [];
      suggestions.innerHTML = names
        .map((name) => `<li tabindex="0">${name}</li>`)
        .join("");
      suggestions.style.display = names.length ? "block" : "none";
    } catch {
      suggestions.innerHTML = "";
      suggestions.style.display = "none";
    }
  }

  input.addEventListener("input", (e) => {
    fetchSuggestions(e.target.value);
  });

  suggestions.addEventListener("mousedown", (e) => {
    if (e.target.tagName === "LI") {
      input.value = e.target.textContent;
      suggestions.innerHTML = "";
      suggestions.style.display = "none";
      input.focus();
    }
  });

  input.addEventListener("blur", () => {
    setTimeout(() => {
      suggestions.innerHTML = "";
      suggestions.style.display = "none";
    }, 150);
  });
  const output = document.getElementById("rulesText");
  const image = document.querySelector(".cardImage");
  const randomBtn = document.getElementById("randomBtn");
  const statusText = document.getElementById("statusText");
  const cardName = document.getElementById("cardName");
  const summaryModal = document.getElementById("summaryModal");
  const summaryText = document.getElementById("summaryText");
  const closeModalBtn = document.getElementById("closeModalBtn");

  const SUMMARY_API_URL = "https://xctai.ctdobrien.workers.dev/summarize";

  async function summarizeRulings(rulingsText) {
    const instructions =
      "Explain and summarize these Magic the Gathering rules in a clear, concise way at a high-school reading level.";
    const prompt = `${instructions}\n\nRules:\n${rulingsText}`;
    try {
      const response = await fetch(SUMMARY_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ inputs: prompt }),
      });

      if (!response.ok) {
        const errorData = await response
          .json()
          .catch(() => ({ message: "No detailed error message from server." }));
        throw new Error(
          `HTTP error! status: ${response.status}, message: ${errorData.message || response.statusText}`,
        );
      }

      const result = await response.json();
      // Gemini API returns summary in result.candidates[0].content.parts[0].text
      return (
        result?.candidates?.[0]?.content?.parts?.[0]?.text ||
        "No summary available."
      );
    } catch (error) {
      throw new Error(`Failed to fetch summary: ${error.message}`);
    }
  }

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

    if (!rulingsText) {
      output.textContent = "There are no rules for this card.";
      setLoading(false, "");
      return;
    }

    try {
      setLoading(true, "Summarizing...");
      const summary = await summarizeRulings(rulingsText);
      output.textContent = summary;
      setLoading(false, "");
    } catch (error) {
      console.error("An error occurred:", error);
      output.textContent = "Failed to summarize. Try again!";
      setLoading(false, "Summarization failed.");
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
