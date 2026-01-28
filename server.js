const express = require("express");
const path = require("path");
const fs = require("fs").promises;
const { GoogleGenerativeAI } = require("@google/generative-ai");
require("dotenv").config();

const app = express();
const port = process.env.PORT || 3000;

// --- INFRAESTRUTURA (Vercel & Cache) ---
const READ_ONLY_FILE = path.join(__dirname, "data.json");
const WRITEABLE_FILE = path.join("/tmp", "data.json");

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function getLocalData() {
  try {
    const data = await fs.readFile(WRITEABLE_FILE, "utf-8");
    return JSON.parse(data);
  } catch (error) {
    try {
      const backupData = await fs.readFile(READ_ONLY_FILE, "utf-8");
      return JSON.parse(backupData);
    } catch (backupError) {
      return { led_zeppelin: { historia: "", perfis: {}, shows: [] } };
    }
  }
}

async function saveLocalData(data) {
  try {
    await fs.mkdir(path.dirname(WRITEABLE_FILE), { recursive: true });
    await fs.writeFile(WRITEABLE_FILE, JSON.stringify(data, null, 2), "utf-8");
  } catch (error) {
    console.error("Erro ao salvar cache:", error.message);
  }
}

async function getGenerativeAIResponse(prompt, logContext, generationConfig = {}) {
  try {
    const apiKey = process.env.GOOGLE_API_KEY;
    if (!apiKey) return null;

    let attempt = 0;
    const maxRetries = 3;

    while (attempt <= maxRetries) {
      try {
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({
          model: "gemini-2.5-flash",
          generationConfig: { temperature: 0.7, ...generationConfig },
        });

        const result = await model.generateContent(prompt);
        const response = await result.response;
        let responseText = response.text();

        if (generationConfig.responseMimeType === "application/json") {
          responseText = responseText.replace(/^```json\s*|\s*```$/g, "").trim();
          const start = responseText.search(/\[|\{/);
          if (start > 0) responseText = responseText.substring(start);
          return responseText;
        }

        return responseText.replace(/\*([^*]+)\*/g, "<i>$1</i>");
      } catch (error) {
        if (error.message.includes("429") || error.message.includes("Quota")) {
          attempt++;
          await delay(30000 * attempt);
          continue;
        }
        return null;
      }
    }
    return null;
  } catch (error) {
    return null;
  }
}

// --- ATUALIZAÇÕES (Prompts Originais) ---

async function updateHistory(force = false) {
  const jsonData = await getLocalData();
  if (!force && jsonData.led_zeppelin?.historia?.length > 100) return;

  const prompt = "Aja como um especialista da história do rock n roll. Forneça um resumo bem escrito, sucinto e envolvente sobre a história da banda Led Zeppelin em no máximo 5 parágrafos, de no máximo 4 linhas, inclua datas importantes. Se houver menção a qualquer álbum ou música, coloque os títulos em itálico usando asteriscos (ex: *Led Zeppelin IV*). O texto deve conter apenas a informação solicitada, sem introduções. Use apenas acentos do português do Brasil. Não invente nada.";
  const text = await getGenerativeAIResponse(prompt, "história");
  if (text) {
    jsonData.led_zeppelin.historia = text;
    await saveLocalData(jsonData);
  }
}

async function updateProfiles(force = false) {
  const jsonData = await getLocalData();
  const profiles = jsonData.led_zeppelin?.perfis || {};
  const members = ["Jimmy Page", "Robert Plant", "John Paul Jones", "John Bonham"];
  let hasUpdates = false;

  for (const member of members) {
    if (!profiles[member] || profiles[member].length < 50 || force) {
      const prompt = `Aja como um especialista da história do rock n roll. Forneça uma biografia resumida de ${member}, membro do Led Zeppelin, em no máximo 5 parágrafos. Cada parágrafo deve conter no máximo 4 linhas. Inclua datas importantes, destaque e explique o símbolo dele e estilos e características técnicas. Se houver menção a qualquer álbum ou música, coloque os títulos em itálico usando asteriscos (ex: *Stairway to Heaven*). Não inclua introduções. Use apenas acentos do português do Brasil. Não invente nada.`;
      const text = await getGenerativeAIResponse(prompt, member);
      if (text) {
        profiles[member] = text;
        hasUpdates = true;
        await delay(8000);
      }
    }
  }
  if (hasUpdates) {
    jsonData.led_zeppelin.perfis = profiles;
    await saveLocalData(jsonData);
  }
}

async function updateShows(force = false) {
  const jsonData = await getLocalData();
  if (!force && jsonData.led_zeppelin?.shows?.length > 0) return;

  const prompt = `Atue como um historiador do rock e curador musical. Sua tarefa é selecionar os 10 shows mais relevantes e icônicos da carreira do Led Zeppelin. Esta seleção deve obrigatoriamente incluir o primeiro show oficial da banda e o show de reunião 'Celebration Day' de 2007. Os outros 8 shows devem ser escolhidos com base em sua importância histórica, impacto cultural, performances lendárias ou por representarem pontos de virada na carreira da banda. A lista final com os 10 shows deve ser apresentada em estrita ordem cronológica. Retorne APENAS um ARRAY JSON estritamente válido com campos: data (dd/mm/aaaa), local, contexto, setlist (array). Se houver menção a qualquer álbum ou música dentro dos valores de string, coloque os títulos em itálico usando asteriscos (ex: *The Song Remains The Same*). Não inclua texto explicativo fora do JSON. Use apenas acentos do português do Brasil. Não invente nada.`;
  const res = await getGenerativeAIResponse(prompt, "shows", { responseMimeType: "application/json" });
  if (res) {
    let list = JSON.parse(res);
    list = Array.isArray(list) ? list : list.shows;
    jsonData.led_zeppelin.shows = list.map(s => ({
      ...s,
      contexto: s.contexto.replace(/\*([^*]+)\*/g, "<i>$1</i>"),
      setlist: s.setlist ? s.setlist.map(song => song.replace(/\*([^*]+)\*/g, "<i>$1</i>")) : []
    }));
    await saveLocalData(jsonData);
  }
}

async function runUpdates() {
  const jsonData = await getLocalData();
  // Só gera se os campos principais estiverem ausentes
  const estaVazio = !jsonData.led_zeppelin?.historia || Object.keys(jsonData.led_zeppelin?.perfis || {}).length === 0;
  
  if (estaVazio) {
    await updateHistory(false);
    await updateProfiles(false);
    await updateShows(false);
  }
}

// --- SERVIDOR ---

app.use((req, res, next) => {
  if ([".env", "server.js", "package.json"].some(f => req.path.includes(f))) return res.status(403).send("Acesso negado.");
  next();
});

app.get("/api/data", async (req, res) => {
  res.json(await getLocalData());
});

app.use(express.static(path.join(__dirname)));

app.listen(port, () => {
  console.log(`Servidor de produção rodando na porta ${port}`);
  runUpdates().catch(console.error);
});