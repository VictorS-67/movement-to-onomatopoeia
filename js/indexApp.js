// Main application logic for index.html
class IndexApp extends BaseApp {
    constructor() {
        super();
        this.setupEventListeners();
    }

    initializeElements() {
        this.elements = {
            emailForm: DOMUtils.getElement("emailForm"),
            participantForm: DOMUtils.getElement("participantForm"),
            introSection: DOMUtils.getElement("introSection"),
            languageSelect: DOMUtils.getElement("languageSelect"),
            emailInput: DOMUtils.getElement("emailInput"),
            nameInput: DOMUtils.getElement("nameInput"),
            ageInput: DOMUtils.getElement("ageInput"),
            genderInput: DOMUtils.getElement("genderInput"),
            movementPracticeInput: DOMUtils.getElement("movementPracticeInput"),
            nativeLanguageInput: DOMUtils.getElement("nativeLanguageInput"),
            messageDisplay: DOMUtils.getElement("message")
        };
    }

    async initializeSubclass() {
        // IndexApp doesn't need additional async initialization beyond the base class
        console.log('IndexApp initialized');
    }

    getParticipantDisplayKey() {
        return 'ui.participant_name';
    }

    setupEventListeners() {
        // Set up common event listeners from base class
        this.setupCommonEventListeners();

        // Email form submission
        if (this.elements.emailForm) {
            this.elements.emailForm.addEventListener("submit", this.handleEmailSubmit.bind(this));
        }

        // Participant form submission
        if (this.elements.participantForm) {
            this.elements.participantForm.addEventListener("submit", this.handleParticipantSubmit.bind(this));
        }
    }

    async handleEmailSubmit(event) {
        event.preventDefault();
        
        const email = ValidationUtils.sanitizeInput(this.elements.emailInput.value);

        // Validate email
        if (!ValidationUtils.isValidEmail(email)) {
            UIUtils.showError(this.elements.messageDisplay, langManager.getText('ui.error_invalid_email'));
            return;
        }

        try {
            UIUtils.clearMessage(this.elements.messageDisplay);
            this.elements.messageDisplay.textContent = langManager.getText('ui.checking_participant');
            this.elements.messageDisplay.style.color = "blue";

            // Check if participant exists
            const existingParticipantInfo = await checkParticipantExists(
                this.config.spreadsheetId, 
                this.config.ParticipantSheet, 
                email
            );

            if (existingParticipantInfo) {
                // Returning participant - go directly to survey
                localStorage.setItem("participantInfo", JSON.stringify(existingParticipantInfo));

                // Get their existing data
                const sheetData = await getSheetData(this.config.spreadsheetId, this.config.OnomatopoeiaSheet);
                const filteredData = parseCSV(sheetData).filter(item => 
                    item["participantId"] === existingParticipantInfo.participantId
                );
                localStorage.setItem("filteredData", JSON.stringify(filteredData));
                
                // Redirect to survey
                window.location.href = "survey.html";
            } else {
                // New participant - show intro section and registration form
                this.elements.introSection.style.display = "block";
                this.elements.participantForm.style.display = "block";
                UIUtils.showSuccess(this.elements.messageDisplay, langManager.getText('ui.welcome_message'));
            }
        } catch (error) {
            UIUtils.showError(this.elements.messageDisplay, langManager.getText('ui.error_checking'));
            console.error("Error:", error);
        }
    }

    async handleParticipantSubmit(event) {
        event.preventDefault();
        
        const formData = this.validateAndCollectFormData();
        if (!formData) return;

        try {
            this.elements.messageDisplay.textContent = langManager.getText('ui.creating_profile');
            this.elements.messageDisplay.style.color = "blue";

            // Save new participant
            const participantInfo = await saveNewParticipant(
                this.config.spreadsheetId, 
                this.config.ParticipantSheet, 
                formData
            );

            localStorage.setItem("participantInfo", JSON.stringify(participantInfo));
            localStorage.setItem("filteredData", JSON.stringify([]));

            // New participants should go to tutorial first
            window.location.href = "tutorial.html";

        } catch (error) {
            UIUtils.showError(this.elements.messageDisplay, langManager.getText('ui.error_creating'));
            console.error("Error:", error);
        }
    }

    validateAndCollectFormData() {
        const email = ValidationUtils.sanitizeInput(this.elements.emailInput.value);
        const name = ValidationUtils.sanitizeInput(this.elements.nameInput.value);
        const age = ValidationUtils.sanitizeInput(this.elements.ageInput.value);
        const gender = this.elements.genderInput.value;
        const movementPractice = ValidationUtils.sanitizeInput(this.elements.movementPracticeInput.value);
        const nativeLanguage = this.elements.nativeLanguageInput.value;

        // Validate required fields
        if (!ValidationUtils.isValidEmail(email)) {
            UIUtils.showError(this.elements.messageDisplay, langManager.getText('ui.error_invalid_email'));
            return null;
        }

        if (!ValidationUtils.isRequired(name)) {
            UIUtils.showError(this.elements.messageDisplay, langManager.getText('ui.error_name_required'));
            return null;
        }

        if (!ValidationUtils.isValidAge(age)) {
            UIUtils.showError(this.elements.messageDisplay, langManager.getText('ui.error_invalid_age'));
            return null;
        }

        if (!ValidationUtils.isRequired(gender)) {
            UIUtils.showError(this.elements.messageDisplay, langManager.getText('ui.error_gender_required'));
            return null;
        }

        if (!ValidationUtils.isRequired(nativeLanguage)) {
            UIUtils.showError(this.elements.messageDisplay, langManager.getText('ui.error_language_required'));
            return null;
        }

        return {
            email,
            name,
            age: parseInt(age),
            gender,
            movementPractice,
            nativeLanguage
        };
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new IndexApp();
});
