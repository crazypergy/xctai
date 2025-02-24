window.onload = function () {
  /* Random Card */
  const endpoint = `https://api.scryfall.com/cards/random`;
  let rulingsUrl;
  let imageUrl;

  fetch(endpoint)
    .then((response) => response.json())
    .then((data) => {
      rulingsUrl = data.rulings_uri;
      imageUrl = data.image_uris.normal;
      return fetch(rulingsUrl);
    })
    .then((response) => response.json())
    .then((data) => {
      const rulings = data.data.map((ruling) => ruling.comment);
      const rulingsText = rulings.join(" ");
      const cardTextDiv = document.getElementById("rulesText");

      if (rulings.length === 0) {
        cardTextDiv.textContent = "There are no rules for this card.";
      } else {
        cardTextDiv.textContent = rulingsText;
      }

      const cardImage = document.querySelector(".cardImage");
      cardImage.src = imageUrl;
    })
  .catch((error) => {
    console.log("Error:", error);
    output.textContent = "Failed to load card data. Try again!";
});

  /* User Search */
  const form = document.querySelector("form");
  const input = document.querySelector(".form-control");
  const output = document.getElementById("rulesText");
  const image = document.querySelector(".cardImage");

  async function sendToModel(input) {
    const endpoint = `https://api.scryfall.com/cards/named?exact=${input}`;
    let rulingsUrl;
    let imageUrl;

    fetch(endpoint)
      .then((response) => response.json())
      .then((data) => {
        rulingsUrl = data.rulings_uri;
        imageUrl = data.image_uris.normal;
        return fetch(rulingsUrl);
      })
      .then((response) => response.json())
      .then((data) => {
        const rulings = data.data.map((ruling) => ruling.comment);
        const rulingsText = rulings.join(" ");
        output.textContent = rulingsText || "There are no rules for this card.";
        image.src = imageUrl;
      })
      .catch((error) => {
        console.log("There was an error: ", error);
      });
  }

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const userInput = input.value.trim();
    sendToModel(userInput);
  });

  // Explains the Card
  // Get the button element
  var explainBtn = document.getElementById("explainBtn");

  // Add click event listener to the button
  explainBtn.addEventListener("click", function () {
    // Get the text from the rulesText div
    var rulesText = document.getElementById("rulesText").textContent;

    // Send the text to the Inference API
    var API_URL = "https://api-inference.huggingface.co/models/facebook/bart-large-cnn";

    async function query(data) {
      try {
        const response = await fetch(API_URL, {
          headers: {
            'Authorization': "Bearer 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" // Replace with your actual authorization token
          },
          method: "POST",
          body: JSON.stringify(data),
        });

        if (!response.ok) {
          throw new Error('Failed to fetch data from the Inference API');
        }

        const result = await response.json();
        return result;
      } catch (error) {
        console.log("An error occurred:", error);
        throw error;
      }
    }

    query({ "inputs": rulesText }).then((response) => {
      var summaryText = response.summary_text;
      var rulesText = document.getElementById("rulesText");
      rulesText.textContent = response[0].summary_text || "No summary available.";
    }).catch((error) => {
      console.log("An error occurred:", error);
    });
  });


}
