/**
 * PDC Smart Motor Repair - Webhook Handlers (Main Router)
 * 
 * จัดการ Events จาก LINE Webhook และ route ไปยัง Internal/External handlers
 * 
 * Architecture:
 * - Webhook.js (this file) - Main router
 * - WebhookInternal.js - Internal OA handlers (พนักงาน)
 * - WebhookExternal.js - External OA handlers (ลูกค้า)
 */

/**
 * Handle LINE Event (Main Router)
 */
function handleLineEvent(event) {
  const eventType = event.type;
  
  switch (eventType) {
    case 'message':
      handleMessageEvent(event);
      break;
    case 'postback':
      handlePostbackEvent(event);
      break;
    case 'follow':
      handleFollowEvent(event);
      break;
    case 'unfollow':
      handleUnfollowEvent(event);
      break;
    default:
      Logger.log('Unknown event type: ' + eventType);
  }
}

/**
 * Handle Message Event
 */
function handleMessageEvent(event) {
  const userId = event.source.userId;
  const messageType = event.message.type;
  const replyToken = event.replyToken;
  
  // ตรวจสอบว่าเป็น Internal หรือ External OA
  const isInternal = isInternalUser(userId);
  
  if (messageType === 'text') {
    const text = event.message.text;
    const textLower = text.toLowerCase();
    
    // ========================================
    // Internal OA Commands (พนักงาน)
    // ========================================
    if (isInternal) {
      handleInternalMessage(text, textLower, userId, replyToken);
    } 
    // ========================================
    // External OA Commands (ลูกค้า)
    // ========================================
    else {
      handleExternalMessage(text, textLower, userId, replyToken);
    }
  }
}

/**
 * Handle Internal OA Messages (พนักงาน)
 */
function handleInternalMessage(text, textLower, userId, replyToken) {
  // คำสั่งสำหรับพนักงาน
  if (text.startsWith('/')) {
    handleInternalCommand(text, userId, replyToken);
  } 
  // งานที่ assign ให้
  else if (text.includes('งานของฉัน') || textLower.includes('my tasks')) {
    handleMyTasks(userId, replyToken);
  }
  // งานที่รอดำเนินการ
  else if (text.includes('งานรอ') || textLower.includes('pending')) {
    handlePendingJobs(userId, replyToken);
  }
  // สร้างงานใหม่
  else if (text.includes('สร้างงาน') || textLower.includes('create job')) {
    const response = {
      type: 'text',
      text: '🆕 สร้างงานใหม่\n\nกรุณาเปิด LIFF App "Job Creation" จากเมนูด้านล่าง\n\nหรือพิมพ์ /help เพื่อดูคำสั่งทั้งหมด'
    };
    replyMessage(replyToken, [response], true);
  }
  // ช่วยเหลือ
  else if (text.includes('ช่วยเหลือ') || textLower.includes('help')) {
    handleInternalHelp(replyToken);
  }
  // Default
  else {
    const response = {
      type: 'text',
      text: '👋 สวัสดีครับ!\n\nพนักงาน: ' + text + '\n\nพิมพ์ /help เพื่อดูคำสั่งทั้งหมด\nหรือใช้เมนูด้านล่าง'
    };
    replyMessage(replyToken, [response], true);
  }
}

/**
 * Handle External OA Messages (ลูกค้า)
 */
