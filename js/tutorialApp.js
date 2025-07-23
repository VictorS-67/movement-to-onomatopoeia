// Tutorial application logic
class TutorialApp {
    constructor() {
        this.elements = {};
        this.participantInfo = null;
        this.tutorialData = []; // Local storage for tutorial data
        this.currentStep = 1;
        this.totalSteps = 13; // Added step 13 for final completion message
        this.stepValidation = {}; // Track required actions
        this.lastVideoPlayTime = 0;
        this.scrollTimeout = null; // For debouncing scroll-triggered repositioning
        
        this.initializeElements();
        this.initialize();
    }

    initializeElements() {
        this.elements = {
            // Main UI elements
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
            
            // Audio elements
            audioRecord: DOMUtils.getElement("audioRecord"),
            audioStop: DOMUtils.getElement("audioStop"),
            audioPlay: DOMUtils.getElement("audioPlay"),
            audioDelete: DOMUtils.getElement("audioDelete"),
            audioStatus: DOMUtils.getElement("audioStatus"),
            audioWaveform: DOMUtils.getElement("audioWaveform"),
            
            // Tutorial elements
            tutorialOverlay: DOMUtils.getElement("tutorialOverlay"),
            tutorialBubble: DOMUtils.getElement("tutorialBubble"),
            bubbleTitle: DOMUtils.getElement("bubbleTitle"),
            bubbleText: DOMUtils.getElement("bubbleText"),
            bubbleNext: DOMUtils.getElement("bubbleNext"),
            bubblePrevious: DOMUtils.getElement("bubblePrevious"),
            bubbleSkip: DOMUtils.getElement("bubbleSkip"),
            progressFill: DOMUtils.getElement("progressFill"),
            currentStep: DOMUtils.getElement("currentStep"),
            totalSteps: DOMUtils.getElement("totalSteps"),
            
            // Tutorial welcome
            tutorialWelcome: DOMUtils.getElement("tutorialWelcome"),
            startTutorialButton: DOMUtils.getElement("startTutorialButton"),
            
            // Tutorial completion
            tutorialCompletion: DOMUtils.getElement("tutorialCompletion"),
            startSurveyButton: DOMUtils.getElement("startSurveyButton")
        };
    }

    async initialize() {
        try {
            // Check participant info
            this.participantInfo = JSON.parse(localStorage.getItem("participantInfo"));

            if (!this.participantInfo) {
                alert("Warning, no participant information found");
                window.location.href = "index.html";
                return;
            }

            // Initialize language manager
            await langManager.ensureInitialized();
            
            // Set up event listeners
            this.setupEventListeners();
            
            // Update participant name display
            this.updateParticipantDisplay();
            
            // Initialize tutorial
            this.initializeTutorial();
            
            // Show welcome modal instead of starting tutorial immediately
            this.showWelcomeModal();

        } catch (error) {
            console.error('Failed to initialize tutorial app:', error);
            if (this.elements.messageDisplay) {
                UIUtils.showError(this.elements.messageDisplay, 'Failed to initialize tutorial');
            }
        }
    }

