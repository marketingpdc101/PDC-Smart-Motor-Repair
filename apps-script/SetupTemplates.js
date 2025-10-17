/**
 * PDC Smart Motor Repair - Setup Templates & Folders
 * 
 * สร้าง Google Docs Templates และ Google Drive Folders อัตโนมัติ
 */

/**
 * Setup ทั้งหมด (เรียกครั้งเดียว)
 */
function setupTemplatesAndFolders() {
  Logger.log('========================================');
  Logger.log('  SETUP TEMPLATES & FOLDERS');
  Logger.log('========================================');
  Logger.log('');
  
  try {
    // 1. สร้าง Folders
    Logger.log('📁 Creating Google Drive Folders...');
    const folders = createDriveFolders();
    Logger.log('✅ Folders created');
    Logger.log('');
    
    // 2. สร้าง Templates
    Logger.log('📄 Creating Google Docs Templates...');
    const templates = createDocTemplates(folders);
    Logger.log('✅ Templates created');
    Logger.log('');
    
    // 3. แสดงผลลัพธ์
    Logger.log('========================================');
    Logger.log('  SETUP COMPLETE!');
    Logger.log('========================================');
    Logger.log('');
    Logger.log('📋 Copy these IDs to config.js:');
    Logger.log('');
    Logger.log('TEMPLATES: {');
    Logger.log(`  QUOTATION: '${templates.QUOTATION}',`);
    Logger.log(`  WORK_ORDER: '${templates.WORK_ORDER}',`);
    Logger.log(`  FINAL_REPORT: '${templates.FINAL_REPORT}'`);
    Logger.log('},');
    Logger.log('');
    Logger.log('DRIVE_FOLDERS: {');
    Logger.log(`  ROOT: '${folders.ROOT}',`);
    Logger.log(`  QUOTATIONS: '${folders.QUOTATIONS}',`);
    Logger.log(`  WORK_ORDERS: '${folders.WORK_ORDERS}',`);
    Logger.log(`  FINAL_REPORTS: '${folders.FINAL_REPORTS}',`);
    Logger.log(`  PHOTOS_BEFORE: '${folders.PHOTOS_BEFORE}',`);
    Logger.log(`  PHOTOS_PROCESS: '${folders.PHOTOS_PROCESS}',`);
    Logger.log(`  PHOTOS_AFTER: '${folders.PHOTOS_AFTER}',`);
    Logger.log(`  TEST_RESULTS: '${folders.TEST_RESULTS}',`);
    Logger.log(`  DELIVERY: '${folders.DELIVERY}'`);
    Logger.log('},');
    Logger.log('');
    Logger.log('✅ Setup Complete!');
    
    return {
      folders: folders,
      templates: templates
    };
    
  } catch (error) {
    Logger.log('❌ Error: ' + error.message);
    throw error;
  }
}

/**
 * สร้าง Google Drive Folders
 */
function createDriveFolders() {
  const rootFolderName = 'PDC Smart Motor Repair - Documents';
  
  // สร้าง Root Folder
  const rootFolder = DriveApp.createFolder(rootFolderName);
  
  // สร้าง Sub Folders
  const quotationsFolder = rootFolder.createFolder('Quotations');
  const workOrdersFolder = rootFolder.createFolder('Work Orders');
  const finalReportsFolder = rootFolder.createFolder('Final Reports');
  const photosBeforeFolder = rootFolder.createFolder('Photos - Before');
  const photosProcessFolder = rootFolder.createFolder('Photos - Process');
  const photosAfterFolder = rootFolder.createFolder('Photos - After');
  const testResultsFolder = rootFolder.createFolder('Test Results');
  const deliveryFolder = rootFolder.createFolder('Delivery Documents');
  
  Logger.log(`✅ Root Folder: ${rootFolder.getName()}`);
  Logger.log(`   URL: ${rootFolder.getUrl()}`);
  
  return {
    ROOT: rootFolder.getId(),
    QUOTATIONS: quotationsFolder.getId(),
    WORK_ORDERS: workOrdersFolder.getId(),
    FINAL_REPORTS: finalReportsFolder.getId(),
    PHOTOS_BEFORE: photosBeforeFolder.getId(),
    PHOTOS_PROCESS: photosProcessFolder.getId(),
    PHOTOS_AFTER: photosAfterFolder.getId(),
    TEST_RESULTS: testResultsFolder.getId(),
    DELIVERY: deliveryFolder.getId()
  };
}

/**
 * สร้าง Google Docs Templates
 */
function createDocTemplates(folders) {
  const templates = {};
  
  // 1. Quotation Template
  templates.QUOTATION = createQuotationTemplate(folders.ROOT);
  
  // 2. Work Order Template
  templates.WORK_ORDER = createWorkOrderTemplate(folders.ROOT);
  
  // 3. Final Report Template
  templates.FINAL_REPORT = createFinalReportTemplate(folders.ROOT);
  
  return templates;
}

/**
 * สร้าง Quotation Template
 */
