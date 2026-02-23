# Pântano Analytics — Calculadora Oficial de Crocodilagem

Projeto front-end simples que permite aos membros da família avaliar seu nível de "crocodilagem" (falsidade estratégica) através de um quiz. Resultados são salvos localmente e exibidos em um ranking.

Estrutura:
- `index.html` — página principal (entrada, quiz, resultado, ranking)
- `css/style.css` — estilos (Mobile-First, variáveis em `:root`, BEM)
- `js/script.js` — lógica do quiz, cálculo e armazenamento em `localStorage`
- `assets/logo.png` — imagem/logo do projeto

Decisões técnicas:
- Mobile-First e semântica HTML5 (`main`, `header`, `section`, `fieldset`)
- Acessibilidade: `label` para inputs, `aria-live` para feedback de resultado, `role=progressbar` e `aria-*` em elementos importantes
- Armazenamento: `localStorage` com chave `pantano_ranking_v1` para persistência local do ranking
- Preparado para futura integração com API (no arquivo `js/script.js` há ponto único para substituição)

Como testar:
1. Abrir `index.html` no navegador.
2. Digitar um nome e iniciar o quiz.
3. Responder as perguntas e enviar; confirme a atualização caso o nome já exista.