    setupEventListeners() {
        // Language switching
        if (this.elements.languageSelect) {
            this.elements.languageSelect.addEventListener("change", async (event) => {
                const selectedLanguage = event.target.value;
                await langManager.switchLanguage(selectedLanguage);
                this.updateParticipantDisplay();
                this.updateCurrentStepContent();
            });
        }

        // Video interactions for tracking
        if (this.elements.videoPlayer) {
            this.elements.videoPlayer.addEventListener('play', () => {
                this.lastVideoPlayTime = Date.now();
                this.checkStepValidation('video_played');
            });
        }

        // Button interactions
        if (this.elements.hasOnomatopoeiaButtonYes) {
            this.elements.hasOnomatopoeiaButtonYes.addEventListener('click', () => {
                this.checkStepValidation('clicked_yes');
                this.showOnomatopoeiaInput();
            });
        }

        if (this.elements.hasOnomatopoeiaButtonNo) {
            this.elements.hasOnomatopoeiaButtonNo.addEventListener('click', () => {
                this.checkStepValidation('clicked_no');
                this.handleNoOnomatopoeia();
            });
        }

        // Input changes
        if (this.elements.onomatopoeiaInput) {
            this.elements.onomatopoeiaInput.addEventListener('input', (e) => {
                if (e.target.value.trim().length > 0) {
                    this.checkStepValidation('entered_text');
                }
            });
        }

        // Time capture buttons
        if (this.elements.getStart) {
            this.elements.getStart.addEventListener('click', () => {
                this.checkStepValidation('clicked_start_time');
                this.captureStartTime();
            });
        }

        if (this.elements.getEnd) {
            this.elements.getEnd.addEventListener('click', () => {
                this.checkStepValidation('clicked_end_time');
                this.captureEndTime();
            });
        }

        // Save button
        if (this.elements.saveOnomatopoeiaButton) {
            this.elements.saveOnomatopoeiaButton.addEventListener('click', () => {
                this.checkStepValidation('clicked_save');
                this.handleSaveOnomatopoeia();
            });
        }

        // Tutorial navigation
        if (this.elements.bubbleNext) {
            this.elements.bubbleNext.addEventListener('click', () => {
                this.nextStep();
            });
        }

        if (this.elements.bubblePrevious) {
            this.elements.bubblePrevious.addEventListener('click', () => {
                this.previousStep();
            });
        }

        if (this.elements.bubbleSkip) {
            this.elements.bubbleSkip.addEventListener('click', () => {
                this.skipTutorial();
            });
        }

        // Tutorial welcome
        if (this.elements.startTutorialButton) {
            this.elements.startTutorialButton.addEventListener('click', () => {
                this.startTutorialFromWelcome();
            });
        }

        // Tutorial completion
        if (this.elements.startSurveyButton) {
            this.elements.startSurveyButton.addEventListener('click', () => {
                this.completeTutorialAndStartSurvey();
            });
        }

        // Logout button
        if (this.elements.buttonLogout) {
            this.elements.buttonLogout.addEventListener('click', () => {
                localStorage.removeItem("participantInfo");
                window.location.href = "index.html";
            });
        }

        // Video button clicks
        if (this.elements.videoButtons) {
            this.elements.videoButtons.addEventListener('click', (event) => {
                if (event.target.classList.contains('video-button')) {
                    this.handleVideoButtonClick(event);
                }
            });
        }

        // Window resize handler to reposition bubbles
        window.addEventListener('resize', () => {
            if (this.currentStep >= 1 && this.currentStep <= this.totalSteps) {
                // Delay to allow layout to settle
                setTimeout(() => {
                    this.positionBubbleForStep(this.currentStep);
                }, 100);
            }
        });

        // Scroll handler to reposition bubbles when user scrolls
        window.addEventListener('scroll', () => {
            if (this.currentStep >= 1 && this.currentStep <= this.totalSteps) {
                // Only reposition, don't auto-scroll again
                const step = this.currentStep;
                const elementMap = {
                    1: this.elements.languageSelect?.parentElement,
                    2: this.elements.videoPlayer,
                    3: this.elements.videoPlayer,
                    4: this.elements.hasOnomatopoeiaButtonYes,
                    5: this.elements.onomatopoeiaInput,
                    6: this.elements.getStart,
                    7: this.elements.getEnd,
                    8: this.elements.audioRecord,
                    9: this.elements.saveOnomatopoeiaButton,
                    10: this.elements.hasOnomatopoeiaButtonNo,
                    11: this.elements.videoButtons,
                    12: this.elements.hasOnomatopoeiaButtonNo,
                    13: this.elements.videoButtons
                };
                
                const targetElement = elementMap[step];
                if (targetElement && this.elements.tutorialBubble) {
                    // Debounce the repositioning to avoid too many calls
                    clearTimeout(this.scrollTimeout);
                    this.scrollTimeout = setTimeout(() => {
                        this.positionBubbleNearElement(targetElement, this.elements.tutorialBubble);
                    }, 50);
                }
            }
        });
    }

