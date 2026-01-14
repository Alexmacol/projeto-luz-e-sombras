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
 * @param {HTMLElement} container O elemento da seção que contém o wrapper.
 * @param {string} historyText O texto da história a ser renderizado.
 */
export function renderHistory(container, historyText) {
  const historyWrapper = container.querySelector(".history-wrapper");
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
    // Sanitize album name for use in IDs
    const albumId = album.album.replace(/[^a-zA-Z0-9]/g, "-");

    const albumItem = document.createElement("div");
    albumItem.className = "accordion-item album-item"; // Added accordion-item class

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
 * Renderiza os cards de músicas, agrupadas por ano, garantindo que cada música apareça apenas uma vez.
 * @param {HTMLElement} container
 * @param {Array} data A lista de todos os álbuns.
 */
export function renderSongs(container, data) {
  clearContainer(container);

  const normalizeTrackName = (name) =>
    name
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, "")
      .trim();

  // Ordena os álbuns por ano para processar os lançamentos originais primeiro
  const sortedData = [...data].sort((a, b) => a.year - b.year);
  const processedSongs = new Set();
  const songsByYear = {};

  sortedData.forEach((album) => {
    album.tracks.forEach((track) => {
      const normalizedTrack = normalizeTrackName(track);
      // Se a música normalizada ainda não foi processada, é o seu lançamento original
      if (!processedSongs.has(normalizedTrack)) {
        if (!songsByYear[album.year]) {
          songsByYear[album.year] = new Set();
        }
        // Adiciona o nome original da música, mas rastreia a versão normalizada
        songsByYear[album.year].add(track);
        processedSongs.add(normalizedTrack); // Marca a música como processada
      }
    });
  });

  const sortedYears = Object.keys(songsByYear).sort((a, b) => a - b);
  const fragment = document.createDocumentFragment();

  sortedYears.forEach((year) => {
    const card = document.createElement("article");
    card.classList.add("card", "card-content-split");
    card.innerHTML = `
      <div class="left-side">
          <h2>Músicas de ${year}</h2>
        </div>
        <div class="right-side">
          <ul>
            ${Array.from(songsByYear[year])
              .sort()
              .map((track) => `<li>${track}</li>`)
              .join("")}
                    </ul>
                  </div>
              `;
              fragment.appendChild(card);
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
          
              const profileItem = document.createElement("div");
              profileItem.className = "accordion-item profile-item"; // Added accordion-item class
          
              profileItem.innerHTML = `
                <button class="accordion-header profile-header" aria-expanded="false" aria-controls="profile-content-${memberName.replace(/\s+/g, "-")}">
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
          
