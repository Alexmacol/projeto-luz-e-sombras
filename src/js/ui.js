// src/js/ui.js

/**
 * Remove o conteúdo dinâmico (card, loading, error) de um container, preservando o título.
 * @param {HTMLElement} container
 */
function clearDynamicContent(container) {
  const dynamicElements = container.querySelectorAll(
    ".card, .loading-message, .error-message"
  );
  dynamicElements.forEach((el) => el.remove());
}

/**
 * Limpa o conteúdo do container.
 * @param {HTMLElement} container
 */
export function clearContainer(container) {
  container.innerHTML = "";
}

/**
 * Exibe uma mensagem de carregamento no container.
 * @param {HTMLElement} container
 */
export function renderLoading(container) {
  clearDynamicContent(container);
  container.insertAdjacentHTML(
    "beforeend",
    '<p class="loading-message">Carregando...</p>'
  );
}

/**
 * Exibe uma mensagem de erro no container.
 * @param {HTMLElement} container
 * @param {string} message
 */
export function renderError(container, message) {
  clearDynamicContent(container);
  container.insertAdjacentHTML(
    "beforeend",
    `<p class="error-message">${message}</p>`
  );
}

/**
 * Renderiza o card com a história da banda.
 * @param {HTMLElement} sectionElement O elemento da seção que contém o wrapper.
 * @param {string} historyText O texto da história a ser renderizado.
 */
export function renderHistory(sectionElement, historyText) {
  const historyWrapper = sectionElement.querySelector(".history-wrapper");
  if (!historyWrapper) {
    console.error("Error: .history-wrapper not found inside history section.");
    return;
  }

  // Limpa diretamente o wrapper para garantir que esteja vazio antes de adicionar o card.
  historyWrapper.innerHTML = "";

  const card = document.createElement("article");
  card.classList.add("card");
  card.innerHTML = `
    <p>${historyText.replace(/\n/g, "<br>")}</p>
  `;
  historyWrapper.appendChild(card);
}

/**
 * Configura a lógica de alternância (toggle) para um item de acordeão.
 * @param {HTMLElement} header O elemento do cabeçalho clicável.
 * @param {HTMLElement} content O elemento de conteúdo a ser expandido/recolhido.
 * @param {HTMLElement} buttonText O elemento que exibe o texto do botão (+/-).
 * @param {HTMLElement} item O elemento pai do item do acordeão que receberá a classe 'open'.
 */
function setupAccordionToggle(header, content, buttonText, item) {
  header.addEventListener("click", () => {
    const isOpen = item.classList.toggle("open");
    header.setAttribute("aria-expanded", isOpen);
    buttonText.textContent = isOpen ? "−" : "+";
    if (isOpen) {
      content.style.maxHeight = content.scrollHeight + "px";
    } else {
      content.style.maxHeight = "0";
    }
  });
}

/**
 * Renderiza os álbuns como um accordion.
 * @param {HTMLElement} container
 * @param {Array} data A lista de álbuns/compilações.
 */
