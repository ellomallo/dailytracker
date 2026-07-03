// ════════════════════════════════════════════════════
//  UTILS.JS — Helpers & UI Utilities
// ════════════════════════════════════════════════════

const Utils = {
  // ── Date Helpers ────────────────────────────────────
  dateStr(d = new Date()) {
    return d.toISOString().split('T')[0]; // YYYY-MM-DD
  },

  dayName(d = new Date()) {
    return ['Minggu','Senin','Selasa','Rabu','Kamis','Jumat','Sabtu'][d.getDay()];
  },

  formatDate(str) {
    if (!str) return '-';
    const d = new Date(str + 'T00:00:00');
    return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
  },

  formatDateShort(str) {
    if (!str) return '-';
    const d = new Date(str + 'T00:00:00');
    return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
  },

  monthRange(d = new Date()) {
    const y = d.getFullYear(), m = d.getMonth();
    return {
      from: new Date(y, m, 1).toISOString().split('T')[0],
      to:   new Date(y, m + 1, 0).toISOString().split('T')[0],
    };
  },

  monthName(d = new Date()) {
    return d.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
  },

  uid() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  },

  isOverdue(dateStr) {
    if (!dateStr) return false;
    return new Date(dateStr) < new Date(Utils.dateStr());
  },

  // ── Currency ────────────────────────────────────────
  formatRupiah(n) {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n || 0);
  },

  // ── DOM Helpers ─────────────────────────────────────
  $(sel, ctx = document) { return ctx.querySelector(sel); },
  $$(sel, ctx = document) { return [...ctx.querySelectorAll(sel)]; },

  escHtml(str) {
    if (!str) return '';
    return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  },
};

// ── Toast Notification ────────────────────────────────
function showToast(msg, type = 'info', duration = 3500) {
  const container = document.getElementById('toastContainer');
  if (!container) return;

  const icons = {
    success: '<svg class="w-4 h-4 text-brand-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>',
    error:   '<svg class="w-4 h-4 text-rose-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>',
    info:    '<svg class="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>',
  };

  const el = document.createElement('div');
  el.className = `toast ${type}`;
  el.innerHTML = `${icons[type] || icons.info}<span class="text-sm">${Utils.escHtml(msg)}</span>`;
  container.appendChild(el);

  setTimeout(() => {
    el.style.opacity = '0';
    el.style.transition = 'opacity 0.3s ease';
    setTimeout(() => el.remove(), 300);
  }, duration);
}

// ── Modal ─────────────────────────────────────────────
function openModal(html) {
  const backdrop = document.getElementById('modalBackdrop');
  const content  = document.getElementById('modalContent');
  content.innerHTML = html;
  backdrop.classList.remove('hidden');
  backdrop.classList.add('flex');
  document.body.style.overflow = 'hidden';
}

function closeModal() {
  const backdrop = document.getElementById('modalBackdrop');
  backdrop.classList.add('hidden');
  backdrop.classList.remove('flex');
  document.body.style.overflow = '';
}

document.getElementById('modalBackdrop')?.addEventListener('click', (e) => {
  if (e.target.id === 'modalBackdrop') closeModal();
});

// ── Sidebar Toggle ────────────────────────────────────
function toggleSidebar() {
  const sidebar  = document.getElementById('sidebar');
  const overlay  = document.getElementById('sidebarOverlay');
  const isOpen   = !sidebar.classList.contains('-translate-x-full');
  sidebar.classList.toggle('-translate-x-full', isOpen);
  overlay.classList.toggle('hidden', isOpen);
}

// ── Dark Mode Toggle ──────────────────────────────────
function toggleDarkMode() {
  document.documentElement.classList.toggle('dark');
  localStorage.setItem('darkMode', document.documentElement.classList.contains('dark') ? '1' : '0');
}

// Restore dark mode preference
(function() {
  const pref = localStorage.getItem('darkMode');
  if (pref === '0') document.documentElement.classList.remove('dark');
})();

// ── Progress Ring SVG ─────────────────────────────────
function progressRingSvg(pct, size = 56, strokeW = 4, color = '#14b8a6') {
  const r = (size - strokeW * 2) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (Math.min(pct, 100) / 100) * circ;
  return `
    <svg width="${size}" height="${size}" class="progress-ring">
      <circle cx="${size/2}" cy="${size/2}" r="${r}" fill="none"
        stroke="rgba(148,163,184,0.15)" stroke-width="${strokeW}"/>
      <circle cx="${size/2}" cy="${size/2}" r="${r}" fill="none"
        stroke="${color}" stroke-width="${strokeW}"
        stroke-dasharray="${circ}" stroke-dashoffset="${offset}"
        stroke-linecap="round" class="progress-ring-circle"/>
    </svg>`;
}
