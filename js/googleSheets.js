// Google Sheets specific functions
// Note: This file depends on googleApi.js for token management

// Function to get data from the sheet
async function getSheetData(spreadsheetId, sheetName) {
    try {
        const accessToken = await getAccessToken();
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
        const accessToken = await getAccessToken();
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

// Function to update specific cells in the sheet
async function updateSheetData(spreadsheetId, range, values) {
    try {
        const accessToken = await getAccessToken();
        const response = await fetch(
            `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}?valueInputOption=RAW`,
            {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${accessToken}`,
                },
                body: JSON.stringify({
                    values: values,
                }),
            }
        );
        const result = await response.json();
        if (result.error) {
            console.error('Error updating data:', result.error);
            throw new Error('Failed to update data in sheet.');
        }
        return result;
    } catch (error) {
        console.error('Error:', error);
        throw error;
    }
}
