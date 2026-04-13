// ============================================================
//  fonnte.js — Notifikasi WhatsApp melalui Fonnte
// ============================================================
const Fonnte = (() => {
  const URL_API = 'https://api.fonnte.com/send';

  async function hantar(noWa, mesej) {
    try {
      const res = await fetch(URL_API, {
        method: 'POST',
        headers: { 'Authorization': CONFIG.FONNTE.TOKEN, 'Content-Type': 'application/json' },
        body: JSON.stringify({ target: noWa, message: mesej }),
      });
      const data = await res.json();
      if (!data.status) console.warn('Fonnte gagal:', data);
      return data;
    } catch (e) { console.error('Fonnte ralat:', e); }
  }

  async function hantarAdmin(mesej) {
    const nombor = CONFIG.FONNTE.ADMIN_NUMBERS;
    if (!nombor.length) { console.warn('Tiada nombor admin.'); return; }
    return Promise.all(nombor.map(n => hantar(n, mesej)));
  }

  async function hantarKakitangan(emel, mesej) {
    const pengguna = CONFIG.dapatkanPengguna(emel);
    if (!pengguna || !pengguna.no_wa) { console.warn('Tiada no WA untuk:', emel); return; }
    return hantar(pengguna.no_wa, mesej);
  }

  async function hantarLaporanHarian(statistik) {
    const tarikh = new Date().toLocaleDateString('ms-MY', { weekday:'long', day:'numeric', month:'long', year:'numeric' });
    const mesej =
      `📊 *LAPORAN KEHADIRAN HARIAN*\n🏫 SK Kiandongo\n📅 ${tarikh}\n\n` +
      `✅ Hadir: ${statistik.hadir}\n⚠️ Lewat: ${statistik.lewat}\n` +
      `❌ Tidak Hadir: ${statistik.absent}\n📋 Cuti: ${statistik.cuti}\n` +
      `👥 Jumlah: ${statistik.jumlah}\n\n_Sistem GeoSmart SK Kiandongo_`;
    return hantarAdmin(mesej);
  }

  return { hantar, hantarAdmin, hantarKakitangan, hantarLaporanHarian };
})();
