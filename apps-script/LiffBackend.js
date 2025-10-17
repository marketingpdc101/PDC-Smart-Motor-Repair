/**
 * PDC Smart Motor Repair - LIFF Backend Functions
 * 
 * Backend functions สำหรับ LIFF Apps
 */

// ========================================
// POST Functions - Job Creation
// ========================================

/**
 * สร้างงานใหม่พร้อมรายการซ่อม
 * @param {object} jobData - ข้อมูลงาน
 * @return {object} Result with jobId
 */
function createJobWithItems(jobData) {
  try {
    // 1. สร้างหรือหา Customer
    let customerId = jobData.customerId;
    
    if (!customerId) {
      // สร้าง Customer ใหม่
      customerId = createCustomer({
        company: jobData.company,
        contactName: jobData.contactName,
        contactPhone: jobData.contactPhone,
        contactEmail: jobData.contactEmail || '',
        address: jobData.address || '',
        lineUserId: '', // จะอัพเดททีหลังเมื่อลูกค้า Add Friend
        customerType: 'Corporate'
      });
    }
    
    // 2. สร้าง Job
    const jobId = createJob({
      customer_id: customerId,
      customer_name: jobData.contactName,
      company: jobData.company,
      sales_owner: jobData.createdByName || 'Unknown',
      asset_desc: jobData.assetDesc,
      serial_no: jobData.serialNo || '',
      brand: jobData.brand,
      model: jobData.model || '',
      priority: jobData.priority || 'Normal',
      notes: jobData.notes || '',
      created_by: jobData.createdBy || 'System'
    });
    
    // 3. สร้าง Job Items
    let totalAmount = 0;
    if (jobData.items && jobData.items.length > 0) {
      jobData.items.forEach(item => {
        createJobItem({
          job_id: jobId,
          line_no: item.lineNo,
          title: item.title,
          tech_detail: item.techDetail || '',
          uom: item.uom || 'ชุด',
          qty: item.qty,
          unit_price: item.unitPrice,
          discount_percent: item.discountPercent || 0,
          subtotal: item.subtotal,
          is_quoted: true,
          is_approved: false
        });
        
        totalAmount += item.subtotal;
      });
    }
    
    // 4. อัพเดท Lead Time และ Quotation Amount
    const leadTimeDays = parseInt(jobData.leadTime) || CONFIG.BUSINESS.DEFAULT_LEAD_TIME_DAYS;
    const etaFinish = calculateETA(leadTimeDays);
    const quotationNo = generateQuotationNumber();
    
    updateJob(jobId, {
      eta_finish: etaFinish,
      quotation_no: quotationNo,
      quotation_amount: totalAmount,
      quotation_sent_at: new Date(),
      status: CONFIG.STATUS.PENDING_APPROVAL
    });
    
    // 5. Log Event
    logJobEvent(jobId, 'job_created', jobData.createdByName || 'System', {
      customer: jobData.company,
      items_count: jobData.items ? jobData.items.length : 0,
      total_amount: totalAmount
    });
    
    // 6. Generate Quotation PDF
    let pdfUrl = null;
    try {
      pdfUrl = generateQuotationPDF(jobId);
    } catch (error) {
      logError('generateQuotationPDF failed', { jobId: jobId, error: error.message });
    }
    
    // 7. Send notification to customer
    try {
      notifyCustomerJobCreated(jobId, pdfUrl);
      notifyInternalJobCreated(jobId);
    } catch (error) {
      logError('notification failed', { jobId: jobId, error: error.message });
    }
    
    return {
      success: true,
      jobId: jobId,
      quotationNo: quotationNo,
      totalAmount: totalAmount,
      pdfUrl: pdfUrl,
      message: 'สร้างงานสำเร็จ'
    };
    
  } catch (error) {
    Logger.log('Error in createJobWithItems: ' + error.toString());
    return {
      success: false,
      error: error.toString()
    };
  }
}

