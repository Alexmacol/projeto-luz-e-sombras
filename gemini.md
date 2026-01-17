# Projeto Luz e Sombra - Estado Atual do Código

Este documento consolida o código fonte atual do projeto, incluindo backend, frontend e dados, refletindo a estrutura e o conteúdo em [Data Atual].

## Backend

### server.js
```javascript
const express = require("express");
const path = require("path");
const fs = require("fs").promises;
const { GoogleGenerativeAI } = require("@google/generative-ai");
require("dotenv").config();

const app = express();
const port = process.env.PORT || 3000;

const DATA_FILE = path.join(__dirname, "data.json");

/**
 * Retorna uma resposta gerada pela API do Google Generative AI para um dado prompt.
 * @param {string} prompt O prompt a ser enviado para o modelo de IA.
 * @param {string} logContext Uma descrição para os logs (ex: "história da banda").
 * @returns {Promise<string|null>} O texto gerado pela IA, ou null se houver falha.
 */
async function getGenerativeAIResponse(prompt, logContext) {
  try {
    const apiKey = process.env.GOOGLE_API_KEY;
    if (!apiKey) {
      console.warn(
        `Chave da API do Google não encontrada. Pulando a geração de conteúdo para ${logContext}.`
      );
      return null;
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-pro-latest" });

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text().replace(/\*/g, ""); // Remove asteriscos
  } catch (error) {
    console.warn(
      `Falha ao gerar conteúdo para ${logContext}: ${error.message}.`
    );
    return null;
  }
}

/**
 * Atualiza o campo 'historia' no arquivo data.json usando a API do Google Generative AI.
 */
async function updateHistory() {
  const prompt =
    "Aja como um especialista da história do rock n roll. Forneça um resumo bem escrito, sucinto e envolvente sobre a história da banda Led Zeppelin em no máximo 5 parágrafos, de no máximo 4 linhas, inclua datas importantes e destaque os álbuns mais aclamados junto a público e crítica, colocando seus títulos entre aspas (por exemplo, \"Led Zeppelin IV\"). O texto deve conter apenas a informação solicitada, não inclua na resposta nada do tipo 'Claro, aqui está um resumo da história do Led Zeppelin em 5 parágrafos:'.Evite o uso de markdown ou caracteres especiais como asteriscos; apenas acentos ortográficos pertinentes ao português do Brasil devem estar presentes. Não invente nada.";

  const newHistoryText = await getGenerativeAIResponse(
    prompt,
    "a história da banda"
  );

  if (newHistoryText) {
    try {
      const fileContent = await fs.readFile(DATA_FILE, "utf-8");
      const jsonData = JSON.parse(fileContent);

      jsonData.led_zeppelin.historia = newHistoryText;

      await fs.writeFile(DATA_FILE, JSON.stringify(jsonData, null, 2), "utf-8");
      console.log("História da banda atualizada com sucesso no data.json.");
    } catch (error) {
      console.warn(
        `Falha ao salvar a história da banda: ${error.message}. O servidor usará os dados existentes.`
      );
    }
  } else {
    console.warn(
      "Nenhum novo texto de história gerado. O servidor usará os dados existentes."
    );
  }
}

/**
 * Atualiza os perfis dos membros da banda no arquivo data.json usando a API do Google Generative AI.
 */
async function updateProfiles() {
  const members = [
    "Jimmy Page",
    "Robert Plant",
    "John Paul Jones",
    "John Bonham",
  ];
  const profilesData = {};
  const profilePromises = members.map(async (member) => {
    const prompt = `Aja como um especialista da história do rock n roll. Forneça uma biografia resumida bem escrita, sucinta e envolvente e focada sobre a história de ${member}, membro da banda Led Zeppelin, em no máximo 4 parágrafos, de no máximo 5 linhas, um dos parágrafos deve ser sobre o significado do símbolo que ele adotou para ser representado. Destaque os estilos e características técnicas do membro. O texto deve conter apenas a informação solicitada, não inclua na resposta nada do tipo "Claro, aqui está um resumo da história de ${member} em 5 parágrafos:". Se houver menção a qualquer álbum ou música coloque os títulos entre aspas (por exemplo, "Led Zeppelin IV").Evite o uso de markdown ou caracteres especiais como asteriscos; apenas acentos ortográficos pertinentes ao português do Brasil devem estar presentes. Não invente nada.`;

    const newProfileText = await getGenerativeAIResponse(
      prompt,
      `o perfil de ${member}`
    );
    if (newProfileText) {
      profilesData[member] = newProfileText;
    }
  });

  await Promise.all(profilePromises);

  if (Object.keys(profilesData).length > 0) {
    try {
      const fileContent = await fs.readFile(DATA_FILE, "utf-8");
      const jsonData = JSON.parse(fileContent);

      jsonData.led_zeppelin.perfis = profilesData;

      await fs.writeFile(DATA_FILE, JSON.stringify(jsonData, null, 2), "utf-8");
      console.log("Perfis dos membros atualizados com sucesso no data.json.");
    } catch (error) {
      console.warn(
        `Falha ao salvar perfis dos membros: ${error.message}. O servidor usará os dados existentes.`
      );
    }
  } else {
    console.warn(
      "Nenhum novo perfil gerado. O servidor usará os dados existentes."
    );
  }
}

/**
 * Atualiza a lista de shows no arquivo data.json usando a API do Google Generative AI.
 */
async function updateShows() {
  const prompt = `
  Atue como um historiador do rock clássico especialista em Led Zeppelin. Identifique os shows mais icônicos, influentes e historicamente relevantes da banda Led Zeppelin. Desde o início de sua carreira em 1968 até suas últimas apresentações.

Para cada show, forneça as informações estritamente no formato JSON, seguindo esta estrutura de campos:

data: A data do evento no formato dd/mm/aaaa.

local: O nome do local (arena, estádio ou festival) seguido da cidade e país.

contexto: detalhe por que este show é importante, incluindo curiosidades, marcos na carreira da banda ou impacto cultural. Use no máximo 2 parágrados de 4 linhas cada.

setlist: Um array de strings contendo as músicas tocadas no show (ou as principais, caso o setlist seja muito extenso).

Requisitos:

Retorne apenas o objeto JSON (uma lista de objetos).

Não inclua introduções, explicações ou textos fora do JSON.

Certifique-se de incluir eventos fundamentais como o Royal Albert Hall (1970), Madison Square Garden (1973), Earls Court (1975), Knebworth (1979) e o Celebration Day (2007).

Certifique-se de que os shows sejam apresentados em ordem cronológica.

Certifique-se de que a palavra show ou shows estejam presentes em todos os resultados

    IMPORTANTE: A resposta deve ser estritamente um ARRAY JSON válido.
    Não use Markdown. Não use blocos de código (\`\`\`).
    O JSON deve seguir exatamente esta estrutura de chaves para cada item:
    [
      {
        "data": "dd/mm/aaaa",
        "local": "Local do show",
        "contexto": "Descrição e contexto do show",
        "setlist": ["Música 1", "Música 2", "Música 3"]
      }
    ]
  `;

  const responseText = await getGenerativeAIResponse(prompt, "os shows");

  if (responseText) {
    try {
      const cleanedText = responseText.replace(/```json|```/g, "").trim();
      const showsData = JSON.parse(cleanedText);

      const fileContent = await fs.readFile(DATA_FILE, "utf-8");
      const jsonData = JSON.parse(fileContent);

      jsonData.led_zeppelin.shows = showsData;

      await fs.writeFile(DATA_FILE, JSON.stringify(jsonData, null, 2), "utf-8");
      console.log("Shows atualizados com sucesso no data.json.");
    } catch (error) {
      console.warn(
        `Falha ao atualizar shows: ${error.message}. O servidor usará os dados existentes.`
      );
    }
  }
}

/**
 * Inicia o processo de atualização e, em seguida, o servidor web.
 */
async function startServer() {
  console.log(
    "Iniciando servidor... Atualizando dados com IA (isso pode levar alguns segundos)..."
  );
  await Promise.all([updateHistory(), updateProfiles(), updateShows()]);

  // Servir arquivos estáticos do diretório raiz
  app.use(express.static(path.join(__dirname)));

  app.listen(port, () => {
    console.log(`Servidor rodando em http://localhost:${port}`);
  });
}

startServer();
```

## Frontend - JavaScript

### src/js/api.js
```javascript
// src/js/api.js

/**
 * Busca a história da banda no servidor backend.
 * @returns {Promise<string>} O texto da história.
 */
export async function fetchHistory() {
  const data = await fetchLocalData(); // Now fetchLocalData returns the entire led_zeppelin object
  return data.historia; // Access the historia property
}

/**
 * Busca os dados dos álbuns do arquivo JSON local.
 * @returns {Promise<Array>} Uma matriz de objetos de álbuns.
 */
export async function fetchLocalData() {
  try {
    const response = await fetch("data.json");
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const jsonData = await response.json();
    return jsonData.led_zeppelin; // Retorna o objeto principal led_zeppelin
  } catch (error) {
    console.error("Erro ao carregar dados locais:", error);
    return null; // Retorna nulo em caso de erro
  }
}
```

### src/js/ui.js
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
  card.innerHTML =
    `
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

    albumItem.innerHTML =
      `
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
    card.innerHTML =
      `
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
          
              profileItem.innerHTML =
                `
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
  title.className = "section-title";
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
      card.innerHTML =
        `
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
      card.innerHTML =
        `
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
      card.innerHTML =
        `
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
      card.innerHTML =
        `
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
```

### src/js/timeline.js
```javascript
import { fetchLocalData } from "./api.js"; // Importar para buscar os dados

export async function setupTimeline() {
  const points = document.querySelectorAll(".timeline-point");
  const center = document.getElementById("timelineCenter");

  // Fetch timeline data from data.json
  const data = await fetchLocalData();
  const timelineData = data.timeline; // Corrected access

  const radius = 200;
  const centerX = 200;
  const centerY = 200;
  const total = points.length;

  // Inicializa hint
  center.innerHTML = `<span class="hint">Passe o mouse sobre uma data</span>`;
  center.classList.remove("hidden");

  points.forEach((point, index) => {
    const angle = (360 / total) * index - 90;
    const radian = angle * (Math.PI / 180);

    const x = centerX + radius * Math.cos(radian);
    const y = centerY + radius * Math.sin(radian);

    point.style.left = `${x}px`;
    point.style.top = `${y}px`;
    point.style.transform = "translate(-50%, -50%)";

    // Hover
    point.addEventListener("mouseenter", () => {
      points.forEach((p) => p.classList.remove("active"));
      point.classList.add("active");

      // Fade out do conteúdo atual
      center.classList.add("hidden");
      setTimeout(() => {
        // Substitui conteúdo
        center.innerHTML =
          `
          <h2>${timelineData[index].year}</h2>
          ${timelineData[index].text}
        `;

        // Aplica delay dinâmico nos parágrafos para a animação
        const paragraphs = center.querySelectorAll("p");
        paragraphs.forEach((p, index) => {
          p.style.animationDelay = `${index * 0.05}s`;
        });

        // Fade in do novo conteúdo
        center.classList.remove("hidden");
      }, 250);
    });
  });
}
```

