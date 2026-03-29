// src/js/api.js

/**
 * Busca a história da banda no servidor backend.
 * @returns {Promise<string>} O texto da história.
 */
export async function fetchHistory() {
  const data = await fetchLocalData();
  return data?.historia || "";
}

/**
 * Busca os dados dos álbuns do arquivo JSON local OU usa dados já injetados pelo SSR.
 * @returns {Promise<Object>} Objeto led_zeppelin
 */
export async function fetchLocalData() {
  try {
    // ✅ PRIORIDADE: usar dados já injetados pelo servidor (SSR)
    if (window.__DATA__) {
      return window.__DATA__;
    }

    // 🔁 fallback: buscar via fetch (caso não exista SSR)
    const response = await fetch("/data.json");

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const jsonData = await response.json();
    return jsonData.led_zeppelin;

  } catch (error) {
    console.error("Erro ao carregar dados locais:", error);
    return null;
  }
}