    initializeTutorial() {
        // Set total steps
        if (this.elements.totalSteps) {
            this.elements.totalSteps.textContent = this.totalSteps;
        }
        
        // Initialize step validation tracking
        this.stepValidation = {
            video_played: false,
            clicked_yes: false,
            entered_text: false,
            clicked_start_time: false,
            clicked_end_time: false,
            clicked_save: false,
            clicked_no: false
        };
        
        // Reset display
        this.resetDisplay();
    }

    showWelcomeModal() {
        // Hide tutorial overlay initially
        if (this.elements.tutorialOverlay) {
            this.elements.tutorialOverlay.classList.add('hidden');
        }
        
        // Show welcome modal
        if (this.elements.tutorialWelcome) {
            this.elements.tutorialWelcome.style.display = 'flex';
        }
    }

    startTutorialFromWelcome() {
        // Hide welcome modal
        if (this.elements.tutorialWelcome) {
            this.elements.tutorialWelcome.style.display = 'none';
        }
        
        // Start the actual tutorial
        this.startTutorial();
    }

    startTutorial() {
        this.currentStep = 1;
        this.updateProgress();
        this.showTutorialStep();
    }

    nextStep() {
        // Check if required action is completed for current step
        if (!this.canProceedToNextStep()) {
            return;
        }
        
        if (this.currentStep < this.totalSteps) {
            this.currentStep++;
            this.updateProgress();
            this.showTutorialStep();
        } else {
            this.completeTutorial();
        }
    }

    previousStep() {
        if (this.currentStep > 1) {
            this.currentStep--;
            this.updateProgress();
            this.showTutorialStep();
        }
    }

    canProceedToNextStep() {
        const step = this.currentStep;
        
        // Define required actions for each step
        const requirements = {
            2: () => this.stepValidation.video_played, // Video must be played (no time requirement)
            4: () => this.stepValidation.clicked_yes, // Must click Yes
            5: () => this.stepValidation.entered_text, // Must enter text
            6: () => this.stepValidation.clicked_start_time, // Must click start time
            7: () => this.stepValidation.clicked_end_time, // Must click end time
            9: () => this.stepValidation.clicked_save, // Must click save
            10: () => this.stepValidation.clicked_no, // Must click No
            // Steps 1, 3, 8, 11 have no requirements
        };
        
        if (requirements[step]) {
            const canProceed = requirements[step]();
            if (!canProceed) {
                // Show message about required action
                this.showRequiredActionMessage(step);
                return false;
            }
        }
        
        return true;
    }

    showRequiredActionMessage(step) {
        const messages = {
            2: "Please play the video to continue.",
            4: "Please click the 'Yes' button to continue.",
            5: "Please enter some text in the onomatopoeia field to continue.",
            6: "Please click the 'Get Start Time' button to continue.",
            7: "Please click the 'Get End Time' button to continue.",
            9: "Please click the 'Save Onomatopoeia' button to continue.",
            10: "Please click the 'No' button to continue."
        };
        
        if (this.elements.messageDisplay && messages[step]) {
            UIUtils.showError(this.elements.messageDisplay, messages[step]);
            setTimeout(() => {
                UIUtils.clearMessage(this.elements.messageDisplay);
            }, 3000);
        }
    }

    checkStepValidation(action) {
        if (this.stepValidation.hasOwnProperty(action)) {
            this.stepValidation[action] = true;
            this.updateNextButtonState();
            
            // Auto-advance for specific steps when their action is completed
            const autoAdvanceSteps = {
                2: 'video_played',        // Step 2: Auto-advance when video is played
                4: 'clicked_yes',         // Step 4: Auto-advance when Yes is clicked
                6: 'clicked_start_time',  // Step 6: Auto-advance when start time is captured
                7: 'clicked_end_time',    // Step 7: Auto-advance when end time is captured
                9: 'clicked_save',        // Step 9: Auto-advance when save is clicked
                10: 'clicked_no',         // Step 10: Auto-advance when No is clicked
                12: 'clicked_no'          // Step 12: Auto-advance when No is clicked
            };
            
            // Check if current step should auto-advance for this action
            if (autoAdvanceSteps[this.currentStep] === action) {
                // Auto-advance immediately when action is completed
                this.nextStep();
            }
        }
    }

