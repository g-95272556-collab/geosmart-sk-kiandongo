// ============================================================
//  cron.js — Tugas Berjadual Automatik GeoSmart
//  Ciri #3: Auto-tag tidak hadir + surat tunjuk sebab
//  Ciri #7: Rumusan kehadiran bulanan via WhatsApp
// ============================================================
const Cron = (() => {

  let _sesi = null;

  function init(sesi) {
    _sesi = sesi;
    _mulaJadual();
  }

  // ── Jadual semak harian ───────────────────────────────────
  function _mulaJadual() {
    // Semak setiap minit untuk trigger tepat pada masa yang ditetapkan
    setInterval(_semakMasaKini, 60 * 1000);
    _semakMasaKini(); // Semak serta-merta semasa load
  }

  async function _semakMasaKini() {
    const kini  = new Date();
    const jam   = kini.getHours();
    const minit = kini.getMinutes();
    const hari  = kini.getDay(); // 0=Ahad, 6=Sabtu

    // Skip hujung minggu
    if (hari === 0 || hari === 6) return;

    const masaStr = `${jam.toString().padStart(2,'0')}:${minit.toString().padStart(2,'0')}`;

    // ── Jam 08:35 — Laporan harian (admin sahaja) ────────────
    if (masaStr === CONFIG.NOTIF.masa_laporan && _sesi && CONFIG.adalahAdmin(_sesi.emel)) {
      await _hantarLaporanHarian();
    }

    // ── Jam 08:40 — Auto-tag tidak hadir ─────────────────────
    if (masaStr === '08:40') {
      await _prosesAbsen();
    }

    // ── Hari terakhir bulan — rumusan bulanan ─────────────────
    const esok = new Date(kini);
    esok.setDate(kini.getDate() + 1);
    const hariAkhirBulan = esok.getMonth() !== kini.getMonth();

    if (hariAkhirBulan && masaStr === '16:30' && _sesi && CONFIG.adalahAdmin(_sesi.emel)) {
      await _hantarRumusanBulanan();
    }
  }

  // ── Ciri #3: Proses kakitangan tidak hadir ───────────────
  async function _prosesAbsen() {
    try {
      const rekodHariIni = await Sheets.bacaKehadiranHariIni();
      const emailYgHadir = rekodHariIni.map(r => r[3]); // kolum emel

      // Semak semua pengguna
      for (const [emel, pengguna] of Object.entries(CONFIG.USERS)) {
        if (emailYgHadir.includes(emel)) continue;

        // Semak jika ada cuti/tugasan luar yang diluluskan
        const adaCuti      = await _semakAdaCuti(emel);
        const adaTugasLuar = await _semakAdaTugasLuar(emel);

        if (adaCuti || adaTugasLuar) continue;

        // Tag sebagai tidak hadir tanpa kenyataan
        const tarikh = new Date().toLocaleDateString('ms-MY', { day:'2-digit', month:'2-digit', year:'numeric' });
        const baris  = [
          tarikh, '—', pengguna.nama, emel,
          'Tidak Hadir', 'Auto', 'Tanpa Kenyataan', 'Sistem'
        ];

        await Sheets.tambahBaris(CONFIG.SHEETS.SHEET_KEHADIRAN, baris);

        // Hantar notifikasi kepada admin
        await Fonnte.hantarAdmin(
          `🚨 *TIDAK HADIR TANPA KENYATAAN*\n` +
          `👤 ${pengguna.nama}\n` +
          `📅 ${tarikh}\n` +
          `⚠️ Tiada rekod daftar masuk, cuti atau tugasan luar.\n` +
          `📄 Surat tunjuk sebab akan dijana oleh admin.`
        );

        // Notifikasi kepada guru berkenaan
        if (pengguna.no_wa) {
          await Fonnte.hantar(pengguna.no_wa,
            `⚠️ *AMARAN KEHADIRAN*\n` +
            `Assalamualaikum ${pengguna.nama},\n\n` +
            `Anda telah direkodkan sebagai *Tidak Hadir Tanpa Kenyataan* pada ${tarikh}.\n\n` +
            `Surat tunjuk sebab akan dikeluarkan. Sila hubungi Guru Besar dengan segera.\n\n` +
            `_Sistem GeoSmart SK Kiandongo_`
          );
        }
      }
    } catch (e) {
      console.error('Cron _prosesAbsen gagal:', e);
    }
  }

  async function _semakAdaCuti(emel) {
    try {
      const tarikh = new Date().toLocaleDateString('ms-MY', { day:'2-digit', month:'2-digit', year:'numeric' });
      const semuaCuti = await Sheets.bacaHelaian(CONFIG.SHEETS.SHEET_CUTI);
      return semuaCuti.some(r => r[2] === emel && r[6] !== 'Ditolak');
    } catch { return false; }
  }

  async function _semakAdaTugasLuar(emel) {
    try {
      const tarikh = new Date().toLocaleDateString('ms-MY', { day:'2-digit', month:'2-digit', year:'numeric' });
      const semuaTL = await Sheets.bacaHelaian(CONFIG.SHEETS.SHEET_KELUAR);
      return semuaTL.some(r => r[2] === emel && r[0] === tarikh);
    } catch { return false; }
  }

  // ── Ciri #7: Rumusan bulanan kepada semua pengguna ────────
  async function _hantarRumusanBulanan() {
    try {
      const kini    = new Date();
      const bulan   = kini.toLocaleDateString('ms-MY', { month: 'long', year: 'numeric' });
      const semua   = await Sheets.bacaHelaian(CONFIG.SHEETS.SHEET_KEHADIRAN);
      const bln     = (kini.getMonth() + 1).toString().padStart(2, '0');
      const thn     = kini.getFullYear().toString();

      // Perangkaan global
      const rekorBulan = semua.filter(r => {
        if (!r[0]) return false;
        const [d, m, y] = r[0].split('/');
        return m === bln && y === thn;
      });

      // Hitung hariBekerja dalam bulan ini
      const hariBekerja = _hitungHariBekerja(kini.getFullYear(), kini.getMonth());

      // Laporan setiap pengguna
      for (const [emel, pengguna] of Object.entries(CONFIG.USERS)) {
        if (!pengguna.no_wa) continue;

        const rekodSaya = rekorBulan.filter(r => r[3] === emel);
        const hadir     = rekodSaya.filter(r => r[4] === 'Hadir').length;
        const lewat     = rekodSaya.filter(r => r[4] === 'Lewat').length;
        const absent    = rekodSaya.filter(r => r[4] === 'Tidak Hadir').length;
        const manual    = rekodSaya.filter(r => r[5] === 'Manual').length;
        const peratus   = hariBekerja > 0 ? Math.round(((hadir + lewat) / hariBekerja) * 100) : 0;

        const mesej =
          `📊 *RUMUSAN KEHADIRAN BULANAN*\n` +
          `🏫 SK Kiandongo\n` +
          `📅 ${bulan}\n\n` +
          `👤 *${pengguna.nama}*\n` +
          `✅ Hadir: ${hadir} hari\n` +
          `⚠️ Lewat: ${lewat} hari\n` +
          `❌ Tidak Hadir: ${absent} hari\n` +
          `✏️ Log Manual: ${manual} kali\n` +
          `📆 Hari Bekerja: ${hariBekerja} hari\n` +
          `📈 Peratus Kehadiran: *${peratus}%*\n\n` +
          `_Sistem GeoSmart SK Kiandongo_`;

        await Fonnte.hantar(pengguna.no_wa, mesej);

        // Delay kecil untuk elak rate limit Fonnte
        await new Promise(r => setTimeout(r, 500));
      }

      console.log('Rumusan bulanan berjaya dihantar kepada semua pengguna.');
    } catch (e) {
      console.error('Cron _hantarRumusanBulanan gagal:', e);
    }
  }

  // ── Laporan harian (dipanggil jam 08:35) ─────────────────
  async function _hantarLaporanHarian() {
    try {
      const rekod  = await Sheets.bacaKehadiranHariIni();
      const hadir  = rekod.filter(r => r[4] === 'Hadir').length;
      const lewat  = rekod.filter(r => r[4] === 'Lewat').length;
      const jumlah = Object.keys(CONFIG.USERS).length;
      const absent = jumlah - hadir - lewat;

      await Fonnte.hantarLaporanHarian({ hadir, lewat, absent, cuti: 0, jumlah });
    } catch (e) {
      console.error('Cron _hantarLaporanHarian gagal:', e);
    }
  }

  // ── Hitung hari bekerja (Isnin-Jumaat) dalam bulan ──────
  function _hitungHariBekerja(tahun, bulan) {
    const firstDay = new Date(tahun, bulan, 1);
    const lastDay  = new Date(tahun, bulan + 1, 0);
    let count = 0;
    for (let d = new Date(firstDay); d <= lastDay; d.setDate(d.getDate() + 1)) {
      const h = d.getDay();
      if (h !== 0 && h !== 6) count++;
    }
    return count;
  }

  // ── API awam: hantar rumusan manual (dari admin panel) ───
  async function hantarRumusanBulananManual() {
    await _hantarRumusanBulanan();
    alert('Rumusan bulanan telah dihantar kepada semua pengguna via WhatsApp.');
  }

  return { init, hantarRumusanBulananManual };

})();

window.Cron = Cron;
