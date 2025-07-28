// Main application logic for reasoning.html
class ReasoningApp extends BaseApp {
    constructor() {
        // Initialize reasoning-specific properties before calling super()
        this.onomatopoeiaData = [];
        this.reasoningData = [];
        this.currentVideoName = null;
        this.currentVideoOnomatopoeia = [];
        this.currentOnomatopoeiaIndex = 0;
        
        super();
    }

    initializeElements() {
        this.elements = {
            nameDisplay: DOMUtils.getElement("nameDisplay"),
            buttonLogout: DOMUtils.getElement("buttonLogout"),
            videoTitle: DOMUtils.getElement("videoTitle"),
            videoPlayer: DOMUtils.getElement("myVideo"),
            videoButtons: DOMUtils.getElement('videoButtons'),
            messageDisplay: DOMUtils.getElement("message"),
            languageSelect: DOMUtils.getElement("languageSelect"),
            reasoningPageTitle: DOMUtils.getElement("reasoningPageTitle"),
            progressDisplay: DOMUtils.getElement("progressDisplay"),
            reasoningSectionTitle: DOMUtils.getElement("reasoningSectionTitle"),
            onomatopoeiaList: DOMUtils.getElement("onomatopoeiaList"),
            noOnomatopoeiaMessage: DOMUtils.getElement("noOnomatopoeiaMessage"),
            noOnomatopoeiaText: DOMUtils.getElement("noOnomatopoeiaText"),
            prevOnomatopoeia: DOMUtils.getElement("prevOnomatopoeia"),
            nextOnomatopoeia: DOMUtils.getElement("nextOnomatopoeia"),
            onomatopoeiaCounter: DOMUtils.getElement("onomatopoeiaCounter"),
            currentOnomatopoeiaIndex: DOMUtils.getElement("currentOnomatopoeiaIndex"),
            totalOnomatopoeia: DOMUtils.getElement("totalOnomatopoeia")
        };
    }

    async initializeSubclass() {
        try {
            // Check if survey was completed
            const surveyCompleted = localStorage.getItem("surveyCompleted");
            if (!surveyCompleted) {
                alert("Please complete the survey first.");
                window.location.href = "survey.html";
                return;
            }

            // Load and validate participant info using base class method
            if (!this.loadAndValidateParticipantInfo()) {
                return; // Base class handles the redirect
            }

            // Load onomatopoeia data from localStorage
            this.onomatopoeiaData = JSON.parse(localStorage.getItem("filteredData")) || [];

            // Filter out null onomatopoeia entries
            this.onomatopoeiaData = this.onomatopoeiaData.filter(item => item.onomatopoeia !== "null");

            if (this.onomatopoeiaData.length === 0) {
                alert("No onomatopoeia data found. Please complete the survey first.");
                window.location.href = "survey.html";
                return;
            }

            // Load existing reasoning data if any
            this.reasoningData = JSON.parse(localStorage.getItem("reasoningData")) || [];

            // Load existing reasoning data from Google Sheets
            await this.loadExistingReasoningData();
            
            // Set up event listeners
            this.setupEventListeners();

            // Load configuration and videos
            await this.loadVideos();

            // Update participant name display
            this.updateParticipantDisplay();

            // Update progress display
            this.updateProgressDisplay();

            // Update video button states now that reasoning data is loaded
            this.updateVideoButtonStates();

        } catch (error) {
            console.error('Failed to initialize reasoning app:', error);
            this.showError('Failed to initialize reasoning page');
        }
    }

    getParticipantDisplayKey() {
        return 'reasoning.participant_name';
    }

    onLanguageChange() {
        super.onLanguageChange(); // Call base class method
        this.updateProgressDisplay();
        this.displayReasoningForCurrentVideo();
    }

    performAdditionalLogoutCleanup() {
        localStorage.removeItem("reasoningData");
        localStorage.removeItem("surveyCompleted");
    }

