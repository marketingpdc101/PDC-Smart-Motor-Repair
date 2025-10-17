/**
 * PDC Smart Motor Repair - Utility Functions
 * 
 * ฟังก์ชันช่วยเหลือต่างๆ
 */

/**
 * Verify LINE Signature
 * ตรวจสอบว่า Webhook มาจาก LINE จริงๆ หรือไม่
 */
function verifyLineSignature(requestBody, signature, isInternal = true) {
  try {
    // Get Channel Secret
    const channelSecret = isInternal ? 
      CONFIG.LINE.INTERNAL_CHANNEL_SECRET : 
      CONFIG.LINE.EXTERNAL_CHANNEL_SECRET;
    
    // Create HMAC SHA256 hash
    const hash = Utilities.computeHmacSha256Signature(
      Utilities.newBlob(requestBody).getBytes(),
      channelSecret
    );
    
    // Convert to Base64
    const calculatedSignature = Utilities.base64Encode(hash);
    
    // Compare signatures
    return calculatedSignature === signature;
    
  } catch (error) {
    Logger.log('Error verifying signature: ' + error.message);
    return false;
  }
}

/**
 * Generate QR Code URL
 */
function generateQRCode(text, size = 300) {
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(text)}`;
}

/**
 * Upload File to Google Drive
 */
function uploadFileToDrive(base64Data, filename, folderId, mimeType = 'image/jpeg') {
  try {
    const blob = Utilities.newBlob(Utilities.base64Decode(base64Data), mimeType, filename);
    const folder = DriveApp.getFolderById(folderId);
    const file = folder.createFile(blob);
    
    return {
      success: true,
      file_id: file.getId(),
      url: file.getUrl(),
      thumbnail_url: file.getThumbnailUrl()
    };
  } catch (error) {
    Logger.log('Error uploading file: ' + error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Send Email Notification
 */
function sendEmailNotification(to, subject, body) {
  if (!CONFIG.NOTIFICATIONS.ENABLE_EMAIL_NOTIFICATIONS) {
    return false;
  }
  
  try {
    MailApp.sendEmail({
      to: to,
      subject: subject,
      htmlBody: body
    });
    return true;
  } catch (error) {
    Logger.log('Error sending email: ' + error.message);
    return false;
  }
}

/**
 * Format Phone Number (Thai)
 */
function formatPhoneNumber(phone) {
  if (!phone) return '';
  
  // Remove non-digits
  const cleaned = phone.replace(/\D/g, '');
  
  // Format as 0XX-XXX-XXXX
  if (cleaned.length === 10) {
    return `${cleaned.substring(0, 3)}-${cleaned.substring(3, 6)}-${cleaned.substring(6)}`;
  }
  
  return phone;
}

/**
 * Calculate Business Days
 */
function calculateBusinessDays(startDate, days) {
  let current = new Date(startDate);
  let added = 0;
  
  while (added < days) {
    current.setDate(current.getDate() + 1);
    const dayOfWeek = current.getDay();
    
    // Skip weekends (0 = Sunday, 6 = Saturday)
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      added++;
    }
  }
  
  return current;
}

/**
 * Validate Email
 */
function isValidEmail(email) {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
}

/**
 * Validate Phone Number (Thai)
 */
function isValidPhoneNumber(phone) {
  const cleaned = phone.replace(/\D/g, '');
  return cleaned.length === 10 && cleaned.startsWith('0');
}

/**
 * Generate Random ID
 */
function generateRandomId(length = 8) {
  return Math.random().toString(36).substring(2, 2 + length).toUpperCase();
}

/**
 * Sanitize String (remove special characters)
 */
function sanitizeString(str) {
  if (!str) return '';
  return str.replace(/[^\w\s\u0E00-\u0E7F]/g, '').trim();
}

/**
 * Truncate Text
 */
function truncateText(text, maxLength = 100) {
  if (!text || text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
}

/**
 * Get File Extension
 */
function getFileExtension(filename) {
  return filename.slice((filename.lastIndexOf('.') - 1 >>> 0) + 2);
}

/**
 * Get MIME Type from Extension
 */
function getMimeType(extension) {
  const mimeTypes = {
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'png': 'image/png',
    'gif': 'image/gif',
    'pdf': 'application/pdf',
    'doc': 'application/msword',
    'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'xls': 'application/vnd.ms-excel',
    'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  };
  
  return mimeTypes[extension.toLowerCase()] || 'application/octet-stream';
}

/**
 * Convert Thai Date to Buddhist Year
 */
function toThaiDate(date) {
  const d = new Date(date);
  const buddhistYear = d.getFullYear() + 543;
  
  const thaiMonths = [
    'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน',
    'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม',
    'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
  ];
  
  return `${d.getDate()} ${thaiMonths[d.getMonth()]} ${buddhistYear}`;
}

/**
 * Calculate Age from Date
 */
function calculateAge(dateString) {
  const birthDate = new Date(dateString);
  const today = new Date();
  
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  
  return age;
}

/**
 * Deep Clone Object
 */
function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

/**
 * Sleep/Wait
 */
function sleep(milliseconds) {
  Utilities.sleep(milliseconds);
}

/**
 * Retry Function (with exponential backoff)
 */
function retry(fn, maxAttempts = 3, delayMs = 1000) {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return fn();
    } catch (error) {
      if (attempt === maxAttempts) {
        throw error;
      }
      Logger.log(`Attempt ${attempt} failed. Retrying in ${delayMs}ms...`);
      Utilities.sleep(delayMs);
      delayMs *= 2; // Exponential backoff
    }
  }
}

/**
 * Batch Process Array
 */
function batchProcess(array, batchSize, processFn) {
  const results = [];
  
  for (let i = 0; i < array.length; i += batchSize) {
    const batch = array.slice(i, i + batchSize);
    const batchResults = processFn(batch);
    results.push(...batchResults);
    
    // Rate limiting
    if (i + batchSize < array.length) {
      Utilities.sleep(100);
    }
  }
  
  return results;
}

/**
 * Get Sheet as JSON
 */
function getSheetAsJSON(sheetName) {
  const sheet = getSheet(sheetName);
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const rows = [];
  
  for (let i = 1; i < data.length; i++) {
    rows.push(arrayToObject(headers, data[i]));
  }
  
  return rows;
}

/**
 * Clear Sheet (keep headers)
 */
function clearSheet(sheetName) {
  const sheet = getSheet(sheetName);
  const lastRow = sheet.getLastRow();
  
  if (lastRow > 1) {
    sheet.getRange(2, 1, lastRow - 1, sheet.getLastColumn()).clearContent();
  }
}

/**
 * Export Sheet to CSV
 */
function exportSheetToCSV(sheetName) {
  const sheet = getSheet(sheetName);
  const data = sheet.getDataRange().getValues();
  
  let csv = '';
  data.forEach(row => {
    csv += row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',') + '\n';
  });
  
  const blob = Utilities.newBlob(csv, 'text/csv', `${sheetName}.csv`);
  return blob;
}

/**
 * Get User Info from LINE (via API)
 */
function getLineUserProfile(userId, isInternal = true) {
  const token = isInternal ? 
    CONFIG.LINE.INTERNAL_CHANNEL_ACCESS_TOKEN : 
    CONFIG.LINE.EXTERNAL_CHANNEL_ACCESS_TOKEN;
  
  const url = `https://api.line.me/v2/bot/profile/${userId}`;
  
  const options = {
    method: 'get',
    headers: {
      'Authorization': 'Bearer ' + token
    },
    muteHttpExceptions: true
  };
  
  try {
    const response = UrlFetchApp.fetch(url, options);
    if (response.getResponseCode() === 200) {
      return JSON.parse(response.getContentText());
    }
  } catch (error) {
    Logger.log('Error getting LINE profile: ' + error.message);
  }
  
  return null;
}

