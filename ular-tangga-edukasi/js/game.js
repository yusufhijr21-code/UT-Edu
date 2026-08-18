// ============================================================
// Ular Tangga Edukasi — logika permainan
// ============================================================

const PLAYER_COLORS = ['#F0553F', '#4FB6E8', '#2FA84F', '#F5A524'];

let CONFIG = null;
let players = [];        // {name, color, pos}
let currentPlayerIndex = 0;
let recentQuestionIds = [];
let gameOver = false;

const el = (id) => document.getElementById(id);

// ---------- INIT ----------
async function init() {
  try {
    CONFIG = await Api.getConfig();
  } catch (err) {
    alert('Gagal memuat konfigurasi dari server. Pastikan API_URL di js/config.js sudah benar.\n\n' + err.message);
    return;
  }
  el('game-title').textContent = CONFIG.title || 'Ular Tangga Edukasi';
  el('game-title-2').textContent = CONFIG.title || 'Ular Tangga Edukasi';
  setupPlayerCountSelect();
  el('start-game-btn').addEventListener('click', startGame);
  el('roll-btn').addEventListener('click', handleRoll);
  el('restart-btn').addEventListener('click', () => location.reload());
  el('play-again-btn').addEventListener('click', () => location.reload());
}

function setupPlayerCountSelect() {
  const max = CONFIG.maxPlayers || 4;
  const select = el('player-count');
  for (let i = 2; i <= max; i++) {
    const opt = document.createElement('option');
    opt.value = i;
    opt.textContent = i + ' Pemain';
    select.appendChild(opt);
  }
  select.addEventListener('change', renderNameFields);
  renderNameFields();
}

function renderNameFields() {
  const count = Number(el('player-count').value);
  const wrap = el('player-name-fields');
  wrap.innerHTML = '';
  for (let i = 0; i < count; i++) {
    const field = document.createElement('div');
    field.className = 'field';
    field.innerHTML = `
      <label>Nama Pemain ${i + 1}</label>
      <input type="text" class="player-name-input" placeholder="Pemain ${i + 1}" maxlength="16">
    `;
    wrap.appendChild(field);
  }
}

// ---------- START GAME ----------
function startGame() {
  const nameInputs = document.querySelectorAll('.player-name-input');
  players = Array.from(nameInputs).map((input, i) => ({
    name: input.value.trim() || `Pemain ${i + 1}`,
    color: PLAYER_COLORS[i % PLAYER_COLORS.length],
    pos: 0
  }));
  currentPlayerIndex = 0;
  gameOver = false;

  el('setup-screen').classList.add('hidden');
  el('game-screen').classList.remove('hidden');

  renderBoard();
  renderPlayersList();
  updateTurnUI();
}

// ---------- BOARD RENDERING ----------
function computeGridDims(n) {
  const cols = Math.min(10, n);
  const rows = Math.ceil(n / cols);
  return { cols, rows };
}

function cellGridPosition(n, cols, rows) {
  const idx = n - 1;
  const rowFromBottom = Math.floor(idx / cols);
  const rowFromTop = rows - 1 - rowFromBottom;
  let posInRow = idx % cols;
  if (rowFromBottom % 2 === 1) posInRow = cols - 1 - posInRow;
  return { row: rowFromTop + 1, col: posInRow + 1 };
}

