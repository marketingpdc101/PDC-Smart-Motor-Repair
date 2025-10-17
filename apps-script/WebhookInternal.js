/**
 * PDC Smart Motor Repair - Internal OA Webhook Handler
 * 
 * จัดการ Events จาก Internal LINE OA (สำหรับพนักงาน)
 */

/**
 * Handle Internal Message Event
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
      
    case '/approve':
      if (args[0]) {
        handleQuickApprove(args[0], userId, replyToken);
      } else {
        replyMessage(replyToken, [{
          type: 'text',
          text: '❌ กรุณาระบุ Job ID\n\nตัวอย่าง: /approve PDC-202510-0001'
        }], true);
      }
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
          '• /mytasks - งานที่ assign ให้ฉัน\n' +
          '• /approve [JOB_ID] - อนุมัติงานเร็ว\n\n' +
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
  try {
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
    
    text += `แสดง ${jobs.length} งาน\n`;
    text += `พิมพ์ /job [JOB_ID] เพื่อดูรายละเอียด`;
    
    replyMessage(replyToken, [{ type: 'text', text: text }], true);
  } catch (error) {
    logError('handleJobsList error', { error: error.message });
    replyMessage(replyToken, [{
      type: 'text',
      text: '❌ เกิดข้อผิดพลาด: ' + error.message
    }], true);
  }
}

/**
 * Get Job Detail
 */
function handleJobDetail(jobId, replyToken) {
  try {
    const job = getJob(jobId);
    
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
    text += `📞 ${job.company}\n`;
    text += `⚙️ ${job.asset_desc}\n`;
    text += `🏭 ${job.brand} ${job.model}\n`;
    text += `📊 ${job.status}\n`;
    text += `🔄 ${job.milestone}\n`;
    text += `💰 ฿${(job.quotation_amount || 0).toLocaleString()}\n`;
    text += `📅 ${formatDate(job.eta_finish)}\n\n`;
    
    if (items.length > 0) {
      text += `🔧 รายการซ่อม (${items.length}):\n`;
      items.forEach((item, index) => {
        text += `${index + 1}. ${item.title}\n`;
        text += `   ฿${item.subtotal.toLocaleString()}\n`;
      });
    }
    
    text += `\n📝 Notes: ${job.notes || '-'}`;
    
    replyMessage(replyToken, [{ type: 'text', text: text }], true);
  } catch (error) {
    logError('handleJobDetail error', { jobId: jobId, error: error.message });
    replyMessage(replyToken, [{
      type: 'text',
      text: '❌ เกิดข้อผิดพลาด: ' + error.message
    }], true);
  }
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
  try {
    // ดึงข้อมูล User
    const user = getUserByLineUserId(userId);
    
    if (!user) {
      replyMessage(replyToken, [{
        type: 'text',
        text: '❌ ไม่พบข้อมูลผู้ใช้\nกรุณาติดต่อผู้ดูแลระบบ'
      }], true);
      return;
    }
    
    // ดึงงานที่ assign ให้ user นี้
    const sheet = getSheet(CONFIG.SHEETS.JOBS);
    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    
    const jobs = [];
    for (let i = 1; i < data.length; i++) {
      const job = arrayToObject(headers, data[i]);
      
      // TODO: เพิ่ม field assigned_to ใน Jobs sheet
      // if (job.assigned_to === user.user_id && job.status === 'IN_PROGRESS')
      if (job.status === CONFIG.STATUS.IN_PROGRESS) {
        jobs.push(job);
      }
    }
    
    if (jobs.length === 0) {
      replyMessage(replyToken, [{
        type: 'text',
        text: '📋 ไม่มีงานที่ assign ให้คุณ'
      }], true);
      return;
    }
    
    let text = `📋 งานของฉัน (${jobs.length}):\n\n`;
    jobs.forEach((job, index) => {
      text += `${index + 1}. ${job.job_id}\n`;
      text += `   ${job.asset_desc}\n`;
      text += `   ${job.milestone}\n\n`;
    });
    
    replyMessage(replyToken, [{ type: 'text', text: text }], true);
  } catch (error) {
    logError('handleMyTasks error', { userId: userId, error: error.message });
    replyMessage(replyToken, [{
      type: 'text',
      text: '❌ เกิดข้อผิดพลาด: ' + error.message
    }], true);
  }
}

/**
 * Get Stats
 */
