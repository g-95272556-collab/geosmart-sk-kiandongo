// ============================================================
//  geo.js — Pengesahan Lokasi GPS & Daftar Masuk
// ============================================================
const Geo = (() => {
  let _kedudukan = null;
  let _jarakM    = null;

  function _haversine(lat1, lng1, lat2, lng2) {
    const R  = 6371000;
    const dL = (lat2 - lat1) * Math.PI / 180;
    const dG = (lng2 - lng1) * Math.PI / 180;
    const a  = Math.sin(dL/2)**2 + Math.cos(lat1*Math.PI/180) * Math.cos(lat2*Math.PI/180) * Math.sin(dG/2)**2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  }

  function semakLokasi(callback) {
    if (!navigator.geolocation) { callback({ ok: false, sebab: 'Peranti tidak menyokong GPS.' }); return; }
    navigator.geolocation.getCurrentPosition(
      pos => {
        _kedudukan = pos.coords;
        _jarakM = Math.round(_haversine(pos.coords.latitude, pos.coords.longitude, CONFIG.SCHOOL.lat, CONFIG.SCHOOL.lng));
        callback({ ok: true, dalamZon: _jarakM <= CONFIG.SCHOOL.radius_m, jarakM: _jarakM });
      },
      err => {
        const msg = { 1:'Kebenaran lokasi ditolak.', 2:'Lokasi tidak dapat dikesan.', 3:'Masa tamat. Cuba semula.' }[err.code] || 'Ralat lokasi.';
        callback({ ok: false, sebab: msg });
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  }

  async function doCheckin() {
    const sesi  = Auth.getSesi();
    if (!sesi)  return;
    const btnCI = document.getElementById('btn-checkin');
    if (btnCI)  { btnCI.disabled = true; btnCI.textContent = 'Mendaftarkan…'; }

    semakLokasi(async result => {
      if (!result.ok) {
        alert(result.sebab);
        if (btnCI) { btnCI.disabled = false; btnCI.textContent = 'Daftar Masuk'; }
        return;
      }
      if (!result.dalamZon) {
        alert(`Anda berada ${result.jarakM}m dari sekolah. Had: ${CONFIG.SCHOOL.radius_m}m.`);
        if (btnCI) { btnCI.disabled = false; btnCI.textContent = 'Daftar Masuk'; }
        return;
      }
      const skrg   = new Date();
      const masa   = _formatMasa(skrg);
      const tarikh = _formatTarikh(skrg);
      const status = _statusKehadiran(skrg);
      const baris  = [tarikh, masa, sesi.nama, sesi.emel, status, result.jarakM + 'm', '', ''];

      try {
        await Sheets.tambahBaris(CONFIG.SHEETS.SHEET_KEHADIRAN, baris);
        if (CONFIG.NOTIF.hantar_lewat && status === 'Lewat') {
          await Fonnte.hantarAdmin(`⚠️ *LEWAT MASUK*\n👤 ${sesi.nama}\n🕐 ${masa}\n📅 ${tarikh}\n📍 ${result.jarakM}m`);
        }
        _kemasTatus('hadir', masa, status, result.jarakM);
        if (btnCI) btnCI.disabled = true;
      } catch (e) {
        alert('Gagal menyimpan rekod. Cuba semula.');
        if (btnCI) { btnCI.disabled = false; btnCI.textContent = 'Daftar Masuk'; }
      }
    });
  }

  function _statusKehadiran(masa) {
    const [wL, wA] = [CONFIG.SCHOOL.waktu_lewat, CONFIG.SCHOOL.waktu_absent].map(w => {
      const [j, m] = w.split(':'); return parseInt(j)*60 + parseInt(m);
    });
    const minit = masa.getHours() * 60 + masa.getMinutes();
    if (minit >= wA) return 'Tidak Hadir';
    if (minit >= wL) return 'Lewat';
    return 'Hadir';
  }

  function _kemasTatus(jenis, masa, status, jarakM) {
    const label = document.getElementById('status-label');
    const sub   = document.getElementById('status-sub');
    const card  = document.getElementById('status-card');
    if (label) label.textContent = `${status} — ${masa}`;
    if (sub)   sub.textContent   = `${jarakM}m dari sekolah`;
    if (card)  card.className    = `status-card status-${jenis}`;
  }

  function _formatMasa(d) { return d.toLocaleTimeString('ms-MY', { hour:'2-digit', minute:'2-digit' }); }
  function _formatTarikh(d) { return d.toLocaleDateString('ms-MY', { day:'2-digit', month:'2-digit', year:'numeric' }); }

  return { semakLokasi, doCheckin };
})();
