// Function to get an OAuth 2.0 access token using a Netlify Function.
async function getAccessToken(spreadsheetId, sheetName) {
  try {
    const response = await fetch('/.netlify/functions/get-access-token', { 
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        spreadsheetId: spreadsheetId,
        sheetName: sheetName,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Failed to retrieve access token: ${response.status} - ${errorData.error || 'Unknown error'}`);
    }

    const data = await response.json();
    return data.access_token;
  } catch (error) {
    console.error('Error getting access token:', error);
    throw error;
  }
}

// Function to get data from the sheet
async function getSheetData(spreadsheetId, sheetName) {
  try {
    const accessToken = await getAccessToken(spreadsheetId, sheetName);
    const response = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${sheetName}`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      }
    );
    const data = await response.json();
    return data.values;
  } catch (error) {
    console.error('Error fetching data:', error);
    throw error;
  }
}

// Function to append data to the sheet
async function appendSheetData(spreadsheetId, sheetName, newData) {
  try {
    const accessToken = await getAccessToken(spreadsheetId, sheetName);
    const response = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${sheetName}:append?valueInputOption=RAW&insertDataOption=INSERT_ROWS`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          values: [newData],
        }),
      }
    );
    const result = await response.json();
    if (result.error) {
      console.error('Error appending data:', result.error);
      throw new Error('Failed to append data to sheet.');
    }
    return result;
  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
}