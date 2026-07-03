// ════════════════════════════════════════════════════
//  AUTH.JS — Google OAuth 2.0 via GIS (Google Identity Services)
// ════════════════════════════════════════════════════

const Auth = (() => {
  let tokenClient = null;
  let accessToken = null;
  let userInfo = null;
  let isInitialized = false;

  // ── Load Google Identity Services library ──────────
  function loadGIS() {
    return new Promise((resolve) => {
      if (window.google?.accounts) return resolve();
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.onload = resolve;
      script.onerror = () => { console.error('Gagal load GIS'); resolve(); };
      document.head.appendChild(script);
    });
  }

  // ── Initialize ─────────────────────────────────────
  async function init() {
    if (isInitialized) return;
    await loadGIS();

    if (!window.google?.accounts) {
      console.warn('Google Identity Services tidak tersedia');
      return;
    }

    tokenClient = google.accounts.oauth2.initTokenClient({
      client_id: CONFIG.GOOGLE_CLIENT_ID,
      scope: CONFIG.SCOPES,
      callback: handleTokenResponse,
    });

    // Cek token tersimpan
    const stored = sessionStorage.getItem('gapi_token');
    if (stored) {
      const parsed = JSON.parse(stored);
      if (parsed.expires > Date.now()) {
        accessToken = parsed.token;
        await fetchUserInfo();
        updateAuthUI(true);
      }
    }

    isInitialized = true;
    if (CONFIG.DEBUG) console.log('[Auth] Initialized');
  }

  // ── Token Handler ───────────────────────────────────
  async function handleTokenResponse(response) {
    if (response.error) {
      console.error('[Auth] Token error:', response.error);
      showToast('Login gagal: ' + response.error, 'error');
      return;
    }
    accessToken = response.access_token;
    const expires = Date.now() + (response.expires_in * 1000);
    sessionStorage.setItem('gapi_token', JSON.stringify({ token: accessToken, expires }));

    await fetchUserInfo();
    updateAuthUI(true);
    showToast('Login berhasil!', 'success');
    Store.loadAll();
  }

  // ── Fetch User Profile ──────────────────────────────
  async function fetchUserInfo() {
    if (!accessToken) return;
    try {
      const res = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      userInfo = await res.json();
      if (CONFIG.DEBUG) console.log('[Auth] User:', userInfo);
    } catch (e) {
      console.error('[Auth] fetchUserInfo failed', e);
    }
  }

  // ── Trigger Login ───────────────────────────────────
  function login() {
    if (!tokenClient) {
      showToast('Google Client ID belum diisi di config.js', 'error');
      return;
    }
    tokenClient.requestAccessToken({ prompt: '' });
  }

  // ── Logout ──────────────────────────────────────────
  function logout() {
    if (accessToken) {
      google.accounts.oauth2.revoke(accessToken, () => {});
    }
    accessToken = null;
    userInfo = null;
    sessionStorage.removeItem('gapi_token');
    Store.reset();
    updateAuthUI(false);
    showToast('Logout berhasil', 'info');
  }

  // ── Update UI ───────────────────────────────────────
  function updateAuthUI(loggedIn) {
    const authBtn = document.getElementById('authBtn');
    const syncDot = document.getElementById('syncDot');
    const syncText = document.getElementById('syncText');
    const userName = document.getElementById('userName');
    const userAvatar = document.getElementById('userAvatar');

    if (loggedIn && userInfo) {
      if (authBtn) { authBtn.textContent = 'Logout'; authBtn.onclick = logout; }
      if (syncDot) syncDot.className = 'w-1.5 h-1.5 rounded-full bg-brand-400';
      if (syncText) syncText.textContent = 'Sinkron';
      if (userName) userName.textContent = userInfo.name || userInfo.email;
      if (userAvatar) userAvatar.textContent = (userInfo.name || 'U')[0].toUpperCase();
    } else {
      if (authBtn) { authBtn.textContent = 'Login Google'; authBtn.onclick = login; }
      if (syncDot) syncDot.className = 'w-1.5 h-1.5 rounded-full bg-slate-500';
      if (syncText) syncText.textContent = 'Offline';
      if (userName) userName.textContent = 'Belum Login';
      if (userAvatar) userAvatar.textContent = '?';
    }
  }

  // ── Getters ─────────────────────────────────────────
  const getToken = () => accessToken;
  const getUser  = () => userInfo;
  const isLoggedIn = () => !!accessToken;

  return { init, login, logout, getToken, getUser, isLoggedIn, updateAuthUI };
})();

function handleAuth() { Auth.isLoggedIn() ? Auth.logout() : Auth.login(); }
