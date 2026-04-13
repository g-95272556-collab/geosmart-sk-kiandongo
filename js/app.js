// ============================================================
//  app.js — Logik Utama Dashboard Guru
//  Ciri #5: Jam digital + tarikh/hari
//  Ciri #6: Notifikasi peringatan GPS offline
// ============================================================
const App = (() => {

  let _sesi = null;

  // ── Init ─────────────────────────────────────────────────
  function init() {
    _sesi = Auth.wajibLogMasuk();
    if (!_sesi) return;

    const elNama = document.getElementById('user-nama');
    if (elNama) elNama.textContent = _sesi.nama;

    if (CONFIG.adalahAdmin(_sesi.emel)) {
      document.getElementById('btn-admin')?.classList.remove('hidden');
    }

    // Ciri #5: Mulakan jam digital
    _mulaJam();

    // Semak lokasi & Ciri #6: peringatan GPS
    _semakLokasiAwal();

    // Muat rekod
    _muatRekodHariIni();

    // Mulakan cron (tugas berjadual)
    if (typeof Cron !== 'undefined') Cron.init(_sesi);
  }

  // ── Ciri #5: Jam Digital ──────────────────────────────────
  function _mulaJam() {
    function _kemaskiniJam() {
      const kini  = new Date();
      const jam   = kini.toLocaleTimeString('ms-MY', { hour:'2-digit', minute:'2-digit', second:'2-digit' });
      const hari  = kini.toLocaleDateString('ms-MY', { weekday:'long', day:'numeric', month:'long', year:'numeric' });

      const elJam    = document.getElementById('jam-skrin');
      const elTarikh = document.getElementById('tarikh-skrin');

      if (elJam)    elJam.textContent    = jam;
      if (elTarikh) elTarikh.textContent = hari;
    }
    _kemaskiniJam();
    setInterval(_kemaskiniJam, 1000);
  }

  // ── Semak lokasi awal + Ciri #6 ──────────────────────────
  function _semakLokasiAwal() {
    const icon    = document.getElementById('status-icon');
    const label   = document.getElementById('status-label');
    const sub     = document.getElementById('status-sub');
    const banner  = document.getElementById('banner-gps');

    if (icon)  icon.textContent  = '⏳';
    if (label) label.textContent = 'Menyemak lokasi…';

    Geo.semakLokasi(result => {
      if (!result.ok) {
        // Ciri #6: Papar banner GPS offline + hantar notifikasi WA
        if (icon)  icon.textContent  = '❌';
        if (label) label.textContent = 'GPS tidak dapat dikesan';
        if (sub)   sub.textContent   = result.sebab;
        if (banner) banner.classList.remove('hidden');

        // Hantar peringatan GPS offline kepada pengguna sendiri
        _hantarPeringatanGPS();
        return;
      }

      if (banner) banner.classList.add('hidden');

      if (result.dalamZon) {
        if (icon)  icon.textContent  = '✅';
        if (label) label.textContent = 'Anda berada di kawasan sekolah';
        if (sub)   sub.textContent   = `${result.jarakM}m dari pusat geofence`;
        const btn = document.getElementById('btn-checkin');
        if (btn) btn.disabled = false;
      } else {
        if (icon)  icon.textContent  = '📍';
        if (label) label.textContent = 'Di luar kawasan sekolah';
        if (sub)   sub.textContent   = `${result.jarakM}m (Had: ${CONFIG.SCHOOL.radius_m}m)`;
      }
    });
  }

  // ── Ciri #6: Peringatan GPS Offline via WA ────────────────
  async function _hantarPeringatanGPS() {
    if (!_sesi || !_sesi.no_wa) return;

    const tarikh = new Date().toLocaleDateString('ms-MY', { day:'2-digit', month:'2-digit', year:'numeric' });
    const masa   = new Date().toLocaleTimeString('ms-MY', { hour:'2-digit', minute:'2-digit' });

    try {
      await Fonnte.hantar(_sesi.no_wa,
        `📵 *PERINGATAN GPS OFFLINE*\n` +
        `Assalamualaikum ${_sesi.nama},\n\n` +
        `Sistem mengesan GPS anda tidak berfungsi pada:\n` +
        `📅 ${tarikh} | 🕐 ${masa}\n\n` +
        `Sila gunakan fungsi *Log Manual* untuk mendaftar masuk atau keluar.\n\n` +
        `_Sistem GeoSmart SK Kiandongo_`
      );
    } catch (e) {
      console.warn('Gagal hantar peringatan GPS:', e);
    }
  }

  // ── Muat rekod hari ini ───────────────────────────────────
  async function _muatRekodHariIni() {
    try {
      const semua  = await Sheets.bacaHelaian(CONFIG.SHEETS.SHEET_KEHADIRAN);
      const tarikh = new Date().toLocaleDateString('ms-MY', { day:'2-digit', month:'2-digit', year:'numeric' });
      const rekod  = semua.filter(r => r[0] === tarikh && r[2] === _sesi.nama);
      const el     = document.getElementById('rekod-list');
      if (!el) return;

      if (!rekod.length) {
        el.innerHTML = '<div class="rekod-kosong">Tiada rekod daftar masuk hari ini</div>';
        return;
      }

      el.innerHTML = rekod.map(r => {
        const isManual = r[5] === 'Manual';
        return `
          <div class="rekod-item rekod-${(r[4]||'').toLowerCase().replace(' ','-')}">
            <span class="rekod-masa">${r[1]}</span>
            <span class="rekod-status">${r[4]}</span>
            <span class="rekod-jarak">${isManual
              ? '<span class="badge-manual">✏️ Manual</span>'
              : r[5]}</span>
          </div>`;
      }).join('');
    } catch (e) {
      console.warn('Gagal muat rekod:', e);
    }
  }

  // ── Modal Log Manual ──────────────────────────────────────
  function bukaLogManual() {
    const kini = new Date();
    document.getElementById('lm-masa').value =
      kini.getHours().toString().padStart(2,'0') + ':' + kini.getMinutes().toString().padStart(2,'0');

    const minit = kini.getHours() * 60 + kini.getMinutes();
    const [jL, mL] = CONFIG.SCHOOL.waktu_lewat.split(':').map(Number);
    const selStatus = document.getElementById('lm-status');
    if (selStatus) selStatus.value = minit >= (jL * 60 + mL) ? 'Lewat' : 'Hadir';

    document.getElementById('lm-sebab').value = '';
    bukaModal('modal-logmanual');
  }

  async function hantarLogManual() {
    const masa   = document.getElementById('lm-masa').value;
    const status = document.getElementById('lm-status').value;
    const sebab  = document.getElementById('lm-sebab').value.trim();

    if (!masa)  { alert('Sila masukkan masa.'); return; }
    if (!sebab) { alert('Sila nyatakan sebab log manual.'); return; }

    const tarikh = new Date().toLocaleDateString('ms-MY', { day:'2-digit', month:'2-digit', year:'numeric' });
    const baris  = [tarikh, masa, _sesi.nama, _sesi.emel, status, 'Manual', sebab, _sesi.nama];

    try {
      await Sheets.tambahBaris(CONFIG.SHEETS.SHEET_KEHADIRAN, baris);
      await Fonnte.hantarAdmin(
        `✏️ *LOG MANUAL*\n👤 ${_sesi.nama}\n📅 ${tarikh}  🕐 ${masa}\n📊 ${status}\n📝 ${sebab}`
      );
      tutupModal('modal-logmanual');
      alert('Rekod kehadiran manual telah disimpan.');
      _muatRekodHariIni();
    } catch (e) {
      alert('Gagal menyimpan rekod. Cuba semula.');
    }
  }

  // ── Modal Cuti ────────────────────────────────────────────
  function bukaCuti() {
    const hari = new Date().toISOString().split('T')[0];
    document.getElementById('cuti-mula').value  = hari;
    document.getElementById('cuti-tamat').value = hari;
    bukaModal('modal-cuti');
  }

  async function hantarCuti() {
    const mula  = document.getElementById('cuti-mula').value;
    const tamat = document.getElementById('cuti-tamat').value;
    const jenis = document.getElementById('cuti-jenis').value;
    const sebab = document.getElementById('cuti-sebab').value;

    if (!mula || !tamat || !sebab.trim()) { alert('Sila isi semua maklumat cuti.'); return; }

    const baris = [new Date().toLocaleDateString('ms-MY'), _sesi.nama, _sesi.emel, mula, tamat, jenis, 'Menunggu', sebab];

    try {
      await Sheets.tambahBaris(CONFIG.SHEETS.SHEET_CUTI, baris);
      if (CONFIG.NOTIF.hantar_cuti) {
        await Fonnte.hantarAdmin(
          `📋 *PERMOHONAN CUTI*\n👤 ${_sesi.nama}\n📅 ${mula} hingga ${tamat}\n🏷️ ${jenis}\n📝 ${sebab}`
        );
      }
      tutupModal('modal-cuti');
      alert('Permohonan cuti telah dihantar.');
    } catch (e) { alert('Gagal menghantar permohonan. Cuba semula.'); }
  }

  // ── Modal Tugas Luar ──────────────────────────────────────
  function bukaTugasLuar() {
    document.getElementById('tl-tarikh').value = new Date().toISOString().split('T')[0];
    bukaModal('modal-tugasluar');
  }

  async function hantarTugasLuar() {
    const tarikh    = document.getElementById('tl-tarikh').value;
    const destinasi = document.getElementById('tl-destinasi').value;
    const tujuan    = document.getElementById('tl-tujuan').value;

    if (!destinasi.trim() || !tujuan.trim()) { alert('Sila lengkapkan maklumat tugas luar.'); return; }

    const baris = [new Date().toLocaleDateString('ms-MY'), _sesi.nama, _sesi.emel, tarikh, destinasi, tujuan, 'Direkod'];

    try {
      await Sheets.tambahBaris(CONFIG.SHEETS.SHEET_KELUAR, baris);
      if (CONFIG.NOTIF.hantar_tugas_luar) {
        await Fonnte.hantarAdmin(`🚗 *TUGAS LUAR*\n👤 ${_sesi.nama}\n📅 ${tarikh}\n📍 ${destinasi}\n📝 ${tujuan}`);
      }
      tutupModal('modal-tugasluar');
      alert('Rekod tugas luar telah disimpan.');
    } catch (e) { alert('Gagal menyimpan rekod. Cuba semula.'); }
  }

  // ── Modal Keluar Pejabat (Ciri #1: Jana slip PDF) ─────────
  function bukaKeluarPejabat() {
    const kini = new Date();
    document.getElementById('kp-masa').value =
      kini.getHours().toString().padStart(2,'0') + ':' + kini.getMinutes().toString().padStart(2,'0');
    bukaModal('modal-keluar');
  }

  async function hantarKeluarPejabat() {
    const masa      = document.getElementById('kp-masa').value;
    const destinasi = document.getElementById('kp-destinasi').value;
    const sebab     = document.getElementById('kp-sebab').value;

    if (!destinasi.trim() || !sebab.trim()) { alert('Sila lengkapkan maklumat keluar pejabat.'); return; }

    const tarikh = new Date().toLocaleDateString('ms-MY');
    const baris  = [tarikh, _sesi.nama, _sesi.emel, masa, destinasi, sebab, 'Keluar'];

    try {
      await Sheets.tambahBaris(CONFIG.SHEETS.SHEET_KELUAR, baris);

      if (CONFIG.NOTIF.hantar_keluar_pejabat) {
        await Fonnte.hantarAdmin(`🚪 *KELUAR PEJABAT*\n👤 ${_sesi.nama}\n🕐 ${masa}\n📍 ${destinasi}\n📝 ${sebab}`);
      }

      tutupModal('modal-keluar');

      // Ciri #1: Tawarkan cetak slip PDF
      const cetakSlip = confirm('Rekod disimpan. Cetak Slip Kebenaran Keluar Pejabat sekarang?');
      if (cetakSlip && typeof PDF !== 'undefined') {
        PDF.janaSlipKeluarPejabat({
          nama:      _sesi.nama,
          jawatan:   _sesi.jawatan || 'Guru',
          tarikh,
          masa,
          destinasi,
          sebab,
        });
      }

    } catch (e) { alert('Gagal menyimpan rekod. Cuba semula.'); }
  }

  // ── Helpers Modal ─────────────────────────────────────────
  function bukaModal(id)  { document.getElementById(id)?.classList.add('aktif'); }
  function tutupModal(id) { document.getElementById(id)?.classList.remove('aktif'); }

  document.addEventListener('DOMContentLoaded', init);

  return {
    bukaCuti, hantarCuti, bukaTugasLuar, hantarTugasLuar,
    bukaKeluarPejabat, hantarKeluarPejabat,
    bukaLogManual, hantarLogManual,
    bukaModal, tutupModal
  };

})();
