// Google API authentication and operations

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
            throw new Error(`API error: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        
        if (!data.access_token) {
            throw new Error('Invalid response format: missing access_token');
        }
        
        // Cache the token for 50 minutes (tokens expire in 1 hour)
        tokenCache.token = data.access_token;
        tokenCache.expiry = new Date(Date.now() + 50 * 60 * 1000);
        
        return data.access_token;
    } catch (error) {
        console.error('Error getting access token:', error);
        // Add retry logic for network errors
        if (error.message.includes('NetworkError') || error.message.includes('Failed to fetch')) {
            console.log('Network error, retrying in 3 seconds...');
            await new Promise(resolve => setTimeout(resolve, 3000));
            return getAccessToken(spreadsheetId, sheetName); // Retry once
        }
        throw error;
    }
}

// Function to upload audio file to Google Drive
async function uploadAudioFile(audioBlob, participantId, videoName, onomatopoeia, timestamp, spreadsheetId, sheetName) {
    try {
        // First get an access token (reuse the existing token caching system)
        const accessToken = await getAccessToken(spreadsheetId, sheetName);
        
        // Convert blob to base64 more efficiently using FileReader
        const base64Audio = await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
                const base64String = reader.result.split(',')[1]; // Remove data:audio/webm;base64, prefix
                resolve(base64String);
            };
            reader.onerror = reject;
            reader.readAsDataURL(audioBlob);
        });
        
        // Generate filename: participant_video_onomatopoeia_timestamp.webm
        const sanitizedOnomatopoeia = onomatopoeia.replace(/[^a-zA-Z0-9]/g, '_');
        const filename = `${participantId}_${videoName.replace('.mp4', '')}_${sanitizedOnomatopoeia}_${timestamp}.webm`;
        
        const response = await fetch('/.netlify/functions/upload-audio', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                audioData: base64Audio,
                filename: filename,
                participantId: participantId,
                videoName: videoName,
                accessToken: accessToken
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        
        if (result.success) {
            return result.fileName;
        } else {
            throw new Error(result.error || 'Upload failed');
        }
    } catch (error) {
        console.error('Error uploading audio:', error);
        throw error;
    }
}