    async loadExistingReasoningData() {
        try {
            // Get the existing onomatopoeia data from Google Sheets
            const existingData = await getSheetData(this.config.spreadsheetId, this.config.OnomatopoeiaSheet);
            
            if (!existingData || existingData.length <= 1) {
                console.log('No existing reasoning data found in Google Sheets');
                return;
            }

            // Process the sheet data to extract reasoning information
            const sheetReasoningData = [];
            
            // Skip header row (index 0)
            for (let i = 1; i < existingData.length; i++) {
                const row = existingData[i];
                
                // Check if this row belongs to the current participant and has reasoning data
                if (row[0] == this.participantInfo.participantId && // participantId (column A)
                    row[9] && // reasoning column (column J, index 9)
                    row[9].trim() !== '') { // has non-empty reasoning
                    
                    const reasoningEntry = {
                        participantId: row[0], // participantId column (column A)
                        participantName: row[1], // participantName column (column B)
                        video: row[2], // video column (column C)
                        onomatopoeia: row[3], // onomatopoeia column (column D)
                        startTime: parseFloat(row[4]), // startTime column (column E)
                        endTime: parseFloat(row[5]), // endTime column (column F)
                        answeredTimestamp: row[6], // answeredTimestamp column (column G)
                        reasoning: row[9], // reasoning column (column J)
                    };
                    
                    sheetReasoningData.push(reasoningEntry);
                }
            }

            // Merge with local data, prioritizing sheet data for conflicts
            const mergedData = [...sheetReasoningData];
            
            // Add any local reasoning data that's not in the sheet
            this.reasoningData.forEach(localEntry => {
                const existsInSheet = sheetReasoningData.some(sheetEntry => 
                    sheetEntry.participantId === localEntry.participantId &&
                    sheetEntry.video === localEntry.video &&
                    sheetEntry.onomatopoeia === localEntry.onomatopoeia &&
                    sheetEntry.startTime === localEntry.startTime &&
                    sheetEntry.endTime === localEntry.endTime
                );
                
                if (!existsInSheet) {
                    mergedData.push(localEntry);
                }
            });

            this.reasoningData = mergedData;
            
            // Update local storage with merged data
            localStorage.setItem("reasoningData", JSON.stringify(this.reasoningData));
            
            console.log(`Loaded ${sheetReasoningData.length} reasoning entries from Google Sheets`);

            
        } catch (error) {
            console.error('Error loading existing reasoning data from Google Sheets:', error);
            console.warn('Continuing with local reasoning data only');
        }
    }

    async loadVideos() {
        try {            
            // Load selected videos
            await loadSelectedVideos(this.config.spreadsheetId, this.config.videoSheet, this.elements.videoButtons);
            
            // Set up initial video
            this.setupInitialVideo();
            
        } catch (error) {
            console.error('Error loading configuration:', error);
            throw error;
        }
    }

    setupInitialVideo() {
        const firstButton = this.elements.videoButtons?.querySelector('button');
        if (firstButton && this.elements.videoPlayer) {
            const initialVideo = DOMUtils.safeGetDataset(firstButton, 'video') || "videos/1.mp4";
            this.elements.videoPlayer.src = initialVideo;
            this.elements.videoPlayer.load();
            if (this.elements.videoTitle) {
                this.elements.videoTitle.textContent = `Video: ${initialVideo}`;
            }
            
            // Ensure first button is marked as active
            firstButton.classList.add('active');
            this.currentVideoName = initialVideo.split("/").pop();
            
            // Display reasoning content for the initial video
            this.displayReasoningForCurrentVideo();
        }
    }

    setupEventListeners() {
        // Set up common event listeners from base class
        this.setupCommonEventListeners();

        // Video button interactions (read-only)
        if (this.elements.videoButtons) {
            this.elements.videoButtons.addEventListener('click', this.handleVideoButtonClick.bind(this));
        }

        // Carousel navigation
        if (this.elements.prevOnomatopoeia) {
            this.elements.prevOnomatopoeia.addEventListener('click', () => {
                this.navigateOnomatopoeia(-1);
            });
        }

        if (this.elements.nextOnomatopoeia) {
            this.elements.nextOnomatopoeia.addEventListener('click', () => {
                this.navigateOnomatopoeia(1);
            });
        }

        // Keyboard navigation for carousel
        document.addEventListener('keydown', (event) => {
            if (this.currentVideoOnomatopoeia.length > 1) {
                if (event.key === 'ArrowLeft' && !this.elements.prevOnomatopoeia.disabled) {
                    event.preventDefault();
                    this.navigateOnomatopoeia(-1);
                } else if (event.key === 'ArrowRight' && !this.elements.nextOnomatopoeia.disabled) {
                    event.preventDefault();
                    this.navigateOnomatopoeia(1);
                }
            }
        });
    }

    updateProgressDisplay() {
        const totalOnomatopoeia = this.onomatopoeiaData.length;
        const completedReasoning = this.reasoningData.length;
        
        if (this.elements.progressDisplay) {
            const progressText = langManager.getText('reasoning.progress')
                .replace('{completed}', completedReasoning)
                .replace('{total}', totalOnomatopoeia);
            this.elements.progressDisplay.textContent = progressText;
        }
    }

