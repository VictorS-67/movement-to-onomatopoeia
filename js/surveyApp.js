// Main application logic for survey.html
class SurveyApp extends BaseApp {
    constructor() {
        // Must call super() first before accessing 'this'
        super();
        
        // Initialize survey-specific properties after calling super()
        this.filteredData = [];
        this.currentVideoName = null;
        this.audioRecording = {
            mediaRecorder: null,
            audioChunks: [],
            recordedAudioBlob: null,
            audioUrl: null
        };
        this.introExpanded = false; // Track introduction toggle state
    }

    initializeElements() {
        this.elements = {
            nameDisplay: DOMUtils.getElement("nameDisplay"),
            buttonVisibility: DOMUtils.getElement("buttonVisibility"),
            inputVisibility: DOMUtils.getElement("inputVisibility"),
            hasOnomatopoeiaButtonYes: DOMUtils.getElement("hasOnomatopoeiaButtonYes"),
            hasOnomatopoeiaButtonNo: DOMUtils.getElement("hasOnomatopoeiaButtonNo"),
            buttonLogout: DOMUtils.getElement("buttonLogout"),
            videoTitle: DOMUtils.getElement("videoTitle"),
            videoPlayer: DOMUtils.getElement("myVideo"),
            videoButtons: DOMUtils.getElement('videoButtons'),
            getStart: DOMUtils.getElement("getStart"),
            startDisplay: DOMUtils.getElement("startDisplay"),
            getEnd: DOMUtils.getElement("getEnd"),
            endDisplay: DOMUtils.getElement("endDisplay"),
            onomatopoeiaInput: DOMUtils.getElement("onomatopoeiaInput"),
            saveOnomatopoeiaButton: DOMUtils.getElement("saveOnomatopoeia"),
            messageDisplay: DOMUtils.getElement("message"),
            recordOnomatopoeia: DOMUtils.getElement("recordOnomatopoeia"),
            questionText: DOMUtils.getElement("questionText"),
            languageSelect: DOMUtils.getElement("languageSelect"),
            // Introduction toggle elements
            introToggleButton: DOMUtils.getElement("introToggleButton"),
            collapsibleIntro: DOMUtils.getElement("collapsibleIntro"),
            // Introduction content elements (for language updates)
            welcomeTitle: DOMUtils.getElement("welcomeTitle"),
            welcomeIntro: DOMUtils.getElement("welcomeIntro"),
            welcomeDescription: DOMUtils.getElement("welcomeDescription"),
            instructionsTitle: DOMUtils.getElement("instructionsTitle"),
            instructionsList: DOMUtils.getElement("instructionsList"),
            noOnomatopoeia: DOMUtils.getElement("noOnomatopoeia"),
            aboutOnomatopoeia: DOMUtils.getElement("aboutOnomatopoeia"),
            intuitionEmphasis: DOMUtils.getElement("intuitionEmphasis"),
            // Audio elements
            audioRecord: DOMUtils.getElement("audioRecord"),
            audioStop: DOMUtils.getElement("audioStop"),
            audioPlay: DOMUtils.getElement("audioPlay"),
            audioDelete: DOMUtils.getElement("audioDelete"),
            audioStatus: DOMUtils.getElement("audioStatus"),
            audioWaveform: DOMUtils.getElement("audioWaveform"),
            // Reasoning access button
            continueToReasoningButton: DOMUtils.getElement("continueToReasoningButton")
        };
    }

    async initializeSubclass() {
        try {
            // Load and validate participant info using base class method
            if (!this.loadAndValidateParticipantInfo()) {
                return; // Base class handles the redirect
            }
            
            // Load filtered data from localStorage
            this.filteredData = JSON.parse(localStorage.getItem("filteredData")) || [];
            
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

            // Initialize introduction content
            this.updateIntroductionContent();

        } catch (error) {
            console.error('Failed to initialize survey app:', error);
            this.showError('Failed to initialize survey');
        }
    }

    getParticipantDisplayKey() {
        return 'survey.participant_name';
    }

