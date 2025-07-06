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
        
        // Sort videos alphabetically
        videoNames.sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));

        // add format to video names
        videoNames.forEach((name, index) => {videoNames[index] = `${name}.mp4`;});

        videoNames.forEach((videoName, index) => {
            const button = document.createElement('button');
            button.className = 'video-button button';
            button.dataset.video = `videos/${videoName}`;
            button.textContent = videoName;
            
            // Mark first button as active by default
            if (index === 0) {
                button.classList.add('active');
            }
            
            videoButtonsContainer.appendChild(button);
        });
    } catch (error) {
        console.error("Error loading selected videos:", error);
        // Fallback to local videos if sheet reading fails
        try {
            const videoNames = await fetchFilesInFolder();
            videoNames.forEach((videoName, index) => {
                const button = document.createElement("button");
                button.className = 'video-button button';
                button.dataset.video = `videos/${videoName}`;
                button.textContent = videoName;
                
                // Mark first button as active by default
                if (index === 0) {
                    button.classList.add('active');
                }
                
                videoButtonsContainer.appendChild(button);
            });
        } catch (fallbackError) {
            console.error("Fallback also failed:", fallbackError);
        }
    }
}


function parseCSV(data) {
    const headers = data[0];
    return data.slice(1).map(line => {
        return headers.reduce((obj, header, index) => {
            obj[header] = line[index];
            return obj;
        }, {});
    });
}


function resetDisplay(currentVideoName, filteredData, docElts) {
    
    // docElts contain onomatopoeiaInput, startDisplay,
    // endDisplay, recordOnomatopoeia, buttonVisibility, 
    // inputVisibility, questionText
    docElts["onomatopoeiaInput"].value = "";
    docElts["startDisplay"].textContent = "-.--";
    docElts["endDisplay"].textContent = "-.--";

    docElts["buttonVisibility"].style.display = "block";
    docElts["inputVisibility"].style.display = "none";

    // Clear any existing messages when resetting display
    const messageDisplay = document.getElementById("message");
    UIUtils.clearMessage(messageDisplay);

    // Reset audio recording if function is available
    if (typeof window.resetAudioRecording === 'function') {
        window.resetAudioRecording();
    }

    let recordMessage = "";

    // ----- color in green all buttons where we have data for the video
    const videoButtons = document.querySelectorAll('.video-button');
    videoButtons.forEach(button => {
        const buttonVideo = button.dataset.video.split("/").pop();
        if (filteredData.some(item => item["video"] === buttonVideo)) {
            button.classList.add('completed');
        }
    });

    // ----- write on screen already recorded onomatopoeia data for the current video
    const currentVideoData = filteredData.filter(item => item["video"] === currentVideoName);

    // delete data where onomatopoeia == "null"
    const nonNullVideoData = currentVideoData.filter(elt => elt["onomatopoeia"] !== "null");

    if (!nonNullVideoData.length) {
        recordMessage = langManager.getText('survey.no_saved_onomatopoeia');
    } else {
        // write any onomatopoeia data that was not null
        nonNullVideoData.forEach(elt => {
            const startTime = elt["startTime"];
            const endTime = elt["endTime"];
            const onomatopoeia = elt["onomatopoeia"];
            const hasAudio = elt["hasAudio"];
            const audioIcon = hasAudio === "yes" ? " 🎵" : "";
            recordMessage += `-"${onomatopoeia}"${audioIcon} from ${startTime} to ${endTime};<br>`;
        });
    }
    docElts["recordOnomatopoeia"].innerHTML = recordMessage;

    docElts["questionText"].textContent = langManager.getText('survey.question_text_more');

}