function renderBoard() {
  const boardSize = CONFIG.boardSize;
  const { cols, rows } = computeGridDims(boardSize);
  const board = el('board');
  board.innerHTML = '';
  board.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;
  board.style.gridTemplateRows = `repeat(${rows}, 1fr)`;

  const questionSet = new Set((CONFIG.questionBoxes || []).map(Number));
  const ladders = CONFIG.ladders || {};
  const snakes = CONFIG.snakes || {};

  for (let n = 1; n <= boardSize; n++) {
    const { row, col } = cellGridPosition(n, cols, rows);
    const cell = document.createElement('div');
    cell.className = 'cell';
    cell.id = 'cell-' + n;
    cell.style.gridRow = row;
    cell.style.gridColumn = col;
    cell.innerHTML = `<span>${n}</span>`;

    if (questionSet.has(n)) {
      cell.classList.add('question-cell');
      cell.innerHTML += `<span class="badge">❓</span>`;
    }
    if (ladders[n]) {
      cell.innerHTML += `<span class="ladder-tag">🪜→${ladders[n]}</span>`;
    }
    if (snakes[n]) {
      cell.innerHTML += `<span class="snake-tag">🐍→${snakes[n]}</span>`;
    }

    const pawnHolder = document.createElement('div');
    pawnHolder.className = 'pawns';
    pawnHolder.id = 'pawns-' + n;
    cell.appendChild(pawnHolder);

    board.appendChild(cell);
  }

  placeAllPawns();
}

function placeAllPawns() {
  document.querySelectorAll('.pawns').forEach(p => p.innerHTML = '');
  players.forEach((p, i) => {
    const targetCell = p.pos === 0 ? null : el('pawns-' + p.pos);
    if (!targetCell) return;
    const pawn = document.createElement('div');
    pawn.className = 'pawn';
    pawn.style.background = p.color;
    pawn.title = p.name;
    targetCell.appendChild(pawn);
  });
}

// ---------- SIDEBAR ----------
function renderPlayersList() {
  const list = el('players-list');
  list.innerHTML = '';
  players.forEach((p, i) => {
    const row = document.createElement('div');
    row.className = 'player-row' + (i === currentPlayerIndex ? ' active' : '');
    row.id = 'player-row-' + i;
    row.innerHTML = `
      <span class="player-dot" style="background:${p.color}"></span>
      <span>${p.name}</span>
      <span class="player-pos">Kotak ${p.pos}</span>
    `;
    list.appendChild(row);
  });
}

function updateTurnUI() {
  const p = players[currentPlayerIndex];
  el('current-player-name').textContent = p.name;
  el('current-player-name').style.color = p.color;
  document.querySelectorAll('.player-row').forEach((r, i) => {
    r.classList.toggle('active', i === currentPlayerIndex);
  });
}

function setMessage(msg) {
  el('turn-message').textContent = msg;
}

// ---------- TURN / DICE ----------
let rolling = false;

async function handleRoll() {
  if (rolling || gameOver) return;
  rolling = true;
  el('roll-btn').disabled = true;
  const dice = el('dice');
  dice.classList.add('rolling');
  setMessage('');

  let ticks = 0;
  const shuffle = setInterval(() => {
    dice.textContent = ['⚀','⚁','⚂','⚃','⚄','⚅'][Math.floor(Math.random() * 6)];
    ticks++;
  }, 80);

  await wait(700);
  clearInterval(shuffle);
  dice.classList.remove('rolling');

  const result = 1 + Math.floor(Math.random() * 6);
  dice.textContent = ['⚀','⚁','⚂','⚃','⚄','⚅'][result - 1];

  await handleMove(result);

  rolling = false;
}

function wait(ms) { return new Promise(res => setTimeout(res, ms)); }

