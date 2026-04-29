# GeoSmart Aktif – Aplikasi Peringatan Pergerakan Fizikal

Aplikasi Android yang memantau aktiviti fizikal pengguna dan memberi peringatan untuk bergerak sekurang-kurangnya **10 minit** jika pengguna idle melebihi **1 jam**.

---

## Ciri-ciri Utama

| Ciri | Penerangan |
|------|-----------|
| **Pengesan Idle Automatik** | Menggunakan step counter / akselerometer untuk kesan ketidakaktifan |
| **Peringatan Pintar** | Notifikasi dengan butang tindakan langsung (Mula Bergerak / Tangguh) |
| **Timer Pergerakan** | Countdown visual untuk pantau tempoh pergerakan |
| **Servis Latar Belakang** | Foreground service yang berjalan walaupun app ditutup |
| **Boot Auto-start** | Servis dimulakan semula selepas telefon reboot |
| **Tetapan Fleksibel** | Boleh laras tempoh idle (15–120 min) dan tempoh pergerakan (5–30 min) |
| **Statistik Harian** | Jejak bilangan peringatan diterima dan pergerakan selesai |

---

## Cara Kerja

```
Idle > 60 minit
       │
       ▼
  Notifikasi Dihantar
  "Masa untuk Bergerak!"
       │
  ┌────┴────┐
  │         │
Mula      Tangguh
Bergerak  15 minit
  │
  ▼
Timer Pergerakan Bermula
  │
  ▼
Selesai (≥10 min) ──► Timer Idle Ditetapkan Semula
```

---

## Keperluan Sistem

- Android 8.0 (API 26) ke atas
- Sensor step counter (pilihan) atau akselerometer
- Kebenaran: `ACTIVITY_RECOGNITION`, `POST_NOTIFICATIONS`, `FOREGROUND_SERVICE`

---

## Struktur Projek

```
android-app/
├── app/src/main/
│   ├── java/com/geosmart/activityreminder/
│   │   ├── MainActivity.kt              # Skrin utama
│   │   ├── service/
│   │   │   └── ActivityMonitorService.kt  # Foreground service (sensor + idle check)
│   │   ├── receiver/
│   │   │   ├── BootReceiver.kt          # Auto-start selepas reboot
│   │   │   └── NotificationActionReceiver.kt  # Tindak balas butang notifikasi
│   │   ├── ui/
│   │   │   └── MainViewModel.kt         # ViewModel untuk UI state
│   │   └── util/
│   │       ├── NotificationHelper.kt    # Pengurusan notifikasi & channel
│   │       └── PreferencesManager.kt   # Storan tetapan pengguna
│   └── res/
│       ├── layout/activity_main.xml    # Layout skrin utama
│       ├── values/strings.xml          # Teks (Bahasa Malaysia)
│       ├── values/colors.xml           # Palet warna hijau
│       └── values/themes.xml           # Tema Material 3
└── build.gradle.kts
```

---

## Cara Pasang (Build)

```bash
cd android-app
./gradlew assembleDebug
adb install app/build/outputs/apk/debug/app-debug.apk
```

---

## Kebenaran Diperlukan

| Kebenaran | Tujuan |
|-----------|--------|
| `ACTIVITY_RECOGNITION` | Baca data step counter |
| `POST_NOTIFICATIONS` | Hantar notifikasi peringatan |
| `FOREGROUND_SERVICE` | Jalankan servis pemantauan |
| `FOREGROUND_SERVICE_HEALTH` | Jenis servis kesihatan (Android 14+) |
| `RECEIVE_BOOT_COMPLETED` | Mulakan semula selepas reboot |
| `WAKE_LOCK` | Pastikan pemantauan tak terganggu |
| `VIBRATE` | Getaran semasa peringatan |