/**
 * สร้าง Customer ใหม่
 */
function createCustomer(customerData) {
  const sheet = getSheet(CONFIG.SHEETS.CUSTOMERS);
  const customerId = 'CUST-' + Date.now();
  const timestamp = new Date();
  
  const row = [
    customerId,
    customerData.company || '',
    customerData.contactName || '',
    customerData.contactEmail || '',
    customerData.contactPhone || '',
    customerData.lineUserId || '',
    customerData.lineDisplayName || '',
    customerData.address || '',
    customerData.taxId || '',
    customerData.customerType || 'Corporate',
    30, // credit_term_days
    0,  // credit_limit
    true, // is_active
    '', // tags
    timestamp,
    timestamp
  ];
  
  sheet.appendRow(row);
  return customerId;
}

/**
 * สร้างเลขที่ใบเสนอราคา
 */
function generateQuotationNumber() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const prefix = `${CONFIG.NUMBERING.QUOTATION_PREFIX}-${year}${month}-`;
  
  const sheet = getSheet(CONFIG.SHEETS.JOBS);
  const data = sheet.getDataRange().getValues();
  let maxNum = 0;
  
  const quotationNoCol = data[0].indexOf('quotation_no');
  
  for (let i = 1; i < data.length; i++) {
    const quotationNo = data[i][quotationNoCol];
    if (quotationNo && quotationNo.startsWith(prefix)) {
      const parts = quotationNo.split('-');
      if (parts.length >= 3) {
        const num = parseInt(parts[2]);
        if (num > maxNum) maxNum = num;
      }
    }
  }
  
  const nextNum = String(maxNum + 1).padStart(CONFIG.NUMBERING.DIGIT_LENGTH, '0');
  return `${prefix}${nextNum}`;
}

// ========================================
// GET Functions (สำหรับดึงข้อมูล)
// ========================================

/**
 * ดึงข้อมูลใบเสนอราคา
 * @param {string} jobId - Job ID
 * @return {object} Quotation data
 */
function getQuotation(jobId) {
  try {
    const job = getJobById(jobId);
    
    if (!job) {
      return { error: 'Job not found' };
    }
    
    // ดึงรายการซ่อม
    const items = getJobItems(jobId);
    
    // คำนวณราคา
    const subtotal = items.reduce((sum, item) => sum + (item.subtotal || 0), 0);
    const vat = subtotal * (CONFIG.BUSINESS.VAT_PERCENTAGE / 100);
    const total = subtotal + vat;
    
    return {
      jobId: job.job_id,
      jobNumber: job.job_number,
      customerName: job.customer_name,
      customerCompany: job.company,
      createdDate: job.created_at,
      leadTime: job.lead_time,
      status: job.status,
      items: items.map(item => ({
        name: item.title,
        description: item.tech_detail,
        quantity: item.qty,
        unitPrice: item.unit_price,
        price: item.subtotal,
        photos: item.photo_urls ? item.photo_urls.split(',') : []
      })),
      subtotal: subtotal,
      vat: vat,
      total: total,
      notes: job.notes
    };
    
  } catch (error) {
    logError('getQuotation error', { jobId: jobId, error: error.message });
    return { error: error.message };
  }
}

/**
 * ดึงข้อมูลงานแบบละเอียด
 * @param {string} jobId - Job ID
 * @return {object} Job details
 */
function getJobDetails(jobId) {
  try {
    const job = getJobById(jobId);
    
    if (!job) {
      return { error: 'Job not found' };
    }
    
    const items = getJobItems(jobId);
    const events = getJobEvents(jobId);
    
    return {
      jobId: job.job_id,
      jobNumber: job.job_number,
      customerName: job.customer_name,
      customerPhone: job.customer_phone,
      customerCompany: job.company,
      assetDesc: job.asset_desc,
      serialNo: job.serial_no,
      brand: job.brand,
      model: job.model,
      status: job.status,
      currentMilestone: job.current_milestone,
      currentMilestoneIndex: getMilestoneIndex(job.current_milestone),
      createdDate: job.created_at,
      updatedDate: job.updated_at,
      etaFinish: job.eta_finish,
      leadTime: job.lead_time,
      items: items,
      events: events,
      milestones: getAllMilestones(jobId)
    };
    
  } catch (error) {
    logError('getJobDetails error', { jobId: jobId, error: error.message });
    return { error: error.message };
  }
}