    onLanguageChange() {
        super.onLanguageChange(); // Call base class method
        this.updateAudioStatusText();
        this.updateIntroductionContent();
    }

    // Callback for when video changes (called by VideoManager)
    onVideoChange(videoName, videoSrc) {
        this.currentVideoName = videoName;
        
        // Clear any existing messages when changing videos
        if (this.elements.messageDisplay) {
            UIUtils.clearMessage(this.elements.messageDisplay);
        }
        
        // Reset display for the new video
        this.resetDisplayForCurrentVideo();
    }
    
    // Callback for when videos are loaded (called by VideoManager)
    onVideoLoad() {
        // Set current video name from first video
        if (this.videoManager) {
            const currentVideo = this.videoManager.getCurrentVideo();
            this.currentVideoName = currentVideo.name;
        }
        
        // Reset display for initial video
        this.resetDisplayForCurrentVideo();
    }

    performAdditionalLogoutCleanup() {
        // No additional cleanup needed for survey app
    }

    setupEventListeners() {
        // Set up common event listeners from base class
        this.setupCommonEventListeners();

        // Onomatopoeia flow buttons
        if (this.elements.hasOnomatopoeiaButtonYes) {
            this.elements.hasOnomatopoeiaButtonYes.addEventListener('click', this.showOnomatopoeiaInput.bind(this));
        }

        if (this.elements.hasOnomatopoeiaButtonNo) {
            this.elements.hasOnomatopoeiaButtonNo.addEventListener('click', this.handleNoOnomatopoeia.bind(this));
        }

        // Introduction toggle button
        if (this.elements.introToggleButton) {
            this.elements.introToggleButton.addEventListener('click', this.toggleIntroduction.bind(this));
        }

        // Time capture buttons
        if (this.elements.getStart) {
            this.elements.getStart.addEventListener('click', this.captureStartTime.bind(this));
        }

        if (this.elements.getEnd) {
            this.elements.getEnd.addEventListener('click', this.captureEndTime.bind(this));
        }

        // Save button
        if (this.elements.saveOnomatopoeiaButton) {
            this.elements.saveOnomatopoeiaButton.addEventListener('click', this.handleSaveOnomatopoeia.bind(this));
        }

        // Continue to reasoning button
        if (this.elements.continueToReasoningButton) {
            this.elements.continueToReasoningButton.addEventListener('click', this.goToReasoningPage.bind(this));
        }

        // Audio recording buttons
        this.setupAudioEventListeners();
    }

    setupAudioEventListeners() {
        if (this.elements.audioRecord) {
            this.elements.audioRecord.addEventListener('click', this.startAudioRecording.bind(this));
        }
        if (this.elements.audioStop) {
            this.elements.audioStop.addEventListener('click', this.stopAudioRecording.bind(this));
        }
        if (this.elements.audioPlay) {
            this.elements.audioPlay.addEventListener('click', this.playAudioRecording.bind(this));
        }
        if (this.elements.audioDelete) {
            this.elements.audioDelete.addEventListener('click', this.deleteAudioRecording.bind(this));
        }
    }

    updateParticipantDisplay() {
        // Call base class method to handle the common display logic
        super.updateParticipantDisplay();

        // Check if all videos are completed and show/hide reasoning button
        this.updateReasoningButtonVisibility();
    }

    updateReasoningButtonVisibility() {
        if (!this.elements.continueToReasoningButton) return;

        const allCompleted = this.checkAllVideosCompleted();
        if (allCompleted) {
            this.elements.continueToReasoningButton.style.display = 'inline-block';
            this.elements.continueToReasoningButton.textContent = langManager.getText('survey.continue_to_reasoning');
        } else {
            this.elements.continueToReasoningButton.style.display = 'none';
        }
    }

    goToReasoningPage() {
        // Store completion state
        localStorage.setItem("surveyCompleted", "true");
        
        // Redirect to reasoning page
        window.location.href = "reasoning.html";
    }

    updateAudioStatusText() {
        if (this.elements.audioStatus && !this.audioRecording.recordedAudioBlob) {
            this.elements.audioStatus.textContent = langManager.getText('survey.audio_status_ready');
        }
    }

