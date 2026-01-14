# Projeto Luz e Sombra (Led Zeppelin Tribute)

## Visão Geral

Este projeto é um website tributo à banda Led Zeppelin, intitulado "Light and Shade". O site é estruturado como uma _Single Page Application_ (SPA) estática, apresentando seções de História, Perfis dos Membros, Discografia e uma Linha do Tempo.

## Arquitetura e Tecnologias

### Front-end

- **HTML5:** Utiliza tags semânticas (`<header>`, `<main>`, `<section>`, `<article>`) para estruturar o conteúdo.
- **CSS3:**
  - **Variáveis CSS (`:root`):** Gerenciamento centralizado de cores (temas dourado/escuro) e tipografia.
  - **Organização:**
    - `src/css/style.css`: Estilos base, reset, tipografia e componentes visuais.
    - `src/css/responsive.css`: _Media queries_ para adaptação em telas maiores (tablets e desktops), seguindo uma abordagem _mobile-first_ implícita.
  - **Fontes:** Integração com Google Fonts (Cinzel, Lora, Quicksand, Young Serif).
- **JavaScript (ES Modules):**
  - **Dados:** O conteúdo textual (história, perfis, discografia) é carregado a partir de um arquivo `data.json`.
  - O projeto está configurado para usar módulos ES (`<script type="module" src="src/js/main.js">`).
  - **Modularização:**
    - `main.js`: Controlador principal, inicialização e gestão de eventos globais.
    - `api.js`: Camada de serviço para abstração da busca de dados.
    - `ui.js`: Responsável pela manipulação do DOM e renderização (View).
    - `timeline.js`: Lógica específica para a interatividade da linha do tempo circular.
    - `search.js`: Implementação da funcionalidade de busca e filtro.
    - `animations.js`: Gerenciamento de animações de entrada via Intersection Observer.

## Estrutura de Diretórios

```text
C:\Users\alexm\projetos\projeto-luzesombra\
├── data.json               # Base de dados (textos, álbuns, timeline)
├── index.html              # Ponto de entrada da aplicação
└── src\
    ├── css\
    │   ├── style.css       # Estilos globais e componentes
    │   └── responsive.css  # Ajustes de layout para telas maiores
    ├── js\
    │   ├── main.js
    │   ├── api.js
    │   ├── ui.js
    │   ├── timeline.js
    │   ├── search.js
    │   └── animations.js
    └── images\             # Assets gráficos (SVGs dos símbolos, WebP)
```

## Como Executar

Por ser um projeto estático que utiliza Módulos ES (`type="module"`), abrir o arquivo `index.html` diretamente pelo sistema de arquivos pode causar erros de CORS (Cross-Origin Resource Sharing) no carregamento do JavaScript.

**Método Recomendado:**
Utilize um servidor HTTP local. Exemplos:

1.  **VS Code Live Server:** Clique em "Go Live" se tiver a extensão instalada.
2.  **Node.js (npx):**
    ```bash
    npx serve .
    ```
3.  **Python:**
    ```bash
    python -m http.server
    ```

Acesse `http://localhost:8000` (ou a porta indicada).

## Convenções de Código Observadas

- **CSS:**
  - Uso de classes utilitárias (ex: `.container`, `.transition`, `.sr-only`).
  - Design Responsivo focado em breakpoints de `768px` e `1024px`.
  - Estilização de scroll suave (`scroll-behavior: smooth`) no HTML.
- **HTML:**
  - IDs específicos (`#history`, `#profiles`, `#discography`) usados para navegação interna (âncoras).
  - Placeholders de conteúdo dinâmico identificados por comentários (ex: `<!-- cards adicionados dinamicamente -->`).

c:\Users\alexm\projetos\projeto-luzesombra\src\js\ui.js
```javascript
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
          
```
