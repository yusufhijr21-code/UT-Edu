// ============================================================
// Panel Admin — logika
// ============================================================

const el = (id) => document.getElementById(id);
let ADMIN_PASSWORD = null;
let currentConfig = null;
let currentQuestions = [];

// ---------- LOGIN ----------
el('login-btn').addEventListener('click', doLogin);
el('admin-password').addEventListener('keydown', (e) => { if (e.key === 'Enter') doLogin(); });

async function doLogin() {
  const pw = el('admin-password').value;
  if (!pw) return;
  el('login-error').classList.add('hidden');
  el('login-btn').disabled = true;
  try {
    const res = await Api.adminLogin(pw);
    if (!res.authenticated) throw new Error('Password salah');
    ADMIN_PASSWORD = pw;
    el('login-screen').classList.add('hidden');
    el('dashboard-screen').classList.remove('hidden');
    await loadEverything();
  } catch (err) {
    el('login-error').textContent = 'Password salah. Coba lagi.';
    el('login-error').classList.remove('hidden');
  } finally {
    el('login-btn').disabled = false;
  }
}

async function loadEverything() {
  await Promise.all([loadConfig(), loadQuestions()]);
}

// ---------- TABS ----------
document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab-panel').forEach(p => p.classList.add('hidden'));
    btn.classList.add('active');
    el(btn.dataset.tab).classList.remove('hidden');
  });
});

// ---------- CONFIG ----------
async function loadConfig() {
  currentConfig = await Api.getFullConfig(ADMIN_PASSWORD);
  el('cfg-title').value = currentConfig.title || '';
  el('cfg-boardsize').value = currentConfig.boardSize || 30;
  el('cfg-maxplayers').value = currentConfig.maxPlayers || 4;
  el('cfg-questionboxes').value = (currentConfig.questionBoxes || []).join(',');
  el('cfg-ladders').value = objToLines(currentConfig.ladders || {});
  el('cfg-snakes').value = objToLines(currentConfig.snakes || {});

  const theme = currentConfig.theme || {};
  el('theme-primaryColor').value = theme.primaryColor || '#1E1B4B';
  el('theme-accentColor').value = theme.accentColor || '#F5A524';
  el('theme-correctColor').value = theme.correctColor || '#2FA84F';
  el('theme-wrongColor').value = theme.wrongColor || '#F0553F';
  el('theme-cellColor').value = theme.cellColor || '#FFF8E7';
  el('theme-questionCellColor').value = theme.questionCellColor || '#4FB6E8';
}

function objToLines(obj) {
  return Object.keys(obj).map(k => `${k}=${obj[k]}`).join('\n');
}

function linesToObj(text) {
  const obj = {};
  text.split('\n').forEach(line => {
    const parts = line.split('=');
    if (parts.length === 2) {
      const k = parts[0].trim();
      const v = parts[1].trim();
      if (k && v) obj[k] = Number(v);
    }
  });
  return obj;
}

el('save-config-btn').addEventListener('click', async () => {
  const status = el('config-save-status');
  status.textContent = 'Menyimpan...';
  status.className = 'save-status';
  try {
    const newConfig = {
      title: el('cfg-title').value.trim() || 'Ular Tangga Edukasi',
      boardSize: Number(el('cfg-boardsize').value) || 30,
      maxPlayers: Math.min(4, Math.max(2, Number(el('cfg-maxplayers').value) || 4)),
      questionBoxes: el('cfg-questionboxes').value.split(',').map(s => Number(s.trim())).filter(n => !isNaN(n) && n > 0),
      ladders: linesToObj(el('cfg-ladders').value),
      snakes: linesToObj(el('cfg-snakes').value),
      theme: {
        primaryColor: el('theme-primaryColor').value,
        accentColor: el('theme-accentColor').value,
        correctColor: el('theme-correctColor').value,
        wrongColor: el('theme-wrongColor').value,
        cellColor: el('theme-cellColor').value,
        questionCellColor: el('theme-questionCellColor').value
      }
    };
    await Api.saveConfig(ADMIN_PASSWORD, newConfig);
    status.textContent = 'Tersimpan ✓';
  } catch (err) {
    status.textContent = 'Gagal menyimpan: ' + err.message;
    status.className = 'save-status error';
  }
});

// ---------- QUESTIONS: LIST ----------
async function loadQuestions() {
  currentQuestions = await Api.listQuestions(ADMIN_PASSWORD);
  renderQuestionTable();
}

function renderQuestionTable() {
  el('question-count').textContent = currentQuestions.length;
  const wrap = el('question-table');
  wrap.innerHTML = '';
  const letters = ['A', 'B', 'C', 'D'];
  currentQuestions.forEach(q => {
    const row = document.createElement('div');
    row.className = 'question-row';
    row.innerHTML = `
      <div class="q-summary">
        ${escapeHtml(q.question)}
        <div class="q-answer">Jawaban: ${letters[q.correctIndex]}. ${escapeHtml(q.options[q.correctIndex] || '')}</div>
      </div>
      <div class="row-actions">
        <button class="btn-edit" data-id="${q.id}">Edit</button>
        <button class="btn-delete" data-id="${q.id}">Hapus</button>
      </div>
    `;
    wrap.appendChild(row);
  });

  wrap.querySelectorAll('.btn-edit').forEach(b => b.addEventListener('click', () => loadQuestionIntoForm(b.dataset.id)));
  wrap.querySelectorAll('.btn-delete').forEach(b => b.addEventListener('click', () => deleteQuestionRow(b.dataset.id)));
}