    toggleIntroduction() {
        this.introExpanded = !this.introExpanded;
        
        if (this.introExpanded) {
            // Show introduction
            if (this.elements.collapsibleIntro) {
                this.elements.collapsibleIntro.style.display = 'block';
                // Force reflow for animation
                this.elements.collapsibleIntro.offsetHeight;
                this.elements.collapsibleIntro.classList.add('expanded');
            }
            if (this.elements.introToggleButton) {
                this.elements.introToggleButton.textContent = langManager.getText('survey.hide_introduction');
            }
        } else {
            // Hide introduction
            if (this.elements.collapsibleIntro) {
                this.elements.collapsibleIntro.classList.remove('expanded');
                // Wait for animation to complete before hiding
                setTimeout(() => {
                    if (!this.introExpanded && this.elements.collapsibleIntro) {
                        this.elements.collapsibleIntro.style.display = 'none';
                    }
                }, 200);
            }
            if (this.elements.introToggleButton) {
                this.elements.introToggleButton.textContent = langManager.getText('survey.show_introduction');
            }
        }
        
        // Update introduction content with current language
        this.updateIntroductionContent();
    }

    updateIntroductionContent() {
        // Update all introduction text elements with current language
        if (this.elements.welcomeTitle) {
            this.elements.welcomeTitle.textContent = langManager.getText('welcome.title');
        }
        if (this.elements.welcomeIntro) {
            this.elements.welcomeIntro.textContent = langManager.getText('welcome.introduction');
        }
        if (this.elements.welcomeDescription) {
            this.elements.welcomeDescription.textContent = langManager.getText('welcome.description');
        }
        if (this.elements.instructionsTitle) {
            this.elements.instructionsTitle.textContent = langManager.getText('instructions.title');
        }
        if (this.elements.instructionsList) {
            const instructions = langManager.getText('instructions.steps');
            if (Array.isArray(instructions)) {
                this.elements.instructionsList.innerHTML = instructions.map(item => `<li>${item}</li>`).join('');
            } else {
                // Fallback if instructions is not an array
                this.elements.instructionsList.innerHTML = '<li>Loading instructions...</li>';
            }
        }
        if (this.elements.noOnomatopoeia) {
            this.elements.noOnomatopoeia.textContent = langManager.getText('additional_info.no_onomatopoeia');
        }
        if (this.elements.aboutOnomatopoeia) {
            this.elements.aboutOnomatopoeia.textContent = langManager.getText('additional_info.about_onomatopoeia');
        }
        if (this.elements.intuitionEmphasis) {
            this.elements.intuitionEmphasis.textContent = langManager.getText('additional_info.intuition_emphasis');
        }
        
        // Update button text based on current state
        if (this.elements.introToggleButton) {
            this.elements.introToggleButton.textContent = this.introExpanded ? 
                langManager.getText('survey.hide_introduction') : 
                langManager.getText('survey.show_introduction');
        }
    }

    resetDisplayForCurrentVideo() {
        const docElts = {
            onomatopoeiaInput: this.elements.onomatopoeiaInput,
            startDisplay: this.elements.startDisplay,
            endDisplay: this.elements.endDisplay,
            recordOnomatopoeia: this.elements.recordOnomatopoeia,
            buttonVisibility: this.elements.buttonVisibility,
            inputVisibility: this.elements.inputVisibility,
            questionText: this.elements.questionText
        };
        
        this.resetDisplay(this.currentVideoName, this.filteredData, docElts);
        this.resetAudioRecording();
    }

    showOnomatopoeiaInput() {
        // Clear any existing messages when starting to input onomatopoeia
        if (this.elements.messageDisplay) {
            UIUtils.clearMessage(this.elements.messageDisplay);
        }
        
        if (this.elements.buttonVisibility) {
            this.elements.buttonVisibility.style.display = "none";
        }
        if (this.elements.inputVisibility) {
            this.elements.inputVisibility.style.display = "block";
        }
        this.resetAudioRecording();
    }

