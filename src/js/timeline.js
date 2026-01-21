import { fetchLocalData } from "./api.js"; // Importar para buscar os dados
import { renderTimelineMobile } from "./ui.js";

export async function setupTimeline() {
  const points = document.querySelectorAll(".timeline-point");
  const center = document.getElementById("timelineCenter");
  const container = document.querySelector(".timeline-container");

  // Cria container móvel se não existir
  let mobileContainer = container.querySelector(".timeline-mobile-view");
  if (!mobileContainer) {
    mobileContainer = document.createElement("div");
    mobileContainer.className = "timeline-mobile-view";
    container.appendChild(mobileContainer);
  }

  // Fetch timeline data from data.json
  const data = await fetchLocalData();
  const timelineData = data.timeline; // Corrected access

  // Renderiza a versão mobile
  if (timelineData) {
    renderTimelineMobile(mobileContainer, timelineData);
  }

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
        center.innerHTML = `
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

