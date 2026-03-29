// src/js/main.js
import { search } from "./search.js";
import { setupTimeline } from "./timeline.js";
import { fetchLocalData } from "./api.js";
import { initMobileMenu } from "./menu-mobile.js";
import {
  renderHistory,
  renderAlbumsAndCompilations,
  renderLoading,
  renderError,
  renderProfiles,
} from "./ui.js";
import { setupScrollAnimations } from "./animations.js";

/**

 * Exibe o conteúdo inicial da página e oculta os resultados da busca.

 * Esta função apenas alterna a visibilidade dos containers.

 */

export async function renderInitialPageContent() {

  const originalContent = document.getElementById("original-content");

  const searchResultsContainer = document.getElementById("search-results");



  if (searchResultsContainer) {

    searchResultsContainer.classList.add("hidden");

    searchResultsContainer.innerHTML = "";

  }



  if (originalContent) {

    originalContent.classList.remove("hidden");

  }



  // Garante que o scroll margin e as animações estejam corretos

  adjustScrollMargin();

}



/**

 * Carrega e renderiza os dados nas seções originais.

 * Chamada apenas uma vez durante a inicialização.

 */

async function loadAndRenderData() {

  let data;

  try {

    data = await fetchLocalData();

    if (!data) throw new Error("Falha ao buscar dados locais.");

  } catch (error) {

    console.error("Erro crítico ao carregar dados locais:", error);

    renderError(

      document.querySelector(".history-wrapper"),

      "Falha ao carregar dados.",

    );

    renderError(

      document.querySelector(".profiles-wrapper"),

      "Falha ao carregar dados.",

    );

    renderError(

      document.querySelector(".discography-wrapper"),

      "Falha ao carregar dados.",

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



  // Inicializa componentes que dependem dos dados renderizados

  await setupTimeline();

  setupScrollAnimations();

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
 * Configura os manipuladores de navegação para garantir que o site funcione mesmo quando os resultados da busca estão visíveis (o que remove as seções originais).
 */
function setupNavigationHandlers() {
  const navLinks = document.querySelectorAll(".nav-desktop a, .menu__mobile a");

  navLinks.forEach((link) => {
    link.addEventListener("click", async (event) => {
      const href = link.getAttribute("href");

      // Apenas processa links internos (âncoras)
      if (href && href.startsWith("#")) {
        event.preventDefault();

        // Fecha o menu mobile se estiver aberto
        const menuMobile = document.getElementById("menu__mobile");
        const line1 = document.querySelector(".menu-mobile__line1");
        const line2 = document.querySelector(".menu-mobile__line2");
        const body = document.querySelector("body");

        if (menuMobile && menuMobile.classList.contains("abrir")) {
          menuMobile.classList.remove("abrir");
          if (line1) line1.classList.remove("--ativo1");
          if (line2) line2.classList.remove("--ativo2");
          if (body) body.classList.remove("no-overflow");
        }

        // Se estiver nos resultados da busca, volta para o conteúdo original
        const searchResultsContainer = document.getElementById("search-results");
        if (searchResultsContainer && !searchResultsContainer.classList.contains("hidden")) {
          const searchInput = document.getElementById("siteSearch");
          if (searchInput) searchInput.value = "";
          await renderInitialPageContent();
        }

        // Realiza o scroll para o alvo
        if (href === "#") {
          window.scrollTo({ top: 0, behavior: "smooth" });
        } else {
          const targetId = href.substring(1); // Remove o '#'
          const targetSection = document.getElementById(targetId);
          
          if (targetSection) {
            const header = document.querySelector(".header");
            const headerHeight = header ? header.offsetHeight : 0;
            const elementPosition = targetSection.getBoundingClientRect().top + window.pageYOffset;
            const offsetPosition = elementPosition - headerHeight;

            window.scrollTo({
              top: offsetPosition,
              behavior: "smooth"
            });
          }
        }
      }
    });
  });
}

/**
 * Ajusta o scroll-margin-top de todas as seções com ID para compensar a altura do header.
 * Também adiciona padding ao body para evitar que o conteúdo seja escondido pelo header fixo.
 */
function adjustScrollMargin() {
  const header = document.querySelector(".header");
  if (!header) return;

  const headerHeight = header.offsetHeight;
  const sections = document.querySelectorAll("section[id]");

  // Adiciona padding ao body para compensar a posição 'fixed' do header
  document.body.style.paddingTop = `${headerHeight}px`;

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
        searchInput.value = ""; // Limpa o input
      }
      renderInitialPageContent();
      // Scroll suave para topo
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  });
}

// Configura um observador para ajustar o scroll margin sempre que o header mudar de tamanho
function setupHeaderObserver() {
  const header = document.querySelector(".header");
  if (header) {
    const observer = new ResizeObserver(() => adjustScrollMargin());
    observer.observe(header);
  }
}

// Função de inicialização principal
async function initialize() {
  await loadAndRenderData(); // Carrega os dados uma única vez
  await renderInitialPageContent(); // Garante o estado inicial de visibilidade
  setupSearchHandlers();
  setupNavigationHandlers(); // Inicializa os handlers de navegação inteligentes
  initMobileMenu();
  setupCloseSearchListener(); // Configura o listener para o botão de fechar
  setupHeaderObserver(); // Inicia o monitoramento do tamanho do header
}

// Inicia a aplicação e ajusta o layout
document.addEventListener("DOMContentLoaded", initialize);
