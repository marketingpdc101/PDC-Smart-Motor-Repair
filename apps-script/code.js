/**
 * PDC Smart Motor Repair - Main Entry Point
 * 
 * ไฟล์หลักสำหรับ Google Apps Script
 */

/**
 * doGet - Web App GET handler (สำหรับ LIFF Apps)
 */
function doGet(e) {
  // ถ้าไม่มี parameter ให้แสดงหน้าหลัก (ไม่ต้อง authenticate)
  if (!e || !e.parameter || Object.keys(e.parameter).length === 0) {
    return HtmlService.createHtmlOutput(
      '<html><body>' +
      '<h1>PDC Smart Motor Repair API</h1>' +
      '<p>System is running...</p>' +
      '<p>Status: <span style="color: green;">✓ Active</span></p>' +
      '</body></html>'
    );
  }
  
  const action = e.parameter.action;
  
  try {
    let result;
    
    switch (action) {
      // System actions
      case 'health':
        return healthCheck();
      case 'config':
        return showConfig();
      
      // LIFF App actions
      case 'getQuotation':
        result = getQuotation(e.parameter.jobId);
        break;
      
      case 'getJob':
        result = getJobDetails(e.parameter.jobId);
        break;
      
      case 'getJobsByCustomer':
        result = getJobsByCustomer(e.parameter.customerId);
        break;
      
      case 'getMilestones':
        result = getMilestones(e.parameter.jobId);
        break;
      
      case 'getAllJobs':
        result = getAllJobs(e.parameter.status, e.parameter.limit);
        break;
      
      default:
        result = { error: 'Unknown action: ' + action };
    }
    
    return ContentService.createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    logError('doGet error', { action: action, error: error.message });
    
    return ContentService.createTextOutput(JSON.stringify({
      error: error.message,
      timestamp: new Date().toISOString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * doPost - Webhook endpoint สำหรับ LINE และ LIFF Actions
 * ไม่ต้อง authenticate เพราะ LINE จะไม่มี Google account
 */
function doPost(e) {
  try {
    // ถ้าไม่มี postData ให้ return success (สำหรับ webhook verification)
    if (!e || !e.postData || !e.postData.contents) {
      return ContentService.createTextOutput(JSON.stringify({
        status: 'success',
        message: 'Webhook endpoint ready'
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
    // Parse request body
    const contents = JSON.parse(e.postData.contents);
    
    // ตรวจสอบว่าเป็น LINE Webhook หรือ LIFF Action
    if (contents.events) {
      // LINE Webhook
      return handleLineWebhook(contents);
    } else if (contents.action) {
      // LIFF Action
      return handleLiffAction(contents);
    } else {
      return ContentService.createTextOutput(JSON.stringify({
        error: 'Invalid request format'
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
  } catch (error) {
    const errorDetails = {
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    };
    
    logError('doPost error', errorDetails);
    
    // Still return 200 OK even on error
    return ContentService.createTextOutput(JSON.stringify({
      status: 'error',
      message: error.message,
      timestamp: new Date().toISOString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Handle LINE Webhook
 */
function handleLineWebhook(contents) {
  const eventCount = contents.events ? contents.events.length : 0;
  let messageText = '';
  
  if (contents.events && contents.events.length > 0 && 
      contents.events[0].message && contents.events[0].message.text) {
    messageText = contents.events[0].message.text;
  }
  
  logInfo('Webhook received', {
    events: eventCount,
    message: messageText
  });
  
  // Return 200 OK to LINE immediately
  const response = ContentService.createTextOutput(JSON.stringify({
    status: 'success'
  })).setMimeType(ContentService.MimeType.JSON);
  
  // ประมวลผล events แบบ asynchronous
  if (contents.events && contents.events.length > 0) {
    try {
      contents.events.forEach((event, index) => {
        try {
          handleLineEvent(event);
        } catch (eventError) {
          Logger.log('Error handling event #' + (index + 1) + ': ' + eventError.message);
        }
      });
    } catch (error) {
      Logger.log('Error processing events: ' + error.message);
    }
  }
  
  return response;
}

/**
 * Handle LIFF Action
 */
function handleLiffAction(data) {
  const action = data.action;
  let result;
  
  try {
    switch (action) {
      // Job creation action
      case 'createJob':
        const jobData = typeof data.data === 'string' ? JSON.parse(data.data) : data.data;
        result = createJobWithItems(jobData);
        break;
      
      // Quotation actions
      case 'approveQuotation':
        result = approveQuotation(data.jobId, data.userId, data.note);
        break;
      
      case 'rejectQuotation':
        result = rejectQuotation(data.jobId, data.userId, data.note);
        break;
      
      // Status update actions
      case 'updateStatus':
        result = updateJobMilestone(data.jobId, data.milestone, data.note, data.photos, data.userId);
        break;
      
      // Final test actions
      case 'submitFinalTest':
        result = submitFinalTest(data);
        break;
      
      // Final report actions
      case 'submitFinalReport':
        result = submitFinalReport(data);
        break;
      
      default:
        result = { success: false, error: 'Unknown action: ' + action };
    }
    
    return ContentService.createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    logError('LIFF action error', { action: action, error: error.message });
    
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: error.message
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Health check endpoint
 */
function healthCheck() {
  const validation = validateConfig();
  
  return ContentService.createTextOutput(JSON.stringify({
    status: 'ok',
    timestamp: new Date().toISOString(),
    config_valid: validation.isValid,
    errors: validation.errors,
    warnings: validation.warnings
  })).setMimeType(ContentService.MimeType.JSON);
}

/**
 * Show configuration (for debugging)
 */
function showConfig() {
  return ContentService.createTextOutput(JSON.stringify({
    spreadsheet_id: CONFIG.SHEETS.SPREADSHEET_ID,
    web_app_url: CONFIG.WEB_APP_URL,
    liff_configured: !CONFIG.LIFF.QUOTATION.includes('YOUR_'),
    templates_configured: !CONFIG.TEMPLATES.QUOTATION.includes('YOUR_')
  }, null, 2)).setMimeType(ContentService.MimeType.JSON);
}

/**
 * Menu สำหรับ Google Sheets
 */
function onOpen() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu('🔧 PDC System')
    .addItem('📊 Initialize Database', 'initializeDatabase')
    .addSeparator()
    .addItem('📋 Show Recent Logs', 'showRecentLogs')
    .addSeparator()
    .addItem('✅ Test Database', 'testDatabase')
    .addItem('✅ Test LINE API', 'testLineAPI')
    .addItem('✅ Test PDF Generator', 'testPDFGenerator')
    .addSeparator()
    .addItem('📝 Create Sample Job', 'createSampleJob')
    .addItem('📄 Generate Sample Quotation', 'generateSampleQuotation')
    .addSeparator()
    .addItem('⚙️ Show Configuration', 'showConfigDialog')
    .addItem('ℹ️ About', 'showAbout')
    .addToUi();
}

/**
 * Show Recent Logs
 */
function showRecentLogs() {
  try {
    const ss = SpreadsheetApp.openById(CONFIG.SHEETS.SPREADSHEET_ID);
    const logSheet = ss.getSheetByName('System_Logs');
    
    if (!logSheet) {
      SpreadsheetApp.getUi().alert('ไม่พบ System_Logs sheet');
      return;
    }
    
    const data = logSheet.getDataRange().getValues();
    const lastRow = logSheet.getLastRow();
    
    if (lastRow <= 1) {
      SpreadsheetApp.getUi().alert('ยังไม่มี logs');
      return;
    }
    
    // ดึง 20 logs ล่าสุด
    const startRow = Math.max(2, lastRow - 19);
    const logs = data.slice(startRow - 1, lastRow);
    
    let html = '<h2>📋 Recent Logs (Last 20)</h2>';
    html += '<table border="1" style="border-collapse:collapse; width:100%; font-size:12px;">';
    html += '<tr style="background:#4285f4;color:white;"><th>Time</th><th>Level</th><th>Message</th><th>Data</th></tr>';
    
    logs.reverse().forEach(row => {
      const levelColor = row[1] === 'ERROR' ? '#ff0000' : row[1] === 'WARNING' ? '#ff9900' : '#333';
      html += `<tr>
        <td>${row[0]}</td>
        <td style="color:${levelColor};font-weight:bold;">${row[1]}</td>
        <td>${row[2]}</td>
        <td style="font-size:11px;color:#666;">${row[3] || ''}</td>
      </tr>`;
    });
    
    html += '</table>';
    
    const htmlOutput = HtmlService.createHtmlOutput(html).setWidth(900).setHeight(600);
    SpreadsheetApp.getUi().showModalDialog(htmlOutput, 'System Logs');
  } catch (error) {
    SpreadsheetApp.getUi().alert('Error: ' + error.message);
  }
}

/**
 * แสดง Configuration Dialog
 */
function showConfigDialog() {
  const validation = validateConfig();
  let html = '<h2>PDC System Configuration</h2>';
  
  html += '<h3>Status: ' + (validation.isValid ? '✅ Valid' : '❌ Invalid') + '</h3>';
  
  if (validation.errors.length > 0) {
    html += '<h4 style="color: red;">Errors:</h4><ul>';
    validation.errors.forEach(err => {
      html += '<li>' + err + '</li>';
    });
    html += '</ul>';
  }
  
  if (validation.warnings.length > 0) {
    html += '<h4 style="color: orange;">Warnings:</h4><ul>';
    validation.warnings.forEach(warn => {
      html += '<li>' + warn + '</li>';
    });
    html += '</ul>';
  }
  
  html += '<p><strong>Spreadsheet ID:</strong> ' + CONFIG.SHEETS.SPREADSHEET_ID + '</p>';
  html += '<p><strong>Web App URL:</strong> ' + CONFIG.WEB_APP_URL + '</p>';
  
  const htmlOutput = HtmlService.createHtmlOutput(html)
    .setWidth(600)
    .setHeight(400);
  
  SpreadsheetApp.getUi().showModalDialog(htmlOutput, 'System Configuration');
}

/**
 * แสดง About Dialog
 */
function showAbout() {
  const html = `
    <div style="font-family: Arial, sans-serif; padding: 20px;">
      <h2>🔧 PDC Smart Motor Repair System</h2>
      <p><strong>Version:</strong> 1.0.0</p>
      <p><strong>Developer:</strong> PDC Development Team</p>
      <p><strong>Description:</strong> ระบบจัดการงานซ่อมมอเตอร์แบบครบวงจร (End-to-End)</p>
      
      <h3>Features:</h3>
      <ul>
        <li>✅ LINE Integration (OA + LIFF)</li>
        <li>✅ Auto PDF/Excel Generation</li>
        <li>✅ Real-time Status Tracking</li>
        <li>✅ Before/After Photos</li>
        <li>✅ Dashboard & Analytics</li>
      </ul>
      
      <h3>Quick Start:</h3>
      <ol>
        <li>📊 Initialize Database (Menu: Initialize Database)</li>
        <li>⚙️ แก้ไข Config.gs ใส่ LINE Tokens & LIFF IDs</li>
        <li>🚀 Deploy as Web App</li>
        <li>🔗 ตั้งค่า Webhook URL ใน LINE Developers Console</li>
      </ol>
      
      <p><em>For more information, see README.md</em></p>
    </div>
  `;
  
  const htmlOutput = HtmlService.createHtmlOutput(html)
    .setWidth(500)
    .setHeight(500);
  
  SpreadsheetApp.getUi().showModalDialog(htmlOutput, 'About PDC System');
}

/**
 * สร้างงานตัวอย่างเพื่อทดสอบ
 */
function createSampleJob() {
  const jobId = createJob({
    customer_name: 'คุณสมชาย ใจดี',
    company: 'บริษัท ABC มอเตอร์ จำกัด',
    asset_desc: 'มอเตอร์ไฟฟ้า AC Motor 50 HP',
    serial_no: 'MTR-2025-001',
    brand: 'Siemens',
    model: '1LA7 133-4AA',
    created_by: 'Admin (Sample)'
  });
  
  // สร้างรายการซ่อม 3 รายการ
  createJobItem({
    job_id: jobId,
    line_no: 1,
    title: 'ถอดแยกชิ้นส่วนและตรวจสอบ',
    tech_detail: 'ถอดแยก Rotor, Stator, Housing, Bearing',
    uom: 'ชุด',
    qty: 1,
    unit_price: 2500,
    subtotal: 2500
  });
  
  createJobItem({
    job_id: jobId,
    line_no: 2,
    title: 'พันขดลวดใหม่',
    tech_detail: 'เผาขดลวดเดิม, พันขดลวดใหม่ตามขนาดและจำนวนรอบเดิม',
    uom: 'ชุด',
    qty: 1,
    unit_price: 18000,
    subtotal: 18000
  });
  
  createJobItem({
    job_id: jobId,
    line_no: 3,
    title: 'เปลี่ยน Bearing',
    tech_detail: 'เปลี่ยน Bearing หน้า-หลัง (6309 ZZ)',
    uom: 'ตัว',
    qty: 2,
    unit_price: 850,
    subtotal: 1700
  });
  
  SpreadsheetApp.getUi().alert(
    'สร้างงานตัวอย่างสำเร็จ!\n\n' +
    'Job ID: ' + jobId + '\n' +
    'Customer: บริษัท ABC มอเตอร์ จำกัด\n' +
    'รายการซ่อม: 3 รายการ\n\n' +
    'ตรวจสอบได้ที่ Sheet: Jobs'
  );
}

/**
 * สร้างใบเสนอราคาตัวอย่าง
 */
function generateSampleQuotation() {
  // ตรวจสอบว่ามี Job อยู่หรือไม่
  const sheet = getSheet(CONFIG.SHEETS.JOBS);
  const data = sheet.getDataRange().getValues();
  
  if (data.length < 2) {
    SpreadsheetApp.getUi().alert('ไม่พบงานในระบบ\nกรุณาสร้างงานก่อน (Menu: Create Sample Job)');
    return;
  }
  
  const jobId = data[1][0];  // ใช้งานแรก
  
  try {
    const pdfUrl = generateQuotationPDF(jobId);
    
    SpreadsheetApp.getUi().alert(
      'สร้างใบเสนอราคาสำเร็จ!\n\n' +
      'Job ID: ' + jobId + '\n' +
      'PDF URL: ' + pdfUrl + '\n\n' +
      '📌 หมายเหตุ: ต้องตั้งค่า Template ID ใน Config.gs ก่อน'
    );
  } catch (error) {
    SpreadsheetApp.getUi().alert(
      'เกิดข้อผิดพลาด!\n\n' +
      error.message + '\n\n' +
      '📌 กรุณาตรวจสอบ Template ID ใน Config.gs'
    );
  }
}

/**
 * Trigger ที่ทำงานทุกวัน (Daily Maintenance)
 */
function dailyMaintenance() {
  Logger.log('=== Daily Maintenance Started ===');
  
  // 1. Auto-cancel pending approvals หลังพ้นกำหนด
  autoCancelPendingApprovals();
  
  // 2. ส่งการแจ้งเตือนงานที่ใกล้ครบกำหนด
  notifyUpcomingDeadlines();
  
  // 3. Backup data (optional)
  // backupData();
  
  Logger.log('=== Daily Maintenance Completed ===');
}

/**
 * Auto-cancel งานที่รออนุมัติเกิน X วัน
 */
function autoCancelPendingApprovals() {
  const sheet = getSheet(CONFIG.SHEETS.JOBS);
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const statusIndex = headers.indexOf('status');
  const createdAtIndex = headers.indexOf('created_at');
  
  const now = new Date();
  const cancelDays = CONFIG.BUSINESS.AUTO_CANCEL_PENDING_DAYS;
  let cancelledCount = 0;
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][statusIndex] === CONFIG.STATUS.PENDING_APPROVAL) {
      const createdAt = new Date(data[i][createdAtIndex]);
      const daysDiff = (now - createdAt) / (1000 * 60 * 60 * 24);
      
      if (daysDiff > cancelDays) {
        const jobId = data[i][0];
        updateJobStatus(jobId, CONFIG.STATUS.CANCELLED, 'System (Auto)');
        cancelledCount++;
      }
    }
  }
  
  if (cancelledCount > 0) {
    Logger.log(`Auto-cancelled ${cancelledCount} pending approvals`);
  }
}

/**
 * แจ้งเตือนงานที่ใกล้ครบกำหนด
 */
function notifyUpcomingDeadlines() {
  const sheet = getSheet(CONFIG.SHEETS.JOBS);
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  
  const statusIndex = headers.indexOf('status');
  const etaFinishIndex = headers.indexOf('eta_finish');
  
  const now = new Date();
  const threeDaysLater = new Date();
  threeDaysLater.setDate(now.getDate() + 3);
  
  for (let i = 1; i < data.length; i++) {
    const status = data[i][statusIndex];
    
    if (status === CONFIG.STATUS.IN_PROGRESS || status === CONFIG.STATUS.APPROVED) {
      const etaFinish = new Date(data[i][etaFinishIndex]);
      
      if (etaFinish <= threeDaysLater && etaFinish >= now) {
        const job = arrayToObject(headers, data[i]);
        // TODO: ส่ง LINE notification
        Logger.log(`Upcoming deadline: ${job.job_id} (ETA: ${etaFinish})`);
      }
    }
  }
}

/**
 * ส่ง Error Notification ไปหา Admin
 */
function notifyAdminError(errorType, errorDetails) {
  try {
    // ดึงรายชื่อ Admin จาก Users sheet
    const userSheet = getSheet(CONFIG.SHEETS.USERS);
    const userData = userSheet.getDataRange().getValues();
    const headers = userData[0];
    const roleIndex = headers.indexOf('role');
    const lineUserIdIndex = headers.indexOf('line_user_id');
    
    // หา Admin users
    const adminUsers = [];
    for (let i = 1; i < userData.length; i++) {
      if (userData[i][roleIndex] === 'Admin' && userData[i][lineUserIdIndex]) {
        adminUsers.push(userData[i][lineUserIdIndex]);
      }
    }
    
    if (adminUsers.length === 0) {
      Logger.log('⚠️ No admin users found to notify');
      return;
    }
    
    // สร้าง error message
    const errorMessage = {
      type: 'text',
      text: `🚨 *System Error Alert*\n\n` +
            `Type: ${errorType}\n` +
            `Time: ${errorDetails.timestamp || new Date().toISOString()}\n` +
            `Message: ${errorDetails.message}\n\n` +
            `Please check the logs for more details.`
    };
    
    // ส่ง notification ไปหา admin แต่ละคน
    adminUsers.forEach(adminLineUserId => {
      try {
        pushMessage(adminLineUserId, [errorMessage], false); // ใช้ Internal OA
        Logger.log(`✓ Notified admin: ${adminLineUserId}`);
      } catch (pushError) {
        Logger.log(`✗ Failed to notify admin ${adminLineUserId}: ${pushError.message}`);
      }
    });
    
  } catch (error) {
    Logger.log('Error in notifyAdminError: ' + error.message);
  }
}