### src/js/search.js
```javascript
// src/js/search.js

import { fetchLocalData } from "./api.js";
import { renderError, renderSearchResults } from "./ui.js";

/**
 * Destaca uma consulta em um texto.
 * @param {string} text O texto para pesquisar.
 * @param {string} query A consulta para destacar.
 * @returns {string} O texto com a consulta destacada.
 */
function highlight(text, query) {
  if (!query || typeof text !== "string") return text;
  const regex = new RegExp(
    `(${query.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&")})`,
    "gi"
  );
  return text.replace(regex, `<mark>$1</mark>`);
}

/**
 * Realiza uma busca no conteúdo do site.
 * @param {string} query O termo de busca.
 */
export async function search(query) {
  const mainContent = document.querySelector(".main-content");

  if (!query || query.trim() === "") {
    // Restaura o estado inicial recarregando a página.
    return;
  }

  const lowerCaseQuery = query.toLowerCase();
  const data = await fetchLocalData();

  if (!data) {
    renderError(
      mainContent,
      "Não foi possível realizar a busca. Tente novamente mais tarde."
    );
    return;
  }

  const results = {
    history: null,
    timeline: [],
    albums: [],
    profiles: {},
    shows: [],
  };

  // Lógica da busca - História
  if (data.historia && data.historia.toLowerCase().includes(lowerCaseQuery)) {
    results.history = {
      title: "História",
      content: highlight(data.historia, query),
    };
  }

  // Lógica da busca - Timeline
  results.timeline = data.timeline
    .filter(
      (item) =>
        item.year.toLowerCase().includes(lowerCaseQuery) ||
        item.text.toLowerCase().includes(lowerCaseQuery)
    )
    .map((item) => ({
      ...item,
      year: highlight(item.year, query),
      text: highlight(item.text, query),
    }));

  // Lógica da busca - Álbuns
  results.albums = data.albuns
    .filter(
      (album) =>
        album.album.toLowerCase().includes(lowerCaseQuery) ||
        album.year.toString().includes(lowerCaseQuery) ||
        album.description.toLowerCase().includes(lowerCaseQuery) ||
        album.tracks.some((track) =>
          track.toLowerCase().includes(lowerCaseQuery)
        )
    )
    .map((album) => ({
      ...album,
      album: highlight(album.album, query),
      description: highlight(album.description, query),
      tracks: album.tracks.map((track) => highlight(track, query)),
    }));

  // Lógica da busca - Perfis
  const foundProfiles = {};
  for (const member in data.perfis) {
    if (
      member.toLowerCase().includes(lowerCaseQuery) ||
      data.perfis[member].toLowerCase().includes(lowerCaseQuery)
    ) {
      foundProfiles[member] = highlight(data.perfis[member], query);
    }
  }
  results.profiles = foundProfiles;

  // Lógica da busca - Shows
  if (data.shows) {
    results.shows = data.shows
      .filter(
        (show) =>
          show.data.toLowerCase().includes(lowerCaseQuery) ||
          show.local.toLowerCase().includes(lowerCaseQuery) ||
          show.contexto.toLowerCase().includes(lowerCaseQuery) ||
          show.setlist.some((song) =>
            song.toLowerCase().includes(lowerCaseQuery)
          )
      )
      .map((show) => ({
        ...show,
        local: highlight(show.local, query),
        contexto: highlight(show.contexto, query),
        setlist: show.setlist.map((song) => highlight(song, query)),
      }));
  }

  renderSearchResults(mainContent, results, query);
}
```

### src/js/main.js
```javascript
// src/js/main.js
import { search } from "./search.js";
import { setupTimeline } from "./timeline.js";
import { fetchLocalData } from "./api.js";
import {
  renderHistory,
  renderAlbumsAndCompilations,
  renderLoading,
  renderError,
  renderProfiles,
} from "./ui.js";
import { setupScrollAnimations } from "./animations.js";

/**
 * Renderiza o conteúdo inicial da página (história, perfis, discografia, etc.).
 * Esta função reconstrói o layout principal da página.
 */
export async function renderInitialPageContent() {
  const mainContent = document.querySelector(".main-content");
  if (!mainContent) {
    console.error("Critical: main-content element not found.");
    return;
  }

  // Limpa o conteúdo atual e restaura a estrutura HTML original das seções
  mainContent.innerHTML =
    `
    <section class="history-section fade-in-section" id="history">
      <div class="interface">
        <h2 class="section-title">História</h2>
        <h3 class="section-subtitle">A Jornada</h3>
        <div class="history-wrapper"></div>
      </div>
    </section>
    <section class="profiles-section fade-in-section" id="profiles">
      <div class="interface">
        <h2 class="section-title">Perfis</h2>
        <h3 class="section-subtitle">Os Quatro Elementos</h3>
        <div class="profile-symbols-container">
          <img src="src/images/jimmy-page.svg" alt="Símbolo de Jimmy Page" class="profile-intro-symbol">
          <img src="src/images/john-paul-jones.svg" alt="Símbolo de John Paul Jones" class="profile-intro-symbol">
          <img src="src/images/john-bonham.svg" alt="Símbolo de John Bonham" class="profile-intro-symbol">
          <img src="src/images/robert-plant.svg" alt="Símbolo de Robert Plant" class="profile-intro-symbol">
        </div>
        <p class="section-intro">Em 1971, o Led Zeppelin decidiu que sua música deveria falar por si. Sem nomes ou rostos na capa, cada membro escolheu um símbolo (sigilo mágico) para representar sua essência. O que se segue é o perfil das quatro forças que, em equilíbrio, definiram o som de uma era.</p>
        <div class="profiles-wrapper"></div>
      </div>
    </section>
    <section class="discography-section fade-in-section" id="discography">
      <div class="interface">
        <h2 class="section-title">Discografia</h2>
        <h3 class="section-subtitle">O Legado</h3>
        <div class="discography-wrapper"></div>
      </div>
    </section>
    <section class="timeline-section fade-in-section" id="timeline">
      <div class="interface">
        <h2 class="section-title">Linha do tempo</h2>
        <h3 class="section-subtitle">Crônicas</h3>
        <div class="timeline-container">
          <div class="timeline-circle">
            <div class="timeline-center" id="timelineCenter"></div>
            <div class="timeline-point">1968</div><div class="timeline-point">1969</div><div class="timeline-point">1970</div><div class="timeline-point">1971</div><div class="timeline-point">1973</div><div class="timeline-point">1975</div><div class="timeline-point">1977</div><div class="timeline-point">1979</div><div class="timeline-point">1980</div><div class="timeline-point">1985</div><div class="timeline-point">1988</div><div class="timeline-point">1995</div><div class="timeline-point">2007</div><div class="timeline-point">2012</div>
          </div>
        </div>
      </div>
    </section>
  `;

  // Re-inicializa componentes e busca dados
  await setupTimeline();
  adjustScrollMargin();
  setupScrollAnimations();

  let data;
  try {
    data = await fetchLocalData();
    if (!data) throw new Error("Falha ao buscar dados locais.");
  } catch (error) {
    console.error("Erro crítico ao carregar dados locais:", error);
    renderError(
      document.querySelector(".history-wrapper"),
      "Falha ao carregar dados."
    );
    renderError(
      document.querySelector(".profiles-wrapper"),
      "Falha ao carregar dados."
    );
    renderError(
      document.querySelector(".discography-wrapper"),
      "Falha ao carregar dados."
    );
    return;
  }

  const historyContainer = document.getElementById("history");
  if (historyContainer) {
    const historyWrapper = historyContainer.querySelector(".history-wrapper");
    if (historyWrapper) renderLoading(historyWrapper);

    if (data.historia) renderHistory(historyContainer, data.historia);
    else if (historyWrapper)
      renderError(historyWrapper, "Falha ao carregar a história.");
  }

  const profilesContainer = document.querySelector(".profiles-wrapper");
  if (profilesContainer) {
    renderLoading(profilesContainer);
    if (data.perfis) renderProfiles(profilesContainer, data.perfis);
    else renderError(profilesContainer, "Falha ao carregar os perfis.");
  }

  const discographyContainer = document.querySelector(".discography-wrapper");
  if (discographyContainer) {
    renderLoading(discographyContainer);
    if (data.albuns)
      renderAlbumsAndCompilations(discographyContainer, data.albuns);
    else renderError(discographyContainer, "Falha ao carregar a discografia.");
  }
}

/**
 * Configura os manipuladores de eventos para a funcionalidade de busca.
 */
function setupSearchHandlers() {
  const searchInput = document.getElementById("siteSearch");
  const searchButton = document.querySelector(".search-button");
  const tags = document.querySelectorAll(".tag");

  const triggerSearch = async () => {
    const query = searchInput.value;
    // Se a busca for vazia, restaura o conteúdo em vez de recarregar
    if (!query || query.trim() === "") {
      await renderInitialPageContent();
    } else {
      await search(query);

      // Scroll suave para os resultados
      const mainContent = document.querySelector(".main-content");
      const header = document.querySelector(".header");

      if (mainContent && header) {
        const headerHeight = header.offsetHeight;
        // Calcula a posição do topo do mainContent menos a altura do header
        const elementPosition =
          mainContent.getBoundingClientRect().top + window.pageYOffset;
        const offsetPosition = elementPosition - headerHeight;

        window.scrollTo({
          top: offsetPosition,
          behavior: "smooth",
        });
      }
    }
  };

  searchButton.addEventListener("click", triggerSearch);

  searchInput.addEventListener("keyup", (event) => {
    if (event.key === "Enter") {
      triggerSearch();
    }
  });

  // Também aciona a restauração quando 'x' é clicado para limpar o input
  searchInput.addEventListener("search", () => {
    if (searchInput.value === "") {
      renderInitialPageContent();
    }
  });

  tags.forEach((btn) => {
    btn.addEventListener("click", () => {
      searchInput.value = btn.textContent;
      searchInput.focus();
      triggerSearch();
    });
  });
}

/**
 * Configura os manipuladores de navegação para garantir que o site funcione
 * mesmo quando os resultados da busca estão visíveis (o que remove as seções originais).
 */
