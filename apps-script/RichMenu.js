/**
 * PDC Smart Motor Repair - Rich Menu Management
 * 
 * สร้างและจัดการ Rich Menu สำหรับ LINE OA
 */

/**
 * สร้าง Rich Menu สำหรับลูกค้า (External OA - P.D.C Service)
 */
function createExternalRichMenu() {
  const token = CONFIG.LINE.EXTERNAL_CHANNEL_ACCESS_TOKEN;
  
  // Rich Menu Object
  const richMenu = {
    size: {
      width: 2500,
      height: 1686
    },
    selected: true,
    name: "PDC Customer Menu",
    chatBarText: "เมนู",
    areas: [
      {
        bounds: {
          x: 0,
          y: 0,
          width: 1250,
          height: 843
        },
        action: {
          type: "message",
          text: "สถานะงาน"
        }
      },
      {
        bounds: {
          x: 1250,
          y: 0,
          width: 1250,
          height: 843
        },
        action: {
          type: "message",
          text: "งานของฉัน"
        }
      },
      {
        bounds: {
          x: 0,
          y: 843,
          width: 1250,
          height: 843
        },
        action: {
          type: "message",
          text: "ติดต่อเจ้าหน้าที่"
        }
      },
      {
        bounds: {
          x: 1250,
          y: 843,
          width: 1250,
          height: 843
        },
        action: {
          type: "message",
          text: "ช่วยเหลือ"
        }
      }
    ]
  };
  
  // Create Rich Menu
  const url = 'https://api.line.me/v2/bot/richmenu';
  
  const options = {
    method: 'post',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + token
    },
    payload: JSON.stringify(richMenu),
    muteHttpExceptions: true
  };
  
  try {
    const response = UrlFetchApp.fetch(url, options);
    const result = JSON.parse(response.getContentText());
    
    if (response.getResponseCode() === 200) {
      const richMenuId = result.richMenuId;
      Logger.log('✅ Rich Menu created: ' + richMenuId);
      Logger.log('📌 Next: Upload image for Rich Menu ID: ' + richMenuId);
      Logger.log('📌 Image size must be: 2500x1686 px');
      
      SpreadsheetApp.getUi().alert(
        '✅ Rich Menu สร้างสำเร็จ!\n\n' +
        'Rich Menu ID: ' + richMenuId + '\n\n' +
        '📌 ขั้นตอนต่อไป:\n' +
        '1. สร้างรูป Rich Menu ขนาด 2500x1686 px\n' +
        '2. Upload รูปด้วย uploadExternalRichMenuImage()\n' +
        '3. Set เป็น default ด้วย setDefaultExternalRichMenu()'
      );
      
      return richMenuId;
    } else {
      Logger.log('❌ Error: ' + response.getContentText());
      SpreadsheetApp.getUi().alert('Error: ' + response.getContentText());
      return null;
    }
  } catch (error) {
    Logger.log('❌ Error creating rich menu: ' + error.message);
    SpreadsheetApp.getUi().alert('Error: ' + error.message);
    return null;
  }
}

/**
 * สร้าง Rich Menu สำหรับพนักงาน (Internal OA)
 */
