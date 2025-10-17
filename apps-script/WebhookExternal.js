/**
 * PDC Smart Motor Repair - External OA Webhook Handler
 * 
 * จัดการ Events จาก External LINE OA (สำหรับลูกค้า)
 */

/**
 * Handle External Message Event
 */
function handleExternalMessage(text, textLower, userId, replyToken) {
  // คำสั่งต่างๆ (ไม่ใช้ lowercase เพื่อให้รองรับภาษาไทย)
  if (text.includes('สถานะ') || textLower.includes('status')) {
    handleStatusCommand(userId, replyToken);
  } else if (text.includes('งานของฉัน') || textLower.includes('my jobs')) {
    handleMyJobsCommand(userId, replyToken);
  } else if (text.includes('ใบเสนอราคา') || textLower.includes('quotation')) {
    handleQuotationCommand(userId, replyToken);
  } else if (text.includes('ช่วยเหลือ') || textLower.includes('help')) {
    handleExternalHelp(replyToken);
  } else {
    // Default response - ตอบทุกข้อความ
    const response = {
      type: 'text',
      text: 'สวัสดีครับ! 👋\n\n' +
            'ขอบคุณที่ติดต่อ PDC Motor Repair\n\n' +
            '📖 พิมพ์ "ช่วยเหลือ" เพื่อดูคำสั่งทั้งหมด\n' +
            'หรือใช้เมนูด้านล่างได้เลยครับ'
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
 * External Help Command
 */
function handleExternalHelp(replyToken) {
  const response = {
    type: 'text',
    text: '📖 คำสั่งที่ใช้ได้:\n\n' +
          '• "สถานะ" - ดูสถานะงานล่าสุด\n' +
          '• "งานของฉัน" - ดูงานทั้งหมด\n' +
          '• "ใบเสนอราคา" - ดูใบเสนอราคาล่าสุด\n' +
          '• "ช่วยเหลือ" - แสดงคำสั่งนี้\n\n' +
          'หรือใช้เมนูด้านล่างได้เลย!'
  };
  
  replyMessage(replyToken, [response], false);
}

/**
 * Handle Status Command (ลูกค้า)
 */
function handleStatusCommand(userId, replyToken) {
  try {
    // ค้นหางานของลูกค้าจาก line_user_id
    const jobs = getJobsByLineUserId(userId);
    
    if (jobs.length === 0) {
      const response = {
        type: 'text',
        text: '🔍 ไม่พบงานของคุณในระบบ\n\n' +
              'กรุณาติดต่อฝ่ายขายเพื่อสร้างงานใหม่\n' +
              '📞 โทร: 02-xxx-xxxx'
      };
      replyMessage(replyToken, [response], false);
      return;
    }
    
    // แสดงสถานะงานล่าสุด
    const job = jobs[0]; // งานล่าสุด
    const milestone = getMilestoneDisplayText(job.milestone);
    
    const response = {
      type: 'text',
      text: `📊 สถานะงาน\n\n` +
            `📋 ${job.job_id}\n` +
            `⚙️ ${job.asset_desc}\n` +
            `🏭 ${job.brand} ${job.model || ''}\n` +
            `📍 ${milestone}\n` +
            `📅 กำหนดเสร็จ: ${formatDate(job.eta_finish)}\n\n` +
            `💡 กดเมนู "ดูสถานะงาน" เพื่อดูรายละเอียด`
    };
    
    replyMessage(replyToken, [response], false);
  } catch (error) {
    logError('handleStatusCommand error', { userId: userId, error: error.message });
    replyMessage(replyToken, [{
      type: 'text',
      text: '❌ เกิดข้อผิดพลาด\nกรุณาลองใหม่อีกครั้ง'
    }], false);
  }
}

/**
 * Handle My Jobs Command (ลูกค้า)
 */
function handleMyJobsCommand(userId, replyToken) {
  try {
    const jobs = getJobsByLineUserId(userId);
    
    if (jobs.length === 0) {
      const response = {
        type: 'text',
        text: '🔍 ไม่พบงานของคุณในระบบ\n\n' +
              'กรุณาติดต่อฝ่ายขายเพื่อสร้างงานใหม่\n' +
              '📞 โทร: 02-xxx-xxxx'
      };
      replyMessage(replyToken, [response], false);
      return;
    }
    
    let text = `📋 งานทั้งหมดของคุณ (${jobs.length}):\n\n`;
    jobs.forEach((job, index) => {
      text += `${index + 1}. ${job.job_id}\n`;
      text += `   ⚙️ ${job.asset_desc}\n`;
      text += `   📍 ${getMilestoneDisplayText(job.milestone)}\n`;
      text += `   📅 ${formatDate(job.eta_finish)}\n\n`;
    });
    
    text += `💡 กดเมนู "ดูสถานะงาน" เพื่อดูรายละเอียด`;
    
    const response = {
      type: 'text',
      text: text
    };
    
    replyMessage(replyToken, [response], false);
  } catch (error) {
    logError('handleMyJobsCommand error', { userId: userId, error: error.message });
    replyMessage(replyToken, [{
      type: 'text',
      text: '❌ เกิดข้อผิดพลาด\nกรุณาลองใหม่อีกครั้ง'
    }], false);
  }
}

/**
 * Handle Quotation Command (ลูกค้า)
 */
function handleQuotationCommand(userId, replyToken) {
  try {
    const jobs = getJobsByLineUserId(userId);
    
    if (jobs.length === 0) {
      replyMessage(replyToken, [{
        type: 'text',
        text: '🔍 ไม่พบใบเสนอราคา'
      }], false);
      return;
    }
    
    // หางานที่มี quotation ล่าสุด
    const jobsWithQuotation = jobs.filter(j => j.quotation_no);
    
    if (jobsWithQuotation.length === 0) {
      replyMessage(replyToken, [{
        type: 'text',
        text: '🔍 ยังไม่มีใบเสนอราคา\nรอฝ่ายขายสร้างให้ครับ'
      }], false);
      return;
    }
    
    const job = jobsWithQuotation[0];
    
    let text = `📄 ใบเสนอราคา\n\n`;
    text += `📋 ${job.quotation_no}\n`;
    text += `⚙️ ${job.asset_desc}\n`;
    text += `💰 ฿${(job.quotation_amount || 0).toLocaleString()}\n`;
    text += `📅 ${formatDate(job.quotation_sent_at)}\n\n`;
    
    if (job.status === CONFIG.STATUS.PENDING_APPROVAL) {
      text += `⏳ รออนุมัติ\n\n`;
      text += `กดเมนู "ดูใบเสนอราคา" เพื่ออนุมัติ`;
    } else if (job.status === CONFIG.STATUS.APPROVED) {
      text += `✅ อนุมัติแล้ว\n`;
      text += `📅 ${formatDate(job.approved_at)}`;
    }
    
    replyMessage(replyToken, [{ type: 'text', text: text }], false);
  } catch (error) {
    logError('handleQuotationCommand error', { userId: userId, error: error.message });
    replyMessage(replyToken, [{
      type: 'text',
      text: '❌ เกิดข้อผิดพลาด\nกรุณาลองใหม่อีกครั้ง'
    }], false);
  }
}

/**
 * Handle Approve Quotation (ลูกค้า)
 */
function handleApproveQuotation(userId, jobId, replyToken) {
  try {
    // ดึงข้อมูล Customer
    const customer = getCustomerByLineUserId(userId);
    
    if (!customer) {
      replyMessage(replyToken, [{
        type: 'text',
        text: '❌ ไม่พบข้อมูลลูกค้า\nกรุณาติดต่อฝ่ายขาย'
      }], false);
      return;
    }
    
    // อนุมัติ
    const result = approveQuotation(jobId, userId, 'Approved by customer via LINE');
    
    if (result.success) {
      const response = {
        type: 'text',
        text: '✅ อนุมัติใบเสนอราคาสำเร็จ!\n\n' +
              `📋 ${jobId}\n` +
              `💰 ฿${(result.amount || 0).toLocaleString()}\n\n` +
              'ทีมงานจะเริ่มดำเนินการทันที\n' +
              'คุณสามารถติดตามสถานะได้ตลอดเวลา\n\n' +
              '📞 ติดต่อ: 02-xxx-xxxx'
      };
      
      replyMessage(replyToken, [response], false);
      
      // แจ้งทีมงาน (Internal OA)
      notifyInternalTeam(jobId, 'quotation_approved', {
        customer: customer.company,
        job_id: jobId
      });
    } else {
      replyMessage(replyToken, [{
        type: 'text',
        text: `❌ ไม่สามารถอนุมัติได้\n${result.error || 'กรุณาติดต่อฝ่ายขาย'}`
      }], false);
    }
  } catch (error) {
    logError('handleApproveQuotation error', { 
      userId: userId, 
      jobId: jobId, 
      error: error.message 
    });
    replyMessage(replyToken, [{
      type: 'text',
      text: '❌ เกิดข้อผิดพลาด\nกรุณาติดต่อฝ่ายขาย'
    }], false);
  }
}

/**
 * Handle Reject Quotation (ลูกค้า)
 */
function handleRejectQuotation(userId, jobId, replyToken) {
  try {
    // อัพเดทสถานะ
    updateJobStatus(jobId, CONFIG.STATUS.CANCELLED, 'Customer (LINE)');
    
    // Log event
    logJobEvent(jobId, 'quotation_rejected', 'Customer', { line_user_id: userId });
    
    const response = {
      type: 'text',
      text: '📝 ได้รับการปฏิเสธเรียบร้อยแล้ว\n\n' +
            `📋 ${jobId}\n\n` +
            'หากมีข้อสงสัยหรือต้องการปรับเปลี่ยน\n' +
            'กรุณาติดต่อฝ่ายขาย\n\n' +
            '📞 โทร: 02-xxx-xxxx'
    };
    
    replyMessage(replyToken, [response], false);
    
    // แจ้งทีมงาน
    notifyInternalTeam(jobId, 'quotation_rejected', {
      job_id: jobId
    });
  } catch (error) {
    logError('handleRejectQuotation error', { 
      userId: userId, 
      jobId: jobId, 
      error: error.message 
    });
    replyMessage(replyToken, [{
      type: 'text',
      text: '❌ เกิดข้อผิดพลาด\nกรุณาติดต่อฝ่ายขาย'
    }], false);
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
      handleViewPDFExternal(userId, jobId, data.type, replyToken);
      break;
      
    case 'view_photos':
      handleViewPhotos(userId, jobId, replyToken);
      break;
      
    case 'view_job':
      handleViewJobExternal(jobId, replyToken);
      break;
      
    case 'contact_sales':
      handleContactSales(replyToken);
      break;
      
    default:
      Logger.log('Unknown external postback action: ' + action);
      replyMessage(replyToken, [{
        type: 'text',
        text: '❌ ไม่รู้จักคำสั่ง\nกรุณาลองใหม่อีกครั้ง'
      }], false);
  }
}

/**
 * Handle View PDF External (ลูกค้า)
 */
function handleViewPDFExternal(userId, jobId, type, replyToken) {
  try {
    const job = getJob(jobId);
    
    if (!job) {
      replyMessage(replyToken, [{
        type: 'text',
        text: `❌ ไม่พบงาน: ${jobId}`
      }], false);
      return;
    }
    
    let pdfUrl = '';
    let pdfName = '';
    
    switch (type) {
      case 'quotation':
        pdfUrl = job.quotation_pdf;
        pdfName = 'ใบเสนอราคา';
        break;
      case 'finalreport':
        pdfUrl = job.final_report_pdf;
        pdfName = 'รายงานสุดท้าย';
        break;
    }
    
    if (!pdfUrl) {
      replyMessage(replyToken, [{
        type: 'text',
        text: `❌ ยังไม่มี${pdfName}\nรอฝ่ายขายสร้างให้ครับ`
      }], false);
      return;
    }
    
    replyMessage(replyToken, [{
      type: 'text',
      text: `📄 ${pdfName}\n\n${jobId}\n\nคลิกเพื่อดู:\n${pdfUrl}`
    }], false);
  } catch (error) {
    logError('handleViewPDFExternal error', { 
      jobId: jobId, 
      type: type, 
      error: error.message 
    });
    replyMessage(replyToken, [{
      type: 'text',
      text: '❌ เกิดข้อผิดพลาด\nกรุณาลองใหม่อีกครั้ง'
    }], false);
  }
}

/**
 * Handle View Photos (ลูกค้า)
 */
function handleViewPhotos(userId, jobId, replyToken) {
  try {
    const media = getJobMedia(jobId);
    
    if (media.length === 0) {
      replyMessage(replyToken, [{
        type: 'text',
        text: '📷 ยังไม่มีรูปภาพ\nรอทีมงานอัพโหลดให้ครับ'
      }], false);
      return;
    }
    
    let text = `📷 รูปภาพงาน (${media.length}):\n\n`;
    media.forEach((m, index) => {
      text += `${index + 1}. ${m.milestone}\n`;
      text += `   ${m.webapp_url}\n\n`;
    });
    
    replyMessage(replyToken, [{ type: 'text', text: text }], false);
  } catch (error) {
    logError('handleViewPhotos error', { jobId: jobId, error: error.message });
    replyMessage(replyToken, [{
      type: 'text',
      text: '❌ เกิดข้อผิดพลาด\nกรุณาลองใหม่อีกครั้ง'
    }], false);
  }
}

/**
 * Handle View Job External (ลูกค้า)
 */
function handleViewJobExternal(jobId, replyToken) {
  try {
    const job = getJob(jobId);
    
    if (!job) {
      replyMessage(replyToken, [{
        type: 'text',
        text: `❌ ไม่พบงาน: ${jobId}`
      }], false);
      return;
    }
    
    let text = `📋 ${job.job_id}\n\n`;
    text += `⚙️ ${job.asset_desc}\n`;
    text += `🏭 ${job.brand} ${job.model || ''}\n`;
    text += `📍 ${getMilestoneDisplayText(job.milestone)}\n`;
    text += `📅 กำหนดเสร็จ: ${formatDate(job.eta_finish)}\n\n`;
    
    if (job.quotation_amount) {
      text += `💰 ${job.quotation_no}\n`;
      text += `   ฿${job.quotation_amount.toLocaleString()}\n\n`;
    }
    
    text += `💡 กดเมนู "ดูสถานะงาน" เพื่อดูรายละเอียด`;
    
    replyMessage(replyToken, [{ type: 'text', text: text }], false);
  } catch (error) {
    logError('handleViewJobExternal error', { jobId: jobId, error: error.message });
    replyMessage(replyToken, [{
      type: 'text',
      text: '❌ เกิดข้อผิดพลาด\nกรุณาลองใหม่อีกครั้ง'
    }], false);
  }
}

/**
 * Handle Contact Sales
 */
function handleContactSales(replyToken) {
  const response = {
    type: 'text',
    text: '📞 ติดต่อฝ่ายขาย\n\n' +
          'โทร: 02-xxx-xxxx\n' +
          'Email: sales@pdc-motor.com\n' +
          'LINE ID: @pdcsales\n\n' +
          'เวลาทำการ:\n' +
          'จันทร์-ศุกร์ 08:00-17:00\n' +
          'เสาร์ 08:00-12:00'
  };
  
  replyMessage(replyToken, [response], false);
}

/**
 * Handle External Follow Event (ลูกค้า Add Friend)
 */
function handleExternalFollowEvent(userId, replyToken) {
  logInfo('👋 New external user (customer) followed!', { userId: userId });
  
  const welcomeMessage = {
    type: 'text',
    text: '🎉 ยินดีต้อนรับสู่ PDC Smart Motor Repair!\n\n' +
          '🔧 เราพร้อมให้บริการซ่อมมอเตอร์คุณภาพสูง\n\n' +
          '📱 คุณสามารถ:\n' +
          '• ดูสถานะงานซ่อมได้ตลอดเวลา\n' +
          '• อนุมัติใบเสนอราคา\n' +
          '• ดูรูปภาพความคืบหน้า\n' +
          '• ติดต่อฝ่ายขาย\n\n' +
          'พิมพ์ "ช่วยเหลือ" เพื่อดูคำสั่งทั้งหมด\n' +
          'หรือใช้เมนูด้านล่างได้เลย!'
  };
  
  try {
    pushMessage(userId, [welcomeMessage], false);
    logInfo('✅ External welcome message sent', { userId: userId });
  } catch (error) {
    logError('❌ Failed to send external welcome message', { 
      userId: userId, 
      error: error.message 
    });
  }
}

/**
 * Get Customer by LINE User ID
 */
function getCustomerByLineUserId(lineUserId) {
  try {
    const sheet = getSheet(CONFIG.SHEETS.CUSTOMERS);
    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    
    const lineUserIdIndex = headers.indexOf('line_user_id');
    
    for (let i = 1; i < data.length; i++) {
      if (data[i][lineUserIdIndex] === lineUserId) {
        return arrayToObject(headers, data[i]);
      }
    }
    
    return null;
  } catch (error) {
    logError('getCustomerByLineUserId error', { lineUserId: lineUserId, error: error.message });
    return null;
  }
}

/**
 * Get Jobs by LINE User ID (External - Customer)
 */
function getJobsByLineUserId(lineUserId) {
  try {
    // หา Customer ID จาก LINE User ID
    const customer = getCustomerByLineUserId(lineUserId);
    
    if (!customer) {
      return [];
    }
    
    // หางานทั้งหมดของ Customer
    const sheet = getSheet(CONFIG.SHEETS.JOBS);
    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    
    const customerIdIndex = headers.indexOf('customer_id');
    
    const jobs = [];
    for (let i = 1; i < data.length; i++) {
      if (data[i][customerIdIndex] === customer.customer_id) {
        jobs.push(arrayToObject(headers, data[i]));
      }
    }
    
    // เรียงตาม created_at (ใหม่สุดก่อน)
    jobs.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    
    return jobs;
  } catch (error) {
    logError('getJobsByLineUserId error', { lineUserId: lineUserId, error: error.message });
    return [];
  }
}

/**
 * Notify Internal Team
 */
function notifyInternalTeam(jobId, eventType, data) {
  try {
    // ดึงรายชื่อพนักงานที่ต้องแจ้งเตือน
    const userSheet = getSheet(CONFIG.SHEETS.USERS);
    const userData = userSheet.getDataRange().getValues();
    const headers = userData[0];
    const roleIndex = headers.indexOf('role');
    const lineUserIdIndex = headers.indexOf('internal_line_user_id');
    
    // หาพนักงานที่เกี่ยวข้อง (Manager, Planner)
    const targetUsers = [];
    for (let i = 1; i < userData.length; i++) {
      const role = userData[i][roleIndex];
      const lineUserId = userData[i][lineUserIdIndex];
      
      if ((role === 'Manager' || role === 'Planner') && lineUserId) {
        targetUsers.push(lineUserId);
      }
    }
    
    if (targetUsers.length === 0) {
      Logger.log('⚠️ No internal users found to notify');
      return;
    }
    
    // สร้างข้อความตาม event type
    let messageText = '';
    switch (eventType) {
      case 'quotation_approved':
        messageText = `✅ ลูกค้าอนุมัติแล้ว!\n\n` +
                     `📋 ${jobId}\n` +
                     `🏢 ${data.customer}\n\n` +
                     `กรุณาดำเนินการต่อ`;
        break;
      case 'quotation_rejected':
        messageText = `❌ ลูกค้าปฏิเสธใบเสนอราคา\n\n` +
                     `📋 ${jobId}\n\n` +
                     `กรุณาติดต่อลูกค้า`;
        break;
    }
    
    const message = {
      type: 'text',
      text: messageText
    };
    
    // ส่ง notification ไปหาทุกคน
    targetUsers.forEach(lineUserId => {
      try {
        pushMessage(lineUserId, [message], true); // true = Internal OA
        Logger.log(`✓ Notified internal user: ${lineUserId}`);
      } catch (pushError) {
        Logger.log(`✗ Failed to notify ${lineUserId}: ${pushError.message}`);
      }
    });
    
  } catch (error) {
    logError('notifyInternalTeam error', { 
      jobId: jobId, 
      eventType: eventType, 
      error: error.message 
    });
  }
}