/**
 * ดึงรายการงานของลูกค้า
 * @param {string} customerId - Customer LINE User ID หรือ Phone
 * @return {array} List of jobs
 */
function getJobsByCustomer(customerId) {
  try {
    const sheet = getSheet(CONFIG.SHEETS.JOBS);
    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    
    const jobs = [];
    
    for (let i = 1; i < data.length; i++) {
      const job = arrayToObject(headers, data[i]);
      
      // ค้นหาด้วย LINE User ID หรือ Phone
      if (job.customer_line_id === customerId || job.customer_phone === customerId) {
        jobs.push({
          jobId: job.job_id,
          jobNumber: job.job_number,
          status: job.status,
          currentMilestone: job.current_milestone,
          createdDate: job.created_at,
          etaFinish: job.eta_finish,
          assetDesc: job.asset_desc
        });
      }
    }
    
    return jobs;
    
  } catch (error) {
    logError('getJobsByCustomer error', { customerId: customerId, error: error.message });
    return { error: error.message };
  }
}

/**
 * ดึง Milestones ทั้งหมดของงาน
 * @param {string} jobId - Job ID
 * @return {object} Milestones data
 */
function getMilestones(jobId) {
  try {
    const job = getJobById(jobId);
    
    if (!job) {
      return { error: 'Job not found' };
    }
    
    const milestones = {};
    const currentIndex = getMilestoneIndex(job.current_milestone);
    
    CONFIG.MILESTONES.forEach((milestone, index) => {
      const fieldName = 'milestone_' + milestone.toLowerCase();
      milestones[milestone] = {
        name: milestone,
        completed: index < currentIndex,
        current: index === currentIndex,
        completedDate: job[fieldName] || null
      };
    });
    
    return milestones;
    
  } catch (error) {
    logError('getMilestones error', { jobId: jobId, error: error.message });
    return { error: error.message };
  }
}

/**
 * ดึง Milestones ทั้งหมดพร้อม progress
 */
function getAllMilestones(jobId) {
  const job = getJobById(jobId);
  const currentIndex = getMilestoneIndex(job.current_milestone);
  
  return CONFIG.MILESTONES.map((milestone, index) => {
    const fieldName = 'milestone_' + milestone.toLowerCase();
    return {
      name: milestone,
      nameTh: getMilestoneThai(milestone),
      completed: index < currentIndex,
      current: index === currentIndex,
      completedDate: job[fieldName] || null,
      index: index
    };
  });
}

/**
 * Get milestone index
 */
function getMilestoneIndex(milestone) {
  return CONFIG.MILESTONES.indexOf(milestone);
}

/**
 * Get milestone Thai name
 */
function getMilestoneThai(milestone) {
  const thaiNames = {
    'Received': 'รับงาน',
    'Inspection': 'ตรวจสอบ',
    'Disassembly': 'ถอดแยกชิ้นส่วน',
    'Burnout': 'เผาขดลวด',
    'Core': 'ทำ Core',
    'Rewinding': 'พันขดลวดใหม่',
    'Varnish': 'เคลือบ Varnish',
    'Assembly': 'ประกอบ',
    'Balancing': 'ถ่วงแบลานซ์',
    'Painting': 'พ่นสี',
    'QC': 'ตรวจสอบคุณภาพ',
    'Final_Test': 'ทดสอบไฟฟ้า',
    'Packing': 'บรรจุหีบห่อ',
    'Delivery': 'ส่งมอบ'
  };
  return thaiNames[milestone] || milestone;
}

