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
  mainContent.innerHTML = `
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
  await renderInitialPageContent();
  setupSearchHandlers();
  setupNavigationHandlers(); // Inicializa os handlers de navegação inteligentes
  setupMobileMenu();
  setupCloseSearchListener(); // Configura o listener para o botão de fechar
  setupHeaderObserver(); // Inicia o monitoramento do tamanho do header
}

// Inicia a aplicação e ajusta o layout
document.addEventListener("DOMContentLoaded", initialize);