function handleExternalMessage(text, textLower, userId, replyToken) {
  // คำสั่งต่างๆ (ไม่ใช้ lowercase เพื่อให้รองรับภาษาไทย)
  if (text.includes('สถานะ') || textLower.includes('status')) {
    const response = {
      type: 'text',
      text: '📊 สถานะงาน\n\nคุณสามารถดูสถานะงานได้ที่เมนูด้านล่าง หรือติดต่อเจ้าหน้าที่ได้ที่ 02-xxx-xxxx'
    };
    replyMessage(replyToken, [response], false);
  } else if (text.includes('งานของฉัน') || textLower.includes('my jobs')) {
    const response = {
      type: 'text',
      text: '🔧 งานของฉัน\n\nคุณสามารถดูรายการงานได้ที่เมนูด้านล่าง หรือกดปุ่ม "ดูสถานะงาน"'
    };
    replyMessage(replyToken, [response], false);
  } else if (text.includes('ช่วยเหลือ') || textLower.includes('help')) {
    const response = {
      type: 'text',
      text: '📖 คำสั่งที่ใช้ได้:\n\n' +
            '• "สถานะ" - ดูสถานะงานล่าสุด\n' +
            '• "งานของฉัน" - ดูงานทั้งหมด\n' +
            '• "ช่วยเหลือ" - แสดงคำสั่งนี้\n\n' +
            'หรือใช้เมนูด้านล่างได้เลย!'
    };
    replyMessage(replyToken, [response], false);
  } else {
    // Default response - ตอบทุกข้อความ
    const response = {
      type: 'text',
      text: 'สวัสดีครับ! 👋\n\nคุณพิมพ์: "' + text + '"\n\nขอบคุณที่ติดต่อ PDC Motor Repair\n\nกรุณาเลือกเมนูด้านล่าง หรือพิมพ์ "ช่วยเหลือ" เพื่อดูคำสั่งทั้งหมด'
    };
    
    try {
      replyMessage(replyToken, [response], false);
      Logger.log('✅ replyMessage completed');
    } catch (error) {
      Logger.log('❌ replyMessage error: ' + error.message);
      console.error('replyMessage error:', error);
    }
  }
}

/**
 * Handle Internal Commands (คำสั่ง / สำหรับพนักงาน)
 */
function handleInternalCommand(command, userId, replyToken) {
  const cmd = command.split(' ')[0].toLowerCase();
  const args = command.split(' ').slice(1);
  
  switch (cmd) {
    case '/help':
      handleInternalHelp(replyToken);
      break;
      
    case '/jobs':
      handleJobsList(args[0] || 'all', replyToken);
      break;
      
    case '/job':
      if (args[0]) {
        handleJobDetail(args[0], replyToken);
      } else {
        replyMessage(replyToken, [{
          type: 'text',
          text: '❌ กรุณาระบุ Job ID\n\nตัวอย่าง: /job PDC-202510-0001'
        }], true);
      }
      break;
      
    case '/pending':
      handlePendingJobs(userId, replyToken);
      break;
      
    case '/mytasks':
      handleMyTasks(userId, replyToken);
      break;
      
    case '/stats':
      handleStats(replyToken);
      break;
      
    default:
      replyMessage(replyToken, [{
        type: 'text',
        text: '❌ ไม่รู้จักคำสั่ง: ' + cmd + '\n\nพิมพ์ /help เพื่อดูคำสั่งทั้งหมด'
      }], true);
  }
}

/**
 * Internal Help Command
 */
function handleInternalHelp(replyToken) {
  const response = {
    type: 'text',
    text: '📖 คำสั่งสำหรับพนักงาน:\n\n' +
          '🔧 งาน:\n' +
          '• /jobs [all|pending|progress] - ดูรายการงาน\n' +
          '• /job [JOB_ID] - ดูรายละเอียดงาน\n' +
          '• /pending - งานรอดำเนินการ\n' +
          '• /mytasks - งานที่ assign ให้ฉัน\n\n' +
          '📊 สถิติ:\n' +
          '• /stats - ดูสถิติรวม\n\n' +
          '❓ อื่นๆ:\n' +
          '• /help - แสดงความช่วยเหลือ\n\n' +
          '💡 ใช้ Rich Menu ได้เลยครับ!'
  };
  replyMessage(replyToken, [response], true);
}

/**
 * Get Jobs List
 */
