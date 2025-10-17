/**
 * PDC Smart Motor Repair - LINE API Integration
 * 
 * จัดการการส่ง LINE Messages, Flex Messages, และ Push Notifications
 */

/**
 * ส่ง Push Message ไปหาผู้ใช้
 */
function pushMessage(userId, message, isInternal = true) {
  const token = isInternal ? 
    CONFIG.LINE.INTERNAL_CHANNEL_ACCESS_TOKEN : 
    CONFIG.LINE.EXTERNAL_CHANNEL_ACCESS_TOKEN;
  
  const url = CONFIG.LINE.PUSH_API_URL;
  
  const payload = {
    to: userId,
    messages: Array.isArray(message) ? message : [message]
  };
  
  const options = {
    method: 'post',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + token
    },
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  };
  
  try {
    const response = UrlFetchApp.fetch(url, options);
    const result = JSON.parse(response.getContentText());
    
    if (response.getResponseCode() !== 200) {
      Logger.log('LINE API Error: ' + JSON.stringify(result));
      return false;
    }
    
    return true;
  } catch (error) {
    Logger.log('Error pushing message: ' + error.message);
    return false;
  }
}

/**
 * Reply Message (ใช้กับ Webhook Event)
 */
function replyMessage(replyToken, message, isInternal = true) {
  const token = isInternal ? 
    CONFIG.LINE.INTERNAL_CHANNEL_ACCESS_TOKEN : 
    CONFIG.LINE.EXTERNAL_CHANNEL_ACCESS_TOKEN;
  
  const url = CONFIG.LINE.REPLY_API_URL;
  
  const payload = {
    replyToken: replyToken,
    messages: Array.isArray(message) ? message : [message]
  };
  
  const options = {
    method: 'post',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + token
    },
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  };
  
  try {
    const response = UrlFetchApp.fetch(url, options);
    const responseCode = response.getResponseCode();
    
    // Log เฉพาะตอน error
    if (responseCode !== 200) {
      const responseBody = response.getContentText();
      Logger.log('LINE API Error: ' + responseCode + ' - ' + responseBody);
    }
    
    return responseCode === 200;
  } catch (error) {
    Logger.log('ERROR replying message: ' + error.message);
    return false;
  }
}

/**
 * สร้าง Flex Message สำหรับใบเสนอราคา
 */
function createQuotationFlexMessage(job, items, totalAmount) {
  return {
    type: 'flex',
    altText: `ใบเสนอราคา ${job.quotation_no}`,
    contents: {
      type: 'bubble',
      header: {
        type: 'box',
        layout: 'vertical',
        contents: [
          {
            type: 'text',
            text: '📄 ใบเสนอราคา',
            weight: 'bold',
            size: 'xl',
            color: '#FFFFFF'
          },
          {
            type: 'text',
            text: job.quotation_no,
            size: 'sm',
            color: '#FFFFFF'
          }
        ],
        backgroundColor: '#4285F4'
      },
      body: {
        type: 'box',
        layout: 'vertical',
        contents: [
          {
            type: 'text',
            text: job.company || job.customer_name,
            weight: 'bold',
            size: 'lg',
            wrap: true
          },
          {
            type: 'text',
            text: job.asset_desc,
            size: 'sm',
            color: '#666666',
            wrap: true,
            margin: 'md'
          },
          {
            type: 'separator',
            margin: 'lg'
          },
          {
            type: 'box',
            layout: 'vertical',
            margin: 'lg',
            spacing: 'sm',
            contents: items.slice(0, 5).map(item => ({
              type: 'box',
              layout: 'horizontal',
              contents: [
                {
                  type: 'text',
                  text: item.title,
                  size: 'sm',
                  color: '#555555',
                  flex: 3,
                  wrap: true
                },
                {
                  type: 'text',
                  text: formatCurrency(item.subtotal),
                  size: 'sm',
                  color: '#111111',
                  align: 'end',
                  flex: 1
                }
              ]
            }))
          },
          {
            type: 'separator',
            margin: 'lg'
          },
          {
            type: 'box',
            layout: 'horizontal',
            margin: 'lg',
            contents: [
              {
                type: 'text',
                text: 'ยอดรวมทั้งสิ้น',
                weight: 'bold',
                size: 'md'
              },
              {
                type: 'text',
                text: formatCurrency(totalAmount),
                weight: 'bold',
                size: 'md',
                color: '#EA4335',
                align: 'end'
              }
            ]
          }
        ]
      },
      footer: {
        type: 'box',
        layout: 'vertical',
        spacing: 'sm',
        contents: [
          {
            type: 'button',
            style: 'primary',
            action: {
              type: 'postback',
              label: '✅ อนุมัติ',
              data: `action=approve&job_id=${job.job_id}`
            },
            color: '#34A853'
          },
          {
            type: 'button',
            style: 'secondary',
            action: {
              type: 'postback',
              label: '📄 ดู PDF',
              data: `action=view_pdf&job_id=${job.job_id}&type=quotation`
            }
          },
          {
            type: 'button',
            style: 'secondary',
            action: {
              type: 'postback',
              label: '❌ ปฏิเสธ',
              data: `action=reject&job_id=${job.job_id}`
            }
          }
        ]
      }
    }
  };
}

