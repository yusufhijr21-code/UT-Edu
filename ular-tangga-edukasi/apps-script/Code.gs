/**
 * ULAR TANGGA EDUKASI — Backend (Google Apps Script)
 * ----------------------------------------------------
 * Cara pasang:
 * 1. Buat Google Spreadsheet baru (kosong, boleh judul bebas).
 * 2. Menu Extensions > Apps Script.
 * 3. Hapus isi default, tempel SELURUH isi file ini.
 * 4. Jalankan fungsi `setupSheets` sekali (pilih dari dropdown fungsi lalu klik Run)
 *    untuk membuat sheet "Config", "Questions", "Log" otomatis. Izinkan akses saat diminta.
 * 5. Deploy > New deployment > pilih tipe "Web app".
 *    - Execute as: Me
 *    - Who has access: Anyone
 * 6. Salin URL Web App yang muncul (diakhiri /exec), tempel ke js/config.js (API_URL) di folder frontend.
 * 7. Password admin default adalah "admin123" — GANTI lewat panel admin setelah login pertama.
 */

// ============ KONFIGURASI DASAR ============
var SHEET_CONFIG = 'Config';
var SHEET_QUESTIONS = 'Questions';
var SHEET_LOG = 'Log';

var DEFAULT_CONFIG = {
  title: 'Ular Tangga Edukasi',
  boardSize: 30,
  questionBoxes: [3, 6, 9, 12, 15, 18, 21, 24, 27],
  ladders: { "4": 14, "9": 22, "20": 29 },
  snakes: { "17": 7, "25": 13 },
  maxPlayers: 4,
  theme: {
    primaryColor: '#1E1B4B',
    accentColor: '#F5A524',
    correctColor: '#2FA84F',
    wrongColor: '#F0553F',
    cellColor: '#FFF8E7',
    questionCellColor: '#4FB6E8'
  },
  adminPassword: 'admin123'
};

// ============ SETUP ============
function setupSheets() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();

  var configSheet = ss.getSheetByName(SHEET_CONFIG) || ss.insertSheet(SHEET_CONFIG);
  configSheet.clear();
  configSheet.getRange(1, 1, 1, 2).setValues([['key', 'value']]);
  configSheet.getRange(2, 1, 1, 2).setValues([['config', JSON.stringify(DEFAULT_CONFIG)]]);

  var qSheet = ss.getSheetByName(SHEET_QUESTIONS) || ss.insertSheet(SHEET_QUESTIONS);
  qSheet.clear();
  qSheet.getRange(1, 1, 1, 7).setValues([
    ['id', 'question', 'optionA', 'optionB', 'optionC', 'optionD', 'correctIndex']
  ]);
  var sampleRows = [
    [genId(), 'Berapa hasil dari 5 + 7?', '10', '12', '13', '11', 1],
    [genId(), 'Ibu kota Indonesia adalah?', 'Bandung', 'Jakarta', 'Surabaya', 'Medan', 1],
    [genId(), 'Planet terdekat dengan Matahari adalah?', 'Bumi', 'Venus', 'Merkurius', 'Mars', 2]
  ];
  qSheet.getRange(2, 1, sampleRows.length, 7).setValues(sampleRows);

  var logSheet = ss.getSheetByName(SHEET_LOG) || ss.insertSheet(SHEET_LOG);
  logSheet.clear();
  logSheet.getRange(1, 1, 1, 3).setValues([['timestamp', 'action', 'detail']]);

  Logger.log('Setup selesai. Sheets: Config, Questions, Log.');
}

function genId() {
  return Utilities.getUuid().slice(0, 8);
}

function getSS() {
  return SpreadsheetApp.getActiveSpreadsheet();
}

function ensureSheets() {
  var ss = getSS();
  if (!ss.getSheetByName(SHEET_CONFIG) || !ss.getSheetByName(SHEET_QUESTIONS)) {
    setupSheets();
  }
}

