// ════════════════════════════════════════════════════
//  STORE.JS — Local state + sync ke Google Sheets
// ════════════════════════════════════════════════════

const Store = (() => {
  let state = {
    courses: [], tasks: [], gymPlans: [], gymLogs: [],
    habits: [], habitLogs: [], waterLogs: [], finance: [],
    calendarEvents: [],
    settings: {
      waterTarget: 8,
      budgetDaily: 50000,
      gymSchedule: {
        Senin: 'Push Day', Selasa: 'Pull Day', Rabu: 'Leg Day',
        Kamis: 'Push Day', Jumat: 'Pull Day', Sabtu: 'Cardio', Minggu: 'Rest'
      }
    },
    loaded: { courses: false, tasks: false, gymPlans: false, habits: false, finance: false }
  };

  const listeners = [];

  function subscribe(fn) { listeners.push(fn); }
  function notify(key) { listeners.forEach(fn => fn(key, state)); }

  function get(key) { return state[key]; }
  function set(key, val) { state[key] = val; notify(key); }

  // ── Load All Data ───────────────────────────────────
  async function loadAll() {
    if (!Auth.isLoggedIn()) return;
    await Promise.allSettled([
      loadCourses(), loadTasks(), loadGymPlans(),
      loadHabits(), loadFinance(), loadWater(), loadHabitLogs()
    ]);
    loadCalendarEvents();
  }

  async function loadCourses() {
    try {
      const data = await API.getCourses();
      state.courses = data;
      state.loaded.courses = true;
      notify('courses');
    } catch (e) { handleApiError(e, 'courses'); }
  }

  async function loadTasks() {
    try {
      const data = await API.getTasks();
      state.tasks = data;
      state.loaded.tasks = true;
      notify('tasks');
    } catch (e) { handleApiError(e, 'tasks'); }
  }

  async function loadGymPlans() {
    try {
      const data = await API.getGymPlans();
      state.gymPlans = data;
      state.loaded.gymPlans = true;
      notify('gymPlans');
    } catch (e) { handleApiError(e, 'gymPlans'); }
  }

  async function loadHabits() {
    try {
      const data = await API.getHabits();
      state.habits = data;
      notify('habits');
    } catch (e) { handleApiError(e, 'habits'); }
  }

  async function loadHabitLogs() {
    try {
      const { from, to } = Utils.monthRange();
      const data = await API.getHabitLogs(from, to);
      state.habitLogs = data;
      notify('habitLogs');
    } catch (e) { handleApiError(e, 'habitLogs'); }
  }

  async function loadWater() {
    try {
      const { from, to } = Utils.monthRange();
      const data = await API.getWaterLogs(from, to);
      state.waterLogs = data;
      notify('waterLogs');
    } catch (e) { handleApiError(e, 'waterLogs'); }
  }

  async function loadFinance() {
    try {
      const { from, to } = Utils.monthRange();
      const data = await API.getFinance(from, to);
      state.finance = data;
      state.loaded.finance = true;
      notify('finance');
    } catch (e) { handleApiError(e, 'finance'); }
  }

  async function loadCalendarEvents() {
    try {
      const now = new Date();
      const from = new Date(now.getFullYear(), now.getMonth(), 1);
      const to   = new Date(now.getFullYear(), now.getMonth() + 2, 0);
      const data = await API.getCalendarEvents(from, to);
      state.calendarEvents = data;
      notify('calendarEvents');
    } catch (e) { if (CONFIG.DEBUG) console.warn('[Calendar]', e.message); }
  }

  // ── Mutation Helpers ────────────────────────────────
  function handleApiError(e, context) {
    if (CONFIG.DEBUG) console.error(`[Store:${context}]`, e.message);
    // Silently use cached / empty data if offline
  }

  function reset() {
    state.courses = []; state.tasks = []; state.gymPlans = [];
    state.gymLogs = []; state.habits = []; state.habitLogs = [];
    state.waterLogs = []; state.finance = []; state.calendarEvents = [];
    Object.keys(state.loaded).forEach(k => state.loaded[k] = false);
    notify('reset');
  }

  // ── Quick Computed Getters ──────────────────────────
  function todayTasks() {
    const today = Utils.dateStr();
    return state.tasks.filter(t => t.dueDate === today || t.status === 'pending');
  }

  function todayGymLogs() {
    const today = Utils.dateStr();
    return state.gymLogs.filter(l => l.date === today);
  }

  function todayWater() {
    const today = Utils.dateStr();
    return state.waterLogs.find(w => w.date === today) || null;
  }

  function todayHabitLogs() {
    const today = Utils.dateStr();
    return state.habitLogs.filter(l => l.date === today);
  }

  // Productivity score for a date (0-100)
  function productivityScore(dateStr) {
    const tasks = state.tasks.filter(t => t.dueDate === dateStr);
    const done  = tasks.filter(t => t.status === 'done').length;
    const tScore = tasks.length ? (done / tasks.length) * 40 : 0;

    const dayName = Utils.dayName(new Date(dateStr));
    const plan = state.gymPlans.filter(g => g.day === dayName);
    const logs = state.gymLogs.filter(l => l.date === dateStr && l.done === 'TRUE');
    const gScore = plan.length ? Math.min((logs.length / plan.length) * 30, 30) : 15;

    const hLogs = state.habitLogs.filter(l => l.date === dateStr && l.done === 'TRUE');
    const hTotal = state.habits.filter(h => h.active === 'TRUE').length;
    const hScore = hTotal ? (hLogs.length / hTotal) * 30 : 15;

    return Math.round(tScore + gScore + hScore);
  }

  function getSettings() { return state.settings; }
  function updateSettings(patch) {
    state.settings = { ...state.settings, ...patch };
    localStorage.setItem('pt_settings', JSON.stringify(state.settings));
    notify('settings');
  }

  // Load persisted settings
  const savedSettings = localStorage.getItem('pt_settings');
  if (savedSettings) try { state.settings = { ...state.settings, ...JSON.parse(savedSettings) }; } catch(_) {}

  return {
    get, set, subscribe, notify,
    loadAll, loadCourses, loadTasks, loadGymPlans,
    loadHabits, loadHabitLogs, loadWater, loadFinance, loadCalendarEvents,
    todayTasks, todayGymLogs, todayWater, todayHabitLogs,
    productivityScore, reset,
    getSettings, updateSettings,
  };
})();
