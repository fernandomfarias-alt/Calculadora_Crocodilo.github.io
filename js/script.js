/* js/script.js — Lógica para Pântano Analytics
   Responsável por: entrada do nome, fluxo do quiz, cálculo de pontuação,
   armazenamento em localStorage, gerenciamento do ranking e acessibilidade.
*/

const STORAGE_KEY = 'pantano_ranking_v1';

document.addEventListener('DOMContentLoaded', () => {

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
  const themeToggle = document.getElementById('themeToggle');

  let currentPlayer = null;

  /* ================= EVENTOS ================= */

  if (entryForm) {
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
  }

  if (viewRankingBtn) {
    viewRankingBtn.addEventListener('click', () => showRanking());
  }

  const THEME_KEY = 'pantano_theme_v1';

  if (themeToggle) {
    themeToggle.addEventListener('click', toggleTheme);
  }

  if (quizForm) {
    quizForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const answers = collectAnswers(quizForm);
      const score = calculateScore(answers);
      const max = computeMaxScore(quizForm);
      const percent = Math.round((score / max) * 100);
      const classification = classifyPercent(percent);
      displayResult(currentPlayer, percent, classification);
      saveOrUpdateResult(currentPlayer, percent);
    });
  }

  if (quizReset) {
    quizReset.addEventListener('click', () => resetQuiz());
  }

  if (showRankingBtn) {
    showRankingBtn.addEventListener('click', () => showRanking());
  }

  if (redoBtn) {
    redoBtn.addEventListener('click', () => resetToEntry());
  }

  if (viewRankingAfterBtn) {
    viewRankingAfterBtn.addEventListener('click', () => showRanking());
  }

  if (closeRankingBtn) {
    closeRankingBtn.addEventListener('click', () => closeRanking());
  }

  /* ================= FUNÇÕES ================= */

  function showQuiz() {
    entryForm.hidden = true;
    quizSection.hidden = false;
    quizSection.removeAttribute('aria-hidden');
    quizForm?.querySelector('input[type="radio"]')?.focus();
  }

  function applyTheme(isDark){
    if(isDark) document.body.classList.add('theme--dark');
    else document.body.classList.remove('theme--dark');

    if(themeToggle){
      themeToggle.setAttribute('aria-pressed', String(Boolean(isDark)));
      themeToggle.textContent = isDark ? '☀️' : '🌙';
      themeToggle.setAttribute('aria-label', isDark ? 'Desativar modo escuro' : 'Ativar modo escuro');
    }
  }

  function toggleTheme(){
    const current = localStorage.getItem(THEME_KEY) === 'dark';
    const next = !current;
    localStorage.setItem(THEME_KEY, next ? 'dark' : 'light');
    applyTheme(next);
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
      const values = Array.from(fs.querySelectorAll('input[type="radio"]'))
        .map(i => Number(i.value) || 0);
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
    redoBtn?.focus();
  }

  function animateProgress(percent) {
    progressBar.style.width = '0%';
    progressBar.setAttribute('aria-valuenow', '0');
    progressPercent.textContent = '0%';

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
    quizForm?.reset();
    quizForm?.querySelector('input')?.focus();
  }

  function resetToEntry() {
    resultSection.hidden = true;
    entryForm.hidden = false;
    entryForm?.querySelector('input')?.focus();
  }

  function loadRanking() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
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

      if (currentPlayer && row.name.toLowerCase() === currentPlayer.toLowerCase()) {
        div.classList.add('ranking__row--highlight');
      }

      div.innerHTML =
        `<div>
           <span class="ranking__pos">#${idx+1}</span>
           <span class="ranking__name">${escapeHtml(row.name)}</span>
         </div>
         <div class="ranking__percent">${row.percent}%</div>`;

      rankingList.appendChild(div);
    });
  }

  function showRanking() {
    const list = loadRanking();
    renderRanking(list);
    rankingSection.hidden = false;
    rankingSection.removeAttribute('aria-hidden');
  }

  function closeRanking() {
    rankingSection.hidden = true;
    entryForm.hidden = false;
  }

  function escapeHtml(str){
    return String(str).replace(/[&<>"']/g,
      s => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[s]);
  }

  (function init(){
    const list = loadRanking();
    if (list.length) renderRanking(list);
    const saved = localStorage.getItem(THEME_KEY);
    applyTheme(saved === 'dark');
  })();

});