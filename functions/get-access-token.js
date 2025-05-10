const { google } = require('googleapis');
const { JWT } = require('google-auth-library');

//  Replace with the path to your service account credentials file (in Netlify)
const credentialsPath = './credentials.json'; //  Make sure this path is correct in your Netlify environment!

/**
 * Netlify Function to obtain an access token using a service account.
 *
 * @param {object} event Netlify event object.
 * @param {object} context Netlify context object.
 * @param {function} callback Netlify callback function.
 */
exports.handler = async (event, context, callback) => {
  try {
    // 1.  Parse  spreadsheet and sheet name from the request body
    const { spreadsheetId, sheetName } = JSON.parse(event.body);

    if (!spreadsheetId || !sheetName) {
      return callback(null, {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing spreadsheetId or sheetName in request body' }),
      });
    }
    // 2. Create a JWT client using the service account credentials.
    const auth = new JWT({
      keyFile: credentialsPath,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'], // Add the Sheets API scope
    });

    // 3. Authorize the client to get an access token.
    const client = await auth.getClient();
    const accessTokenResponse = await client.getAccessToken();
    const accessToken = accessTokenResponse.token;

    // 4. Send the access token in the response.
    callback(null, {
      statusCode: 200,
      body: JSON.stringify({ access_token: accessToken }),
    });
  } catch (error) {
    console.error('Error getting access token:', error);
    callback(null, {
      statusCode: 500,
      body: JSON.stringify({
        error: error.message,
        message: 'Failed to retrieve access token using service account.',
      }),
    });
  }
};
