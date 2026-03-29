// src/js/api.js

/**
 * Busca a história da banda no servidor backend.
 * @returns {Promise<string>} O texto da história.
 */
export async function fetchHistory() {
  const data = await fetchLocalData(); // O resultado do fetchLocalData retorna o objeto led_zeppelin
  return data.historia; // Acessa a propriedade historia do objeto led_zeppelin
}

/**
 * Busca os dados dos álbuns do arquivo JSON local.
 * @returns {Promise<Array>} Uma matriz de objetos de álbuns.
 */
export async function fetchLocalData() {
  try {
    const response = await fetch("data.json");
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const jsonData = await response.json();
    return jsonData.led_zeppelin; // Retorna o objeto principal led_zeppelin
  } catch (error) {
    console.error("Erro ao carregar dados locais:", error);
    return null; // Retorna nulo em caso de erro
  }
}