    updateNextButtonState() {
        if (this.elements.bubbleNext) {
            const canProceed = this.canProceedToNextStep();
            this.elements.bubbleNext.disabled = !canProceed;
        }
    }

    updateProgress() {
        const progressPercent = (this.currentStep / this.totalSteps) * 100;
        
        if (this.elements.progressFill) {
            this.elements.progressFill.style.width = `${progressPercent}%`;
        }
        
        if (this.elements.currentStep) {
            this.elements.currentStep.textContent = this.currentStep;
        }
    }

    showTutorialStep() {
        const stepData = this.getTutorialStepData(this.currentStep);
        
        // Update bubble content
        if (this.elements.bubbleTitle) {
            this.elements.bubbleTitle.textContent = stepData.title;
        }
        
        if (this.elements.bubbleText) {
            this.elements.bubbleText.textContent = stepData.text;
        }
        
        // Show/hide previous button
        if (this.elements.bubblePrevious) {
            this.elements.bubblePrevious.style.display = this.currentStep > 1 ? 'inline-block' : 'none';
        }
        
        // Update next button text
        if (this.elements.bubbleNext) {
            this.elements.bubbleNext.textContent = this.currentStep === this.totalSteps ? 
                langManager.getText('tutorial.complete') : 
                langManager.getText('tutorial.next');
        }
        
        // Mark step as required if needed
        if (stepData.required) {
            this.elements.tutorialBubble.classList.add('tutorial-required-action');
        } else {
            this.elements.tutorialBubble.classList.remove('tutorial-required-action');
        }
        
        // Position bubble and highlight element
        this.positionBubbleForStep(this.currentStep);
        this.highlightElementForStep(this.currentStep);
        
        // Update next button state
        this.updateNextButtonState();
        
        // Show tutorial overlay
        if (this.elements.tutorialOverlay) {
            this.elements.tutorialOverlay.classList.remove('hidden');
        }
    }

    getTutorialStepData(step) {
        const stepKeys = {
            1: { title: 'tutorial.step1_title', text: 'tutorial.step1_text', required: false },
            2: { title: 'tutorial.step2_title', text: 'tutorial.step2_text', required: true },
            3: { title: 'tutorial.step3_title', text: 'tutorial.step3_text', required: false },
            4: { title: 'tutorial.step4_title', text: 'tutorial.step4_text', required: true },
            5: { title: 'tutorial.step5_title', text: 'tutorial.step5_text', required: true },
            6: { title: 'tutorial.step6_title', text: 'tutorial.step6_text', required: true },
            7: { title: 'tutorial.step7_title', text: 'tutorial.step7_text', required: true },
            8: { title: 'tutorial.step8_title', text: 'tutorial.step8_text', required: false },
            9: { title: 'tutorial.step9_title', text: 'tutorial.step9_text', required: true },
            10: { title: 'tutorial.step10_title', text: 'tutorial.step10_text', required: true },
            11: { title: 'tutorial.step11_title', text: 'tutorial.step11_text', required: false },
            12: { title: 'tutorial.step12_title', text: 'tutorial.step12_text', required: false },
            13: { title: 'tutorial.step13_title', text: 'tutorial.step13_text', required: false }
        };
        
        const stepData = stepKeys[step];
        return {
            title: langManager.getText(stepData.title),
            text: langManager.getText(stepData.text),
            required: stepData.required
        };
    }

    positionBubbleForStep(step) {
        const elementMap = {
            1: this.elements.languageSelect?.parentElement, // Language selector
            2: this.elements.videoPlayer, // Video player
            3: this.elements.videoPlayer, // Video timeline (same as player)
            4: this.elements.hasOnomatopoeiaButtonYes, // Yes button
            5: this.elements.onomatopoeiaInput, // Input field
            6: this.elements.getStart, // Start time button
            7: this.elements.getEnd, // End time button
            8: this.elements.audioRecord, // Audio record button
            9: this.elements.saveOnomatopoeiaButton, // Save button
            10: this.elements.hasOnomatopoeiaButtonNo, // No button
            11: this.elements.videoButtons, // Video buttons
            12: this.elements.hasOnomatopoeiaButtonNo, // No button again for step 12
            13: this.elements.videoButtons // Step 13: Point at video buttons to show color change
        };
        
        const targetElement = elementMap[step];
        if (!targetElement || !this.elements.tutorialBubble) {
            return;
        }
        
        // First, scroll the target element into view
        this.scrollElementIntoView(targetElement).then(() => {
            // After scrolling is complete, position the bubble
            this.positionBubbleNearElement(targetElement, this.elements.tutorialBubble);
        });
    }

