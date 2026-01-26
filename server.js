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
 * Retorna uma resposta gerada pela API do Google Generative AI para um dado prompt.
 */
async function getGenerativeAIResponse(prompt, logContext) {
  try {
    const apiKey = process.env.GOOGLE_API_KEY;
    if (!apiKey) {
      console.warn(`Chave da API não encontrada para ${logContext}.`);
      return null;
    }

    // Usando Gemini 2.5 Flash para velocidade e compatibilidade (Versão 2026)
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text().replace(/\*/g, ""); // Remove asteriscos
  } catch (error) {
    console.warn(`Falha ao gerar conteúdo para ${logContext}: ${error.message}`);
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
      console.log(`-> Dados expirados (${hoursSinceUpdate.toFixed(1)}h). Iniciando atualização...`);
      return true;
    }
    
    // Verifica se os dados internos estão vazios (caso de arquivo criado manualmente)
    const fileContent = await fs.readFile(filePath, "utf-8");
    const jsonData = JSON.parse(fileContent);
    const hasHistory = jsonData.led_zeppelin.historia && jsonData.led_zeppelin.historia.length > 100;
    
    if (!hasHistory) {
      console.log("-> Arquivo existe, mas dados parecem vazios/incompletos. Forçando atualização.");
      return true;
    }

    console.log(`-> Dados recentes (${hoursSinceUpdate.toFixed(1)}h). Mantendo cache.`);
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
    let jsonData = { led_zeppelin: {} };
    try {
      const existing = await fs.readFile(DATA_FILE, "utf-8");
      jsonData = JSON.parse(existing);
    } catch (e) { /* arquivo novo */ }

    // Se NÃO for forçado E já tiver dados, pula
    if (!force && jsonData.led_zeppelin.historia && jsonData.led_zeppelin.historia.length > 100) {
      return;
    }

    console.log("-> Gerando nova história com IA...");
    const prompt = "Aja como um especialista da história do rock n roll. Forneça um resumo bem escrito, sucinto e envolvente sobre a história da banda Led Zeppelin em no máximo 5 parágrafos, de no máximo 4 linhas, inclua datas importantes e se houver menção a qualquer álbum ou música coloque os títulos itálico. O texto deve conter apenas a informação solicitada, não inclua na resposta nada do tipo 'Claro, aqui está um resumo...'. Evite o uso de markdown ou caracteres especiais como asteriscos; apenas acentos ortográficos pertinentes ao português do Brasil devem estar presentes. Não invente nada.";

    const newHistoryText = await getGenerativeAIResponse(prompt, "a história");

    if (newHistoryText) {
      jsonData.led_zeppelin.historia = newHistoryText;
      // Garante estrutura básica se não existir
      if (!jsonData.led_zeppelin.perfis) jsonData.led_zeppelin.perfis = {};
      if (!jsonData.led_zeppelin.shows) jsonData.led_zeppelin.shows = [];
      
      await fs.writeFile(DATA_FILE, JSON.stringify(jsonData, null, 2), "utf-8");
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
    const fileContent = await fs.readFile(DATA_FILE, "utf-8");
    const jsonData = JSON.parse(fileContent);

    // Se NÃO for forçado E já tiver perfis completos, pula
    if (!force && jsonData.led_zeppelin.perfis && Object.keys(jsonData.led_zeppelin.perfis).length >= 4) {
      return; 
    }
    
    console.log("-> Iniciando atualização de perfis...");

    const members = ["Jimmy Page", "Robert Plant", "John Paul Jones", "John Bonham"];
    const profilesData = {};

    for (const member of members) {
      console.log(`   Gerando perfil de ${member}...`);
      const prompt = `Aja como um especialista da história do rock n roll. Forneça uma biografia resumida de ${member}, membro do Led Zeppelin, em no máximo 5 parágrafos. Cada parágrafo deve conter no máximo 4 linhas. Inclua datas importantes, destaque e explique o símbolo dele e estilos e características técnicas. Se houver menção a qualquer álbum ou música coloque os títulos itálico. Não inclua na resposta nada do tipo 'Claro, aqui está a biografia...'. Evite o uso de markdown ou caracteres especiais como asteriscos; apenas acentos ortográficos pertinentes ao português do Brasil devem estar presentes. Não invente nada.`;

      const text = await getGenerativeAIResponse(prompt, `perfil de ${member}`);
      if (text) profilesData[member] = text;
      await delay(2000); 
    }

    if (Object.keys(profilesData).length > 0) {
      const currentFile = await fs.readFile(DATA_FILE, "utf-8");
      const currentJson = JSON.parse(currentFile);
      currentJson.led_zeppelin.perfis = profilesData;
      await fs.writeFile(DATA_FILE, JSON.stringify(currentJson, null, 2), "utf-8");
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
    const fileContent = await fs.readFile(DATA_FILE, "utf-8");
    const jsonData = JSON.parse(fileContent);

    if (!force && jsonData.led_zeppelin.shows && jsonData.led_zeppelin.shows.length > 0) {
      return;
    }

    console.log("-> Gerando lista de shows com IA...");
    const prompt = `Atue como um historiador do rock. Identifique os 10 shows mais icônicos do Led Zeppelin. Retorne APENAS um ARRAY JSON com campos: data (dd/mm/aaaa), local, contexto, setlist (array). Se houver menção a qualquer álbum ou música coloque os títulos itálico. Evite o uso de markdown ou caracteres especiais como asteriscos; apenas acentos ortográficos pertinentes ao português do Brasil devem estar presentes. Não invente nada.`;

    const responseText = await getGenerativeAIResponse(prompt, "shows");

    if (responseText) {
      const cleanedText = responseText.replace(/```json|```/g, "").trim();
      const currentFile = await fs.readFile(DATA_FILE, "utf-8");
      const currentJson = JSON.parse(currentFile);
      currentJson.led_zeppelin.shows = JSON.parse(cleanedText);
      await fs.writeFile(DATA_FILE, JSON.stringify(currentJson, null, 2), "utf-8");
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
  await delay(1000);
  await updateProfiles(shouldUpdate);
  await delay(1000);
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
  setInterval(async () => {
    console.log("Executando verificação agendada...");
    await runUpdates();
  }, 1000 * 60 * 60); // 1 hora

  app.use(express.static(path.join(__dirname)));
  app.listen(port, () => {
    console.log(`Servidor rodando em http://localhost:${port}`);
  });
}

startServer();
