/**
 * ==============================================================================
 * TASVEER BY PRINCE STUDIO - GOOGLE DRIVE AUTO-UPLOAD APPS SCRIPT
 * Target Studio Account: Princestudioswm@gmail.com
 * Target Studio Folder: https://drive.google.com/drive/folders/1qMAhARFgVLQNlxDXskipGaZFrTBXxYnT?usp=drive_link
 * Target Folder ID: 1qMAhARFgVLQNlxDXskipGaZFrTBXxYnT
 * ==============================================================================
 * 
 * DEPLOYMENT INSTRUCTIONS:
 * 1. Open https://script.google.com while signed into Princestudioswm@gmail.com
 * 2. Create a New Project named: "Tasveer Studio Google Drive Uploader"
 * 3. Replace all code in Code.gs with this exact script.
 * 4. Click "Deploy" -> "New deployment"
 * 5. Select type: "Web app"
 * 6. Set Description: "Tasveer Studio Customer Photo Receiver"
 * 7. Set "Execute as": "Me (Princestudioswm@gmail.com)"
 * 8. Set "Who has access": "Anyone" (crucial so website customers can upload)
 * 9. Click "Deploy" and authorize the permissions.
 * 10. The Web App URL is already connected to the website!
 */

const TARGET_FOLDER_ID = '1qMAhARFgVLQNlxDXskipGaZFrTBXxYnT';

function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) {
      return ContentService.createTextOutput(JSON.stringify({
        status: 'error',
        message: 'No POST data received'
      })).setMimeType(ContentService.MimeType.JSON);
    }

    const data = JSON.parse(e.postData.contents);
    const filename = data.filename || ('ORDER_PHOTO_' + new Date().getTime() + '.jpg');
    const mimeType = data.mimeType || 'image/jpeg';
    const folderId = data.folderId || data.targetFolderId || TARGET_FOLDER_ID;

    // 1. Locate or create target folder
    let targetFolder;
    try {
      targetFolder = DriveApp.getFolderById(folderId);
    } catch (fErr) {
      // Fallback to name search or root if ID not found
      const folders = DriveApp.getFoldersByName('Tasveer_Customer_Print_Orders');
      if (folders.hasNext()) {
        targetFolder = folders.next();
      } else {
        targetFolder = DriveApp.createFolder('Tasveer_Customer_Print_Orders');
      }
    }

    // 2. Decode Base64 image
    let rawBase64 = data.fileData || '';
    if (rawBase64.indexOf(',') > -1) {
      rawBase64 = rawBase64.split(',')[1];
    }
    const decodedBytes = Utilities.base64Decode(rawBase64);
    const blob = Utilities.newBlob(decodedBytes, mimeType, filename);

    // 3. Save file directly inside the studio folder
    const file = targetFolder.createFile(blob);
    
    // 4. Set public read access so studio lab software and admin can view high-res original
    try {
      file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    } catch(shareErr) {}

    const fileUrl = file.getUrl();
    const downloadUrl = file.getDownloadUrl ? file.getDownloadUrl() : fileUrl;

    return ContentService.createTextOutput(JSON.stringify({
      status: 'success',
      fileUrl: fileUrl,
      downloadUrl: downloadUrl,
      fileId: file.getId(),
      filename: filename,
      folderId: targetFolder.getId(),
      folderUrl: targetFolder.getUrl()
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      status: 'error',
      message: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  return ContentService.createTextOutput(JSON.stringify({
    status: 'online',
    service: 'Tasveer by Prince Studio Google Drive Uploader',
    targetFolder: TARGET_FOLDER_ID,
    timestamp: new Date().toISOString()
  })).setMimeType(ContentService.MimeType.JSON);
}
