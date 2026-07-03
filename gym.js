// ════════════════════════════════════════════════════
//  PAGES/GYM.JS
// ════════════════════════════════════════════════════

const GymPage = {
  activeDay: Utils.dayName(),

  render() {
    const plans = Store.get('gymPlans');
    const logs  = Store.get('gymLogs');
    const settings = Store.getSettings();
    const today = Utils.dateStr();
    const days = ['Senin','Selasa','Rabu','Kamis','Jumat','Sabtu','Minggu'];

    return `
    <div class="space-y-6 animate-slide-up">
      <div class="flex items-center justify-between">
        <h2 class="text-xl font-semibold text-white">Gym & Fitness</h2>
        <button onclick="GymPage.openExerciseForm()" class="btn-primary">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
          Tambah Latihan
        </button>
      </div>

      <!-- Day tabs -->
      <div class="flex gap-2 overflow-x-auto pb-1">
        ${days.map(d => {
          const dayPlans = plans.filter(p => p.day === d);
          const dayLogs  = logs.filter(l => l.date === today && l.done === 'TRUE' && dayPlans.some(p => p.id === l.exerciseId));
          const isRest = settings.gymSchedule[d] === 'Rest';
          return `
          <button onclick="GymPage.activeDay='${d}';App.rerenderPage()"
            class="flex-shrink-0 flex flex-col items-center px-4 py-2 rounded-xl text-sm font-medium transition-all
            ${this.activeDay===d ? 'bg-brand-600 text-white' : 'bg-surface-700 text-slate-400 hover:text-white'}">
            <span>${d.slice(0,3)}</span>
            <span class="text-xs opacity-70">${settings.gymSchedule[d]||'Custom'}</span>
            ${dayPlans.length ? `<span class="text-xs mt-0.5 font-mono">${dayLogs.length}/${dayPlans.length}</span>` : ''}
          </button>`;
        }).join('')}
      </div>

      <!-- Active day exercises -->
      ${this._renderDayPlan(this.activeDay, plans, logs, today, settings)}
    </div>`;
  },

  _renderDayPlan(day, plans, logs, today, settings) {
    const dayPlans = plans.filter(p => p.day === day);
    const schedule = settings.gymSchedule[day] || 'Custom';
    const isRest = schedule === 'Rest';

    if (isRest) {
      return `
      <div class="card text-center py-12">
        <div class="text-5xl mb-3">😴</div>
        <h3 class="font-semibold text-white">Rest Day</h3>
        <p class="text-sm text-slate-400 mt-1">Istirahat dan recovery penting untuk progress!</p>
      </div>`;
    }

    const categories = [...new Set(dayPlans.map(p => p.category))];

    return `
    <div class="card">
      <div class="flex items-center justify-between mb-4">
        <div>
          <h3 class="font-semibold text-white">${day} — ${schedule}</h3>
          <p class="text-xs text-slate-400 mt-0.5">${dayPlans.length} latihan terdaftar</p>
        </div>
        <button onclick="GymPage.editScheduleLabel('${day}')" class="text-xs text-brand-400 hover:underline">Edit Label</button>
      </div>

      ${!dayPlans.length ? `
      <div class="text-center py-8">
        <p class="text-slate-400 text-sm mb-3">Belum ada latihan untuk hari ini</p>
        <button onclick="GymPage.openExerciseForm('${day}')" class="btn-secondary text-xs">+ Tambah Latihan</button>
      </div>` : ''}

      ${categories.map(cat => {
        const catExercises = dayPlans.filter(p => p.category === cat);
        return `
        <div class="mb-4">
          <h4 class="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">${cat || 'Latihan'}</h4>
          <div class="space-y-2">
            ${catExercises.map(ex => {
              const log = logs.find(l => l.date === today && l.exerciseId === ex.id && l.done === 'TRUE');
              return `
              <div class="exercise-item ${log?'done':''} group">
                <button onclick="GymPage.toggleExercise('${ex.id}', ${!!log})"
                  class="w-5 h-5 rounded-md border-2 flex-shrink-0 flex items-center justify-center transition-all
                  ${log ? 'bg-brand-500 border-brand-500 text-white' : 'border-slate-500 hover:border-brand-400'}">
                  ${log ? '✓' : ''}
                </button>
                <div class="flex-1">
                  <div class="font-medium text-sm text-white ${log?'line-through':''}">${Utils.escHtml(ex.exercise)}</div>
                  <div class="text-xs text-slate-400">
                    ${ex.sets} set × ${ex.reps} reps ${ex.weight ? `· ${ex.weight}` : ''}
                  </div>
                </div>
                <button onclick="GymPage.deleteExercise('${ex.id}', ${ex._rowIndex})"
                  class="text-slate-600 hover:text-rose-400 opacity-0 group-hover:opacity-100 transition-all text-xs">✕</button>
              </div>`;
            }).join('')}
          </div>
        </div>`;
      }).join('')}
    </div>`;
  },

  openExerciseForm(defaultDay) {
    const days = ['Senin','Selasa','Rabu','Kamis','Jumat','Sabtu','Minggu'];
    const selected = defaultDay || this.activeDay;

    openModal(`
    <div class="p-6">
      <div class="flex items-center justify-between mb-6">
        <h3 class="font-semibold text-white">Tambah Latihan</h3>
        <button onclick="closeModal()" class="text-slate-400 hover:text-white">✕</button>
      </div>
      <div class="space-y-4">
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="form-label">Hari</label>
            <select id="gf_day" class="form-select">
              ${days.map(d=>`<option value="${d}" ${d===selected?'selected':''}>${d}</option>`).join('')}
            </select>
          </div>
          <div>
            <label class="form-label">Kategori</label>
            <input id="gf_category" class="form-input" placeholder="Chest, Back, Legs..." list="categoryList">
            <datalist id="categoryList">
              <option>Chest</option><option>Back</option><option>Legs</option>
              <option>Shoulders</option><option>Arms</option><option>Core</option><option>Cardio</option>
            </datalist>
          </div>
        </div>
        <div>
          <label class="form-label">Nama Gerakan *</label>
          <input id="gf_exercise" class="form-input" placeholder="Bench Press, Squat, Pull Up...">
        </div>
        <div class="grid grid-cols-3 gap-3">
          <div>
            <label class="form-label">Set</label>
            <input id="gf_sets" type="number" class="form-input" placeholder="4" value="4" min="1">
          </div>
          <div>
            <label class="form-label">Repetisi</label>
            <input id="gf_reps" class="form-input" placeholder="8-12">
          </div>
          <div>
            <label class="form-label">Beban</label>
            <input id="gf_weight" class="form-input" placeholder="60kg">
          </div>
        </div>
        <div class="flex gap-3 pt-2">
          <button onclick="closeModal()" class="btn-secondary flex-1">Batal</button>
          <button onclick="GymPage.saveExercise()" class="btn-primary flex-1">Tambah</button>
        </div>
      </div>
    </div>`);
  },

  async saveExercise() {
    const exercise = Utils.$('#gf_exercise').value.trim();
    if (!exercise) { showToast('Nama gerakan wajib diisi', 'error'); return; }
    if (!Auth.isLoggedIn()) { showToast('Login Google untuk menyimpan', 'error'); return; }

    const data = {
      id: Utils.uid(),
      day: Utils.$('#gf_day').value,
      category: Utils.$('#gf_category').value.trim() || 'Latihan',
      exercise,
      sets: Utils.$('#gf_sets').value || '4',
      reps: Utils.$('#gf_reps').value.trim() || '10',
      weight: Utils.$('#gf_weight').value.trim(),
    };

    try {
      await API.addGymExercise(data);
      await Store.loadGymPlans();
      closeModal();
      showToast('Latihan ditambahkan 💪', 'success');
      App.rerenderPage();
    } catch (e) { showToast('Gagal: ' + e.message, 'error'); }
  },

  async toggleExercise(exerciseId, isDone) {
    if (!Auth.isLoggedIn()) { showToast('Login Google untuk mencatat', 'error'); return; }
    const today = Utils.dateStr();
    const data = {
      id: Utils.uid(), date: today, exerciseId,
      done: (!isDone).toString().toUpperCase(),
      timestamp: new Date().toISOString()
    };
    try {
      await API.toggleGymLog(data);
      const logs = Store.get('gymLogs');
      // Update local state: remove old log for this exercise today, add new
      const filtered = logs.filter(l => !(l.date === today && l.exerciseId === exerciseId));
      Store.set('gymLogs', [...filtered, data]);
      App.rerenderPage();
    } catch (e) { showToast('Gagal: ' + e.message, 'error'); }
  },

  async deleteExercise(id, rowIndex) {
    if (!confirm('Hapus latihan ini?')) return;
    try {
      await API.deleteGymExercise(rowIndex);
      Store.set('gymPlans', Store.get('gymPlans').filter(p => p.id !== id));
      showToast('Latihan dihapus', 'info');
      App.rerenderPage();
    } catch (e) { showToast('Gagal: ' + e.message, 'error'); }
  },

  editScheduleLabel(day) {
    const settings = Store.getSettings();
    const current = settings.gymSchedule[day] || '';
    const newLabel = prompt(`Label jadwal untuk ${day}:`, current);
    if (newLabel !== null) {
      Store.updateSettings({
        gymSchedule: { ...settings.gymSchedule, [day]: newLabel }
      });
      App.rerenderPage();
    }
  }
};