async function saveOnomatopoeia(filteredData, infoDict, spreadsheetId, OnomatopoeiaSheet, messageDisplay, verbose = true) {
    const participantId = infoDict["participantId"];
    const participantName = infoDict["participantName"];
    const video = infoDict["video"];
    const onomatopoeia = infoDict["onomatopoeia"];
    const startTime = infoDict["startTime"];
    const endTime = infoDict["endTime"];
    const answeredTimestamp = infoDict["answeredTimestamp"];
    const hasAudio = infoDict["hasAudio"] || "no";
    const audioBlob = infoDict["audioBlob"];
    
    if (onomatopoeia === "") {
        if (verbose) {
            UIUtils.showError(messageDisplay, langManager.getText('survey.error_enter_onomatopoeia'));
        }
        throw new Error("Onomatopoeia is required");
    }
    if (startTime === "-.--") {
        if (verbose) {
            UIUtils.showError(messageDisplay, langManager.getText('survey.error_record_start'));
        }
        throw new Error("Start time is required");
    }
    if (endTime === "-.--") {
        if (verbose) {
            UIUtils.showError(messageDisplay, langManager.getText('survey.error_record_end'));
        }
        throw new Error("End time is required");
    }
    if (!participantId || !video || !answeredTimestamp) {
        if (verbose) {
            UIUtils.showError(messageDisplay, langManager.getText('survey.error_saving_general'));
        }
        throw new Error("Missing required data");
    }

    // Handle audio upload if present
    let audioFileName = null;
    if (audioBlob && hasAudio === "yes") {
        try {
            audioFileName = await uploadAudioFile(audioBlob, participantId, video, onomatopoeia, answeredTimestamp);
        } catch (audioError) {
            console.error("Audio upload failed:", audioError);
            if (verbose) {
                UIUtils.showError(messageDisplay, langManager.getText('survey.audio_upload_error'));
            }
            // Continue saving without audio - don't fail the entire operation
        }
    }

    // store the data in the sheet online (now includes hasAudio column)
    const newData = [
        parseInt(participantId),          // Convert to integer
        participantName,                  // Keep as string
        video,                            // Keep as string
        onomatopoeia,                     // Keep as string
        parseFloat(startTime),            // Convert to decimal number
        parseFloat(endTime),              // Convert to decimal number
        answeredTimestamp,                // Keep as string
        hasAudio,                         // Keep as string ("yes" or "no")
        audioFileName || ""               // Audio filename or empty string
    ];
    const appendResult = await appendSheetData(spreadsheetId, OnomatopoeiaSheet, newData);

    if (!appendResult) {
        if (verbose) {
            UIUtils.showError(messageDisplay, langManager.getText('survey.error_saving_sheet'));
        }
        throw new Error("Failed to save to sheet");
    }
    // Log the result of the append operation
    // console.log('Append Result:', appendResult);

    // update the local filteredData (add hasAudio field)
    const updatedInfoDict = {
        ...infoDict,
        hasAudio: hasAudio,
        audioFileName: audioFileName
    };
    delete updatedInfoDict.audioBlob; // Remove blob from stored data
    filteredData.push(updatedInfoDict);

    // Display a success message
    if (verbose) {
        const successMessage = hasAudio === "yes" && audioFileName ? 
            langManager.getText('survey.success_saved_with_audio') :
            langManager.getText('survey.success_saved');
        UIUtils.showSuccess(messageDisplay, successMessage);
    }
}

