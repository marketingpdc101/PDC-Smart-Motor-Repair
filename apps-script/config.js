/**
 * PDC Smart Motor Repair - Configuration
 * 
 * แก้ไขค่า Configuration ตรงนี้หลังจากสร้าง LINE OA, LIFF, และ Google Docs Templates
 */

const CONFIG = {
  // ========================================
  // LINE Configuration
  // ========================================
  LINE: {
    // LINE Official Account - Internal (พนักงาน)
    INTERNAL_CHANNEL_ACCESS_TOKEN: 'm/MmqpcxQBYvIcp1GldZSRvTUqoVOlNdXBcMj7qrFniIEICKVZ3lR3UdMO1KcQehU+kYwNsW20w/IGDlmyXPggupiG/sIxgKJ6/3sNENQDGcGwDpl2TjwMru+8BRJHutsVNZHNwvYY++2eJUrd3j6gdB04t89/1O/w1cDnyilFU=',
    INTERNAL_CHANNEL_SECRET: '5b3f68c142ea9607cba34c5bd7970a27',
    
    // LINE Official Account - External (ลูกค้า - P.D.C Service)
    EXTERNAL_CHANNEL_ACCESS_TOKEN: 't8XoQTz7YT0tS6/r0lSAVs0GrzNsJRNe+hp5z3ShjCidGsJLpNBsZXKhJI/vGSO3iJ0LFO9V0r4IXi0QK+3F1ji9+HkqIYkSeVfIAa+tj0cXCV3b55YJmZxoXa9CCJ1GD9VaR4776d8znmQy+B2u/gdB04t89/1O/w1cDnyilFU=',
    EXTERNAL_CHANNEL_SECRET: 'ea0b3942437efe393a544e748670448c',
    
    // LINE Messaging API Endpoint
    MESSAGING_API_URL: 'https://api.line.me/v2/bot/message',
    PUSH_API_URL: 'https://api.line.me/v2/bot/message/push',
    REPLY_API_URL: 'https://api.line.me/v2/bot/message/reply',
    
    // Rich Menu IDs (จะได้หลังสร้าง Rich Menu)
    RICH_MENU_INTERNAL: 'richmenu-e873969384f2b7647d5621c2a5148b68',
    RICH_MENU_EXTERNAL: 'richmenu-a0dac4dc9ed57499382c05f9f3a836dd'
  },
  
  // ========================================
  // LIFF (LINE Front-end Framework) IDs
  // ========================================
  LIFF: {
    JOB_CREATION: '2008297943-J69z7PPp',       // สร้างงานใหม่ (Planner)
    QUOTATION: '2008297943-16G8DPPz',          // ใบเสนอราคา
    WORK_ORDER: '2008297943-goJa0bbw',         // ใบสั่งงาน (ดูอย่างเดียว)
    STATUS_UPDATE: '2008297943-n63AYqqD',      // อัพเดทสถานะ
    FINAL_TEST: '2008297943-lvmPvjjb',         // บันทึกผลทดสอบ
    FINAL_REPORT: '2008297943-RqO9znnK'        // รายงานสุดท้าย (Final Update)
  },
  
  // ========================================
  // Google Sheets Configuration
  // ========================================
  SHEETS: {
    // Spreadsheet ID (จะได้จาก URL ของ Google Sheets)
    SPREADSHEET_ID: SpreadsheetApp.getActiveSpreadsheet().getId(),
    
    // Sheet Names
    JOBS: 'Jobs',
    JOB_ITEMS: 'JobItems',
    MEDIA: 'Media',
    EVENTS: 'Events',
    APPROVALS: 'Approvals',
    TEST_RESULTS: 'TestResults',
    USERS: 'Users',
    CUSTOMERS: 'Customers',
    NOTIFICATIONS: 'Notifications',
    CONFIG_SHEET: 'Config'
  },
  
  // ========================================
  // Google Docs Template IDs
  // ========================================
  TEMPLATES: {
    QUOTATION: '1K34f38be1BhmC6w44rI9XiKX5T4wc6cntm3CJ1P0fQw',
    WORK_ORDER: '1A53Dbo37fnAizOk8-IJwqSmSt_YkclFmysIB81dGmBg',
    FINAL_REPORT: '18GJhYLc4vs3eYFrc8XPsDn6Xs2bw6chmOteYTzHMExY'
  },
  
  // ========================================
  // Google Drive Folder IDs
  // ========================================
  DRIVE_FOLDERS: {
    ROOT: '1jpc4HSGNQMWFeTSJLzHJ1MhtqNfmcXuk',
    QUOTATIONS: '1Wwb74NdxY3Pz8PK9UE0zOZk49SVq96KM',
    WORK_ORDERS: '15qkhVWO-uEI1vHrH1dPZCPckeZ6utLFt',
    FINAL_REPORTS: '1FYc5bE8TkYGXs5TLG2P7oO74jitTG95I',
    PHOTOS_BEFORE: '1MzfKgNd2VSLw_2kqA-GZWM90hvMgavIq',
    PHOTOS_PROCESS: '1VRqcau0qXzLbCPBa1wic2lRT7xQfF5EH',
    PHOTOS_AFTER: '1g9GgTlCwczkp0848AhCy3OdzIlmSPcdi',
    TEST_RESULTS: '1ezyzblrU4uPoTjSgEtwZaVMsk3oFiKS4',
    DELIVERY: '1qRnIKI2xCSxYz69LLEqQj9Um2B60g8fx'
  },
  
  // ========================================
  // Job Status & Milestones
  // ========================================
  STATUS: {
    DRAFT: 'Draft',
    PENDING_APPROVAL: 'PendingApproval',
    APPROVED: 'Approved',
    IN_PROGRESS: 'In-Progress',
    COMPLETED: 'Completed',
    DELIVERED: 'Delivered',
    CANCELLED: 'Cancelled'
  },
  
  MILESTONES: [
    'Received',        // รับงาน
    'Inspection',      // ตรวจสอบ
    'Disassembly',     // ถอดแยกชิ้นส่วน
    'Burnout',         // เผาขดลวด
    'Core',            // ทำ Core
    'Rewinding',       // พันขดลวดใหม่
    'Varnish',         // เคลือบ Varnish
    'Assembly',        // ประกอบ
    'Balancing',       // ถ่วงแบลานซ์
    'Painting',        // พ่นสี
    'QC',              // ตรวจสอบคุณภาพ
    'Final_Test',      // ทดสอบไฟฟ้า
    'Packing',         // บรรจุหีบห่อ
    'Delivery'         // ส่งมอบ
  ],
  
  // ========================================
  // User Roles
  // ========================================
  ROLES: {
    ADMIN: 'admin',
    MANAGER: 'manager',
    PLANNER: 'planner',
    SALES: 'sales',
    ELECTRICAL: 'electrical',
    MECHANICAL: 'mechanical',
    QC: 'qc',
    PACKING: 'packing'
  },
  
  // ========================================
  // Document Numbering Formats
  // ========================================
  NUMBERING: {
    JOB_PREFIX: 'PDC',
    QUOTATION_PREFIX: 'Q',
    WORK_ORDER_PREFIX: 'WO',
    FINAL_REPORT_PREFIX: 'FR',
    DIGIT_LENGTH: 4  // จำนวนหลักของเลขที่ (0001, 0002, ...)
  },
  
  // ========================================
  // Business Rules
  // ========================================
  BUSINESS: {
    // จำนวนรายการซ่อมสูงสุดต่องาน
    MAX_JOB_ITEMS: 20,
    
    // จำนวนรูปภาพสูงสุดต่อรายการ
    MAX_PHOTOS_PER_ITEM: 3,
    
    // ระยะเวลา Lead Time เริ่มต้น (วัน)
    DEFAULT_LEAD_TIME_DAYS: 7,
    
    // VAT %
    VAT_PERCENTAGE: 7,
    
    // Quotation Valid Days
    QUOTATION_VALID_DAYS: 30,
    
    // Auto-cancel pending approvals after (days)
    AUTO_CANCEL_PENDING_DAYS: 14,
    
    // Rate limit for status updates (minutes)
    STATUS_UPDATE_RATE_LIMIT_MINUTES: 5
  },
  
  // ========================================
  // Notification Settings
  // ========================================
  NOTIFICATIONS: {
    // ส่งการแจ้งเตือนไปหา
    NOTIFY_CUSTOMER_ON_QUOTE: true,
    NOTIFY_CUSTOMER_ON_STATUS_UPDATE: true,
    NOTIFY_CUSTOMER_ON_FINAL_REPORT: true,
    NOTIFY_INTERNAL_ON_APPROVAL: true,
    NOTIFY_INTERNAL_ON_MILESTONE_CHANGE: true,
    
    // LINE Notify (optional - สำหรับแจ้งเตือนแบบกลุ่ม)
    LINE_NOTIFY_TOKEN: 'YOUR_LINE_NOTIFY_TOKEN',
    
    // Email Notifications (optional)
    ENABLE_EMAIL_NOTIFICATIONS: false,
    NOTIFICATION_EMAIL: 'notifications@pdc-motor.com'
  },
  
  // ========================================
  // Dashboard & Analytics
  // ========================================
  DASHBOARD: {
    LOOKER_STUDIO_URL: 'YOUR_LOOKER_STUDIO_DASHBOARD_URL',
    ENABLE_ANALYTICS: true
  },
  
  // ========================================
  // Debug & Logging
  // ========================================
  DEBUG: {
    ENABLE_LOGGING: true, // ✅ เปิดเพื่อ log ลง Sheet
    LOG_LEVEL: 'INFO', // ✅ แสดง INFO level
    LOG_WEBHOOK_PAYLOADS: false, // ปิดเพื่อความเร็ว
    SKIP_SIGNATURE_VERIFICATION: true, // ตั้งเป็น true ชั่วคราวระหว่างทดสอบ (Apps Script อ่าน header ไม่ได้)
    NOTIFY_ERRORS: false // ปิด notification
  },
  
  // ========================================
  // Web App URL (Production - ใช้ URL นี้กับ LIFF)
  // ========================================
  WEB_APP_URL: 'https://script.google.com/macros/s/AKfycbzbmnu29mXdvX9bJlHJLSaNo7B78uEbuBgIfNOr_8S9TR3BSGuNLrDIgyw6YijvnmT0/exec'
};

