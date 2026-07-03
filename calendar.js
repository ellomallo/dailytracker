// ════════════════════════════════════════════════════
//  PAGES/CALENDAR.JS
// ════════════════════════════════════════════════════

const CalendarPage = {
  currentDate: new Date(),

  render() {
    return `
    <div class="space-y-6 animate-slide-up">
      <div class="flex items-center justify-between">
        <h2 class="text-xl font-semibold text-white">Kalender</h2>
        <div class="flex items-center gap-2">
          <button onclick="CalendarPage.prevMonth()" class="btn-secondary p-2">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/></svg>
          </button>
          <span class="font-medium text-sm min-w-[140px] text-center" id="calMonthLabel"></span>
          <button onclick="CalendarPage.nextMonth()" class="btn-secondary p-2">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
          </button>
          <button onclick="CalendarPage.currentDate=new Date();CalendarPage.renderCalendar()" class="btn-secondary text-xs">Hari Ini</button>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <!-- Calendar Grid -->
        <div class="card lg:col-span-2">
          <div class="grid grid-cols-7 mb-2">
            ${['Min','Sen','Sel','Rab','Kam','Jum','Sab'].map(d=>`<div class="text-center text-xs font-medium text-slate-400 py-2">${d}</div>`).join('')}
          </div>
          <div id="calendarGrid" class="grid grid-cols-7 gap-1"></div>
        </div>

        <!-- Events Sidebar -->
        <div class="card">
          <h3 class="font-semibold text-sm text-white mb-3" id="selectedDateLabel">Events</h3>
          <div id="eventsList" class="space-y-2">
            <p class="text-sm text-slate-500">Pilih tanggal untuk melihat event</p>
          </div>
        </div>
      </div>
    </div>`;
  },

  afterRender() {
    this.renderCalendar();
    Store.subscribe((key) => {
      if (['tasks','calendarEvents','gymPlans'].includes(key)) this.renderCalendar();
    });
  },

  renderCalendar() {
    const y = this.currentDate.getFullYear();
    const m = this.currentDate.getMonth();
    const today = Utils.dateStr();

    document.getElementById('calMonthLabel').textContent =
      this.currentDate.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });

    const firstDay = new Date(y, m, 1).getDay();
    const daysInMonth = new Date(y, m + 1, 0).getDate();
    const prevDays = new Date(y, m, 0).getDate();

    const tasks = Store.get('tasks');
    const events = Store.get('calendarEvents');

    let html = '';

    // Prev month days
    for (let i = firstDay - 1; i >= 0; i--) {
      html += `<div class="cal-day other-month"><span class="cal-day-num">${prevDays - i}</span></div>`;
    }

    // Current month days
    for (let d = 1; d <= daysInMonth; d++) {
      const ds = `${y}-${String(m+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
      const isToday = ds === today;
      const dayTasks = tasks.filter(t => t.dueDate === ds);
      const dayEvents = events.filter(e => {
        const start = e.start?.date || e.start?.dateTime?.split('T')[0];
        return start === ds;
      });

      const dots = [
        ...dayTasks.map(t => `<div class="cal-day-dot ${t.status==='done'?'bg-brand-500':t.priority==='high'?'bg-rose-400':t.priority==='medium'?'bg-amber-400':'bg-emerald-400'}"></div>`),
        ...dayEvents.slice(0,2).map(() => `<div class="cal-day-dot bg-blue-400"></div>`)
      ].slice(0,3).join('');

      html += `
      <div class="cal-day ${isToday?'today':''}" onclick="CalendarPage.selectDay('${ds}', ${d})">
        <span class="cal-day-num text-xs ${isToday?'text-brand-400 font-bold':'text-slate-300'}">${d}</span>
        <div class="flex gap-0.5 flex-wrap justify-center mt-1">${dots}</div>
      </div>`;
    }

    document.getElementById('calendarGrid').innerHTML = html;
  },

  selectDay(ds, d) {
    const tasks = Store.get('tasks').filter(t => t.dueDate === ds);
    const events = Store.get('calendarEvents').filter(e => {
      const start = e.start?.date || e.start?.dateTime?.split('T')[0];
      return start === ds;
    });

    document.getElementById('selectedDateLabel').textContent = Utils.formatDate(ds);

    let html = '';

    if (tasks.length === 0 && events.length === 0) {
      html = '<p class="text-sm text-slate-500">Tidak ada kegiatan</p>';
    }

    tasks.forEach(t => {
      html += `
      <div class="flex items-start gap-2 p-2.5 rounded-lg bg-surface-700/40">
        <div class="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 ${t.priority==='high'?'bg-rose-400':t.priority==='medium'?'bg-amber-400':'bg-emerald-400'}"></div>
        <div>
          <p class="text-sm font-medium text-white ${t.status==='done'?'line-through opacity-50':''}">${Utils.escHtml(t.title)}</p>
          <p class="text-xs text-slate-500">📋 Tugas · ${t.priority}</p>
        </div>
      </div>`;
    });

    events.forEach(e => {
      const time = e.start?.dateTime ?
        new Date(e.start.dateTime).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : 'Sepanjang hari';
      html += `
      <div class="flex items-start gap-2 p-2.5 rounded-lg bg-blue-500/10 border border-blue-500/20">
        <div class="w-1.5 h-1.5 rounded-full mt-1.5 bg-blue-400 flex-shrink-0"></div>
        <div>
          <p class="text-sm font-medium text-white">${Utils.escHtml(e.summary || 'No title')}</p>
          <p class="text-xs text-blue-300">📅 Google Calendar · ${time}</p>
        </div>
      </div>`;
    });

    document.getElementById('eventsList').innerHTML = html;
  },

  prevMonth() {
    this.currentDate.setMonth(this.currentDate.getMonth() - 1);
    this.renderCalendar();
  },

  nextMonth() {
    this.currentDate.setMonth(this.currentDate.getMonth() + 1);
    this.renderCalendar();
  }
};