/**
 * สร้าง Flex Message สำหรับ Status Update
 */
function createStatusUpdateFlexMessage(job, milestone, note, photos) {
  const milestoneText = getMilestoneDisplayText(milestone);
  const photoContents = photos && photos.length > 0 ? [
    {
      type: 'separator',
      margin: 'lg'
    },
    {
      type: 'text',
      text: '📷 รูปภาพ',
      weight: 'bold',
      margin: 'lg'
    },
    ...photos.slice(0, 3).map(photo => ({
      type: 'image',
      url: photo.thumbnail_url || photo.webapp_url,
      size: 'full',
      aspectMode: 'cover',
      aspectRatio: '16:9',
      margin: 'md'
    }))
  ] : [];
  
  return {
    type: 'flex',
    altText: `อัพเดทสถานะ: ${milestoneText}`,
    contents: {
      type: 'bubble',
      header: {
        type: 'box',
        layout: 'vertical',
        contents: [
          {
            type: 'text',
            text: '🔔 อัพเดทสถานะงาน',
            weight: 'bold',
            size: 'lg',
            color: '#FFFFFF'
          },
          {
            type: 'text',
            text: job.job_id,
            size: 'sm',
            color: '#FFFFFF'
          }
        ],
        backgroundColor: '#FBBC04'
      },
      body: {
        type: 'box',
        layout: 'vertical',
        contents: [
          {
            type: 'text',
            text: milestoneText,
            weight: 'bold',
            size: 'xl',
            color: '#34A853'
          },
          {
            type: 'text',
            text: job.asset_desc,
            size: 'sm',
            color: '#666666',
            wrap: true,
            margin: 'md'
          },
          {
            type: 'separator',
            margin: 'lg'
          },
          {
            type: 'box',
            layout: 'vertical',
            margin: 'lg',
            spacing: 'sm',
            contents: [
              {
                type: 'box',
                layout: 'horizontal',
                contents: [
                  {
                    type: 'text',
                    text: 'หมายเหตุ:',
                    size: 'sm',
                    color: '#666666',
                    flex: 0
                  },
                  {
                    type: 'text',
                    text: note || 'ดำเนินการตามปกติ',
                    size: 'sm',
                    wrap: true,
                    margin: 'md'
                  }
                ]
              }
            ]
          },
          ...photoContents
        ]
      }
    }
  };
}

/**
 * สร้าง Flex Message สำหรับรายงานสุดท้าย
 */
