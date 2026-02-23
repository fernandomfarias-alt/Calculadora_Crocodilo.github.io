/* js/script.js — Lógica para Pântano Analytics
   Responsável por: entrada do nome, fluxo do quiz, cálculo de pontuação,
   armazenamento em localStorage, gerenciamento do ranking e acessibilidade.
*/

const STORAGE_KEY = 'pantano_ranking_v1';

document.addEventListener('DOMContentLoaded', () => {
  // Elementos principais
  const entryForm = document.getElementById('entryForm');
  const playerNameInput = document.getElementById('playerName');
  const startBtn = document.getElementById('startBtn');
  const viewRankingBtn = document.getElementById('viewRankingBtn');

  const quizSection = document.getElementById('quizSection');
  const quizForm = document.getElementById('quizForm');
  const quizReset = document.getElementById('quizReset');
  const showRankingBtn = document.getElementById('showRankingBtn');

  const resultSection = document.getElementById('resultSection');
  const resultName = document.getElementById('resultName');
  const resultLabel = document.getElementById('resultLabel');
  const progressBar = document.getElementById('progressBar');
  const progressPercent = document.getElementById('progressPercent');
  const resultText = document.getElementById('resultText');
  const redoBtn = document.getElementById('redoBtn');
  const viewRankingAfterBtn = document.getElementById('viewRankingAfterBtn');

  const rankingSection = document.getElementById('rankingSection');
  const rankingList = document.getElementById('rankingList');
  const closeRankingBtn = document.getElementById('closeRankingBtn');

  let currentPlayer = null;

  // Eventos iniciales
  entryForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = playerNameInput.value.trim();
    if (!name) {
      playerNameInput.focus();
      return;
    }
    currentPlayer = name;
    showQuiz();
  });

  viewRankingBtn.addEventListener('click', () => showRanking());

  quizForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const answers = collectAnswers(quizForm);
    const score = calculateScore(answers);
    const max = computeMaxScore(quizForm);
    const percent = Math.round((score / max) * 100);
    const classification = classifyPercent(percent);
    displayResult(currentPlayer, percent, classification);
    // salvar e atualizar ranking
    saveOrUpdateResult(currentPlayer, percent);
  });

  quizReset.addEventListener('click', () => resetQuiz());
  showRankingBtn.addEventListener('click', () => showRanking());
  redoBtn.addEventListener('click', () => resetToEntry());
  viewRankingAfterBtn.addEventListener('click', () => showRanking());
  closeRankingBtn.addEventListener('click', () => closeRanking());

  // Funções
  function showQuiz() {
    document.getElementById('entryForm').hidden = true;
    quizSection.hidden = false;
    quizSection.removeAttribute('aria-hidden');
    quizForm.querySelector('input[type="radio"]')?.focus();
  }

  function collectAnswers(form) {
    const data = {};
    const radios = form.querySelectorAll('input[type="radio"]');
    const names = Array.from(new Set(Array.from(radios).map(r => r.name)));
    names.forEach(name => {
      const sel = form.querySelector(`input[name="${name}"]:checked`);
      data[name] = sel ? Number(sel.value) : 0;
    });
    return data;
  }

  function calculateScore(answers) {
    return Object.values(answers).reduce((a,b) => a + b, 0);
  }

  function computeMaxScore(form) {
    const fieldsets = form.querySelectorAll('fieldset.quiz__question');
    let max = 0;
    fieldsets.forEach(fs => {
      const values = Array.from(fs.querySelectorAll('input[type="radio"]')).map(i => Number(i.value) || 0);
      max += Math.max(...values);
    });
    return max || 1;
  }

  function classifyPercent(p) {
    if (p >= 85) return { label: 'Imperador do Pântano', text: 'Cuidado: suas estratégias são lendárias.' };
    if (p >= 60) return { label: 'Raiz do Pântano', text: 'Você domina as artes sutis do crocodilo.' };
    if (p >= 30) return { label: 'Social', text: 'Você sabe navegar bem, mas com moderação.' };
    return { label: 'Iniciante', text: 'Ainda aprendendo a abrir o sorriso certo.' };
  }

  function displayResult(name, percent, classification) {
    quizSection.hidden = true;
    resultSection.hidden = false;
    resultSection.removeAttribute('aria-hidden');
    resultName.textContent = name;
    resultLabel.textContent = classification.label;
    resultText.textContent = classification.text;
    animateProgress(percent);
    // destacar botão refazer
    redoBtn.focus();
  }

  function animateProgress(percent) {
    progressBar.style.width = '0%';
    progressBar.setAttribute('aria-valuenow', '0');
    progressPercent.textContent = '0%';
    // permitir pintura antes de animar
    requestAnimationFrame(() => {
      progressBar.style.width = percent + '%';
      progressBar.setAttribute('aria-valuenow', String(percent));
      let start = null;
      const duration = 900;
      function step(ts) {
        if (!start) start = ts;
        const elapsed = ts - start;
        const progress = Math.min(elapsed / duration, 1);
        progressPercent.textContent = Math.round(progress * percent) + '%';
        if (progress < 1) requestAnimationFrame(step);
      }
      requestAnimationFrame(step);
    });
  }

  function resetQuiz() {
    quizForm.reset();
    quizForm.querySelector('input')?.focus();
  }

  function resetToEntry() {
    resultSection.hidden = true;
    document.getElementById('entryForm').hidden = false;
    document.getElementById('entryForm').querySelector('input')?.focus();
  }

  // Ranking: armazenamento e render
  function loadRanking() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      return [];
    }
  }

  function saveRanking(list) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    renderRanking(list);
  }

  function saveOrUpdateResult(name, percent) {
    const list = loadRanking();
    const existingIdx = list.findIndex(r => r.name.toLowerCase() === name.toLowerCase());
    if (existingIdx >= 0) {
      const update = confirm(`${name} já consta no ranking. Atualizar pontuação?`);
      if (!update) return;
      list[existingIdx].percent = percent;
      list[existingIdx].timestamp = Date.now();
    } else {
      list.push({ name, percent, timestamp: Date.now() });
    }
    // ordenar decrescente por percentual, depois por timestamp
    list.sort((a,b) => b.percent - a.percent || a.timestamp - b.timestamp);
    saveRanking(list);
  }

  function renderRanking(list) {
    rankingList.innerHTML = '';
    if (!list.length) {
      rankingList.innerHTML = '<div class="ranking__empty">Nenhum participante ainda.</div>';
      return;
    }
    list.forEach((row, idx) => {
      const div = document.createElement('div');
      div.className = 'ranking__row';
      if (currentPlayer && row.name.toLowerCase() === currentPlayer.toLowerCase()) div.classList.add('ranking__row--highlight');
      div.innerHTML = `<div><span class="ranking__pos">#${idx+1}</span> <span class="ranking__name">${escapeHtml(row.name)}</span></div><div class="ranking__percent">${row.percent}%</div>`;
      rankingList.appendChild(div);
    });
  }

  function showRanking() {
    const list = loadRanking();
    renderRanking(list);
    rankingSection.hidden = false;
    rankingSection.removeAttribute('aria-hidden');
    rankingSection.querySelector('.ranking__row')?.focus();
  }

  function closeRanking() {
    rankingSection.hidden = true;
    document.getElementById('entryForm').hidden = false;
  }

  // Pequena função utilitária para evitar XSS em nomes
  function escapeHtml(str){
    return String(str).replace(/[&<>"']/g, s => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[s]);
  }

  // Carregar ranking ao iniciar
  (function init(){
    const list = loadRanking();
    if (list.length) renderRanking(list);
  })();

});
