/**
 * PDC Smart Motor Repair - PDF Generator
 * 
 * สร้าง PDF/Excel จาก Google Docs Templates
 */

/**
 * สร้าง Quotation PDF
 */
function generateQuotationPDF(jobId) {
  const job = getJob(jobId);
  if (!job) throw new Error('Job not found: ' + jobId);
  
  const items = getJobItems(jobId);
  
  // คำนวณยอดรวม
  let subtotal = 0;
  items.forEach(item => {
    subtotal += Number(item.subtotal);
  });
  const vat = subtotal * (CONFIG.BUSINESS.VAT_PERCENTAGE / 100);
  const total = subtotal + vat;
  
  // สร้างเลขที่ใบเสนอราคา
  const quotationNo = generateDocumentNumber('QUOTATION');
  
  // สร้าง PDF จาก Template
  const templateId = CONFIG.TEMPLATES.QUOTATION;
  
  if (!templateId || templateId.includes('YOUR_')) {
    throw new Error('Template ID ยังไม่ได้ตั้งค่า (Config.TEMPLATES.QUOTATION)');
  }
  
  // Copy template
  const templateDoc = DriveApp.getFileById(templateId);
  const copyDoc = templateDoc.makeCopy(`Quotation_${quotationNo}_TEMP`);
  const doc = DocumentApp.openById(copyDoc.getId());
  const body = doc.getBody();
  
  // Replace placeholders
  body.replaceText('{{quotation_no}}', quotationNo);
  body.replaceText('{{quotation_date}}', formatDateThai(new Date()));
  body.replaceText('{{valid_until}}', formatDateThai(calculateValidUntilDate()));
  body.replaceText('{{job_id}}', job.job_id);
  body.replaceText('{{customer_name}}', job.customer_name || '-');
  body.replaceText('{{company}}', job.company || '-');
  body.replaceText('{{asset_desc}}', job.asset_desc || '-');
  body.replaceText('{{serial_no}}', job.serial_no || '-');
  body.replaceText('{{brand}}', job.brand || '-');
  body.replaceText('{{model}}', job.model || '-');
  
  // Replace items table
  let itemsTable = '';
  items.forEach((item, index) => {
    itemsTable += `${index + 1}. ${item.title}\n`;
    itemsTable += `   ${item.tech_detail}\n`;
    itemsTable += `   ${item.qty} ${item.uom} x ${formatCurrency(item.unit_price)} = ${formatCurrency(item.subtotal)}\n\n`;
  });
  body.replaceText('{{items_table}}', itemsTable);
  
  body.replaceText('{{subtotal}}', formatCurrency(subtotal));
  body.replaceText('{{vat}}', formatCurrency(vat));
  body.replaceText('{{total}}', formatCurrency(total));
  
  doc.saveAndClose();
  
  // Convert to PDF
  const pdfBlob = DriveApp.getFileById(copyDoc.getId()).getAs('application/pdf');
  pdfBlob.setName(`Quotation_${quotationNo}.pdf`);
  
  // Save to Drive
  const folder = DriveApp.getFolderById(CONFIG.DRIVE_FOLDERS.QUOTATIONS);
  const pdfFile = folder.createFile(pdfBlob);
  
  // Delete temp doc
  DriveApp.getFileById(copyDoc.getId()).setTrashed(true);
  
  // Update job
  updateJob(jobId, {
    quotation_no: quotationNo,
    quotation_pdf: pdfFile.getUrl(),
    quotation_amount: total,
    quotation_sent_at: new Date(),
    status: CONFIG.STATUS.PENDING_APPROVAL
  });
  
  Logger.log(`✅ Generated Quotation PDF: ${pdfFile.getUrl()}`);
  return pdfFile.getUrl();
}

/**
 * สร้าง Work Order PDF
 */