function escapeHtml(str) {
  const d = document.createElement('div');
  d.textContent = str;
  return d.innerHTML;
}

function loadQuestionIntoForm(id) {
  const q = currentQuestions.find(x => x.id === id);
  if (!q) return;
  el('edit-question-id').value = q.id;
  el('q-text').value = q.question;
  el('q-optA').value = q.options[0] || '';
  el('q-optB').value = q.options[1] || '';
  el('q-optC').value = q.options[2] || '';
  el('q-optD').value = q.options[3] || '';
  el('q-correct').value = q.correctIndex;
  el('question-form-title').textContent = 'Edit Soal';
  el('cancel-edit-btn').classList.remove('hidden');
  document.querySelector('[data-tab="tab-questions"]').click();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

el('cancel-edit-btn').addEventListener('click', resetQuestionForm);

function resetQuestionForm() {
  el('edit-question-id').value = '';
  el('q-text').value = '';
  el('q-optA').value = '';
  el('q-optB').value = '';
  el('q-optC').value = '';
  el('q-optD').value = '';
  el('q-correct').value = '0';
  el('question-form-title').textContent = 'Tambah Soal Satuan';
  el('cancel-edit-btn').classList.add('hidden');
}

async function deleteQuestionRow(id) {
  if (!confirm('Hapus soal ini?')) return;
  try {
    await Api.deleteQuestion(ADMIN_PASSWORD, id);
    await loadQuestions();
  } catch (err) {
    alert('Gagal menghapus: ' + err.message);
  }
}

// ---------- QUESTIONS: ADD / EDIT SINGLE ----------
el('save-question-btn').addEventListener('click', async () => {
  const status = el('question-save-status');
  const questionText = el('q-text').value.trim();
  const options = [el('q-optA').value.trim(), el('q-optB').value.trim(), el('q-optC').value.trim(), el('q-optD').value.trim()];
  const correctIndex = Number(el('q-correct').value);

  if (!questionText || options.some(o => !o)) {
    status.textContent = 'Lengkapi pertanyaan dan semua opsi.';
    status.className = 'save-status error';
    return;
  }

  const payload = { question: questionText, options, correctIndex };
  const editId = el('edit-question-id').value;

  status.textContent = 'Menyimpan...';
  status.className = 'save-status';
  try {
    if (editId) {
      payload.id = editId;
      await Api.updateQuestion(ADMIN_PASSWORD, payload);
    } else {
      await Api.addQuestion(ADMIN_PASSWORD, payload);
    }
    status.textContent = 'Tersimpan ✓';
    resetQuestionForm();
    await loadQuestions();
  } catch (err) {
    status.textContent = 'Gagal: ' + err.message;
    status.className = 'save-status error';
  }
});

// ---------- QUESTIONS: BULK ADD ----------
el('bulk-add-btn').addEventListener('click', async () => {
  const status = el('bulk-save-status');
  const raw = el('bulk-questions').value.trim();
  if (!raw) return;

  const lines = raw.split('\n').map(l => l.trim()).filter(Boolean);
  const questions = [];
  const errors = [];

  lines.forEach((line, i) => {
    const parts = line.split('|').map(p => p.trim());
    if (parts.length !== 6) {
      errors.push(`Baris ${i + 1}: format salah (butuh 6 bagian dipisah "|")`);
      return;
    }
    const [question, a, b, c, d, correctStr] = parts;
    const correctIndex = Number(correctStr);
    if (!question || !a || !b || !c || !d || isNaN(correctIndex) || correctIndex < 0 || correctIndex > 3) {
      errors.push(`Baris ${i + 1}: data tidak lengkap/valid`);
      return;
    }
    questions.push({ question, options: [a, b, c, d], correctIndex });
  });

  if (errors.length) {
    status.textContent = errors.join(' | ');
    status.className = 'save-status error';
    if (questions.length === 0) return;
  }

  status.textContent = 'Menyimpan ' + questions.length + ' soal...';
  status.className = 'save-status';
  try {
    await Api.addQuestionsBulk(ADMIN_PASSWORD, questions);
    status.textContent = `${questions.length} soal berhasil ditambahkan ✓`;
    el('bulk-questions').value = '';
    await loadQuestions();
  } catch (err) {
    status.textContent = 'Gagal: ' + err.message;
    status.className = 'save-status error';
  }
});

// ---------- CHANGE PASSWORD ----------
el('change-password-btn').addEventListener('click', async () => {
  const status = el('password-save-status');
  const newPw = el('new-password').value.trim();
  if (!newPw || newPw.length < 4) {
    status.textContent = 'Password minimal 4 karakter.';
    status.className = 'save-status error';
    return;
  }
  status.textContent = 'Menyimpan...';
  status.className = 'save-status';
  try {
    await Api.changePassword(ADMIN_PASSWORD, newPw);
    ADMIN_PASSWORD = newPw;
    status.textContent = 'Password berhasil diganti ✓';
    el('new-password').value = '';
  } catch (err) {
    status.textContent = 'Gagal: ' + err.message;
    status.className = 'save-status error';
  }
});
