// ════════════════════════════════════════════════════
//  API.JS — Google Sheets & Calendar via REST + Apps Script
// ════════════════════════════════════════════════════

const API = (() => {
  const BASE = 'https://sheets.googleapis.com/v4/spreadsheets';
  const CAL  = 'https://www.googleapis.com/calendar/v3';

  // ── Helpers ────────────────────────────────────────
  function authHeader() {
    const token = Auth.getToken();
    if (!token) throw new Error('Tidak login');
    return { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
  }

  async function sheetsGet(range) {
    const url = `${BASE}/${CONFIG.SPREADSHEET_ID}/values/${encodeURIComponent(range)}`;
    const res = await fetch(url, { headers: authHeader() });
    if (!res.ok) throw new Error(`Sheets GET error: ${res.status}`);
    const data = await res.json();
    return data.values || [];
  }

  async function sheetsAppend(range, values) {
    const url = `${BASE}/${CONFIG.SPREADSHEET_ID}/values/${encodeURIComponent(range)}:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`;
    const res = await fetch(url, {
      method: 'POST', headers: authHeader(),
      body: JSON.stringify({ values })
    });
    if (!res.ok) throw new Error(`Sheets APPEND error: ${res.status}`);
    return res.json();
  }

  async function sheetsUpdate(range, values) {
    const url = `${BASE}/${CONFIG.SPREADSHEET_ID}/values/${encodeURIComponent(range)}?valueInputOption=USER_ENTERED`;
    const res = await fetch(url, {
      method: 'PUT', headers: authHeader(),
      body: JSON.stringify({ range, values })
    });
    if (!res.ok) throw new Error(`Sheets UPDATE error: ${res.status}`);
    return res.json();
  }

  async function sheetsClear(range) {
    const url = `${BASE}/${CONFIG.SPREADSHEET_ID}/values/${encodeURIComponent(range)}:clear`;
    const res = await fetch(url, { method: 'POST', headers: authHeader() });
    if (!res.ok) throw new Error(`Sheets CLEAR error: ${res.status}`);
    return res.json();
  }

  // Converts array of rows → array of objects using header row
  function rowsToObjects(rows) {
    if (!rows || rows.length < 2) return [];
    const headers = rows[0];
    return rows.slice(1).map((row, idx) => {
      const obj = { _rowIndex: idx + 2 }; // 1-indexed, skip header
      headers.forEach((h, i) => { obj[h] = row[i] || ''; });
      return obj;
    });
  }

  // ── Apps Script Fallback (for delete ops & batch writes) ──
  async function scriptCall(action, payload) {
    if (!CONFIG.APPS_SCRIPT_URL || CONFIG.APPS_SCRIPT_URL.startsWith('YOUR_')) {
      throw new Error('Apps Script URL belum diisi di config.js');
    }
    const token = Auth.getToken();
    const res = await fetch(CONFIG.APPS_SCRIPT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, token, spreadsheetId: CONFIG.SPREADSHEET_ID, ...payload })
    });
    if (!res.ok) throw new Error(`Apps Script error: ${res.status}`);
    return res.json();
  }

  // ══ COURSES ════════════════════════════════════════
  async function getCourses() {
    const rows = await sheetsGet(`${CONFIG.SHEETS.COURSES}!A:H`);
    return rowsToObjects(rows);
  }

  async function addCourse(data) {
    const row = [data.id, data.name, data.lecturer, data.day, data.time, data.room, data.link, data.notes];
    await sheetsAppend(`${CONFIG.SHEETS.COURSES}!A:H`, [row]);
  }

  async function updateCourse(rowIndex, data) {
    const row = [data.id, data.name, data.lecturer, data.day, data.time, data.room, data.link, data.notes];
    await sheetsUpdate(`${CONFIG.SHEETS.COURSES}!A${rowIndex}:H${rowIndex}`, [row]);
  }

  async function deleteCourse(rowIndex) {
    await scriptCall('deleteRow', { sheet: CONFIG.SHEETS.COURSES, rowIndex });
  }

  // ══ TASKS ══════════════════════════════════════════
  async function getTasks() {
    const rows = await sheetsGet(`${CONFIG.SHEETS.TASKS}!A:I`);
    return rowsToObjects(rows);
  }

  async function addTask(data) {
    const row = [data.id, data.title, data.subject, data.priority, data.dueDate, data.status, data.notes, data.createdAt, data.completedAt || ''];
    await sheetsAppend(`${CONFIG.SHEETS.TASKS}!A:I`, [row]);
  }

  async function updateTask(rowIndex, data) {
    const row = [data.id, data.title, data.subject, data.priority, data.dueDate, data.status, data.notes, data.createdAt, data.completedAt || ''];
    await sheetsUpdate(`${CONFIG.SHEETS.TASKS}!A${rowIndex}:I${rowIndex}`, [row]);
  }

  async function deleteTask(rowIndex) {
    await scriptCall('deleteRow', { sheet: CONFIG.SHEETS.TASKS, rowIndex });
  }

  // ══ GYM PLANS ══════════════════════════════════════
  async function getGymPlans() {
    const rows = await sheetsGet(`${CONFIG.SHEETS.GYM_PLANS}!A:G`);
    return rowsToObjects(rows);
  }

  async function addGymExercise(data) {
    const row = [data.id, data.day, data.category, data.exercise, data.sets, data.reps, data.weight];
    await sheetsAppend(`${CONFIG.SHEETS.GYM_PLANS}!A:G`, [row]);
  }

  async function deleteGymExercise(rowIndex) {
    await scriptCall('deleteRow', { sheet: CONFIG.SHEETS.GYM_PLANS, rowIndex });
  }

  // ══ GYM LOGS ═══════════════════════════════════════
  async function getGymLogs(dateFrom, dateTo) {
    const rows = await sheetsGet(`${CONFIG.SHEETS.GYM_LOGS}!A:E`);
    const all = rowsToObjects(rows);
    if (!dateFrom) return all;
    return all.filter(r => r.date >= dateFrom && r.date <= dateTo);
  }

  async function toggleGymLog(data) {
    const row = [data.id, data.date, data.exerciseId, data.done, data.timestamp];
    await sheetsAppend(`${CONFIG.SHEETS.GYM_LOGS}!A:E`, [row]);
  }

  // ══ HABITS ═════════════════════════════════════════
  async function getHabits() {
    const rows = await sheetsGet(`${CONFIG.SHEETS.HABITS}!A:D`);
    return rowsToObjects(rows);
  }

  async function addHabit(data) {
    const row = [data.id, data.name, data.icon, data.active];
    await sheetsAppend(`${CONFIG.SHEETS.HABITS}!A:D`, [row]);
  }

  async function deleteHabit(rowIndex) {
    await scriptCall('deleteRow', { sheet: CONFIG.SHEETS.HABITS, rowIndex });
  }

  async function getHabitLogs(dateFrom, dateTo) {
    const rows = await sheetsGet(`${CONFIG.SHEETS.HABIT_LOGS}!A:D`);
    const all = rowsToObjects(rows);
    if (!dateFrom) return all;
    return all.filter(r => r.date >= dateFrom && r.date <= dateTo);
  }

  async function logHabit(data) {
    const row = [data.id, data.date, data.habitId, data.done];
    await sheetsAppend(`${CONFIG.SHEETS.HABIT_LOGS}!A:D`, [row]);
  }

  // ══ WATER ══════════════════════════════════════════
  async function getWaterLogs(dateFrom, dateTo) {
    const rows = await sheetsGet(`${CONFIG.SHEETS.WATER}!A:C`);
    const all = rowsToObjects(rows);
    if (!dateFrom) return all;
    return all.filter(r => r.date >= dateFrom && r.date <= dateTo);
  }

  async function logWater(data) {
    const row = [data.id, data.date, data.glasses];
    await sheetsAppend(`${CONFIG.SHEETS.WATER}!A:C`, [row]);
  }

  async function updateWater(rowIndex, data) {
    const row = [data.id, data.date, data.glasses];
    await sheetsUpdate(`${CONFIG.SHEETS.WATER}!A${rowIndex}:C${rowIndex}`, [row]);
  }

  // ══ FINANCE ════════════════════════════════════════
  async function getFinance(dateFrom, dateTo) {
    const rows = await sheetsGet(`${CONFIG.SHEETS.FINANCE}!A:F`);
    const all = rowsToObjects(rows);
    if (!dateFrom) return all;
    return all.filter(r => r.date >= dateFrom && r.date <= dateTo);
  }

  async function addExpense(data) {
    const row = [data.id, data.date, data.category, data.description, data.amount, data.type];
    await sheetsAppend(`${CONFIG.SHEETS.FINANCE}!A:F`, [row]);
  }

  async function deleteExpense(rowIndex) {
    await scriptCall('deleteRow', { sheet: CONFIG.SHEETS.FINANCE, rowIndex });
  }

  // ══ GOOGLE CALENDAR ════════════════════════════════
  async function getCalendarEvents(timeMin, timeMax) {
    const params = new URLSearchParams({
      timeMin: timeMin.toISOString(),
      timeMax: timeMax.toISOString(),
      singleEvents: true,
      orderBy: 'startTime',
      maxResults: 100,
    });
    const url = `${CAL}/calendars/${encodeURIComponent(CONFIG.CALENDAR_ID)}/events?${params}`;
    const res = await fetch(url, { headers: authHeader() });
    if (!res.ok) throw new Error(`Calendar error: ${res.status}`);
    const data = await res.json();
    return data.items || [];
  }

  return {
    getCourses, addCourse, updateCourse, deleteCourse,
    getTasks, addTask, updateTask, deleteTask,
    getGymPlans, addGymExercise, deleteGymExercise,
    getGymLogs, toggleGymLog,
    getHabits, addHabit, deleteHabit, getHabitLogs, logHabit,
    getWaterLogs, logWater, updateWater,
    getFinance, addExpense, deleteExpense,
    getCalendarEvents,
  };
})();
