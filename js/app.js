// Application-specific business logic for the onomatopoeia study
// Note: This file contains shared utilities used by both index and survey pages

// function to fetch the list of video files
async function fetchFilesInFolder() {
    try {
        const response = await fetch('/.netlify/functions/fetch-files');
        if (!response.ok) {
            throw new Error(`Failed to fetch files: ${response.statusText}`);
        }
        return await response.json();
    } catch (error) {
        console.error("Error:", error.message);
        return [];
    }
}

// Function to load selected videos from the Google Sheet
async function loadSelectedVideos(spreadsheetId, sheetName, videoButtonsContainer) {
    try {
        const selectedVideosData = await googleSheetsService.getSheetData(spreadsheetId, sheetName);
        if (!selectedVideosData || selectedVideosData.length === 0) {
            throw new Error('No data found in SelectedVideos sheet');
        }
        
        // Extract video names (skip header row if present)
        const videoNames = selectedVideosData.slice(1).map(row => row[0]).filter(name => name);
        
        // Sort videos alphabetically and add .mp4 extension in one step
        const videoNamesWithExtension = videoNames
            .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
            .map(name => `${name}.mp4`);

        createVideoButtons(videoNamesWithExtension, videoButtonsContainer);
    } catch (error) {
        console.error("Error loading selected videos:", error);
        // Fallback to local videos if sheet reading fails
        try {
            const videoNames = await fetchFilesInFolder();
            createVideoButtons(videoNames, videoButtonsContainer);
        } catch (fallbackError) {
            console.error("Fallback also failed:", fallbackError);
        }
    }
}

// Reusable function to create video buttons
function createVideoButtons(videoNames, container) {
    if (!container) {
        console.error('Video button container not found');
        return;
    }
    
    videoNames.forEach((videoName, index) => {
        const button = document.createElement('button');
        button.className = 'video-button button';
        button.dataset.video = `videos/${videoName}`;
        button.textContent = videoName;
        
        // Mark first button as active by default
        if (index === 0) {
            button.classList.add('active');
        }
        
        container.appendChild(button);
    });
}
