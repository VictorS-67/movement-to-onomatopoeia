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
        const selectedVideosData = await getSheetData(spreadsheetId, sheetName);
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

// Utility function for CSV parsing
function parseCSV(data) {
    const headers = data[0];
    return data.slice(1).map(line => {
        return headers.reduce((obj, header, index) => {
            obj[header] = line[index];
            return obj;
        }, {});
    });
}

// Function to check if participant exists by email
async function checkParticipantExists(spreadsheetId, ParticipantSheet, email) {
    try {
        const participantsData = await getSheetData(spreadsheetId, ParticipantSheet);
        if (!participantsData || participantsData.length === 0) {
            return null;
        }

        // Skip header row and find participant by email (case-insensitive)
        const participants = participantsData.slice(1);
        for (const row of participants) {
            if (row[1] && row[1].toLowerCase() === email.toLowerCase()) { // Email is in column B (index 1)
                return {
                    participantId: row[0], // Column A
                    email: row[1],         // Column B
                    name: row[2],          // Column C
                    age: row[3],           // Column D
                    gender: row[4],        // Column E
                    movementPractice: row[5], // Column F
                    nativeLanguage: row[6],   // Column G
                    registrationTimestamp: row[7] // Column H
                };
            }
        }
        return null;
    } catch (error) {
        console.error('Error checking participant:', error);
        throw error;
    }
}

// Function to save new participant
async function saveNewParticipant(spreadsheetId, ParticipantSheet, participantData) {
    try {
        // First get the current highest participant ID
        const participantsData = await getSheetData(spreadsheetId, ParticipantSheet);
        
        let maxId = 0;
        if (participantsData && participantsData.length > 1) {
            // Skip header row and find max ID
            const participants = participantsData.slice(1);
            participants.forEach(row => {
                const id = parseInt(row[0]);
                if (!isNaN(id) && id > maxId) {
                    maxId = id;
                }
            });
        }
        
        const newParticipantId = maxId + 1;
        
        // Prepare data for the sheet
        const newData = [
            newParticipantId,                              // Column A: Participant ID
            participantData.email,                         // Column B: Email
            participantData.name,                          // Column C: Name
            participantData.age,                           // Column D: Age
            participantData.gender,                        // Column E: Gender
            participantData.movementPractice || "",        // Column F: Movement Practice
            participantData.nativeLanguage,                // Column G: Native Language
            obtainDate()                                   // Column H: Registration Timestamp
        ];
        
        const appendResult = await appendSheetData(spreadsheetId, ParticipantSheet, newData);
        
        if (!appendResult) {
            throw new Error("Failed to save participant to sheet");
        }
        
        return {
            participantId: newParticipantId.toString(),
            email: participantData.email,
            name: participantData.name,
            age: participantData.age,
            gender: participantData.gender,
            movementPractice: participantData.movementPractice,
            nativeLanguage: participantData.nativeLanguage,
            registrationTimestamp: newData[7]
        };
    } catch (error) {
        console.error('Error saving new participant:', error);
        throw error;
    }
}
