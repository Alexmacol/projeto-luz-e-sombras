const express = require("express");
const path = require("path");
const fs = require("fs").promises;
const { GoogleGenerativeAI } = require("@google/generative-ai");
require("dotenv").config();

const app = express();
const port = process.env.PORT || 3000;

const DATA_FILE = path.join(__dirname, "data.json");

/**
 * Função utilitária para adicionar um atraso entre requisições (evita erro 429).
 * @param {number} ms Milissegundos para esperar.
 * @returns {Promise<void>}
 */
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Lê os dados locais de forma segura.
 */
async function getLocalData() {
  try {
    const data = await fs.readFile(DATA_FILE, "utf-8");
    const parsed = JSON.parse(data);
    if (!parsed.led_zeppelin) parsed.led_zeppelin = {};
    return parsed;
  } catch (error) {
    return { led_zeppelin: {} };
  }
}

/**
 * Salva os dados no arquivo JSON.
 */
async function saveLocalData(data) {
  await fs.writeFile(DATA_FILE, JSON.stringify(data, null, 2), "utf-8");
}

/**
 * Retorna uma resposta gerada pela API do Google Generative AI para um dado prompt.
 */
async function getGenerativeAIResponse(
  prompt,
  logContext,
  generationConfig = {},
) {
  try {
    const apiKey = process.env.GOOGLE_API_KEY;
    if (!apiKey) {
      console.warn(`Chave da API não encontrada para ${logContext}.`);
      return null;
    }

    // Usando Gemini 2.5 Flash para velocidade e compatibilidade (Versão 2026)
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      generationConfig: {
        temperature: 0.7, // Um bom padrão para criatividade controlada
        ...generationConfig, // Mescla configurações específicas, como maxOutputTokens
      },
    });

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const responseText = response.text();

    // Se o modo JSON estiver ativo, retorna o texto puro para ser processado pelo chamador.
    if (generationConfig.responseMimeType === "application/json") {
      return responseText;
    }
    // Para texto normal, substitui os asteriscos por tags <i> para itálico.
    return responseText.replace(/\*([^*]+)\*/g, "<i>$1</i>");
  } catch (error) {
    console.warn(
      `Falha ao gerar conteúdo para ${logContext}: ${error.message}`,
    );
    return null;
  }
}

/**
 * Verifica se o arquivo precisa ser atualizado (se é mais antigo que 24 horas ou não existe).
 * @param {string} filePath Caminho do arquivo.
 * @returns {Promise<boolean>} True se precisar atualizar.
 */
async function needsUpdate(filePath) {
  try {
    const stats = await fs.stat(filePath);
    const now = new Date();
    const lastModified = new Date(stats.mtime);
    const hoursSinceUpdate = Math.abs(now - lastModified) / 36e5; // 36e5 = milissegundos em 1 hora

    if (hoursSinceUpdate > 24) {
      console.log(
        `-> Dados expirados (${hoursSinceUpdate.toFixed(1)}h). Iniciando atualização...`,
      );
      return true;
    }

    // Verifica se os dados internos estão vazios (caso de arquivo criado manualmente)
    const jsonData = await getLocalData();
    const hasHistory =
      jsonData.led_zeppelin.historia &&
      jsonData.led_zeppelin.historia.length > 100;

    if (!hasHistory) {
      console.log(
        "-> Arquivo existe, mas dados parecem vazios/incompletos. Forçando atualização.",
      );
      return true;
    }

    console.log(
      `-> Dados recentes (${hoursSinceUpdate.toFixed(1)}h). Mantendo cache.`,
    );
    return false;
  } catch (error) {
    console.log("-> Arquivo de dados não encontrado. Criando novo.");
    return true;
  }
}

/**
 * Atualiza a história.
 * @param {boolean} force Se true, força a atualização mesmo que os dados existam.
 */
async function updateHistory(force = false) {
  try {
    const jsonData = await getLocalData();

    // Se NÃO for forçado E já tiver dados, pula
    if (
      !force &&
      jsonData.led_zeppelin.historia &&
      jsonData.led_zeppelin.historia.length > 100
    ) {
      return;
    }

    console.log("-> Gerando nova história com IA...");
    const prompt =
      "Aja como um especialista da história do rock n roll. Forneça um resumo bem escrito, sucinto e envolvente sobre a história da banda Led Zeppelin em no máximo 5 parágrafos, de no máximo 4 linhas, inclua datas importantes. Se houver menção a qualquer álbum ou música, coloque os títulos em itálico usando asteriscos (ex: *Led Zeppelin IV*). O texto deve conter apenas a informação solicitada, sem introduções. Use apenas acentos do português do Brasil. Não invente nada.";

    const newHistoryText = await getGenerativeAIResponse(prompt, "a história");

    if (newHistoryText) {
      jsonData.led_zeppelin.historia = newHistoryText;
      // Garante estrutura básica se não existir
      if (!jsonData.led_zeppelin.perfis) jsonData.led_zeppelin.perfis = {};
      if (!jsonData.led_zeppelin.shows) jsonData.led_zeppelin.shows = [];

      await saveLocalData(jsonData);
      console.log("✓ História atualizada.");
    }
  } catch (error) {
    console.error("Erro em updateHistory:", error.message);
  }
}

/**
 * Atualiza perfis.
 * @param {boolean} force Se true, força a atualização.
 */