function createQuotationTemplate(folderId) {
  const doc = DocumentApp.create('Template - Quotation');
  const body = doc.getBody();
  
  // Header
  body.appendParagraph('บริษัท พี.ดี.ซี. มอเตอร์ แอนด์ เซอร์วิส จำกัด')
    .setAlignment(DocumentApp.HorizontalAlignment.CENTER)
    .setFontSize(18)
    .setBold(true);
  
  body.appendParagraph('P.D.C. MOTOR & SERVICE CO., LTD.')
    .setAlignment(DocumentApp.HorizontalAlignment.CENTER)
    .setFontSize(14);
  
  body.appendParagraph('เลขที่ 123/45 ถนนพระราม 3 แขวงบางโพงพาง เขตยานนาวา กรุงเทพฯ 10120')
    .setAlignment(DocumentApp.HorizontalAlignment.CENTER)
    .setFontSize(10);
  
  body.appendParagraph('โทร. 02-XXX-XXXX Email: sales@pdcmotor.com')
    .setAlignment(DocumentApp.HorizontalAlignment.CENTER)
    .setFontSize(10);
  
  body.appendHorizontalRule();
  
  // Title
  body.appendParagraph('')
    .appendText('ใบเสนอราคา / QUOTATION')
    .setFontSize(16)
    .setBold(true);
  
  // Document Info
  body.appendParagraph('เลขที่เอกสาร: {{quotation_no}}');
  body.appendParagraph('วันที่: {{quotation_date}}');
  body.appendParagraph('Valid Until: {{valid_until}}');
  body.appendParagraph('Job ID: {{job_id}}');
  body.appendParagraph('');
  
  // Customer Info
  body.appendParagraph('เรียน: {{customer_name}}')
    .setBold(true);
  body.appendParagraph('บริษัท: {{company}}');
  body.appendParagraph('');
  
  // Motor Info
  body.appendParagraph('รายละเอียดมอเตอร์:')
    .setBold(true);
  body.appendParagraph('ชนิด: {{asset_desc}}');
  body.appendParagraph('Serial No: {{serial_no}}');
  body.appendParagraph('ยี่ห้อ: {{brand}}');
  body.appendParagraph('รุ่น: {{model}}');
  body.appendParagraph('');
  
  // Items
  body.appendParagraph('รายการซ่อม / Repair Items:')
    .setBold(true);
  body.appendParagraph('{{items_table}}');
  body.appendParagraph('');
  
  // Total
  body.appendParagraph('ยอดรวมก่อน VAT: {{subtotal}}')
    .setAlignment(DocumentApp.HorizontalAlignment.RIGHT);
  body.appendParagraph('VAT 7%: {{vat}}')
    .setAlignment(DocumentApp.HorizontalAlignment.RIGHT);
  body.appendParagraph('ยอดรวมทั้งสิ้น: {{total}}')
    .setAlignment(DocumentApp.HorizontalAlignment.RIGHT)
    .setBold(true)
    .setFontSize(14);
  
  body.appendParagraph('');
  body.appendParagraph('หมายเหตุ: ราคานี้รวมค่าแรง วัสดุ และการทดสอบแล้ว');
  body.appendParagraph('เงื่อนไขการชำระเงิน: โอนเงินก่อนส่งมอบ 100%');
  
  // Move to folder
  const file = DriveApp.getFileById(doc.getId());
  DriveApp.getFolderById(folderId).addFile(file);
  DriveApp.getRootFolder().removeFile(file);
  
  Logger.log(`✅ Quotation Template created: ${file.getUrl()}`);
  
  return doc.getId();
}

/**
 * สร้าง Work Order Template
 */
function createWorkOrderTemplate(folderId) {
  const doc = DocumentApp.create('Template - Work Order');
  const body = doc.getBody();
  
  // Header
  body.appendParagraph('บริษัท พี.ดี.ซี. มอเตอร์ แอนด์ เซอร์วิส จำกัด')
    .setAlignment(DocumentApp.HorizontalAlignment.CENTER)
    .setFontSize(18)
    .setBold(true);
  
  body.appendParagraph('ใบสั่งงาน / WORK ORDER')
    .setAlignment(DocumentApp.HorizontalAlignment.CENTER)
    .setFontSize(16)
    .setBold(true);
  
  body.appendHorizontalRule();
  
  // Document Info
  body.appendParagraph('เลขที่ใบสั่งงาน: {{wo_no}}')
    .setBold(true);
  body.appendParagraph('วันที่: {{wo_date}}');
  body.appendParagraph('Job ID: {{job_id}}');
  body.appendParagraph('');
  
  // Customer Info
  body.appendParagraph('ลูกค้า: {{customer_name}}');
  body.appendParagraph('บริษัท: {{company}}');
  body.appendParagraph('');
  
  // Motor Info
  body.appendParagraph('รายละเอียดมอเตอร์:')
    .setBold(true);
  body.appendParagraph('ชนิด: {{asset_desc}}');
  body.appendParagraph('Serial No: {{serial_no}}');
  body.appendParagraph('ยี่ห้อ: {{brand}}');
  body.appendParagraph('รุ่น: {{model}}');
  body.appendParagraph('กำหนดส่งมอบ: {{eta_finish}}');
  body.appendParagraph('');
  
  // Repair Items
  body.appendParagraph('รายการซ่อม:')
    .setBold(true);
  body.appendParagraph('{{repair_items}}');
  body.appendParagraph('');
  
  // Sign
  body.appendParagraph('ผู้รับงาน: _____________________');
  body.appendParagraph('วันที่: _____________________');
  body.appendParagraph('');
  body.appendParagraph('ผู้ตรวจสอบ: _____________________');
  body.appendParagraph('วันที่: _____________________');
  
  // Move to folder
  const file = DriveApp.getFileById(doc.getId());
  DriveApp.getFolderById(folderId).addFile(file);
  DriveApp.getRootFolder().removeFile(file);
  
  Logger.log(`✅ Work Order Template created: ${file.getUrl()}`);
  
  return doc.getId();
}