function handleStats(replyToken) {
  try {
    const sheet = getSheet(CONFIG.SHEETS.JOBS);
    const data = sheet.getDataRange().getValues();
    
    let total = data.length - 1;
    let draft = 0;
    let pending = 0;
    let approved = 0;
    let progress = 0;
    let completed = 0;
    let delivered = 0;
    let cancelled = 0;
    
    for (let i = 1; i < data.length; i++) {
      const status = data[i][9]; // status column
      switch (status) {
        case CONFIG.STATUS.DRAFT:
          draft++;
          break;
        case CONFIG.STATUS.PENDING_APPROVAL:
          pending++;
          break;
        case CONFIG.STATUS.APPROVED:
          approved++;
          break;
        case CONFIG.STATUS.IN_PROGRESS:
          progress++;
          break;
        case CONFIG.STATUS.COMPLETED:
          completed++;
          break;
        case CONFIG.STATUS.DELIVERED:
          delivered++;
          break;
        case CONFIG.STATUS.CANCELLED:
          cancelled++;
          break;
      }
    }
    
    const text = `📊 สถิติรวม:\n\n` +
                 `📋 งานทั้งหมด: ${total}\n\n` +
                 `📝 Draft: ${draft}\n` +
                 `⏳ รออนุมัติ: ${pending}\n` +
                 `✅ อนุมัติแล้ว: ${approved}\n` +
                 `🔄 กำลังดำเนินการ: ${progress}\n` +
                 `✔️ เสร็จสิ้น: ${completed}\n` +
                 `📦 ส่งมอบแล้ว: ${delivered}\n` +
                 `❌ ยกเลิก: ${cancelled}\n\n` +
                 `อัพเดท: ${new Date().toLocaleString('th-TH')}`;
    
    replyMessage(replyToken, [{ type: 'text', text: text }], true);
  } catch (error) {
    logError('handleStats error', { error: error.message });
    replyMessage(replyToken, [{
      type: 'text',
      text: '❌ เกิดข้อผิดพลาด: ' + error.message
    }], true);
  }
}

/**
 * Quick Approve Job
 */
