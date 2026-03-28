import express from "express";
import fs from "fs/promises";
import path from "path";

const app = express();
const PORT = process.env.PORT || 3000;

// Serve arquivos estáticos (css, js, imagens)
app.use(express.static(path.resolve("./")));

/**
 * Função para carregar os dados locais
 */
async function getLocalData() {
  const data = await fs.readFile("data.json", "utf-8");
  const jsonData = JSON.parse(data);
  return jsonData.led_zeppelin;
}

/**
 * SSR - História
 */
function generateHistorySSR(historyText) {
  return `
    <article class="card">
      <p>${historyText.replace(/\n/g, "<br>")}</p>
    </article>
  `;
}

/**
 * SSR - Perfis
 */
function generateProfilesSSR(profilesData) {
  const membersOrder = [
    "Jimmy Page",
    "John Paul Jones",
    "John Bonham",
    "Robert Plant",
  ];

  const displayNames = {
    "John Bonham": "John 'Bonzo' Bonham",
  };

  return membersOrder
    .map((memberName) => {
      const profileText = profilesData[memberName];
      if (!profileText) return "";

      const displayName = displayNames[memberName] || memberName;
      const symbolFilename = memberName.toLowerCase().replace(/\s+/g, "-");

      return `
        <div class="accordion-item profile-item">
          <button class="accordion-header profile-header" aria-expanded="false">
            <img src="src/images/${symbolFilename}.svg" alt="Símbolo de ${memberName}" class="profile-header-symbol">
            <span class="accordion-name profile-name">${displayName}</span>
            <span class="accordion-toggle-btn profile-toggle-btn">+</span>
          </button>
          <div class="accordion-content">
            <div class="profile-content-inner">
              ${profileText.replace(/\n/g, "<br>")}
            </div>
          </div>
        </div>
      `;
    })
    .join("");
}

/**
 * SSR - Discografia
 */
function generateDiscographySSR(data) {
  return data
    .map((album) => {
      const albumId = album.album.replace(/[^a-zA-Z0-9]/g, "-");

      return `
        <div class="accordion-item album-item">
          <button class="accordion-header album-header" aria-expanded="false">
            <span class="accordion-name album-name">${album.album}</span>
            <span class="accordion-toggle-btn album-toggle-btn">+</span>
          </button>
          <div class="accordion-content">
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
        </div>
      `;
    })
    .join("");
}

/**
 * Rota principal
 */
app.get("/", async (req, res) => {
  try {
    let html = await fs.readFile("index.html", "utf-8");
    const data = await getLocalData();

    //  SSR conteúdo
    html = html.replace(
      "<!-- SSR_HISTORY -->",
      generateHistorySSR(data.historia)
    );

    html = html.replace(
      "<!-- SSR_PROFILES -->",
      generateProfilesSSR(data.perfis)
    );

    html = html.replace(
      "<!-- SSR_DISCOGRAPHY -->",
      generateDiscographySSR(data.discografia)
    );

    // INJEÇÃO GLOBAL DOS DADOS (ESSENCIAL PARA PERFORMANCE)
    html = html.replace(
      "</head>",
      `<script>window.__DATA__ = ${JSON.stringify(data)};</script></head>`
    );

    res.send(html);
  } catch (error) {
    console.error("Erro no servidor:", error);
    res.status(500).send("Erro interno do servidor");
  }
});

app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});