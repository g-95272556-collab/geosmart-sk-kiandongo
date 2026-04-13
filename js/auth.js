// ============================================================
//  auth.js — Autentikasi Google SSO + OAuth Sheets Token
// ============================================================
const Auth = (() => {
  const KUNCI_SESI  = 'geosmart_user';
  const KUNCI_TOKEN = 'geosmart_access_token';
  const SCOPE       = 'https://www.googleapis.com/auth/spreadsheets';
  let _tokenClient  = null;

  function initTokenClient() {
    if (typeof google === 'undefined' || !google.accounts) return;
    _tokenClient = google.accounts.oauth2.initTokenClient({
      client_id: CONFIG.GOOGLE_CLIENT_ID,
      scope: SCOPE,
      callback: async (tr) => {
        if (tr.error) { console.error('Token error:', tr); return; }
        // Ciri #4: Enkripsi token akses
        if (typeof CryptoHelper !== 'undefined') {
          await CryptoHelper.simpanToken('access_token', JSON.stringify({
            token: tr.access_token,
            expiry: Date.now() + (tr.expires_in * 1000),
          }));
        } else {
          sessionStorage.setItem(KUNCI_TOKEN, JSON.stringify({
            token: tr.access_token,
            expiry: Date.now() + (tr.expires_in * 1000),
          }));
        }
        if (window._tokenResolvers) {
          window._tokenResolvers.forEach(fn => fn(tr.access_token));
          window._tokenResolvers = [];
        }
      },
    });
  }

  function handleLogin(response) {
    const payload  = _parseJwt(response.credential);
    const emel     = payload.email;
    const pengguna = CONFIG.dapatkanPengguna(emel);
    if (!pengguna) {
      _tunjukRalat('Akaun ini tidak berdaftar dalam sistem GeoSmart SK Kiandongo. Sila hubungi pentadbir sekolah.');
      return;
    }
    sessionStorage.setItem(KUNCI_SESI, JSON.stringify({
      emel, nama: pengguna.nama, no_wa: pengguna.no_wa || '',
      peranan: pengguna.peranan, jawatan: pengguna.jawatan || '', masa: Date.now(),
    }));
    window.location.href = 'dashboard.html';
  }

  function getAccessToken() {
    return new Promise(async (resolve) => {
      // Cuba baca token terenkripsi dahulu
      if (typeof CryptoHelper !== 'undefined') {
        try {
          const raw = await CryptoHelper.bacaToken('access_token');
          if (raw) {
            const data = JSON.parse(raw);
            if (data && Date.now() < data.expiry - 60000) { resolve(data.token); return; }
          }
        } catch {}
      } else {
        try {
          const data = JSON.parse(sessionStorage.getItem(KUNCI_TOKEN));
          if (data && Date.now() < data.expiry - 60000) { resolve(data.token); return; }
        } catch {}
      }
      if (!window._tokenResolvers) window._tokenResolvers = [];
      window._tokenResolvers.push(resolve);
      if (_tokenClient) {
        _tokenClient.requestAccessToken({ prompt: '' });
      } else {
        const tunggu = setInterval(() => {
          if (_tokenClient) { clearInterval(tunggu); _tokenClient.requestAccessToken({ prompt: '' }); }
        }, 200);
      }
    });
  }

  function getSesi() {
    try { return JSON.parse(sessionStorage.getItem(KUNCI_SESI)); }
    catch { return null; }
  }

  function wajibLogMasuk() {
    const sesi = getSesi();
    if (!sesi) { window.location.href = 'index.html'; return null; }
    return sesi;
  }

  function wajibAdmin() {
    const sesi = wajibLogMasuk();
    if (!sesi) return null;
    if (!CONFIG.adalahAdmin(sesi.emel)) {
      alert('Akses ditolak. Halaman ini untuk pentadbir sahaja.');
      window.location.href = 'dashboard.html';
      return null;
    }
    return sesi;
  }

  function logout() {
    try {
      const data = JSON.parse(sessionStorage.getItem(KUNCI_TOKEN) || 'null');
      if (data?.token) google.accounts.oauth2.revoke(data.token, () => {});
    } catch {}
    sessionStorage.clear();
    window.location.href = 'index.html';
  }

  function _parseJwt(token) {
    const base64 = token.split('.')[1].replace(/-/g,'+').replace(/_/g,'/');
    return JSON.parse(atob(base64));
  }

  function _tunjukRalat(msg) {
    const el = document.getElementById('login-error');
    if (el) { el.textContent = msg; el.classList.remove('hidden'); }
    else alert(msg);
  }

  return { initTokenClient, handleLogin, getAccessToken, getSesi, wajibLogMasuk, wajibAdmin, logout };
})();