// ========================================
// POST Functions (สำหรับบันทึกข้อมูล)
// ========================================

/**
 * อนุมัติใบเสนอราคา
 * @param {string} jobId - Job ID
 * @param {string} userId - LINE User ID ของผู้อนุมัติ
 * @param {string} note - หมายเหตุ
 * @return {object} Result
 */
function approveQuotation(jobId, userId, note) {
  try {
    const job = getJobById(jobId);
    
    if (!job) {
      return { success: false, error: 'Job not found' };
    }
    
    if (job.status !== CONFIG.STATUS.PENDING_APPROVAL) {
      return { success: false, error: 'Job is not pending approval' };
    }
    
    // บันทึกการอนุมัติ
    const approvalId = saveApproval({
      job_id: jobId,
      approved_by: userId,
      approved_at: new Date(),
      decision: 'Approved',
      note: note || ''
    });
    
    // อัพเดทสถานะงาน
    updateJobStatus(jobId, CONFIG.STATUS.APPROVED, userId);
    
    // บันทึก Event
    logJobEvent(jobId, 'quotation_approved', {
      approved_by: userId,
      note: note,
      approval_id: approvalId
    });
    
    // แจ้งเตือน Internal Team ว่าลูกค้าอนุมัติแล้ว
    try {
      notifyInternalQuotationApproved(jobId, userId);
    } catch (error) {
      logError('notification failed', { jobId: jobId, error: error.message });
    }
    
    logInfo('Quotation approved', { jobId: jobId, userId: userId });
    
    return { 
      success: true, 
      message: 'Quotation approved successfully',
      approvalId: approvalId
    };
    
  } catch (error) {
    logError('approveQuotation error', { jobId: jobId, error: error.message });
    return { success: false, error: error.message };
  }
}

/**
 * ไม่อนุมัติใบเสนอราคา
 * @param {string} jobId - Job ID
 * @param {string} userId - LINE User ID
 * @param {string} note - เหตุผล (จำเป็น)
 * @return {object} Result
 */
function rejectQuotation(jobId, userId, note) {
  try {
    if (!note || note.trim() === '') {
      return { success: false, error: 'Note is required for rejection' };
    }
    
    const job = getJobById(jobId);
    
    if (!job) {
      return { success: false, error: 'Job not found' };
    }
    
    // บันทึกการไม่อนุมัติ
    const approvalId = saveApproval({
      job_id: jobId,
      approved_by: userId,
      approved_at: new Date(),
      decision: 'Rejected',
      note: note
    });
    
    // อัพเดทสถานะงาน
    updateJobStatus(jobId, CONFIG.STATUS.DRAFT, userId);
    
    // บันทึก Event
    logJobEvent(jobId, 'quotation_rejected', {
      rejected_by: userId,
      note: note,
      approval_id: approvalId
    });
    
    // แจ้งเตือนทีมภายใน และลูกค้า
    try {
      notifyInternalQuotationRejected(jobId, note);
      notifyCustomerQuotationRejected(jobId, note);
    } catch (error) {
      logError('notification failed', { jobId: jobId, error: error.message });
    }
    
    logInfo('Quotation rejected', { jobId: jobId, userId: userId });
    
    return { 
      success: true, 
      message: 'Quotation rejected',
      approvalId: approvalId
    };
    
  } catch (error) {
    logError('rejectQuotation error', { jobId: jobId, error: error.message });
    return { success: false, error: error.message };
  }
}

/**
 * อัพเดท Milestone ของงาน
 * @param {string} jobId - Job ID
 * @param {string} milestone - Milestone name
 * @param {string} note - หมายเหตุ
 * @param {array} photos - Array of photo URLs
 * @param {string} userId - LINE User ID
 * @return {object} Result
 */
