// Main application logic for reasoning.html
class ReasoningApp extends BaseApp {
    constructor() {
        // Must call super() first before accessing 'this'
        super();

        // Initialize reasoning-specific properties after calling super()
        this.onomatopoeiaData = [];
        this.reasoningData = [];
        this.currentVideoName = null;
        this.currentVideoOnomatopoeia = [];
        this.currentOnomatopoeiaIndex = 0;
        this.carouselManager = new CarouselManager();
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
            onomatopoeiaCounter: DOMUtils.getElement("onomatopoeiaCounter")
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
            
            // Initialize video manager with callbacks
            this.initializeVideoManager(
                this.onVideoChange.bind(this), // Called when video changes
                this.onVideoLoad.bind(this)    // Called when videos are loaded
            );
            
            // Load videos using video manager
            await this.videoManager.loadVideos(this.config);
            
            // Set up event listeners
            this.setupEventListeners();

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

    // Callback for when video changes (called by VideoManager)
    onVideoChange(videoName, videoSrc) {
        this.currentVideoName = videoName;
        
        // Clear any existing messages when changing videos
        if (this.elements.messageDisplay) {
            uiManager.clearMessage(this.elements.messageDisplay);
        }
        
        // Display reasoning content for the new video
        this.displayReasoningForCurrentVideo();
    }
    
    // Callback for when videos are loaded (called by VideoManager)
    onVideoLoad() {
        // Set current video name from first video
        if (this.videoManager) {
            const currentVideo = this.videoManager.getCurrentVideo();
            this.currentVideoName = currentVideo.name;
        }
        
        // Display reasoning for initial video
        this.displayReasoningForCurrentVideo();
    }

    performAdditionalLogoutCleanup() {
        localStorage.removeItem("reasoningData");
        localStorage.removeItem("surveyCompleted");
    }

    async loadExistingReasoningData() {
        try {
            // Use the service to load onomatopoeia data with reasoning
            const onomatopoeiaData = await googleSheetsService.loadOnomatopoeiaData(
                this.config.spreadsheetId, 
                this.config.OnomatopoeiaSheet, 
                this.participantInfo.participantId
            );
            
            // Extract reasoning data from onomatopoeia data
            const sheetReasoningData = onomatopoeiaData
                .filter(item => item.reasoning && item.reasoning.trim() !== '')
                .map(item => ({
                    participantId: item.participantId,
                    participantName: item.participantName,
                    video: item.video,
                    onomatopoeia: item.onomatopoeia,
                    startTime: parseFloat(item.startTime),
                    endTime: parseFloat(item.endTime),
                    answeredTimestamp: item.answeredTimestamp,
                    reasoning: item.reasoning
                }));

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

    setupEventListeners() {
        // Set up common event listeners from base class
        this.setupCommonEventListeners();

        // Video button interactions are handled by VideoManager
        // No need to set up manual event listeners

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

    displayReasoningForCurrentVideo() {
        // Filter onomatopoeia for current video
        this.currentVideoOnomatopoeia = this.onomatopoeiaData.filter(item => 
            item.video === this.currentVideoName
        );

        if (this.currentVideoOnomatopoeia.length === 0) {
            // No onomatopoeia for this video
            this.carouselManager.updateVisibility(false);
            this.elements.noOnomatopoeiaMessage.style.display = 'block';
        } else {
            // Initialize carousel if not already done
            if (!this.carouselManager.isInitialized()) {
                this.initializeCarousel();
            }
            
            // Create slides content
            const slides = this.currentVideoOnomatopoeia.map((item, index) => 
                this.createReasoningEntryHTML(item, index)
            );
            
            // Update carousel with new slides
            this.carouselManager.addSlides(slides);
            this.carouselManager.updateVisibility(true);
            this.elements.noOnomatopoeiaMessage.style.display = 'none';
            
            // Set up event listeners for the new slides
            this.setupSlideEventListeners();
            
            // Reset to first slide
            this.carouselManager.slideTo(0);
        }

        // Mark video buttons with completion status
        this.updateVideoButtonStates();
    }

    initializeCarousel() {
        this.carouselManager.initialize(
            '.onomatopoeia-swiper',
            {
                // Custom configuration can be added here
                effect: 'slide',
                speed: 300,
            },
            (slideIndex) => {
                this.currentOnomatopoeiaIndex = slideIndex;
                // Handle any additional slide change logic here
            }
        );
    }

    navigateOnomatopoeia(direction) {
        // Use CarouselManager navigation
        if (direction > 0) {
            this.carouselManager.slideNext();
        } else if (direction < 0) {
            this.carouselManager.slidePrev();
        }
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
                uiManager.showError(this.elements.messageDisplay, langManager.getText('reasoning.error_min_characters'));
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
            uiManager.showSuccess(this.elements.messageDisplay, langManager.getText('reasoning.success_saved'));

        } catch (error) {
            console.error('Error saving reasoning:', error);
            uiManager.showError(this.elements.messageDisplay, langManager.getText('reasoning.error_saving'));
        }
    }

    async saveReasoningToSheet(reasoningEntry) {
        try {
            // Use the GoogleSheetsService to update reasoning
            await googleSheetsService.updateReasoning(
                this.config.spreadsheetId,
                this.config.OnomatopoeiaSheet,
                reasoningEntry.participantId,
                reasoningEntry.video,
                reasoningEntry.onomatopoeia,
                reasoningEntry.startTime,
                reasoningEntry.endTime,
                reasoningEntry.reasoning
            );
        } catch (error) {
            console.error('Error saving reasoning to sheet:', error);
            // Don't throw the error - allow local storage to work even if sheet update fails
            console.warn('Reasoning saved locally but not synced to Google Sheets');
        }
    }

    updateVideoButtonStates() {
        if (!this.videoManager) return;

        // Use VideoManager for button state updates
        this.videoManager.updateButtonCompletionStates(this.onomatopoeiaData, {
            determineState: (videoName, onomatopoeiaData) => {
                // Check if this video has onomatopoeia
                const hasOnomatopoeia = onomatopoeiaData.some(item => item.video === videoName);
                
                if (hasOnomatopoeia) {
                    // Check if all onomatopoeia for this video have reasoning
                    const videoOnomatopoeia = onomatopoeiaData.filter(item => item.video === videoName);
                    const completedReasoning = videoOnomatopoeia.filter(item => 
                        this.reasoningData.some(reasoning => 
                            reasoning.video === item.video &&
                            reasoning.onomatopoeia === item.onomatopoeia &&
                            parseFloat(reasoning.startTime) === parseFloat(item.startTime) &&
                            parseFloat(reasoning.endTime) === parseFloat(item.endTime)
                        )
                    );
                    
                    if (completedReasoning.length === videoOnomatopoeia.length) {
                        return 'completed'; // All reasoning completed for this video
                    }
                    return null; // Has onomatopoeia but not all reasoning completed
                } else {
                    return 'no-onomatopoeia'; // No onomatopoeia for this video
                }
            }
        });
    }

    createReasoningEntryHTML(onomatopoeiaItem, index) {
        // Find existing reasoning for this onomatopoeia
        const existingReasoning = this.reasoningData.find(reasoning => 
            reasoning.participantId == this.participantInfo.participantId &&
            reasoning.video === onomatopoeiaItem.video &&
            reasoning.onomatopoeia === onomatopoeiaItem.onomatopoeia &&
            parseFloat(reasoning.startTime) === parseFloat(onomatopoeiaItem.startTime) &&
            parseFloat(reasoning.endTime) === parseFloat(onomatopoeiaItem.endTime)
        );

        const reasoningText = existingReasoning ? existingReasoning.reasoning : '';
        const charCount = reasoningText.length;

        return `
            <div class="reasoning-entry">
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
                    >${reasoningText}</textarea>
                    <div class="reasoning-actions">
                        <button class="save-reasoning-button" data-index="${index}" ${charCount < 5 ? 'disabled' : ''}>
                            ${langManager.getText('reasoning.save_button')}
                        </button>
                        <div class="character-count">
                            <span class="char-count">${charCount}</span>/5 min
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    setupSlideEventListeners() {
        // Set up event listeners for all slides in the carousel
        const slides = this.carouselManager.swiper.slides;
        
        slides.forEach((slide, slideIndex) => {
            const showButton = slide.querySelector('.show-button');
            const textarea = slide.querySelector('.reasoning-textarea');
            const saveButton = slide.querySelector('.save-reasoning-button');
            const charCountSpan = slide.querySelector('.char-count');
            
            if (showButton) {
                showButton.addEventListener('click', () => {
                    this.playOnomatopoeiaSegment(
                        parseFloat(showButton.dataset.start),
                        parseFloat(showButton.dataset.end)
                    );
                });
            }

            if (textarea && charCountSpan && saveButton) {
                textarea.addEventListener('input', () => {
                    charCountSpan.textContent = textarea.value.length;
                    // Enable/disable save button based on minimum character requirement
                    uiManager.updateButtonState(saveButton, textarea.value.trim().length >= 5);
                });

                saveButton.addEventListener('click', () => {
                    const onomatopoeiaItem = this.currentVideoOnomatopoeia[slideIndex];
                    this.saveReasoning(onomatopoeiaItem, textarea.value.trim());
                });
            }
        });
    }

}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.reasoningApp = new ReasoningApp();
});
