// ════════════════════════════════════════════════════
//  PAGES/TASKS.JS
// ════════════════════════════════════════════════════

const TasksPage = {
  filter: 'all',

  render() {
    const tasks = Store.get('tasks');
    const filters = [
      { key: 'all', label: 'Semua' },
      { key: 'pending', label: 'Pending' },
      { key: 'done', label: 'Selesai' },
      { key: 'high', label: '🔴 High' },
      { key: 'medium', label: '🟡 Medium' },
      { key: 'low', label: '🟢 Low' },
    ];

    let filtered = [...tasks];
    if (this.filter === 'pending') filtered = tasks.filter(t => t.status !== 'done');
    else if (this.filter === 'done') filtered = tasks.filter(t => t.status === 'done');
    else if (['high','medium','low'].includes(this.filter)) filtered = tasks.filter(t => t.priority === this.filter);

    // Sort: pending first, then by due date
    filtered.sort((a, b) => {
      if (a.status === 'done' && b.status !== 'done') return 1;
      if (a.status !== 'done' && b.status === 'done') return -1;
      return (a.dueDate || '').localeCompare(b.dueDate || '');
    });

    const done = tasks.filter(t => t.status === 'done').length;

    return `
    <div class="space-y-6 animate-slide-up">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 class="text-xl font-semibold text-white">Tugas & Todo</h2>
          <p class="text-sm text-slate-400">${done}/${tasks.length} selesai</p>
        </div>
        <button onclick="TasksPage.openForm()" class="btn-primary self-start">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
          Tambah Tugas
        </button>
      </div>

      <!-- Progress bar -->
      <div class="card py-3">
        <div class="flex items-center justify-between text-xs text-slate-400 mb-2">
          <span>Progress keseluruhan</span>
          <span class="font-mono">${tasks.length ? Math.round((done/tasks.length)*100) : 0}%</span>
        </div>
        <div class="h-2 bg-slate-700 rounded-full overflow-hidden">
          <div class="h-full bg-gradient-to-r from-brand-600 to-brand-400 rounded-full transition-all duration-700"
            style="width:${tasks.length ? (done/tasks.length)*100 : 0}%"></div>
        </div>
      </div>

      <!-- Filter tabs -->
      <div class="flex gap-2 overflow-x-auto pb-1">
        ${filters.map(f => `
        <button onclick="TasksPage.filter='${f.key}';App.rerenderPage()"
          class="flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-all
          ${this.filter===f.key ? 'bg-brand-600 text-white' : 'bg-surface-700 text-slate-400 hover:text-white'}">
          ${f.label}
        </button>`).join('')}
      </div>

      <!-- Tasks list -->
      <div class="space-y-2">
        ${filtered.length ? filtered.map(t => this._taskCard(t)).join('') : `
        <div class="card text-center py-12">
          <div class="text-4xl mb-3">✅</div>
          <p class="text-white font-medium">Tidak ada tugas di filter ini</p>
        </div>`}
      </div>
    </div>`;
  },

  _taskCard(t) {
    const overdue = t.status !== 'done' && Utils.isOverdue(t.dueDate);
    return `
    <div class="card card-sm group flex items-start gap-3 ${t.status==='done'?'opacity-60':''}">
      <button onclick="TasksPage.toggle('${t.id}', ${t._rowIndex})"
        class="w-5 h-5 rounded-md border-2 flex-shrink-0 mt-0.5 flex items-center justify-center transition-all
        ${t.status==='done' ? 'bg-brand-500 border-brand-500 text-white' : 'border-slate-500 hover:border-brand-400'}">
        ${t.status==='done'?'<svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"/></svg>':''}
      </button>
      <div class="flex-1 min-w-0">
        <div class="flex flex-wrap items-center gap-2">
          <span class="font-medium text-sm text-white ${t.status==='done'?'line-through':''}">${Utils.escHtml(t.title)}</span>
          <span class="badge badge-${t.priority}">${t.priority}</span>
        </div>
        <div class="flex flex-wrap gap-x-3 gap-y-1 mt-1 text-xs text-slate-400">
          ${t.subject ? `<span>📚 ${Utils.escHtml(t.subject)}</span>` : ''}
          ${t.dueDate ? `<span class="${overdue?'text-rose-400 font-medium':''}">📅 ${Utils.formatDateShort(t.dueDate)}${overdue?' (Terlambat!)':''}</span>` : ''}
        </div>
        ${t.notes ? `<p class="text-xs text-slate-500 mt-1">${Utils.escHtml(t.notes)}</p>` : ''}
      </div>
      <div class="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button onclick="TasksPage.openForm('${t.id}')" class="btn-secondary py-1 px-2 text-xs">Edit</button>
        <button onclick="TasksPage.delete('${t.id}', ${t._rowIndex})" class="btn-danger py-1 px-2">✕</button>
      </div>
    </div>`;
  },

  openForm(editId) {
    const tasks = Store.get('tasks');
    const t = editId ? tasks.find(x => x.id === editId) : null;

    openModal(`
    <div class="p-6">
      <div class="flex items-center justify-between mb-6">
        <h3 class="font-semibold text-white">${t ? 'Edit Tugas' : 'Tambah Tugas'}</h3>
        <button onclick="closeModal()" class="text-slate-400 hover:text-white">✕</button>
      </div>
      <div class="space-y-4">
        <div>
          <label class="form-label">Judul Tugas *</label>
          <input id="tf_title" class="form-input" placeholder="Kerjakan laporan praktikum..." value="${Utils.escHtml(t?.title||'')}">
        </div>
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="form-label">Mata Kuliah</label>
            <input id="tf_subject" class="form-input" placeholder="Algoritma" value="${Utils.escHtml(t?.subject||'')}">
          </div>
          <div>
            <label class="form-label">Prioritas</label>
            <select id="tf_priority" class="form-select">
              <option value="high" ${t?.priority==='high'?'selected':''}>🔴 High</option>
              <option value="medium" ${(!t||t.priority==='medium')?'selected':''}>🟡 Medium</option>
              <option value="low" ${t?.priority==='low'?'selected':''}>🟢 Low</option>
            </select>
          </div>
        </div>
        <div>
          <label class="form-label">Tenggat Waktu</label>
          <input id="tf_due" type="date" class="form-input" value="${t?.dueDate||''}">
        </div>
        <div>
          <label class="form-label">Catatan</label>
          <textarea id="tf_notes" class="form-input" rows="2" placeholder="Detail tugas...">${Utils.escHtml(t?.notes||'')}</textarea>
        </div>
        <div class="flex gap-3 pt-2">
          <button onclick="closeModal()" class="btn-secondary flex-1">Batal</button>
          <button onclick="TasksPage.save('${editId||''}')" class="btn-primary flex-1">
            ${t ? 'Simpan' : 'Tambah'}
          </button>
        </div>
      </div>
    </div>`);
  },

  async save(editId) {
    const title = Utils.$('#tf_title').value.trim();
    if (!title) { showToast('Judul tugas wajib diisi', 'error'); return; }
    if (!Auth.isLoggedIn()) { showToast('Login Google untuk menyimpan', 'error'); return; }

    const tasks = Store.get('tasks');
    const existing = editId ? tasks.find(x => x.id === editId) : null;

    const data = {
      id: editId || Utils.uid(),
      title,
      subject: Utils.$('#tf_subject').value.trim(),
      priority: Utils.$('#tf_priority').value,
      dueDate: Utils.$('#tf_due').value,
      status: existing?.status || 'pending',
      notes: Utils.$('#tf_notes').value.trim(),
      createdAt: existing?.createdAt || Utils.dateStr(),
      completedAt: existing?.completedAt || '',
    };

    try {
      if (editId) {
        await API.updateTask(existing._rowIndex, data);
        Store.set('tasks', tasks.map(x => x.id === editId ? { ...data, _rowIndex: x._rowIndex } : x));
      } else {
        await API.addTask(data);
        await Store.loadTasks();
      }
      closeModal();
      showToast(editId ? 'Tugas diperbarui' : 'Tugas ditambahkan', 'success');
      App.rerenderPage();
    } catch (e) { showToast('Gagal: ' + e.message, 'error'); }
  },

  async toggle(id, rowIndex) {
    if (!Auth.isLoggedIn()) { showToast('Login Google untuk mengubah status', 'error'); return; }
    const tasks = Store.get('tasks');
    const t = tasks.find(x => x.id === id);
    if (!t) return;
    const updated = { ...t, status: t.status === 'done' ? 'pending' : 'done', completedAt: t.status !== 'done' ? Utils.dateStr() : '' };
    try {
      await API.updateTask(rowIndex, updated);
      Store.set('tasks', tasks.map(x => x.id === id ? { ...updated, _rowIndex: x._rowIndex } : x));
      showToast(updated.status === 'done' ? 'Tugas selesai! 🎉' : 'Tugas dibuka kembali', 'info');
      App.rerenderPage();
    } catch (e) { showToast('Gagal: ' + e.message, 'error'); }
  },

  async delete(id, rowIndex) {
    if (!confirm('Hapus tugas ini?')) return;
    try {
      await API.deleteTask(rowIndex);
      Store.set('tasks', Store.get('tasks').filter(t => t.id !== id));
      showToast('Tugas dihapus', 'info');
      App.rerenderPage();
    } catch (e) { showToast('Gagal: ' + e.message, 'error'); }
  }
};