function updateJobMilestone(jobId, milestone, note, photos, userId) {
  try {
    const job = getJobById(jobId);
    
    if (!job) {
      return { success: false, error: 'Job not found' };
    }
    
    if (!CONFIG.MILESTONES.includes(milestone)) {
      return { success: false, error: 'Invalid milestone' };
    }
    
    // อัพเดท milestone
    const sheet = getSheet(CONFIG.SHEETS.JOBS);
    const jobRow = findRowByValue(sheet, 'job_id', jobId);
    
    if (!jobRow) {
      return { success: false, error: 'Job not found in sheet' };
    }
    
    const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    const milestoneCol = headers.indexOf('current_milestone') + 1;
    const milestoneField = 'milestone_' + milestone.toLowerCase();
    const milestoneDateCol = headers.indexOf(milestoneField) + 1;
    const updatedAtCol = headers.indexOf('updated_at') + 1;
    
    const now = new Date();
    
    // อัพเดทข้อมูล
    sheet.getRange(jobRow, milestoneCol).setValue(milestone);
    
    if (milestoneDateCol > 0) {
      sheet.getRange(jobRow, milestoneDateCol).setValue(now);
    }
    
    if (updatedAtCol > 0) {
      sheet.getRange(jobRow, updatedAtCol).setValue(now);
    }
    
    // บันทึก Event
    const eventId = logJobEvent(jobId, 'milestone_updated', {
      milestone: milestone,
      note: note,
      photos: photos,
      updated_by: userId
    });
    
    // บันทึกรูปภาพ (ถ้ามี)
    if (photos && photos.length > 0) {
      photos.forEach(photoUrl => {
        saveMedia({
          job_id: jobId,
          event_id: eventId,
          media_type: 'photo',
          media_url: photoUrl,
          milestone: milestone,
          uploaded_by: userId
        });
      });
    }
    
    // แจ้งเตือนลูกค้า
    try {
      notifyCustomerStatusUpdate(jobId, milestone, note, photos);
    } catch (error) {
      logError('notification failed', { jobId: jobId, error: error.message });
    }
    
    logInfo('Milestone updated', { jobId: jobId, milestone: milestone, userId: userId });
    
    return { 
      success: true, 
      message: 'Status updated successfully',
      eventId: eventId
    };
    
  } catch (error) {
    logError('updateJobMilestone error', { jobId: jobId, milestone: milestone, error: error.message });
    return { success: false, error: error.message };
  }
}

/**
 * บันทึกผลทดสอบไฟฟ้า
 * @param {object} testData - ข้อมูลผลทดสอบ
 * @return {object} Result
 */
function submitFinalTest(testData) {
  try {
    const jobId = testData.jobId;
    const job = getJobById(jobId);
    
    if (!job) {
      return { success: false, error: 'Job not found' };
    }
    
    // บันทึกผลทดสอบ
    const testId = saveTestResult({
      job_id: jobId,
      voltage: parseFloat(testData.voltage) || 0,
      current: parseFloat(testData.current) || 0,
      power: parseFloat(testData.power) || 0,
      rpm: parseInt(testData.rpm) || 0,
      insulation_resistance: parseFloat(testData.insulation) || 0,
      temperature: parseFloat(testData.temperature) || 0,
      noise_level: parseFloat(testData.noise) || 0,
      vibration: parseFloat(testData.vibration) || 0,
      test_result: testData.result,
      notes: testData.notes || '',
      tester_name: testData.testerName || '',
      tested_by: testData.userId,
      tested_at: new Date()
    });
    
    // อัพเดท milestone เป็น Final_Test
    updateJobMilestone(jobId, 'Final_Test', 'ทดสอบไฟฟ้าเรียบร้อย', [], testData.userId);
    
    // บันทึก Event
    logJobEvent(jobId, 'final_test_completed', {
      test_id: testId,
      result: testData.result,
      tested_by: testData.userId
    });
    
    // แจ้งเตือน (ถ้า fail)
    if (testData.result === 'Fail') {
      notifyInternalTestFailed(jobId, testData.notes);
    }
    
    logInfo('Final test submitted', { jobId: jobId, testId: testId, result: testData.result });
    
    return { 
      success: true, 
      message: 'Test result saved successfully',
      testId: testId
    };
    
  } catch (error) {
    logError('submitFinalTest error', { jobId: testData.jobId, error: error.message });
    return { success: false, error: error.message };
  }
}

