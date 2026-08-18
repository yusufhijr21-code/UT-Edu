// ============================================================
// Wrapper pemanggilan API ke Google Apps Script.
// POST dikirim sebagai text/plain agar browser tidak melakukan
// CORS preflight (OPTIONS) yang tidak didukung baik oleh Apps Script.
// ============================================================

const Api = {
  async get(action, params) {
    const url = new URL(API_URL);
    url.searchParams.set('action', action);
    for (const k in (params || {})) url.searchParams.set(k, params[k]);
    const res = await fetch(url.toString());
    const json = await res.json();
    if (!json.ok) throw new Error(json.error || 'Gagal memuat data');
    return json.data;
  },

  async post(body) {
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(body)
    });
    const json = await res.json();
    if (!json.ok) throw new Error(json.error || 'Gagal menyimpan data');
    return json.data;
  },

  getConfig() { return this.get('getConfig'); },
  getRandomQuestion(excludeIds) { return this.get('getRandomQuestion', { exclude: (excludeIds || []).join(',') }); },
  checkAnswer(id, selected) { return this.get('checkAnswer', { id, selected }); },

  // ---- admin ----
  adminLogin(password) { return this.post({ action: 'adminLogin', password }); },
  listQuestions(password) { return this.get('listQuestions', { password }); },
  getFullConfig(password) { return this.get('getFullConfig', { password }); },
  addQuestion(password, question) { return this.post({ action: 'addQuestion', password, question }); },
  addQuestionsBulk(password, questions) { return this.post({ action: 'addQuestionsBulk', password, questions }); },
  updateQuestion(password, question) { return this.post({ action: 'updateQuestion', password, question }); },
  deleteQuestion(password, id) { return this.post({ action: 'deleteQuestion', password, id }); },
  saveConfig(password, config) { return this.post({ action: 'saveConfig', password, config }); },
  changePassword(password, newPassword) { return this.post({ action: 'changePassword', password, newPassword }); }
};
