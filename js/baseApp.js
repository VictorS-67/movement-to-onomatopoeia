// Base Application Class
// Extracts common functionality shared across all app classes

class BaseApp {
    constructor() {
        this.elements = {};
        this.config = null;
        this.participantInfo = null;
        
        // Allow subclasses to initialize their specific elements first
        this.initializeElements();
        
        // Start the common initialization process
        this.initialize();
    }

    // Abstract method - must be implemented by subclasses
    initializeElements() {
        throw new Error("initializeElements() must be implemented by subclass");
    }

    async initialize() {
        try {
            // Initialize language manager and configuration in parallel
            const [langInitialized, config] = await Promise.all([
                langManager.ensureInitialized(),
                ConfigManager.getSheetConfig()
            ]);
            
            this.config = config;
            console.log('Configuration loaded');

            // Call subclass-specific initialization
            await this.initializeSubclass();
            
        } catch (error) {
            console.error('Failed to initialize app:', error);
            this.handleInitializationError(error);
        }
    }

    // Abstract method - implemented by subclasses for their specific initialization
    async initializeSubclass() {
        // Default implementation - can be overridden
    }

    handleInitializationError(error) {
        if (this.elements.messageDisplay) {
            UIUtils.showError(this.elements.messageDisplay, 'Failed to initialize application');
        }
    }

    setupCommonEventListeners() {
        // Language switching - common across all apps
        if (this.elements.languageSelect) {
            this.elements.languageSelect.addEventListener("change", async (event) => {
                const selectedLanguage = event.target.value;
                await langManager.switchLanguage(selectedLanguage);
                this.onLanguageChange();
            });
        }

        // Logout button - common across most apps
        if (this.elements.buttonLogout) {
            this.elements.buttonLogout.addEventListener('click', this.handleLogout.bind(this));
        }
    }

    // Method called when language changes - can be overridden by subclasses
    onLanguageChange() {
        this.updateParticipantDisplay();
    }

    updateParticipantDisplay() {
        if (this.elements.nameDisplay && this.participantInfo) {
            const participantName = this.participantInfo.name || this.participantInfo.email;
            // Get the appropriate translation key based on the app type
            const textKey = this.getParticipantDisplayKey();
            this.elements.nameDisplay.textContent = langManager.getText(textKey) + participantName;
        }
    }

    // Abstract method - each app can specify its own translation key
    getParticipantDisplayKey() {
        return 'ui.participant_name'; // Default fallback
    }

    handleLogout() {
        localStorage.removeItem("participantInfo");
        localStorage.removeItem("filteredData");
        
        // Allow subclasses to add additional cleanup
        this.performAdditionalLogoutCleanup();
        
        window.location.href = "index.html";
    }

    // Hook for subclasses to add additional logout cleanup
    performAdditionalLogoutCleanup() {
        // Default implementation - can be overridden
    }

    // Common participant info validation and loading
    loadAndValidateParticipantInfo() {
        this.participantInfo = JSON.parse(localStorage.getItem("participantInfo"));
        
        if (!this.participantInfo) {
            alert("Warning, no participant information found");
            window.location.href = "index.html";
            return false;
        }
        
        return true;
    }

    // Common message clearing utility
    clearMessage() {
        if (this.elements.messageDisplay) {
            UIUtils.clearMessage(this.elements.messageDisplay);
        }
    }

    // Common success message display
    showSuccess(message) {
        if (this.elements.messageDisplay) {
            UIUtils.showSuccess(this.elements.messageDisplay, message);
        }
    }

    // Common error message display
    showError(message) {
        if (this.elements.messageDisplay) {
            UIUtils.showError(this.elements.messageDisplay, message);
        }
    }
}
