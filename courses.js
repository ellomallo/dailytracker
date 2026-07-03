// ════════════════════════════════════════════════════
//  PAGES/COURSES.JS
// ════════════════════════════════════════════════════

const CoursesPage = {
  render() {
    const courses = Store.get('courses');
    const days = ['Senin','Selasa','Rabu','Kamis','Jumat','Sabtu'];

    return `
    <div class="space-y-6 animate-slide-up">
      <div class="flex items-center justify-between">
        <h2 class="text-xl font-semibold text-white">Jadwal Mata Kuliah</h2>
        <button onclick="CoursesPage.openForm()" class="btn-primary">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
          Tambah Matkul
        </button>
      </div>

      ${days.map(day => {
        const dayCourses = courses.filter(c => c.day === day);
        if (!dayCourses.length) return '';
        return `
        <div class="card">
          <h3 class="font-semibold text-sm text-white mb-3 flex items-center gap-2">
            <span class="w-2 h-2 rounded-full bg-brand-400"></span>${day}
          </h3>
          <div class="space-y-2">
            ${dayCourses.map(c => this._courseCard(c)).join('')}
          </div>
        </div>`;
      }).filter(Boolean).join('')}

      ${!courses.length ? `
      <div class="card text-center py-16">
        <div class="text-4xl mb-3">📚</div>
        <h3 class="font-semibold text-white mb-1">Belum ada jadwal kuliah</h3>
        <p class="text-sm text-slate-400 mb-4">Tambahkan mata kuliah kamu untuk melacak jadwal</p>
        <button onclick="CoursesPage.openForm()" class="btn-primary mx-auto">Tambah Sekarang</button>
      </div>` : ''}
    </div>`;
  },

  _courseCard(c) {
    return `
    <div class="exercise-item group">
      <div class="flex-1 min-w-0">
        <div class="flex items-center gap-2 flex-wrap">
          <span class="font-semibold text-sm text-white">${Utils.escHtml(c.name)}</span>
          ${c.link ? `<a href="${Utils.escHtml(c.link)}" target="_blank" class="text-xs text-brand-400 hover:underline">🔗 Online</a>` : ''}
        </div>
        <div class="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-xs text-slate-400">
          <span>👨‍🏫 ${Utils.escHtml(c.lecturer)}</span>
          <span>🕐 ${Utils.escHtml(c.time)}</span>
          <span>🏛️ ${Utils.escHtml(c.room)}</span>
        </div>
        ${c.notes ? `<div class="text-xs text-slate-500 mt-1">${Utils.escHtml(c.notes)}</div>` : ''}
      </div>
      <div class="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button onclick="CoursesPage.openForm('${c.id}')" class="btn-secondary py-1 px-2 text-xs">Edit</button>
        <button onclick="CoursesPage.delete('${c.id}', ${c._rowIndex})" class="btn-danger py-1 px-2">Hapus</button>
      </div>
    </div>`;
  },

  openForm(editId) {
    const courses = Store.get('courses');
    const c = editId ? courses.find(x => x.id === editId) : null;
    const title = c ? 'Edit Mata Kuliah' : 'Tambah Mata Kuliah';
    const days = ['Senin','Selasa','Rabu','Kamis','Jumat','Sabtu'];

    openModal(`
    <div class="p-6">
      <div class="flex items-center justify-between mb-6">
        <h3 class="font-semibold text-white">${title}</h3>
        <button onclick="closeModal()" class="text-slate-400 hover:text-white">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
        </button>
      </div>
      <div class="space-y-4">
        <div>
          <label class="form-label">Nama Mata Kuliah *</label>
          <input id="cf_name" class="form-input" placeholder="Algoritma & Pemrograman" value="${Utils.escHtml(c?.name||'')}">
        </div>
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="form-label">Dosen *</label>
            <input id="cf_lecturer" class="form-input" placeholder="Dr. Budi Santoso" value="${Utils.escHtml(c?.lecturer||'')}">
          </div>
          <div>
            <label class="form-label">Hari *</label>
            <select id="cf_day" class="form-select">
              ${days.map(d=>`<option value="${d}" ${c?.day===d?'selected':''}>${d}</option>`).join('')}
            </select>
          </div>
        </div>
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="form-label">Jam Kuliah</label>
            <input id="cf_time" class="form-input" placeholder="08:00 - 10:00" value="${Utils.escHtml(c?.time||'')}">
          </div>
          <div>
            <label class="form-label">Ruangan</label>
            <input id="cf_room" class="form-input" placeholder="Gedung A - R301" value="${Utils.escHtml(c?.room||'')}">
          </div>
        </div>
        <div>
          <label class="form-label">Link Kuliah Online (Opsional)</label>
          <input id="cf_link" class="form-input" placeholder="https://meet.google.com/..." value="${Utils.escHtml(c?.link||'')}">
        </div>
        <div>
          <label class="form-label">Catatan</label>
          <input id="cf_notes" class="form-input" placeholder="Catatan tambahan" value="${Utils.escHtml(c?.notes||'')}">
        </div>
        <div class="flex gap-3 pt-2">
          <button onclick="closeModal()" class="btn-secondary flex-1">Batal</button>
          <button onclick="CoursesPage.save('${editId||''}')" class="btn-primary flex-1">
            ${c ? 'Simpan Perubahan' : 'Tambah Matkul'}
          </button>
        </div>
      </div>
    </div>`);
  },

  async save(editId) {
    const name = Utils.$('#cf_name').value.trim();
    const lecturer = Utils.$('#cf_lecturer').value.trim();
    if (!name || !lecturer) { showToast('Nama dan dosen wajib diisi', 'error'); return; }

    const data = {
      id: editId || Utils.uid(),
      name, lecturer,
      day: Utils.$('#cf_day').value,
      time: Utils.$('#cf_time').value.trim(),
      room: Utils.$('#cf_room').value.trim(),
      link: Utils.$('#cf_link').value.trim(),
      notes: Utils.$('#cf_notes').value.trim(),
    };

    if (!Auth.isLoggedIn()) {
      showToast('Login Google untuk menyimpan data', 'error'); return;
    }

    try {
      if (editId) {
        const courses = Store.get('courses');
        const c = courses.find(x => x.id === editId);
        await API.updateCourse(c._rowIndex, data);
        const updated = courses.map(x => x.id === editId ? { ...data, _rowIndex: x._rowIndex } : x);
        Store.set('courses', updated);
      } else {
        await API.addCourse(data);
        await Store.loadCourses();
      }
      closeModal();
      showToast(editId ? 'Mata kuliah diperbarui' : 'Mata kuliah ditambahkan', 'success');
      App.rerenderPage();
    } catch (e) {
      showToast('Gagal menyimpan: ' + e.message, 'error');
    }
  },

  async delete(id, rowIndex) {
    if (!confirm('Hapus mata kuliah ini?')) return;
    try {
      await API.deleteCourse(rowIndex);
      Store.set('courses', Store.get('courses').filter(c => c.id !== id));
      showToast('Mata kuliah dihapus', 'info');
      App.rerenderPage();
    } catch (e) {
      showToast('Gagal menghapus: ' + e.message, 'error');
    }
  }
};