/**
 * บันทึกรายงานสุดท้าย
 * @param {object} reportData - ข้อมูลรายงาน
 * @return {object} Result
 */
function submitFinalReport(reportData) {
  try {
    const jobId = reportData.jobId;
    const job = getJobById(jobId);
    
    if (!job) {
      return { success: false, error: 'Job not found' };
    }
    
    // บันทึกข้อมูลรายงาน
    const sheet = getSheet(CONFIG.SHEETS.JOBS);
    const jobRow = findRowByValue(sheet, 'job_id', jobId);
    const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    
    const workSummaryCol = headers.indexOf('work_summary') + 1;
    const recommendationsCol = headers.indexOf('recommendations') + 1;
    const warrantyCol = headers.indexOf('warranty') + 1;
    const deliveryDateCol = headers.indexOf('delivery_date') + 1;
    const deliveryMethodCol = headers.indexOf('delivery_method') + 1;
    const updatedAtCol = headers.indexOf('updated_at') + 1;
    
    if (workSummaryCol > 0) sheet.getRange(jobRow, workSummaryCol).setValue(reportData.workSummary);
    if (recommendationsCol > 0) sheet.getRange(jobRow, recommendationsCol).setValue(reportData.recommendations);
    if (warrantyCol > 0) sheet.getRange(jobRow, warrantyCol).setValue(reportData.warranty);
    if (deliveryDateCol > 0) sheet.getRange(jobRow, deliveryDateCol).setValue(new Date(reportData.deliveryDate));
    if (deliveryMethodCol > 0) sheet.getRange(jobRow, deliveryMethodCol).setValue(reportData.deliveryMethod);
    if (updatedAtCol > 0) sheet.getRange(jobRow, updatedAtCol).setValue(new Date());
    
    // อัพเดทสถานะเป็น Completed
    updateJobStatus(jobId, CONFIG.STATUS.COMPLETED, reportData.userId);
    
    // อัพเดท milestone เป็น Packing
    updateJobMilestone(jobId, 'Packing', 'พร้อมส่งมอบ', [], reportData.userId);
    
    // บันทึก Event
    logJobEvent(jobId, 'final_report_submitted', {
      work_summary: reportData.workSummary,
      delivery_date: reportData.deliveryDate,
      submitted_by: reportData.userId
    });
    
    // สร้าง PDF รายงานสุดท้าย
    const pdfUrl = generateFinalReportPDF(jobId);
    
    // แจ้งเตือนลูกค้าว่างานเสร็จแล้ว พร้อมส่งมอบ
    notifyCustomerJobCompleted(jobId, pdfUrl);
    
    logInfo('Final report submitted', { jobId: jobId, pdfUrl: pdfUrl });
    
    return { 
      success: true, 
      message: 'Final report saved successfully',
      pdfUrl: pdfUrl
    };
    
  } catch (error) {
    logError('submitFinalReport error', { jobId: reportData.jobId, error: error.message });
    return { success: false, error: error.message };
  }
}

// ========================================
// Helper Functions
// ========================================

/**
 * บันทึกการอนุมัติ/ไม่อนุมัติ
 */
function saveApproval(approvalData) {
  const sheet = getSheet(CONFIG.SHEETS.APPROVALS);
  const approvalId = generateId('APV');
  
  const row = [
    approvalId,
    approvalData.job_id,
    approvalData.approved_by,
    approvalData.approved_at,
    approvalData.decision,
    approvalData.note
  ];
  
  sheet.appendRow(row);
  
  return approvalId;
}

