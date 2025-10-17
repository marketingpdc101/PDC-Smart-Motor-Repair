/**
 * PDC Smart Motor Repair - Webhook Handlers
 * 
 * จัดการ Events จาก LINE Webhook
 */

/**
 * Handle LINE Event
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
  
  if (messageType === 'text') {
    const text = event.message.text;
    const textLower = text.toLowerCase();
    
    // คำสั่งต่างๆ (ไม่ใช้ lowercase เพื่อให้รองรับภาษาไทย)
    if (text.includes('สถานะ') || textLower.includes('status')) {
      const response = {
        type: 'text',
        text: '📊 สถานะงาน\n\nคุณสามารถดูสถานะงานได้ที่เมนูด้านล่าง หรือติดต่อเจ้าหน้าที่ได้ที่ 02-xxx-xxxx'
      };
      replyMessage(replyToken, [response], false); // false = ใช้ External OA
    } else if (text.includes('งานของฉัน') || textLower.includes('my jobs')) {
      const response = {
        type: 'text',
        text: '🔧 งานของฉัน\n\nคุณสามารถดูรายการงานได้ที่เมนูด้านล่าง หรือกดปุ่ม "ดูสถานะงาน"'
      };
      replyMessage(replyToken, [response], false); // false = ใช้ External OA
    } else if (text.includes('ช่วยเหลือ') || textLower.includes('help')) {
      const response = {
        type: 'text',
        text: '📖 คำสั่งที่ใช้ได้:\n\n' +
              '• "สถานะ" - ดูสถานะงานล่าสุด\n' +
              '• "งานของฉัน" - ดูงานทั้งหมด\n' +
              '• "ช่วยเหลือ" - แสดงคำสั่งนี้\n\n' +
              'หรือใช้เมนูด้านล่างได้เลย!'
      };
      replyMessage(replyToken, [response], false); // false = ใช้ External OA
    } else {
      // Default response - ตอบทุกข้อความ
      const response = {
        type: 'text',
        text: 'สวัสดีครับ! 👋\n\nคุณพิมพ์: "' + text + '"\n\nขอบคุณที่ติดต่อ PDC Motor Repair\n\nกรุณาเลือกเมนูด้านล่าง หรือพิมพ์ "ช่วยเหลือ" เพื่อดูคำสั่งทั้งหมด'
      };
      
      try {
        replyMessage(replyToken, [response], false); // false = ใช้ External OA
        Logger.log('✅ replyMessage completed');
      } catch (error) {
        Logger.log('❌ replyMessage error: ' + error.message);
        console.error('replyMessage error:', error);
      }
    }
  }
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
  
  switch (action) {
    case 'approve':
      handleApproveQuotation(userId, jobId, replyToken);
      break;
    case 'reject':
      handleRejectQuotation(userId, jobId, replyToken);
      break;
    case 'view_pdf':
      handleViewPDF(userId, jobId, data.type, replyToken);
      break;
    case 'view_photos':
      handleViewPhotos(userId, jobId, replyToken);
      break;
    default:
      Logger.log('Unknown postback action: ' + action);
  }
}

/**
 * Handle Follow Event (เมื่อ Add Friend)
 */
function handleFollowEvent(event) {
  const userId = event.source.userId;
  
  logInfo('👋 New follower!', { userId: userId });
  
  const welcomeMessage = {
    type: 'text',
    text: '🎉 ยินดีต้อนรับสู่ PDC Smart Motor Repair!\n\n' +
          'เราพร้อมให้บริการซ่อมมอเตอร์คุณภาพสูง\n' +
          'คุณสามารถติดตามสถานะงานซ่อมได้ตลอดเวลา\n\n' +
          'พิมพ์ "ช่วยเหลือ" เพื่อดูคำสั่งทั้งหมด'
  };
  
  try {
    pushMessage(userId, [welcomeMessage], false);
    logInfo('✅ Welcome message sent', { userId: userId });
  } catch (error) {
    logError('❌ Failed to send welcome message', { 
      userId: userId, 
      error: error.message 
    });
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