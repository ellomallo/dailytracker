// ════════════════════════════════════════════════════
//  PAGES/HABITS.JS
// ════════════════════════════════════════════════════

const HabitsPage = {
  render() {
    const habits = Store.get('habits').filter(h => h.active === 'TRUE' || h.active === '1' || h.active === true);
    const habitLogs = Store.get('habitLogs');
    const waterLogs = Store.get('waterLogs');
    const settings = Store.getSettings();
    const today = Utils.dateStr();
    const todayHabitLogs = habitLogs.filter(l => l.date === today);
    const waterToday = waterLogs.find(w => w.date === today);
    const glasses = waterToday ? parseInt(waterToday.glasses || 0) : 0;

    return `
    <div class="space-y-6 animate-slide-up">
      <div class="flex items-center justify-between">
        <h2 class="text-xl font-semibold text-white">Habit & Air Minum</h2>
        <button onclick="HabitsPage.openHabitForm()" class="btn-primary">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
          Tambah Habit
        </button>
      </div>

      <!-- Water Tracker -->
      <div class="card">
        <div class="flex items-center justify-between mb-4">
          <div>
            <h3 class="font-semibold text-white">💧 Water Tracker</h3>
            <p class="text-sm text-slate-400 mt-0.5">Target: ${settings.waterTarget} gelas hari ini</p>
          </div>
          <div class="text-right">
            <div class="text-2xl font-bold text-blue-400">${glasses}</div>
            <div class="text-xs text-slate-400">/ ${settings.waterTarget} gelas</div>
          </div>
        </div>
        
        <!-- Progress bar -->
        <div class="h-3 bg-slate-700 rounded-full overflow-hidden mb-4">
          <div class="h-full rounded-full transition-all duration-500 bg-gradient-to-r from-blue-600 to-cyan-400"
            style="width:${Math.min((glasses/settings.waterTarget)*100, 100)}%"></div>
        </div>

        <!-- Glass buttons -->
        <div class="flex flex-wrap gap-2">
          ${Array.from({length: settings.waterTarget}, (_, i) => `
          <button onclick="HabitsPage.setWater(${i+1})"
            class="water-glass ${i < glasses ? 'filled' : ''}"
            title="${i+1} gelas">
          </button>`).join('')}
          <div class="flex items-center gap-2 ml-2">
            <button onclick="HabitsPage.adjustWater(-1)" class="btn-secondary py-1 px-2 text-xs">−</button>
            <button onclick="HabitsPage.adjustWater(1)" class="btn-secondary py-1 px-2 text-xs">+</button>
          </div>
        </div>
        <p class="text-xs text-slate-500 mt-3">
          ${glasses >= settings.waterTarget ? '🎉 Target air minum hari ini tercapai!' : 
            `Butuh ${settings.waterTarget - glasses} gelas lagi untuk mencapai target`}
        </p>
      </div>

      <!-- Habits -->
      <div class="card">
        <h3 class="font-semibold text-white mb-4">✅ Kebiasaan Harian</h3>
        
        ${!habits.length ? `
        <div class="text-center py-8">
          <div class="text-3xl mb-2">🌱</div>
          <p class="text-slate-400 text-sm mb-3">Belum ada kebiasaan ditambahkan</p>
          <button onclick="HabitsPage.openHabitForm()" class="btn-secondary text-xs">Tambah Kebiasaan</button>
        </div>` : ''}

        <div class="space-y-2">
          ${habits.map(h => {
            const done = todayHabitLogs.some(l => l.habitId === h.id && l.done === 'TRUE');
            return `
            <div class="flex items-center gap-3 p-3 rounded-xl ${done ? 'bg-brand-500/10 border border-brand-500/20' : 'bg-surface-700/40'} transition-all group">
              <button onclick="HabitsPage.toggleHabit('${h.id}', ${done})"
                class="w-6 h-6 rounded-lg border-2 flex-shrink-0 flex items-center justify-center transition-all font-bold text-xs
                ${done ? 'bg-brand-500 border-brand-500 text-white' : 'border-slate-500 hover:border-brand-400'}">
                ${done ? '✓' : ''}
              </button>
              <span class="text-xl">${Utils.escHtml(h.icon || '📌')}</span>
              <div class="flex-1">
                <p class="font-medium text-sm text-white ${done ? 'line-through opacity-70' : ''}">${Utils.escHtml(h.name)}</p>
              </div>
              ${done ? '<span class="text-xs text-brand-400">Selesai ✓</span>' : ''}
              <button onclick="HabitsPage.deleteHabit('${h.id}', ${h._rowIndex})"
                class="text-slate-600 hover:text-rose-400 opacity-0 group-hover:opacity-100 transition-all">✕</button>
            </div>`;
          }).join('')}
        </div>
        
        ${habits.length ? `
        <div class="mt-4 pt-4 border-t border-slate-700/50">
          <div class="flex items-center justify-between text-sm">
            <span class="text-slate-400">Selesai hari ini</span>
            <span class="font-semibold text-white">${todayHabitLogs.filter(l=>l.done==='TRUE').length} / ${habits.length}</span>
          </div>
          <div class="h-2 bg-slate-700 rounded-full overflow-hidden mt-2">
            <div class="h-full bg-brand-500 rounded-full transition-all"
              style="width:${habits.length ? (todayHabitLogs.filter(l=>l.done==='TRUE').length/habits.length)*100 : 0}%"></div>
          </div>
        </div>` : ''}
      </div>

      <!-- Weekly habit summary -->
      <div class="card">
        <h3 class="font-semibold text-white mb-4">📊 Konsistensi 7 Hari Terakhir</h3>
        <div class="grid grid-cols-7 gap-2">
          ${Array.from({length:7}, (_, i) => {
            const d = new Date(); d.setDate(d.getDate() - 6 + i);
            const ds = Utils.dateStr(d);
            const dayLogs = habitLogs.filter(l => l.date === ds && l.done === 'TRUE');
            const pct = habits.length ? Math.round((dayLogs.length / habits.length) * 100) : 0;
            return `
            <div class="text-center">
              <div class="text-xs text-slate-500 mb-1">${Utils.dayName(d).slice(0,3)}</div>
              <div class="mx-auto w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold transition-all
                ${pct >= 80 ? 'bg-brand-500 text-white' : pct >= 50 ? 'bg-amber-500/30 text-amber-400' : pct > 0 ? 'bg-slate-700 text-slate-300' : 'bg-surface-700 text-slate-600'}">
                ${pct ? pct+'%' : '-'}
              </div>
            </div>`;
          }).join('')}
        </div>
      </div>
    </div>`;
  },

  openHabitForm() {
    openModal(`
    <div class="p-6">
      <div class="flex items-center justify-between mb-6">
        <h3 class="font-semibold text-white">Tambah Kebiasaan</h3>
        <button onclick="closeModal()" class="text-slate-400 hover:text-white">✕</button>
      </div>
      <div class="space-y-4">
        <div class="grid grid-cols-4 gap-3">
          <div class="col-span-1">
            <label class="form-label">Ikon</label>
            <input id="hf_icon" class="form-input text-center text-xl" placeholder="📌" maxlength="2">
          </div>
          <div class="col-span-3">
            <label class="form-label">Nama Kebiasaan *</label>
            <input id="hf_name" class="form-input" placeholder="Membaca buku 30 menit...">
          </div>
        </div>
        <!-- Quick pick -->
        <div>
          <label class="form-label">Cepat Pilih</label>
          <div class="flex flex-wrap gap-2">
            ${[['📚','Membaca'],['💻','Coding'],['🏃','Olahraga'],['🧘','Meditasi'],['📝','Jurnal'],['🌙','Tidur Cukup'],['🥗','Makan Sehat'],['📵','No HP']].map(([i,n])=>`
            <button onclick="document.getElementById('hf_icon').value='${i}';document.getElementById('hf_name').value='${n}'"
              class="flex items-center gap-1 text-xs bg-surface-700 hover:bg-surface-600 px-2 py-1.5 rounded-lg transition-colors">
              ${i} ${n}
            </button>`).join('')}
          </div>
        </div>
        <div class="flex gap-3 pt-2">
          <button onclick="closeModal()" class="btn-secondary flex-1">Batal</button>
          <button onclick="HabitsPage.saveHabit()" class="btn-primary flex-1">Tambah</button>
        </div>
      </div>
    </div>`);
  },

  async saveHabit() {
    const name = Utils.$('#hf_name').value.trim();
    if (!name) { showToast('Nama kebiasaan wajib diisi', 'error'); return; }
    if (!Auth.isLoggedIn()) { showToast('Login Google untuk menyimpan', 'error'); return; }

    const data = { id: Utils.uid(), name, icon: Utils.$('#hf_icon').value.trim() || '📌', active: 'TRUE' };
    try {
      await API.addHabit(data);
      await Store.loadHabits();
      closeModal();
      showToast('Kebiasaan ditambahkan!', 'success');
      App.rerenderPage();
    } catch (e) { showToast('Gagal: ' + e.message, 'error'); }
  },

  async toggleHabit(habitId, isDone) {
    if (!Auth.isLoggedIn()) { showToast('Login Google untuk mencatat', 'error'); return; }
    const data = { id: Utils.uid(), date: Utils.dateStr(), habitId, done: (!isDone).toString().toUpperCase() };
    try {
      await API.logHabit(data);
      const logs = Store.get('habitLogs');
      const filtered = logs.filter(l => !(l.date === Utils.dateStr() && l.habitId === habitId));
      Store.set('habitLogs', [...filtered, data]);
      App.rerenderPage();
    } catch (e) { showToast('Gagal: ' + e.message, 'error'); }
  },

  async setWater(n) {
    await this._saveWater(n);
  },

  async adjustWater(delta) {
    const waterLogs = Store.get('waterLogs');
    const today = Utils.dateStr();
    const w = waterLogs.find(x => x.date === today);
    const current = w ? parseInt(w.glasses || 0) : 0;
    const next = Math.max(0, Math.min(current + delta, 20));
    await this._saveWater(next);
  },

  async _saveWater(glasses) {
    if (!Auth.isLoggedIn()) { showToast('Login Google untuk mencatat', 'error'); return; }
    const today = Utils.dateStr();
    const waterLogs = Store.get('waterLogs');
    const existing = waterLogs.find(w => w.date === today);
    try {
      if (existing) {
        await API.updateWater(existing._rowIndex, { ...existing, glasses: String(glasses) });
        Store.set('waterLogs', waterLogs.map(w => w.date === today ? { ...w, glasses: String(glasses) } : w));
      } else {
        const data = { id: Utils.uid(), date: today, glasses: String(glasses) };
        await API.logWater(data);
        Store.set('waterLogs', [...waterLogs, data]);
      }
      App.rerenderPage();
    } catch (e) { showToast('Gagal: ' + e.message, 'error'); }
  },

  async deleteHabit(id, rowIndex) {
    if (!confirm('Hapus kebiasaan ini?')) return;
    try {
      await API.deleteHabit(rowIndex);
      Store.set('habits', Store.get('habits').filter(h => h.id !== id));
      showToast('Kebiasaan dihapus', 'info');
      App.rerenderPage();
    } catch (e) { showToast('Gagal: ' + e.message, 'error'); }
  }
};