function handleJobsList(filter, replyToken) {
  const sheet = getSheet(CONFIG.SHEETS.JOBS);
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  
  let jobs = [];
  for (let i = 1; i < data.length; i++) {
    const job = arrayToObject(headers, data[i]);
    
    if (filter === 'all' || 
        (filter === 'pending' && job.status === CONFIG.STATUS.PENDING_APPROVAL) ||
        (filter === 'progress' && job.status === CONFIG.STATUS.IN_PROGRESS)) {
      jobs.push(job);
    }
  }
  
  jobs = jobs.slice(0, 10); // แสดง 10 งานแรก
  
  if (jobs.length === 0) {
    replyMessage(replyToken, [{
      type: 'text',
      text: '📋 ไม่มีงานในระบบ'
    }], true);
    return;
  }
  
  let text = `📋 รายการงาน (${filter}):\n\n`;
  jobs.forEach((job, index) => {
    text += `${index + 1}. ${job.job_id}\n`;
    text += `   ${job.customer_name}\n`;
    text += `   ${job.asset_desc}\n`;
    text += `   สถานะ: ${job.status}\n`;
    text += `   ${job.milestone}\n\n`;
  });
  
  text += `แสดง ${jobs.length} งาน`;
  
  replyMessage(replyToken, [{ type: 'text', text: text }], true);
}

/**
 * Get Job Detail
 */
function handleJobDetail(jobId, replyToken) {
  const job = getJobById(jobId);
  
  if (!job) {
    replyMessage(replyToken, [{
      type: 'text',
      text: `❌ ไม่พบงาน: ${jobId}`
    }], true);
    return;
  }
  
  const items = getJobItems(jobId);
  
  let text = `📋 ${job.job_id}\n\n`;
  text += `🏢 ${job.customer_name}\n`;
  text += `⚙️ ${job.asset_desc}\n`;
  text += `📊 ${job.status}\n`;
  text += `🔄 ${job.milestone}\n`;
  text += `💰 ฿${(job.quotation_amount || 0).toLocaleString()}\n`;
  text += `📅 ${formatDate(job.eta_finish)}\n\n`;
  
  if (items.length > 0) {
    text += `🔧 รายการซ่อม (${items.length}):\n`;
    items.forEach((item, index) => {
      text += `${index + 1}. ${item.title} - ฿${item.subtotal.toLocaleString()}\n`;
    });
  }
  
  replyMessage(replyToken, [{ type: 'text', text: text }], true);
}

/**
 * Get Pending Jobs
 */
function handlePendingJobs(userId, replyToken) {
  handleJobsList('pending', replyToken);
}

/**
 * Get My Tasks
 */
function handleMyTasks(userId, replyToken) {
  // TODO: Filter by assigned user
  handleJobsList('progress', replyToken);
}

/**
 * Get Stats
 */
function handleStats(replyToken) {
  const sheet = getSheet(CONFIG.SHEETS.JOBS);
  const data = sheet.getDataRange().getValues();
  
  let total = data.length - 1;
  let pending = 0;
  let progress = 0;
  let completed = 0;
  
  for (let i = 1; i < data.length; i++) {
    const status = data[i][9]; // status column
    if (status === CONFIG.STATUS.PENDING_APPROVAL) pending++;
    else if (status === CONFIG.STATUS.IN_PROGRESS) progress++;
    else if (status === CONFIG.STATUS.COMPLETED) completed++;
  }
  
  const text = `📊 สถิติรวม:\n\n` +
               `📋 งานทั้งหมด: ${total}\n` +
               `⏳ รออนุมัติ: ${pending}\n` +
               `🔄 กำลังดำเนินการ: ${progress}\n` +
               `✅ เสร็จสิ้น: ${completed}\n\n` +
               `อัพเดท: ${new Date().toLocaleString('th-TH')}`;
  
  replyMessage(replyToken, [{ type: 'text', text: text }], true);
}

/**
 * Check if user is internal (พนักงาน)
 */
function isInternalUser(userId) {
  // ค้นหาใน Users sheet
  const sheet = getSheet(CONFIG.SHEETS.USERS);
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const lineUserIdIndex = headers.indexOf('internal_line_user_id');
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][lineUserIdIndex] === userId) {
      return true;
    }
  }
  
  return false;
}

/**
 * Handle Postback Event (จากปุ่ม Flex Message)
 */
