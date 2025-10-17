/**
 * PDC Smart Motor Repair - Database Operations
 * 
 * จัดการ CRUD operations กับ Google Sheets
 */

/**
 * Initialize database (สร้าง Sheets ทั้งหมด)
 */
function initializeDatabase() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // สร้าง Sheets ถ้ายังไม่มี
  createSheetIfNotExists(ss, CONFIG.SHEETS.JOBS, getJobsHeaders());
  createSheetIfNotExists(ss, CONFIG.SHEETS.JOB_ITEMS, getJobItemsHeaders());
  createSheetIfNotExists(ss, CONFIG.SHEETS.MEDIA, getMediaHeaders());
  createSheetIfNotExists(ss, CONFIG.SHEETS.EVENTS, getEventsHeaders());
  createSheetIfNotExists(ss, CONFIG.SHEETS.APPROVALS, getApprovalsHeaders());
  createSheetIfNotExists(ss, CONFIG.SHEETS.TEST_RESULTS, getTestResultsHeaders());
  createSheetIfNotExists(ss, CONFIG.SHEETS.USERS, getUsersHeaders());
  createSheetIfNotExists(ss, CONFIG.SHEETS.CUSTOMERS, getCustomersHeaders());
  createSheetIfNotExists(ss, CONFIG.SHEETS.NOTIFICATIONS, getNotificationsHeaders());
  
  Logger.log('✅ Database initialized successfully!');
}

/**
 * สร้าง Sheet ใหม่ถ้ายังไม่มี
 */
function createSheetIfNotExists(ss, sheetName, headers) {
  let sheet = ss.getSheetByName(sheetName);
  
  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
    
    // ตั้งค่า Headers
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');
    sheet.getRange(1, 1, 1, headers.length).setBackground('#4285F4');
    sheet.getRange(1, 1, 1, headers.length).setFontColor('#FFFFFF');
    sheet.setFrozenRows(1);
    
    Logger.log(`Created sheet: ${sheetName}`);
  }
  
  return sheet;
}

// ========================================
// Schema Definitions (Headers)
// ========================================

function getJobsHeaders() {
  return [
    'job_id', 'customer_id', 'customer_name', 'company',
    'sales_owner', 'asset_desc', 'serial_no', 'brand', 'model',
    'status', 'milestone', 'priority',
    'eta_start', 'eta_finish', 'actual_finish',
    'quotation_no', 'quotation_pdf', 'quotation_amount', 'quotation_sent_at',
    'workorder_no', 'workorder_pdf', 'workorder_created_at',
    'final_report_no', 'final_report_pdf', 'final_report_sent_at',
    'po_no', 'approved_at', 'approved_by',
    'created_at', 'created_by', 'updated_at', 'updated_by',
    'notes', 'tags'
  ];
}

function getJobItemsHeaders() {
  return [
    'item_id', 'job_id', 'line_no', 'title', 'tech_detail',
    'uom', 'qty', 'unit_price', 'discount_percent', 'subtotal',
    'is_quoted', 'is_approved', 'media_group_id',
    'created_at', 'updated_at'
  ];
}

function getMediaHeaders() {
  return [
    'media_id', 'job_id', 'item_id', 'milestone', 'type',
    'drive_file_id', 'webapp_url', 'thumbnail_url',
    'filename', 'mime_type', 'file_size',
    'created_by', 'created_at', 'note', 'tags'
  ];
}

function getEventsHeaders() {
  return [
    'event_id', 'job_id', 'event_type', 'actor_role', 'actor_id', 'actor_name',
    'payload_json', 'ip_address', 'user_agent',
    'created_at'
  ];
}

function getApprovalsHeaders() {
  return [
    'approval_id', 'job_id', 'quotation_no',
    'approved_by_line_user_id', 'approved_name', 'approved_company',
    'po_no', 'approval_note',
    'approved_at', 'channel', 'message_id'
  ];
}

function getTestResultsHeaders() {
  return [
    'test_id', 'job_id',
    'voltage_v', 'current_a', 'rpm',
    'ir_mohm', 'vibration_mm_s', 'temperature_c',
    'balancing_spec', 'balancing_result',
    'remark', 'pass_fail',
    'tester_name', 'tested_at',
    'attachments_media_group_id'
  ];
}

function getUsersHeaders() {
  return [
    'user_id', 'name', 'email', 'phone',
    'role', 'internal_line_user_id', 'line_display_name',
    'department', 'position',
    'is_active', 'last_login_at',
    'created_at', 'updated_at'
  ];
}

function getCustomersHeaders() {
  return [
    'customer_id', 'company', 'contact_name', 'contact_email', 'contact_phone',
    'line_user_id', 'line_display_name',
    'address', 'tax_id', 'customer_type',
    'credit_term_days', 'credit_limit',
    'is_active', 'tags',
    'created_at', 'updated_at'
  ];
}

function getNotificationsHeaders() {
  return [
    'notif_id', 'job_id', 'to_role', 'to_line_user_id',
    'message_type', 'message_text', 'flex_json',
    'line_message_id', 'status', 'error_message',
    'sent_at', 'delivered_at'
  ];
}