    scrollElementIntoView(element) {
        return new Promise((resolve) => {
            // Check if element is already fully visible
            const rect = element.getBoundingClientRect();
            const viewportHeight = window.innerHeight;
            const viewportWidth = window.innerWidth;
            
            const isFullyVisible = rect.top >= 0 && 
                                  rect.left >= 0 && 
                                  rect.bottom <= viewportHeight && 
                                  rect.right <= viewportWidth;
            
            if (isFullyVisible) {
                // Element is already visible, no need to scroll
                resolve();
                return;
            }
            
            // Calculate the desired scroll position to center the element in viewport
            const elementCenter = rect.top + rect.height / 2;
            const viewportCenter = viewportHeight / 2;
            const scrollOffset = elementCenter - viewportCenter;
            
            // Get current scroll position
            const currentScroll = window.pageYOffset || document.documentElement.scrollTop;
            const targetScroll = Math.max(0, currentScroll + scrollOffset);
            
            // Smooth scroll to the calculated position
            window.scrollTo({
                top: targetScroll,
                behavior: 'smooth'
            });
            
            // Wait for scroll animation to complete
            setTimeout(() => {
                resolve();
            }, 500); // Give enough time for smooth scroll to complete
        });
    }

    positionBubbleNearElement(targetElement, bubble) {
        // Get target element position and dimensions
        const targetRect = targetElement.getBoundingClientRect();
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        
        // Get bubble dimensions by temporarily showing it
        bubble.style.visibility = 'hidden';
        bubble.style.display = 'block';
        const bubbleRect = bubble.getBoundingClientRect();
        bubble.style.visibility = 'visible';
        
        // Calculate target center
        const targetCenterX = targetRect.left + targetRect.width / 2;
        const targetCenterY = targetRect.top + targetRect.height / 2;
        
        // Try different positions in order of preference
        const positions = [
            // Right of target
            {
                left: targetRect.right + 20,
                top: targetRect.top + (targetRect.height / 2) - (bubbleRect.height / 2),
                arrow: 'arrow-left'
            },
            // Left of target
            {
                left: targetRect.left - bubbleRect.width - 20,
                top: targetRect.top + (targetRect.height / 2) - (bubbleRect.height / 2),
                arrow: 'arrow-right'
            },
            // Below target
            {
                left: targetRect.left + (targetRect.width / 2) - (bubbleRect.width / 2),
                top: targetRect.bottom + 20,
                arrow: 'arrow-top'
            },
            // Above target
            {
                left: targetRect.left + (targetRect.width / 2) - (bubbleRect.width / 2),
                top: targetRect.top - bubbleRect.height - 20,
                arrow: 'arrow-bottom'
            }
        ];
        
        // Find the first position that fits within the viewport
        let bestPosition = positions[0]; // Default to right
        
        for (const position of positions) {
            const fitsHorizontally = position.left >= 20 && position.left + bubbleRect.width <= viewportWidth - 20;
            const fitsVertically = position.top >= 20 && position.top + bubbleRect.height <= viewportHeight - 20;
            
            if (fitsHorizontally && fitsVertically) {
                bestPosition = position;
                break;
            }
        }
        
        // If no position fits perfectly, adjust the best one
        let { left, top, arrow } = bestPosition;
        
        // Constrain to viewport bounds
        left = Math.max(20, Math.min(left, viewportWidth - bubbleRect.width - 20));
        top = Math.max(20, Math.min(top, viewportHeight - bubbleRect.height - 20));
        
        // Adjust arrow based on actual final position relative to target
        const bubbleCenterX = left + bubbleRect.width / 2;
        const bubbleCenterY = top + bubbleRect.height / 2;
        
        // Determine arrow direction based on bubble position relative to target
        const deltaX = bubbleCenterX - targetCenterX;
        const deltaY = bubbleCenterY - targetCenterY;
        
        if (Math.abs(deltaX) > Math.abs(deltaY)) {
            // Horizontal positioning is dominant
            if (deltaX > 0) {
                arrow = 'arrow-left'; // Bubble is to the right, arrow points left
            } else {
                arrow = 'arrow-right'; // Bubble is to the left, arrow points right
            }
        } else {
            // Vertical positioning is dominant
            if (deltaY > 0) {
                arrow = 'arrow-top'; // Bubble is below, arrow points up
            } else {
                arrow = 'arrow-bottom'; // Bubble is above, arrow points down
            }
        }
        
        // Apply position
        bubble.style.position = 'fixed';
        bubble.style.left = `${left}px`;
        bubble.style.top = `${top}px`;
        
        // Update arrow direction
        bubble.className = bubble.className.replace(/arrow-\w+(-\w+)?/g, '');
        bubble.classList.add(arrow);
    }

