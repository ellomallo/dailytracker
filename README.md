# 🗓️ Daily Productivity Tracker

Aplikasi web produktivitas harian yang terintegrasi dengan Google Sheets sebagai database dan Google Calendar.

---

## 📁 Struktur File

```
productivity-tracker/
├── index.html                  ← Entry point utama
├── css/
│   └── style.css               ← Styling custom
├── js/
│   ├── config.js               ← ⚠️ ISI KREDENSIAL DI SINI
│   ├── auth.js                 ← Google OAuth 2.0
│   ├── api.js                  ← Google Sheets & Calendar API
│   ├── store.js                ← State management
│   ├── utils.js                ← Helper functions
│   ├── app.js                  ← Router & init
│   └── pages/
│       ├── dashboard.js        ← Dashboard + Charts
│       ├── calendar.js         ← Kalender interaktif
│       ├── courses.js          ← Mata kuliah CRUD
│       ├── tasks.js            ← Tugas & Todo
│       ├── gym.js              ← Gym tracker
│       ├── habits.js           ← Habit + Air tracker
│       ├── finance.js          ← Keuangan harian
│       └── settings.js         ← Pengaturan
└── google-apps-script.js       ← Script untuk Apps Script backend
```

---

## 🚀 Langkah Setup Lengkap

### LANGKAH 1 — Buat Google Spreadsheet