function handlePostbackEvent(event) {
  const userId = event.source.userId;
  const replyToken = event.replyToken;
  const data = parsePostbackData(event.postback.data);
  
  const action = data.action;
  const jobId = data.job_id;
  
  // ตรวจสอบว่าเป็น Internal หรือ External OA
  const isInternal = isInternalUser(userId);
  
  // ========================================
  // Internal OA Postback Actions (พนักงาน)
  // ========================================
  if (isInternal) {
    handleInternalPostback(action, jobId, userId, replyToken, data);
  } 
  // ========================================
  // External OA Postback Actions (ลูกค้า)
  // ========================================
  else {
    handleExternalPostback(action, jobId, userId, replyToken, data);
  }
}

/**
 * Handle Internal Postback (พนักงาน)
 */
function handleInternalPostback(action, jobId, userId, replyToken, data) {
  switch (action) {
    case 'assign_job':
      handleAssignJob(jobId, userId, replyToken);
      break;
      
    case 'start_job':
      handleStartJob(jobId, userId, replyToken);
      break;
      
    case 'complete_milestone':
      handleCompleteMilestone(jobId, data.milestone, userId, replyToken);
      break;
      
    case 'view_job':
      handleViewJobInternal(jobId, replyToken);
      break;
      
    case 'view_pdf':
      handleViewPDF(userId, jobId, data.type, replyToken, true);
      break;
      
    default:
      Logger.log('Unknown internal postback action: ' + action);
      replyMessage(replyToken, [{
        type: 'text',
        text: '❌ ไม่รู้จักคำสั่ง: ' + action
      }], true);
  }
}

/**
 * Handle External Postback (ลูกค้า)
 */
function handleExternalPostback(action, jobId, userId, replyToken, data) {
  switch (action) {
    case 'approve':
      handleApproveQuotation(userId, jobId, replyToken);
      break;
      
    case 'reject':
      handleRejectQuotation(userId, jobId, replyToken);
      break;
      
    case 'view_pdf':
      handleViewPDF(userId, jobId, data.type, replyToken, false);
      break;
      
    case 'view_photos':
      handleViewPhotos(userId, jobId, replyToken);
      break;
      
    case 'view_job':
      handleViewJobExternal(jobId, replyToken);
      break;
      
    default:
      Logger.log('Unknown external postback action: ' + action);
      replyMessage(replyToken, [{
        type: 'text',
        text: '❌ ไม่รู้จักคำสั่ง: ' + action
      }], false);
  }
}

/**
 * Handle Follow Event (เมื่อ Add Friend)
 * Route to Internal or External handler
 */
function handleFollowEvent(event) {
  const userId = event.source.userId;
  const replyToken = event.replyToken;
  
  // ตรวจสอบว่าเป็น Internal หรือ External
  const isInternal = isInternalUser(userId);
  
  if (isInternal) {
    // พนักงาน Add Friend Internal OA
    handleInternalFollowEvent(userId, replyToken);
  } else {
    // ลูกค้า Add Friend External OA
    handleExternalFollowEvent(userId, replyToken);
  }
}

/**
 * Handle Unfollow Event (เมื่อ Block)
 */
function handleUnfollowEvent(event) {
  const userId = event.source.userId;
  Logger.log(`User ${userId} unfollowed`);
  
  // อัพเดทสถานะใน Database (ถ้าต้องการ)
}

/**
 * Handle Status Command
 */
function handleStatusCommand(userId, replyToken) {
  // ค้นหางานของลูกค้าจาก line_user_id
  const jobs = getJobsByLineUserId(userId);
  
  if (jobs.length === 0) {
    const response = {
      type: 'text',
      text: 'ไม่พบงานของคุณในระบบ\nกรุณาติดต่อฝ่ายขายเพื่อสร้างงานใหม่'
    };
    replyMessage(replyToken, response, false);
    return;
  }
  
  // แสดงสถานะงานล่าสุด
  const job = jobs[0];
  const milestone = getMilestoneDisplayText(job.milestone);
  
  const response = {
    type: 'text',
    text: `📊 สถานะงาน\n\n` +
          `Job ID: ${job.job_id}\n` +
          `เครื่องจักร: ${job.asset_desc}\n` +
          `สถานะ: ${milestone}\n` +
          `กำหนดเสร็จ: ${formatDate(job.eta_finish)}`
  };
  
  replyMessage(replyToken, response, false);
}