/**
 * บันทึกผลทดสอบ
 */
function saveTestResult(testData) {
  const sheet = getSheet(CONFIG.SHEETS.TEST_RESULTS);
  const testId = generateId('TEST');
  
  const row = [
    testId,
    testData.job_id,
    testData.voltage,
    testData.current,
    testData.power,
    testData.rpm,
    testData.insulation_resistance,
    testData.temperature,
    testData.noise_level,
    testData.vibration,
    testData.test_result,
    testData.notes,
    testData.tester_name,
    testData.tested_by,
    testData.tested_at
  ];
  
  sheet.appendRow(row);
  
  return testId;
}

/**
 * ดึงรายการงานทั้งหมด
 * @param {string} statusFilter - Filter by status (optional)
 * @param {number} limit - จำนวนที่ต้องการดึง (default: 50)
 * @return {array} Jobs list
 */
function getAllJobs(statusFilter, limit) {
  try {
    const sheet = getSheet(CONFIG.SHEETS.JOBS);
    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    
    const jobs = [];
    const maxRows = limit ? Math.min(data.length, parseInt(limit) + 1) : data.length;
    
    for (let i = 1; i < maxRows; i++) {
      const job = arrayToObject(headers, data[i]);
      
      // Filter by status if provided
      if (!statusFilter || job.status === statusFilter) {
        jobs.push({
          jobId: job.job_id,
          quotationNo: job.quotation_no,
          customerName: job.customer_name,
          company: job.company,
          assetDesc: job.asset_desc,
          brand: job.brand,
          model: job.model,
          status: job.status,
          milestone: job.milestone,
          priority: job.priority,
          quotationAmount: job.quotation_amount,
          etaStart: job.eta_start,
          etaFinish: job.eta_finish,
          createdAt: job.created_at,
          updatedAt: job.updated_at
        });
      }
    }
    
    // เรียงตามวันที่สร้างล่าสุด
    jobs.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    return {
      success: true,
      jobs: jobs,
      count: jobs.length
    };
    
  } catch (error) {
    Logger.log('Error in getAllJobs: ' + error.toString());
    return {
      success: false,
      error: error.toString()
    };
  }
}

/**
 * บันทึก Media (รูปภาพ/วิดีโอ)
 */
function saveMedia(mediaData) {
  const sheet = getSheet(CONFIG.SHEETS.MEDIA);
  const mediaId = generateId('MED');
  
  const row = [
    mediaId,
    mediaData.job_id,
    mediaData.event_id || '',
    mediaData.media_type,
    mediaData.media_url,
    mediaData.milestone || '',
    mediaData.uploaded_by,
    new Date()
  ];
  
  sheet.appendRow(row);
  
  return mediaId;
}

// ========================================
// Notification Functions
// ========================================

/**
 * แจ้งเตือนลูกค้าว่าใบเสนอราคาได้รับการอนุมัติ
 */
function notifyCustomerQuotationApproved(jobId) {
  try {
    const job = getJobById(jobId);
    
    if (!job || !job.customer_line_id) {
      return;
    }
    
    const message = {
      type: 'text',
      text: `✅ ใบเสนอราคาได้รับการอนุมัติแล้ว\n\n` +
            `เลขที่งาน: ${job.job_number}\n` +
            `เราจะเริ่มดำเนินการซ่อมทันที\n` +
            `ระยะเวลา: ${job.lead_time} วัน`
    };
    
    pushMessage(job.customer_line_id, [message], false);
    
  } catch (error) {
    logError('notifyCustomerQuotationApproved error', { jobId: jobId, error: error.message });
  }
}

/**
 * แจ้งเตือนทีมภายในว่าใบเสนอราคาถูกปฏิเสธ
 */
