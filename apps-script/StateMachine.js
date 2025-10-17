/**
 * PDC Smart Motor Repair - State Machine
 * 
 * จัดการ State Transitions และ Business Rules
 */

/**
 * Allowed State Transitions
 */
const STATE_TRANSITIONS = {
  'Draft': ['PendingApproval', 'Cancelled'],
  'PendingApproval': ['Approved', 'Cancelled'],
  'Approved': ['In-Progress', 'Cancelled'],
  'In-Progress': ['Completed', 'Cancelled'],
  'Completed': ['Delivered'],
  'Delivered': [],
  'Cancelled': []
};

/**
 * Validate State Transition
 */
function canTransitionTo(currentStatus, newStatus) {
  const allowedStates = STATE_TRANSITIONS[currentStatus];
  return allowedStates && allowedStates.includes(newStatus);
}

/**
 * Transition State with Validation
 */
function transitionJobState(jobId, newStatus, actorName, reason = '') {
  const job = getJob(jobId);
  
  if (!job) {
    throw new Error(`Job not found: ${jobId}`);
  }
  
  const currentStatus = job.status;
  
  // Validate transition
  if (!canTransitionTo(currentStatus, newStatus)) {
    throw new Error(`Cannot transition from ${currentStatus} to ${newStatus}`);
  }
  
  // Perform transition
  const result = updateJobStatus(jobId, newStatus, actorName);
  
  if (result) {
    // Log event
    logEvent(jobId, 'state_transition', actorName, {
      from: currentStatus,
      to: newStatus,
      reason: reason
    });
    
    // Trigger post-transition actions
    onStateChanged(jobId, currentStatus, newStatus);
  }
  
  return result;
}

/**
 * Post-Transition Actions
 */
function onStateChanged(jobId, fromStatus, toStatus) {
  const job = getJob(jobId);
  
  switch (toStatus) {
    case CONFIG.STATUS.PENDING_APPROVAL:
      // ส่งใบเสนอราคาไปหาลูกค้า
      sendQuotationToCustomer(jobId);
      break;
      
    case CONFIG.STATUS.APPROVED:
      // สร้างใบสั่งงาน
      generateWorkOrderPDF(jobId);
      // แจ้งเตือนทีมงาน
      notifyInternalTeam(jobId, 'quotation_approved');
      break;
      
    case CONFIG.STATUS.IN_PROGRESS:
      // เริ่มติดตามงาน
      updateJobMilestone(jobId, CONFIG.MILESTONES[0], 'System', 'เริ่มงาน', null);
      break;
      
    case CONFIG.STATUS.COMPLETED:
      // สร้างรายงานสุดท้าย (ถ้ายังไม่มี)
      if (!job.final_report_pdf) {
        generateFinalReportPDF(jobId);
      }
      // ส่งรายงานไปหาลูกค้า
      sendFinalReportToCustomer(jobId);
      break;
      
    case CONFIG.STATUS.DELIVERED:
      // ขอบคุณลูกค้า
      sendThankYouMessage(jobId);
      break;
      
    case CONFIG.STATUS.CANCELLED:
      // แจ้งเตือนการยกเลิก
      notifyJobCancellation(jobId);
      break;
  }
}

/**
 * Send Quotation to Customer
 */
function sendQuotationToCustomer(jobId) {
  const job = getJob(jobId);
  const items = getJobItems(jobId);
  
  // คำนวณยอดรวม
  let total = 0;
  items.forEach(item => {
    total += Number(item.subtotal);
  });
  
  // สร้าง Flex Message
  const flexMessage = createQuotationFlexMessage(job, items, total);
  
  // ส่งไปหาลูกค้า (ต้องมี line_user_id)
  const customer = getCustomerByJobId(jobId);
  
  if (customer && customer.line_user_id) {
    pushMessage(customer.line_user_id, flexMessage, false);
    
    Logger.log(`✅ Sent quotation to customer: ${customer.line_user_id}`);
  } else {
    Logger.log('⚠️  Customer LINE ID not found');
  }
}

/**
 * Send Final Report to Customer
 */
function sendFinalReportToCustomer(jobId) {
  const job = getJob(jobId);
  const testResult = getTestResult(jobId);
  
  // สร้าง Flex Message
  const flexMessage = createFinalReportFlexMessage(job, testResult);
  
  // ส่งไปหาลูกค้า
  const customer = getCustomerByJobId(jobId);
  
  if (customer && customer.line_user_id) {
    pushMessage(customer.line_user_id, flexMessage, false);
    
    Logger.log(`✅ Sent final report to customer: ${customer.line_user_id}`);
  }
}

/**
 * Send Thank You Message
 */