function generateWorkOrderPDF(jobId) {
  const job = getJob(jobId);
  if (!job) throw new Error('Job not found: ' + jobId);
  
  const items = getJobItems(jobId);
  
  // สร้างเลขที่ใบสั่งงาน
  const woNo = generateDocumentNumber('WORK_ORDER');
  
  const templateId = CONFIG.TEMPLATES.WORK_ORDER;
  
  if (!templateId || templateId.includes('YOUR_')) {
    throw new Error('Template ID ยังไม่ได้ตั้งค่า (Config.TEMPLATES.WORK_ORDER)');
  }
  
  // Copy template
  const templateDoc = DriveApp.getFileById(templateId);
  const copyDoc = templateDoc.makeCopy(`WorkOrder_${woNo}_TEMP`);
  const doc = DocumentApp.openById(copyDoc.getId());
  const body = doc.getBody();
  
  // Replace placeholders
  body.replaceText('{{wo_no}}', woNo);
  body.replaceText('{{wo_date}}', formatDateThai(new Date()));
  body.replaceText('{{job_id}}', job.job_id);
  body.replaceText('{{customer_name}}', job.customer_name || '-');
  body.replaceText('{{company}}', job.company || '-');
  body.replaceText('{{asset_desc}}', job.asset_desc || '-');
  body.replaceText('{{serial_no}}', job.serial_no || '-');
  body.replaceText('{{brand}}', job.brand || '-');
  body.replaceText('{{model}}', job.model || '-');
  body.replaceText('{{eta_finish}}', formatDateThai(job.eta_finish));
  
  // Replace repair items
  let repairList = '';
  items.forEach((item, index) => {
    repairList += `${index + 1}. ${item.title}\n`;
    repairList += `   รายละเอียด: ${item.tech_detail}\n\n`;
  });
  body.replaceText('{{repair_items}}', repairList);
  
  doc.saveAndClose();
  
  // Convert to PDF
  const pdfBlob = DriveApp.getFileById(copyDoc.getId()).getAs('application/pdf');
  pdfBlob.setName(`WorkOrder_${woNo}.pdf`);
  
  // Save to Drive
  const folder = DriveApp.getFolderById(CONFIG.DRIVE_FOLDERS.WORK_ORDERS);
  const pdfFile = folder.createFile(pdfBlob);
  
  // Delete temp doc
  DriveApp.getFileById(copyDoc.getId()).setTrashed(true);
  
  // Update job
  updateJob(jobId, {
    workorder_no: woNo,
    workorder_pdf: pdfFile.getUrl(),
    workorder_created_at: new Date()
  });
  
  Logger.log(`✅ Generated Work Order PDF: ${pdfFile.getUrl()}`);
  return pdfFile.getUrl();
}

/**
 * สร้าง Final Report PDF
 */
function generateFinalReportPDF(jobId) {
  const job = getJob(jobId);
  if (!job) throw new Error('Job not found: ' + jobId);
  
  const items = getJobItems(jobId);
  const testResult = getTestResult(jobId);
  const beforePhotos = getMediaByJob(jobId, 'before');
  const afterPhotos = getMediaByJob(jobId, 'after');
  
  // สร้างเลขที่รายงาน
  const reportNo = generateDocumentNumber('FINAL_REPORT');
  
  const templateId = CONFIG.TEMPLATES.FINAL_REPORT;
  
  if (!templateId || templateId.includes('YOUR_')) {
    throw new Error('Template ID ยังไม่ได้ตั้งค่า (Config.TEMPLATES.FINAL_REPORT)');
  }
  
  // Copy template
  const templateDoc = DriveApp.getFileById(templateId);
  const copyDoc = templateDoc.makeCopy(`FinalReport_${reportNo}_TEMP`);
  const doc = DocumentApp.openById(copyDoc.getId());
  const body = doc.getBody();
  
  // Replace placeholders
  body.replaceText('{{report_no}}', reportNo);
  body.replaceText('{{report_date}}', formatDateThai(new Date()));
  body.replaceText('{{job_id}}', job.job_id);
  body.replaceText('{{customer_name}}', job.customer_name || '-');
  body.replaceText('{{company}}', job.company || '-');
  body.replaceText('{{asset_desc}}', job.asset_desc || '-');
  body.replaceText('{{serial_no}}', job.serial_no || '-');
  
  // Repair summary
  let repairSummary = '';
  items.forEach((item, index) => {
    repairSummary += `${index + 1}. ${item.title}\n`;
  });
  body.replaceText('{{repair_summary}}', repairSummary);
  
  // Test results
  if (testResult) {
    body.replaceText('{{voltage}}', testResult.voltage_v + ' V');
    body.replaceText('{{current}}', testResult.current_a + ' A');
    body.replaceText('{{rpm}}', testResult.rpm + ' RPM');
    body.replaceText('{{ir}}', testResult.ir_mohm + ' MΩ');
    body.replaceText('{{vibration}}', testResult.vibration_mm_s + ' mm/s');
    body.replaceText('{{temperature}}', testResult.temperature_c + ' °C');
    body.replaceText('{{pass_fail}}', testResult.pass_fail);
    body.replaceText('{{test_remark}}', testResult.remark || '-');
  } else {
    body.replaceText('{{voltage}}', '-');
    body.replaceText('{{current}}', '-');
    body.replaceText('{{rpm}}', '-');
    body.replaceText('{{ir}}', '-');
    body.replaceText('{{vibration}}', '-');
    body.replaceText('{{temperature}}', '-');
    body.replaceText('{{pass_fail}}', '-');
    body.replaceText('{{test_remark}}', 'ไม่มีข้อมูลการทดสอบ');
  }
  
  // Photos URLs (QR Code หรือ Links)
  const photosUrl = beforePhotos.length > 0 ? beforePhotos[0].webapp_url : '-';
  body.replaceText('{{photos_url}}', photosUrl);
  
  doc.saveAndClose();
  
  // Convert to PDF
  const pdfBlob = DriveApp.getFileById(copyDoc.getId()).getAs('application/pdf');
  pdfBlob.setName(`FinalReport_${reportNo}.pdf`);
  
  // Save to Drive
  const folder = DriveApp.getFolderById(CONFIG.DRIVE_FOLDERS.FINAL_REPORTS);
  const pdfFile = folder.createFile(pdfBlob);
  
  // Delete temp doc
  DriveApp.getFileById(copyDoc.getId()).setTrashed(true);
  
  // Update job
  updateJob(jobId, {
    final_report_no: reportNo,
    final_report_pdf: pdfFile.getUrl(),
    final_report_sent_at: new Date(),
    status: CONFIG.STATUS.COMPLETED
  });
  
  Logger.log(`✅ Generated Final Report PDF: ${pdfFile.getUrl()}`);
  return pdfFile.getUrl();
}