function createFinalReportFlexMessage(job, testResult) {
  return {
    type: 'flex',
    altText: `รายงานงานเสร็จ ${job.final_report_no}`,
    contents: {
      type: 'bubble',
      header: {
        type: 'box',
        layout: 'vertical',
        contents: [
          {
            type: 'text',
            text: '✅ งานเสร็จสมบูรณ์',
            weight: 'bold',
            size: 'xl',
            color: '#FFFFFF'
          },
          {
            type: 'text',
            text: job.final_report_no,
            size: 'sm',
            color: '#FFFFFF'
          }
        ],
        backgroundColor: '#34A853'
      },
      body: {
        type: 'box',
        layout: 'vertical',
        contents: [
          {
            type: 'text',
            text: job.company || job.customer_name,
            weight: 'bold',
            size: 'lg',
            wrap: true
          },
          {
            type: 'text',
            text: job.asset_desc,
            size: 'sm',
            color: '#666666',
            wrap: true,
            margin: 'sm'
          },
          {
            type: 'separator',
            margin: 'lg'
          },
          {
            type: 'text',
            text: '📊 ผลการทดสอบ',
            weight: 'bold',
            margin: 'lg'
          },
          {
            type: 'box',
            layout: 'vertical',
            margin: 'md',
            spacing: 'sm',
            contents: testResult ? [
              createInfoRow('แรงดันไฟ', `${testResult.voltage_v} V`),
              createInfoRow('กระแสไฟ', `${testResult.current_a} A`),
              createInfoRow('ความเร็วรอบ', `${testResult.rpm} RPM`),
              createInfoRow('ค่า IR', `${testResult.ir_mohm} MΩ`),
              createInfoRow('Vibration', `${testResult.vibration_mm_s} mm/s`),
              createInfoRow('อุณหภูมิ', `${testResult.temperature_c} °C`),
              createInfoRow('ผลการทดสอบ', testResult.pass_fail, testResult.pass_fail === 'PASS' ? '#34A853' : '#EA4335')
            ] : [
              {
                type: 'text',
                text: 'ยังไม่มีข้อมูลการทดสอบ',
                size: 'sm',
                color: '#999999'
              }
            ]
          }
        ]
      },
      footer: {
        type: 'box',
        layout: 'vertical',
        spacing: 'sm',
        contents: [
          {
            type: 'button',
            style: 'primary',
            action: {
              type: 'uri',
              label: '📄 ดาวน์โหลดรายงาน PDF',
              uri: job.final_report_pdf || 'https://www.google.com'
            },
            color: '#4285F4'
          },
          {
            type: 'button',
            style: 'secondary',
            action: {
              type: 'postback',
              label: '🖼️ ดูภาพ Before/After',
              data: `action=view_photos&job_id=${job.job_id}`
            }
          }
        ]
      }
    }
  };
}

/**
 * สร้าง Info Row สำหรับ Flex Message
 */
function createInfoRow(label, value, valueColor = '#111111') {
  return {
    type: 'box',
    layout: 'horizontal',
    contents: [
      {
        type: 'text',
        text: label,
        size: 'sm',
        color: '#666666',
        flex: 2
      },
      {
        type: 'text',
        text: String(value),
        size: 'sm',
        color: valueColor,
        align: 'end',
        flex: 3,
        wrap: true
      }
    ]
  };
}

/**
 * Get Milestone Display Text (แปลเป็นภาษาไทย)
 */
function getMilestoneDisplayText(milestone) {
  const map = {
    'Received': 'รับงาน',
    'Inspection': 'ตรวจสอบเบื้องต้น',
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
    'Delivery': 'พร้อมส่งมอบ'
  };
  
  return map[milestone] || milestone;
}

/**
 * Format Currency (บาท)
 */