    highlightElementForStep(step) {
        // Remove previous highlights
        document.querySelectorAll('.tutorial-highlight').forEach(el => {
            el.classList.remove('tutorial-highlight');
        });
        
        // Note: Removed tutorial-active class addition for better UX
        
        const elementMap = {
            1: this.elements.languageSelect?.parentElement,
            2: this.elements.videoPlayer,
            3: this.elements.videoPlayer,
            4: this.elements.hasOnomatopoeiaButtonYes,
            5: this.elements.onomatopoeiaInput,
            6: this.elements.getStart,
            7: this.elements.getEnd,
            8: this.elements.audioRecord,
            9: this.elements.saveOnomatopoeiaButton,
            10: this.elements.hasOnomatopoeiaButtonNo,
            11: this.elements.videoButtons,
            12: this.elements.hasOnomatopoeiaButtonNo,
            13: this.elements.videoButtons // Step 13: Highlight video buttons
        };
        
        const targetElement = elementMap[step];
        if (targetElement) {
            targetElement.classList.add('tutorial-highlight');
        }
    }

    updateCurrentStepContent() {
        // Update current step content when language changes
        if (this.currentStep >= 1 && this.currentStep <= this.totalSteps) {
            this.showTutorialStep();
        }
    }

    // Survey functionality (tutorial versions - save locally only)
    showOnomatopoeiaInput() {
        if (this.elements.buttonVisibility) {
            this.elements.buttonVisibility.style.display = "none";
        }
        if (this.elements.inputVisibility) {
            this.elements.inputVisibility.style.display = "block";
        }
    }

    handleNoOnomatopoeia() {
        // In tutorial, just simulate the action locally
        const tutorialData = {
            video: "videos/1.mp4",
            onomatopoeia: "null",
            startTime: "null",
            endTime: "null",
            timestamp: new Date().toISOString(),
            hasAudio: 0
        };
        
        this.tutorialData.push(tutorialData);
        
        // Update video button color to yellow (completed without onomatopoeia)
        // if not already completed
        if (!this.elements.videoButtons.querySelector('.video-button.active').classList.contains('completed')) {
            this.updateActiveVideoButtonState('no-onomatopoeia');
        }
        
        // Load the next video automatically
        this.goToNextVideo();
                
        if (this.elements.messageDisplay) {
            UIUtils.showSuccess(this.elements.messageDisplay, langManager.getText('tutorial.saved_locally'));
        }
        
        this.resetDisplay();
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

    handleSaveOnomatopoeia() {
        // In tutorial, save locally only
        const tutorialData = {
            video: this.elements.videoPlayer?.src || "videos/1.mp4",
            onomatopoeia: this.elements.onomatopoeiaInput?.value?.trim() || "",
            startTime: this.elements.startDisplay?.textContent || "-.--",
            endTime: this.elements.endDisplay?.textContent || "-.--",
            timestamp: new Date().toISOString(),
            hasAudio: 0
        };
        
        this.tutorialData.push(tutorialData);
        
        // Update video button color to green (completed with onomatopoeia)
        this.updateActiveVideoButtonState('completed');
        
        if (this.elements.messageDisplay) {
            UIUtils.showSuccess(this.elements.messageDisplay, langManager.getText('tutorial.saved_locally'));
        }
        
        this.resetDisplay();
    }

    handleVideoButtonClick(event) {
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
        }
        
        this.resetDisplay();
    }

