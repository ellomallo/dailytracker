// ════════════════════════════════════════════════════
//  PAGES/DASHBOARD.JS
// ════════════════════════════════════════════════════

const DashboardPage = {
  charts: {},

  render() {
    const today = Utils.dateStr();
    const tasks = Store.get('tasks');
    const gymPlans = Store.get('gymPlans');
    const gymLogs = Store.get('gymLogs');
    const habits = Store.get('habits');
    const habitLogs = Store.get('habitLogs');
    const waterLogs = Store.get('waterLogs');
    const settings = Store.getSettings();

    const todayTasks = tasks.filter(t => t.dueDate === today);
    const doneTasks  = todayTasks.filter(t => t.status === 'done');
    const dayName = Utils.dayName();
    const gymToday = gymPlans.filter(g => g.day === dayName);
    const gymDone  = gymLogs.filter(l => l.date === today && l.done === 'TRUE');
    const activeHabits = habits.filter(h => h.active === 'TRUE');
    const doneHabits = habitLogs.filter(l => l.date === today && l.done === 'TRUE');
    const waterToday = waterLogs.find(w => w.date === today);
    const glasses = waterToday ? parseInt(waterToday.glasses || 0) : 0;

    const taskPct  = todayTasks.length ? Math.round((doneTasks.length / todayTasks.length) * 100) : 0;
    const gymPct   = gymToday.length ? Math.round((gymDone.length / gymToday.length) * 100) : 0;
    const habitPct = activeHabits.length ? Math.round((doneHabits.length / activeHabits.length) * 100) : 0;
    const waterPct = Math.round((glasses / settings.waterTarget) * 100);

    return `
    <div class="space-y-6 animate-slide-up">
      <!-- Header row -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 class="text-xl font-semibold text-white">${Utils.dayName()}, ${Utils.formatDate(today)}</h2>
          <p class="text-sm text-slate-400 mt-0.5">Selamat datang kembali! Ini ringkasan harimu.</p>
        </div>
        <button onclick="Store.loadAll(); showToast('Menyinkronkan data…', 'info')" class="btn-secondary text-xs self-start sm:self-auto">
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
          Sync
        </button>
      </div>

      <!-- Stat Cards -->
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
        ${this._statCard('Tugas Hari Ini', doneTasks.length, todayTasks.length, taskPct, 'teal', '📋')}
        ${this._statCard('Gym Selesai', gymDone.length, gymToday.length, gymPct, 'purple', '💪')}
        ${this._statCard('Habit Selesai', doneHabits.length, activeHabits.length, habitPct, 'amber', '✅')}
        ${this._statCard('Air Minum', glasses, settings.waterTarget, waterPct, 'rose', '💧', 'gelas')}
      </div>

      <!-- Charts row -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <!-- Daily Donut -->
        <div class="card">
          <div class="flex items-center justify-between mb-4">
            <h3 class="font-semibold text-sm text-white">Skor Hari Ini</h3>
            <span class="text-xs text-slate-400 font-mono">${today}</span>
          </div>
          <div class="flex items-center justify-center py-2">
            <div class="relative">
              <canvas id="dailyDonut" width="160" height="160"></canvas>
              <div class="absolute inset-0 flex items-center justify-center flex-col">
                <span class="text-2xl font-bold text-white" id="dailyScore">-</span>
                <span class="text-xs text-slate-400">/ 100</span>
              </div>
            </div>
          </div>
          <div class="grid grid-cols-3 gap-2 mt-3">
            ${[['Tugas',taskPct,'#14b8a6'],['Gym',gymPct,'#a855f7'],['Habit',habitPct,'#f59e0b']].map(([l,v,c])=>`
            <div class="text-center">
              <div class="text-sm font-semibold" style="color:${c}">${v}%</div>
              <div class="text-xs text-slate-500">${l}</div>
            </div>`).join('')}
          </div>
        </div>

        <!-- Weekly Line Chart -->
        <div class="card lg:col-span-2">
          <div class="flex items-center justify-between mb-4">
            <h3 class="font-semibold text-sm text-white">Tren Mingguan</h3>
            <span class="text-xs text-slate-400">Skor Produktivitas</span>
          </div>
          <canvas id="weeklyChart" height="100"></canvas>
        </div>
      </div>

      <!-- Monthly + Heatmap -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div class="card">
          <div class="flex items-center justify-between mb-4">
            <h3 class="font-semibold text-sm text-white">Tren Bulanan</h3>
            <span class="text-xs text-slate-400">${Utils.monthName()}</span>
          </div>
          <canvas id="monthlyChart" height="110"></canvas>
        </div>

        <!-- Upcoming tasks -->
        <div class="card">
          <div class="flex items-center justify-between mb-4">
            <h3 class="font-semibold text-sm text-white">Tugas Mendatang</h3>
            <button onclick="navigateTo('tasks')" class="text-xs text-brand-400 hover:text-brand-300">Lihat semua →</button>
          </div>
          <div class="space-y-2" id="upcomingTasks">
            ${this._renderUpcomingTasks(tasks)}
          </div>
        </div>
      </div>

      <!-- Heatmap -->
      <div class="card overflow-x-auto">
        <div class="flex items-center justify-between mb-4">
          <h3 class="font-semibold text-sm text-white">Heatmap Tahunan</h3>
          <div class="flex items-center gap-2 text-xs text-slate-500">
            <span>Kurang</span>
            ${[0,1,2,3,4].map(l=>`<div class="w-3 h-3 rounded-sm heatmap-cell" data-level="${l}"></div>`).join('')}
            <span>Banyak</span>
          </div>
        </div>
        <div id="heatmapGrid" class="heatmap-grid min-w-max"></div>
        <div class="flex justify-between text-xs text-slate-500 mt-2 min-w-max" id="heatmapMonths"></div>
      </div>
    </div>`;
  },

  _statCard(label, done, total, pct, color, emoji, unit='') {
    const colors = { teal:'text-brand-400', purple:'text-purple-400', amber:'text-amber-400', rose:'text-rose-400' };
    return `
    <div class="stat-card ${color}">
      <div class="flex items-start justify-between">
        <div>
          <div class="text-2xl mb-1">${emoji}</div>
          <div class="text-2xl font-bold text-white">${pct}%</div>
          <div class="text-xs text-slate-400 mt-1">${label}</div>
        </div>
        <div class="${colors[color]} text-xs font-mono bg-current/10 px-2 py-1 rounded-lg">
          ${done}/${total}${unit ? ' '+unit : ''}
        </div>
      </div>
      <div class="mt-3 h-1.5 bg-slate-700 rounded-full overflow-hidden">
        <div class="h-full rounded-full bg-current transition-all duration-500" 
          style="width:${Math.min(pct,100)}%;color:${color==='teal'?'#14b8a6':color==='purple'?'#a855f7':color==='amber'?'#f59e0b':'#f43f5e'}">
        </div>
      </div>
    </div>`;
  },

  _renderUpcomingTasks(tasks) {
    const today = Utils.dateStr();
    const upcoming = tasks
      .filter(t => t.status !== 'done' && t.dueDate >= today)
      .sort((a,b) => a.dueDate.localeCompare(b.dueDate))
      .slice(0, 4);

    if (!upcoming.length) return `<p class="text-sm text-slate-500 text-center py-4">Tidak ada tugas mendatang 🎉</p>`;

    return upcoming.map(t => {
      const overdue = Utils.isOverdue(t.dueDate);
      return `
      <div class="flex items-center gap-3 p-3 rounded-xl bg-surface-700/40 hover:bg-surface-700/70 transition-colors">
        <div class="w-2 h-2 rounded-full flex-shrink-0 ${t.priority==='high'?'bg-rose-400':t.priority==='medium'?'bg-amber-400':'bg-emerald-400'}"></div>
        <div class="flex-1 min-w-0">
          <p class="text-sm font-medium text-white truncate">${Utils.escHtml(t.title)}</p>
          <p class="text-xs ${overdue?'text-rose-400':'text-slate-500'}">${Utils.formatDateShort(t.dueDate)}</p>
        </div>
        <span class="badge badge-${t.priority} text-xs">${t.priority}</span>
      </div>`;
    }).join('');
  },

  afterRender() {
    this._initCharts();
    this._buildHeatmap();
  },

  _initCharts() {
    const chartDefaults = {
      plugins: { legend: { display: false } },
      scales: {
        x: { grid: { color: 'rgba(148,163,184,0.07)' }, ticks: { color: '#64748b', font: { size: 11 } } },
        y: { grid: { color: 'rgba(148,163,184,0.07)' }, ticks: { color: '#64748b', font: { size: 11 } }, min: 0, max: 100 }
      }
    };

    // Weekly scores
    const weekDays = [];
    const weekScores = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i);
      const ds = Utils.dateStr(d);
      weekDays.push(Utils.dayName(d).slice(0,3));
      weekScores.push(Store.productivityScore(ds));
    }

    if (this.charts.weekly) this.charts.weekly.destroy();
    const wCtx = document.getElementById('weeklyChart');
    if (wCtx) {
      this.charts.weekly = new Chart(wCtx, {
        type: 'line',
        data: {
          labels: weekDays,
          datasets: [{
            data: weekScores, fill: true,
            borderColor: '#14b8a6', backgroundColor: 'rgba(20,184,166,0.08)',
            borderWidth: 2, pointRadius: 4, pointBackgroundColor: '#14b8a6',
            tension: 0.4,
          }]
        },
        options: { ...chartDefaults, responsive: true, maintainAspectRatio: true }
      });
    }

    // Monthly bar
    const now = new Date();
    const daysInMonth = new Date(now.getFullYear(), now.getMonth()+1, 0).getDate();
    const monthLabels = [], monthScores = [];
    for (let d = 1; d <= Math.min(daysInMonth, now.getDate()); d++) {
      const date = new Date(now.getFullYear(), now.getMonth(), d);
      monthLabels.push(d % 5 === 0 ? d : '');
      monthScores.push(Store.productivityScore(Utils.dateStr(date)));
    }

    if (this.charts.monthly) this.charts.monthly.destroy();
    const mCtx = document.getElementById('monthlyChart');
    if (mCtx) {
      this.charts.monthly = new Chart(mCtx, {
        type: 'bar',
        data: {
          labels: monthLabels,
          datasets: [{
            data: monthScores,
            backgroundColor: monthScores.map(s => s >= 70 ? 'rgba(20,184,166,0.7)' : s >= 40 ? 'rgba(245,158,11,0.7)' : 'rgba(239,68,68,0.5)'),
            borderRadius: 4,
          }]
        },
        options: { ...chartDefaults, responsive: true, maintainAspectRatio: false }
      });
    }

    // Daily donut
    const today = Utils.dateStr();
    const score = Store.productivityScore(today);
    document.getElementById('dailyScore').textContent = score;

    if (this.charts.daily) this.charts.daily.destroy();
    const dCtx = document.getElementById('dailyDonut');
    if (dCtx) {
      this.charts.daily = new Chart(dCtx, {
        type: 'doughnut',
        data: {
          datasets: [{
            data: [score, 100 - score],
            backgroundColor: ['#14b8a6', 'rgba(148,163,184,0.1)'],
            borderWidth: 0, spacing: 0
          }]
        },
        options: {
          cutout: '75%', plugins: { legend: { display: false } },
          responsive: false
        }
      });
    }
  },

  _buildHeatmap() {
    const grid = document.getElementById('heatmapGrid');
    const monthsEl = document.getElementById('heatmapMonths');
    if (!grid) return;

    const now = new Date();
    const yearAgo = new Date(now); yearAgo.setFullYear(yearAgo.getFullYear() - 1);

    // Align to Sunday
    const start = new Date(yearAgo);
    start.setDate(start.getDate() - start.getDay());

    let html = '', monthsHtml = '', lastMonth = -1;

    for (let d = new Date(start); d <= now; d.setDate(d.getDate() + 1)) {
      const ds = Utils.dateStr(new Date(d));
      const score = Store.productivityScore(ds);
      const level = score >= 75 ? 4 : score >= 50 ? 3 : score >= 25 ? 2 : score > 0 ? 1 : 0;
      const title = `${ds}: ${score} poin`;

      if (d.getMonth() !== lastMonth) {
        lastMonth = d.getMonth();
        const mn = d.toLocaleDateString('id-ID', { month: 'short' });
        monthsHtml += `<span>${mn}</span>`;
      }

      html += `<div class="heatmap-cell" data-level="${level}" title="${title}"></div>`;
    }

    grid.innerHTML = html;
    monthsEl.innerHTML = monthsHtml;
  }
};
