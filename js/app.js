// ============================================================
//  app.js — Logik Utama Dashboard Guru
//  Ciri #5: Jam digital realtime
//  Ciri #6: Peringatan GPS offline via WA
//  Ciri #8: PWA install prompt
//  Ciri #9: Upload sijil sakit (fail/kamera)
// ============================================================
const App = (() => {

  let _sesi         = null;
  let _pwaPrompt    = null;
  let _streamKamera = null;
  let _dataSijil    = null;

  function init() {
    _sesi = Auth.wajibLogMasuk();
    if (!_sesi) return;

    document.getElementById('user-nama').textContent = _sesi.nama;
    if (CONFIG.adalahAdmin(_sesi.emel)) document.getElementById('btn-admin')?.classList.remove('hidden');

    _mulaJam();
    _semakLokasiAwal();
    _muatRekodHariIni();
    _initPWA();
    if (typeof Cron !== 'undefined') Cron.init(_sesi);
  }

  // Ciri #5: Jam digital
  function _mulaJam() {
    const tick = () => {
      const k = new Date();
      const ej = document.getElementById('jam-skrin');
      const et = document.getElementById('tarikh-skrin');
      if (ej) ej.textContent = k.toLocaleTimeString('ms-MY', { hour:'2-digit', minute:'2-digit', second:'2-digit' });
      if (et) et.textContent = k.toLocaleDateString('ms-MY', { weekday:'long', day:'numeric', month:'long', year:'numeric' });
    };
    tick(); setInterval(tick, 1000);
  }

  // Ciri #8: PWA install
  function _initPWA() {
    window.addEventListener('beforeinstallprompt', e => {
      e.preventDefault(); _pwaPrompt = e;
      document.getElementById('banner-pwa')?.classList.remove('hidden');
    });
    window.addEventListener('appinstalled', () => {
      document.getElementById('banner-pwa')?.classList.add('hidden');
      _pwaPrompt = null;
    });
  }

  async function pasangPWA() {
    if (!_pwaPrompt) return;
    _pwaPrompt.prompt();
    const { outcome } = await _pwaPrompt.userChoice;
    if (outcome === 'accepted') document.getElementById('banner-pwa')?.classList.add('hidden');
    _pwaPrompt = null;
  }

  // Ciri #6: Semak GPS + peringatan offline
  function _semakLokasiAwal() {
    const icon = document.getElementById('status-icon');
    const label = document.getElementById('status-label');
    const sub = document.getElementById('status-sub');
    const banner = document.getElementById('banner-gps');

    if (icon) icon.textContent = '⏳';
    if (label) label.textContent = 'Menyemak lokasi…';

    Geo.semakLokasi(result => {
      if (!result.ok) {
        if (icon) icon.textContent = '❌';
        if (label) label.textContent = 'GPS tidak dapat dikesan';
        if (sub) sub.textContent = result.sebab;
        if (banner) banner.classList.remove('hidden');
        _hantarPeringatanGPS(result.sebab);
        return;
      }
      if (banner) banner.classList.add('hidden');
      if (result.dalamZon) {
        if (icon) icon.textContent = '✅';
        if (label) label.textContent = 'Anda berada di kawasan sekolah';
        if (sub) sub.textContent = `${result.jarakM}m dari pusat geofence`;
        const btn = document.getElementById('btn-checkin');
        if (btn) btn.disabled = false;
      } else {
        if (icon) icon.textContent = '📍';
        if (label) label.textContent = 'Di luar kawasan sekolah';
        if (sub) sub.textContent = `${result.jarakM}m (Had: ${CONFIG.SCHOOL.radius_m}m)`;
      }
    });
  }

  async function _hantarPeringatanGPS(sebab) {
    if (!_sesi?.no_wa) return;
    const masa = new Date().toLocaleTimeString('ms-MY', { hour:'2-digit', minute:'2-digit' });
    try {
      await Fonnte.hantar(_sesi.no_wa,
        `📵 *PERINGATAN GPS OFFLINE*\n${_sesi.nama},\n\nGPS tidak dapat dikesan pada ${masa}.\nSebab: ${sebab}\n\nSila gunakan *Log Manual* untuk daftar masuk.\n\n_GeoSmart SK Kiandongo_`
      );
    } catch (e) { console.warn('Gagal hantar peringatan GPS:', e); }
  }

  async function _muatRekodHariIni() {
    try {
      const semua = await Sheets.bacaHelaian(CONFIG.SHEETS.SHEET_KEHADIRAN);
      const tarikh = new Date().toLocaleDateString('ms-MY', { day:'2-digit', month:'2-digit', year:'numeric' });
      const rekod = semua.filter(r => r[0] === tarikh && r[2] === _sesi.nama);
      const el = document.getElementById('rekod-list');
      if (!el) return;
      if (!rekod.length) { el.innerHTML = '<div class="rekod-kosong">Tiada rekod daftar masuk hari ini</div>'; return; }
      el.innerHTML = rekod.map(r => {
        const isManual = r[5] === 'Manual';
        return `<div class="rekod-item rekod-${(r[4]||'').toLowerCase().replace(' ','-')}">
          <span class="rekod-masa">${r[1]}</span>
          <span class="rekod-status">${r[4]}</span>
          <span class="rekod-jarak">${isManual ? '<span class="badge-manual">✏️ Manual</span>' : r[5]}</span>
        </div>`;
      }).join('');
    } catch (e) { console.warn('Gagal muat rekod:', e); }
  }

  // Log Manual
  function bukaLogManual() {
    const kini = new Date();
    document.getElementById('lm-masa').value = kini.getHours().toString().padStart(2,'0') + ':' + kini.getMinutes().toString().padStart(2,'0');
    const minit = kini.getHours()*60 + kini.getMinutes();
    const [jL, mL] = CONFIG.SCHOOL.waktu_lewat.split(':').map(Number);
    document.getElementById('lm-status').value = minit >= (jL*60+mL) ? 'Lewat' : 'Hadir';
    document.getElementById('lm-sebab').value = '';
    bukaModal('modal-logmanual');
  }

  async function hantarLogManual() {
    const masa = document.getElementById('lm-masa').value;
    const status = document.getElementById('lm-status').value;
    const sebab = document.getElementById('lm-sebab').value.trim();
    if (!masa) { alert('Sila masukkan masa.'); return; }
    if (!sebab) { alert('Sila nyatakan sebab.'); return; }
    const tarikh = new Date().toLocaleDateString('ms-MY', { day:'2-digit', month:'2-digit', year:'numeric' });
    try {
      await Sheets.tambahBaris(CONFIG.SHEETS.SHEET_KEHADIRAN, [tarikh, masa, _sesi.nama, _sesi.emel, status, 'Manual', sebab, _sesi.nama]);
      await Fonnte.hantarAdmin(`✏️ *LOG MANUAL*\n👤 ${_sesi.nama}\n📅 ${tarikh}  🕐 ${masa}\n📊 ${status}\n📝 ${sebab}`);
      tutupModal('modal-logmanual');
      alert('Rekod kehadiran manual telah disimpan.');
      _muatRekodHariIni();
    } catch (e) { alert('Gagal menyimpan rekod. Cuba semula.'); }
  }

  // Ciri #9: Cuti + Upload Sijil Sakit
  function bukaCuti() {
    const hari = new Date().toISOString().split('T')[0];
    document.getElementById('cuti-mula').value = hari;
    document.getElementById('cuti-tamat').value = hari;
    document.getElementById('cuti-jenis').value = 'Cuti Sakit';
    document.getElementById('cuti-sebab').value = '';
    _dataSijil = null;
    const prat = document.getElementById('pratonton-sijil');
    const enama = document.getElementById('nama-fail-sijil');
    const einput = document.getElementById('input-sijil');
    if (prat) prat.style.display = 'none';
    if (enama) enama.style.display = 'none';
    if (einput) einput.value = '';
    toggleUploadSijil();
    bukaModal('modal-cuti');
  }

  function toggleUploadSijil() {
    const jenis = document.getElementById('cuti-jenis')?.value;
    const b = document.getElementById('bahagian-sijil');
    if (b) b.style.display = jenis === 'Cuti Sakit' ? 'block' : 'none';
  }

  async function handleUploadSijil(event) {
    const fail = event.target.files?.[0];
    if (!fail) return;
    try {
      _dataSijil = await Upload.prosesUpload(fail);
      Upload.tunjukPratonton(fail, document.getElementById('pratonton-sijil'));
      const en = document.getElementById('nama-fail-sijil');
      if (en) { en.textContent = `✓ ${fail.name} (${_dataSijil.saiz})`; en.style.display = 'block'; }
    } catch (e) { alert(e.message); }
  }

  function handleDrop(event) {
    event.preventDefault();
    document.getElementById('upload-zone')?.classList.remove('drag');
    const fail = event.dataTransfer.files?.[0];
    if (!fail) return;
    handleUploadSijil({ target: { files: event.dataTransfer.files } });
  }

  async function bukaKamera() {
    try {
      const video = document.getElementById('video-kamera');
      const canvas = document.getElementById('canvas-kamera');
      _streamKamera = await Upload.bukaKamera(video, canvas);
      tutupModal('modal-cuti');
      bukaModal('modal-kamera');
    } catch (e) { alert(e.message); }
  }

  function tangkapGambarKamera() {
    const video = document.getElementById('video-kamera');
    const canvas = document.getElementById('canvas-kamera');
    const base64 = Upload.tangkapGambar(video, canvas);
    if (!base64) return;
    _dataSijil = { nama: 'kamera.jpg', jenis: 'image/jpeg', saiz: '~auto', data: base64, dimuat: new Date().toISOString() };
    const prat = document.getElementById('pratonton-sijil');
    if (prat) { prat.src = base64; prat.style.display = 'block'; }
    const en = document.getElementById('nama-fail-sijil');
    if (en) { en.textContent = '✓ Gambar kamera berjaya diambil'; en.style.display = 'block'; }
    tutupKamera();
    bukaModal('modal-cuti');
  }

  function tutupKamera() {
    Upload.hentiKamera(_streamKamera);
    _streamKamera = null;
    tutupModal('modal-kamera');
  }

  async function hantarCuti() {
    const mula  = document.getElementById('cuti-mula').value;
    const tamat = document.getElementById('cuti-tamat').value;
    const jenis = document.getElementById('cuti-jenis').value;
    const sebab = document.getElementById('cuti-sebab').value.trim();
    if (!mula || !tamat || !sebab) { alert('Sila isi semua maklumat cuti.'); return; }
    if (jenis === 'Cuti Sakit' && !_dataSijil) { alert('Sila upload sijil sakit terlebih dahulu.'); return; }

    const baris = [
      new Date().toLocaleDateString('ms-MY'), _sesi.nama, _sesi.emel,
      mula, tamat, jenis, 'Menunggu', sebab,
      _dataSijil ? `Sijil: ${_dataSijil.nama} (${_dataSijil.saiz})` : ''
    ];
    try {
      await Sheets.tambahBaris(CONFIG.SHEETS.SHEET_CUTI, baris);
      if (CONFIG.NOTIF.hantar_cuti) {
        await Fonnte.hantarAdmin(
          `📋 *PERMOHONAN CUTI*\n👤 ${_sesi.nama}\n📅 ${mula} hingga ${tamat}\n🏷️ ${jenis}\n📝 ${sebab}` +
          (_dataSijil ? `\n📎 ${_dataSijil.nama}` : '')
        );
      }
      tutupModal('modal-cuti');
      _dataSijil = null;
      alert('Permohonan cuti telah dihantar.');
    } catch (e) { alert('Gagal menghantar permohonan. Cuba semula.'); }
  }

  // Tugas Luar
  function bukaTugasLuar() {
    document.getElementById('tl-tarikh').value = new Date().toISOString().split('T')[0];
    bukaModal('modal-tugasluar');
  }

  async function hantarTugasLuar() {
    const tarikh = document.getElementById('tl-tarikh').value;
    const dest   = document.getElementById('tl-destinasi').value.trim();
    const tujuan = document.getElementById('tl-tujuan').value.trim();
    if (!dest || !tujuan) { alert('Sila lengkapkan maklumat tugas luar.'); return; }
    try {
      await Sheets.tambahBaris(CONFIG.SHEETS.SHEET_KELUAR,
        [new Date().toLocaleDateString('ms-MY'), _sesi.nama, _sesi.emel, tarikh, dest, tujuan, 'Direkod']);
      if (CONFIG.NOTIF.hantar_tugas_luar)
        await Fonnte.hantarAdmin(`🚗 *TUGAS LUAR*\n👤 ${_sesi.nama}\n📅 ${tarikh}\n📍 ${dest}\n📝 ${tujuan}`);
      tutupModal('modal-tugasluar');
      alert('Rekod tugas luar telah disimpan.');
    } catch (e) { alert('Gagal menyimpan rekod. Cuba semula.'); }
  }

  // Keluar Pejabat + Slip PDF
  function bukaKeluarPejabat() {
    const kini = new Date();
    document.getElementById('kp-masa').value =
      kini.getHours().toString().padStart(2,'0') + ':' + kini.getMinutes().toString().padStart(2,'0');
    bukaModal('modal-keluar');
  }

  async function hantarKeluarPejabat() {
    const masa = document.getElementById('kp-masa').value;
    const dest = document.getElementById('kp-destinasi').value.trim();
    const sebab = document.getElementById('kp-sebab').value.trim();
    if (!dest || !sebab) { alert('Sila lengkapkan maklumat keluar pejabat.'); return; }
    const tarikh = new Date().toLocaleDateString('ms-MY');
    try {
      await Sheets.tambahBaris(CONFIG.SHEETS.SHEET_KELUAR,
        [tarikh, _sesi.nama, _sesi.emel, masa, dest, sebab, 'Keluar']);
      if (CONFIG.NOTIF.hantar_keluar_pejabat)
        await Fonnte.hantarAdmin(`🚪 *KELUAR PEJABAT*\n👤 ${_sesi.nama}\n🕐 ${masa}\n📍 ${dest}\n📝 ${sebab}`);
      tutupModal('modal-keluar');
      if (confirm('Rekod disimpan. Cetak Slip Kebenaran Keluar Pejabat?') && typeof PDF !== 'undefined') {
        PDF.janaSlipKeluarPejabat({ nama: _sesi.nama, jawatan: _sesi.jawatan || 'Guru', tarikh, masa, destinasi: dest, sebab });
      }
    } catch (e) { alert('Gagal menyimpan rekod. Cuba semula.'); }
  }

  function bukaModal(id)  { document.getElementById(id)?.classList.add('aktif'); }
  function tutupModal(id) { document.getElementById(id)?.classList.remove('aktif'); }

  document.addEventListener('DOMContentLoaded', init);

  return {
    bukaCuti, hantarCuti, bukaTugasLuar, hantarTugasLuar,
    bukaKeluarPejabat, hantarKeluarPejabat,
    bukaLogManual, hantarLogManual,
    toggleUploadSijil, handleUploadSijil, handleDrop,
    bukaKamera, tangkapGambarKamera, tutupKamera,
    pasangPWA, bukaModal, tutupModal
  };

})();
