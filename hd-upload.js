/**
 * ==========================================================================
 * Tasveer by Prince Studio - Google Drive & High-Speed HD Photo Engine (hd-upload.js)
 * Streams customer print photos directly to Google Drive Folder & Cloud DB
 * ==========================================================================
 */

(function (window) {
    'use strict';

    // Target Prince Studio Owner Google Drive Account & Folder
    const PRINCE_STUDIO_GMAIL = 'Princestudioswm@gmail.com';
    const GDRIVE_FOLDER_ID = '1qMAhARFgVLQNlxDXskipGaZFrTBXxYnT';
    const GDRIVE_FOLDER_URL = 'https://drive.google.com/drive/folders/1qMAhARFgVLQNlxDXskipGaZFrTBXxYnT?usp=drive_link';

    // Google Drive Webhook Endpoint (Live Princestudioswm@gmail.com Webhook)
    const GDRIVE_WEBHOOK_URL = 'https://script.google.com/macros/s/AKfycbzH5Rgix9-PYvIdlrgrLnzvB6G24EnuIHvwgcESm-c-WesBWCiCusgCNOwqQFk_CKtZ/exec';

    // Default Fallback High-Speed Cloud Service
    const CLOUDINARY_CLOUD_NAME = 'tasveer-prince-studio';
    const CLOUDINARY_UPLOAD_PRESET = 'unsigned_tasveer_hd';
    const DIRECT_CLOUD_ENDPOINT = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`;

    const HDPhotoEngine = {
        ownerAccount: PRINCE_STUDIO_GMAIL,
        folderId: GDRIVE_FOLDER_ID,
        folderUrl: GDRIVE_FOLDER_URL,

        /**
         * Process customer photo selection & stream to Google Drive
         * @param {File} file - Raw File object
         * @param {Function} onPreviewReady - Callback for 0.1s fast screen preview
         * @param {Function} onComplete - Callback with Google Drive URL & metadata
         */
        processCustomerPhoto: async function (file, onPreviewReady, onComplete) {
            if (!file) return;

            console.log(`[Google Drive HD Engine] Uploading: ${file.name} (${(file.size / (1024 * 1024)).toFixed(2)} MB)`);

            // 1. STREAM A: Instant 0.1s Screen Preview for Customer
            const reader = new FileReader();
            reader.onload = function (e) {
                const previewUrl = e.target.result;
                if (typeof onPreviewReady === 'function') {
                    onPreviewReady(previewUrl, file.name);
                }
            };
            reader.readAsDataURL(file);

            // 2. STREAM B: Direct Upload to Google Drive / High-Speed Cloud
            try {
                const result = await HDPhotoEngine.uploadToGoogleDrive(file);
                if (typeof onComplete === 'function') {
                    onComplete(result);
                }
            } catch (err) {
                console.warn('[Google Drive HD Engine] Fallback stream:', err);
                const fallbackReader = new FileReader();
                fallbackReader.onload = function (e) {
                    if (typeof onComplete === 'function') {
                        onComplete({
                            hdUrl: e.target.result,
                            gdriveUrl: null,
                            originalName: file.name,
                            fileSize: (file.size / (1024 * 1024)).toFixed(2) + ' MB',
                            isGoogleDrive: false
                        });
                    }
                };
                fallbackReader.readAsDataURL(file);
            }
        },

        // Stream raw photo payload to Google Drive Webhook
        uploadToGoogleDrive: async function (file, orderId = 'NEW_ORDER') {
            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = async function (e) {
                    const base64Data = e.target.result.split(',')[1];
                    const mimeType = file.type || 'image/jpeg';
                    const fileName = `ORDER_${orderId}_${Date.now()}_${file.name}`;

                    try {
                        // Send payload to Google Drive Apps Script receiver
                        const payload = {
                            filename: fileName,
                            mimeType: mimeType,
                            fileData: base64Data,
                            folderId: GDRIVE_FOLDER_ID,
                            folderUrl: GDRIVE_FOLDER_URL,
                            targetFolderId: GDRIVE_FOLDER_ID,
                            folderName: 'Tasveer_Customer_Print_Orders'
                        };

                        // Primary POST to Google Drive Receiver
                        const response = await fetch(GDRIVE_WEBHOOK_URL, {
                            method: 'POST',
                            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
                            body: JSON.stringify(payload)
                        });

                        if (response.ok) {
                            const json = await response.json();
                            console.log('[Google Drive HD Engine] Saved directly to Google Drive:', json.fileUrl);
                            resolve({
                                hdUrl: json.fileUrl || e.target.result,
                                gdriveUrl: json.fileUrl,
                                originalName: file.name,
                                fileSize: (file.size / (1024 * 1024)).toFixed(2) + ' MB',
                                isGoogleDrive: true
                            });
                            return;
                        }
                    } catch (gdriveErr) {
                        console.warn('[Google Drive HD Engine] Drive webhook fallback to Cloudinary:', gdriveErr.message);
                    }

                    // Fallback to Cloudinary if Google Drive Webhook URL is pending setup
                    try {
                        const formData = new FormData();
                        formData.append('file', file);
                        formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
                        const cRes = await fetch(DIRECT_CLOUD_ENDPOINT, { method: 'POST', body: formData });
                        if (cRes.ok) {
                            const cData = await cRes.json();
                            resolve({
                                hdUrl: cData.secure_url,
                                gdriveUrl: cData.secure_url,
                                originalName: file.name,
                                fileSize: (file.bytes / (1024 * 1024)).toFixed(2) + ' MB',
                                isGoogleDrive: false
                            });
                            return;
                        }
                    } catch (cErr) {
                        console.warn('[Google Drive HD Engine] Cloudinary fallback:', cErr);
                    }

                    // Base64 local fallback
                    resolve({
                        hdUrl: e.target.result,
                        gdriveUrl: null,
                        originalName: file.name,
                        fileSize: (file.size / (1024 * 1024)).toFixed(2) + ' MB',
                        isGoogleDrive: false
                    });
                };

                reader.onerror = reject;
                reader.readAsDataURL(file);
            });
        },

        // Trigger direct download of Original HD Print file
        downloadOriginalHDFile: function (hdUrl, orderId, originalName = 'PRINT_PHOTO.jpg') {
            if (!hdUrl) {
                alert('No photo file attached to this order.');
                return;
            }

            console.log(`[Google Drive HD Engine] Opening photo for Order ${orderId}...`);

            if (hdUrl.includes('drive.google.com') || hdUrl.includes('script.google.com')) {
                window.open(hdUrl, '_blank');
                return;
            }

            if (hdUrl.startsWith('data:')) {
                const link = document.createElement('a');
                link.href = hdUrl;
                link.download = `TASVEER_ORDER_${orderId}_ORIGINAL_HD_${originalName}`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                return;
            }

            fetch(hdUrl)
                .then(res => res.blob())
                .then(blob => {
                    const blobUrl = URL.createObjectURL(blob);
                    const link = document.createElement('a');
                    link.href = blobUrl;
                    link.download = `TASVEER_ORDER_${orderId}_ORIGINAL_HD_${originalName}`;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
                })
                .catch(() => {
                    window.open(hdUrl, '_blank');
                });
        }
    };

    window.HDPhotoEngine = HDPhotoEngine;

})(window);