/**
 * Handle My Jobs Command
 */
function handleMyJobsCommand(userId, replyToken) {
  const jobs = getJobsByLineUserId(userId);
  
  if (jobs.length === 0) {
    const response = {
      type: 'text',
      text: 'ไม่พบงานของคุณในระบบ'
    };
    replyMessage(replyToken, response, false);
    return;
  }
  
  let text = '📋 งานทั้งหมดของคุณ:\n\n';
  jobs.forEach((job, index) => {
    text += `${index + 1}. ${job.job_id}\n`;
    text += `   ${job.asset_desc}\n`;
    text += `   สถานะ: ${getMilestoneDisplayText(job.milestone)}\n\n`;
  });
  
  const response = {
    type: 'text',
    text: text
  };
  
  replyMessage(replyToken, response, false);
}

/**
 * Handle Help Command
 */
function handleHelpCommand(replyToken) {
  const response = {
    type: 'text',
    text: '📖 คำสั่งที่ใช้ได้:\n\n' +
          '• "สถานะ" - ดูสถานะงานล่าสุด\n' +
          '• "งานของฉัน" - ดูงานทั้งหมด\n' +
          '• "ช่วยเหลือ" - แสดงคำสั่งนี้\n\n' +
          'หรือใช้เมนูด้านล่างได้เลย!'
  };
  
  replyMessage(replyToken, response, false);
}

/**
 * Handle Approve Quotation
 */
function handleApproveQuotation(userId, jobId, replyToken) {
  // อัพเดทสถานะเป็น Approved
  const result = updateJobStatus(jobId, CONFIG.STATUS.APPROVED, 'Customer (LINE)');
  
  if (result) {
    // บันทึก Approval
    const sheet = getSheet(CONFIG.SHEETS.APPROVALS);
    sheet.appendRow([
      generateId('APPROVAL'),
      jobId,
      '', // quotation_no
      userId,
      'Customer', // approved_name
      '', // company
      '', // po_no
      'อนุมัติผ่าน LINE',
      new Date(),
      'LINE',
      replyToken
    ]);
    
    // สร้าง Work Order อัตโนมัติ
    const workOrderUrl = generateWorkOrderPDF(jobId);
    
    // แจ้งเตือนทีมงานภายใน
    notifyInternalTeam(jobId, 'quotation_approved');
    
    const response = {
      type: 'text',
      text: '✅ อนุมัติใบเสนอราคาเรียบร้อยแล้ว!\n\n' +
            'ทีมงานจะเริ่มดำเนินการทันที\n' +
            'คุณสามารถติดตามสถานะได้ตลอดเวลา'
    };
    
    replyMessage(replyToken, response, false);
  } else {
    const response = {
      type: 'text',
      text: '❌ เกิดข้อผิดพลาด ไม่สามารถอนุมัติได้\nกรุณาติดต่อเจ้าหน้าที่'
    };
    replyMessage(replyToken, response, false);
  }
}

/**
 * Handle Reject Quotation
 */
function handleRejectQuotation(userId, jobId, replyToken) {
  updateJobStatus(jobId, CONFIG.STATUS.CANCELLED, 'Customer (LINE)');
  
  logEvent(jobId, 'quotation_rejected', 'Customer', {
    line_user_id: userId
  });
  
  const response = {
    type: 'text',
    text: 'ใบเสนอราคาถูกปฏิเสธแล้ว\n' +
          'ขอบคุณที่ให้โอกาสเรา\n' +
          'หากต้องการปรับแก้ใบเสนอราคา กรุณาติดต่อฝ่ายขาย'
  };
  
  replyMessage(replyToken, response, false);
}

/**
 * Handle View PDF
 */
