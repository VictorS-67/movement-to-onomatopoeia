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


function resetDisplay(videoData, docElts) {
    
    // docElts contain onomatopoeiaInput, startDisplay,
    // endDisplay, recordOnomatopoeia, buttonVisibility, 
    // inputVisibility
    docElts["onomatopoeiaInput"].value = "";
    docElts["startDisplay"].textContent = "-.--";
    docElts["endDisplay"].textContent = "-.--";

    docElts["buttonVisibility"].style.display = "block";
    docElts["inputVisibility"].style.display = "none";

    let recordMessage = "";

    // first, delete data where onomatopoeia == "null"
    const nonNullVideoData = videoData.filter(elt => elt["onomatopoeia"] !== "null");

    if (!nonNullVideoData.length) {
        recordMessage = "None";
    } else {
        nonNullVideoData.forEach(elt => {
            const startTime = elt["startTime"];
            const endTime = elt["endTime"];
            const onomatopoeia = elt["onomatopoeia"];
            recordMessage += `-"${onomatopoeia}" from ${startTime} to ${endTime};<br>`;
        });
    }
    docElts["recordOnomatopoeia"].innerHTML = recordMessage;
}

async function saveOnomatopoeia(filteredData, infoDict, spreadsheetId, OnomatopoeiaSheet, messageDisplay, verbose = true) {
    const participantId = infoDict["participantId"];
    const participantName = infoDict["participantName"];
    const video = infoDict["video"];
    const onomatopoeia = infoDict["onomatopoeia"];
    const startTime = infoDict["startTime"];
    const endTime = infoDict["endTime"];
    const answeredTimestamp = infoDict["answeredTimestamp"];
    
    if (onomatopoeia === "") {
        if (verbose) {
            messageDisplay.textContent = "Please enter your onomatopoeia.";
            messageDisplay.style.color = "red";
        }
        throw new Error("Onomatopoeia is required");
    }
    if (startTime === "-.--") {
        if (verbose) {
            messageDisplay.textContent = "Please record the start of the onomatopoeia.";
            messageDisplay.style.color = "red";
        }
        throw new Error("Start time is required");
    }
    if (endTime === "-.--") {
        if (verbose) {
            messageDisplay.textContent = "Please record the end of the onomatopoeia.";
            messageDisplay.style.color = "red";
        }
        throw new Error("End time is required");
    }
    if (!participantId || !video || !answeredTimestamp) {
        if (verbose) {
            messageDisplay.textContent = "Something went wrong when saving the data";
            messageDisplay.style.color = "red";
        }
        throw new Error("Missing required data");
    }

    // store the data in the sheet online
    const newData = [
        parseInt(participantId),          // Convert to integer
        participantName,                  // Keep as string
        video,                            // Keep as string
        onomatopoeia,                     // Keep as string
        parseFloat(startTime),            // Convert to decimal number
        parseFloat(endTime),              // Convert to decimal number
        answeredTimestamp                 // Keep as string
    ];
    const appendResult = await appendSheetData(spreadsheetId, OnomatopoeiaSheet, newData);

    if (!appendResult) {
        if (verbose) {
            messageDisplay.textContent = "Failed to save data to the sheet.";
            messageDisplay.style.color = "red";
        }
        throw new Error("Failed to save to sheet");
    }
    // Log the result of the append operation
    // console.log('Append Result:', appendResult);

    // update the local filteredData
    filteredData.push(infoDict);

    // Display a success message
    if (verbose) {
        messageDisplay.textContent = "Onomatopoeia and start-end saved!";
        messageDisplay.style.color = "green";
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
                    age: participantsData[i][headers.indexOf('age')] || ''
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
        const { email, name, age } = participantData;
        const timestamp = obtainDate();
        
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
            timestamp                      // Keep as string
        ];
        return await appendSheetData(spreadsheetId, ParticipantSheet, newData);
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

function padStart(number, length) {
    return String(number).padStart(length, '0');
}

function goToNextVideo(currentButton) {
    let nextButton = currentButton ? currentButton.nextElementSibling : null;
    if (nextButton) {
        // Trigger click on next video button
        nextButton.click();
    } else {
        // Reached the end - show completion message instead of looping
        messageDisplay.textContent = "You have reached the end of all videos. Thank you for your participation!";
        messageDisplay.style.color = "green";
    }
}