    async handleNoOnomatopoeia() {
        // Clear any existing messages when clicking "No"
        if (this.elements.messageDisplay) {
            UIUtils.clearMessage(this.elements.messageDisplay);
        }
        
        const currentButton = this.elements.videoButtons?.querySelector('.video-button.active');
        if (currentButton) {
            try {
                // Check if onomatopoeia has already been saved for this video
                const currentVideoData = this.filteredData.filter(item => item["video"] === this.currentVideoName);
                if (!currentVideoData.length) {
                    const infoDict = {
                        participantId: this.participantInfo.participantId,
                        participantName: this.participantInfo.name || this.participantInfo.email,
                        video: this.currentVideoName,
                        onomatopoeia: "null",
                        startTime: "null",
                        endTime: "null",
                        answeredTimestamp: obtainDate(),
                        hasAudio: 0
                    };

                    await this.saveOnomatopoeia(
                        this.filteredData, 
                        infoDict, 
                        this.config.spreadsheetId, 
                        this.config.OnomatopoeiaSheet, 
                        this.elements.messageDisplay, 
                        false
                    );
                }

                this.resetDisplayForCurrentVideo();
                this.goToNextVideo(currentButton);
            } catch (error) {
                console.error('Error saving "no" response:', error);
            }
        }
    }

    captureStartTime() {
        if (this.elements.videoPlayer && this.elements.startDisplay) {
            this.elements.startDisplay.textContent = this.elements.videoPlayer.currentTime.toFixed(2);
        }
    }

    captureEndTime() {
        if (this.elements.videoPlayer && this.elements.endDisplay) {
            this.elements.endDisplay.textContent = this.elements.videoPlayer.currentTime.toFixed(2);
        }
    }

    async handleSaveOnomatopoeia() {
        try {
            const infoDict = {
                participantId: this.participantInfo.participantId,
                participantName: this.participantInfo.name || this.participantInfo.email,
                video: this.currentVideoName,
                onomatopoeia: this.elements.onomatopoeiaInput?.value?.trim() || "",
                startTime: this.elements.startDisplay?.textContent || "-.--",
                endTime: this.elements.endDisplay?.textContent || "-.--",
                answeredTimestamp: obtainDate(),
                hasAudio: this.audioRecording.recordedAudioBlob ? 1 : 0,
                audioBlob: this.audioRecording.recordedAudioBlob
            };

            await this.saveOnomatopoeia(
                this.filteredData,
                infoDict,
                this.config.spreadsheetId,
                this.config.OnomatopoeiaSheet,
                this.elements.messageDisplay
            );

            this.resetDisplayForCurrentVideo();
            
        } catch (error) {
            console.error('Error saving onomatopoeia:', error);
        }
    }

    // Audio recording methods
    async startAudioRecording() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            this.audioRecording.mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
            this.audioRecording.audioChunks = [];

            this.audioRecording.mediaRecorder.addEventListener('dataavailable', (event) => {
                if (event.data.size > 0) {
                    // Check file size - 10MB limit
                    const currentSize = this.audioRecording.audioChunks.reduce((total, chunk) => total + chunk.size, 0);
                    const newSize = currentSize + event.data.size;
                    
                    if (newSize > 10 * 1024 * 1024) { // 10MB in bytes
                        this.stopAudioRecording();
                        UIUtils.showError(this.elements.messageDisplay, 
                            langManager.getText('survey.audio_too_large'));
                        return;
                    }

                    this.audioRecording.audioChunks.push(event.data);
                }
            });

            this.audioRecording.mediaRecorder.addEventListener('stop', () => {
                this.audioRecording.recordedAudioBlob = new Blob(this.audioRecording.audioChunks, { type: 'audio/webm' });
                
                // Clean up previous URL before creating new one
                if (this.audioRecording.audioUrl) {
                    URL.revokeObjectURL(this.audioRecording.audioUrl);
                }
                
                this.audioRecording.audioUrl = URL.createObjectURL(this.audioRecording.recordedAudioBlob);
                this.updateAudioUIAfterRecording();
                
                // Stop all tracks to free up microphone
                stream.getTracks().forEach(track => track.stop());
            });