async function handleMove(diceValue) {
  const player = players[currentPlayerIndex];
  const oldPos = player.pos;
  let target = oldPos + diceValue;

  if (target > CONFIG.boardSize) {
    setMessage(`${player.name} butuh angka pas untuk mencapai kotak terakhir. Giliran dilewati.`);
    await wait(1200);
    nextTurn();
    return;
  }

  // gerak ke kotak tujuan (visual)
  player.pos = target;
  placeAllPawns();
  renderPlayersList();
  await wait(400);

  const questionBoxes = new Set((CONFIG.questionBoxes || []).map(Number));

  if (questionBoxes.has(target) && target !== 0) {
    const answeredCorrectly = await askQuestion();
    if (!answeredCorrectly) {
      // salah -> kembali ke posisi semula (tetap di tempat)
      player.pos = oldPos;
      placeAllPawns();
      renderPlayersList();
      setMessage(`${player.name} menjawab salah dan tetap di kotak ${oldPos}.`);
      await wait(1000);
      nextTurn();
      return;
    } else {
      setMessage(`${player.name} menjawab benar! Lanjut ke kotak ${target}.`);
      await wait(600);
    }
  }

  // cek tangga / ular di posisi final
  const finalPos = await applyLaddersAndSnakes(player);

  if (finalPos >= CONFIG.boardSize) {
    player.pos = CONFIG.boardSize;
    placeAllPawns();
    renderPlayersList();
    return declareWinner(player);
  }

  nextTurn();
}

async function applyLaddersAndSnakes(player) {
  const ladders = CONFIG.ladders || {};
  const snakes = CONFIG.snakes || {};
  const pos = player.pos;

  if (ladders[pos]) {
    setMessage(`${player.name} naik tangga ke kotak ${ladders[pos]}! 🪜`);
    await wait(700);
    player.pos = Number(ladders[pos]);
    placeAllPawns();
    renderPlayersList();
  } else if (snakes[pos]) {
    setMessage(`${player.name} kena ular, turun ke kotak ${snakes[pos]}! 🐍`);
    await wait(700);
    player.pos = Number(snakes[pos]);
    placeAllPawns();
    renderPlayersList();
  }
  return player.pos;
}

function nextTurn() {
  el('roll-btn').disabled = false;
  currentPlayerIndex = (currentPlayerIndex + 1) % players.length;
  updateTurnUI();
}

function declareWinner(player) {
  gameOver = true;
  el('winner-text').textContent = `${player.name} menang! 🎉`;
  el('winner-modal').classList.remove('hidden');
}

// ---------- QUESTION MODAL ----------
function askQuestion() {
  return new Promise(async (resolve) => {
    let q;
    try {
      q = await Api.getRandomQuestion(recentQuestionIds);
    } catch (err) {
      setMessage('Gagal memuat soal, lanjut otomatis.');
      resolve(true);
      return;
    }
    if (!q) {
      setMessage('Belum ada soal tersedia. Lanjut otomatis.');
      resolve(true);
      return;
    }

    recentQuestionIds.push(q.id);
    if (recentQuestionIds.length > 15) recentQuestionIds.shift();

    el('question-text').textContent = q.question;
    const optionsWrap = el('question-options');
    optionsWrap.innerHTML = '';
    el('question-feedback').classList.add('hidden');
    el('question-feedback').textContent = '';

    q.options.forEach((opt, idx) => {
      if (!opt) return;
      const btn = document.createElement('button');
      btn.className = 'option-btn';
      btn.textContent = opt;
      btn.addEventListener('click', async () => {
        Array.from(optionsWrap.children).forEach(b => b.disabled = true);
        let res;
        try {
          res = await Api.checkAnswer(q.id, idx);
        } catch (err) {
          res = { correct: false };
        }
        if (res.correct) {
          btn.classList.add('correct');
          el('question-feedback').textContent = '✅ Benar!';
          el('question-feedback').className = 'question-feedback correct-text';
        } else {
          btn.classList.add('wrong');
          if (res.correctIndex >= 0 && optionsWrap.children[res.correctIndex]) {
            optionsWrap.children[res.correctIndex].classList.add('correct');
          }
          el('question-feedback').textContent = '❌ Kurang tepat.';
          el('question-feedback').className = 'question-feedback wrong-text';
        }
        el('question-feedback').classList.remove('hidden');
        await wait(1300);
        el('question-modal').classList.add('hidden');
        resolve(!!res.correct);
      });
      optionsWrap.appendChild(btn);
    });

    el('question-modal').classList.remove('hidden');
  });
}

init();