// ============ CONFIG HELPERS ============
function readConfig() {
  ensureSheets();
  var sheet = getSS().getSheetByName(SHEET_CONFIG);
  var data = sheet.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    if (data[i][0] === 'config') {
      try {
        return JSON.parse(data[i][1]);
      } catch (e) {
        return DEFAULT_CONFIG;
      }
    }
  }
  return DEFAULT_CONFIG;
}

function writeConfig(configObj) {
  ensureSheets();
  var sheet = getSS().getSheetByName(SHEET_CONFIG);
  var data = sheet.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    if (data[i][0] === 'config') {
      sheet.getRange(i + 1, 2).setValue(JSON.stringify(configObj));
      return;
    }
  }
  sheet.appendRow(['config', JSON.stringify(configObj)]);
}

function publicConfig() {
  var c = readConfig();
  var copy = JSON.parse(JSON.stringify(c));
  delete copy.adminPassword; // jangan bocorkan password ke frontend publik
  return copy;
}

// ============ QUESTIONS HELPERS ============
function getAllQuestions() {
  ensureSheets();
  var sheet = getSS().getSheetByName(SHEET_QUESTIONS);
  var data = sheet.getDataRange().getValues();
  var out = [];
  for (var i = 1; i < data.length; i++) {
    var row = data[i];
    if (!row[0]) continue;
    out.push({
      id: row[0],
      question: row[1],
      options: [row[2], row[3], row[4], row[5]],
      correctIndex: Number(row[6])
    });
  }
  return out;
}

function findQuestionRow(id) {
  var sheet = getSS().getSheetByName(SHEET_QUESTIONS);
  var data = sheet.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    if (data[i][0] === id) return i + 1; // 1-indexed row number
  }
  return -1;
}

function addQuestion(q) {
  ensureSheets();
  var sheet = getSS().getSheetByName(SHEET_QUESTIONS);
  var id = genId();
  sheet.appendRow([
    id, q.question, q.options[0], q.options[1], q.options[2], q.options[3], q.correctIndex
  ]);
  return id;
}

function addQuestionsBulk(list) {
  var ids = [];
  for (var i = 0; i < list.length; i++) {
    ids.push(addQuestion(list[i]));
  }
  return ids;
}

function updateQuestion(q) {
  var row = findQuestionRow(q.id);
  if (row === -1) throw new Error('Soal tidak ditemukan');
  var sheet = getSS().getSheetByName(SHEET_QUESTIONS);
  sheet.getRange(row, 2, 1, 6).setValues([[
    q.question, q.options[0], q.options[1], q.options[2], q.options[3], q.correctIndex
  ]]);
}

function deleteQuestion(id) {
  var row = findQuestionRow(id);
  if (row === -1) throw new Error('Soal tidak ditemukan');
  getSS().getSheetByName(SHEET_QUESTIONS).deleteRow(row);
}

// ============ RANDOM QUESTION (tanpa jawaban benar dikirim) ============
function getRandomQuestion(excludeIds) {
  var all = getAllQuestions();
  if (all.length === 0) return null;
  var pool = all.filter(function (q) {
    return excludeIds.indexOf(q.id) === -1;
  });
  if (pool.length === 0) pool = all; // kalau semua sudah terpakai, ulangi dari awal (tetap acak)
  var picked = pool[Math.floor(Math.random() * pool.length)];
  return {
    id: picked.id,
    question: picked.question,
    options: picked.options
  };
}

function checkAnswer(id, selectedIndex) {
  var all = getAllQuestions();
  for (var i = 0; i < all.length; i++) {
    if (all[i].id === id) {
      return { correct: Number(selectedIndex) === all[i].correctIndex, correctIndex: all[i].correctIndex };
    }
  }
  return { correct: false, correctIndex: -1, error: 'not_found' };
}

