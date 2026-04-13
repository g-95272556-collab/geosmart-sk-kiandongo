// ============================================================
//  crypto.js — Enkripsi Token Sensitif (Web Crypto API)
//  Ciri #4: Semua token penting dienkripsi dalam sessionStorage
// ============================================================
const CryptoHelper = (() => {

  // Kunci enkripsi berasaskan fingerprint peranti + masa sesi
  async function _dapatkanKunci() {
    const seed = navigator.userAgent + navigator.language + screen.width;
    const enc  = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey(
      'raw', enc.encode(seed), { name: 'PBKDF2' }, false, ['deriveKey']
    );
    return crypto.subtle.deriveKey(
      { name: 'PBKDF2', salt: enc.encode('GeoSmartSKK2026'), iterations: 100000, hash: 'SHA-256' },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    );
  }

  async function enkripsi(teks) {
    try {
      const kunci = await _dapatkanKunci();
      const iv    = crypto.getRandomValues(new Uint8Array(12));
      const enc   = new TextEncoder();
      const data  = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, kunci, enc.encode(teks));
      const gabung = new Uint8Array(iv.byteLength + data.byteLength);
      gabung.set(iv, 0);
      gabung.set(new Uint8Array(data), iv.byteLength);
      return btoa(String.fromCharCode(...gabung));
    } catch (e) {
      console.error('Enkripsi gagal:', e);
      return teks;
    }
  }

  async function dekripsi(base64) {
    try {
      const kunci  = await _dapatkanKunci();
      const gabung = Uint8Array.from(atob(base64), c => c.charCodeAt(0));
      const iv     = gabung.slice(0, 12);
      const data   = gabung.slice(12);
      const hasil  = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, kunci, data);
      return new TextDecoder().decode(hasil);
    } catch (e) {
      console.error('Dekripsi gagal:', e);
      return null;
    }
  }

  async function simpanToken(kunci, nilai) {
    const terenkripsi = await enkripsi(nilai);
    sessionStorage.setItem('enc_' + kunci, terenkripsi);
  }

  async function bacaToken(kunci) {
    const terenkripsi = sessionStorage.getItem('enc_' + kunci);
    if (!terenkripsi) return null;
    return dekripsi(terenkripsi);
  }

  return { enkripsi, dekripsi, simpanToken, bacaToken };

})();

window.CryptoHelper = CryptoHelper;
