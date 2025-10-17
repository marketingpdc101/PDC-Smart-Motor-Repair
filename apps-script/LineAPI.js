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