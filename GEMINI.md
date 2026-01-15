# Projeto Luz e Sombra (Led Zeppelin Tribute)

## Visão Geral

Este projeto é um website tributo à banda Led Zeppelin, intitulado "Light and Shade". O site é estruturado como uma _Single Page Application_ (SPA) servida por um backend Node.js. O sistema integra a API do Google Gemini para enriquecer e atualizar dinamicamente o conteúdo textual (história e perfis) no arquivo de dados JSON quando a aplicação é iniciada.

## Arquitetura e Tecnologias

### Back-end

- **Runtime:** Node.js.
- **Servidor Web:** Express (`express`) para servir os arquivos estáticos da SPA.
- **Inteligência Artificial:** Integração com Google Generative AI (`@google/generative-ai`) para geração de conteúdo.
- **Configuração:** Uso de variáveis de ambiente (`dotenv`) para gerenciamento seguro de credenciais.

### Front-end

- **HTML5:** Utiliza tags semânticas (`<header>`, `<main>`, `<section>`, `<article>`) para estruturar o conteúdo.
- **CSS3:**
  - **Variáveis CSS (`:root`):** Gerenciamento centralizado de cores (temas dourado/escuro) e tipografia.
  - **Organização:**
    - `src/css/style.css`: Estilos base, reset, tipografia e componentes visuais.
    - `src/css/responsive.css`: _Media queries_ para adaptação em telas maiores (tablets e desktops), seguindo uma abordagem _mobile-first_ implícita.
  - **Fontes:** Integração com Google Fonts (Cinzel, Lora, Quicksand, Young Serif).
- **JavaScript (ES Modules):**
  - **Dados:** O conteúdo textual (história, perfis, discografia, músicas destaque, shows) é carregado a partir de um arquivo `data.json`.
  - O projeto está configurado para usar módulos ES (`<script type="module" src="src/js/main.js">`).
  - **Modularização:**
    - `main.js`: Controlador principal, inicialização e gestão de eventos globais.
    - `api.js`: Camada de serviço para abstração da busca de dados.
    - `ui.js`: Responsável pela manipulação do DOM e renderização (View).
    - `timeline.js`: Lógica específica para a interatividade da linha do tempo circular.
    - `search.js`: Implementação da funcionalidade de busca e filtro.
    - `animations.js`: Gerenciamento de animações de entrada via Intersection Observer.

## Estrutura de Diretórios

```text
C:\Users\alexm\projetos\projeto-luzesombra\
├── .env                    # Arquivo de configuração de variáveis de ambiente (excluído do git)
├── data.json               # Base de dados (história, perfis, discografia, timeline, músicas, shows)
├── index.html              # Ponto de entrada da aplicação
├── package.json            # Definição de dependências e scripts do projeto
├── package-lock.json       # Árvore de dependências travada
├── server.js               # Script do servidor e lógica de atualização via IA
└── src\
    ├── css\
    │   ├── style.css       # Estilos globais e componentes
    │   └── responsive.css  # Ajustes de layout para telas maiores
    ├── js\
    │   ├── main.js
    │   ├── api.js
    │   ├── ui.js
    │   ├── timeline.js
    │   ├── search.js
    │   └── animations.js
    └── images\             # Assets gráficos (SVGs dos símbolos, WebP)
```

## Como Executar

O projeto requer Node.js para gerenciar dependências e executar o servidor de aplicação.

1.  **Instale as dependências:**

    ```bash
    npm install
    ```

2.  **Configure a API Key:**
    Crie um arquivo `.env` na raiz do projeto e adicione sua chave do Google Gemini:

    ```env
    GOOGLE_API_KEY="SUA_CHAVE_AQUI"
    ```

3.  **Inicie o servidor:**

    ```bash
    node server.js
    ```

4.  **Acesse a aplicação:**
    Abra o navegador em `http://localhost:3000`.

## Convenções de Código Observadas

- **CSS:**
  - Uso de classes utilitárias (ex: `.container`, `.transition`, `.sr-only`).
  - Design Responsivo focado em breakpoints de `768px` e `1024px`.
  - Estilização de scroll suave (`scroll-behavior: smooth`) no HTML.
- **HTML:**
  - IDs específicos (`#history`, `#profiles`, `#discography`) usados para navegação interna (âncoras).
  - Placeholders de conteúdo dinâmico identificados por comentários (ex: `<!-- cards adicionados dinamicamente -->`).