function setupNavigationHandlers() {
  const navLinks = document.querySelectorAll(".nav-desktop a");

  navLinks.forEach((link) => {
    link.addEventListener("click", async (event) => {
      const href = link.getAttribute("href");

      // Apenas processa links internos (âncoras)
      if (href && href.startsWith("#")) {
        event.preventDefault();

        // Verifica se estamos no "modo busca" (se as seções originais não existem)
        const isSearchMode = !document.getElementById("history");

        if (isSearchMode) {
          // Limpa o input de busca para refletir o reset
          const searchInput = document.getElementById("siteSearch");
          if (searchInput) searchInput.value = "";

          // Restaura o conteúdo original
          await renderInitialPageContent();
        }

        // Realiza o scroll para o alvo
        if (href === "#") {
          window.scrollTo({ top: 0, behavior: "smooth" });
        } else {
          const targetId = href.substring(1); // Remove o '#'
          const targetSection = document.getElementById(targetId);
          if (targetSection) {
            targetSection.scrollIntoView({ behavior: "smooth" });
          }
        }
      }
    });
  });
}

// Menu mobile
function setupMobileMenu() {
  const mobileBtn = document.getElementById("mobileBtn");
  const mobileMenu = document.getElementById("mobileMenu");

  if (mobileBtn && mobileMenu) {
    mobileBtn.addEventListener("click", () => {
      const isMenuOpen = mobileBtn.classList.toggle("open");
      mobileBtn.setAttribute("aria-expanded", isMenuOpen);
      mobileMenu.style.maxHeight = isMenuOpen
        ? mobileMenu.scrollHeight + "px"
        : "0";
    });
  }
}

/**
 * Ajusta o scroll-margin-top de todas as seções com ID para compensar a altura do header.
 */
function adjustScrollMargin() {
  const header = document.querySelector(".header");
  if (!header) return;

  const headerHeight = header.offsetHeight;
  const sections = document.querySelectorAll("section[id]");

  sections.forEach((section) => {
    section.style.scrollMarginTop = `${headerHeight}px`;
  });
}

/**
 * Configura o event listener para o botão de fechar a busca usando delegação.
 */
function setupCloseSearchListener() {
  document.addEventListener("click", (event) => {
    if (event.target && event.target.id === "close-search-btn") {
      const searchInput = document.getElementById("siteSearch");
      if (searchInput) {
        searchInput.value = ""; // Clear the search input
      }
      renderInitialPageContent();
      // Scroll to top
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  });
}

// Função de inicialização principal
async function initialize() {
  await renderInitialPageContent();
  setupSearchHandlers();
  setupNavigationHandlers(); // Inicializa os handlers de navegação inteligentes
  setupMobileMenu();
  setupCloseSearchListener(); // Configura o listener para o botão de fechar
}

// Inicia a aplicação e ajusta o layout
document.addEventListener("DOMContentLoaded", initialize);
window.addEventListener("resize", adjustScrollMargin);
```

## Frontend - CSS

### src/css/style.css
```css
@import url("https://fonts.googleapis.com/css2?family=Quicksand:wght@300..700&display=swap");
@import url("https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,400..700;1,400..700&display=swap");
@import url("https://fonts.googleapis.com/css2?family=Cinzel:wght@400..900&display=swap");
@import url("https://fonts.googleapis.com/css2?family=Cinzel+Decorative:wght@400;700;900&family=Cinzel:wght@400..900&display=swap");

:root {
  --primary-color: #e09e28;
  --secondary-color: #f2f2f2;
  --tertiary-color: #c79e2a;
  --bg-color: #0a0a0a;
  --bg-cta-accent: #7a0a0a;
  --bg-main: #0f1724;
  --bg-shade-light: #0b0b0b; /* Very dark gray for subtle section contrast */
  --header-height: 3rem;
  --header-footer-line: #3c4043;
  --zzcream: #f3e6d8;
  --zzrose: #7b284f; /* dark rose */
  --zzmetal: #4a4a4a; /* gray */
  --font-display: "Young Serif", serif;
  --font-body: Lora, sans-serif;
  --font-header: "Cinzel Decorative", serif;
  --font-footer: "Lora", serif;
  --section-title-gap: 2px;
}

/* Global styles */
html {
  scroll-behavior: smooth;
}

body {
  background-color: var(--bg-color);
  min-height: 100vh;
  color: var(--zzcream);
  font-family: var(--font-body);
  margin: 0;
}

a {
  color: inherit;
  text-decoration: none;
}

button {
  cursor: pointer;
}

/* Reusable classes */
.container {
  width: 100%;
  padding-left: 1.5rem;
  padding-right: 1.5rem;
  box-sizing: border-box;
}

.transition {
  transition-property: color, background-color, border-color,
    text-decoration-color, fill, stroke, opacity, box-shadow, transform, filter,
    backdrop-filter;
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
  transition-duration: 150ms;
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border-width: 0;
}

.interface {
  max-width: 1280px;
  margin: 0 auto;
  padding: 0 4%;
}

/* HEADER */
.header {
  position: sticky;
  top: 0;
  left: 0;
  right: 0;
  z-index: 100;
  background-color: var(--bg-color);
  border-bottom: 1px solid var(--header-footer-line);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.35);
  transition: box-shadow 0.3s ease, background-color 0.3s ease;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-family: var(--font-header);
  padding-top: 0.5rem 0;
  padding-bottom: 0.5rem 0;
}

.logo a {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.125rem;
  color: var(--primary-color);
  line-height: 1.5rem;
  font-size: 1.1rem;
  font-weight: 600;
  letter-spacing: -0.025em;
  text-shadow: var(--bg-color) 1px 1px 2px;
}

.logo .subtitle {
  display: block;
  margin: 0;
  padding: 0;
  line-height: 0.5rem;
  color: var(--zzmetal);
  font-size: 0.9rem;
  font-weight: 500;
  letter-spacing: 0, 0625rem;
  text-transform: uppercase;
  text-shadow: var(--zzcream) 1px 1px 1px;
  transition: color 0.4s ease;
}

.logo:hover .subtitle {
  color: var(--zzcream);
}

/*NAVIGATION */
.nav-desktop ul {
  display: flex;
  align-items: center;
  gap: 2rem;
  list-style: none;
  line-height: 1.25rem;
  margin: 0;
  padding: 0;
}

.nav-desktop ul li a {
  color: var(--primary-color);
  font-size: 0.875rem;
  font-weight: 600;
  transition: color 0.4s ease;
}

.nav-desktop ul li a:hover {
  color: var(--zzcream);
}

/* WATERMARK */
.hero-watermark {
  background: url("../images/zeppelin2.webp") no-repeat center center/cover;
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0.6;
  filter: blur(0.5px);
}

/* HERO */
.hero {
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: column;
  height: 85vh;
  padding-top: 2rem;
  padding-bottom: 3rem;
  text-align: center;
  overflow: hidden;
}

.hero-content {
  position: relative;
  margin-top: 1rem;
  max-width: 56rem;
  margin-left: auto;
  margin-right: auto;
}

.hero h1 {
  font-family: var(--font-header);
  font-size: 2.25rem;
  font-weight: 700;
  color: var(--primary-color);
  text-shadow: var(--bg-main) 2px 2px 2px;
  line-height: 1.25;
  margin: 0;
}

.hero h1 span {
  display: block;
  font-size: 2rem;
  color: var(--zzmetal);
  text-shadow: var(--zzcream) 1.5px 1.5px 1.5px;
  margin-top: 0.5rem;
  font-weight: 500;
}

.hero p {
  margin-top: 1rem;
  font-family: var(--font-body);
  color: rgba(191, 184, 166, 0.8);
}

/* SEARCH */
.search-container {
  margin-top: 2rem;
  display: flex;
  justify-content: center;
}

.search-wrapper {
  width: 100%;
}

.search-input-wrapper {
  position: relative;
}

#siteSearch {
  width: 100%;
  border-radius: 9999px;
  background-color: rgba(255, 255, 255, 0.05);
  color: var(--zzcream);
  padding: 0.75rem 1.25rem;
  border: none;
  font-size: 1rem;
  font-family: var(--font-body);
}

#siteSearch::placeholder {
  opacity: 0.3;
  color: var(--zzcream);
}

#siteSearch:focus {
  outline: none;
  box-shadow: 0 0 0 4px rgba(122, 10, 10, 0.12);
}

.search-button {
  position: absolute;
  right: 0.25rem;
  top: 0.25rem;
  bottom: 0.25rem;
  background-color: var(--bg-cta-accent);
  border-radius: 9999px;
  padding: 0.375rem 1rem;
  border: none;
  color: var(--zzcream);
  font-family: var(--font-body);
}

.search-button:hover {
  filter: brightness(0.9);
}

/* CLOSE SEARCH BUTTON */
.close-search-container {
  display: flex;
  justify-content: center;
  margin-top: 3rem;
  margin-bottom: 3rem;
}

.close-search-btn {
  background-color: var(--bg-cta-accent); /* Use accent color */
  border-radius: 9999px; /* Fully rounded corners */
  padding: 0.75rem 2rem; /* More padding for a prominent button */
  border: none;
  color: var(--zzcream); /* Cream text color */
  font-family: var(--font-body);
  font-size: 1rem;
  font-weight: bold; /* Make text bold */
  cursor: pointer;
  transition: filter 0.3s ease; /* Hover effect */
  text-align: center; /* Center text within the button */
  display: inline-block; /* Ensure padding and width work as expected */
}

.close-search-btn:hover {
  filter: brightness(1.2);
}

/* TAGS */
.tags1-container, .tags2-container {
  margin-top: 1.5rem;
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  justify-content: center;
}

.tag {
  background-color: rgba(255, 255, 255, 0.05);
  padding: 0.375rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.875rem;
  line-height: 1.25rem;
  color: var(--zzcream);
  border: none;
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}

.tag:hover, .tag:focus {
  transform: translateY(-3px);
  box-shadow: 0 6px 18px rgba(11, 22, 28, 0.45);
}

/*MAIN CONTENT */
.main-content {
  padding-bottom: 5rem;
}

.section-title {
  text-align: center;
  line-height: clamp(1rem, /* altura minima */ 2vw, 1.5rem /* altura maxima */);
  font-family: var(--font-header);
  font-size: 1.5rem;
  letter-spacing: 0.2rem;
  font-weight: bold;
  color: var(--primary-color);
  margin-bottom: var(--section-title-gap);
}
.section-subtitle {
  text-align: center;
  margin-top: 0;
  line-height: clamp(
    1.375rem /* altura minima */ 2vw,
    1.5rem /* altura maxima */
  );
  font-family: var(--font-header);
  font-size: 20px; /* tamanho da fonte atualizado */
  letter-spacing: 0.2rem;
  font-weight: bold;
  color: var(--zzmetal);
  text-shadow: var(--zzcream) 1.5px 1.5px 1.5px;
  margin-bottom: 2rem; /* restaurado */
}