/**
 * Export to Excel
 */
function exportToExcel(jobId) {
  const job = getJob(jobId);
  const items = getJobItems(jobId);
  
  // สร้าง Spreadsheet ใหม่
  const ss = SpreadsheetApp.create(`Export_${job.job_id}`);
  const sheet = ss.getActiveSheet();
  sheet.setName('Quotation');
  
  // Headers
  sheet.getRange('A1:E1').setValues([['ลำดับ', 'รายการ', 'จำนวน', 'ราคา/หน่วย', 'ยอดรวม']]);
  sheet.getRange('A1:E1').setFontWeight('bold');
  
  // Data
  items.forEach((item, index) => {
    sheet.appendRow([
      index + 1,
      item.title,
      item.qty + ' ' + item.uom,
      item.unit_price,
      item.subtotal
    ]);
  });
  
  // Format
  const lastRow = sheet.getLastRow();
  sheet.getRange(2, 4, lastRow - 1, 2).setNumberFormat('#,##0.00');
  
  // Download URL
  const file = DriveApp.getFileById(ss.getId());
  const url = file.getUrl();
  
  Logger.log(`✅ Exported to Excel: ${url}`);
  return url;
}

/**
 * สร้างเลขที่เอกสาร
 */
function generateDocumentNumber(docType) {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  
  let prefix = '';
  switch (docType) {
    case 'QUOTATION':
      prefix = CONFIG.NUMBERING.QUOTATION_PREFIX;
      break;
    case 'WORK_ORDER':
      prefix = CONFIG.NUMBERING.WORK_ORDER_PREFIX;
      break;
    case 'FINAL_REPORT':
      prefix = CONFIG.NUMBERING.FINAL_REPORT_PREFIX;
      break;
  }
  
  const yearMonth = `${year}${month}`;
  const fullPrefix = `${prefix}-${yearMonth}-`;
  
  // หาเลขที่ล่าสุด (ใช้ logic คล้ายกับ generateJobId)
  const nextNum = String(1).padStart(CONFIG.NUMBERING.DIGIT_LENGTH, '0');
  
  return `${fullPrefix}${nextNum}`;
}

/**
 * Format Date (Thai)
 */
function formatDateThai(date) {
  if (!date) return '-';
  const d = new Date(date);
  return d.toLocaleDateString('th-TH', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

/**
 * คำนวณวันที่ Valid Until (ใบเสนอราคา)
 */
function calculateValidUntilDate() {
  const validDate = new Date();
  validDate.setDate(validDate.getDate() + CONFIG.BUSINESS.QUOTATION_VALID_DAYS);
  return validDate;
}

/**
 * ทดสอบ PDF Generator
 */
function testPDFGenerator() {
  Logger.log('=== Testing PDF Generator ===');
  
  // ต้องมีงานในระบบก่อน
  const sheet = getSheet(CONFIG.SHEETS.JOBS);
  const data = sheet.getDataRange().getValues();
  
  if (data.length < 2) {
    Logger.log('❌ ไม่มีงานในระบบ กรุณาสร้างงานก่อน (Menu: Create Sample Job)');
    return;
  }
  
  const jobId = data[1][0];
  
  try {
    const quotationUrl = generateQuotationPDF(jobId);
    Logger.log('✅ Quotation PDF: ' + quotationUrl);
  } catch (error) {
    Logger.log('❌ Error: ' + error.message);
  }
}
