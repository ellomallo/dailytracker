// ════════════════════════════════════════════════════
//  PAGES/SETTINGS.JS
// ════════════════════════════════════════════════════

const SettingsPage = {
  render() {
    const settings = Store.getSettings();
    const user = Auth.getUser();

    return `
    <div class="space-y-6 animate-slide-up">
      <h2 class="text-xl font-semibold text-white">Pengaturan</h2>

      <!-- Account -->
      <div class="card">
        <h3 class="font-semibold text-white text-sm mb-4">👤 Akun Google</h3>
        ${user ? `
        <div class="flex items-center gap-4">
          <div class="w-12 h-12 rounded-full bg-brand-600 flex items-center justify-center text-lg font-bold text-white">
            ${(user.name||'U')[0].toUpperCase()}
          </div>
          <div class="flex-1">
            <div class="font-medium text-white">${Utils.escHtml(user.name || '')}</div>
            <div class="text-sm text-slate-400">${Utils.escHtml(user.email || '')}</div>
          </div>
          <button onclick="Auth.logout()" class="btn-danger">Logout</button>
        </div>` : `
        <div class="flex items-center gap-4">
          <div class="w-12 h-12 rounded-full bg-slate-700 flex items-center justify-center text-xl">👤</div>
          <div class="flex-1">
            <div class="font-medium text-white">Belum Login</div>
            <div class="text-sm text-slate-400">Login untuk menyinkronkan data ke Google Sheets</div>
          </div>
          <button onclick="Auth.login()" class="btn-primary">Login Google</button>
        </div>`}
      </div>

      <!-- Google Sheets Config -->
      <div class="card">
        <h3 class="font-semibold text-white text-sm mb-4">📊 Konfigurasi Google Sheets</h3>
        <div class="space-y-3">
          <div>
            <label class="form-label">Google Client ID</label>
            <input id="s_clientId" class="form-input font-mono text-xs"
              placeholder="xxxxx.apps.googleusercontent.com"
              value="${Utils.escHtml(CONFIG.GOOGLE_CLIENT_ID.startsWith('YOUR') ? '' : CONFIG.GOOGLE_CLIENT_ID)}">
          </div>
          <div>
            <label class="form-label">Spreadsheet ID</label>
            <input id="s_sheetId" class="form-input font-mono text-xs"
              placeholder="1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgVE2upms"
              value="${Utils.escHtml(CONFIG.SPREADSHEET_ID.startsWith('YOUR') ? '' : CONFIG.SPREADSHEET_ID)}">
          </div>
          <div>
            <label class="form-label">Apps Script Web App URL</label>
            <input id="s_scriptUrl" class="form-input font-mono text-xs"
              placeholder="https://script.google.com/macros/s/.../exec"
              value="${Utils.escHtml(CONFIG.APPS_SCRIPT_URL.startsWith('YOUR') ? '' : CONFIG.APPS_SCRIPT_URL)}">
          </div>
          <div class="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 text-sm text-amber-200">
            ⚠️ Simpan perubahan konfigurasi langsung di file <code class="font-mono text-xs bg-amber-500/20 px-1 rounded">js/config.js</code> untuk hasil permanen.
          </div>
        </div>
      </div>

      <!-- Preferences -->
      <div class="card">
        <h3 class="font-semibold text-white text-sm mb-4">⚙️ Preferensi</h3>
        <div class="space-y-4">
          <div class="flex items-center justify-between">
            <div>
              <div class="text-sm font-medium text-white">Dark Mode</div>
              <div class="text-xs text-slate-400">Tampilan gelap untuk kenyamanan mata</div>
            </div>
            <button onclick="toggleDarkMode(); App.rerenderPage()"
              class="w-12 h-6 rounded-full transition-colors relative
              ${document.documentElement.classList.contains('dark') ? 'bg-brand-500' : 'bg-slate-600'}">
              <div class="w-5 h-5 bg-white rounded-full absolute top-0.5 transition-all
                ${document.documentElement.classList.contains('dark') ? 'left-6' : 'left-0.5'}"></div>
            </button>
          </div>

          <div class="border-t border-slate-700/50 pt-4">
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="form-label">Target Air Minum (gelas/hari)</label>
                <input id="s_water" type="number" class="form-input" value="${settings.waterTarget}" min="1" max="20">
              </div>
              <div>
                <label class="form-label">Budget Harian (Rp)</label>
                <input id="s_budget" type="number" class="form-input" value="${settings.budgetDaily}" min="0">
              </div>
            </div>
          </div>

          <button onclick="SettingsPage.savePrefs()" class="btn-primary w-full">Simpan Preferensi</button>
        </div>
      </div>

      <!-- Setup Guide -->
      <div class="card">
        <h3 class="font-semibold text-white text-sm mb-4">🚀 Panduan Setup</h3>
        <div class="space-y-3 text-sm">
          ${[
            ['1', 'Buat Google Spreadsheet baru', 'Tambahkan sheet: Mata_Kuliah, Tugas, Gym_Plan, Gym_Log, Habits, Habit_Log, Water_Log, Finance'],
            ['2', 'Setup Google Cloud Project', 'Enable Sheets API + Calendar API, buat OAuth 2.0 Client ID'],
            ['3', 'Deploy Google Apps Script', 'Buat script dengan kode dari file google-apps-script.js, deploy sebagai Web App'],
            ['4', 'Isi config.js', 'Masukkan Client ID, Spreadsheet ID, dan Apps Script URL'],
            ['5', 'Login & Mulai', 'Klik Login Google dan mulai gunakan aplikasi'],
          ].map(([n, title, desc]) => `
          <div class="flex gap-3">
            <div class="w-6 h-6 rounded-full bg-brand-600/20 border border-brand-500/30 flex items-center justify-center text-xs font-bold text-brand-400 flex-shrink-0 mt-0.5">${n}</div>
            <div>
              <div class="font-medium text-white">${title}</div>
              <div class="text-xs text-slate-400 mt-0.5">${desc}</div>
            </div>
          </div>`).join('')}
        </div>
      </div>

      <!-- Data Actions -->
      <div class="card">
        <h3 class="font-semibold text-white text-sm mb-4">🗄️ Data</h3>
        <div class="flex flex-wrap gap-3">
          <button onclick="Store.loadAll(); showToast('Menyinkronkan semua data…', 'info')" class="btn-secondary">
            🔄 Sync Ulang
          </button>
          <button onclick="SettingsPage.exportLocal()" class="btn-secondary">
            💾 Export Local JSON
          </button>
          <button onclick="SettingsPage.clearLocal()" class="btn-danger">
            🗑️ Hapus Cache Lokal
          </button>
        </div>
      </div>
    </div>`;
  },

  savePrefs() {
    const water = parseInt(document.getElementById('s_water')?.value) || 8;
    const budget = parseFloat(document.getElementById('s_budget')?.value) || 50000;
    Store.updateSettings({ waterTarget: water, budgetDaily: budget });
    showToast('Preferensi disimpan', 'success');
  },

  exportLocal() {
    const data = {
      courses: Store.get('courses'),
      tasks: Store.get('tasks'),
      gymPlans: Store.get('gymPlans'),
      habits: Store.get('habits'),
      finance: Store.get('finance'),
      exportedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `productivity-backup-${Utils.dateStr()}.json`;
    a.click();
    showToast('Data berhasil diexport', 'success');
  },

  clearLocal() {
    if (!confirm('Hapus semua cache lokal? Data di Google Sheets tidak terpengaruh.')) return;
    sessionStorage.clear();
    Store.reset();
    showToast('Cache lokal dihapus', 'info');
  }
};