    handleVideoButtonClick(event) {
        if (event.target.classList.contains('video-button')) {
            // Clear any existing messages when changing videos
            if (this.elements.messageDisplay) {
                UIUtils.clearMessage(this.elements.messageDisplay);
            }
            
            // Remove active class from all buttons
            const allButtons = this.elements.videoButtons.querySelectorAll('.video-button');
            allButtons.forEach(btn => btn.classList.remove('active'));
            
            // Add active class to clicked button
            event.target.classList.add('active');
            
            // Update video source
            const videoSrc = DOMUtils.safeGetDataset(event.target, 'video');
            if (videoSrc && this.elements.videoPlayer) {
                this.elements.videoPlayer.src = videoSrc;
                this.elements.videoPlayer.load();
                if (this.elements.videoTitle) {
                    this.elements.videoTitle.textContent = `Video: ${videoSrc}`;
                }
                this.currentVideoName = videoSrc.split("/").pop();
                this.displayReasoningForCurrentVideo();
            }
        }
    }

    displayReasoningForCurrentVideo() {
        // Filter onomatopoeia for current video
        this.currentVideoOnomatopoeia = this.onomatopoeiaData.filter(item => 
            item.video === this.currentVideoName
        );

        if (this.currentVideoOnomatopoeia.length === 0) {
            // No onomatopoeia for this video
            this.elements.onomatopoeiaList.style.display = 'none';
            this.elements.noOnomatopoeiaMessage.style.display = 'block';
            this.hideCarouselControls();
        } else {
            // Show onomatopoeia carousel
            this.elements.onomatopoeiaList.style.display = 'block';
            this.elements.noOnomatopoeiaMessage.style.display = 'none';
            
            // Reset to first onomatopoeia
            this.currentOnomatopoeiaIndex = 0;
            this.displayCurrentOnomatopoeia();
            this.updateCarouselControls();
        }

        // Mark video buttons with completion status
        this.updateVideoButtonStates();
    }

    displayCurrentOnomatopoeia() {
        // Clear existing content
        this.elements.onomatopoeiaList.innerHTML = '';
        
        // Display only the current onomatopoeia
        if (this.currentVideoOnomatopoeia.length > 0 && 
            this.currentOnomatopoeiaIndex < this.currentVideoOnomatopoeia.length) {
            const currentItem = this.currentVideoOnomatopoeia[this.currentOnomatopoeiaIndex];
            this.createReasoningEntry(currentItem, this.currentOnomatopoeiaIndex);
        }
    }

    updateCarouselControls() {
        const totalCount = this.currentVideoOnomatopoeia.length;
        
        if (totalCount <= 1) {
            // Hide carousel controls for single or no items
            this.hideCarouselControls();
        } else {
            // Show carousel controls
            this.elements.prevOnomatopoeia.style.display = 'flex';
            this.elements.nextOnomatopoeia.style.display = 'flex';
            this.elements.onomatopoeiaCounter.style.display = 'block';
            
            // Update aria-labels
            this.elements.prevOnomatopoeia.setAttribute('aria-label', langManager.getText('reasoning.prev_onomatopoeia'));
            this.elements.nextOnomatopoeia.setAttribute('aria-label', langManager.getText('reasoning.next_onomatopoeia'));
            
            // Update counter
            this.elements.currentOnomatopoeiaIndex.textContent = this.currentOnomatopoeiaIndex + 1;
            this.elements.totalOnomatopoeia.textContent = totalCount;
            
            // Update button states
            this.elements.prevOnomatopoeia.disabled = this.currentOnomatopoeiaIndex === 0;
            this.elements.nextOnomatopoeia.disabled = this.currentOnomatopoeiaIndex === totalCount - 1;
        }
    }

    hideCarouselControls() {
        this.elements.prevOnomatopoeia.style.display = 'none';
        this.elements.nextOnomatopoeia.style.display = 'none';
        this.elements.onomatopoeiaCounter.style.display = 'none';
    }

    navigateOnomatopoeia(direction) {
        const newIndex = this.currentOnomatopoeiaIndex + direction;
        
        if (newIndex >= 0 && newIndex < this.currentVideoOnomatopoeia.length) {
            this.currentOnomatopoeiaIndex = newIndex;
            this.displayCurrentOnomatopoeia();
            this.updateCarouselControls();
        }
    }