/**
 * Log to Sheet (for debugging)
 */
function logToSheet(message, level = 'INFO') {
  if (!CONFIG.DEBUG.ENABLE_LOGGING) return;
  
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let logSheet = ss.getSheetByName('Logs');
  
  if (!logSheet) {
    logSheet = ss.insertSheet('Logs');
    logSheet.appendRow(['Timestamp', 'Level', 'Message']);
  }
  
  logSheet.appendRow([new Date(), level, message]);
  
  // Keep only last 1000 logs
  if (logSheet.getLastRow() > 1000) {
    logSheet.deleteRows(2, logSheet.getLastRow() - 1000);
  }
}

/**
 * Test Utilities
 */
function testUtils() {
  Logger.log('=== Testing Utilities ===');
  
  // Test QR Code
  const qrUrl = generateQRCode('PDC-202510-0001');
  Logger.log('QR Code URL: ' + qrUrl);
  
  // Test Phone Format
  const phone = formatPhoneNumber('0812345678');
  Logger.log('Formatted Phone: ' + phone);
  
  // Test Thai Date
  const thaiDate = toThaiDate(new Date());
  Logger.log('Thai Date: ' + thaiDate);
  
  // Test Business Days
  const futureDate = calculateBusinessDays(new Date(), 7);
  Logger.log('7 Business Days Later: ' + futureDate);
  
  Logger.log('✅ Utilities Test Complete');
}

