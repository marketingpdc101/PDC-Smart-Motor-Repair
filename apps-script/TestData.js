/**
 * PDC Smart Motor Repair - Test Data Generator
 * 
 * สร้างข้อมูลทดสอบสำหรับ LIFF Apps
 */

/**
 * สร้างข้อมูลทดสอบครบชุด
 */
function createTestData() {
  Logger.log('🚀 Starting Test Data Creation...');
  
  // 1. สร้าง Customer ทดสอบ
  const customerId = createTestCustomer();
  Logger.log('✅ Created Customer: ' + customerId);
  
  // 2. สร้าง User (พนักงาน) ทดสอบ
  const userId = createTestUser();
  Logger.log('✅ Created User: ' + userId);
  
  // 3. สร้าง Job ทดสอบ
  const jobId = createTestJob(customerId, userId);
  Logger.log('✅ Created Job: ' + jobId);
  
  // 4. สร้าง Job Items (รายการซ่อม)
  createTestJobItems(jobId);
  Logger.log('✅ Created Job Items');
  
  // 5. อัพเดทสถานะเป็น PendingApproval
  updateJobStatus(jobId, CONFIG.STATUS.PENDING_APPROVAL, 'Admin');
  Logger.log('✅ Updated Job Status to PendingApproval');
  
  // แสดงผลสรุป
  Logger.log('');
  Logger.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  Logger.log('🎉 Test Data Created Successfully!');
  Logger.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  Logger.log('');
  Logger.log('📋 สรุปข้อมูลทดสอบ:');
  Logger.log('   Customer ID: ' + customerId);
  Logger.log('   User ID: ' + userId);
  Logger.log('   Job ID: ' + jobId);
  Logger.log('');
  Logger.log('🔗 ทดสอบ LIFF Apps:');
  Logger.log('   Quotation: ' + CONFIG.WEB_APP_URL + '?action=getQuotation&jobId=' + jobId);
  Logger.log('   Work Order: ' + CONFIG.WEB_APP_URL + '?action=getJob&jobId=' + jobId);
  Logger.log('   Status Update: ' + CONFIG.WEB_APP_URL + '?action=getJob&jobId=' + jobId);
  Logger.log('   Final Test: ' + CONFIG.WEB_APP_URL + '?action=getJob&jobId=' + jobId);
  Logger.log('   Final Report: ' + CONFIG.WEB_APP_URL + '?action=getJob&jobId=' + jobId);
  Logger.log('');
  
  return {
    customerId: customerId,
    userId: userId,
    jobId: jobId
  };
}

/**
 * สร้าง Customer ทดสอบ
 */
function createTestCustomer() {
  const sheet = getSheet(CONFIG.SHEETS.CUSTOMERS);
  const customerId = 'CUST-' + Date.now();
  const timestamp = new Date();
  
  const row = [
    customerId,                           // customer_id
    'บริษัท เทสต์ มอเตอร์ จำกัด',         // company
    'คุณสมชาย ทดสอบ',                    // contact_name
    'somchai@testmotor.com',             // contact_email
    '089-999-8888',                      // contact_phone
    'Uxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx', // line_user_id (จะใช้จริงตอนทดสอบ)
    'สมชาย ทดสอบ',                       // line_display_name
    '123 ถ.ทดสอบ แขวงทดสอบ เขททดสอบ กรุงเทพฯ 10100', // address
    '0123456789012',                     // tax_id
    'Corporate',                         // customer_type
    30,                                  // credit_term_days
    500000,                              // credit_limit
    true,                                // is_active
    'VIP,Test',                          // tags
    timestamp,                           // created_at
    timestamp                            // updated_at
  ];
  
  sheet.appendRow(row);
  return customerId;
}

/**
 * สร้าง User (พนักงาน) ทดสอบ
 */
function createTestUser() {
  const sheet = getSheet(CONFIG.SHEETS.USERS);
  const userId = 'USER-' + Date.now();
  const timestamp = new Date();
  
  const row = [
    userId,                              // user_id
    'นายช่าง ทดสอบ',                     // name
    'mechanic@pdc-motor.com',           // email
    '081-111-2222',                     // phone
    CONFIG.ROLES.MECHANICAL,             // role
    'Uxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx', // internal_line_user_id
    'ช่าง ทดสอบ',                        // line_display_name
    'Production',                        // department
    'Senior Mechanic',                   // position
    true,                                // is_active
    timestamp,                           // last_login_at
    timestamp,                           // created_at
    timestamp                            // updated_at
  ];
  
  sheet.appendRow(row);
  return userId;
}

/**
 * สร้าง Job ทดสอบ
 */