/**
 * สร้าง Final Report Template
 */
function createFinalReportTemplate(folderId) {
  const doc = DocumentApp.create('Template - Final Report');
  const body = doc.getBody();
  
  // Header
  body.appendParagraph('บริษัท พี.ดี.ซี. มอเตอร์ แอนด์ เซอร์วิส จำกัด')
    .setAlignment(DocumentApp.HorizontalAlignment.CENTER)
    .setFontSize(18)
    .setBold(true);
  
  body.appendParagraph('รายงานผลการซ่อม / FINAL REPORT')
    .setAlignment(DocumentApp.HorizontalAlignment.CENTER)
    .setFontSize(16)
    .setBold(true);
  
  body.appendHorizontalRule();
  
  // Document Info
  body.appendParagraph('เลขที่รายงาน: {{report_no}}')
    .setBold(true);
  body.appendParagraph('วันที่: {{report_date}}');
  body.appendParagraph('Job ID: {{job_id}}');
  body.appendParagraph('');
  
  // Customer Info
  body.appendParagraph('ลูกค้า: {{customer_name}}');
  body.appendParagraph('บริษัท: {{company}}');
  body.appendParagraph('');
  
  // Motor Info
  body.appendParagraph('รายละเอียดมอเตอร์:')
    .setBold(true);
  body.appendParagraph('ชนิด: {{asset_desc}}');
  body.appendParagraph('Serial No: {{serial_no}}');
  body.appendParagraph('');
  
  // Repair Summary
  body.appendParagraph('สรุปการซ่อม:')
    .setBold(true);
  body.appendParagraph('{{repair_summary}}');
  body.appendParagraph('');
  
  // Test Results
  body.appendParagraph('ผลการทดสอบไฟฟ้า:')
    .setBold(true);
  body.appendParagraph('แรงดันไฟฟ้า: {{voltage}}');
  body.appendParagraph('กระแสไฟฟ้า: {{current}}');
  body.appendParagraph('ความเร็วรอบ: {{rpm}}');
  body.appendParagraph('ค่า Insulation Resistance: {{ir}}');
  body.appendParagraph('ค่า Vibration: {{vibration}}');
  body.appendParagraph('อุณหภูมิ: {{temperature}}');
  body.appendParagraph('ผลการทดสอบ: {{pass_fail}}')
    .setBold(true)
    .setFontSize(14);
  body.appendParagraph('หมายเหตุ: {{test_remark}}');
  body.appendParagraph('');
  
  // Photos
  body.appendParagraph('รูปภาพ:')
    .setBold(true);
  body.appendParagraph('ดูรูปภาพเพิ่มเติมได้ที่: {{photos_url}}');
  body.appendParagraph('');
  
  // Warranty
  body.appendParagraph('รับประกัน: 90 วัน นับจากวันส่งมอบ');
  body.appendParagraph('');
  
  // Sign
  body.appendParagraph('ผู้ทดสอบ: _____________________');
  body.appendParagraph('วันที่: _____________________');
  body.appendParagraph('');
  body.appendParagraph('ผู้อนุมัติ: _____________________');
  body.appendParagraph('วันที่: _____________________');
  
  // Move to folder
  const file = DriveApp.getFileById(doc.getId());
  DriveApp.getFolderById(folderId).addFile(file);
  DriveApp.getRootFolder().removeFile(file);
  
  Logger.log(`✅ Final Report Template created: ${file.getUrl()}`);
  
  return doc.getId();
}

/**
 * ทดสอบ - ลบ Folders และ Templates ที่สร้างไว้
 */
function cleanupTemplatesAndFolders() {
  Logger.log('⚠️  Cleaning up...');
  
  // ลบ Root Folder
  const folders = DriveApp.getFoldersByName('PDC Smart Motor Repair - Documents');
  while (folders.hasNext()) {
    const folder = folders.next();
    Logger.log(`🗑️  Deleting folder: ${folder.getName()}`);
    folder.setTrashed(true);
  }
  
  // ลบ Templates
  ['Template - Quotation', 'Template - Work Order', 'Template - Final Report'].forEach(name => {
    const files = DriveApp.getFilesByName(name);
    while (files.hasNext()) {
      const file = files.next();
      Logger.log(`🗑️  Deleting file: ${file.getName()}`);
      file.setTrashed(true);
    }
  });
  
  Logger.log('✅ Cleanup complete');
}