async function updateProfiles(force = false) {
  try {
    const jsonData = await getLocalData();

    // Se NÃO for forçado E já tiver perfis completos, pula
    if (
      !force &&
      jsonData.led_zeppelin.perfis &&
      Object.keys(jsonData.led_zeppelin.perfis).length >= 4
    ) {
      return;
    }

    console.log("-> Iniciando atualização de perfis...");

    const members = [
      "Jimmy Page",
      "Robert Plant",
      "John Paul Jones",
      "John Bonham",
    ];
    // Começa com os dados existentes para não perder o que já foi baixado
    const profilesData = { ...(jsonData.led_zeppelin.perfis || {}) };
    let hasUpdates = false;

    for (const member of members) {
      // Se o perfil já existe e tem conteúdo, pula para economizar cota
      if (profilesData[member] && profilesData[member].length > 50) {
        console.log(`   Perfil de ${member} já existe. Pulando.`);
        continue;
      }

      console.log(`   Gerando perfil de ${member}...`);
      const prompt = `Aja como um especialista da história do rock n roll. Forneça uma biografia resumida de ${member}, membro do Led Zeppelin, em no máximo 5 parágrafos. Cada parágrafo deve conter no máximo 4 linhas. Inclua datas importantes, destaque e explique o símbolo dele e estilos e características técnicas. Se houver menção a qualquer álbum ou música, coloque os títulos em itálico usando asteriscos (ex: *Stairway to Heaven*). Não inclua introduções. Use apenas acentos do português do Brasil. Não invente nada.`;

      const text = await getGenerativeAIResponse(prompt, `perfil de ${member}`);
      if (text) {
        profilesData[member] = text;
        hasUpdates = true;
      }
      await delay(10000); // Espera 10s entre cada perfil para garantir a cota
    }

    if (hasUpdates) {
      const currentJson = await getLocalData();
      currentJson.led_zeppelin.perfis = profilesData;
      await saveLocalData(currentJson);
      console.log("✓ Perfis atualizados.");
    }
  } catch (error) {
    console.error("Erro em updateProfiles:", error.message);
  }
}

/**
 * Atualiza shows.
 * @param {boolean} force Se true, força a atualização.
 */
async function updateShows(force = false) {
  try {
    const jsonData = await getLocalData();

    if (
      !force &&
      jsonData.led_zeppelin.shows &&
      jsonData.led_zeppelin.shows.length > 0
    ) {
      return;
    }

    console.log("-> Gerando lista de shows com IA...");
    const prompt = `Atue como um historiador do rock e curador musical. Sua tarefa é selecionar os 10 shows mais relevantes e icônicos da carreira do Led Zeppelin. Esta seleção deve obrigatoriamente incluir o primeiro show oficial da banda e o show de reunião 'Celebration Day' de 2007. Os outros 8 shows devem ser escolhidos com base em sua importância histórica, impacto cultural, performances lendárias ou por representarem pontos de virada na carreira da banda. A lista final com os 10 shows deve ser apresentada em estrita ordem cronológica. Retorne APENAS um ARRAY JSON estritamente válido com campos: data (dd/mm/aaaa), local, contexto, setlist (array). Se houver menção a qualquer álbum ou música dentro dos valores de string, coloque os títulos em itálico usando asteriscos (ex: *The Song Remains The Same*). Não inclua texto explicativo fora do JSON. Use apenas acentos do português do Brasil. Não invente nada.`;

    // Passa a configuração de limite de tokens apenas para esta chamada específica
    const responseText = await getGenerativeAIResponse(prompt, "shows", {
      maxOutputTokens: 8192,
      responseMimeType: "application/json",
    });

    if (responseText) {
      // Com o JSON Mode, a resposta é um JSON string limpo.
      // 1. Parseamos o JSON para um objeto JavaScript.
      const shows = JSON.parse(responseText);

      // 2. Iteramos no objeto para substituir os asteriscos por tags <i>,
      // mantendo a consistência com o resto dos dados da aplicação.
      shows.forEach((show) => {
        if (show.contexto) {
          show.contexto = show.contexto.replace(/\*([^*]+)\*/g, "<i>$1</i>");
        }
        if (show.setlist && Array.isArray(show.setlist)) {
          show.setlist = show.setlist.map((song) =>
            song.replace(/\*([^*]+)\*/g, "<i>$1</i>"),
          );
        }
      });

      const currentJson = await getLocalData();
      currentJson.led_zeppelin.shows = shows;
      await saveLocalData(currentJson);
      console.log("✓ Shows atualizados.");
    }
  } catch (error) {
    console.error("Erro em updateShows:", error.message);
  }
}

/**
 * Função central para rodar a sequência de updates.
 */
async function runUpdates() {
  console.log("--- Verificando validade dos dados (Cache 24h) ---");

  // Decide AGORA se precisa atualizar tudo, antes de mexer no arquivo
  const shouldUpdate = await needsUpdate(DATA_FILE);

  // Passa essa decisão para todas as funções
  await updateHistory(shouldUpdate);
  await delay(5000); // Espera 5s antes de começar os perfis
  await updateProfiles(shouldUpdate);
  await delay(5000); // Espera 5s antes de começar os shows
  await updateShows(shouldUpdate);

  console.log("--- Verificação concluída ---");
}

/**
 * Inicia o servidor.
 */
async function startServer() {
  console.log("Iniciando servidor...");

  // Roda imediatamente ao iniciar
  await runUpdates();

  // Agenda verificação a cada 1 hora
  setInterval(
    async () => {
      console.log("Executando verificação agendada...");
      await runUpdates();
    },
    1000 * 60 * 60,
  ); // 1 hora

  // Middleware de segurança para bloquear acesso a arquivos sensíveis
  app.use((req, res, next) => {
    const forbidden = [".env", "server.js", "package.json", "README.md"];
    if (forbidden.some((file) => req.path.includes(file))) {
      return res.status(403).send("Acesso negado.");
    }
    next();
  });

  app.use(express.static(path.join(__dirname)));
  app.listen(port, () => {
    console.log(`Servidor rodando em http://localhost:${port}`);
  });
}

startServer();
