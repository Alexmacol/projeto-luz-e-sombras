// src/js/ui.js

function clearDynamicContent(container) {
  const dynamicElements = container.querySelectorAll(
    ".card, .loading-message, .error-message"
  );
  dynamicElements.forEach((el) => el.remove());
}

export function clearContainer(container) {
  container.innerHTML = "";
}

export function renderLoading(container) {
  clearDynamicContent(container);
  container.insertAdjacentHTML(
    "beforeend",
    '<p class="loading-message">Carregando...</p>'
  );
}

export function renderError(container, message) {
  clearDynamicContent(container);
  container.insertAdjacentHTML(
    "beforeend",
    `<p class="error-message">${message}</p>`
  );
}

/**
 * HISTORY
 * 🔥 respeita SSR
 */
export function renderHistory(sectionElement, historyText) {
  const historyWrapper = sectionElement.querySelector(".history-wrapper");
  if (!historyWrapper) return;

  // NÃO sobrescreve SSR
  if (historyWrapper.children.length > 0) return;

  const card = document.createElement("article");
  card.classList.add("card");
  card.innerHTML = `<p>${(historyText || "").replace(/\n/g, "<br>")}</p>`;

  historyWrapper.appendChild(card);
}

function setupAccordionToggle(header, content, buttonText, item) {
  header.addEventListener("click", () => {
    const isOpen = item.classList.toggle("open");
    header.setAttribute("aria-expanded", isOpen);
    buttonText.textContent = isOpen ? "−" : "+";

    content.style.maxHeight = isOpen
      ? content.scrollHeight + "px"
      : "0";
  });
}

/**
 * DISCOGRAPHY
 * 🔥 respeita SSR
 */
export function renderAlbumsAndCompilations(container, data) {
  if (!container) return;

  // NÃO sobrescreve SSR
  if (container.children.length > 0) return;

  const fragment = document.createDocumentFragment();

  (data || []).forEach((album) => {
    const albumId = album.album.replace(/[^a-zA-Z0-9]/g, "-");

    const albumItem = document.createElement("div");
    albumItem.className = "accordion-item album-item";

    albumItem.innerHTML = `
      <button class="accordion-header album-header" aria-expanded="false" aria-controls="album-content-${albumId}">
        <span class="accordion-name album-name">${album.album}</span>
        <span class="accordion-toggle-btn album-toggle-btn">+</span>
      </button>
      <div class="accordion-content album-content" id="album-content-${albumId}">
        <div class="album-content-inner">
          <div class="card-content-split">
            <div class="left-side">
              <p><strong>Ano: </strong>${album.year}</p>
              <p>${album.description}</p>
            </div>
            <div class="right-side">
              <p><strong>Músicas:</strong></p>
              <ul>
                ${(album.tracks || []).map((track) => `<li>${track}</li>`).join("")}
              </ul>
            </div>
          </div>
        </div>
      </div>
    `;

    const header = albumItem.querySelector(".accordion-header");
    const content = albumItem.querySelector(".accordion-content");
    const buttonText = albumItem.querySelector(".accordion-toggle-btn");

    setupAccordionToggle(header, content, buttonText, albumItem);

    fragment.appendChild(albumItem);
  });

  container.appendChild(fragment);
}

/**
 * PROFILES
 * 🔥 respeita SSR
 */
export function renderProfiles(container, profilesData) {
  if (!container) return;

  // NÃO sobrescreve SSR
  if (container.children.length > 0) return;

  const membersOrder = [
    "Jimmy Page",
    "John Paul Jones",
    "John Bonham",
    "Robert Plant",
  ];

  const displayNames = {
    "John Bonham": "John 'Bonzo' Bonham",
  };

  const fragment = document.createDocumentFragment();

  membersOrder.forEach((memberName) => {
    const profileText = profilesData?.[memberName];
    if (!profileText) return;

    const displayName = displayNames[memberName] || memberName;
    const symbolFilename = memberName.toLowerCase().replace(/\s+/g, "-");

    const profileItem = document.createElement("div");
    profileItem.className = "accordion-item profile-item";

    profileItem.innerHTML = `
      <button class="accordion-header profile-header" aria-expanded="false">
        <img src="src/images/${symbolFilename}.svg" alt="Símbolo de ${memberName}" class="profile-header-symbol">
        <span class="accordion-name profile-name">${displayName}</span>
        <span class="accordion-toggle-btn profile-toggle-btn">+</span>
      </button>
      <div class="accordion-content">
        <div class="profile-content-inner">
          ${(profileText || "").replace(/\n/g, "<br>")}
        </div>
      </div>
    `;

    const header = profileItem.querySelector(".accordion-header");
    const content = profileItem.querySelector(".accordion-content");
    const buttonText = profileItem.querySelector(".accordion-toggle-btn");

    setupAccordionToggle(header, content, buttonText, profileItem);

    fragment.appendChild(profileItem);
  });

  container.appendChild(fragment);
}

/**
 * 🔧 RESTAURADO — usado por search.js
 */
export function renderSearchResults(results = []) {
  const container = document.getElementById("search-results");
  if (!container) return;

  container.innerHTML = "";

  if (!results.length) {
    container.innerHTML = "<p>Nenhum resultado encontrado.</p>";
    return;
  }

  const list = document.createElement("ul");

  results.forEach((item) => {
    const li = document.createElement("li");
    li.textContent = item.title || item;
    list.appendChild(li);
  });

  container.appendChild(list);
}

/**
 * 🔧 RESTAURADO — usado por timeline.js
 */
export function renderTimelineMobile(points = []) {
  const container = document.querySelector(".timeline-container");
  if (!container) return;

  // fallback simples (não quebra nada)
  console.warn("renderTimelineMobile ativo (fallback)");
}