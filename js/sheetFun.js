// Token cache with expiration
let tokenCache = {
    token: null,
    expiry: null
};

// Function to get an OAuth 2.0 access token with caching
async function getAccessToken(spreadsheetId, sheetName) {
    try {
        // Check if we have a valid cached token
        if (tokenCache.token && tokenCache.expiry && new Date() < tokenCache.expiry) {
            return tokenCache.token;
        }

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
        
        // Cache the token for 50 minutes (tokens expire in 1 hour)
        tokenCache.token = data.access_token;
        tokenCache.expiry = new Date(Date.now() + 50 * 60 * 1000);
        
        return data.access_token;
    } catch (error) {
        console.error('Error getting access token:', error);
        // Clear cache on error
        tokenCache = { token: null, expiry: null };
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