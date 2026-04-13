// ============================================================
//  sheets.js — Integrasi Google Sheets API
// ============================================================
const Sheets = (() => {
  const BASE = 'https://sheets.googleapis.com/v4/spreadsheets';
  const SID  = () => CONFIG.SHEETS.SPREADSHEET_ID;

  async function _headers() {
    const token = await Auth.getAccessToken();
    return { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };
  }

  async function tambahBaris(helaian, nilai) {
    const url = `${BASE}/${SID()}/values/${helaian}:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`;
    const res = await fetch(url, { method:'POST', headers: await _headers(), body: JSON.stringify({ values: [nilai] }) });
    if (!res.ok) { const err = await res.json().catch(()=>({})); throw new Error(`Sheets tambahBaris: ${res.status} — ${err?.error?.message||''}`); }
    return res.json();
  }

  async function bacaHelaian(helaian, julat = '') {
    const url = `${BASE}/${SID()}/values/${helaian}${julat ? '!' + julat : ''}`;
    const res = await fetch(url, { headers: await _headers() });
    if (!res.ok) throw new Error(`Sheets bacaHelaian: ${res.status}`);
    const data = await res.json();
    return data.values || [];
  }

  async function tulisNilai(helaian, julat, nilai) {
    const url = `${BASE}/${SID()}/values/${helaian}!${julat}?valueInputOption=USER_ENTERED`;
    const res = await fetch(url, { method:'PUT', headers: await _headers(), body: JSON.stringify({ values: [[nilai]] }) });
    if (!res.ok) throw new Error(`Sheets tulisNilai: ${res.status}`);
    return res.json();
  }

  async function bacaKehadiranHariIni() {
    const semua  = await bacaHelaian(CONFIG.SHEETS.SHEET_KEHADIRAN);
    const tarikh = new Date().toLocaleDateString('ms-MY', { day:'2-digit', month:'2-digit', year:'numeric' });
    return semua.filter(r => r[0] === tarikh);
  }

  async function bacaCutiPending() {
    const semua = await bacaHelaian(CONFIG.SHEETS.SHEET_CUTI);
    return semua.filter(r => r[6] === 'Menunggu' || !r[6]);
  }

  return { tambahBaris, bacaHelaian, tulisNilai, bacaKehadiranHariIni, bacaCutiPending };
})();
