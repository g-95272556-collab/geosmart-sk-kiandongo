// ============================================================
//  config.js — Konfigurasi GeoSmart SK Kiandongo
//  Kemaskini: April 2026
// ============================================================
const CONFIG = {
  SCHOOL: {
    nama:           'SK Kiandongo',
    daerah:         'PPD Telupid-Tongod',
    negeri:         'Sabah',
    lat:            5.305568,
    lng:            116.963402,
    radius_m:       200,
    waktu_trigger:  '07:00',
    waktu_lewat:    '07:30',
    waktu_absent:   '08:30',
  },
  GOOGLE_CLIENT_ID: '553204925712-bcooapthol2ct0oek8mpsluv52v4f04p.apps.googleusercontent.com',
  USERS: {
    'g-80272554@moe-dl.edu.my': { nama: 'Aloha Binti Ibin',               no_wa: '60135560671',  peranan: 'guru'  },
    'g-87272555@moe-dl.edu.my': { nama: 'Amri Izzad Binti Tahir',         no_wa: '60105838718',  peranan: 'admin', jawatan: 'PK Kokurikulum' },
    'g-95272556@moe-dl.edu.my': { nama: 'Andrew Bin Justine',             no_wa: '60193386910',  peranan: 'admin', jawatan: 'PK Pentadbiran' },
    'g-34564753@moe-dl.edu.my': { nama: 'Betty Bin Jim',                  no_wa: '601124135966', peranan: 'guru'  },
    'g-36272623@moe-dl.edu.my': { nama: 'Fazilah Binti Ali',              no_wa: '60134461416',  peranan: 'guru'  },
    'jidaminses@moe-dl.edu.my': { nama: 'Jida Minses',                    no_wa: '601126605349', peranan: 'guru'  },
    'g-69272581@moe-dl.edu.my': { nama: 'Jimmy Patrick Gantor',           no_wa: '60195363361',  peranan: 'admin', jawatan: 'Guru Besar'     },
    'g-03272560@moe-dl.edu.my': { nama: 'Jemsan Bin Sakunding',           no_wa: '60138547430',  peranan: 'admin', jawatan: 'PK HEM'         },
    'g-27568716@moe-dl.edu.my': { nama: 'Mohd Khairul Aiman Mohd Yusof', no_wa: '601121792758', peranan: 'guru'  },
    'g-32510899@moe-dl.edu.my': { nama: 'Oktovyanti Koh',                 no_wa: '60138665663',  peranan: 'guru'  },
    'g-09563222@moe-dl.edu.my': { nama: 'Stenley Dominic',                no_wa: '601135988995', peranan: 'guru'  },
    'g-56272514@moe-dl.edu.my': { nama: 'Taimah Binti Ilok',              no_wa: '601123607380', peranan: 'guru'  },
  },
  ADMINS: [
    { emel:'g-69272581@moe-dl.edu.my', nama:'Jimmy Patrick Gantor',   jawatan:'Guru Besar',     kod:'GB',  no_wa:'60195363361',  warna_bg:'#E1F5EE', warna_tx:'#085041' },
    { emel:'g-95272556@moe-dl.edu.my', nama:'Andrew Bin Justine',     jawatan:'PK Pentadbiran', kod:'PKP', no_wa:'60193386910',  warna_bg:'#E6F1FB', warna_tx:'#042C53' },
    { emel:'g-87272555@moe-dl.edu.my', nama:'Amri Izzad Binti Tahir', jawatan:'PK Kokurikulum', kod:'PKK', no_wa:'60105838718',  warna_bg:'#FAEEDA', warna_tx:'#633806' },
    { emel:'g-03272560@moe-dl.edu.my', nama:'Jemsan Bin Sakunding',   jawatan:'PK HEM',         kod:'PKH', no_wa:'60138547430',  warna_bg:'#EEEDFE', warna_tx:'#3C3489' },
  ],
  get ADMIN_EMAILS() { return CONFIG.ADMINS.map(a => a.emel); },
  SHEETS: {
    CLIENT_ID:       '553204925712-bcooapthol2ct0oek8mpsluv52v4f04p.apps.googleusercontent.com',
    SPREADSHEET_ID:  '120CqTvkHXsngy3wJBByRdDJdZYh1Hb-K',
    SCOPES:          'https://www.googleapis.com/auth/spreadsheets',
    SHEET_KEHADIRAN: 'Kehadiran',
    SHEET_KAKITANGAN:'Kakitangan',
    SHEET_LOG:       'Log_Masuk',
    SHEET_CUTI:      'Permohonan_Cuti',
    SHEET_KELUAR:    'Kebenaran_Keluar',
  },
  FONNTE: {
    TOKEN: 'bj4xtRA3jMVikHAjXMgK',
    get ADMIN_NUMBERS() { return CONFIG.ADMINS.map(a => a.no_wa); },
  },
  JADUAL_KELUAR: {
    1: { minit: 13*60,    label: '1:00 PTG',  nama: 'Isnin'  },
    2: { minit: 13*60,    label: '1:00 PTG',  nama: 'Selasa' },
    3: { minit: 13*60+45, label: '1:45 PTG',  nama: 'Rabu'   },
    4: { minit: 13*60,    label: '1:00 PTG',  nama: 'Khamis' },
    5: { minit: 11*60+30, label: '11:30 PG',  nama: 'Jumaat' },
  },
  NOTIF: {
    hantar_login:          false,
    hantar_auto_checkin:   true,
    hantar_lewat:          true,
    hantar_absent:         true,
    hantar_tugas_luar:     true,
    hantar_cuti:           true,
    hantar_tanpa:          true,
    hantar_keluar_pejabat: true,
    masa_laporan:          '08:35',
  },
};
CONFIG.dapatkanPengguna = function(emel) { return CONFIG.USERS[emel] || null; };
CONFIG.adalahAdmin      = function(emel) { return CONFIG.ADMIN_EMAILS.includes(emel); };
CONFIG.dapatkanAdmin    = function(emel) { return CONFIG.ADMINS.find(a => a.emel === emel) || null; };
window.CONFIG = CONFIG;
