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
    // Restaura o estado inicial recarregando a página. É a abordagem mais simples dada a estrutura atual.
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
  };

  // Lógica da busca
  if (data.historia && data.historia.toLowerCase().includes(lowerCaseQuery)) {
    results.history = {
      title: "História",
      content: highlight(data.historia, query),
    };
  }

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

  renderSearchResults(mainContent, results, query);
}