    createReasoningEntry(onomatopoeiaItem, index) {
        const entryDiv = document.createElement('div');
        entryDiv.className = 'reasoning-entry';
        
        // Find existing reasoning for this onomatopoeia
        const existingReasoning = this.reasoningData.find(reasoning => 
            reasoning.participantId == this.participantInfo.participantId &&
            reasoning.video === onomatopoeiaItem.video &&
            reasoning.onomatopoeia === onomatopoeiaItem.onomatopoeia &&
            parseFloat(reasoning.startTime) === parseFloat(onomatopoeiaItem.startTime) &&
            parseFloat(reasoning.endTime) === parseFloat(onomatopoeiaItem.endTime)
        );

        entryDiv.innerHTML = `
            <div class="onomatopoeia-header">
                <div class="onomatopoeia-info">
                    <span class="onomatopoeia-text">"${onomatopoeiaItem.onomatopoeia}"</span>
                    <span class="time-range">${langManager.getText('reasoning.time_range')
                        .replace('{start}', onomatopoeiaItem.startTime)
                        .replace('{end}', onomatopoeiaItem.endTime)}</span>
                    ${onomatopoeiaItem.hasAudio === 1 ? '<span class="audio-icon">🎵</span>' : ''}
                </div>
                <button class="show-button" data-start="${onomatopoeiaItem.startTime}" data-end="${onomatopoeiaItem.endTime}">
                    ${langManager.getText('reasoning.show_button')}
                </button>
            </div>
            <div class="reasoning-input-container">
                <label class="reasoning-label">${langManager.getText('reasoning.reasoning_label')}</label>
                <textarea 
                    class="reasoning-textarea" 
                    placeholder="${langManager.getText('reasoning.reasoning_placeholder')}"
                    data-video="${onomatopoeiaItem.video}"
                    data-onomatopoeia="${onomatopoeiaItem.onomatopoeia}"
                    data-start="${onomatopoeiaItem.startTime}"
                    data-end="${onomatopoeiaItem.endTime}"
                >${existingReasoning ? existingReasoning.reasoning : ''}</textarea>
                <div class="reasoning-actions">
                    <button class="save-reasoning-button" data-index="${index}">
                        ${langManager.getText('reasoning.save_button')}
                    </button>
                    <div class="character-count">
                        <span class="char-count">${existingReasoning ? existingReasoning.reasoning.length : 0}</span>/5 min
                    </div>
                </div>
            </div>
        `;

        // Add event listeners
        const showButton = entryDiv.querySelector('.show-button');
        const textarea = entryDiv.querySelector('.reasoning-textarea');
        const saveButton = entryDiv.querySelector('.save-reasoning-button');
        const charCountSpan = entryDiv.querySelector('.char-count');

        showButton.addEventListener('click', () => {
            this.playOnomatopoeiaSegment(
                parseFloat(showButton.dataset.start),
                parseFloat(showButton.dataset.end)
            );
        });

        textarea.addEventListener('input', () => {
            charCountSpan.textContent = textarea.value.length;
            // Enable/disable save button based on minimum character requirement
            saveButton.disabled = textarea.value.trim().length < 5;
        });

        saveButton.addEventListener('click', () => {
            this.saveReasoning(onomatopoeiaItem, textarea.value.trim());
        });

        // Initial save button state
        saveButton.disabled = textarea.value.trim().length < 5;

        this.elements.onomatopoeiaList.appendChild(entryDiv);
    }

    playOnomatopoeiaSegment(startTime, endTime) {
        if (!this.elements.videoPlayer) return;

        // Set video to start time and play
        this.elements.videoPlayer.currentTime = startTime;
        this.elements.videoPlayer.play();

        // Set up event listener to pause at end time
        const checkTime = () => {
            if (this.elements.videoPlayer.currentTime >= endTime) {
                this.elements.videoPlayer.pause();
                this.elements.videoPlayer.removeEventListener('timeupdate', checkTime);
            }
        };

        this.elements.videoPlayer.addEventListener('timeupdate', checkTime);
    }

