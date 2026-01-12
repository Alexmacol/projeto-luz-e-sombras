# Projeto Luz e Sombra (Led Zeppelin Tribute)

## Visão Geral
Este projeto é um website tributo à banda Led Zeppelin, intitulado "Light and Shade". O site é estruturado como uma *Single Page Application* (SPA) estática, apresentando seções de História, Perfis dos Membros, Discografia e uma Linha do Tempo.

## Arquitetura e Tecnologias

### Front-end
- **HTML5:** Utiliza tags semânticas (`<header>`, `<main>`, `<section>`, `<article>`) para estruturar o conteúdo.
- **CSS3:** 
  - **Variáveis CSS (`:root`):** Gerenciamento centralizado de cores (temas dourado/escuro) e tipografia.
  - **Organização:** 
    - `src/css/style.css`: Estilos base, reset, tipografia e componentes visuais.
    - `src/css/responsive.css`: *Media queries* para adaptação em telas maiores (tablets e desktops), seguindo uma abordagem *mobile-first* implícita.
  - **Fontes:** Integração com Google Fonts (Cinzel, Lora, Quicksand, Young Serif).
- **JavaScript (ES Modules):**
  - O projeto está configurado para usar módulos ES (`<script type="module" src="src/js/main.js">`).
  - *Nota:* O arquivo `src/js/main.js` é referenciado no HTML mas não foi encontrado na árvore de arquivos atual. A lógica de preenchimento dinâmico (cards de história, discografia) deve residir lá.

## Estrutura de Diretórios

```text
C:\Users\alexm\projetos\projeto-luzesombra\
├── index.html              # Ponto de entrada da aplicação
└── src\
    ├── css\
    │   ├── style.css       # Estilos globais e componentes
    │   └── responsive.css  # Ajustes de layout para telas >768px e >1024px
    └── images\             # Assets gráficos (SVGs dos símbolos, WebP)
```

## Como Executar

Por ser um projeto estático que utiliza Módulos ES (`type="module"`), abrir o arquivo `index.html` diretamente pelo sistema de arquivos pode causar erros de CORS (Cross-Origin Resource Sharing) no carregamento do JavaScript.

**Método Recomendado:**
Utilize um servidor HTTP local. Exemplos:

1.  **VS Code Live Server:** Clique em "Go Live" se tiver a extensão instalada.
2.  **Node.js (npx):**
    ```bash
    npx serve .
    ```
3.  **Python:**
    ```bash
    python -m http.server
    ```

Acesse `http://localhost:8000` (ou a porta indicada).

## Convenções de Código Observadas

- **CSS:**
  - Uso de classes utilitárias (ex: `.container`, `.transition`, `.sr-only`).
  - Design Responsivo focado em breakpoints de `768px` e `1024px`.
  - Estilização de scroll suave (`scroll-behavior: smooth`) no HTML.
- **HTML:**
  - IDs específicos (`#history`, `#profiles`, `#discography`) usados para navegação interna (âncoras).
  - Placeholders de conteúdo dinâmico identificados por comentários (ex: `<!-- cards adicionados dinamicamente -->`).
