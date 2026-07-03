// ════════════════════════════════════════════════════
//  APP.JS — Router & App Initialization
// ════════════════════════════════════════════════════

const App = (() => {
  let currentPage = 'dashboard';

  const pages = {
    dashboard: { title: 'Dashboard',       module: DashboardPage },
    calendar:  { title: 'Kalender',        module: CalendarPage  },
    courses:   { title: 'Mata Kuliah',     module: CoursesPage   },
    tasks:     { title: 'Tugas & Todo',    module: TasksPage     },
    gym:       { title: 'Gym & Fitness',   module: GymPage       },
    habits:    { title: 'Habit & Air',     module: HabitsPage    },
    finance:   { title: 'Keuangan',        module: FinancePage   },
    settings:  { title: 'Pengaturan',      module: SettingsPage  },
  };

  function navigate(page) {
    if (!pages[page]) return;
    currentPage = page;

    // Update nav highlight
    document.querySelectorAll('.nav-item').forEach(el => {
      el.classList.toggle('active', el.dataset.page === page);
    });

    // Update page title
    const titleEl = document.getElementById('pageTitle');
    if (titleEl) titleEl.textContent = pages[page].title;

    // Close mobile sidebar
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebarOverlay');
    if (window.innerWidth < 1024) {
      sidebar?.classList.add('-translate-x-full');
      overlay?.classList.add('hidden');
    }

    renderPage();
  }

  function renderPage() {
    const container = document.getElementById('pageContainer');
    if (!container) return;

    const module = pages[currentPage]?.module;
    if (!module) return;

    container.innerHTML = module.render();

    if (typeof module.afterRender === 'function') {
      // Defer slightly to allow DOM paint
      requestAnimationFrame(() => module.afterRender());
    }
  }

  function rerenderPage() {
    renderPage();
  }

  async function init() {
    // Init auth (loads GIS library)
    await Auth.init();

    // Navigate to dashboard
    navigate('dashboard');

    // If already logged in, load data
    if (Auth.isLoggedIn()) {
      Store.loadAll();
    }

    // Listen for store changes to re-render active page
    Store.subscribe((key) => {
      // Re-render dashboard stats on any data change
      if (currentPage === 'dashboard' && ['tasks','gymLogs','habitLogs','waterLogs','calendarEvents'].includes(key)) {
        renderPage();
      }
    });

    if (CONFIG.DEBUG) console.log('[App] Initialized');
  }

  return { init, navigate, rerenderPage };
})();

// ── Global router ─────────────────────────────────────
function navigateTo(page) { App.navigate(page); }

// ── Boot ──────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => App.init());