            this.audioRecording.mediaRecorder.start();
            this.updateAudioUIDuringRecording();
            
        } catch (error) {
            console.error('Error starting audio recording:', error);
            if (this.elements.audioStatus) {
                if (error.name === 'NotAllowedError') {
                    this.elements.audioStatus.textContent = langManager.getText('survey.audio_permission_denied');
                } else {
                    this.elements.audioStatus.textContent = langManager.getText('survey.audio_not_supported');
                }
            }
        }
    }

    stopAudioRecording() {
        if (this.audioRecording.mediaRecorder && this.audioRecording.mediaRecorder.state === 'recording') {
            this.audioRecording.mediaRecorder.stop();
        }
    }

    playAudioRecording() {
        if (this.audioRecording.audioUrl) {
            const audio = new Audio(this.audioRecording.audioUrl);
            if (this.elements.audioStatus) {
                this.elements.audioStatus.textContent = langManager.getText('survey.audio_status_playing');
            }
            if (this.elements.audioWaveform) {
                this.elements.audioWaveform.style.display = 'flex';
                this.elements.audioWaveform.classList.add('audio-playing');
            }
            
            audio.addEventListener('ended', () => {
                if (this.elements.audioStatus) {
                    this.elements.audioStatus.textContent = langManager.getText('survey.audio_status_recorded');
                }
                if (this.elements.audioWaveform) {
                    this.elements.audioWaveform.style.display = 'none';
                    this.elements.audioWaveform.classList.remove('audio-playing');
                }
            });
            
            audio.play();
        }
    }

    deleteAudioRecording() {
        this.resetAudioRecording();
    }

    resetAudioRecording() {
        // Clean up existing recording with proper URL cleanup
        if (this.audioRecording.audioUrl) {
            URL.revokeObjectURL(this.audioRecording.audioUrl);
        }

        // Stop any active media recorder and tracks
        if (this.audioRecording.mediaRecorder && this.audioRecording.mediaRecorder.state === 'recording') {
            this.audioRecording.mediaRecorder.stop();
        }

        this.audioRecording = {
            mediaRecorder: null,
            audioChunks: [],
            recordedAudioBlob: null,
            audioUrl: null
        };

        this.updateAudioUIInitial();
    }

    updateAudioUIDuringRecording() {
        if (this.elements.audioRecord) this.elements.audioRecord.style.display = 'none';
        if (this.elements.audioStop) this.elements.audioStop.style.display = 'inline-block';
        if (this.elements.audioPlay) this.elements.audioPlay.style.display = 'none';
        if (this.elements.audioDelete) this.elements.audioDelete.style.display = 'none';
        if (this.elements.audioStatus) this.elements.audioStatus.textContent = langManager.getText('survey.audio_status_recording');
        if (this.elements.audioWaveform) {
            this.elements.audioWaveform.style.display = 'flex';
            this.elements.audioWaveform.classList.add('audio-recording');
        }
    }

    updateAudioUIAfterRecording() {
        if (this.elements.audioRecord) this.elements.audioRecord.style.display = 'none';
        if (this.elements.audioStop) this.elements.audioStop.style.display = 'none';
        if (this.elements.audioPlay) this.elements.audioPlay.style.display = 'inline-block';
        if (this.elements.audioDelete) this.elements.audioDelete.style.display = 'inline-block';
        if (this.elements.audioStatus) this.elements.audioStatus.textContent = langManager.getText('survey.audio_status_recorded');
        if (this.elements.audioWaveform) {
            this.elements.audioWaveform.style.display = 'none';
            this.elements.audioWaveform.classList.remove('audio-recording');
        }
    }

    updateAudioUIInitial() {
        if (this.elements.audioRecord) this.elements.audioRecord.style.display = 'inline-block';
        if (this.elements.audioStop) this.elements.audioStop.style.display = 'none';
        if (this.elements.audioPlay) this.elements.audioPlay.style.display = 'none';
        if (this.elements.audioDelete) this.elements.audioDelete.style.display = 'none';
        if (this.elements.audioStatus) this.elements.audioStatus.textContent = langManager.getText('survey.audio_status_ready');
        if (this.elements.audioWaveform) {
            this.elements.audioWaveform.style.display = 'none';
            this.elements.audioWaveform.classList.remove('audio-recording', 'audio-playing');
        }
    }

    // Survey-specific helper methods
    resetDisplay(currentVideoName, filteredData, docElts) {
        // Reset form inputs
        if (docElts.onomatopoeiaInput) docElts.onomatopoeiaInput.value = "";
        if (docElts.startDisplay) docElts.startDisplay.textContent = "-.--";
        if (docElts.endDisplay) docElts.endDisplay.textContent = "-.--";

        // Reset visibility
        if (docElts.buttonVisibility) docElts.buttonVisibility.style.display = "block";
        if (docElts.inputVisibility) docElts.inputVisibility.style.display = "none";

        // Clear messages
        if (this.elements.messageDisplay) {
            UIUtils.clearMessage(this.elements.messageDisplay);
        }

        // Reset audio recording
        this.resetAudioRecording();

        let recordMessage = "";

        // Update video button completion states using VideoManager
        if (this.videoManager) {
            this.videoManager.updateButtonCompletionStates(filteredData, {
                determineState: (videoName, data) => {
                    const videoData = data.filter(item => item["video"] === videoName);
                    if (videoData.length > 0) {
                        // Check if there are any actual onomatopoeia (not "null")
                        const hasActualOnomatopoeia = videoData.some(item => item["onomatopoeia"] !== "null");
                        
                        if (hasActualOnomatopoeia) {
                            return 'completed'; // User has saved at least one onomatopoeia - green
                        } else {
                            return 'no-onomatopoeia'; // User said no onomatopoeia in this video - yellow
                        }
                    }
                    return null;
                }
            });
        }

        // Display existing onomatopoeia data for current video
        const relevantData = filteredData.filter(item => 
            item["video"] === currentVideoName && item["onomatopoeia"] !== "null"
        );

        if (!relevantData.length) {
            recordMessage = langManager.getText('survey.no_saved_onomatopoeia');
        } else {
            relevantData.forEach(item => {
                const audioIcon = item["hasAudio"] === 1 ? " 🎵" : "";
                recordMessage += `-"${item["onomatopoeia"]}"${audioIcon} from ${item["startTime"]} to ${item["endTime"]};<br>`;
            });
        }

        if (docElts.recordOnomatopoeia) {
            docElts.recordOnomatopoeia.innerHTML = recordMessage;
        }

        if (docElts.questionText) {
            // Use different text based on whether user has already provided onomatopoeia for this video
            const hasExistingOnomatopoeia = relevantData.length > 0;
            const questionKey = hasExistingOnomatopoeia ? 'survey.question_text_more' : 'survey.question_text';
            docElts.questionText.textContent = langManager.getText(questionKey);
        }

        // Update reasoning button visibility
        this.updateReasoningButtonVisibility();
    }

    async saveOnomatopoeia(filteredData, infoDict, spreadsheetId, OnomatopoeiaSheet, messageDisplay, verbose = true) {
        // Validate input data
        const validation = ValidationUtils.validateOnomatopoeiaData(infoDict);
        if (!validation.isValid) {
            if (verbose) {
                UIUtils.showError(messageDisplay, validation.errorMessage);
            }
            throw new Error(validation.errorMessage);
        }

        // Handle audio upload if present
        let audioFileName = null;
        if (infoDict.audioBlob && infoDict.hasAudio === 1) {
            try {
                audioFileName = await uploadAudioFile(
                    infoDict.audioBlob, 
                    infoDict.participantId, 
                    infoDict.participantName,
                    infoDict.video, 
                    infoDict.onomatopoeia, 
                    infoDict.answeredTimestamp
                );
            } catch (audioError) {
                console.error("Audio upload failed:", audioError);
                if (verbose) {
                    UIUtils.showError(messageDisplay, langManager.getText('survey.audio_upload_error'));
                }
            }
        }

        // Prepare onomatopoeia data using the service
        const onomatopoeiaData = {
            participantId: parseInt(infoDict.participantId),
            participantName: infoDict.participantName,
            video: infoDict.video,
            onomatopoeia: infoDict.onomatopoeia,
            startTime: parseFloat(infoDict.startTime),
            endTime: parseFloat(infoDict.endTime),
            answeredTimestamp: infoDict.answeredTimestamp,
            hasAudio: infoDict.hasAudio || 0,
            audioFileName: audioFileName || ""
        };

        const appendResult = await googleSheetsService.saveOnomatopoeia(spreadsheetId, OnomatopoeiaSheet, onomatopoeiaData);

        if (!appendResult) {
            if (verbose) {
                UIUtils.showError(messageDisplay, langManager.getText('survey.error_saving_sheet'));
            }
            throw new Error("Failed to save to sheet");
        }

        // Update local data
        const updatedInfoDict = {
            ...infoDict,
            hasAudio: infoDict.hasAudio || 0,
            audioFileName: audioFileName
        };
        delete updatedInfoDict.audioBlob;
        filteredData.push(updatedInfoDict);

        // Show success message
        if (verbose) {
            const successMessage = (infoDict.hasAudio === 1 && audioFileName) ? 
                langManager.getText('survey.success_saved_with_audio') :
                langManager.getText('survey.success_saved');
            UIUtils.showSuccess(messageDisplay, successMessage);
        }
    }

    checkAllVideosCompleted() {
        if (!this.elements.videoButtons) return false;
        
        const allButtons = this.elements.videoButtons.querySelectorAll('.video-button');
        
        // Check if all videos have been addressed (either have onomatopoeia or marked as no-onomatopoeia)
        let allAddressed = true;
        allButtons.forEach(button => {
            const buttonVideo = DOMUtils.safeGetDataset(button, 'video')?.split("/").pop();
            if (buttonVideo) {
                // Check if this video has any data (onomatopoeia or "no" response)
                const hasData = this.filteredData.some(item => item.video === buttonVideo);
                if (!hasData) {
                    allAddressed = false;
                }
            }
        });
        
        return allAddressed && allButtons.length > 0;
    }

    showCompletionModal() {
        // Add completion modal elements to the elements object if not already added
        if (!this.elements.surveyCompletion) {
            this.elements.surveyCompletion = DOMUtils.getElement("surveyCompletion");
            this.elements.startReasoningButton = DOMUtils.getElement("startReasoningButton");
            
            // Set up event listener for the reasoning button
            if (this.elements.startReasoningButton) {
                this.elements.startReasoningButton.addEventListener('click', () => {
                    this.startReasoningPhase();
                });
            }
        }
        
        // Show the completion modal
        if (this.elements.surveyCompletion) {
            this.elements.surveyCompletion.style.display = 'flex';
        }
    }

    startReasoningPhase() {
        // Store current completion state
        localStorage.setItem("surveyCompleted", "true");
        
        // Redirect to reasoning page
        window.location.href = "reasoning.html";
    }

    goToNextVideo(currentButton) {
        if (!this.elements.videoButtons) return;
        
        const allButtons = Array.from(this.elements.videoButtons.querySelectorAll('.video-button'));
        const currentIndex = allButtons.indexOf(currentButton);
        
        if (currentIndex < allButtons.length - 1) {
            const nextButton = allButtons[currentIndex + 1];
            DOMUtils.safeClick(nextButton);
        } else {
            // Reached the end - check if all videos are completed
            if (this.checkAllVideosCompleted()) {
                // All videos completed - show completion modal
                this.showCompletionModal();
            } else {
                // Not all videos completed yet - show regular message
                if (this.elements.messageDisplay) {
                    UIUtils.showSuccess(this.elements.messageDisplay, langManager.getText('survey.all_videos_complete'));
                }
            }
        }
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.surveyApp = new SurveyApp();
});