1. Buka [Google Sheets](https://sheets.google.com) → buat spreadsheet baru
2. Beri nama: **"Daily Productivity Tracker"**
3. Salin **Spreadsheet ID** dari URL:
   ```
   https://docs.google.com/spreadsheets/d/[SPREADSHEET_ID]/edit
   ```

### LANGKAH 2 — Deploy Google Apps Script (Backend)

1. Di spreadsheet, klik **Extensions → Apps Script**
2. Hapus kode default
3. Paste isi file `google-apps-script.js`
4. **Ganti** `YOUR_SPREADSHEET_ID` dengan ID spreadsheet Anda
5. Klik **Run → `setupSheets`** untuk membuat semua sheet + header otomatis
   - Izinkan akses saat diminta
6. Klik **Deploy → New Deployment**:
   - Type: **Web App**
   - Execute as: **Me**
   - Who has access: **Anyone**
7. Klik **Deploy** → salin **Web App URL**

### LANGKAH 3 — Setup Google Cloud Project

1. Buka [Google Cloud Console](https://console.cloud.google.com/)
2. Buat project baru atau pilih yang sudah ada
3. Aktifkan APIs:
   - **Google Sheets API** → Library → Search "Google Sheets API" → Enable
   - **Google Calendar API** → Library → Search "Google Calendar API" → Enable
4. Buat OAuth 2.0 Credentials:
   - APIs & Services → **Credentials** → Create Credentials → **OAuth 2.0 Client ID**
   - Application type: **Web application**
   - Authorized JavaScript origins:
     - `http://localhost` (untuk development)
     - `http://localhost:8080` (atau port yang Anda gunakan)
     - URL domain Anda jika sudah deploy
   - Klik **Create** → salin **Client ID**
5. OAuth Consent Screen:
   - User Type: External (untuk testing)
   - Isi nama app, email
   - Add scopes: Sheets, Calendar, userinfo.profile
   - Add test users: email Anda

### LANGKAH 4 — Isi `js/config.js`

Buka file `js/config.js` dan isi:

```javascript
GOOGLE_CLIENT_ID: 'xxxxx.apps.googleusercontent.com',  // dari Langkah 3
APPS_SCRIPT_URL: 'https://script.google.com/macros/s/.../exec',  // dari Langkah 2
SPREADSHEET_ID: '1BxiMVs0XRA5nFMdK...',  // dari Langkah 1
```

### LANGKAH 5 — Jalankan Aplikasi

**Cara paling mudah — gunakan Live Server:**

```bash
# Jika pakai VS Code: Install extension "Live Server" → klik "Go Live"

# Atau pakai Python:
python -m http.server 8080

# Atau pakai Node.js:
npx serve .
```

Buka browser ke `http://localhost:8080`

---

## 📊 Skema Google Sheets

### Sheet: `Mata_Kuliah`
| id | name | lecturer | day | time | room | link | notes |
|---|---|---|---|---|---|---|---|
| uid | Algoritma | Dr. Budi | Senin | 08:00-10:00 | R301 | https://... | - |

### Sheet: `Tugas`
| id | title | subject | priority | dueDate | status | notes | createdAt | completedAt |
|---|---|---|---|---|---|---|---|---|
| uid | Laporan Praktikum | Algo | high | 2025-07-10 | pending | - | 2025-07-01 | - |

### Sheet: `Gym_Plan`
| id | day | category | exercise | sets | reps | weight |
|---|---|---|---|---|---|---|
| uid | Senin | Chest | Bench Press | 4 | 8-12 | 60kg |

### Sheet: `Gym_Log`
| id | date | exerciseId | done | timestamp |
|---|---|---|---|---|
| uid | 2025-07-01 | uid_exercise | TRUE | 2025-07-01T... |

### Sheet: `Habits`
| id | name | icon | active |
|---|---|---|---|
| uid | Membaca buku | 📚 | TRUE |

### Sheet: `Habit_Log`
| id | date | habitId | done |
|---|---|---|---|
| uid | 2025-07-01 | uid_habit | TRUE |

### Sheet: `Water_Log`
| id | date | glasses |
|---|---|---|
| uid | 2025-07-01 | 6 |

### Sheet: `Finance`
| id | date | category | description | amount | type |
|---|---|---|---|---|---|
| uid | 2025-07-01 | Makan | Makan siang | 25000 | expense |

---

## ✨ Fitur Lengkap

| Fitur | Keterangan |
|---|---|
| 📊 Dashboard | Statistik harian, grafik mingguan/bulanan, heatmap tahunan |
| 📅 Kalender | Tampilan bulanan terintegrasi Google Calendar |
| 📚 Mata Kuliah | CRUD jadwal kuliah dengan link online |
| ✅ Tugas | Todo list dengan prioritas, due date, filter |
| 💪 Gym | Rencana latihan per hari, checklist exercise |
| 💧 Habit & Air | Habit tracker + water tracker harian |
| 💰 Keuangan | Catat pengeluaran dengan kategori & chart |
| 🌙 Dark/Light Mode | Toggle tema, tersimpan di localStorage |
| 📱 Responsif | Mobile-friendly dengan sidebar toggle |

---

## 🔧 Troubleshooting

**"Login gagal" / popup tidak muncul**
- Pastikan domain/localhost sudah di-whitelist di Authorized JavaScript Origins
- Cek Client ID sudah benar di `config.js`

**"Gagal menyimpan" saat CRUD**
- Cek Spreadsheet ID sudah benar
- Pastikan Google Sheets API sudah di-enable
- Cek token masih valid (coba logout → login ulang)

**Operasi hapus gagal (delete row)**
- Pastikan Apps Script URL sudah diisi
- Cek deployment Apps Script: Execute as "Me", Access "Anyone"
- Re-deploy jika perlu

**Calendar events tidak muncul**
- Pastikan Google Calendar API sudah di-enable
- Tambahkan scope calendar ke OAuth consent screen

---

## 🌐 Deploy ke Production

**GitHub Pages (gratis):**
```bash
git init && git add . && git commit -m "Initial commit"
gh repo create productivity-tracker --public
git push origin main
# Settings → Pages → Branch: main
```

Tambahkan URL GitHub Pages ke Authorized JavaScript Origins di Google Cloud Console.

**Netlify / Vercel:**
Drag & drop folder ke [netlify.com/drop](https://netlify.com/drop)

---

## 📝 Lisensi

MIT — Bebas digunakan dan dimodifikasi.