function createInternalRichMenu() {
  const token = CONFIG.LINE.INTERNAL_CHANNEL_ACCESS_TOKEN;
  
  const richMenu = {
    size: {
      width: 2500,
      height: 1686
    },
    selected: true,
    name: "PDC Staff Menu",
    chatBarText: "เมนู",
    areas: [
      {
        bounds: {
          x: 0,
          y: 0,
          width: 1250,
          height: 843
        },
        action: {
          type: "message",
          text: "งานทั้งหมด"
        }
      },
      {
        bounds: {
          x: 1250,
          y: 0,
          width: 1250,
          height: 843
        },
        action: {
          type: "message",
          text: "สร้างงานใหม่"
        }
      },
      {
        bounds: {
          x: 0,
          y: 843,
          width: 1250,
          height: 843
        },
        action: {
          type: "message",
          text: "แจ้งเตือน"
        }
      },
      {
        bounds: {
          x: 1250,
          y: 843,
          width: 1250,
          height: 843
        },
        action: {
          type: "uri",
          uri: CONFIG.DASHBOARD.LOOKER_STUDIO_URL || 'https://datastudio.google.com'
        }
      }
    ]
  };
  
  const url = 'https://api.line.me/v2/bot/richmenu';
  
  const options = {
    method: 'post',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + token
    },
    payload: JSON.stringify(richMenu),
    muteHttpExceptions: true
  };
  
  try {
    const response = UrlFetchApp.fetch(url, options);
    const result = JSON.parse(response.getContentText());
    
    if (response.getResponseCode() === 200) {
      const richMenuId = result.richMenuId;
      Logger.log('✅ Internal Rich Menu created: ' + richMenuId);
      
      SpreadsheetApp.getUi().alert(
        '✅ Rich Menu (Internal) สร้างสำเร็จ!\n\n' +
        'Rich Menu ID: ' + richMenuId + '\n\n' +
        '📌 อย่าลืม upload รูปและ set default'
      );
      
      return richMenuId;
    } else {
      Logger.log('❌ Error: ' + response.getContentText());
      SpreadsheetApp.getUi().alert('Error: ' + response.getContentText());
      return null;
    }
  } catch (error) {
    Logger.log('❌ Error: ' + error.message);
    SpreadsheetApp.getUi().alert('Error: ' + error.message);
    return null;
  }
}

/**
 * Upload รูป Rich Menu (External)
 * @param {string} richMenuId - Rich Menu ID
 * @param {string} imageUrl - URL ของรูปภาพ (ต้องเป็น public URL)
 */
function uploadExternalRichMenuImageFromUrl(richMenuId, imageUrl) {
  const token = CONFIG.LINE.EXTERNAL_CHANNEL_ACCESS_TOKEN;
  
  // Download image
  const imageBlob = UrlFetchApp.fetch(imageUrl).getBlob();
  
  // Upload to LINE
  const url = `https://api-data.line.me/v2/bot/richmenu/${richMenuId}/content`;
  
  const options = {
    method: 'post',
    headers: {
      'Content-Type': 'image/png',
      'Authorization': 'Bearer ' + token
    },
    payload: imageBlob.getBytes(),
    muteHttpExceptions: true
  };
  
  try {
    const response = UrlFetchApp.fetch(url, options);
    
    if (response.getResponseCode() === 200) {
      Logger.log('✅ Rich Menu image uploaded successfully');
      SpreadsheetApp.getUi().alert('✅ อัพโหลดรูปสำเร็จ!');
      return true;
    } else {
      Logger.log('❌ Error: ' + response.getContentText());
      SpreadsheetApp.getUi().alert('Error: ' + response.getContentText());
      return false;
    }
  } catch (error) {
    Logger.log('❌ Error: ' + error.message);
    SpreadsheetApp.getUi().alert('Error: ' + error.message);
    return false;
  }
}

/**
 * Set Rich Menu เป็น default (External)
 * @param {string} richMenuId - Rich Menu ID
 */
function setDefaultExternalRichMenu(richMenuId) {
  const token = CONFIG.LINE.EXTERNAL_CHANNEL_ACCESS_TOKEN;
  const url = `https://api.line.me/v2/bot/user/all/richmenu/${richMenuId}`;
  
  const options = {
    method: 'post',
    headers: {
      'Authorization': 'Bearer ' + token
    },
    muteHttpExceptions: true
  };
  
  try {
    const response = UrlFetchApp.fetch(url, options);
    
    if (response.getResponseCode() === 200) {
      Logger.log('✅ Default Rich Menu set');
      SpreadsheetApp.getUi().alert('✅ ตั้งค่า Rich Menu เป็น default สำเร็จ!');
      
      // Save to config
      updateRichMenuConfig('EXTERNAL', richMenuId);
      
      return true;
    } else {
      Logger.log('❌ Error: ' + response.getContentText());
      SpreadsheetApp.getUi().alert('Error: ' + response.getContentText());
      return false;
    }
  } catch (error) {
    Logger.log('❌ Error: ' + error.message);
    SpreadsheetApp.getUi().alert('Error: ' + error.message);
    return false;
  }
}

/**
 * Set Rich Menu เป็น default (Internal)
 */