// ========================================
// CRUD Operations - Jobs
// ========================================

/**
 * สร้างงานใหม่
 */
function createJob(jobData) {
  const sheet = getSheet(CONFIG.SHEETS.JOBS);
  const jobId = generateJobId();
  const timestamp = new Date();
  
  const row = [
    jobId,
    jobData.customer_id || '',
    jobData.customer_name || '',
    jobData.company || '',
    jobData.sales_owner || '',
    jobData.asset_desc || '',
    jobData.serial_no || '',
    jobData.brand || '',
    jobData.model || '',
    CONFIG.STATUS.DRAFT,
    CONFIG.MILESTONES[0], // 'Received'
    jobData.priority || 'Normal',
    jobData.eta_start || '',
    jobData.eta_finish || calculateETA(),
    '',
    '', '', '', '',
    '', '', '',
    '', '', '',
    '', '', '',
    timestamp,
    jobData.created_by || '',
    timestamp,
    jobData.created_by || '',
    jobData.notes || '',
    jobData.tags || ''
  ];
  
  sheet.appendRow(row);
  
  // Log event
  logEvent(jobId, 'job_created', jobData.created_by || 'system', {
    job_id: jobId,
    customer_name: jobData.customer_name
  });
  
  return jobId;
}

/**
 * ดึงข้อมูลงานตาม job_id
 */
function getJob(jobId) {
  const sheet = getSheet(CONFIG.SHEETS.JOBS);
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === jobId) {
      return arrayToObject(headers, data[i]);
    }
  }
  
  return null;
}

/**
 * อัพเดทข้อมูลงาน
 */
function updateJob(jobId, updates) {
  const sheet = getSheet(CONFIG.SHEETS.JOBS);
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === jobId) {
      // อัพเดทเฉพาะ columns ที่มีใน updates
      Object.keys(updates).forEach(key => {
        const colIndex = headers.indexOf(key);
        if (colIndex !== -1) {
          data[i][colIndex] = updates[key];
        }
      });
      
      // อัพเดท updated_at
      const updatedAtIndex = headers.indexOf('updated_at');
      data[i][updatedAtIndex] = new Date();
      
      // เขียนกลับ
      sheet.getRange(i + 1, 1, 1, headers.length).setValues([data[i]]);
      
      return true;
    }
  }
  
  return false;
}

/**
 * เปลี่ยนสถานะงาน
 */
function updateJobStatus(jobId, newStatus, actorName) {
  const result = updateJob(jobId, { status: newStatus });
  
  if (result) {
    logEvent(jobId, 'status_changed', actorName, {
      new_status: newStatus
    });
  }
  
  return result;
}

/**
 * เปลี่ยน Milestone
 */
function updateJobMilestone(jobId, newMilestone, actorName, note, photos) {
  const result = updateJob(jobId, { milestone: newMilestone });
  
  if (result) {
    logEvent(jobId, 'milestone_changed', actorName, {
      new_milestone: newMilestone,
      note: note,
      photos_count: photos ? photos.length : 0
    });
    
    // บันทึกรูปภาพ
    if (photos && photos.length > 0) {
      photos.forEach(photo => {
        createMedia({
          job_id: jobId,
          milestone: newMilestone,
          type: 'photo',
          drive_file_id: photo.file_id,
          created_by: actorName,
          note: note
        });
      });
    }
  }
  
  return result;
}

// ========================================
// CRUD Operations - Job Items
// ========================================

/**
 * เพิ่มรายการซ่อม
 */
function createJobItem(itemData) {
  const sheet = getSheet(CONFIG.SHEETS.JOB_ITEMS);
  const itemId = generateId('ITEM');
  const timestamp = new Date();
  
  const row = [
    itemId,
    itemData.job_id,
    itemData.line_no || 0,
    itemData.title || '',
    itemData.tech_detail || '',
    itemData.uom || 'ชุด',
    itemData.qty || 1,
    itemData.unit_price || 0,
    itemData.discount_percent || 0,
    itemData.subtotal || 0,
    itemData.is_quoted || false,
    itemData.is_approved || false,
    itemData.media_group_id || '',
    timestamp,
    timestamp
  ];
  
  sheet.appendRow(row);
  return itemId;
}

/**
 * ดึงรายการซ่อมทั้งหมดของงาน
 */
function getJobItems(jobId) {
  const sheet = getSheet(CONFIG.SHEETS.JOB_ITEMS);
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const items = [];
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][1] === jobId) {  // job_id column
      items.push(arrayToObject(headers, data[i]));
    }
  }
  
  return items;
}

// ========================================
// CRUD Operations - Media
// ========================================

/**
 * บันทึกไฟล์สื่อ
 */
