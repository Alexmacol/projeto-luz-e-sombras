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
  Atue como um historiador do rock clássico especialista em Led Zeppelin. Identifique os 10 shows mais icônicos, influentes e historicamente relevantes da banda Led Zeppelin. Desde o início de sua carreira em 1968 até suas últimas apresentações.

Para cada show, forneça as informações estritamente no formato JSON, seguindo esta estrutura de campos:

data: A data do evento no formato dd/mm/aaaa.

local: O nome do local (arena, estádio ou festival) seguido da cidade e país.

contexto: detalhe por que este show é importante, incluindo curiosidades, marcos na carreira da banda ou impacto cultural. Use no máximo 2 parágrados de 4 linhas cada.

setlist: Um array de strings contendo as músicas tocadas no show (ou as principais, caso o setlist seja muito extenso).

Requisitos:

Retorne apenas o objeto JSON (uma lista de objetos).

Não inclua introduções, explicações ou textos fora do JSON.

Certifique-se de incluir eventos fundamentais como o Royal Albert Hall (1970), Madison Square Garden (1973), Earls Court (1975), Knebworth (1979) e o Celebration Day (2007).

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
