


// filepath: /home/victor/projects/movement-to-onomatopoeia/netlify/functions/fetch-drive-files.js
const { google } = require('googleapis');

exports.handler = async () => {
  try {
    // Read service account creds from environment variable (or from a file)
    const credentials = JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS_CONTENT);

    // Initialize the JWT auth
    const auth = new google.auth.JWT(
      credentials.client_email,
      null,
      credentials.private_key,
      ['https://www.googleapis.com/auth/drive.readonly']
    );

    await auth.authorize();

    const drive = google.drive({ version: 'v3', auth });
    // Replace {FOLDER_ID} with the actual folder ID from your Drive
    const { data } = await drive.files.list({
      q: `'{FOLDER_ID}' in parents and trashed=false`,
      fields: 'files(id, name)',
    });

    return {
      statusCode: 200,
      body: JSON.stringify(data.files || []),
    };
  } catch (error) {
    return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
  }
};