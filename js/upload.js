// ============================================================
//  upload.js — Upload Sijil Sakit (Gambar/Kamera)
//  Ciri #9: Upload sijil sakit sebagai bukti cuti sakit
//  Disimpan sebagai base64 dalam Google Sheets
// ============================================================
const Upload = (() => {

  const MAX_SAIZ_MB = 5;
  const MAX_SAIZ_B  = MAX_SAIZ_MB * 1024 * 1024;
  const JENIS_DIBENAR = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/heic'];

  // ── Mampat imej sebelum simpan ────────────────────────────
  function _mampatImej(fail, lebarMax = 1024) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = e => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let { width, height } = img;

          // Skala jika terlalu besar
          if (width > lebarMax) {
            height = Math.round(height * lebarMax / width);
            width  = lebarMax;
          }

          canvas.width  = width;
          canvas.height = height;
          canvas.getContext('2d').drawImage(img, 0, 0, width, height);

          // JPEG kualiti 0.75 — keseimbangan saiz/kualiti
          resolve(canvas.toDataURL('image/jpeg', 0.75));
        };
        img.onerror = reject;
        img.src = e.target.result;
      };
      reader.onerror = reject;
      reader.readAsDataURL(fail);
    });
  }

  // ── Sahkan fail ───────────────────────────────────────────
  function _sahkanFail(fail) {
    if (!JENIS_DIBENAR.includes(fail.type.toLowerCase()) &&
        !fail.name.toLowerCase().match(/\.(jpg|jpeg|png|webp|heic)$/)) {
      return 'Format fail tidak disokong. Sila gunakan imej JPG, PNG atau WebP.';
    }
    if (fail.size > MAX_SAIZ_B) {
      return `Saiz fail terlalu besar. Had maksimum: ${MAX_SAIZ_MB}MB.`;
    }
    return null;
  }

  // ── Pratonton imej dalam modal ────────────────────────────
  function tunjukPratonton(fail, elPratonton) {
    if (!elPratonton) return;
    const reader = new FileReader();
    reader.onload = e => {
      elPratonton.src   = e.target.result;
      elPratonton.style.display = 'block';
    };
    reader.readAsDataURL(fail);
  }

  // ── Proses & simpan fail sijil ────────────────────────────
  async function prosesUpload(fail) {
    // Sahkan
    const ralat = _sahkanFail(fail);
    if (ralat) throw new Error(ralat);

    // Mampat
    const base64 = await _mampatImej(fail);

    return {
      nama:     fail.name,
      jenis:    'image/jpeg',
      saiz:     Math.round(base64.length * 0.75 / 1024) + 'KB',
      data:     base64,
      dimuat:   new Date().toISOString(),
    };
  }

  // ── Buka kamera peranti ───────────────────────────────────
  async function bukaKamera(elVideo, elCanvas) {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } }
      });
      if (elVideo) {
        elVideo.srcObject = stream;
        elVideo.play();
      }
      return stream;
    } catch (e) {
      throw new Error('Kamera tidak dapat diakses. Sila benarkan kebenaran kamera.');
    }
  }

  // ── Tangkap gambar dari kamera ────────────────────────────
  function tangkapGambar(elVideo, elCanvas) {
    if (!elVideo || !elCanvas) return null;
    const ctx = elCanvas.getContext('2d');
    elCanvas.width  = elVideo.videoWidth;
    elCanvas.height = elVideo.videoHeight;
    ctx.drawImage(elVideo, 0, 0);
    return elCanvas.toDataURL('image/jpeg', 0.85);
  }

  // ── Henti kamera ─────────────────────────────────────────
  function hentiKamera(stream) {
    if (stream) stream.getTracks().forEach(track => track.stop());
  }

  return { prosesUpload, tunjukPratonton, bukaKamera, tangkapGambar, hentiKamera };

})();

window.Upload = Upload;