// Function to upload audio file to Google Drive
async function uploadAudioFile(audioBlob, participantId, videoName, onomatopoeia, timestamp) {
    try {
        // Convert blob to base64
        const arrayBuffer = await audioBlob.arrayBuffer();
        const base64Audio = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
        
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
                videoName: videoName
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

// Function to check if participant exists by email
async function checkParticipantExists(spreadsheetId, ParticipantSheet, email) {
    try {
        const participantsData = await getSheetData(spreadsheetId, ParticipantSheet);
        if (!participantsData || participantsData.length === 0) {
            return null;
        }
        
        const headers = participantsData[0];
        const emailIndex = headers.indexOf('email');
        const idIndex = headers.indexOf('participantId');
        
        if (emailIndex === -1 || idIndex === -1) {
            console.error('Required columns not found in Participants sheet');
            return null;
        }
        
        // Find participant by email
        for (let i = 1; i < participantsData.length; i++) {
            if (participantsData[i][emailIndex] === email) {
                return {
                    participantId: participantsData[i][idIndex],
                    email: participantsData[i][emailIndex],
                    name: participantsData[i][headers.indexOf('name')] || '',
                    age: participantsData[i][headers.indexOf('age')] || '',
                    gender: participantsData[i][headers.indexOf('gender')] || '',
                    movementPractice: participantsData[i][headers.indexOf('movementPractice')] || '',
                    nativeLanguage: participantsData[i][headers.indexOf('nativeLanguage')] || ''
                };
            }
        }
        
        return null; // Participant not found
    } catch (error) {
        console.error('Error checking participant:', error);
        throw error;
    }
}

// Function to save new participant
async function saveNewParticipant(spreadsheetId, ParticipantSheet, participantData) {
    try {
        const { email, name, age, gender, movementPractice, nativeLanguage } = participantData;
        const signUpDate = obtainDate();

        let checkMovementPractice = movementPractice || '';
        if (checkMovementPractice=== '') {
            checkMovementPractice = 'null';
        }

        // Generate a unique participant ID
        const participantsData = await getSheetData(spreadsheetId, ParticipantSheet);
        if (!participantsData || participantsData.length === 0) {
            throw new Error('Participants sheet is empty or not found');
        }
        
        const headers = participantsData[0];
        const idIndex = headers.indexOf('participantId');
        
        if (idIndex === -1) {
            throw new Error('participantId column not found in Participants sheet');
        }
        
        // Find the highest existing participant ID
        let maxId = 0;
        for (let i = 1; i < participantsData.length; i++) {
            const currentId = parseInt(participantsData[i][idIndex]) || 0;
            if (currentId > maxId) {
                maxId = currentId;
            }
        }
        
        const participantId = maxId + 1;

        const newData = [
            parseInt(participantId),       // Convert to integer
            email,                         // Keep as string
            name,                          // Keep as string
            parseInt(age),                 // Convert to integer
            gender,                        // Keep as string
            checkMovementPractice,         // Keep as string
            nativeLanguage,                // Keep as string
            signUpDate                     // Keep as string
        ];
        
        // Save to sheet first and check if successful
        const appendResult = await appendSheetData(spreadsheetId, ParticipantSheet, newData);
        
        if (!appendResult) {
            throw new Error('Failed to save participant data to sheet');
        }
        
        // Only return the participant ID if save was successful
        return participantId;
    } catch (error) {
        console.error('Error saving participant:', error);
        throw error;
    }
}

function obtainDate(){
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    const hours = String(today.getHours()).padStart(2, '0');
    const minutes = String(today.getMinutes()).padStart(2, '0');
    const seconds = String(today.getSeconds()).padStart(2, '0');
    return `${year}:${month}:${day}:${hours}:${minutes}:${seconds}`;
}

function goToNextVideo(currentButton) {
    let nextButton = currentButton ? currentButton.nextElementSibling : null;
    if (nextButton) {
        // Trigger click on next video button
        nextButton.click();
    } else {
        // Reached the end - show completion message instead of looping
        const messageDisplay = document.getElementById("message");
        if (messageDisplay) {
            UIUtils.showSuccess(messageDisplay, langManager.getText('survey.all_videos_complete'));
        }
    }
}

// Utility functions to reduce redundancy
class UIUtils {
    static clearMessage(messageElement) {
        if (messageElement) {
            messageElement.textContent = "";
            messageElement.style.color = "";
        }
    }
    
    static showMessage(messageElement, text, color = "black") {
        if (messageElement) {
            messageElement.textContent = text;
            messageElement.style.color = color;
        }
    }
    
    static showError(messageElement, text) {
        this.showMessage(messageElement, text, "red");
    }
    
    static showSuccess(messageElement, text) {
        this.showMessage(messageElement, text, "green");
    }
    
    static showInfo(messageElement, text) {
        this.showMessage(messageElement, text, "blue");
    }
}

// Configuration manager to avoid redundant config loading
class ConfigManager {
    static config = null;
    
    static async loadConfig() {
        if (this.config) return this.config;
        
        try {
            const response = await fetch('./sheet-info.json');
            this.config = await response.json();
            return this.config;
        } catch (error) {
            console.error('Error loading configuration:', error);
            throw error;
        }
    }
    
    static getConfig() {
        return this.config;
    }
}