function handleViewPDF(userId, jobId, type, replyToken) {
  const job = getJob(jobId);
  
  let pdfUrl = '';
  let docName = '';
  
  switch (type) {
    case 'quotation':
      pdfUrl = job.quotation_pdf;
      docName = 'ใบเสนอราคา';
      break;
    case 'workorder':
      pdfUrl = job.workorder_pdf;
      docName = 'ใบสั่งงาน';
      break;
    case 'finalreport':
      pdfUrl = job.final_report_pdf;
      docName = 'รายงานสุดท้าย';
      break;
  }
  
  if (pdfUrl) {
    const response = {
      type: 'text',
      text: `📄 ${docName}\n${pdfUrl}`
    };
    replyMessage(replyToken, response, false);
  } else {
    const response = {
      type: 'text',
      text: `ไม่พบ ${docName} ในระบบ`
    };
    replyMessage(replyToken, response, false);
  }
}

/**
 * Handle View Photos
 */
function handleViewPhotos(userId, jobId, replyToken) {
  const beforePhotos = getMediaByJob(jobId, 'before');
  const afterPhotos = getMediaByJob(jobId, 'after');
  
  const messages = [];
  
  if (beforePhotos.length > 0) {
    messages.push({
      type: 'text',
      text: '📷 รูปภาพก่อนซ่อม (Before)'
    });
    
    beforePhotos.slice(0, 3).forEach(photo => {
      messages.push({
        type: 'image',
        originalContentUrl: photo.webapp_url,
        previewImageUrl: photo.thumbnail_url || photo.webapp_url
      });
    });
  }
  
  if (afterPhotos.length > 0) {
    messages.push({
      type: 'text',
      text: '📷 รูปภาพหลังซ่อม (After)'
    });
    
    afterPhotos.slice(0, 3).forEach(photo => {
      messages.push({
        type: 'image',
        originalContentUrl: photo.webapp_url,
        previewImageUrl: photo.thumbnail_url || photo.webapp_url
      });
    });
  }
  
  if (messages.length === 0) {
    messages.push({
      type: 'text',
      text: 'ยังไม่มีรูปภาพในระบบ'
    });
  }
  
  replyMessage(replyToken, messages, false);
}

/**
 * Parse Postback Data
 */
function parsePostbackData(dataString) {
  const params = {};
  dataString.split('&').forEach(param => {
    const [key, value] = param.split('=');
    params[key] = decodeURIComponent(value);
  });
  return params;
}

/**
 * Get Jobs by LINE User ID
 */
function getJobsByLineUserId(lineUserId) {
  // ค้นหา customer_id จาก line_user_id
  const customerSheet = getSheet(CONFIG.SHEETS.CUSTOMERS);
  const customerData = customerSheet.getDataRange().getValues();
  const customerHeaders = customerData[0];
  const lineUserIdIndex = customerHeaders.indexOf('line_user_id');
  const customerIdIndex = customerHeaders.indexOf('customer_id');
  
  let customerId = null;
  for (let i = 1; i < customerData.length; i++) {
    if (customerData[i][lineUserIdIndex] === lineUserId) {
      customerId = customerData[i][customerIdIndex];
      break;
    }
  }
  
  if (!customerId) return [];
  
  // ค้นหางานของลูกค้า
  const jobSheet = getSheet(CONFIG.SHEETS.JOBS);
  const jobData = jobSheet.getDataRange().getValues();
  const jobHeaders = jobData[0];
  const jobs = [];
  
  for (let i = 1; i < jobData.length; i++) {
    if (jobData[i][1] === customerId) { // customer_id column
      jobs.push(arrayToObject(jobHeaders, jobData[i]));
    }
  }
  
  return jobs;
}

/**
 * Notify Internal Team
 */
function notifyInternalTeam(jobId, eventType) {
  // TODO: ส่ง LINE notification ไปหา Planner/Sales
  Logger.log(`Notifying internal team about ${eventType} for job ${jobId}`);
}

/**
 * Format Date
 */
function formatDate(date) {
  if (!date) return '-';
  const d = new Date(date);
  return d.toLocaleDateString('th-TH', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}