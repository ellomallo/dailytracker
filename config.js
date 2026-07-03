// ════════════════════════════════════════════════════════
//  CONFIG.JS — Isi dengan kredensial Anda sebelum deploy
// ════════════════════════════════════════════════════════

const CONFIG = {
  // ── Google OAuth ──────────────────────────────────────
  // Buat di: https://console.cloud.google.com/
  // 1. Enable Google Sheets API + Google Calendar API
  // 2. Buat OAuth 2.0 Client ID (Web Application)
  // 3. Tambahkan domain Anda ke Authorized JavaScript origins
  GOOGLE_CLIENT_ID: '104729429011-ickjodfts0ja1a3ogrb49b3vrvlr0kno.apps.googleusercontent.com',

  // ── Google Apps Script (Backend REST API) ─────────────
  // URL dari Web App deployment Google Apps Script Anda
  // Lihat file google-apps-script.js untuk kode script-nya
  APPS_SCRIPT_URL: 'https://script.google.com/macros/s/AKfycbwohE1k_RGLmZn62Uqxe7eYB44BJwC5r-l69eycvWtuWlEV4ShfGVg_lbuMKPhNqBK_/exec',

  // ── Google Sheets Spreadsheet ID ──────────────────────
  // Ambil dari URL spreadsheet:
  // https://docs.google.com/spreadsheets/d/[SPREADSHEET_ID]/edit
  SPREADSHEET_ID: '1VUBcgxdpjtKUZz1fdTHUQ_en5l7W8IZV-_1_XyB5nXk',

  // ── Google Calendar ───────────────────────────────────
  // Kosongkan untuk menggunakan primary calendar
  CALENDAR_ID: 'primary',

  // ── App Settings ──────────────────────────────────────
  APP_NAME: 'Daily Productivity Tracker',
  VERSION: '1.0.0',
  DEBUG: false, // Set true untuk melihat log di console

  // ── Scopes (jangan diubah) ────────────────────────────
  SCOPES: [
    'https://www.googleapis.com/auth/spreadsheets',
    'https://www.googleapis.com/auth/calendar.readonly',
    'https://www.googleapis.com/auth/userinfo.profile',
  ].join(' '),

  // ── Sheet Names (sesuaikan jika berbeda) ──────────────
  SHEETS: {
    COURSES:   'Mata_Kuliah',
    TASKS:     'Tugas',
    GYM_PLANS: 'Gym_Plan',
    GYM_LOGS:  'Gym_Log',
    HABITS:    'Habits',
    HABIT_LOGS:'Habit_Log',
    WATER:     'Water_Log',
    FINANCE:   'Finance',
  }
};

// Freeze untuk mencegah perubahan tidak sengaja
Object.freeze(CONFIG);
Object.freeze(CONFIG.SHEETS);