function createMedia(mediaData) {
  const sheet = getSheet(CONFIG.SHEETS.MEDIA);
  const mediaId = generateId('MEDIA');
  const timestamp = new Date();
  
  const row = [
    mediaId,
    mediaData.job_id || '',
    mediaData.item_id || '',
    mediaData.milestone || '',
    mediaData.type || 'photo',
    mediaData.drive_file_id || '',
    mediaData.webapp_url || '',
    mediaData.thumbnail_url || '',
    mediaData.filename || '',
    mediaData.mime_type || '',
    mediaData.file_size || 0,
    mediaData.created_by || '',
    timestamp,
    mediaData.note || '',
    mediaData.tags || ''
  ];
  
  sheet.appendRow(row);
  return mediaId;
}

/**
 * ดึงสื่อทั้งหมดของงาน
 */
function getMediaByJob(jobId, milestone = null) {
  const sheet = getSheet(CONFIG.SHEETS.MEDIA);
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const media = [];
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][1] === jobId) {  // job_id column
      if (!milestone || data[i][3] === milestone) {
        media.push(arrayToObject(headers, data[i]));
      }
    }
  }
  
  return media;
}

// ========================================
// CRUD Operations - Events
// ========================================

/**
 * Log event
 */
function logEvent(jobId, eventType, actorName, payload) {
  const sheet = getSheet(CONFIG.SHEETS.EVENTS);
  const eventId = generateId('EVENT');
  const timestamp = new Date();
  
  const row = [
    eventId,
    jobId,
    eventType,
    '', // actor_role (TBD)
    '', // actor_id (TBD)
    actorName,
    JSON.stringify(payload),
    '', // ip_address
    '', // user_agent
    timestamp
  ];
  
  sheet.appendRow(row);
  return eventId;
}

// ========================================
// CRUD Operations - Test Results
// ========================================

/**
 * บันทึกผลทดสอบ
 */
function createTestResult(testData) {
  const sheet = getSheet(CONFIG.SHEETS.TEST_RESULTS);
  const testId = generateId('TEST');
  const timestamp = new Date();
  
  const row = [
    testId,
    testData.job_id,
    testData.voltage_v || 0,
    testData.current_a || 0,
    testData.rpm || 0,
    testData.ir_mohm || 0,
    testData.vibration_mm_s || 0,
    testData.temperature_c || 0,
    testData.balancing_spec || '',
    testData.balancing_result || '',
    testData.remark || '',
    testData.pass_fail || 'PASS',
    testData.tester_name || '',
    timestamp,
    testData.attachments_media_group_id || ''
  ];
  
  sheet.appendRow(row);
  return testId;
}

/**
 * ดึงผลทดสอบของงาน
 */
function getTestResult(jobId) {
  const sheet = getSheet(CONFIG.SHEETS.TEST_RESULTS);
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][1] === jobId) {  // job_id column
      return arrayToObject(headers, data[i]);
    }
  }
  
  return null;
}

// ========================================
// Utility Functions
// ========================================

/**
 * ดึง Sheet object
 */
function getSheet(sheetName) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  return ss.getSheetByName(sheetName);
}

/**
 * แปลง array เป็น object
 */
function arrayToObject(headers, values) {
  const obj = {};
  headers.forEach((header, index) => {
    obj[header] = values[index];
  });
  return obj;
}

/**
 * สร้าง Job ID (PDC-YYYYMM-####)
 */
function generateJobId() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const prefix = `${CONFIG.NUMBERING.JOB_PREFIX}-${year}${month}-`;
  
  // หาเลขที่ล่าสุด
  const sheet = getSheet(CONFIG.SHEETS.JOBS);
  const data = sheet.getDataRange().getValues();
  let maxNum = 0;
  
  for (let i = 1; i < data.length; i++) {
    const jobId = data[i][0];
    if (jobId && jobId.startsWith(prefix)) {
      const num = parseInt(jobId.split('-')[2]);
      if (num > maxNum) maxNum = num;
    }
  }
  
  const nextNum = String(maxNum + 1).padStart(CONFIG.NUMBERING.DIGIT_LENGTH, '0');
  return `${prefix}${nextNum}`;
}

/**
 * สร้าง ID ทั่วไป
 */
function generateId(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * คำนวณ ETA (วันที่คาดว่าจะเสร็จ)
 */
function calculateETA(leadTimeDays = null) {
  const days = leadTimeDays || CONFIG.BUSINESS.DEFAULT_LEAD_TIME_DAYS;
  const eta = new Date();
  eta.setDate(eta.getDate() + days);
  return eta;
}

/**
 * ทดสอบ Database
 */
function testDatabase() {
  Logger.log('=== Testing Database Operations ===');
  
  // Test create job
  const jobId = createJob({
    customer_name: 'ทดสอบระบบ',
    company: 'บริษัท ABC จำกัด',
    asset_desc: 'มอเตอร์ไฟฟ้า 50 HP',
    serial_no: 'TEST-001',
    created_by: 'Admin'
  });
  
  Logger.log('Created Job ID: ' + jobId);
  
  // Test get job
  const job = getJob(jobId);
  Logger.log('Retrieved Job: ' + JSON.stringify(job));
  
  // Test update job
  updateJobStatus(jobId, CONFIG.STATUS.IN_PROGRESS, 'Admin');
  Logger.log('Updated job status to In-Progress');
}
