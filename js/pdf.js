// ============================================================
//  pdf.js — Jana & Cetak PDF Dokumen Rasmi GeoSmart
//  Ciri #1: Slip Kebenaran Keluar Pejabat  (SKKNDGO.500-5/2/4/)
//  Ciri #2: Surat Tunjuk Sebab Kehadiran   (SKKNDGO.500-5/2/3/)
// ============================================================
const PDF = (() => {

  // ── Jana No. Rujukan ──────────────────────────────────────
  function _noRujukan(prefix) {
    const kini  = new Date();
    const tahun = kini.getFullYear();
    const bulan = (kini.getMonth() + 1).toString().padStart(2, '0');
    const rawak = Math.floor(Math.random() * 9000) + 1000;
    return `${prefix}${tahun}/${bulan}/${rawak}`;
  }

  // ── Format tarikh rasmi ────────────────────────────────────
  function _tarikhRasmi(date = new Date()) {
    return date.toLocaleDateString('ms-MY', {
      day: 'numeric', month: 'long', year: 'numeric'
    });
  }

  // ── Buka tetingkap cetak ──────────────────────────────────
  function _cetakHTML(htmlKandungan, tajuk) {
    const win = window.open('', '_blank', 'width=794,height=1123');
    win.document.write(`<!DOCTYPE html>
<html lang="ms">
<head>
  <meta charset="UTF-8">
  <title>${tajuk}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Times+New+Roman&display=swap');
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Times New Roman', Times, serif;
      font-size: 12pt;
      color: #000;
      background: #fff;
      padding: 2.5cm 2.5cm 2cm 3cm;
      line-height: 1.6;
    }
    .kop-surat { display: flex; align-items: center; gap: 16px; margin-bottom: 8px; }
    .kop-surat img { width: 70px; height: 70px; object-fit: contain; }
    .kop-teks { flex: 1; text-align: center; }
    .kop-teks h1 { font-size: 14pt; font-weight: bold; text-transform: uppercase; }
    .kop-teks p  { font-size: 10pt; margin: 1px 0; }
    .garisan-kop { border-top: 3px solid #000; border-bottom: 1px solid #000; margin: 8px 0 20px; padding: 2px 0; }
    .tajuk-doc {
      text-align: center;
      font-size: 13pt;
      font-weight: bold;
      text-decoration: underline;
      text-transform: uppercase;
      margin: 16px 0 20px;
    }
    .no-rujukan { font-size: 11pt; margin-bottom: 4px; }
    .tarikh-doc { font-size: 11pt; margin-bottom: 20px; }
    table.maklumat { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
    table.maklumat td { padding: 4px 8px; font-size: 11pt; vertical-align: top; }
    table.maklumat td:first-child { width: 40%; font-weight: bold; }
    table.maklumat td:nth-child(2) { width: 5%; text-align: center; }
    .kandungan { margin: 16px 0; font-size: 11pt; text-align: justify; }
    .tandatangan { margin-top: 40px; }
    .blok-ttd { display: inline-block; width: 45%; vertical-align: top; }
    .blok-ttd .garisan { border-bottom: 1px solid #000; margin-top: 50px; margin-bottom: 4px; }
    .blok-ttd p { font-size: 10pt; }
    .cop { margin-top: 6px; font-size: 9pt; color: #555; font-style: italic; }
    .footer-doc { margin-top: 30px; font-size: 9pt; text-align: center; color: #666; border-top: 1px solid #ccc; padding-top: 6px; }
    @media print {
      body { padding: 0; }
      @page { size: A4; margin: 2.5cm 2.5cm 2cm 3cm; }
    }
  </style>
</head>
<body>
  ${htmlKandungan}
  <script>
    window.onload = function() {
      setTimeout(function() { window.print(); }, 500);
    };
  <\/script>
</body>
</html>`);
    win.document.close();
  }

  // ── Kop Surat Sekolah ─────────────────────────────────────
  function _kopSurat() {
    return `
    <div class="kop-surat">
      <div class="kop-teks">
        <h1>Sekolah Kebangsaan Kiandongo</h1>
        <p>Peti Surat 49, 87809 Kiandongo, Tongod, Sabah</p>
        <p>Tel/Faks: —  |  E-mel: g-69272581@moe-dl.edu.my</p>
        <p>PPD Telupid-Tongod, Jabatan Pendidikan Negeri Sabah</p>
      </div>
    </div>
    <div class="garisan-kop"></div>`;
  }

  // ── CIRI #1: Slip Kebenaran Keluar Pejabat ───────────────
  // No. Rujukan: SKKNDGO.500-5/2/4/YYYY/MM/XXXX
  function janaSlipKeluarPejabat(data) {
    const noRuj = _noRujukan('SKKNDGO.500-5/2/4/1/');
    const tarikh = _tarikhRasmi();

    const html = `
    ${_kopSurat()}
    <p class="no-rujukan">No. Rujukan: <strong>${noRuj}</strong></p>
    <p class="tarikh-doc">Tarikh: ${tarikh}</p>

    <div class="tajuk-doc">Slip Kebenaran Keluar Pejabat</div>

    <p class="kandungan">Yang bertandatangan di bawah ini dengan hormatnya mengesahkan bahawa:</p>

    <table class="maklumat">
      <tr><td>Nama</td><td>:</td><td>${data.nama}</td></tr>
      <tr><td>Jawatan</td><td>:</td><td>${data.jawatan || 'Guru'}</td></tr>
      <tr><td>Tarikh Keluar</td><td>:</td><td>${data.tarikh}</td></tr>
      <tr><td>Masa Keluar</td><td>:</td><td>${data.masa}</td></tr>
      <tr><td>Destinasi</td><td>:</td><td>${data.destinasi}</td></tr>
      <tr><td>Sebab / Tujuan</td><td>:</td><td>${data.sebab}</td></tr>
    </table>

    <p class="kandungan">
      Pihak yang berkenaan adalah diminta memberikan kerjasama yang sepenuhnya.
      Adalah diharapkan agar urusan tersebut dapat diselesaikan dengan segera.
    </p>

    <div class="tandatangan" style="margin-top:50px; display:flex; justify-content:space-between;">
      <div class="blok-ttd">
        <div class="garisan"></div>
        <p><strong>${data.nama}</strong></p>
        <p>${data.jawatan || 'Guru'}</p>
        <p>SK Kiandongo</p>
      </div>
      <div class="blok-ttd" style="text-align:right">
        <div class="garisan"></div>
        <p><strong>Jimmy Patrick Gantor</strong></p>
        <p>Guru Besar</p>
        <p>SK Kiandongo</p>
        <p class="cop">(Cop Sekolah)</p>
      </div>
    </div>

    <div class="footer-doc">
      Dijana oleh Sistem GeoSmart SK Kiandongo · ${noRuj} · ${tarikh}
    </div>`;

    _cetakHTML(html, `Slip Keluar Pejabat - ${data.nama}`);
    return noRuj;
  }

  // ── CIRI #2: Surat Tunjuk Sebab Kehadiran ─────────────────
  // No. Rujukan: SKKNDGO.500-5/2/3/YYYY/MM/XXXX
  function janaSuratTunjukSebab(data) {
    const noRuj  = _noRujukan('SKKNDGO.500-5/2/3/1/');
    const tarikh = _tarikhRasmi();
    const tempoh = data.tempoh_jawab || '7';

    const html = `
    ${_kopSurat()}
    <p class="no-rujukan">No. Rujukan: <strong>${noRuj}</strong></p>
    <p class="tarikh-doc">Tarikh: ${tarikh}</p>

    <div class="kandungan">
      Kepada,<br>
      <strong>${data.nama}</strong><br>
      ${data.jawatan || 'Guru'},<br>
      Sekolah Kebangsaan Kiandongo,<br>
      PPD Telupid-Tongod, Sabah.
    </div>

    <div class="tajuk-doc">Surat Tunjuk Sebab Kehadiran Bertugas</div>

    <p class="kandungan">
      Adalah dengan hormatnya dimaklumkan bahawa pihak sekolah telah mencatatkan
      ketidakhadiran tuan/puan bertugas pada:
    </p>

    <table class="maklumat">
      <tr><td>Tarikh Tidak Hadir</td><td>:</td><td><strong>${data.tarikh_absent}</strong></td></tr>
      <tr><td>Status Rekod</td><td>:</td><td>Tidak Hadir Tanpa Kenyataan (THBTK)</td></tr>
      <tr><td>Permohonan Cuti</td><td>:</td><td>Tiada</td></tr>
      <tr><td>Tugasan Luar</td><td>:</td><td>Tiada</td></tr>
      <tr><td>Kebenaran Keluar</td><td>:</td><td>Tiada</td></tr>
    </table>

    <p class="kandungan">
      2. Sehubungan dengan itu, tuan/puan adalah dikehendaki memberikan penjelasan bertulis
      (tunjuk sebab) mengenai ketidakhadiran tuan/puan tersebut dalam tempoh
      <strong>${tempoh} hari bekerja</strong> dari tarikh surat ini diterima.
    </p>

    <p class="kandungan">
      3. Sekiranya tuan/puan gagal mengemukakan penjelasan dalam tempoh yang ditetapkan,
      tindakan tatatertib boleh diambil terhadap tuan/puan mengikut
      Peraturan-Peraturan Pegawai Awam (Kelakuan dan Tatatertib) 1993.
    </p>

    <p class="kandungan">
      Kerjasama tuan/puan amat dihargai.
    </p>

    <div class="tandatangan" style="margin-top:50px;">
      <div class="blok-ttd">
        <div class="garisan"></div>
        <p><strong>Jimmy Patrick Gantor</strong></p>
        <p>Guru Besar</p>
        <p>SK Kiandongo, PPD Telupid-Tongod</p>
        <p class="cop">(Cop Sekolah)</p>
      </div>
    </div>

    <div style="margin-top:30px; padding:10px; border:1px solid #ccc; font-size:10pt;">
      <p><strong>Untuk kegunaan penerima:</strong></p>
      <p>Saya <strong>${data.nama}</strong> mengesahkan telah menerima surat ini pada: ___________________</p>
      <p style="margin-top:20px;">Tandatangan: ___________________________</p>
    </div>

    <div class="footer-doc">
      Dijana oleh Sistem GeoSmart SK Kiandongo · ${noRuj} · ${tarikh}
    </div>`;

    _cetakHTML(html, `Surat Tunjuk Sebab - ${data.nama}`);
    return noRuj;
  }

  return { janaSlipKeluarPejabat, janaSuratTunjukSebab };

})();

window.PDF = PDF;