// ============ ADMIN AUTH ============
function checkAdminPassword(pw) {
  var c = readConfig();
  return pw === c.adminPassword;
}

function requireAdmin(payload) {
  if (!payload || !checkAdminPassword(payload.password)) {
    throw new Error('UNAUTHORIZED');
  }
}

function logAction(action, detail) {
  try {
    var sheet = getSS().getSheetByName(SHEET_LOG);
    sheet.appendRow([new Date(), action, JSON.stringify(detail).slice(0, 500)]);
  } catch (e) { /* ignore logging errors */ }
}

// ============ HTTP ENTRY POINTS ============
function jsonOut(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function doGet(e) {
  ensureSheets();
  var action = e.parameter.action;
  try {
    if (action === 'getConfig') {
      return jsonOut({ ok: true, data: publicConfig() });
    }
    if (action === 'getRandomQuestion') {
      var exclude = (e.parameter.exclude || '').split(',').filter(String);
      return jsonOut({ ok: true, data: getRandomQuestion(exclude) });
    }
    if (action === 'checkAnswer') {
      var res = checkAnswer(e.parameter.id, e.parameter.selected);
      return jsonOut({ ok: true, data: res });
    }
    if (action === 'listQuestions') {
      if (!checkAdminPassword(e.parameter.password)) return jsonOut({ ok: false, error: 'UNAUTHORIZED' });
      return jsonOut({ ok: true, data: getAllQuestions() });
    }
    if (action === 'getFullConfig') {
      if (!checkAdminPassword(e.parameter.password)) return jsonOut({ ok: false, error: 'UNAUTHORIZED' });
      return jsonOut({ ok: true, data: readConfig() });
    }
    return jsonOut({ ok: false, error: 'UNKNOWN_ACTION' });
  } catch (err) {
    return jsonOut({ ok: false, error: String(err) });
  }
}

function doPost(e) {
  ensureSheets();
  var payload;
  try {
    payload = JSON.parse(e.postData.contents);
  } catch (err) {
    return jsonOut({ ok: false, error: 'INVALID_JSON' });
  }
  var action = payload.action;
  try {
    if (action === 'adminLogin') {
      var ok = checkAdminPassword(payload.password);
      return jsonOut({ ok: ok, data: { authenticated: ok } });
    }
    if (action === 'addQuestion') {
      requireAdmin(payload);
      var id = addQuestion(payload.question);
      logAction('addQuestion', payload.question);
      return jsonOut({ ok: true, data: { id: id } });
    }
    if (action === 'addQuestionsBulk') {
      requireAdmin(payload);
      var ids = addQuestionsBulk(payload.questions);
      logAction('addQuestionsBulk', { count: ids.length });
      return jsonOut({ ok: true, data: { ids: ids } });
    }
    if (action === 'updateQuestion') {
      requireAdmin(payload);
      updateQuestion(payload.question);
      logAction('updateQuestion', payload.question.id);
      return jsonOut({ ok: true });
    }
    if (action === 'deleteQuestion') {
      requireAdmin(payload);
      deleteQuestion(payload.id);
      logAction('deleteQuestion', payload.id);
      return jsonOut({ ok: true });
    }
    if (action === 'saveConfig') {
      requireAdmin(payload);
      var newConfig = payload.config;
      // password admin dipertahankan kecuali sengaja diganti lewat changePassword
      var current = readConfig();
      newConfig.adminPassword = current.adminPassword;
      writeConfig(newConfig);
      logAction('saveConfig', {});
      return jsonOut({ ok: true });
    }
    if (action === 'changePassword') {
      requireAdmin(payload);
      var c = readConfig();
      c.adminPassword = payload.newPassword;
      writeConfig(c);
      logAction('changePassword', {});
      return jsonOut({ ok: true });
    }
    return jsonOut({ ok: false, error: 'UNKNOWN_ACTION' });
  } catch (err) {
    return jsonOut({ ok: false, error: String(err) });
  }
}