function notifyInternalQuotationRejected(jobId, reason) {
  try {
    const job = getJobById(jobId);
    
    const message = {
      type: 'text',
      text: `❌ ใบเสนอราคาถูกปฏิเสธ\n\n` +
            `เลขที่งาน: ${job.job_number}\n` +
            `เหตุผล: ${reason}\n\n` +
            `กรุณาปรับปรุงและส่งใหม่`
    };
    
    // ส่งไปหาทีม Sales/Manager
    notifyInternalTeam(message, ['sales', 'manager']);
    
  } catch (error) {
    logError('notifyInternalQuotationRejected error', { jobId: jobId, error: error.message });
  }
}

/**
 * แจ้งเตือนลูกค้าเมื่อมีการอัพเดทสถานะ
 */
function notifyCustomerStatusUpdate(jobId, milestone) {
  try {
    const job = getJobById(jobId);
    
    if (!job || !job.customer_line_id) {
      return;
    }
    
    const milestoneThai = getMilestoneThai(milestone);
    
    const message = {
      type: 'text',
      text: `📊 อัพเดทสถานะงาน\n\n` +
            `เลขที่งาน: ${job.job_number}\n` +
            `ขั้นตอน: ${milestoneThai}\n\n` +
            `กำลังดำเนินการซ่อม...`
    };
    
    pushMessage(job.customer_line_id, [message], false);
    
  } catch (error) {
    logError('notifyCustomerStatusUpdate error', { jobId: jobId, error: error.message });
  }
}

/**
 * แจ้งเตือนทีมภายในเมื่อทดสอบไม่ผ่าน
 */
function notifyInternalTestFailed(jobId, reason) {
  try {
    const job = getJobById(jobId);
    
    const message = {
      type: 'text',
      text: `⚠️ ทดสอบไฟฟ้าไม่ผ่าน!\n\n` +
            `เลขที่งาน: ${job.job_number}\n` +
            `หมายเหตุ: ${reason}\n\n` +
            `กรุณาตรวจสอบและแก้ไข`
    };
    
    notifyInternalTeam(message, ['electrical', 'qc', 'manager']);
    
  } catch (error) {
    logError('notifyInternalTestFailed error', { jobId: jobId, error: error.message });
  }
}

/**
 * แจ้งเตือนลูกค้าว่างานเสร็จแล้ว
 */
function notifyCustomerJobCompleted(jobId, pdfUrl) {
  try {
    const job = getJobById(jobId);
    
    if (!job || !job.customer_line_id) {
      return;
    }
    
    const message = {
      type: 'text',
      text: `🎉 งานซ่อมเสร็จเรียบร้อยแล้ว!\n\n` +
            `เลขที่งาน: ${job.job_number}\n` +
            `พร้อมส่งมอบวันที่: ${job.delivery_date}\n\n` +
            `รายงานสุดท้าย: ${pdfUrl}`
    };
    
    pushMessage(job.customer_line_id, [message], false);
    
  } catch (error) {
    logError('notifyCustomerJobCompleted error', { jobId: jobId, error: error.message });
  }
}

/**
 * แจ้งเตือนทีมภายใน
 */
function notifyInternalTeam(message, roles) {
  try {
    const userSheet = getSheet(CONFIG.SHEETS.USERS);
    const userData = userSheet.getDataRange().getValues();
    const headers = userData[0];
    
    const roleCol = headers.indexOf('role');
    const lineUserIdCol = headers.indexOf('line_user_id');
    
    for (let i = 1; i < userData.length; i++) {
      const userRole = userData[i][roleCol].toLowerCase();
      const lineUserId = userData[i][lineUserIdCol];
      
      if (roles.includes(userRole) && lineUserId) {
        pushMessage(lineUserId, [message], true); // ใช้ Internal OA
      }
    }
    
  } catch (error) {
    logError('notifyInternalTeam error', { error: error.message });
  }
}