/**
 * Custom Logger - บันทึก logs ลง Google Sheets
 * เพื่อให้ดู logs จาก Web App execution ได้
 */
function logToSheet(level, message, data = null) {
  try {
    // พยายามเปิดสเปรดชีตด้วย ID จาก CONFIG ก่อน (เสถียรกว่าในโหมด Web App)
    let ss = null;
    try {
      if (typeof CONFIG !== 'undefined' && CONFIG.SHEETS && CONFIG.SHEETS.SPREADSHEET_ID) {
        ss = SpreadsheetApp.openById(CONFIG.SHEETS.SPREADSHEET_ID);
      }
    } catch (e) {
      // fallback ไปใช้ active spreadsheet หากเปิดด้วย ID ไม่ได้
      ss = null;
    }
    if (!ss) {
      ss = SpreadsheetApp.getActiveSpreadsheet();
    }

    if (!ss) {
      throw new Error('Spreadsheet not found (openById/getActiveSpreadsheet both failed)');
    }

    let logSheet = ss.getSheetByName('System_Logs');
    
    // สร้าง sheet ถ้ายังไม่มี
    if (!logSheet) {
      logSheet = ss.insertSheet('System_Logs');
      logSheet.appendRow(['Timestamp', 'Level', 'Message', 'Data', 'Execution ID']);
      logSheet.getRange(1, 1, 1, 5).setFontWeight('bold').setBackground('#4285f4').setFontColor('#ffffff');
    }
    
    // เพิ่ม log entry
    const timestamp = new Date();
    const executionId = (typeof Session !== 'undefined' && Session.getTemporaryActiveUserKey) ? (Session.getTemporaryActiveUserKey() || 'unknown') : 'unknown';
    const dataStr = data ? JSON.stringify(data) : '';
    
    logSheet.appendRow([
      timestamp,
      level,
      message,
      dataStr,
      executionId
    ]);
    
    // Auto-format timestamp column
    const lastRow = logSheet.getLastRow();
    logSheet.getRange(lastRow, 1).setNumberFormat('yyyy-MM-dd HH:mm:ss');
    
    // จำกัดจำนวน rows ไม่เกิน 1000 (ลบข้อมูลเก่าทิ้ง)
    if (lastRow > 1001) {
      logSheet.deleteRows(2, lastRow - 1001); // เก็บแค่ 1000 rows ล่าสุด + header
    }
    
  } catch (error) {
    // ถ้า log ไม่ได้ก็ใช้ Logger.log แทน และบันทึกเหตุผล
    Logger.log('[logToSheet Error] ' + error.message + ' | Original: ' + message);
  }
}

/**
 * Wrapper functions สำหรับ logging แต่ละ level
 */
// ✅ เปิด logging functions - แต่ log แค่ที่จำเป็น
function logInfo(message, data = null) {
  if (CONFIG.DEBUG && CONFIG.DEBUG.ENABLE_LOGGING) {
    logToSheet('INFO', message, data);
  }
}

function logError(message, data = null) {
  Logger.log('ERROR: ' + message);
  if (CONFIG.DEBUG && CONFIG.DEBUG.ENABLE_LOGGING) {
    logToSheet('ERROR', message, data);
  }
}

function logWarning(message, data = null) {
  if (CONFIG.DEBUG && CONFIG.DEBUG.ENABLE_LOGGING && CONFIG.DEBUG.LOG_LEVEL === 'DEBUG') {
    logToSheet('WARNING', message, data);
  }
}

function logDebug(message, data = null) {
  if (CONFIG.DEBUG && CONFIG.DEBUG.ENABLE_LOGGING && CONFIG.DEBUG.LOG_LEVEL === 'DEBUG') {
    logToSheet('DEBUG', message, data);
  }
}