export function renderAlbumsAndCompilations(container, data) {
  clearContainer(container);
  const fragment = document.createDocumentFragment();

  data.forEach((album) => {
    // Remove caracteres especiais do nome do álbum para usar como ID
    const albumId = album.album.replace(/[^a-zA-Z0-9]/g, "-");

    const albumItem = document.createElement("div");
    albumItem.className = "accordion-item album-item"; // adiciona a classe "accordion-item"

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
                ${album.tracks.map((track) => `<li>${track}</li>`).join("")}
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
 * Renderiza os perfis dos membros da banda como um accordion.
 * @param {HTMLElement} container
           * @param {Object} profilesData
           */
          export function renderProfiles(container, profilesData) {
            clearContainer(container);
          
            const membersOrder = ["Jimmy Page", "John Paul Jones", "John Bonham", "Robert Plant"];
            const displayNames = {
              "John Bonham": "John 'Bonzo' Bonham",
            };
          
            const fragment = document.createDocumentFragment();
          
            membersOrder.forEach((memberName) => {
              const profileText = profilesData[memberName];
              if (!profileText) return;
          
              const displayName = displayNames[memberName] || memberName;

              const symbolFilename = memberName.toLowerCase().replace(/\s+/g, "-");

              const profileItem = document.createElement("div");
              profileItem.className = "accordion-item profile-item"; // Added accordion-item class
          
              profileItem.innerHTML = `
                <button class="accordion-header profile-header" aria-expanded="false" aria-controls="profile-content-${memberName.replace(/\s+/g, "-")}">
                <img src="src/images/${symbolFilename}.svg" alt="Símbolo de ${memberName}" class="profile-header-symbol">
                  <span class="accordion-name profile-name">${displayName}</span>
                  <span class="accordion-toggle-btn profile-toggle-btn">+</span>
                </button>
                <div class="accordion-content profile-content" id="profile-content-${memberName.replace(/\s+/g, "-")}">
                  <div class="profile-content-inner">
                    ${profileText.replace(/\n/g, "<br>")}
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
 * Renderiza os resultados da busca.
 * @param {HTMLElement} container
 * @param {Object} results
 * @param {string} query
 */
export function renderSearchResults(container, results, query) {
  clearContainer(container);

  const fragment = document.createDocumentFragment();
  const wrapper = document.createElement("div");
  wrapper.className = "interface";
  wrapper.style.paddingTop = "2rem";
  wrapper.style.paddingBottom = "2rem";

  // Título
  const title = document.createElement("h2");
  title.className = "section-title search-results-title";
  title.textContent = `Resultados para "${query}"`;
  wrapper.appendChild(title);

  let hasResults = false;

  // História
  if (results.history) {
    hasResults = true;
    const subTitle = document.createElement("h3");
    subTitle.className = "section-subtitle";
    subTitle.textContent = results.history.title;
    wrapper.appendChild(subTitle);

    const card = document.createElement("article");
    card.innerHTML = `<p>${results.history.content.replace(/\n/g, "<br>")}</p>`;
    wrapper.appendChild(card);
  }

  // Perfis
  if (results.profiles && Object.keys(results.profiles).length > 0) {
    hasResults = true;
    const subTitle = document.createElement("h3");
    subTitle.className = "section-subtitle";
    subTitle.textContent = "Perfis";
    wrapper.appendChild(subTitle);

    for (const [name, content] of Object.entries(results.profiles)) {
      const card = document.createElement("article");
      card.innerHTML = `
        <h4 style="color: var(--primary-color); margin-top: 0; font-size: 1.2rem;">${name}</h4>
        <p>${content.replace(/\n/g, "<br>")}</p>
      `;
      wrapper.appendChild(card);
    }
  }

  // Discografia
  if (results.albums && results.albums.length > 0) {
    hasResults = true;
    const subTitle = document.createElement("h3");
    subTitle.className = "section-subtitle";
    subTitle.textContent = "Discografia";
    wrapper.appendChild(subTitle);

    results.albums.forEach((album) => {
      const card = document.createElement("article");
      card.innerHTML = `
        <h4 style="color: var(--primary-color); margin-top: 0; font-size: 1.2rem;">${album.album} (${album.year})</h4>
        <p>${album.description}</p>
        <p><strong>Faixas:</strong></p>
        <ul>
          ${album.tracks.map((track) => `<li>${track}</li>`).join("")}
        </ul>
      `;
      wrapper.appendChild(card);
    });
  }

  // Shows
  if (results.shows && results.shows.length > 0) {
    hasResults = true;
    const subTitle = document.createElement("h3");
    subTitle.className = "section-subtitle";
    subTitle.textContent = "Shows Icônicos";
    wrapper.appendChild(subTitle);

    results.shows.forEach((show) => {
      const card = document.createElement("article");
      card.innerHTML = `
        <h4 style="color: var(--primary-color); margin-top: 0; font-size: 1.2rem;">${show.data} — ${show.local}</h4>
        <p>${show.contexto}</p>
        <p><strong>Setlist:</strong></p>
        <ul>
          ${show.setlist.map((song) => `<li>${song}</li>`).join("")}
        </ul>
      `;
      wrapper.appendChild(card);
    });
  }

  // Timeline
  if (results.timeline && results.timeline.length > 0) {
    hasResults = true;
    const subTitle = document.createElement("h3");
    subTitle.className = "section-subtitle";
    subTitle.textContent = "Linha do Tempo";
    wrapper.appendChild(subTitle);

    results.timeline.forEach((item) => {
      const card = document.createElement("article");
      card.innerHTML = `
        <h4 style="color: var(--primary-color); margin-top: 0; font-size: 1.2rem;">${item.year}</h4>
        <div>${item.text}</div>
      `;
      wrapper.appendChild(card);
    });
  }

  if (!hasResults) {
    renderError(wrapper, "Nenhum resultado encontrado.");
  }

  // Botão Voltar
  const closeButtonContainer = document.createElement("div");
  closeButtonContainer.className = "close-search-container";
  closeButtonContainer.innerHTML = `<button id="close-search-btn" class="close-search-btn">Voltar</button>`;
  wrapper.appendChild(closeButtonContainer);

  fragment.appendChild(wrapper);
  container.appendChild(fragment);
}

/**
 * Renderiza a timeline como um accordion (para dispositivos móveis).
 * @param {HTMLElement} container
 * @param {Array} timelineData
 */
export function renderTimelineMobile(container, timelineData) {
  clearContainer(container);
  const fragment = document.createDocumentFragment();

  timelineData.forEach((item, index) => {
    const itemId = `timeline-mobile-${index}`;

    const timelineItem = document.createElement("div");
    timelineItem.className = "accordion-item timeline-item-mobile";

    timelineItem.innerHTML = `
      <button class="accordion-header timeline-header-mobile" aria-expanded="false" aria-controls="content-${itemId}">
        <span class="accordion-name">${item.year}</span>
        <span class="accordion-toggle-btn">+</span>
      </button>
      <div class="accordion-content" id="content-${itemId}">
        <div class="profile-content-inner"> <!-- Reusing profile-content-inner for padding/style -->
          ${item.text}
        </div>
      </div>
    `;

    const header = timelineItem.querySelector(".accordion-header");
    const content = timelineItem.querySelector(".accordion-content");
    const buttonText = timelineItem.querySelector(".accordion-toggle-btn");

    setupAccordionToggle(header, content, buttonText, timelineItem);

    fragment.appendChild(timelineItem);
  });

  container.appendChild(fragment);
}