/* Scroll Animation */
.fade-in-section {
  opacity: 0;
  transform: translateY(20px);
  transition: opacity 0.8s ease-out, transform 0.8s ease-out;
}

.fade-in-section.visible {
  opacity: 1;
  transform: translateY(0);
}

/* Seção do histórico */
.history-section {
  background: var(--bg-color);
  padding: 3rem 0; /* Adjusted padding-top and padding-bottom for symmetry with p
adding-left/right of 0 */
  font-family: var(--font-body);
  color: rgba(191, 184, 166, 0.9);
}

.history-wrapper {
  max-width: 56rem;
  margin-left: auto;
  margin-right: auto;
}
/*Accordion Base Styles*/
.accordion-item {
  width: 100%;
  margin: 0 auto 1rem; /* Centraliza e adiciona espaçamento vertical */
  border: 1px solid var(--primary-color);
  border-radius: 8px;
  overflow: hidden;
  background-color: var(--bg-color);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
}

.accordion-item:last-child {
  margin-bottom: 0;
}

.accordion-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  padding: 0.8rem 1rem;
  background: var(--bg-color);
  border: none;
  text-align: left;
  font-family: var(--font-header);
  font-size: 1.25rem;
  color: var(--primary-color);
  cursor: pointer;
  transition: background-color 0.3s ease;
}

.accordion-header:hover {
  background-color: var(--bg-shade-light);
}

.accordion-name {
  flex-grow: 1;
  text-align: center;
}

.accordion-toggle-btn {
  width: 2rem;
  height: 2rem;
  border-radius: 50%;
  background-color: var(--primary-color);
  color: var(--bg-color);
  display: flex;
  justify-content: center;
  align-items: center;
  font-weight: bold;
  font-size: 1.2rem;
  flex-shrink: 0;
  margin-left: 0.5rem;
}

.accordion-content {
  max-height: 0;
  overflow: hidden;
  transition: max-height 0.5s ease-in-out;
  background-color: var(--bg-shade-light);
}

/*Seção Perfis*/
.profiles-section {
  background-color: var(--bg-shade-light); /* Changed to new variable */
  border-top: 1px solid var(--bg-main); /* Added border-top */
  padding: 3rem 0; /* Adjusted padding-top and padding-bottom for symmetry with padding-left/right of 0 */
  font-family: var(--font-body);
}

.section-intro {
  max-width: 56rem;
  margin-left: auto;
  margin-right: auto;
  margin-bottom: 3rem;
  color: var(--secondary-color);
  font-size: 1.25rem;
  font-family: "Lora", sans-serif;
  line-height: 1.6;
  text-align: center;
  padding: 0 2rem;
}

.profile-symbols-container {
  display: flex;
  justify-content: center;
  gap: 2rem;
  margin-bottom: 2rem;
}

.profile-intro-symbol {
  width: 60px;
  height: 60px;
}

.profiles-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center; /* Centraliza os itens horizontalmente */
  max-width: 56rem; /* Limita a largura do container dos perfis */
  margin: 0 auto; /* Centraliza o container na página */
  padding: 0 1.5rem; /* Adiciona padding lateral */
}

/* Profile specific styles 
.profile-item .accordion-name { 
   Specific styles if needed 
} */

.profile-content-inner {
  padding: 2rem;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  color: rgba(191, 184, 166, 0.9);
  line-height: 1.6;
  text-align: justify;
}

.profile-content-inner br {
  display: block;
}

.profile-header-symbol {
  height: 2rem;
  width: auto;
  margin-right: 1rem;
}

/*Seção Discografia*/
.discography-section {
  background-color: var(--bg-color);
  border-top: 1px solid var(--bg-main);
  padding: 3rem 0;
  font-family: var(--font-body);
}

/* Seção da linha do tempo */
.timeline-section {
  background-color: var(--bg-shade-light); /* Changed to new variable */
  border-top: 1px solid var(--bg-main); /* Added border-top */
  padding: 3rem 0; /* Adjusted padding-top and padding-bottom for symmetry with padding-left/right of 0 */
  font-family: var(--font-body);
  /* margin-bottom: 5rem; */
}

.timeline-container {
  position: relative;
  width: 100%;
  max-width: 400px;
  aspect-ratio: 1 / 1; /* mantém 1:1 e garante altura proporcional */
  /* centraliza horizontalmente na página */
  margin-left: auto;
  margin-right: auto;
  margin-top: 35px; /* desloca todo o círculo + itens 45px para baixo */
  padding-top: 24px; /* espaço interno para evitar que os pontos invadam o subtítulo */
  box-sizing: border-box; /* garante que padding não aumente o tamanho total inesperadamente */
}

/* Ajuste responsivo: reduz o deslocamento em telas pequenas */
@media (max-width: 600px) {
  .timeline-container {
    margin-top: 36px;
    padding-top: 20px; /* ajusta o espaçamento interno em telas pequenas */
  }
}

/* Círculo principal */
.timeline-circle {
  position: relative;
  width: 100%;
  height: auto;
  aspect-ratio: 1 / 1; /* garante proporção perfeita do círculo */
  border-radius: 50%;
  border: 2px solid var(--primary-color);
}

/* Centro do círculo */
.timeline-center {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  max-height: 240px;
  overflow-y: auto;
  text-align: center;
  padding: 48px 22px 18px 22px; /* Aumentado o padding-top para afastar o conteúdo do topo */
  color: var(--zzcream);
  opacity: 1;
  transform: translateY(0);
  transition: opacity 0.3s ease, transform 0.3s ease;
}

.timeline-center.hidden {
  opacity: 0;
  transform: translateY(10px);
}

/* Texto central */
.timeline-center h2 {
  font-family: var(--font-header);
  font-size: 0.975rem;
  margin-bottom: 6px;
  line-height: 1.2;
}

.timeline-center p {
  font-size: 0.875rem;
  line-height: 1.45;
  max-width: 240px;
  margin: 0 auto;
  opacity: 0;
  transform: translateY(4px);
  animation: fadeUp 0.35s ease forwards;
}

/* Hint inicial */
.hint {
  font-size: 14px;
  opacity: 0.6;
}

/* Pontos (dates) */
.timeline-point {
  position: absolute;
  width: 46px;
  height: 46px;
  border-radius: 50%;
  background: #000;
  color: var(--primary-color);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  cursor: pointer;
  border: 2px solid var(--primary-color);
  transition: transform 0.3s ease, box-shadow 0.4s ease, background 0.3s ease;
}

/* Glow dourado ao hover ou ativo */
.timeline-point:hover, .timeline-point.active {
  transform: scale(1.15);
  box-shadow: 0 0 8px rgba(212, 175, 55, 0.6), 0 0 16px rgba(212, 175, 55, 0.5),
    0 0 32px rgba(212, 175, 55, 0.4);
}
.discography-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 0 1.5rem;
}

/* Album specific styles */
.album-item {
  max-width: 56rem;
}

.album-content-inner {
  padding: 1.5rem 2rem;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  color: rgba(191, 184, 166, 0.8);
  line-height: 1.6;
}

.album-content-inner .card-content-split .left-side p:first-of-type {
  margin-top: 0;
}
.album-content-inner .card-content-split .right-side p:first-of-type {
  margin-top: 0;
}

.album-content-inner ul {
  padding-left: 1.25rem;
  margin: 0;
  list-style-position: inside;
}

.album-content-inner li {
  margin-bottom: 0.5rem;
  font-size: 1rem;
}

/* CARD CONTENT */

.card-content-split {
  display: flex;
  flex-direction: column; /* Manter coluna como padrão para mobile */
  gap: 1.5rem; /* Aumentar um pouco o gap */
}

.left-side, .right-side {
  text-align: left;
}

/* ARTICLE CONTENT */

article {
  margin-top: 15px;
  /* max-height: 580px; */
  /* overflow-y: scroll; */
  border: 5px solid var(--secondary-color);
  padding: 2rem 2rem;
  margin-top: 1.25rem;
  margin-bottom: 1.25rem;
  box-shadow: none;
  transition: background-color 0.3s ease;
}

article:hover {
  background-color: var(--bg-color);
}

article h2 {
  margin-top: 0;
  font-family: "Cinzel Decorative", sans-serif;
  font-weight: 600;
  font-size: 1.8rem;
  border-bottom: none;
  padding-bottom: 0;
  margin-bottom: 0.25rem;
  color: var(--primary-color);
}

article p {
  margin: 0.5rem 0;
  line-height: 1.6;
  font-size: 1rem;
  margin-bottom: 0.5rem;
  color: rgba(191, 184, 166, 0.9);
}

article ul li {
  font-size: 1.2rem;
}

article p strong {
  color: var(--tertiary-color);
  font-weight: 400;
}

article a {
  color: var(--primary-color);
  text-decoration: none;
  font-weight: 200;
}

.footer {
  bottom: 0;
  left: 0;
  width: 100%;
  color: var(--tertiary-color);
  background-color: var(--bg-color);
  padding: 15px 0;
  border-top: 1px solid var(--header-footer-line);
  font-family: "Lora", sans-serif;
  font-size: 0.8rem;
  box-sizing: border-box;
}

.footer .container {
  max-width: 56rem;
  margin-left: auto;
  margin-right: auto;
  padding-left: 1.5rem;
  padding-right: 1.5rem;
  box-sizing: border-box;
}
.footer-location {
  color: #4a4a4a; /* cinza chumbo */
  margin-bottom: 10px;
}

.footer-links {
  list-style: none;
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  align-items: center;
  gap: 15px;
}

.footer-links a {
  color: var(--zzcream);
  text-decoration: none;
  transition: color 0.2s;
}

.footer-links a:hover {
  color: var(--secondary-color);
}

.visually-hidden {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
  white-space: nowrap;
  border: 0;
  pointer-events: none;
  background: transparent;
}