function setDefaultInternalRichMenu(richMenuId) {
  const token = CONFIG.LINE.INTERNAL_CHANNEL_ACCESS_TOKEN;
  const url = `https://api.line.me/v2/bot/user/all/richmenu/${richMenuId}`;
  
  const options = {
    method: 'post',
    headers: {
      'Authorization': 'Bearer ' + token
    },
    muteHttpExceptions: true
  };
  
  try {
    const response = UrlFetchApp.fetch(url, options);
    
    if (response.getResponseCode() === 200) {
      Logger.log('✅ Default Internal Rich Menu set');
      SpreadsheetApp.getUi().alert('✅ ตั้งค่า Rich Menu (Internal) เป็น default สำเร็จ!');
      
      updateRichMenuConfig('INTERNAL', richMenuId);
      
      return true;
    } else {
      Logger.log('❌ Error: ' + response.getContentText());
      return false;
    }
  } catch (error) {
    Logger.log('❌ Error: ' + error.message);
    return false;
  }
}

/**
 * List Rich Menus
 */
function listRichMenus(isInternal = false) {
  const token = isInternal ? 
    CONFIG.LINE.INTERNAL_CHANNEL_ACCESS_TOKEN : 
    CONFIG.LINE.EXTERNAL_CHANNEL_ACCESS_TOKEN;
  
  const url = 'https://api.line.me/v2/bot/richmenu/list';
  
  const options = {
    method: 'get',
    headers: {
      'Authorization': 'Bearer ' + token
    },
    muteHttpExceptions: true
  };
  
  try {
    const response = UrlFetchApp.fetch(url, options);
    const result = JSON.parse(response.getContentText());
    
    if (response.getResponseCode() === 200) {
      Logger.log('Rich Menus:');
      result.richmenus.forEach(menu => {
        Logger.log(`- ${menu.name} (ID: ${menu.richMenuId})`);
      });
      
      return result.richmenus;
    } else {
      Logger.log('Error: ' + response.getContentText());
      return [];
    }
  } catch (error) {
    Logger.log('Error: ' + error.message);
    return [];
  }
}

/**
 * Delete Rich Menu
 */
function deleteRichMenu(richMenuId, isInternal = false) {
  const token = isInternal ? 
    CONFIG.LINE.INTERNAL_CHANNEL_ACCESS_TOKEN : 
    CONFIG.LINE.EXTERNAL_CHANNEL_ACCESS_TOKEN;
  
  const url = `https://api.line.me/v2/bot/richmenu/${richMenuId}`;
  
  const options = {
    method: 'delete',
    headers: {
      'Authorization': 'Bearer ' + token
    },
    muteHttpExceptions: true
  };
  
  try {
    const response = UrlFetchApp.fetch(url, options);
    
    if (response.getResponseCode() === 200) {
      Logger.log('✅ Rich Menu deleted: ' + richMenuId);
      SpreadsheetApp.getUi().alert('✅ ลบ Rich Menu สำเร็จ!');
      return true;
    } else {
      Logger.log('Error: ' + response.getContentText());
      SpreadsheetApp.getUi().alert('Error: ' + response.getContentText());
      return false;
    }
  } catch (error) {
    Logger.log('Error: ' + error.message);
    return false;
  }
}

/**
 * Update Rich Menu ID in Config
 */
function updateRichMenuConfig(type, richMenuId) {
  // TODO: Update CONFIG.LINE.RICH_MENU_INTERNAL or EXTERNAL
  Logger.log(`📝 Update Config.gs: CONFIG.LINE.RICH_MENU_${type} = '${richMenuId}'`);
}

/**
 * Test Rich Menu Setup
 */
function testRichMenuSetup() {
  Logger.log('=== Testing Rich Menu Setup ===');
  
  // 1. Create External Rich Menu
  Logger.log('1. Creating External Rich Menu...');
  const externalMenuId = createExternalRichMenu();
  
  if (externalMenuId) {
    Logger.log('✅ External Rich Menu ID: ' + externalMenuId);
    Logger.log('📌 Next: Upload image and set as default');
  }
  
  Logger.log('=== Test Complete ===');
}
