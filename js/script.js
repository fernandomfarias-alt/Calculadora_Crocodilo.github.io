/* js/script.js — Lógica para Pântano Analytics + Supabase Sync */

const STORAGE_KEY = 'pantano_ranking_v1';

document.addEventListener('DOMContentLoaded', () => {

  const entryForm = document.getElementById('entryForm');
  const playerNameInput = document.getElementById('playerName');
  const quizSection = document.getElementById('quizSection');
  const quizForm = document.getElementById('quizForm');
  const quizReset = document.getElementById('quizReset');
  const resultSection = document.getElementById('resultSection');
  const resultName = document.getElementById('resultName');
  const resultLabel = document.getElementById('resultLabel');
  const progressBar = document.getElementById('progressBar');
  const progressPercent = document.getElementById('progressPercent');
  const resultText = document.getElementById('resultText');
  const redoBtn = document.getElementById('redoBtn');
  const rankingSection = document.getElementById('rankingSection');
  const rankingList = document.getElementById('rankingList');
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

  document.getElementById('viewRankingBtn')?.addEventListener('click', () => showRanking());
  document.getElementById('showRankingBtn')?.addEventListener('click', () => showRanking());
  document.getElementById('viewRankingAfterBtn')?.addEventListener('click', () => showRanking());
  document.getElementById('closeRankingBtn')?.addEventListener('click', () => closeRanking());

  if (themeToggle) themeToggle.addEventListener('click', toggleTheme);

  if (quizForm) {
    quizForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const answers = collectAnswers(quizForm);
      const score = calculateScore(answers);
      const max = computeMaxScore(quizForm);
      const percent = Math.round((score / max) * 100);
      const classification = classifyPercent(percent);
      
      displayResult(currentPlayer, percent, classification);
      // Agora a função de salvar é assíncrona (envia pro Supabase)
      await saveOrUpdateResult(currentPlayer, percent);
    });
  }

  if (quizReset) quizReset.addEventListener('click', () => resetQuiz());
  if (redoBtn) redoBtn.addEventListener('click', () => resetToEntry());

  /* ================= FUNÇÕES CORE ================= */

  function showQuiz() {
    entryForm.hidden = true;
    quizSection.hidden = false;
    quizSection.removeAttribute('aria-hidden');
    quizForm?.querySelector('input[type="radio"]')?.focus();
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
  }

  function animateProgress(percent) {
    progressBar.style.width = '0%';
    progressPercent.textContent = '0%';
    requestAnimationFrame(() => {
      progressBar.style.width = percent + '%';
      let start = null;
      const duration = 900;
      function step(ts) {
        if (!start) start = ts;
        const progress = Math.min((ts - start) / duration, 1);
        progressPercent.textContent = Math.round(progress * percent) + '%';
        if (progress < 1) requestAnimationFrame(step);
      }
      requestAnimationFrame(step);
    });
  }

  /* ================= INTEGRAÇÃO SUPABASE ================= */

  // Carrega do Banco de Dados
  async function loadRanking() {
    try {
      const { data, error } = await supabase
        .from('ranking') 
        .select('*')
        .order('pontuacao', { ascending: false });

      if (error) throw error;
      return data.map(item => ({ name: item.nome, percent: item.pontuacao }));
    } catch (err) {
      console.error("Erro ao carregar Supabase, usando local:", err);
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    }
  }

  // Salva no Banco de Dados
  async function saveOrUpdateResult(name, percent) {
    // Mantém o backup local
    const localList = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    localList.push({ name, percent });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(localList));

    // Envia para o Supabase
    try {
      const { error } = await supabase
        .from('ranking')
        .insert([{ nome: name, pontuacao: percent }]);
      
      if (error) console.error("Erro Supabase:", error);
    } catch (err) {
      console.error("Falha na rede:", err);
    }
  }

  async function showRanking() {
    rankingList.innerHTML = '<div class="ranking__empty">Carregando pântano...</div>';
    rankingSection.hidden = false;
    rankingSection.removeAttribute('aria-hidden');
    
    const list = await loadRanking();
    renderRanking(list);
  }

  function renderRanking(list) {
    rankingList.innerHTML = '';
    if (!list.length) {
      rankingList.innerHTML = '<div class="ranking__empty">Nenhum crocodilo avistado.</div>';
      return;
    }
    list.forEach((row, idx) => {
      const div = document.createElement('div');
      div.className = 'ranking__row';
      if (currentPlayer && row.name.toLowerCase() === currentPlayer.toLowerCase()) {
        div.classList.add('ranking__row--highlight');
      }
      div.innerHTML = `<div><span class="ranking__pos">#${idx+1}</span><span class="ranking__name">${escapeHtml(row.name)}</span></div><div class="ranking__percent">${row.percent}%</div>`;
      rankingList.appendChild(div);
    });
  }

  /* ================= UTILITÁRIOS ================= */

  function resetQuiz() { quizForm?.reset(); }
  function resetToEntry() { resultSection.hidden = true; entryForm.hidden = false; }
  function closeRanking() { rankingSection.hidden = true; }
  function escapeHtml(str) { return String(str).replace(/[&<>"']/g, s => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[s]); }

  const THEME_KEY = 'pantano_theme_v1';
  function applyTheme(isDark) {
    document.body.classList.toggle('theme--dark', isDark);
    if (themeToggle) {
      themeToggle.textContent = isDark ? '☀️' : '🌙';
    }
  }
  function toggleTheme() {
    const isDark = !(localStorage.getItem(THEME_KEY) === 'dark');
    localStorage.setItem(THEME_KEY, isDark ? 'dark' : 'light');
    applyTheme(isDark);
  }

  (async function init() {
    applyTheme(localStorage.getItem(THEME_KEY) === 'dark');
  })();
});