    updateActiveVideoButtonState(state) {
        // Find the currently active video button
        const activeButton = this.elements.videoButtons?.querySelector('.video-button.active');
        if (activeButton) {
            // Remove any existing completion state classes
            activeButton.classList.remove('completed', 'no-onomatopoeia');
            
            // Add the new state class
            if (state === 'completed') {
                activeButton.classList.add('completed');
            } else if (state === 'no-onomatopoeia') {
                activeButton.classList.add('no-onomatopoeia');
            }
        }
    }

    goToNextVideo() {
        if (!this.elements.videoButtons) return;
        
        const currentButton = this.elements.videoButtons.querySelector('.video-button.active');
        if (!currentButton) return;
        
        const allButtons = Array.from(this.elements.videoButtons.querySelectorAll('.video-button'));
        const currentIndex = allButtons.indexOf(currentButton);
        
        if (currentIndex < allButtons.length - 1) {
            const nextButton = allButtons[currentIndex + 1];
            DOMUtils.safeClick(nextButton);
        } else {
            // Reached the end - just show message but don't auto-advance
            if (this.elements.messageDisplay) {
                UIUtils.showSuccess(this.elements.messageDisplay, langManager.getText('tutorial.all_videos_complete'));
            }
        }
    }

    resetDisplay() {
        // Reset form inputs
        if (this.elements.onomatopoeiaInput) this.elements.onomatopoeiaInput.value = "";
        if (this.elements.startDisplay) this.elements.startDisplay.textContent = "-.--";
        if (this.elements.endDisplay) this.elements.endDisplay.textContent = "-.--";

        // Reset visibility
        if (this.elements.buttonVisibility) this.elements.buttonVisibility.style.display = "block";
        if (this.elements.inputVisibility) this.elements.inputVisibility.style.display = "none";

        // Show tutorial data
        if (this.elements.recordOnomatopoeia) {
            const currentVideo = this.elements.videoPlayer?.src?.split('/').pop() || '1.mp4';
            const videoData = this.tutorialData.filter(item => 
                item.video.includes(currentVideo) && item.onomatopoeia !== "null"
            );
            
            if (videoData.length === 0) {
                this.elements.recordOnomatopoeia.innerHTML = langManager.getText('survey.no_saved_onomatopoeia');
            } else {
                let message = "";
                videoData.forEach(item => {
                    message += `- "${item.onomatopoeia}" from ${item.startTime} to ${item.endTime}<br>`;
                });
                this.elements.recordOnomatopoeia.innerHTML = message;
            }
        }

        // Clear messages
        if (this.elements.messageDisplay) {
            UIUtils.clearMessage(this.elements.messageDisplay);
        }
    }

    updateParticipantDisplay() {
        if (this.elements.nameDisplay && this.participantInfo) {
            const participantName = this.participantInfo.name || this.participantInfo.email;
            this.elements.nameDisplay.textContent = langManager.getText('tutorial.participant_name') + participantName;
        }
    }

    skipTutorial() {
        if (confirm(langManager.getText('tutorial.skip_confirm'))) {
            this.completeTutorialAndStartSurvey();
        }
    }

    completeTutorial() {
        // Hide tutorial overlay
        if (this.elements.tutorialOverlay) {
            this.elements.tutorialOverlay.classList.add('hidden');
        }
        
        // Remove highlighting
        document.querySelectorAll('.tutorial-highlight').forEach(el => {
            el.classList.remove('tutorial-highlight');
        });
        // Note: Removed tutorial-active class removal as it's no longer added
        
        // Show completion modal
        if (this.elements.tutorialCompletion) {
            this.elements.tutorialCompletion.style.display = 'flex';
        }
    }

    completeTutorialAndStartSurvey() {
        // Clear tutorial data
        this.tutorialData = [];
        
        // Redirect to survey
        window.location.href = "survey.html";
    }
}

// Initialize the tutorial app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.tutorialApp = new TutorialApp();
});