function handleQuickApprove(jobId, userId, replyToken) {
  try {
    const user = getUserByLineUserId(userId);
    
    if (!user) {
      replyMessage(replyToken, [{
        type: 'text',
        text: '❌ ไม่พบข้อมูลผู้ใช้'
      }], true);
      return;
    }
    
    // ตรวจสอบสิทธิ์ (เฉพาะ Manager/Planner)
    if (user.role !== 'Manager' && user.role !== 'Planner') {
      replyMessage(replyToken, [{
        type: 'text',
        text: '❌ คุณไม่มีสิทธิ์อนุมัติงาน\nเฉพาะ Manager/Planner เท่านั้น'
      }], true);
      return;
    }
    
    // อนุมัติงาน
    const result = approveQuotation(jobId, userId, 'Approved via LINE command');
    
    if (result.success) {
      replyMessage(replyToken, [{
        type: 'text',
        text: `✅ อนุมัติงานสำเร็จ!\n\n${jobId}\n\nระบบได้สร้าง Work Order แล้ว`
      }], true);
    } else {
      replyMessage(replyToken, [{
        type: 'text',
        text: `❌ ไม่สามารถอนุมัติได้: ${result.error}`
      }], true);
    }
  } catch (error) {
    logError('handleQuickApprove error', { jobId: jobId, error: error.message });
    replyMessage(replyToken, [{
      type: 'text',
      text: '❌ เกิดข้อผิดพลาด: ' + error.message
    }], true);
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
      handleViewPDFInternal(userId, jobId, data.type, replyToken);
      break;
      
    case 'update_status':
      handleUpdateStatusPostback(jobId, data.status, userId, replyToken);
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
 * Handle Assign Job
 */
function handleAssignJob(jobId, userId, replyToken) {
  try {
    // TODO: Implement assign job logic
    replyMessage(replyToken, [{
      type: 'text',
      text: `✅ รับงาน ${jobId} สำเร็จ!`
    }], true);
  } catch (error) {
    logError('handleAssignJob error', { jobId: jobId, error: error.message });
    replyMessage(replyToken, [{
      type: 'text',
      text: '❌ เกิดข้อผิดพลาด: ' + error.message
    }], true);
  }
}

/**
 * Handle Start Job
 */
function handleStartJob(jobId, userId, replyToken) {
  try {
    updateJobStatus(jobId, CONFIG.STATUS.IN_PROGRESS, 'Staff (LINE)');
    
    replyMessage(replyToken, [{
      type: 'text',
      text: `✅ เริ่มงาน ${jobId} สำเร็จ!`
    }], true);
  } catch (error) {
    logError('handleStartJob error', { jobId: jobId, error: error.message });
    replyMessage(replyToken, [{
      type: 'text',
      text: '❌ เกิดข้อผิดพลาด: ' + error.message
    }], true);
  }
}

/**
 * Handle Complete Milestone
 */
function handleCompleteMilestone(jobId, milestone, userId, replyToken) {
  try {
    updateJobMilestone(jobId, milestone, 'Staff (LINE)', '', []);
    
    replyMessage(replyToken, [{
      type: 'text',
      text: `✅ อัพเดทสถานะสำเร็จ!\n\n${jobId}\n→ ${milestone}`
    }], true);
  } catch (error) {
    logError('handleCompleteMilestone error', { 
      jobId: jobId, 
      milestone: milestone, 
      error: error.message 
    });
    replyMessage(replyToken, [{
      type: 'text',
      text: '❌ เกิดข้อผิดพลาด: ' + error.message
    }], true);
  }
}

/**
 * Handle View Job Internal
 */
function handleViewJobInternal(jobId, replyToken) {
  handleJobDetail(jobId, replyToken);
}

/**
 * Handle View PDF Internal
 */
function handleViewPDFInternal(userId, jobId, type, replyToken) {
  try {
    const job = getJob(jobId);
    
    if (!job) {
      replyMessage(replyToken, [{
        type: 'text',
        text: `❌ ไม่พบงาน: ${jobId}`
      }], true);
      return;
    }
    
    let pdfUrl = '';
    let pdfName = '';
    
    switch (type) {
      case 'quotation':
        pdfUrl = job.quotation_pdf;
        pdfName = 'ใบเสนอราคา';
        break;
      case 'workorder':
        pdfUrl = job.workorder_pdf;
        pdfName = 'ใบสั่งงาน';
        break;
      case 'finalreport':
        pdfUrl = job.final_report_pdf;
        pdfName = 'รายงานสุดท้าย';
        break;
    }
    
    if (!pdfUrl) {
      replyMessage(replyToken, [{
        type: 'text',
        text: `❌ ยังไม่มี${pdfName}\nกรุณาสร้างเอกสารก่อน`
      }], true);
      return;
    }
    
    replyMessage(replyToken, [{
      type: 'text',
      text: `📄 ${pdfName}\n\n${jobId}\n\n${pdfUrl}`
    }], true);
  } catch (error) {
    logError('handleViewPDFInternal error', { 
      jobId: jobId, 
      type: type, 
      error: error.message 
    });
    replyMessage(replyToken, [{
      type: 'text',
      text: '❌ เกิดข้อผิดพลาด: ' + error.message
    }], true);
  }
}

/**
 * Handle Update Status Postback
 */
function handleUpdateStatusPostback(jobId, status, userId, replyToken) {
  try {
    updateJobStatus(jobId, status, 'Staff (LINE)');
    
    replyMessage(replyToken, [{
      type: 'text',
      text: `✅ อัพเดทสถานะสำเร็จ!\n\n${jobId}\n→ ${status}`
    }], true);
  } catch (error) {
    logError('handleUpdateStatusPostback error', { 
      jobId: jobId, 
      status: status, 
      error: error.message 
    });
    replyMessage(replyToken, [{
      type: 'text',
      text: '❌ เกิดข้อผิดพลาด: ' + error.message
    }], true);
  }
}

/**
 * Handle Internal Follow Event (พนักงาน Add Friend)
 */
function handleInternalFollowEvent(userId, replyToken) {
  logInfo('👋 New internal user (employee) followed!', { userId: userId });
  
  const welcomeMessage = {
    type: 'text',
    text: '🎉 ยินดีต้อนรับสู่ PDC Smart Motor Repair!\n\n' +
          '👨‍🔧 Internal OA (สำหรับพนักงาน)\n\n' +
          '📱 คุณสามารถ:\n' +
          '• ดูรายการงานทั้งหมด\n' +
          '• รับงานที่ได้รับมอบหมาย\n' +
          '• อัพเดทสถานะงาน\n' +
          '• ดูสถิติรวม\n\n' +
          'พิมพ์ /help เพื่อดูคำสั่งทั้งหมด'
  };
  
  try {
    pushMessage(userId, [welcomeMessage], true);
    logInfo('✅ Internal welcome message sent', { userId: userId });
  } catch (error) {
    logError('❌ Failed to send internal welcome message', { 
      userId: userId, 
      error: error.message 
    });
  }
}

/**
 * Get User by LINE User ID (Internal)
 */
function getUserByLineUserId(lineUserId) {
  try {
    const sheet = getSheet(CONFIG.SHEETS.USERS);
    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    
    const lineUserIdIndex = headers.indexOf('internal_line_user_id');
    
    for (let i = 1; i < data.length; i++) {
      if (data[i][lineUserIdIndex] === lineUserId) {
        return arrayToObject(headers, data[i]);
      }
    }
    
    return null;
  } catch (error) {
    logError('getUserByLineUserId error', { lineUserId: lineUserId, error: error.message });
    return null;
  }
}
