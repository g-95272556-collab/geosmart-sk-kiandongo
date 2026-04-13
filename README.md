# GeoSmart SK Kiandongo

Sistem Kehadiran Berasaskan Lokasi untuk SK Kiandongo, PPD Telupid-Tongod, Sabah.

## Ciri-ciri

### Ciri Asal
- ✅ Log masuk dengan ID Delima (Google SSO)
- ✅ Pengesahan lokasi GPS (geofence 200m)
- ✅ Notifikasi WhatsApp automatik melalui Fonnte
- ✅ Rekod kehadiran dalam Google Sheets
- ✅ Permohonan cuti & kebenaran keluar
- ✅ Laporan automatik jam 08:35 pagi
- ✅ Log kehadiran manual (semua pengguna)

### Ciri Baru (April 2026)
- ✅ **#1** Jana & cetak PDF Slip Kebenaran Keluar Pejabat (No. Rujukan: SKKNDGO.500-5/2/4/)
- ✅ **#2** Jana & cetak PDF Surat Tunjuk Sebab Kehadiran (No. Rujukan: SKKNDGO.500-5/2/3/)
- ✅ **#3** Auto-tag tidak hadir tanpa kenyataan (jam 08:40) + surat tunjuk sebab automatik
- ✅ **#4** Enkripsi token sensitif menggunakan Web Crypto API (AES-GCM 256-bit)
- ✅ **#5** Paparan tarikh, hari dan masa realtime pada dashboard semua pengguna
- ✅ **#6** Notifikasi peringatan GPS offline kepada pengguna via WhatsApp Fonnte
- ✅ **#7** Rumusan kehadiran bulanan dihantar kepada semua pengguna via WhatsApp

## Struktur Fail

```
geosmart-sk-kiandongo/
├── index.html          # Halaman utama / log masuk
├── dashboard.html      # Dashboard guru
├── admin.html          # Panel admin (GB & PK sahaja)
├── js/
│   ├── config.js       # ⚙️  Konfigurasi utama
│   ├── auth.js         # Autentikasi Google SSO + enkripsi token
│   ├── geo.js          # Pengesahan lokasi GPS
│   ├── sheets.js       # Operasi Google Sheets
│   ├── fonnte.js       # Notifikasi WhatsApp
│   ├── app.js          # Logik utama dashboard
│   ├── admin.js        # Logik panel admin
│   ├── pdf.js          # 🆕 Jana PDF slip & surat rasmi
│   ├── cron.js         # 🆕 Tugas berjadual automatik
│   └── crypto.js       # 🆕 Enkripsi token (Web Crypto API)
└── css/
    └── style.css       # Gaya antaramuka
```

## Dokumen PDF yang Dijana

### Slip Kebenaran Keluar Pejabat
- **No. Rujukan**: `SKKNDGO.500-5/2/4/YYYY/MM/XXXX`
- Dicetuskan apabila guru menyimpan rekod Keluar Pejabat
- Mengandungi maklumat guru, destinasi, masa dan tandatangan

### Surat Tunjuk Sebab Kehadiran Bertugas
- **No. Rujukan**: `SKKNDGO.500-5/2/3/YYYY/MM/XXXX`
- Admin boleh jana dari panel admin (tab Kehadiran → butang STS)
- Dihantar notifikasi WA kepada guru berkenaan
- Tempoh jawab boleh ditetapkan: 3, 7 atau 14 hari bekerja

## Tugas Automatik (cron.js)

| Masa | Hari | Tindakan |
|------|------|----------|
| 08:35 | Isnin–Jumaat | Hantar laporan harian kepada admin |
| 08:40 | Isnin–Jumaat | Auto-tag tidak hadir + notif WA guru & admin |
| 16:30 (hari akhir bulan) | Isnin–Jumaat | Hantar rumusan bulanan kepada SEMUA kakitangan |

## Keselamatan

- Token akses Google dienkripsi menggunakan **AES-GCM 256-bit** (Web Crypto API)
- Kunci enkripsi diterbitkan dari fingerprint peranti menggunakan **PBKDF2**
- Token Fonnte disimpan dalam `config.js` — pastikan repositori **Private**

## Kakitangan Berdaftar

| Nama | Peranan | Jawatan |
|------|---------|---------|
| Jimmy Patrick Gantor | Admin | Guru Besar |
| Andrew Bin Justine | Admin | PK Pentadbiran |
| Amri Izzad Binti Tahir | Admin | PK Kokurikulum |
| Jemsan Bin Sakunding | Admin | PK HEM |
| Aloha Binti Ibin | Guru | — |
| Betty Bin Jim | Guru | — |
| Jida Minses | Guru | — |
| Mohd Khairul Aiman Mohd Yusof | Guru | — |
| Oktovyanti Koh | Guru | — |
| Stenley Dominic | Guru | — |
| Taimah Binti Ilok | Guru | — |
| Fazilah Binti Ali | Guru | — |

> **Nota:** Log masuk menggunakan akaun ID Delima `@moe-dl.edu.my` sahaja.

## Lesen
Dalaman SK Kiandongo — Tidak untuk pengedaran umum.