@keyframes fadeUp {
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
```

## Frontend - HTML

### index.html
```html
<!DOCTYPE html>
<html lang="pt-BR">
  <head>
    <meta charset="utf-8" />
    <meta
      name="viewport"
      content="width=device-width,initial-scale=1" />

    <title>Led Zeppelin — Light and Shade</title>

    <link
      rel="stylesheet"
      href="src/css/style.css" />
    <link
      rel="stylesheet"
      href="src/css/responsive.css" />
  </head>
  <body class="title-gap-2">
    <!-- HEADER -->
    <header class="header">
      <div class="interface">
        <div class="header-content">
          <h1 class="logo">
            <a
              href="#"
              class="transition">
              Led Zeppelin<span class="subtitle">Light and Shade</span>
            </a>
          </h1>

          <!-- DESKTOP NAV -->
          <nav
            class="nav-desktop"
            aria-label="Navegação principal">
            <ul>
              <li>
                <a
                  href="#"
                  class="transition"
                  >Home</a
                >
              </li>
              <li>
                <a
                  href="#history"
                  class="transition"
                  >História</a
                >
              </li>
              <li>
                <a
                  href="#profiles"
                  class="transition"
                  >Perfis</a
                >
              </li>
              <li>
                <a
                  href="#discography"
                  class="transition"
                  >Discografia</a
                >
              </li>
              <li>
                <a
                  href="#timeline"
                  class="transition"
                  >Linha do tempo</a
                >
              </li>
            </ul>
          </nav>
        </div>
      </div>
    </header>

    <!-- HERO -->
    <section class="hero container">
      <!-- watermark (image-inspired) -->
      <div
        class="hero-watermark"
        aria-hidden="true"></div>

      <div class="hero-content">
        <h1>Led Zeppelin<span>LIGHT AND SHADE</span></h1>
        <p>
          Discografia, história e mitos — explore ahistória do Led Zeppelin.
        </p>

        <!-- search -->
        <div class="search-container">
          <div class="search-wrapper">
            <label
              for="siteSearch"
              class="sr-only"
              >Pesquisar</label
            >
            <div class="search-input-wrapper">
              <input
                id="siteSearch"
                type="search"
                placeholder='Pesquise: "Zoso", "1971", "Led Zeppelin IV"'
                class="search" />
              <button
                aria-label="Pesquisar"
                class="search-button transition">
                Buscar
              </button>
            </div>
          </div>
        </div>

        <!-- chips / suggested terms -->
        <div class="tags1-container">
          <button class="tag">ZOSO</button>
          <button class="tag">1971</button>
          <button class="tag">Led Zeppelin IV</button>
          <button class="tag">Kashmir</button>
          <button class="tag">Show</button>
        </div>
        <div class="tags2-container">
          <button class="tag">Plant</button>
          <button class="tag">Page</button>
          <button class="tag">Bonham</button>
          <button class="tag">Jones</button>
          <button class="tag">Mothership</button>
        </div>
      </div>
    </section>

    <!-- Main content -->
    <main class="main-content">
      <!-- History -->
      <section
        class="history-section fade-in-section"
        id="history">
        <div class="interface">
          <h2 class="section-title">História</h2>
          <h3 class="section-subtitle">A Jornada</h3>
          <div class="history-wrapper">
            <!-- card adicionado dinamicamente -->
          </div>
        </div>
      </section>

      <!-- Profiles -->
      <section
        class="profiles-section fade-in-section"
        id="profiles">
        <div class="interface">
          <h2 class="section-title">Perfis</h2>
          <h3 class="section-subtitle">Os Quatro Elementos</h3>
          <p class="section-intro">
            Em 1971, o Led Zeppelin decidiu que sua música deveria falar por si.
            Sem nomes ou rostos na capa, cada membro escolheu um símbolo (sigilo
            mágico) para representar sua essência. O que se segue é o perfil das
            quatro forças que, em equilíbrio, definiram o som de uma era.
          </p>
          <div class="symbols">
            <img
              src="src/images/jimmy-page.svg"
              alt="Símbolo de Jimmy Page"
              class="profile-intro-symbol" />
            <img
              src="src/images/john-paul-jones.svg"
              alt="Símbolo de John Paul Jones"
              class="profile-intro-symbol" />
            <img
              src="src/images/john-bonham.svg"
              alt="Símbolo de John Bonham"
              class="profile-intro-symbol" />
            <img
              src="src/images/robert-plant.svg"
              alt="Símbolo de Robert Plant"
              class="profile-intro-symbol" />
          </div>

          <div class="profiles-wrapper">
            <!-- cards adicionados dinamicamente -->
          </div>
        </div>
      </section>

      <!-- Discography -->
      <section
        class="discography-section fade-in-section"
        id="discography">
        <div class="interface">
          <h2 class="section-title">Discografia</h2>
          <h3 class="section-subtitle">O Legado</h3>
          <div class="discography-wrapper">
            <!-- cards adicionados dinamicamente -->
          </div>
        </div>
      </section>

      <!-- TIMELINE -->
      <section
        class="timeline-section fade-in-section"
        id="timeline">
        <div class="interface">
          <h2 class="section-title">Linha do tempo</h2>
          <h3 class="section-subtitle">Crônicas</h3>
          <div class="timeline-container">
            <!-- Círculo principal -->
            <div class="timeline-circle">
              <!-- Centro da timeline -->
              <div
                class="timeline-center"
                id="timelineCenter">
                <span class="hint">Passe o mouse sobre uma data</span>
              </div>

              <!-- Pontos (datas) -->
              <div class="timeline-point">1968</div>
              <div class="timeline-point">1969</div>
              <div class="timeline-point">1970</div>
              <div class="timeline-point">1971</div>
              <div class="timeline-point">1973</div>
              <div class="timeline-point">1975</div>
              <div class="timeline-point">1977</div>
              <div class="timeline-point">1979</div>
              <div class="timeline-point">1980</div>
              <div class="timeline-point">1985</div>
              <div class="timeline-point">1988</div>
              <div class="timeline-point">1995</div>
              <div class="timeline-point">2007</div>
              <div class="timeline-point">2012</div>
            </div>
          </div>
        </div>
      </section>
    </main>

    <footer class="footer">
      <div class="interface">
        <ul class="footer-links">
          <li>
            <a
              href="https://github.com/Alexmacol"
              target="_blank"
              rel="noopener noreferrer"
              >GitHub</a
            >
          </li>
          <li>
            <a
              href="https://www.ledzeppelin.com/"
              target="_blank"
              rel="noopener noreferrer"
              >Led Zeppelin Official</a
            >
          </li>
          <li><a href="mailto:alexmacol@gmail.com">email</a></li>
        </ul>
      </div>
    </footer>

    <script
      type="module"
      src="src/js/main.js"></script>
  </body>
</html>
```

## Dados

### data.json
```json
{
  "led_zeppelin": {
    "historia": "Formada em 1968, a banda reuniu a genialidade de Jimmy Page na guitarra, o poder vocal de Robert Plant, a versatilidade de John Paul Jones e a força de John Bonham na bateria. Em 1969, os álbuns \"Led Zeppelin\" e \"Led Zeppelin II\" estabeleceram seu som, uma fusão visceral de blues e rock pesado que redefiniu a música da época e os lançou ao estrelato imediato.\n\nO início dos anos 70 marcou a ascensão do grupo ao status de maior banda do mundo, com turnês colossais. Após explorarem o folk em \"Led Zeppelin III\" (1970), eles lançaram sua obra-prima em 1971: o icônico \"Led Zeppelin IV\". Este álbum, um dos mais vendidos da história, continha clássicos como \"Stairway to Heaven\" e solidificou seu domínio global.\n\nA banda seguiu expandindo suas fronteiras musicais com o experimental \"Houses of the Holy\" em 1973. A grandiosidade artística atingiu um novo pico com o aclamado álbum duplo \"Physical Graffiti\" (1975), uma demonstração épica de sua diversidade sonora. Nessa fase, em 1974, fundaram seu próprio selo, a Swan Song Records, afirmando sua independência.\n\nO final da década de 70 foi marcado por adversidades, incluindo acidentes e tragédias pessoais que afetaram o ritmo da banda. Mesmo assim, produziram o intenso \"Presence\" em 1976 e o último álbum de estúdio, \"In Through the Out Door\" (1979), que revelou uma maior influência dos teclados de John Paul Jones em sua sonoridade.\n\nA trajetória da banda foi tragicamente interrompida com a morte do baterista John Bonham em setembro de 1980. Em respeito à sua importância, os membros remanescentes anunciaram o fim oficial do Led Zeppelin em dezembro do mesmo ano. Seu legado como um dos pilares do rock é imensurável, influenciando gerações de músicos até hoje.",
    "timeline": [
      {
        "year": "1968 — Formação",
        "text": "<p>Jimmy Page reúne Robert Plant, John Paul Jones e John Bonham.</p><p>O grupo nasce como The New Yardbirds, mas logo adota o nome Led Zeppelin.</p>"
      },
      {
        "year": "1969 — Ascensão Imediata",
        "text": "<p>Lançamento dos álbuns Led Zeppelin I (janeiro) e Led Zeppelin II (outubro).</p><p>A banda explode mundialmente com seu som pesado e inovador.</p>"
      },
      {
        "year": "1970 — Expansão Musical",
        "text": "<p>Lançamento de Led Zeppelin III, com forte influência folk.</p><p>Inclui as faixas Immigrant Song, Since I've been Loving You e Tangerine.</p><p>A banda se distancia da mídia e reforça seu ar enigmático.</p>"
      },
      {
        "year": "1971 — O Clássico Absoluto",
        "text": "<p>Lançamento de Led Zeppelin IV, um dos álbuns mais vendidos da história.</p><p>Inclui \"Stairway to Heaven\", que se torna um marco do rock.</p>"
      },
      {
        "year": "1973 — Domínio Mundial",
        "text": "<p>Lançamento de Houses of the Holy, marcado pela liberdade criativa.</p><p>Turnês gigantescas estabelecem números recordes de espectadores.</p><p>Criação da gravadora própria: a Swan Song Records.</p>"
      },
      {
        "year": "1975 — Obra-Prima Dupla",
        "text": "<p>Lançamento do álbum duplo Physical Graffiti, primeiro pela recém criada Swan Song Records.</p><p>Inclui a icônica Kashimir, Ten Years Gone e In My Time of Dying.</p><p>O Led Zeppelin atinge o auge criativo e comercial.</p>"
      },
      {
        "year": "1977 — Tragédia e Hiato",
        "text": "<p>Morte de Karac Plant, filho de Robert Plant aos 5 anos de idade.</p><p>A turnê americana é cancelada e a banda entra em pausa.</p>"
      },
      {
        "year": "1979 — Retorno",
        "text": "<p>Lançamento do álbum In Through the Out Door, repleto de texturas e sintetizadores, é considerado o disco de John Paul Jones.</p><p>É o último álbum gravado em estúdio marcando o testamento final do grupo.</p><p>Shows históricos em Knebworth, marcando o retorno aos palcos.</p>"
      },
      {
        "year": "1980 — Fim da Banda",
        "text": "<p>Morte de John Bonham em setembro.</p><p>A banda anuncia oficialmente o seu fim, afirmando que não poderia continuar sem ele.</p><p>Dois anos depois é lançado CODA, álbum com sobras de estúdio de faixas gravadas entre 1968 e 1978.</p>"
      },
      {
        "year": "1985 — Live Aid",
        "text": "<p>Primeira vez que os três membros remanescentes se reuniram no palco após a morte de John Bonham em 1980, com Phil Collins e Tony Thompson na bateria. A apresentação teve um setlist curto: Rock and Roll, Whole Lotta Love e Stairway to Heaven</p>"
      },
      {
        "year": "1988 — Atlantic 40 anos",
        "text": "<p>Reunião em celebração aos 40 anos da Atlantic Records.</p><p>No setlist: Stairway to Heaven, Misty Mountain Hop, Rock and Roll, Whole Lotta Love e Kashimir.</p><p> Destaque para Jason Bonham na bateria, filho do lendário John Bonham.</p>"
      },
      {
        "year": "1995 — Hall da Fama",
        "text": "<p>O Led Zeppelin é introduzido no Rock and Roll Hall of Fame.</p><p>A performance histórica e explosiva contou com convidados interpretando as músicas ao lado da banda.</p><p>Novamente com Jason Bonham assumindo a bateria.</p>"
      },
      {
        "year": "2007 — Celebration Day",
        "text": "<p>Show histórico em Londres, em homenagem a Ahmet Ertegun, fundador da Atlantic Records.</p><p>Formação: Page, Plant, Jones e Jason Bonham.</p><p>18 mil ingressos são vendidos.</p><p>Considerado por muitos o melhor show de reunião da história do rock.</p>"
      },
      {
        "year": "2012 — Filme/Álbum Ao Vivo",
        "text": "<p>O show Celebration Day realizado em 2007 é lançado oficialmente como álbum e filme nos cinemas.</p><p>Vence o Grammy de Melhor Álbum de Rock.</p>"
      }
    ],
    "albuns": [
      {
        "album": "Led Zeppelin",
        "year": 1969,
        "tracks": [
          "Good Times Bad Times",
          "Babe I'm Gonna Leave You",
          "You Shook Me",
          "Dazed And Confused",
          "Your Time Is Gonna Come",
          "Black Mountain Side",
          "Communication Breakdown",
          "I Can't Quit You Baby",
          "How Many More Times"
        ],
        "description": "O álbum de estreia homônimo é uma explosão de blues-rock pesado e psicodelia. Lançado em 1969, ele estabeleceu a base sonora da banda, com faixas como 'Dazed and Confused' e 'Communication Breakdown' que misturam a ferocidade do rock com as raízes profundas do blues americano, definindo um novo paradigma para a música pesada."
      },
      {
        "album": "Led Zeppelin II",
        "year": 1969,
        "tracks": [
          "Whole Lotta Love",
          "What Is and What Should Never Be",
          "The Lemon Song",
          "Thank You",
          "Heartbreaker",
          "Living Loving Maid (She's Just a Woman)",
          "Ramble On",
          "Moby Dick",
          "Bring It On Home"
        ],
        "description": "Considerado por muitos o álbum que definiu o hard rock, 'Led Zeppelin II' é mais direto e pesado que seu antecessor. Gravado enquanto a banda estava em turnê, o álbum captura a energia crua de suas apresentações ao vivo, com riffs icônicos em faixas como 'Whole Lotta Love' e 'Heartbreaker', e uma temática que explora o sexo, a estrada e a mitologia do rock and roll."
      },
      {
        "album": "Led Zeppelin III",
        "year": 1970,
        "tracks": [
          "Immigrant Song",
          "Friends",
          "Celebration Day",
          "Since I've Been Loving You",
          "Out On The Tiles",
          "Gallows Pole",
          "Tangerine",
          "That's The Way",
          "Bron-Y-Aur Stomp",
          "Hats Off To (Roy) Harper"
        ],
        "description": "Este álbum marcou uma virada surpreendente para um som predominantemente acústico e folk, inspirado por um retiro em uma cabana no País de Gales (Bron-Y-Aur). Apesar de ainda conter faixas de rock pesado como 'Immigrant Song', o álbum é dominado por baladas pastorais e melodias celtas, explorando temas de natureza, mitologia e introspecção, mostrando a versatilidade musical da banda."
      },
      {
        "album": "Led Zeppelin IV",
        "year": 1971,
        "tracks": [
          "Black Dog",
          "Rock and Roll",
          "The Battle of Evermore",
          "Stairway to Heaven",
          "Misty Mountain Hop",
          "Four Sticks",
          "Going to California",
          "When the Levee Breaks"
        ],
        "description": "Um dos álbuns mais icônicos e misteriosos da história do rock, o quarto álbum sem título é uma obra-prima que consolida todos os elementos do som do Led Zeppelin. Do hard rock pulsante de 'Black Dog' ao folk místico de 'The Battle of Evermore' e a épica e atemporal 'Stairway to Heaven', o álbum explora temas de ocultismo, fantasia e espiritualidade, tornando-se um marco cultural."
      },
      {
        "album": "Houses of the Holy",
        "year": 1973,
        "tracks": [
          "The Song Remains The Same",
          "The Rain Song",
          "Over The Hills And Far Away",
          "The Crunge",
          "Dancing Days",
          "D'yer Mak'er",
          "No Quarter",
          "The Ocean"
        ],
        "description": "Expandindo ainda mais suas fronteiras musicais, 'Houses of the Holy' incorpora influências de reggae ('D'yer Mak'er') e funk ('The Crunge') em seu som. O álbum é mais brilhante e otimista, com uma produção mais polida e complexa. As letras mergulham em temas de fantasia, mitologia e viagens, como visto na épica 'No Quarter' e na melódica 'The Rain Song'."
      },
      {
        "album": "Physical Graffiti",
        "year": 1975,
        "tracks": [
          "Custard Pie",
          "The Rover",
          "In My Time of Dying",
          "Houses of the Holy",
          "Trampled Under Foot",
          "Kashmir",
          "In the Light",
          "Bron-Yr-Aur",
          "Down By the Seaside",
          "Ten Years Gone",
          "Night Flight",
          "The Wanton Song",
          "Boogie With Stu",
          "Black Country Woman",
          "Sick Again"
        ],
        "description": "Um álbum duplo monumental que serve como uma vitrine para a diversidade musical do Led Zeppelin. 'Physical Graffiti' passeia por hard rock, blues, funk, e até música oriental na majestosa 'Kashmir'. O álbum reúne novas gravações com sobras de sessões anteriores, criando uma obra expansiva e coesa que explora temas que vão da vida na estrada a reflexões existenciais."
      },
      {
        "album": "Presence",
        "year": 1976,
        "tracks": [
          "Achilles Last Stand",
          "For Your Life",
          "Royal Orleans",
          "Nobody's Fault But Mine",
          "Candy Store Rock",
          "Hots On For Nowhere",
          "Tea For One"
        ],
        "description": "Gravado em um período turbulento para a banda, 'Presence' é um álbum visceral e dominado por guitarras. É o único álbum de estúdio que não contém teclados ou violões, resultando em um som de hard rock direto e intenso. Faixas como a épica 'Achilles Last Stand' refletem um senso de urgência e luta, com temas líricos que abordam a sobrevivência e a resiliência."
      },
      {
        "album": "In Through the Out Door",
        "year": 1979,
        "tracks": [
          "In The Evening",
          "South Bound Saurez",
          "Fool In The Rain",
          "Hot Dog",
          "Carouselambra",
          "All My Love",
          "I'm Gonna Crawl"
        ],
        "description": "Marcado pela crescente influência do tecladista John Paul Jones, este álbum adota uma sonoridade mais pop e experimental, com uso proeminente de sintetizadores. Canções como 'Fool in the Rain' (com seu ritmo de samba) e a balada 'All My Love' mostram uma faceta mais suave e melódica da banda, contrastando com o rock pesado de seus primeiros anos. Os temas refletem maturidade e perda."
      },
      {
        "album": "Coda",
        "year": 1982,
        "tracks": [
          "We're Gonna Groove",
          "Poor Tom",
          "I Can't Quit You Baby",
          "Walter's Walk",
          "Ozone Baby",
          "Darlene",
          "Bonzo's Montreux",
          "Wearing and Tearing"
        ],
        "description": "Lançado após a morte de John Bonham e o fim da banda, 'Coda' é uma coleção de faixas não lançadas e outtakes de várias sessões de gravação ao longo da carreira do Led Zeppelin. O álbum serve como um epílogo, oferecendo um vislumbre de diferentes momentos da banda, desde o blues pesado do início de carreira até faixas mais experimentais, funcionando como uma despedida para os fãs."
      },
      {
        "album": "Led Zeppelin (Box Set)",
        "year": 1990,
        "tracks": [
          "Whole Lotta Love",
          "Heartbreaker",
          "Communication Breakdown",
          "Babe I'm Gonna Leave You",
          "What Is and What Should Never Be",
          "Thank You",
          "I Can't Quit You Baby",
          "Dazed and Confused",
          "Your Time Is Gonna Come",
          "Ramble On",
          "Travelling Riverside Blues",
          "Friends",
          "Celebration Day",
          "Hey Hey What Can I Do",
          "White Summer / Black Mountain Side",
          "Black Dog",
          "Over the Hills and Far Away",
          "Immigrant Song",
          "The Battle of Evermore",
          "Bron-Y-Aur Stomp",
          "Tangerine",
          "Going to California",
          "Since I've Been Loving You",
          "D'yer Mak'er",
          "Gallows Pole",
          "Custard Pie",
          "Misty Mountain Hop",
          "Rock and Roll",
          "The Rain Song",
          "Stairway to Heaven",
          "Kashmir",
          "Trampled Under Foot",
          "For Your Life",
          "No Quarter",
          "Dancing Days",
          "When the Levee Breaks",
          "Achilles Last Stand",
          "The Song Remains the Same",
          "Ten Years Gone",
          "In My Time of Dying",
          "In the Evening",
          "Candy Store Rock",
          "The Ocean",
          "Ozone Baby",
          "Houses of the Holy",
          "Wearing and Tearing",
          "Poor Tom",
          "Nobody's Fault But Mine",
          "Fool in the Rain",
          "In the Light",
          "The Wanton Song",
          "Moby Dick / Bonzo's Montreux",
          "I'm Gonna Crawl",
          "All My Love"
        ],
        "description": "Conjunto de quatro CDs que marcou a primeira vez que o catálogo da banda foi masterizado para CD, sob supervisão de Jimmy Page que diferente de um álbum de estúdio, possui 54 faixas pensadas pelo guitarrista Jimmy Page para oferecer um panorama da carreira da banda, com todas as músicas óbvias e essenciais presentes. Além de incluir canções de todos os nove álbuns de estúdio, o conjunto apresenta material especial como uma nova faixa (Traveling to Riverside Blues), uma gravação ao vivo inédita (White Summer Black Mountain Side) e uma mistura de duas músicas (Moby Dick e Bonzo's Montreux). O pacote inclui um livreto de 36 páginas com informações da banda e fotos. Algumas edições maiores (tamanho LP) para colecionadores também incluíam pôsteres da banda."
      },
      {
        "album": "Led Zeppelin Remasters",
        "year": 1990,
        "tracks": [
          "Communication Breakdown",
          "Babe I'm Gonna Leave You",
          "Good Times Bad Times",
          "Dazed and Confused",
          "Whole Lotta Love",
          "Heartbreaker",
          "Ramble On",
          "Immigrant Song",
          "Celebration Day",
          "Since I've Been Loving You",
          "Black Dog",
          "Rock and Roll",
          "The Battle of Evermore",
          "Misty Mountain Hop",
          "Stairway to Heaven",
          "The Song Remains the Same",
          "The Rain Song",
          "D'yer Mak'er",
          "No Quarter",
          "Houses of the Holy",
          "Kashmir",
          "Trampled Underfoot",
          "Nobody's Fault But Mine",
          "Achilles Last Stand",
          "All My Love",
          "In the Evening"
        ],
        "description": "A versão em CD duplo do Led Zeppelin Remasters, lançada simultaneamente à caixa quádrupla em outubro de 1990, serviu como uma compilação de melhores momentos mais acessível para o público geral.Focando nos principais sucessos e nas músicas mais icônicas da banda. apresentava 24 faixas, incluindo clássicos indiscutíveis como Stairway to Heaven, Whole Lotta Love, Black Dog, Rock and Roll e Kashmir, todas se beneficiando da remasterização digital supervisionada por Jimmy Page oferecendo um resumo poderoso e de alta qualidade da lendária carreira do Led Zeppelin."
      },
      {
        "album": "Led Zeppelin Boxed Set 2",
        "year": 1993,
        "tracks": [
          "Good Times Bad Times",
          "We're Gonna Groove",
          "Night Flight",
          "That's the Way",
          "Baby Come On Home (Previously Unreleased)",
          "The Lemon Song",
          "You Shook Me",
          "Boogie With Stu",
          "Bron-Yr-Aur",
          "Down by the Seaside",
          "Out on the Tiles",
          "Black Mountain Side",
          "Moby Dick",
          "Sick Again",
          "Hot Dog",
          "Carouselambra",
          "South Bound Saurez",
          "Walter's Walk",
          "Darlene",
          "Black Country Woman",
          "How Many More Times",
          "The Rover",
          "Four Sticks",
          "Hats Off to (Roy) Harper",
          "I Can't Quit You Baby",
          "Hots On for Nowhere",
          "Living Loving Maid (She's Just a Woman)",
          "Royal Orleans",
          "Bonzo's Montreux",
          "The Crunge",
          "Bring It On Home",
          "Tea For One"
        ],
        "description": "Lançado em setembro de 1993, foi concebido para complementar o primeiro box set de 1990, reunindo todas as faixas restantes do catálogo de estúdio da banda que haviam ficado de fora da compilação anterior. A principal função deste box era garantir que, combinando-o com o primeiro Boxed Set, os fãs tivessem a discografia completa de estúdio da banda em formato remasterizado.O grande atrativo para os colecionadores foi a inclusão da faixa de estúdio inédita na época, Baby Come On Home. O box também vinha acompanhado de um livreto de 54 páginas, contendo fotos e informações detalhadas sobre as gravações."
      },
      {
        "album": "Early Days and Latter Days",
        "year": 2002,
        "tracks": [
          "Good Times, Bad Times",
          "Babe I'm Gonna Leave You",
          "Dazed And Confused",
          "Communication Breakdown",
          "Whole Lotta Love",
          "What Is And What Should Never Be",
          "Immigrant Song",
          "Since I've Been Loving You",
          "Black Dog",
          "Rock And Roll",
          "The Battle Of Evermore",
          "When The Levee Breaks",
          "Stairway To Heaven",
          "The Song Remains The Same",
          "No Quarter",
          "Houses Of The Holy",
          "Trampled Underfoot",
          "Kashmir",
          "Ten Years Gone",
          "Achilles Last Stand",
          "Nobody's Fault But Mine",
          "All My Love",
          "In The Evening"
        ],
        "description": "O lançamento Early Days and Latter Days é, na verdade, a junção de duas compilações de melhores momentos da banda, originalmente lançadas como volumes separados. O volume 1, Early Days, foi lançado em novembro de 1999 e focava na fase inicial da banda (1968-1971), cobrindo faixas dos quatro primeiros álbuns. O volume 2, Latter Days, lançado em novembro de 2000, abrangia o período posterior (1973-1980), com faixas dos álbuns restantes com músicas dos álbuns Houses of the Holy, Physical Graffiti, Presence e In Through the Out Door. Em 2002, ambos os volumes foram combinados em um único lançamento, proporcionando aos fãs uma visão abrangente da carreira do Led Zeppelin, desde seus primeiros dias até o final de sua jornada musical."
      },
      {
        "album": "Mothership",
        "year": 2007,
        "tracks": [
          "Good Times Bad Times",
          "Communication Breakdown",
          "Dazed And Confused",
          "Babe I'm Gonna Leave You",
          "Whole Lotta Love",
          "Ramble On",
          "Heartbreaker",
          "Immigrant Song",
          "Since I've Been Loving You",
          "Rock And Roll",
          "Black Dog",
          "When The Levee Breaks",
          "Stairway to Heaven",
          "The Song Remains the Same",
          "Over The Hills And Far Away",
          "D'yer Mak'er",
          "No Quarter",
          "Trampled Under Foot",
          "Houses Of The Holy",
          "Kashmir",
          "Nobody's Fault But Mine",
          "Achilles Last Stand",
          "In The Evening",
          "All My Love"
        ],
        "description": "O Mothership, lançado em novembro de 2007, representa a coletânea definitiva e a mais vendida da carreira do Led Zeppelin, ideal para novos fãs e colecionadores. A compilação é um álbum duplo (dois CDs), totalizando 24 faixas. Uma versão de luxo popular também inclui um DVD com uma seleção de performances ao vivo icônicas da banda. A seleção das faixas foi feita pelos membros remanescentes da banda — Jimmy Page, Robert Plant e John Paul Jones — garantindo um repertório que eles consideravam essencial e representativo. Foi remasterizado digitalmente, sob a supervisão de Jimmy Page, utilizando os mais recentes avanços tecnológicos da época. A arte da capa apresenta o famoso dirigível Hindenburg em um campo de testes, uma imagem que se tornou imediatamente reconhecível e sinônimo da identidade visual da banda na era moderna."
      }
    ],
    "perfis": {
      "Jimmy Page": "James Patrick Page iniciou sua jornada como um prolífico músico de estúdio em Londres, emprestando seu talento a inúmeros sucessos dos anos 60. Sua entrada na banda The Yardbirds marcou a transição de músico contratado para uma força criativa proeminente. Com o fim do grupo, ele fundou o Led Zeppelin, uma banda que redefiniria os limites do rock, combinando peso, dinâmica e uma ambição musical sem precedentes.\n\nO estilo de Page é uma fusão magistral de blues pesado, folk místico e hard rock visceral. Ele é reverenciado como um dos maiores mestres de riffs da história, mas sua genialidade vai além, abrangendo o uso inovador de afinações alternativas, o arco de violino para criar texturas sonoras etéreas e o controle do theremin. Como produtor, foi um arquiteto sonoro, pioneiro em técnicas de microfonação e sobreposição de guitarras.\n\nO enigmático símbolo \"Zoso\", que Page adotou em \"Led Zeppelin IV\", não é uma palavra, mas um sigilo de sua autoria. Sua origem remonta a um grimório do século XVI e está associado ao planeta Saturno, que rege o signo de Capricórnio, o signo astrológico do guitarrista. O símbolo representa sua profunda imersão no ocultismo e na astrologia, funcionando como uma assinatura esotérica e pessoal.\n\nO legado de Jimmy Page é o de um visionário que moldou a sonoridade da guitarra e do rock como um todo. Mais do que um guitarrista virtuoso, ele foi um compositor, arranjador e produtor que elevou a música a um patamar cinematográfico. Sua influência é incalculável, servindo como a principal inspiração para incontáveis guitarristas e como o arquiteto fundamental do som do hard rock e do heavy metal.",
      "Robert Plant": "Nascido na Inglaterra, Robert Plant foi forjado no blues e no rockabilly de artistas como Elvis Presley. Sua voz poderosa e presença de palco cativaram Jimmy Page, que o recrutou para formar o Led Zeppelin. Plant rapidamente se tornou a personificação do frontman, com uma energia crua que definiria o som da banda em álbuns como \"Led Zeppelin II\" e estabeleceria um novo padrão para o vocal de rock.\n\nSua técnica vocal é marcada por um alcance impressionante, alternando entre sussurros delicados e gritos agudos e uivantes que se tornaram sua marca registrada. Com forte influência do blues em seu fraseado, Plant também foi o principal letrista da banda, infundindo suas canções com temas de mitologia, misticismo e referências literárias, como as de J.R.R. Tolkien.\n\nO símbolo adotado por Plant, uma pena dentro de um círculo, foi retirado do livro \"The Sacred Symbols of Mu\". A pena representa a deusa egípcia Ma'at, simbolizando verdade, justiça e coragem. Essa escolha reflete o profundo interesse de Plant por mitologia e culturas antigas, temas recorrentes em suas composições para o Led Zeppelin.\n\nApós o fim do Led Zeppelin, Plant construiu uma aclamada carreira solo, explorando gêneros como world music e americana, destacando-se na premiada colaboração com Alison Krauss no álbum \"Raising Sand\". Seu legado como o arquétipo do \"deus do rock\" é inegável, e sua voz primal continua a ser uma das mais influentes e reverenciadas na história da música.",
      "John Bonham": "John Henry Bonham, nascido em Redditch, Inglaterra, foi um baterista autodidata que se tornou a força motriz por trás do Led Zeppelin. Influenciado por ícones do jazz, ele desenvolveu uma pegada poderosa e uma presença sonora inconfundível. Foi recrutado por Robert Plant e Jimmy Page em 1968, e sua entrada na banda estabeleceu a fundação rítmica que definiria o hard rock. Sua energia e técnica se tornaram instantaneamente a alma da banda.\n\nConhecido como \"Bonzo\", seu estilo combinava poder avassalador com um senso de groove sofisticado e funkeado. Ele popularizou o uso de baterias maiores, especialmente o bumbo, e uma afinação mais grave para criar um som trovejante e massivo. Sua técnica inovadora incluía o uso de tercinas velozes com o pé direito, como na introdução de \"Good Times Bad Times\", e uma habilidade única de tocar ligeiramente atrás do tempo, conferindo um peso incomparável à música.\n\nO símbolo adotado por Bonham, os três anéis interligados, foi inspirado no logotipo da cerveja Ballantine. Os anéis borromeanos representam a trindade de homem, mulher e filho, refletindo a importância de sua família. Embora de origem comercial, ele adotou o símbolo para representar essa unidade fundamental em sua vida, que foi imortalizada na capa do álbum \"Led Zeppelin IV\" junto aos símbolos dos outros membros.\n\nA bateria de Bonham era a espinha dorsal e o coração do som do Led Zeppelin, com solos épicos como o de \"Moby Dick\" solidificando seu status lendário. Sua morte prematura em 1980, aos 32 anos, levou ao fim da banda, pois os membros restantes o consideraram insubstituível. Seu legado permanece como o do arquiteto da bateria de rock moderna, reverenciado por sua força, musicalidade e inovação.",
      "John Paul Jones": "Nascido John Baldwin, John Paul Jones emergiu de uma família musical, tornando-se um prodígio multi-instrumentista. Antes do Zeppelin, ele já era uma figura lendária nos estúdios de Londres, atuando como arranjador e baixista para artistas como The Rolling Stones e Donovan. Sua imensa bagagem musical e precisão técnica foram pilares essenciais na formação sonora do grupo, trazendo uma sofisticação que equilibrava a força bruta da banda.\n\nA âncora sônica do Led Zeppelin, Jones era muito mais que um baixista. Suas linhas de baixo eram melódicas, complexas e cheias de groove, formando uma fundação rítmica indestrutível com a bateria de John Bonham. Como o \"arma secreta\" da banda, ele adicionava texturas de teclados, piano, órgão, bandolim e arranjos de cordas, expandindo a paleta sonora do grupo de forma decisiva em faixas como \"Stairway to Heaven\".\n\nO símbolo adotado por Jones no álbum \"Led Zeppelin IV\" foi encontrado em um livro de runas e é composto por um círculo sobreposto a uma triquetra. Este grafismo antigo é usado para simbolizar uma pessoa que possui tanto confiança quanto competência. A escolha reflete perfeitamente a sua personalidade discreta, porém imensamente habilidosa e autoconfiante, um pilar de conhecimento musical dentro da banda.\n\nApós o fim da banda, Jones solidificou seu legado como um músico versátil e requisitado, atuando como produtor e colaborador para artistas como R.E.M. e Diamanda Galás. Sua relevância foi reafirmada no século XXI com a formação do supergrupo Them Crooked Vultures, ao lado de Dave Grohl e Josh Homme. Ele permanece um ícone de musicalidade, inovação e discrição no rock."
    },
    "shows": [
      {
        "data": "10/01/1969",
        "local": "Fillmore West, São Francisco, EUA",
        "contexto": "Parte da primeira turnê norte-americana, estes shows no Fillmore West foram cruciais para estabelecer a reputação do Led Zeppelin. A banda, ainda desconhecida para muitos, chocou o público com sua energia crua e som avassalador, superando as bandas principais da noite. Estes shows foram a faísca que incendiou sua conquista da América.\n\nA performance intensa e a improvisação musical demonstraram que o Zeppelin era uma força a ser reconhecida. A reação do público e da crítica foi tão forte que estes shows são frequentemente citados como o ponto de virada que transformou a banda de uma novidade britânica em um fenômeno global iminente, definindo o som do hard rock.",
        "setlist": [
          "Train Kept A-Rollin'",
          "I Can't Quit You Baby",
          "As Long As I Have You",
          "Dazed and Confused",
          "How Many More Times",
          "White Summer/Black Mountain Side",
          "The Killing Floor",
          "You Shook Me",
          "Pat's Delight",
          "Communication Breakdown"
        ]
      },
      {
        "data": "09/01/1970",
        "local": "Royal Albert Hall, Londres, Reino Unido",
        "contexto": "Este show marcou um triunfante regresso a casa para a banda, já consagrada como uma das maiores do mundo. Realizado no prestigioso Royal Albert Hall, o evento foi filmado profissionalmente, capturando a energia explosiva e a musicalidade sofisticada da banda no auge de sua juventude. Este é um dos shows mais icônicos do início de carreira.\n\nA performance de mais de duas horas solidificou sua reputação como uma experiência ao vivo incomparável. O setlist equilibrou o peso de \"Whole Lotta Love\" com a delicadeza de um set acústico, mostrando a versatilidade que os diferenciava. Este show é um documento histórico essencial do poder do Led Zeppelin.",
        "setlist": [
          "We're Gonna Groove",
          "I Can't Quit You Baby",
          "Dazed and Confused",
          "Heartbreaker",
          "White Summer/Black Mountain Side",
          "What Is and What Should Never Be",
          "Moby Dick",
          "How Many More Times",
          "Whole Lotta Love",
          "Communication Breakdown",
          "C'mon Everybody",
          "Bring It On Home"
        ]
      },
      {
        "data": "28/07/1973",
        "local": "Madison Square Garden, Nova York, EUA",
        "contexto": "Representando o apogeu da \"Zeppelin-mania\", os três shows consecutivos no Madison Square Garden em julho de 1973 foram filmados para o filme-concerto \"The Song Remains the Same\". A banda estava no auge de sua popularidade e poder, tocando para multidões esgotadas na arena mais famosa do mundo. Estes shows capturaram a grandiosidade da banda.\n\nCom performances que se estendiam por mais de três horas, os shows apresentavam longas improvisações e solos épicos, mostrando a banda em seu estado mais extravagante e musicalmente ambicioso. O evento solidificou seu status como deuses do rock, definindo o padrão para os espetáculos de rock de arena dos anos 70.",
        "setlist": [
          "Rock and Roll",
          "Black Dog",
          "Since I've Been Loving You",
          "No Quarter",
          "The Song Remains the Same",
          "The Rain Song",
          "Dazed and Confused",
          "Stairway to Heaven",
          "Moby Dick",
          "Heartbreaker",
          "Whole Lotta Love",
          "The Ocean"
        ]
      },
      {
        "data": "24/05/1975",
        "local": "Earls Court Arena, Londres, Reino Unido",
        "contexto": "Após uma pausa de dois anos, o Led Zeppelin retornou aos palcos britânicos para uma residência de cinco noites no Earls Court. Estes shows foram um espetáculo visual e sonoro sem precedentes, utilizando um sistema de som massivo, um telão de vídeo e um show de luzes e lasers de última geração, estabelecendo um novo padrão para produções de rock.\n\nCom a recente aclamação do álbum duplo \"Physical Graffiti\", os setlists eram longos e diversificados, incluindo um extenso set acústico que trazia intimidade à imensa arena. Estes shows são frequentemente considerados pelos fãs como algumas das melhores e mais completas performances da carreira da banda, um verdadeiro tour de force.",
        "setlist": [
          "Rock and Roll",
          "Sick Again",
          "Over the Hills and Far Away",
          "In My Time of Dying",
          "The Song Remains the Same",
          "The Rain Song",
          "Kashmir",
          "No Quarter",
          "Tangerine",
          "Going to California",
          "That's the Way",
          "Bron-Y-Aur Stomp",
          "Trampled Under Foot",
          "Moby Dick",
          "Dazed and Confused",
          "Stairway to Heaven",
          "Whole Lotta Love",
          "Black Dog"
        ]
      },
      {
        "data": "04/08/1979",
        "local": "Knebworth Park, Hertfordshire, Reino Unido",
        "contexto": "Marcando o retorno do Led Zeppelin ao vivo no Reino Unido após quatro anos, estes dois shows no Festival de Knebworth foram eventos monumentais. A banda tocou para mais de 100.000 pessoas em cada noite, em um momento de grande expectativa após um período de tragédia e incerteza. Foi a última vez que a formação original se apresentou em sua terra natal.\n\nApesar de algumas críticas sobre a performance, o show foi um marco histórico, demonstrando que a banda ainda possuía um poder de atração incomparável. O setlist incluiu novas músicas do álbum \"In Through the Out Door\", sinalizando uma nova direção musical. Estes shows representam o crepúsculo da era de ouro da banda.",
        "setlist": [
          "The Song Remains the Same",
          "Celebration Day",
          "Black Dog",
          "Nobody's Fault but Mine",
          "Over the Hills and Far Away",
          "Misty Mountain Hop",
          "Since I've Been Loving You",
          "No Quarter",
          "Hot Dog",
          "The Rain Song",
          "White Summer/Black Mountain Side",
          "Kashmir",
          "Trampled Under Foot",
          "Achilles Last Stand",
          "Stairway to Heaven",
          "Rock and Roll",
          "Whole Lotta Love"
        ]
      },
      {
        "data": "10/12/2007",
        "local": "O2 Arena, Londres, Reino Unido",
        "contexto": "Este show único de reunião, em homenagem ao fundador da Atlantic Records, Ahmet Ertegun, foi um dos eventos mais aguardados da história da música. Com Jason Bonham, filho de John Bonham, assumindo a bateria, a banda entregou uma performance poderosa e coesa que superou todas as expectativas, provando que sua química musical permanecia intacta.\n\nMilhões de pessoas tentaram comprar ingressos, tornando-o o show com a maior demanda de todos os tempos. A performance foi aclamada pela crítica e pelos fãs, sendo posteriormente lançada como o filme-concerto \"Celebration Day\". Este show foi um tributo digno e uma conclusão triunfante para a lendária carreira ao vivo da banda.",
        "setlist": [
          "Good Times Bad Times",
          "Ramble On",
          "Black Dog",
          "In My Time of Dying",
          "For Your Life",
          "Trampled Under Foot",
          "Nobody's Fault but Mine",
          "No Quarter",
          "Since I've Been Loving You",
          "Dazed and Confused",
          "Stairway to Heaven",
          "The Song Remains the Same",
          "Misty Mountain Hop",
          "Kashmir",
          "Whole Lotta Love",
          "Rock and Roll"
        ]
      }
    ]
  }
}
```
