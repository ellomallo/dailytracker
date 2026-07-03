// ════════════════════════════════════════════════════
//  PAGES/FINANCE.JS
// ════════════════════════════════════════════════════

const FinancePage = {
  chart: null,

  render() {
    const finance = Store.get('finance');
    const settings = Store.getSettings();
    const today = Utils.dateStr();

    const todayExpenses = finance.filter(f => f.date === today && f.type === 'expense');
    const todayTotal = todayExpenses.reduce((s, f) => s + parseFloat(f.amount || 0), 0);
    const budgetLeft = settings.budgetDaily - todayTotal;

    // Monthly grouping
    const monthExp = finance.filter(f => f.type === 'expense');
    const monthTotal = monthExp.reduce((s, f) => s + parseFloat(f.amount || 0), 0);

    // Category summary
    const cats = {};
    monthExp.forEach(f => { cats[f.category] = (cats[f.category] || 0) + parseFloat(f.amount || 0); });

    return `
    <div class="space-y-6 animate-slide-up">
      <div class="flex items-center justify-between">
        <h2 class="text-xl font-semibold text-white">Keuangan Harian</h2>
        <button onclick="FinancePage.openForm()" class="btn-primary">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
          Catat Pengeluaran
        </button>
      </div>

      <!-- Summary cards -->
      <div class="grid grid-cols-3 gap-4">
        <div class="card text-center">
          <div class="text-xs text-slate-400 mb-1">Pengeluaran Hari Ini</div>
          <div class="text-xl font-bold ${todayTotal > settings.budgetDaily ? 'text-rose-400' : 'text-white'}">${Utils.formatRupiah(todayTotal)}</div>
        </div>
        <div class="card text-center">
          <div class="text-xs text-slate-400 mb-1">Sisa Budget</div>
          <div class="text-xl font-bold ${budgetLeft < 0 ? 'text-rose-400' : 'text-brand-400'}">${Utils.formatRupiah(Math.max(0, budgetLeft))}</div>
        </div>
        <div class="card text-center">
          <div class="text-xs text-slate-400 mb-1">Total Bulan Ini</div>
          <div class="text-xl font-bold text-white">${Utils.formatRupiah(monthTotal)}</div>
        </div>
      </div>

      <!-- Budget progress -->
      <div class="card">
        <div class="flex justify-between text-sm mb-2">
          <span class="text-slate-400">Budget harian: <span class="text-white font-medium">${Utils.formatRupiah(settings.budgetDaily)}</span></span>
          <span class="${todayTotal > settings.budgetDaily ? 'text-rose-400' : 'text-slate-400'}">${Math.round((todayTotal/settings.budgetDaily)*100)}%</span>
        </div>
        <div class="h-2.5 bg-slate-700 rounded-full overflow-hidden">
          <div class="h-full rounded-full transition-all duration-500 ${todayTotal > settings.budgetDaily ? 'bg-rose-500' : 'bg-brand-500'}"
            style="width:${Math.min((todayTotal/settings.budgetDaily)*100, 100)}%"></div>
        </div>
        ${todayTotal > settings.budgetDaily ? `<p class="text-xs text-rose-400 mt-2">⚠️ Pengeluaran melebihi budget hari ini!</p>` : ''}
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <!-- Transactions today -->
        <div class="card">
          <h3 class="font-semibold text-white text-sm mb-3">Pengeluaran Hari Ini</h3>
          <div class="space-y-2">
            ${!todayExpenses.length ? `<p class="text-sm text-slate-400 text-center py-4">Belum ada catatan hari ini</p>` :
              todayExpenses.sort((a,b) => b.id.localeCompare(a.id)).map(f => this._expenseRow(f)).join('')}
          </div>
        </div>

        <!-- Category pie -->
        <div class="card">
          <h3 class="font-semibold text-white text-sm mb-3">Per Kategori (Bulan Ini)</h3>
          ${Object.keys(cats).length ? `
          <canvas id="financeChart" height="160"></canvas>
          <div class="mt-3 space-y-1.5">
            ${Object.entries(cats).sort((a,b)=>b[1]-a[1]).map(([cat,amt]) => `
            <div class="flex items-center justify-between text-xs">
              <span class="text-slate-400">${Utils.escHtml(cat)}</span>
              <span class="font-medium text-white">${Utils.formatRupiah(amt)}</span>
            </div>`).join('')}
          </div>` : `<p class="text-sm text-slate-400 text-center py-8">Belum ada pengeluaran bulan ini</p>`}
        </div>
      </div>

      <!-- Recent history -->
      <div class="card">
        <h3 class="font-semibold text-white text-sm mb-3">Riwayat Terbaru</h3>
        <div class="space-y-2">
          ${!finance.length ? `<p class="text-sm text-slate-400 text-center py-4">Belum ada riwayat</p>` :
            finance.sort((a,b) => (b.date+b.id).localeCompare(a.date+a.id)).slice(0, 20).map(f => this._expenseRow(f)).join('')}
        </div>
      </div>
    </div>`;
  },

  _expenseRow(f) {
    const catColors = {
      'Makan': 'bg-orange-500/20 text-orange-300',
      'Transport': 'bg-blue-500/20 text-blue-300',
      'Belanja': 'bg-purple-500/20 text-purple-300',
      'Hiburan': 'bg-pink-500/20 text-pink-300',
    };
    const colorClass = catColors[f.category] || 'bg-slate-700 text-slate-300';
    return `
    <div class="flex items-center gap-3 p-3 rounded-xl bg-surface-700/40 group">
      <span class="text-xs px-2 py-1 rounded-lg ${colorClass} flex-shrink-0">${Utils.escHtml(f.category)}</span>
      <div class="flex-1 min-w-0">
        <p class="text-sm text-white truncate">${Utils.escHtml(f.description)}</p>
        <p class="text-xs text-slate-400">${Utils.formatDateShort(f.date)}</p>
      </div>
      <span class="font-semibold text-sm text-rose-400 flex-shrink-0">−${Utils.formatRupiah(parseFloat(f.amount||0))}</span>
      <button onclick="FinancePage.delete('${f.id}', ${f._rowIndex})"
        class="text-slate-600 hover:text-rose-400 opacity-0 group-hover:opacity-100 transition-all">✕</button>
    </div>`;
  },

  afterRender() {
    const finance = Store.get('finance');
    const cats = {};
    finance.filter(f => f.type === 'expense').forEach(f => {
      cats[f.category] = (cats[f.category] || 0) + parseFloat(f.amount || 0);
    });
    if (!Object.keys(cats).length) return;

    const ctx = document.getElementById('financeChart');
    if (!ctx) return;
    if (this.chart) this.chart.destroy();

    const colors = ['#14b8a6','#a855f7','#f59e0b','#f43f5e','#3b82f6','#10b981','#ec4899','#8b5cf6'];
    this.chart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: Object.keys(cats),
        datasets: [{ data: Object.values(cats), backgroundColor: colors.slice(0, Object.keys(cats).length), borderWidth: 0 }]
      },
      options: {
        plugins: {
          legend: { position: 'bottom', labels: { color: '#94a3b8', font: { size: 11 }, boxWidth: 10 } }
        },
        cutout: '65%'
      }
    });
  },

  openForm() {
    openModal(`
    <div class="p-6">
      <div class="flex items-center justify-between mb-6">
        <h3 class="font-semibold text-white">Catat Pengeluaran</h3>
        <button onclick="closeModal()" class="text-slate-400 hover:text-white">✕</button>
      </div>
      <div class="space-y-4">
        <div>
          <label class="form-label">Keterangan *</label>
          <input id="ff_desc" class="form-input" placeholder="Makan siang, go-food...">
        </div>
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="form-label">Kategori</label>
            <select id="ff_cat" class="form-select">
              <option>Makan</option><option>Transport</option><option>Belanja</option>
              <option>Hiburan</option><option>Kesehatan</option><option>Pendidikan</option>
              <option>Lainnya</option>
            </select>
          </div>
          <div>
            <label class="form-label">Tanggal</label>
            <input id="ff_date" type="date" class="form-input" value="${Utils.dateStr()}">
          </div>
        </div>
        <div>
          <label class="form-label">Jumlah (Rp) *</label>
          <input id="ff_amount" type="number" class="form-input" placeholder="25000" min="0">
        </div>
        <div class="flex gap-3 pt-2">
          <button onclick="closeModal()" class="btn-secondary flex-1">Batal</button>
          <button onclick="FinancePage.save()" class="btn-primary flex-1">Catat</button>
        </div>
      </div>
    </div>`);
  },

  async save() {
    const desc = Utils.$('#ff_desc').value.trim();
    const amount = parseFloat(Utils.$('#ff_amount').value);
    if (!desc || !amount) { showToast('Keterangan dan jumlah wajib diisi', 'error'); return; }
    if (!Auth.isLoggedIn()) { showToast('Login Google untuk menyimpan', 'error'); return; }

    const data = {
      id: Utils.uid(),
      date: Utils.$('#ff_date').value,
      category: Utils.$('#ff_cat').value,
      description: desc,
      amount: String(amount),
      type: 'expense'
    };

    try {
      await API.addExpense(data);
      await Store.loadFinance();
      closeModal();
      showToast('Pengeluaran dicatat', 'success');
      App.rerenderPage();
    } catch (e) { showToast('Gagal: ' + e.message, 'error'); }
  },

  async delete(id, rowIndex) {
    if (!confirm('Hapus catatan ini?')) return;
    try {
      await API.deleteExpense(rowIndex);
      Store.set('finance', Store.get('finance').filter(f => f.id !== id));
      showToast('Catatan dihapus', 'info');
      App.rerenderPage();
    } catch (e) { showToast('Gagal: ' + e.message, 'error'); }
  }
};