    async saveReasoning(onomatopoeiaItem, reasoningText) {
        try {
            // Validate minimum character requirement
            if (reasoningText.length < 5) {
                UIUtils.showError(this.elements.messageDisplay, langManager.getText('reasoning.error_min_characters'));
                return;
            }

            const reasoningEntry = {
                participantId: this.participantInfo.participantId,
                participantName: this.participantInfo.name || this.participantInfo.email,
                video: onomatopoeiaItem.video,
                onomatopoeia: onomatopoeiaItem.onomatopoeia,
                startTime: onomatopoeiaItem.startTime,
                endTime: onomatopoeiaItem.endTime,
                reasoning: reasoningText,
                answeredTimestamp: obtainDate()
            };

            // Save to Google Sheets (add reasoning column to existing Onomatopoeia sheet)
            await this.saveReasoningToSheet(reasoningEntry);

            // Update local reasoning data
            const existingIndex = this.reasoningData.findIndex(item => 
                item.participantId == reasoningEntry.participantId &&
                item.video === reasoningEntry.video &&
                item.onomatopoeia === reasoningEntry.onomatopoeia &&
                parseFloat(item.startTime) === parseFloat(reasoningEntry.startTime) &&
                parseFloat(item.endTime) === parseFloat(reasoningEntry.endTime)
            );

            if (existingIndex >= 0) {
                this.reasoningData[existingIndex] = reasoningEntry;
            } else {
                this.reasoningData.push(reasoningEntry);
            }

            // Save to localStorage
            localStorage.setItem("reasoningData", JSON.stringify(this.reasoningData));

            // Update progress display
            this.updateProgressDisplay();

            // Show success message
            UIUtils.showSuccess(this.elements.messageDisplay, langManager.getText('reasoning.success_saved'));

        } catch (error) {
            console.error('Error saving reasoning:', error);
            UIUtils.showError(this.elements.messageDisplay, langManager.getText('reasoning.error_saving'));
        }
    }

    async saveReasoningToSheet(reasoningEntry) {
        try {
            // For now, we'll extend the existing Onomatopoeia sheet with reasoning column
            // This means we need to find the matching row and update it with reasoning
            
            // First, get the existing sheet data to find the matching row
            const existingData = await getSheetData(this.config.spreadsheetId, this.config.OnomatopoeiaSheet);
            
            if (!existingData || existingData.length === 0) {
                throw new Error("No existing onomatopoeia data found in sheet");
            }

            // Find the matching row (skip header row)
            let matchingRowIndex = -1;
            for (let i = 1; i < existingData.length; i++) {
                const row = existingData[i];
                if (row[0] == reasoningEntry.participantId && // participantId
                    row[2] === reasoningEntry.video && // video
                    row[3] === reasoningEntry.onomatopoeia && // onomatopoeia
                    parseFloat(row[4]) === parseFloat(reasoningEntry.startTime) && // startTime
                    parseFloat(row[5]) === parseFloat(reasoningEntry.endTime)) { // endTime
                    matchingRowIndex = i;
                    break;
                }
            }

            if (matchingRowIndex === -1) {
                throw new Error("Matching onomatopoeia entry not found in sheet");
            }

            // Update the reasoning column (column J, index 9)
            const range = `${this.config.OnomatopoeiaSheet}!J${matchingRowIndex + 1}`;
            const updateResult = await updateSheetData(this.config.spreadsheetId, range, [[reasoningEntry.reasoning]]);

            if (!updateResult) {
                throw new Error("Failed to update reasoning in sheet");
            }
        } catch (error) {
            console.error('Error saving reasoning to sheet:', error);
            // Don't throw the error - allow local storage to work even if sheet update fails
            console.warn('Reasoning saved locally but not synced to Google Sheets');
        }
    }

    updateVideoButtonStates() {
        if (!this.elements.videoButtons) return;

        const videoButtons = this.elements.videoButtons.querySelectorAll('.video-button');
        videoButtons.forEach(button => {
            const buttonVideo = DOMUtils.safeGetDataset(button, 'video')?.split("/").pop();
            if (buttonVideo) {
                // Check if this video has onomatopoeia
                const hasOnomatopoeia = this.onomatopoeiaData.some(item => item.video === buttonVideo);
                
                // Remove existing completion classes
                button.classList.remove('completed', 'no-onomatopoeia');
                
                if (hasOnomatopoeia) {
                    // Check if all onomatopoeia for this video have reasoning
                    const videoOnomatopoeia = this.onomatopoeiaData.filter(item => item.video === buttonVideo);
                    const completedReasoning = videoOnomatopoeia.filter(item => 
                        this.reasoningData.some(reasoning => 
                            reasoning.video === item.video &&
                            reasoning.onomatopoeia === item.onomatopoeia &&
                            parseFloat(reasoning.startTime) === parseFloat(item.startTime) &&
                            parseFloat(reasoning.endTime) === parseFloat(item.endTime)
                        )
                    );
                    
                    if (completedReasoning.length === videoOnomatopoeia.length) {
                        // All reasoning completed for this video
                        button.classList.add('completed');
                    }
                } else {
                    // No onomatopoeia for this video - mark as no-onomatopoeia
                    button.classList.add('no-onomatopoeia');
                }
            }
        });
    }

}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.reasoningApp = new ReasoningApp();
});