function createTestJob(customerId, userId) {
  const sheet = getSheet(CONFIG.SHEETS.JOBS);
  const jobId = generateJobId();
  const timestamp = new Date();
  const etaStart = new Date();
  const etaFinish = calculateETA(7);
  
  const row = [
    jobId,                               // job_id
    customerId,                          // customer_id
    'บริษัท เทสต์ มอเตอร์ จำกัด',        // customer_name
    'บริษัท เทสต์ มอเตอร์ จำกัด',        // company
    'Sale Team A',                       // sales_owner
    'มอเตอร์ไฟฟ้า 3 Phase 50 HP 380V',  // asset_desc
    'TEST-MOTOR-001',                    // serial_no
    'MITSUBISHI',                        // brand
    'SF-JRV 50HP',                       // model
    CONFIG.STATUS.PENDING_APPROVAL,      // status
    CONFIG.MILESTONES[0],                // milestone (Received)
    'High',                              // priority
    etaStart,                            // eta_start
    etaFinish,                           // eta_finish
    '',                                  // actual_finish
    'Q-202510-0001',                     // quotation_no
    '',                                  // quotation_pdf
    45000,                               // quotation_amount
    timestamp,                           // quotation_sent_at
    '',                                  // workorder_no
    '',                                  // workorder_pdf
    '',                                  // workorder_created_at
    '',                                  // final_report_no
    '',                                  // final_report_pdf
    '',                                  // final_report_sent_at
    '',                                  // po_no
    '',                                  // approved_at
    '',                                  // approved_by
    timestamp,                           // created_at
    userId,                              // created_by
    timestamp,                           // updated_at
    userId,                              // updated_by
    'งานทดสอบระบบ LIFF Apps - มอเตอร์ไหม้ ต้องพันขดลวดใหม่', // notes
    'Test,Urgent,VIP'                    // tags
  ];
  
  sheet.appendRow(row);
  
  // Log event
  logEvent(jobId, 'job_created', 'Admin', {
    customer_name: 'บริษัท เทสต์ มอเตอร์ จำกัด',
    asset_desc: 'มอเตอร์ไฟฟ้า 3 Phase 50 HP 380V'
  });
  
  return jobId;
}

/**
 * สร้าง Job Items (รายการซ่อม)
 */
function createTestJobItems(jobId) {
  const items = [
    {
      line_no: 1,
      title: 'พันขดลวด Stator ใหม่ (ทองแดง 100%)',
      tech_detail: 'ถอด Stator เดิม เผาขดลวด ทำ Core พันขดลวดใหม่ด้วยลวดทองแดงแท้ 100% ขนาด 2.0 mm², จำนวน 24 Slot, เคลือบ Varnish Grade A',
      uom: 'ชุด',
      qty: 1,
      unit_price: 28000,
      discount_percent: 0,
      subtotal: 28000,
      is_quoted: true,
      is_approved: false
    },
    {
      line_no: 2,
      title: 'เปลี่ยน Bearing ทั้ง 2 ข้าง',
      tech_detail: 'Bearing 6312 ZZ (SKF หรือเทียบเท่า) จำนวน 2 ตัว พร้อมติดตั้ง',
      uom: 'ชุด',
      qty: 1,
      unit_price: 4500,
      discount_percent: 10,
      subtotal: 4050,
      is_quoted: true,
      is_approved: false
    },
    {
      line_no: 3,
      title: 'ถ่วงแบลานซ์ + ทดสอบไฟฟ้า',
      tech_detail: 'ถ่วงแบลานซ์ Static & Dynamic, ทดสอบ Insulation Resistance, ทดสอบโหลด No-Load และ Full-Load',
      uom: 'งาน',
      qty: 1,
      unit_price: 3500,
      discount_percent: 0,
      subtotal: 3500,
      is_quoted: true,
      is_approved: false
    },
    {
      line_no: 4,
      title: 'พ่นสีตัวเครื่อง + ทำป้ายข้อมูล',
      tech_detail: 'ขัดผิว พ่นรองพื้น พ่นสีน้ำมัน (สีตามต้องการ) ทำป้ายข้อมูลเครื่องใหม่',
      uom: 'งาน',
      qty: 1,
      unit_price: 2500,
      discount_percent: 0,
      subtotal: 2500,
      is_quoted: true,
      is_approved: false
    }
  ];
  
  const sheet = getSheet(CONFIG.SHEETS.JOB_ITEMS);
  const timestamp = new Date();
  
  items.forEach(item => {
    const itemId = generateId('ITEM');
    const row = [
      itemId,                    // item_id
      jobId,                     // job_id
      item.line_no,              // line_no
      item.title,                // title
      item.tech_detail,          // tech_detail
      item.uom,                  // uom
      item.qty,                  // qty
      item.unit_price,           // unit_price
      item.discount_percent,     // discount_percent
      item.subtotal,             // subtotal
      item.is_quoted,            // is_quoted
      item.is_approved,          // is_approved
      '',                        // media_group_id
      timestamp,                 // created_at
      timestamp                  // updated_at
    ];
    
    sheet.appendRow(row);
  });
}