function sendThankYouMessage(jobId) {
  const job = getJob(jobId);
  const customer = getCustomerByJobId(jobId);
  
  const message = {
    type: 'text',
    text: `🎉 ขอบคุณที่ใช้บริการ PDC Smart Motor Repair\n\n` +
          `งาน: ${job.job_id}\n` +
          `${job.asset_desc}\n\n` +
          `หากมีปัญหาหรือข้อสงสัย กรุณาติดต่อเราได้ตลอดเวลา\n` +
          `เรายินดีให้บริการคุณอีกครั้ง! 😊`
  };
  
  if (customer && customer.line_user_id) {
    pushMessage(customer.line_user_id, message, false);
  }
}

/**
 * Notify Job Cancellation
 */
function notifyJobCancellation(jobId) {
  const job = getJob(jobId);
  const customer = getCustomerByJobId(jobId);
  
  const message = {
    type: 'text',
    text: `❌ งานถูกยกเลิก\n\n` +
          `Job ID: ${job.job_id}\n` +
          `เครื่องจักร: ${job.asset_desc}\n\n` +
          `หากต้องการข้อมูลเพิ่มเติม กรุณาติดต่อเจ้าหน้าที่`
  };
  
  if (customer && customer.line_user_id) {
    pushMessage(customer.line_user_id, message, false);
  }
}

/**
 * Get Customer by Job ID
 */
function getCustomerByJobId(jobId) {
  const job = getJob(jobId);
  if (!job || !job.customer_id) return null;
  
  const customerSheet = getSheet(CONFIG.SHEETS.CUSTOMERS);
  const data = customerSheet.getDataRange().getValues();
  const headers = data[0];
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === job.customer_id) {
      return arrayToObject(headers, data[i]);
    }
  }
  
  return null;
}

/**
 * Check if Milestone is Complete
 */
function isMilestoneComplete(jobId, milestone) {
  const events = getJobEvents(jobId);
  
  return events.some(event => 
    event.event_type === 'milestone_changed' && 
    JSON.parse(event.payload_json).new_milestone === milestone
  );
}

/**
 * Get Job Events
 */
function getJobEvents(jobId) {
  const sheet = getSheet(CONFIG.SHEETS.EVENTS);
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const events = [];
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][1] === jobId) {
      events.push(arrayToObject(headers, data[i]));
    }
  }
  
  return events;
}

/**
 * Calculate Job Progress (%)
 */
function calculateJobProgress(jobId) {
  const job = getJob(jobId);
  const currentMilestone = job.milestone;
  
  const milestoneIndex = CONFIG.MILESTONES.indexOf(currentMilestone);
  
  if (milestoneIndex === -1) return 0;
  
  return Math.round((milestoneIndex / CONFIG.MILESTONES.length) * 100);
}

/**
 * Get Next Milestone
 */
function getNextMilestone(currentMilestone) {
  const currentIndex = CONFIG.MILESTONES.indexOf(currentMilestone);
  
  if (currentIndex === -1 || currentIndex === CONFIG.MILESTONES.length - 1) {
    return null;
  }
  
  return CONFIG.MILESTONES[currentIndex + 1];
}

/**
 * Auto-advance to Next Milestone
 */
function advanceToNextMilestone(jobId, actorName, note = '') {
  const job = getJob(jobId);
  const nextMilestone = getNextMilestone(job.milestone);
  
  if (!nextMilestone) {
    Logger.log('Job is already at final milestone');
    return false;
  }
  
  updateJobMilestone(jobId, nextMilestone, actorName, note, null);
  
  // ถ้าถึง milestone สุดท้าย, เปลี่ยนสถานะเป็น Completed
  if (nextMilestone === CONFIG.MILESTONES[CONFIG.MILESTONES.length - 1]) {
    transitionJobState(jobId, CONFIG.STATUS.COMPLETED, actorName);
  }
  
  return true;
}

/**
 * Test State Machine
 */
function testStateMachine() {
  Logger.log('=== Testing State Machine ===');
  
  // Test state transitions
  Logger.log('Can transition Draft -> PendingApproval: ' + canTransitionTo('Draft', 'PendingApproval'));
  Logger.log('Can transition Draft -> Delivered: ' + canTransitionTo('Draft', 'Delivered'));
  
  // Test progress calculation
  const progress25 = (CONFIG.MILESTONES.indexOf('Rewinding') / CONFIG.MILESTONES.length) * 100;
  Logger.log('Progress at Rewinding: ' + Math.round(progress25) + '%');
  
  // Test next milestone
  const next = getNextMilestone('Rewinding');
  Logger.log('Next milestone after Rewinding: ' + next);
  
  Logger.log('✅ State Machine Test Complete');
}