/**
 * Get configuration value by key path
 * @param {string} keyPath - Dot notation path (e.g., 'LINE.INTERNAL_CHANNEL_ACCESS_TOKEN')
 * @return {*} Configuration value
 */
function getConfig(keyPath) {
  const keys = keyPath.split('.');
  let value = CONFIG;
  
  for (const key of keys) {
    if (value && typeof value === 'object' && key in value) {
      value = value[key];
    } else {
      return null;
    }
  }
  
  return value;
}

/**
 * Validate configuration
 * @return {object} Validation result
 */
function validateConfig() {
  const errors = [];
  const warnings = [];
  
  // Check LINE tokens
  if (CONFIG.LINE.INTERNAL_CHANNEL_ACCESS_TOKEN.includes('YOUR_')) {
    errors.push('LINE Internal Channel Access Token ยังไม่ได้ตั้งค่า');
  }
  
  if (CONFIG.LINE.EXTERNAL_CHANNEL_ACCESS_TOKEN.includes('YOUR_')) {
    errors.push('LINE External Channel Access Token ยังไม่ได้ตั้งค่า');
  }
  
  // Check LIFF IDs
  Object.keys(CONFIG.LIFF).forEach(key => {
    if (CONFIG.LIFF[key].includes('YOUR_')) {
      warnings.push(`LIFF ${key} ยังไม่ได้ตั้งค่า`);
    }
  });
  
  // Check Template IDs
  Object.keys(CONFIG.TEMPLATES).forEach(key => {
    if (CONFIG.TEMPLATES[key].includes('YOUR_')) {
      warnings.push(`Template ${key} ยังไม่ได้ตั้งค่า`);
    }
  });
  
  return {
    isValid: errors.length === 0,
    errors: errors,
    warnings: warnings
  };
}

/**
 * Test configuration by logging to console
 */
function testConfig() {
  const validation = validateConfig();
  
  Logger.log('=== PDC Configuration Test ===');
  Logger.log('Valid: ' + validation.isValid);
  
  if (validation.errors.length > 0) {
    Logger.log('\nErrors:');
    validation.errors.forEach(err => Logger.log('  ❌ ' + err));
  }
  
  if (validation.warnings.length > 0) {
    Logger.log('\nWarnings:');
    validation.warnings.forEach(warn => Logger.log('  ⚠️  ' + warn));
  }
  
  Logger.log('\nSpreadsheet ID: ' + CONFIG.SHEETS.SPREADSHEET_ID);
}