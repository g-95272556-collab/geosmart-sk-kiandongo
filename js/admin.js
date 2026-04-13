// ============================================================
//  admin.js — Logik Panel Admin
//  Ciri #2: Surat Tunjuk Sebab (jana + cetak PDF)
//  Ciri #3: Auto-tag tidak hadir (diurus oleh cron.js)
//  Ciri #7: Rumusan bulanan manual
// ============================================================
const Admin = (() => {

  let _sesi      = null;
  let _stsSasaran = null; // data guru untuk surat tunjuk sebab

  // ── Init ─────────────────────────────────────────────────
  function init() {
    _sesi = Auth.wajibAdmin();
    if (!_sesi) return;

    const elNama = document.getElementById('user-nama');
    if (elNama) elNama.textContent = _sesi.nama;

    // Tab navigation
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.tab-panel').forEach(p => p.classList.add('hidden'));
        btn.classList.add('active');
        document.getElementById('tab-' + btn.dataset.tab)?.classList.remove('hidden');
        if (btn.dataset.tab === 'kakitangan') _muatKakitangan();
        if (btn.dataset.tab === 'cuti')       _muatCuti();
        if (btn.dataset.tab === 'kehadiran')  _muatKehadiran();
      });
    });

    const elTarikh = document.getElementById('tarikh-hari');
    if (elTarikh) {
      elTarikh.textContent = new Date().toLocaleDateString('ms-MY', {
        weekday:'long', day:'numeric', month:'long', year:'numeric'
      });
    }

    document.getElementById('filter-bulan').value = new Date().toISOString().slice(0,7);
    _muatKehadiran();

    // Mulakan cron
    if (typeof Cron !== 'undefined') Cron.init(_sesi);
  }

  // ── Muat kehadiran hari ini ───────────────────────────────
  async function _muatKehadiran() {
    try {
      const rekod  = await Sheets.bacaKehadiranHariIni();
      const hadir  = rekod.filter(r => r[4] === 'Hadir').length;
      const lewat  = rekod.filter(r => r[4] === 'Lewat').length;
      const semua  = Object.keys(CONFIG.USERS).length;
      const absent = Math.max(0, semua - hadir - lewat);

      document.getElementById('stat-hadir').textContent  = hadir;
      document.getElementById('stat-lewat').textContent  = lewat;
      document.getElementById('stat-absent').textContent = absent;
      document.getElementById('stat-cuti').textContent   = 0;

      const el = document.getElementById('senarai-kehadiran');
      if (!el) return;

      if (!rekod.length) {
        el.innerHTML = '<div class="placeholder">Tiada rekod daftar masuk hari ini.</div>';
        return;
      }

      el.innerHTML = `
        <table class="data-table">
          <thead><tr><th>Nama</th><th>Masa</th><th>Status</th><th>Kaedah</th><th>Tindakan</th></tr></thead>
          <tbody>
            ${rekod.map(r => {
              const isManual  = r[5] === 'Manual';
              const isAbsent  = r[4] === 'Tidak Hadir';
              return `<tr>
                <td>${r[2]}</td>
                <td>${r[1] || '—'}</td>
                <td><span class="badge-status badge-${(r[4]||'').toLowerCase().replace(' ','-')}">${r[4]}</span></td>
                <td>${isManual ? '<span class="badge-manual">✏️ Manual</span>' : (r[5] || 'GPS')}</td>
                <td>
                  ${isAbsent
                    ? `<button class="btn-danger" onclick="Admin.bukaModalSTS('${r[2]}','${r[3]}','${r[0]}')">📄 STS</button>`
                    : '—'}
                </td>
              </tr>`;
            }).join('')}
          </tbody>
        </table>`;
    } catch (e) {
      console.error('Gagal muat kehadiran:', e);
    }
  }

  // ── Ciri #2: Modal Surat Tunjuk Sebab ─────────────────────
  function bukaModalSTS(nama, emel, tarikhAbsen) {
    _stsSasaran = { nama, emel };
    document.getElementById('sts-nama').value    = nama;
    document.getElementById('sts-tarikh').value  = _tarikhKeISO(tarikhAbsen);
    document.getElementById('sts-tempoh').value  = '7';
    document.getElementById('modal-sts').classList.add('aktif');
  }

  function tutupModalSTS() {
    document.getElementById('modal-sts').classList.remove('aktif');
    _stsSasaran = null;
  }

  async function hantarSTS() {
    if (!_stsSasaran) return;

    const tarikhISO = document.getElementById('sts-tarikh').value;
    const tempoh    = document.getElementById('sts-tempoh').value;
    const tarikh    = new Date(tarikhISO).toLocaleDateString('ms-MY', {
      day:'numeric', month:'long', year:'numeric'
    });

    const pengguna = CONFIG.dapatkanPengguna(_stsSasaran.emel);
    const noRuj    = PDF.janaSuratTunjukSebab({
      nama:          _stsSasaran.nama,
      jawatan:       pengguna?.jawatan || 'Guru',
      tarikh_absent: tarikh,
      tempoh_jawab:  tempoh,
    });

    // Notifikasi kepada guru
    if (pengguna?.no_wa) {
      try {
        await Fonnte.hantar(pengguna.no_wa,
          `📄 *SURAT TUNJUK SEBAB DIKELUARKAN*\n` +
          `No. Rujukan: ${noRuj}\n` +
          `Tuan/Puan ${_stsSasaran.nama},\n\n` +
          `Surat tunjuk sebab kehadiran bertugas telah dikeluarkan untuk tarikh *${tarikh}*.\n\n` +
          `Sila kemukakan penjelasan dalam tempoh *${tempoh} hari bekerja*.\n\n` +
          `_Sistem GeoSmart SK Kiandongo_`
        );
      } catch (e) { console.warn('Gagal hantar notif STS:', e); }
    }

    tutupModalSTS();
  }

  // ── Ciri #7: Rumusan Bulanan (manual dari admin) ──────────
  async function hantarRumusanBulanan() {
    const sahkan = confirm('Hantar rumusan kehadiran bulanan kepada SEMUA kakitangan via WhatsApp?');
    if (!sahkan) return;

    if (typeof Cron !== 'undefined') {
      await Cron.hantarRumusanBulananManual();
    } else {
      alert('Modul Cron tidak dimuatkan.');
    }
  }

  // ── Muat cuti pending ─────────────────────────────────────
  async function _muatCuti() {
    try {
      const cuti = await Sheets.bacaCutiPending();
      const el   = document.getElementById('senarai-cuti');
      if (!el) return;

      if (!cuti.length) {
        el.innerHTML = '<div class="placeholder">Tiada permohonan cuti menunggu kelulusan.</div>';
        return;
      }

      el.innerHTML = `
        <table class="data-table">
          <thead><tr><th>Nama</th><th>Tarikh Mohon</th><th>Mula</th><th>Tamat</th><th>Jenis</th><th>Status</th></tr></thead>
          <tbody>
            ${cuti.map(r => `<tr>
              <td>${r[1]}</td><td>${r[0]}</td><td>${r[3]}</td><td>${r[4]}</td><td>${r[5]}</td>
              <td><span class="badge-status badge-menunggu">${r[6] || 'Menunggu'}</span></td>
            </tr>`).join('')}
          </tbody>
        </table>`;
    } catch (e) { console.error('Gagal muat cuti:', e); }
  }

  // ── Muat senarai kakitangan ───────────────────────────────
  function _muatKakitangan() {
    const tbody = document.getElementById('kakitangan-tbody');
    if (!tbody) return;

    tbody.innerHTML = Object.entries(CONFIG.USERS).map(([emel, u]) => `
      <tr>
        <td>${u.nama}${u.jawatan ? ` <small style="color:#5F5E5A">(${u.jawatan})</small>` : ''}</td>
        <td><code style="font-size:12px">${emel}</code></td>
        <td>${u.no_wa || '—'}</td>
        <td><span class="badge-status badge-${u.peranan}">${u.peranan === 'admin' ? 'Admin' : 'Guru'}</span></td>
      </tr>
    `).join('');
  }

  // ── Hantar laporan WA ─────────────────────────────────────
  async function hantarLaporan() {
    try {
      const rekod  = await Sheets.bacaKehadiranHariIni();
      const hadir  = rekod.filter(r => r[4] === 'Hadir').length;
      const lewat  = rekod.filter(r => r[4] === 'Lewat').length;
      const jumlah = Object.keys(CONFIG.USERS).length;
      const absent = jumlah - hadir - lewat;

      await Fonnte.hantarLaporanHarian({ hadir, lewat, absent, cuti: 0, jumlah });
      alert('Laporan telah dihantar kepada semua admin.');
    } catch (e) { alert('Gagal menghantar laporan.'); }
  }

  // ── Laporan bulanan ───────────────────────────────────────
  async function muatLaporan() {
    const bulan = document.getElementById('filter-bulan').value;
    if (!bulan) return;

    const el = document.getElementById('laporan-output');
    el.innerHTML = '<div class="loading">Memuatkan laporan…</div>';

    try {
      const semua = await Sheets.bacaHelaian(CONFIG.SHEETS.SHEET_KEHADIRAN);
      const [tahun, bln] = bulan.split('-');
      const tapis = semua.filter(r => {
        if (!r[0]) return false;
        const [d, m, y] = r[0].split('/');
        return m === bln && y === tahun;
      });

      if (!tapis.length) {
        el.innerHTML = '<div class="placeholder">Tiada rekod untuk bulan ini.</div>';
        return;
      }

      el.innerHTML = `
        <p style="font-size:13px;color:#5F5E5A;margin-bottom:8px">${tapis.length} rekod dijumpai</p>
        <table class="data-table">
          <thead><tr><th>Tarikh</th><th>Masa</th><th>Nama</th><th>Status</th><th>Kaedah</th></tr></thead>
          <tbody>
            ${tapis.map(r => `<tr>
              <td>${r[0]}</td><td>${r[1]}</td><td>${r[2]}</td>
              <td><span class="badge-status badge-${(r[4]||'').toLowerCase().replace(' ','-')}">${r[4]}</span></td>
              <td>${r[5] === 'Manual' ? '<span class="badge-manual">✏️ Manual</span>' : (r[5] || 'GPS')}</td>
            </tr>`).join('')}
          </tbody>
        </table>`;
    } catch (e) {
      el.innerHTML = '<div class="placeholder">Gagal memuatkan laporan.</div>';
    }
  }

  // ── Helper: Tukar tarikh ms-MY ke ISO ─────────────────────
  function _tarikhKeISO(tarikhMY) {
    try {
      const [d, m, y] = tarikhMY.split('/');
      return `${y}-${m.padStart(2,'0')}-${d.padStart(2,'0')}`;
    } catch { return new Date().toISOString().split('T')[0]; }
  }

  document.addEventListener('DOMContentLoaded', init);

  return { hantarLaporan, muatLaporan, bukaModalSTS, tutupModalSTS, hantarSTS, hantarRumusanBulanan };

})();
