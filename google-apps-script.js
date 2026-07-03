// ════════════════════════════════════════════════════════════════════
//  GOOGLE APPS SCRIPT — Backend REST API
//  
//  CARA SETUP:
//  1. Buka spreadsheet Google Sheets Anda
//  2. Menu: Extensions → Apps Script
//  3. Hapus kode default, paste seluruh kode ini
//  4. Klik Deploy → New Deployment
//  5. Type: Web App, Execute as: Me, Who has access: Anyone
//  6. Copy URL yang muncul → paste ke CONFIG.APPS_SCRIPT_URL di config.js
// ════════════════════════════════════════════════════════════════════

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const { action, spreadsheetId, token, sheet, rowIndex } = data;

    // Verify token with Google tokeninfo endpoint
    const tokenInfo = verifyToken(token);
    if (!tokenInfo) {
      return jsonResponse({ error: 'Unauthorized', status: 401 });
    }

    const ss = SpreadsheetApp.openById(spreadsheetId);

    switch (action) {
      case 'deleteRow':
        return deleteRow(ss, sheet, parseInt(rowIndex));
      case 'getStats':
        return getStats(ss, data.dateFrom, data.dateTo);
      case 'batchWrite':
        return batchWrite(ss, sheet, data.rows);
      case 'ping':
        return jsonResponse({ status: 'ok', email: tokenInfo.email });
      default:
        return jsonResponse({ error: 'Unknown action: ' + action });
    }
  } catch (err) {
    return jsonResponse({ error: err.message });
  }
}

function doGet(e) {
  return jsonResponse({ status: 'Daily Productivity Tracker API', version: '1.0' });
}

// ── Token Verification ────────────────────────────────────────────
function verifyToken(token) {
  if (!token) return null;
  try {
    const url = 'https://www.googleapis.com/oauth2/v2/tokeninfo?access_token=' + token;
    const res = UrlFetchApp.fetch(url, { muteHttpExceptions: true });
    const info = JSON.parse(res.getContentText());
    if (info.error) return null;
    return info; // { email, expires_in, ... }
  } catch (e) {
    return null;
  }
}

// ── Delete Row ────────────────────────────────────────────────────
function deleteRow(ss, sheetName, rowIndex) {
  const sheet = ss.getSheetByName(sheetName);
  if (!sheet) return jsonResponse({ error: 'Sheet not found: ' + sheetName });
  if (rowIndex < 2 || rowIndex > sheet.getLastRow()) {
    return jsonResponse({ error: 'Invalid row index: ' + rowIndex });
  }
  sheet.deleteRow(rowIndex);
  return jsonResponse({ success: true, deletedRow: rowIndex });
}

// ── Batch Write ───────────────────────────────────────────────────
function batchWrite(ss, sheetName, rows) {
  const sheet = ss.getSheetByName(sheetName);
  if (!sheet) return jsonResponse({ error: 'Sheet not found: ' + sheetName });
  if (!rows || !rows.length) return jsonResponse({ success: true, written: 0 });
  const range = sheet.getRange(sheet.getLastRow() + 1, 1, rows.length, rows[0].length);
  range.setValues(rows);
  return jsonResponse({ success: true, written: rows.length });
}

// ── Get Stats ─────────────────────────────────────────────────────
function getStats(ss, dateFrom, dateTo) {
  const sheets = {
    tasks: 'Tugas',
    gymLogs: 'Gym_Log',
    habitLogs: 'Habit_Log',
    water: 'Water_Log',
  };

  const result = {};

  Object.entries(sheets).forEach(([key, name]) => {
    const sheet = ss.getSheetByName(name);
    if (!sheet) { result[key] = []; return; }
    const data = sheet.getDataRange().getValues();
    if (data.length < 2) { result[key] = []; return; }

    const headers = data[0];
    const dateIdx = headers.indexOf('date');
    const rows = data.slice(1).filter(row => {
      if (dateIdx < 0) return true;
      const d = row[dateIdx];
      return (!dateFrom || d >= dateFrom) && (!dateTo || d <= dateTo);
    }).map(row => {
      const obj = {};
      headers.forEach((h, i) => { obj[h] = row[i] || ''; });
      return obj;
    });

    result[key] = rows;
  });

  return jsonResponse(result);
}

// ── Helper ────────────────────────────────────────────────────────
function jsonResponse(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

// ════════════════════════════════════════════════════════════════════
//  SETUP HELPER — Jalankan sekali untuk membuat semua sheet & header
//  Cara: Buka Apps Script → pilih fungsi setupSheets → klik Run
// ════════════════════════════════════════════════════════════════════
function setupSheets() {
  // Ganti dengan Spreadsheet ID Anda
  const SPREADSHEET_ID = 'YOUR_SPREADSHEET_ID';
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);

  const schemas = {
    'Mata_Kuliah':  ['id', 'name', 'lecturer', 'day', 'time', 'room', 'link', 'notes'],
    'Tugas':        ['id', 'title', 'subject', 'priority', 'dueDate', 'status', 'notes', 'createdAt', 'completedAt'],
    'Gym_Plan':     ['id', 'day', 'category', 'exercise', 'sets', 'reps', 'weight'],
    'Gym_Log':      ['id', 'date', 'exerciseId', 'done', 'timestamp'],
    'Habits':       ['id', 'name', 'icon', 'active'],
    'Habit_Log':    ['id', 'date', 'habitId', 'done'],
    'Water_Log':    ['id', 'date', 'glasses'],
    'Finance':      ['id', 'date', 'category', 'description', 'amount', 'type'],
  };

  Object.entries(schemas).forEach(([name, headers]) => {
    let sheet = ss.getSheetByName(name);
    if (!sheet) {
      sheet = ss.insertSheet(name);
      Logger.log('Created sheet: ' + name);
    } else {
      Logger.log('Sheet already exists: ' + name);
    }

    // Set headers if sheet is empty
    if (sheet.getLastRow() === 0) {
      sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
      // Format header row
      const headerRange = sheet.getRange(1, 1, 1, headers.length);
      headerRange.setBackground('#0f172a');
      headerRange.setFontColor('#14b8a6');
      headerRange.setFontWeight('bold');
      sheet.setFrozenRows(1);
      Logger.log('Added headers to: ' + name);
    }
  });

  Logger.log('✅ Setup selesai! Semua sheet sudah siap.');
  SpreadsheetApp.getUi().alert('Setup selesai! Semua sheet sudah dibuat.');
}