function formatCurrency(amount) {
  return '฿' + Number(amount).toLocaleString('th-TH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

/**
 * สร้าง LIFF URL พร้อม Job ID
 */
function createLiffUrl(liffId, jobId) {
  return `https://liff.line.me/${liffId}?jobId=${jobId}`;
}

// ========================================
// Notification Functions
// ========================================

/**
 * แจ้งเตือนลูกค้าว่างานถูกสร้างแล้ว พร้อมใบเสนอราคา
 */
function notifyCustomerJobCreated(jobId, quotationPdfUrl) {
  try {
    const job = getJobById(jobId);
    if (!job || !job.line_user_id) return false;
    
    const items = getJobItems(jobId);
    const totalAmount = job.grand_total || 0;
    
    // สร้าง LIFF URL สำหรับเปิดใบเสนอราคา
    const quotationLiffUrl = createLiffUrl(CONFIG.LIFF.QUOTATION, jobId);
    
    const messages = [
      {
        type: 'text',
        text: `สวัสดีครับคุณ ${job.customer_name}\n\n✅ เราได้รับงานซ่อมของท่านแล้ว\nหมายเลขงาน: ${job.job_id}\n\n📄 กรุณาตรวจสอบใบเสนอราคาด้านล่าง`
      },
      createQuotationFlexMessage(job, items, totalAmount)
    ];
    
    // เพิ่มปุ่มเปิด LIFF
    messages.push({
      type: 'template',
      altText: 'เปิดใบเสนอราคา',
      template: {
        type: 'buttons',
        text: '📄 ใบเสนอราคา',
        actions: [
          {
            type: 'uri',
            label: '📄 เปิดใบเสนอราคา',
            uri: quotationLiffUrl
          }
        ]
      }
    });
    
    if (quotationPdfUrl) {
      messages.push({
        type: 'text',
        text: `📥 ดาวน์โหลด PDF: ${quotationPdfUrl}`
      });
    }
    
    return pushMessage(job.line_user_id, messages, false); // External OA
  } catch (error) {
    logError('notifyCustomerJobCreated', error);
    return false;
  }
}

/**
 * แจ้งเตือน Internal Team เมื่อมีงานใหม่
 */
function notifyInternalJobCreated(jobId) {
  try {
    const job = getJobById(jobId);
    if (!job) return false;
    
    // ส่งไปที่ Group Chat หรือ Admin LINE ID
    const adminLineId = CONFIG.LINE.ADMIN_GROUP_ID || CONFIG.LINE.ADMIN_LINE_ID;
    if (!adminLineId) return false;
    
    const message = {
      type: 'text',
      text: `🔔 งานใหม่เข้ามา!\n\n` +
            `หมายเลขงาน: ${job.job_id}\n` +
            `ลูกค้า: ${job.customer_name}\n` +
            `บริษัท: ${job.company || '-'}\n` +
            `มอเตอร์: ${job.asset_desc}\n` +
            `ยอดรวม: ${formatCurrency(job.grand_total)}\n\n` +
            `📋 รอการอนุมัติใบเสนอราคา`
    };
    
    return pushMessage(adminLineId, message, true); // Internal OA
  } catch (error) {
    logError('notifyInternalJobCreated', error);
    return false;
  }
}

/**
 * แจ้งเตือนลูกค้าเมื่อมีการอัพเดทสถานะงาน
 */
function notifyCustomerStatusUpdate(jobId, milestone, note, photos) {
  try {
    const job = getJobById(jobId);
    if (!job || !job.line_user_id) return false;
    
    // สร้าง LIFF URL สำหรับดูสถานะ
    const statusLiffUrl = createLiffUrl(CONFIG.LIFF.STATUS_UPDATE, jobId);
    
    const messages = [
      createStatusUpdateFlexMessage(job, milestone, note, photos),
      {
        type: 'template',
        altText: 'ดูรายละเอียดงาน',
        template: {
          type: 'buttons',
          text: '📱 เปิดดูรายละเอียด',
          actions: [
            {
              type: 'uri',
              label: '🔍 ดูสถานะงาน',
              uri: statusLiffUrl
            }
          ]
        }
      }
    ];
    
    return pushMessage(job.line_user_id, messages, false); // External OA
  } catch (error) {
    logError('notifyCustomerStatusUpdate', error);
    return false;
  }
}

/**
 * แจ้งเตือน Internal Team เมื่อลูกค้าอนุมัติใบเสนอราคา
 */
function notifyInternalQuotationApproved(jobId, approvedBy) {
  try {
    const job = getJobById(jobId);
    if (!job) return false;
    
    const adminLineId = CONFIG.LINE.ADMIN_GROUP_ID || CONFIG.LINE.ADMIN_LINE_ID;
    if (!adminLineId) return false;
    
    // สร้าง LIFF URLs
    const workOrderLiffUrl = createLiffUrl(CONFIG.LIFF.WORK_ORDER, jobId);
    const statusUpdateLiffUrl = createLiffUrl(CONFIG.LIFF.STATUS_UPDATE, jobId);
    
    const messages = [
      {
        type: 'text',
        text: `✅ ลูกค้าอนุมัติใบเสนอราคาแล้ว!\n\n` +
              `หมายเลขงาน: ${job.job_id}\n` +
              `ลูกค้า: ${job.customer_name}\n` +
              `ยอดรวม: ${formatCurrency(job.grand_total)}\n` +
              `PO Number: ${job.po_number || '-'}\n\n` +
              `📌 สามารถเริ่มงานได้เลย`
      },
      {
        type: 'template',
        altText: 'เปิดใบสั่งงาน',
        template: {
          type: 'buttons',
          text: '📋 จัดการงาน',
          actions: [
            {
              type: 'uri',
              label: '📋 เปิดใบสั่งงาน',
              uri: workOrderLiffUrl
            },
            {
              type: 'uri',
              label: '🔔 อัพเดทสถานะ',
              uri: statusUpdateLiffUrl
            }
          ]
        }
      }
    ];
    
    return pushMessage(adminLineId, messages, true); // Internal OA
  } catch (error) {
    logError('notifyInternalQuotationApproved', error);
    return false;
  }
}

/**
 * แจ้งเตือนลูกค้าเมื่องานเสร็จสมบูรณ์ พร้อมส่งมอบ
 */
function notifyCustomerJobCompleted(jobId, pdfUrl) {
  try {
    const job = getJobById(jobId);
    if (!job || !job.line_user_id) return false;
    
    // ดึงผลทดสอบ
    const testResult = getLatestTestResult(jobId);
    
    // สร้าง LIFF URL สำหรับดูรายงานสุดท้าย
    const finalReportLiffUrl = createLiffUrl(CONFIG.LIFF.FINAL_REPORT, jobId);
    
    const messages = [
      {
        type: 'text',
        text: `🎉 งานซ่อมเสร็จสมบูรณ์แล้ว!\n\n` +
              `หมายเลขงาน: ${job.job_id}\n` +
              `มอเตอร์: ${job.asset_desc}\n\n` +
              `✅ ผ่านการทดสอบไฟฟ้าเรียบร้อย\n` +
              `📦 พร้อมส่งมอบแล้ว`
      },
      createFinalReportFlexMessage(job, testResult),
      {
        type: 'template',
        altText: 'ดูรายงานสุดท้าย',
        template: {
          type: 'buttons',
          text: '📊 ดูรายงานสุดท้าย',
          actions: [
            {
              type: 'uri',
              label: '📊 เปิดรายงาน',
              uri: finalReportLiffUrl
            }
          ]
        }
      }
    ];
    
    if (pdfUrl) {
      messages.push({
        type: 'text',
        text: `📥 ดาวน์โหลด PDF: ${pdfUrl}`
      });
    }
    
    return pushMessage(job.line_user_id, messages, false); // External OA
  } catch (error) {
    logError('notifyCustomerJobCompleted', error);
    return false;
  }
}

/**
 * แจ้งเตือน Internal Team เมื่อทดสอบไฟฟ้าไม่ผ่าน
 */
function notifyInternalTestFailed(jobId, note) {
  try {
    const job = getJobById(jobId);
    if (!job) return false;
    
    const adminLineId = CONFIG.LINE.ADMIN_GROUP_ID || CONFIG.LINE.ADMIN_LINE_ID;
    if (!adminLineId) return false;
    
    const message = {
      type: 'text',
      text: `⚠️ งานทดสอบไฟฟ้าไม่ผ่าน!\n\n` +
            `หมายเลขงาน: ${job.job_id}\n` +
            `ลูกค้า: ${job.customer_name}\n` +
            `มอเตอร์: ${job.asset_desc}\n\n` +
            `หมายเหตุ: ${note || 'ไม่ระบุ'}\n\n` +
            `⚡ ต้องตรวจสอบและแก้ไขเพิ่มเติม`
    };
    
    return pushMessage(adminLineId, message, true); // Internal OA
  } catch (error) {
    logError('notifyInternalTestFailed', error);
    return false;
  }
}

/**
 * แจ้งเตือนลูกค้าเมื่อใบเสนอราคาถูกปฏิเสธ
 */
function notifyCustomerQuotationRejected(jobId, note) {
  try {
    const job = getJobById(jobId);
    if (!job || !job.line_user_id) return false;
    
    const message = {
      type: 'text',
      text: `ขอบคุณที่ให้ความสนใจครับ\n\n` +
            `หมายเลขงาน: ${job.job_id}\n` +
            `เราได้รับการปฏิเสธใบเสนอราคาแล้ว\n\n` +
            (note ? `หมายเหตุ: ${note}\n\n` : '') +
            `หากมีข้อสงสัยหรือต้องการปรับเปลี่ยนใบเสนอราคา\n` +
            `กรุณาติดต่อเราได้ที่ 📞 02-XXX-XXXX`
    };
    
    return pushMessage(job.line_user_id, message, false); // External OA
  } catch (error) {
    logError('notifyCustomerQuotationRejected', error);
    return false;
  }
}

/**
 * แจ้งเตือน Internal Team เมื่อลูกค้าปฏิเสธใบเสนอราคา
 */
function notifyInternalQuotationRejected(jobId, note) {
  try {
    const job = getJobById(jobId);
    if (!job) return false;
    
    const adminLineId = CONFIG.LINE.ADMIN_GROUP_ID || CONFIG.LINE.ADMIN_LINE_ID;
    if (!adminLineId) return false;
    
    const message = {
      type: 'text',
      text: `❌ ลูกค้าปฏิเสธใบเสนอราคา\n\n` +
            `หมายเลขงาน: ${job.job_id}\n` +
            `ลูกค้า: ${job.customer_name}\n` +
            `ยอดรวม: ${formatCurrency(job.grand_total)}\n\n` +
            `เหตุผล: ${note || 'ไม่ระบุ'}\n\n` +
            `📝 ติดต่อลูกค้าเพื่อปรับใบเสนอราคา`
    };
    
    return pushMessage(adminLineId, message, true); // Internal OA
  } catch (error) {
    logError('notifyInternalQuotationRejected', error);
    return false;
  }
}

/**
 * ดึงผลทดสอบล่าสุด
 */
function getLatestTestResult(jobId) {
  try {
    const sheet = getSheet(CONFIG.SHEETS.TEST_RESULTS);
    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    
    // หา test result ล่าสุดของ job นี้
    for (let i = data.length - 1; i > 0; i--) {
      const row = arrayToObject(headers, data[i]);
      if (row.job_id === jobId) {
        return {
          voltage_v: row.voltage_v || 0,
          current_a: row.current_a || 0,
          rpm: row.rpm || 0,
          ir_mohm: row.insulation_resistance_mohm || 0,
          vibration_mm_s: row.vibration_mm_s || 0,
          temperature_c: row.temperature_c || 0,
          pass_fail: row.test_result || 'N/A'
        };
      }
    }
    
    return null;
  } catch (error) {
    logError('getLatestTestResult', error);
    return null;
  }
}

// ========================================
// Test Functions
// ========================================

/**
 * ทดสอบ LINE API
 */
function testLineAPI() {
  Logger.log('=== Testing LINE API ===');
  
  // ทดสอบสร้าง Flex Message
  const job = {
    job_id: 'PDC-202510-0001',
    quotation_no: 'Q-202510-0001',
    company: 'บริษัท ทดสอบ จำกัด',
    customer_name: 'คุณทดสอบ',
    asset_desc: 'มอเตอร์ไฟฟ้า 50 HP',
    final_report_no: 'FR-202510-0001',
    final_report_pdf: 'https://drive.google.com/file/d/xxx'
  };
  
  const items = [
    { title: 'พันขดลวดใหม่', subtotal: 18000 },
    { title: 'เปลี่ยน Bearing', subtotal: 1700 }
  ];
  
  const flexQuotation = createQuotationFlexMessage(job, items, 19700);
  Logger.log('Quotation Flex Message: ' + JSON.stringify(flexQuotation, null, 2));
  
  const flexStatus = createStatusUpdateFlexMessage(job, 'Rewinding', 'กำลังพันขดลวด', []);
  Logger.log('Status Update Flex Message: ' + JSON.stringify(flexStatus, null, 2));
  
  const testResult = {
    voltage_v: 380,
    current_a: 85,
    rpm: 1450,
    ir_mohm: 50,
    vibration_mm_s: 2.8,
    temperature_c: 65,
    pass_fail: 'PASS'
  };
  
  const flexFinal = createFinalReportFlexMessage(job, testResult);
  Logger.log('Final Report Flex Message: ' + JSON.stringify(flexFinal, null, 2));
  
  Logger.log('✅ LINE API Test Complete');
}