/**
 * สร้างข้อมูลทดสอบแบบง่าย (เฉพาะ Job)
 */
function createSimpleTestJob() {
  Logger.log('Creating simple test job...');
  
  const jobId = createJob({
    customer_name: 'บริษัท ABC จำกัด',
    company: 'ABC Co., Ltd.',
    asset_desc: 'มอเตอร์ไฟฟ้า 50 HP',
    serial_no: 'SIMPLE-001',
    brand: 'TOSHIBA',
    model: 'IKH3 50HP',
    priority: 'Normal',
    created_by: 'Admin',
    notes: 'Simple test job for LIFF testing'
  });
  
  Logger.log('✅ Created Job ID: ' + jobId);
  
  // เพิ่ม Job Items
  createJobItem({
    job_id: jobId,
    line_no: 1,
    title: 'พันขดลวดใหม่',
    tech_detail: 'พันขดลวด Stator ด้วยทองแดงแท้',
    uom: 'ชุด',
    qty: 1,
    unit_price: 25000,
    subtotal: 25000,
    is_quoted: true
  });
  
  createJobItem({
    job_id: jobId,
    line_no: 2,
    title: 'เปลี่ยน Bearing',
    tech_detail: 'Bearing 6310 ZZ จำนวน 2 ตัว',
    uom: 'ชุด',
    qty: 1,
    unit_price: 3500,
    subtotal: 3500,
    is_quoted: true
  });
  
  Logger.log('✅ Created Job Items');
  Logger.log('Job ID for testing: ' + jobId);
  
  return jobId;
}

/**
 * สร้างข้อมูลทดสอบแบบละเอียด (มี Customer + User)
 */
function createDetailedTestData() {
  return createTestData();
}

/**
 * ลบข้อมูลทดสอบทั้งหมด (ระวัง!)
 */
function clearAllTestData() {
  const confirmed = Browser.msgBox(
    'ยืนยันการลบข้อมูล',
    'คุณต้องการลบข้อมูลทดสอบทั้งหมดใช่หรือไม่? (ไม่สามารถกู้คืนได้)',
    Browser.Buttons.YES_NO
  );
  
  if (confirmed === 'yes') {
    const sheets = [
      CONFIG.SHEETS.JOBS,
      CONFIG.SHEETS.JOB_ITEMS,
      CONFIG.SHEETS.MEDIA,
      CONFIG.SHEETS.EVENTS,
      CONFIG.SHEETS.APPROVALS,
      CONFIG.SHEETS.TEST_RESULTS,
      CONFIG.SHEETS.USERS,
      CONFIG.SHEETS.CUSTOMERS,
      CONFIG.SHEETS.NOTIFICATIONS
    ];
    
    sheets.forEach(sheetName => {
      const sheet = getSheet(sheetName);
      if (sheet) {
        const lastRow = sheet.getLastRow();
        if (lastRow > 1) {
          sheet.getRange(2, 1, lastRow - 1, sheet.getLastColumn()).clearContent();
          Logger.log('Cleared: ' + sheetName);
        }
      }
    });
    
    Logger.log('✅ All test data cleared!');
    Browser.msgBox('สำเร็จ', 'ลบข้อมูลทดสอบทั้งหมดแล้ว', Browser.Buttons.OK);
  } else {
    Logger.log('❌ Clear data cancelled');
  }
}

/**
 * ดูข้อมูล Job ล่าสุด
 */
function showLatestJob() {
  const sheet = getSheet(CONFIG.SHEETS.JOBS);
  const data = sheet.getDataRange().getValues();
  
  if (data.length <= 1) {
    Logger.log('❌ No jobs found');
    return null;
  }
  
  const lastRow = data[data.length - 1];
  const headers = data[0];
  const job = arrayToObject(headers, lastRow);
  
  Logger.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  Logger.log('📋 Latest Job Information:');
  Logger.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  Logger.log('Job ID: ' + job.job_id);
  Logger.log('Customer: ' + job.customer_name);
  Logger.log('Asset: ' + job.asset_desc);
  Logger.log('Status: ' + job.status);
  Logger.log('Milestone: ' + job.milestone);
  Logger.log('Quotation Amount: ' + job.quotation_amount);
  Logger.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  // Show items
  const items = getJobItems(job.job_id);
  Logger.log('');
  Logger.log('📦 Job Items (' + items.length + ' items):');
  items.forEach((item, index) => {
    Logger.log('  ' + (index + 1) + '. ' + item.title + ' - ฿' + item.subtotal);
  });
  Logger.log('');
  
  return job;
}
