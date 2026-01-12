const cards = document.querySelectorAll(".store-locator-card");
const cardContent = document.querySelectorAll(".store-locator-card__content");
const searchInput = document.getElementById("search-store-locator");
const isPage = document.querySelector(".store-locator-page");
const isSection = document.querySelector(".store-locator");
const clearButton = document.getElementById("store-locator__clear-search");
const resultsDropdown = document.getElementById("store-locator__search-results");
const seeMoreCard = document.querySelector(".store-locator-card__see-more .store-locator-card__content")

function liveSearch() {
  let search_query = searchInput.value;
  for (let i = 0; i < cards.length; i++) {
    if (
      cardContent[i].textContent
        .toLowerCase()
        .includes(search_query.toLowerCase())
    ) {
      cards[i].classList.remove("hidden");
    } else {
      cards[i].classList.add("hidden");
    }
  }
}

if (isPage && searchInput) {
  searchInput.addEventListener("keyup", event => {
    event.preventDefault();
    liveSearch();
  });

  searchInput.addEventListener("keypress", event => {
    if (event.key === "Enter") {
      event.preventDefault();
    }
  });

  searchInput.addEventListener("search", () => {
    let search_query = searchInput.value;
    if (search_query === "") {
      for (let i = 0; i < cards.length; i++) {
        cards[i].classList.remove("hidden");
      }
    }
  });
}

function performSearch() {
  let search_query = searchInput.value.toLowerCase();
  resultsDropdown.innerHTML = "";

  if (search_query.trim() === "") {
    resultsDropdown.style.display = "none";
    clearButton.style.display = "none";
    cards.forEach(card => (card.style.display = "block"));
    return;
  }

  clearButton.style.display = "block";
  resultsDropdown.style.display = "block";

  let results = [];

  cards.forEach((card, index) => {
    const content = card.querySelector(".store-locator-card__content");
    if (!content || content.classList.contains("store-locator-card__content--see-more")) {
      return;
    }

    const address = content.querySelector(".store-locator-card__address")?.textContent.trim() || "";
    const city = content.querySelector(".store-locator-card__content--city")?.textContent.trim() || "";
    const country = content.querySelector(".store-locator-card__content--country")?.textContent.trim() || "";

    const fullText = `${address}, ${city}, ${country}`.toLowerCase();

    if (fullText.includes(search_query)) {
      results.push({ address, city, country, index });
    }
  });
  if (results.length === 0) {
    resultsDropdown.classList.add("hidden");
  } else {
    resultsDropdown.classList.remove("hidden");
  }

  results.forEach(result => {
    const listItem = document.createElement("li");
    listItem.classList.add("store-locator__search-result-item");
    listItem.textContent = `${result.address}, ${result.city}, ${result.country}`;

    listItem.addEventListener("click", () => {
      searchInput.value = `${result.address}, ${result.city}, ${result.country}`;
      google.maps.event.trigger(markers[result.index], "click");
      resultsDropdown.style.display = "none";
    });

    resultsDropdown.appendChild(listItem);
  });
}

if (isSection && searchInput && clearButton && resultsDropdown && seeMoreCard) {

  searchInput.addEventListener("click", function (e) {
    e.stopPropagation();
  });

  searchInput.addEventListener("input", performSearch);

  clearButton.addEventListener("click", function (e) {
    e.stopPropagation();
    searchInput.value = "";
    resultsDropdown.style.display = "none";
    clearButton.style.display = "none";
  });

  seeMoreCard.addEventListener("click", function (e) {
    e.stopPropagation();
  });
}
