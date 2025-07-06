const { google } = require('googleapis');

exports.handler = async (event, context) => {
    // Set CORS headers
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
    };

    // Handle CORS preflight
    if (event.httpMethod === 'OPTIONS') {
        return {
            statusCode: 200,
            headers,
            body: ''
        };
    }

    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            headers,
            body: JSON.stringify({ error: 'Method not allowed' })
        };
    }

    try {
        const { audioData, filename, participantId, videoName } = JSON.parse(event.body);

        if (!audioData || !filename || !participantId || !videoName) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ error: 'Missing required parameters' })
            };
        }

        // Set up Google API credentials
        const auth = new google.auth.GoogleAuth({
            credentials: {
                type: 'service_account',
                project_id: process.env.GOOGLE_PROJECT_ID,
                private_key_id: process.env.GOOGLE_PRIVATE_KEY_ID,
                private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
                client_email: process.env.GOOGLE_CLIENT_EMAIL,
                client_id: process.env.GOOGLE_CLIENT_ID,
                auth_uri: 'https://accounts.google.com/o/oauth2/auth',
                token_uri: 'https://oauth2.googleapis.com/token',
                auth_provider_x509_cert_url: 'https://www.googleapis.com/oauth2/v1/certs',
                client_x509_cert_url: `https://www.googleapis.com/robot/v1/metadata/x509/${encodeURIComponent(process.env.GOOGLE_CLIENT_EMAIL)}`
            },
            scopes: ['https://www.googleapis.com/auth/drive.file']
        });

        const drive = google.drive({ version: 'v3', auth });

        // Convert base64 audio data to buffer
        const audioBuffer = Buffer.from(audioData, 'base64');

        // Create folder structure: Audio/{participantId}/
        const folderName = 'Audio';
        const participantFolder = `${participantId}`;

        // Check if Audio folder exists, create if not
        let audioFolderId;
        const audioFolderSearch = await drive.files.list({
            q: `name='${folderName}' and mimeType='application/vnd.google-apps.folder' and trashed=false`,
            fields: 'files(id, name)'
        });

        if (audioFolderSearch.data.files.length > 0) {
            audioFolderId = audioFolderSearch.data.files[0].id;
        } else {
            const audioFolderCreate = await drive.files.create({
                requestBody: {
                    name: folderName,
                    mimeType: 'application/vnd.google-apps.folder'
                },
                fields: 'id'
            });
            audioFolderId = audioFolderCreate.data.id;
        }

        // Check if participant folder exists under Audio folder, create if not
        let participantFolderId;
        const participantFolderSearch = await drive.files.list({
            q: `name='${participantFolder}' and mimeType='application/vnd.google-apps.folder' and '${audioFolderId}' in parents and trashed=false`,
            fields: 'files(id, name)'
        });

        if (participantFolderSearch.data.files.length > 0) {
            participantFolderId = participantFolderSearch.data.files[0].id;
        } else {
            const participantFolderCreate = await drive.files.create({
                requestBody: {
                    name: participantFolder,
                    mimeType: 'application/vnd.google-apps.folder',
                    parents: [audioFolderId]
                },
                fields: 'id'
            });
            participantFolderId = participantFolderCreate.data.id;
        }

        // Upload the audio file
        const uploadResponse = await drive.files.create({
            requestBody: {
                name: filename,
                parents: [participantFolderId]
            },
            media: {
                mimeType: 'audio/webm',
                body: audioBuffer
            },
            fields: 'id, name, webViewLink'
        });

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                success: true,
                fileId: uploadResponse.data.id,
                fileName: uploadResponse.data.name,
                webViewLink: uploadResponse.data.webViewLink
            })
        };

    } catch (error) {
        console.error('Error uploading audio to Google Drive:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({
                error: 'Failed to upload audio file',
                details: error.message
            })
        };
    }
};
