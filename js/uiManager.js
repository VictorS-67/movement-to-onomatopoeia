/**
 * UI Manager - Consolidates common UI state management and interaction patterns
 * Used across all apps for consistent form handling, message display, and progress tracking
 */
class UIManager {
    constructor() {
        this.messageTimers = new Map(); // Track active message timers
        this.animationFrames = new Map(); // Track active animations
    }

    /**
     * Standard form reset functionality
     * @param {Object} elements - DOM elements object
     * @param {Array} fieldsToReset - Array of field names to reset
     */
    resetForm(elements, fieldsToReset = []) {
        const defaultFields = [
            'onomatopoeiaInput',
            'startDisplay', 
            'endDisplay',
            'messageDisplay'
        ];
        
        const fields = fieldsToReset.length > 0 ? fieldsToReset : defaultFields;
        
        fields.forEach(fieldName => {
            const element = elements[fieldName];
            if (!element) return;
            
            switch (element.tagName.toLowerCase()) {
                case 'input':
                case 'textarea':
                    element.value = '';
                    break;
                case 'div':
                case 'span':
                case 'p':
                    if (fieldName.includes('Display')) {
                        element.textContent = fieldName.includes('start') || fieldName.includes('end') ? '-.--' : '';
                    } else {
                        element.textContent = '';
                    }
                    break;
            }
            
            // Reset validation states
            element.classList.remove('error', 'success', 'warning');
        });
    }

    /**
     * Standard visibility toggle functionality
     * @param {Object} elements - DOM elements object
     * @param {Object} visibilityStates - Object mapping element names to visibility states
     */
    updateVisibility(elements, visibilityStates) {
        Object.entries(visibilityStates).forEach(([elementName, isVisible]) => {
            const element = elements[elementName];
            if (element) {
                element.style.display = isVisible ? 'block' : 'none';
            }
        });
    }

    /**
     * Display success message with auto-clear functionality
     * @param {HTMLElement} messageElement - Element to display message in
     * @param {string} message - Message text
     * @param {number} duration - Auto-clear duration in ms (default: 3000)
     */
    showSuccess(messageElement, message, duration = 3000) {
        this.showMessage(messageElement, message, 'success', duration);
    }

    /**
     * Display error message with auto-clear functionality
     * @param {HTMLElement} messageElement - Element to display message in
     * @param {string} message - Message text
     * @param {number} duration - Auto-clear duration in ms (default: 5000)
     */
    showError(messageElement, message, duration = 5000) {
        this.showMessage(messageElement, message, 'error', duration);
    }

    /**
     * Display warning message with auto-clear functionality
     * @param {HTMLElement} messageElement - Element to display message in
     * @param {string} message - Message text
     * @param {number} duration - Auto-clear duration in ms (default: 4000)
     */
    showWarning(messageElement, message, duration = 4000) {
        this.showMessage(messageElement, message, 'warning', duration);
    }

    /**
     * Generic message display with styling and auto-clear
     * @param {HTMLElement} messageElement - Element to display message in
     * @param {string} message - Message text
     * @param {string} type - Message type (success, error, warning)
     * @param {number} duration - Auto-clear duration in ms
     */
    showMessage(messageElement, message, type = 'info', duration = 3000) {
        if (!messageElement) return;

        // Clear any existing timer for this element
        this.clearMessageTimer(messageElement);

        // Set message content and styling
        messageElement.textContent = message;
        messageElement.className = `message ${type}`;
        messageElement.style.display = 'block';

        // Set auto-clear timer if duration > 0
        if (duration > 0) {
            const timer = setTimeout(() => {
                this.clearMessage(messageElement);
            }, duration);
            
            this.messageTimers.set(messageElement, timer);
        }
    }

    /**
     * Clear message display
     * @param {HTMLElement} messageElement - Element to clear
     */
    clearMessage(messageElement) {
        if (!messageElement) return;

        messageElement.textContent = '';
        messageElement.className = 'message';
        messageElement.style.display = 'none';
        
        this.clearMessageTimer(messageElement);
    }

    /**
     * Clear message timer for specific element
     * @param {HTMLElement} messageElement - Element to clear timer for
     */
    clearMessageTimer(messageElement) {
        if (this.messageTimers.has(messageElement)) {
            clearTimeout(this.messageTimers.get(messageElement));
            this.messageTimers.delete(messageElement);
        }
    }

    /**
     * Update button state (enabled/disabled) with visual feedback
     * @param {HTMLElement} button - Button element
     * @param {boolean} enabled - Whether button should be enabled
     * @param {string} disabledText - Optional text to show when disabled
     */
    updateButtonState(button, enabled, disabledText = null) {
        if (!button) return;

        button.disabled = !enabled;
        
        if (enabled) {
            button.classList.remove('disabled');
            if (button.dataset.originalText) {
                button.textContent = button.dataset.originalText;
            }
        } else {
            button.classList.add('disabled');
            if (disabledText) {
                if (!button.dataset.originalText) {
                    button.dataset.originalText = button.textContent;
                }
                button.textContent = disabledText;
            }
        }
    }

    /**
     * Update progress bar display
     * @param {HTMLElement} progressElement - Progress bar element
     * @param {number} current - Current step/value
     * @param {number} total - Total steps/maximum value
     * @param {boolean} animated - Whether to animate the change
     */
    updateProgress(progressElement, current, total, animated = true) {
        if (!progressElement || total <= 0) return;

        const percentage = Math.min(100, Math.max(0, (current / total) * 100));
        
        if (animated) {
            this.animateProgressBar(progressElement, percentage);
        } else {
            progressElement.style.width = `${percentage}%`;
        }

        // Update aria attributes for accessibility
        progressElement.setAttribute('aria-valuenow', current);
        progressElement.setAttribute('aria-valuemax', total);
        progressElement.setAttribute('aria-valuetext', `${current} of ${total}`);
    }

    /**
     * Animate progress bar change
     * @param {HTMLElement} progressElement - Progress bar element
     * @param {number} targetPercentage - Target percentage
     */
    animateProgressBar(progressElement, targetPercentage) {
        // Cancel any existing animation
        if (this.animationFrames.has(progressElement)) {
            cancelAnimationFrame(this.animationFrames.get(progressElement));
        }

        const currentWidth = parseFloat(progressElement.style.width) || 0;
        const difference = targetPercentage - currentWidth;
        const duration = 300; // ms
        const startTime = performance.now();

        const animate = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            // Ease-out animation
            const easeOut = 1 - Math.pow(1 - progress, 3);
            const currentPercentage = currentWidth + (difference * easeOut);
            
            progressElement.style.width = `${currentPercentage}%`;

            if (progress < 1) {
                const frameId = requestAnimationFrame(animate);
                this.animationFrames.set(progressElement, frameId);
            } else {
                this.animationFrames.delete(progressElement);
            }
        };

        const frameId = requestAnimationFrame(animate);
        this.animationFrames.set(progressElement, frameId);
    }

    /**
     * Standard input validation with visual feedback
     * @param {HTMLElement} input - Input element to validate
     * @param {Function} validator - Validation function returning {valid: boolean, message: string}
     * @param {HTMLElement} messageElement - Optional element to show validation message
     */
    validateInput(input, validator, messageElement = null) {
        if (!input || !validator) return false;

        const result = validator(input.value);
        
        // Update input styling
        input.classList.remove('error', 'success');
        input.classList.add(result.valid ? 'success' : 'error');

        // Show validation message if provided
        if (messageElement && result.message) {
            if (result.valid) {
                this.showSuccess(messageElement, result.message, 2000);
            } else {
                this.showError(messageElement, result.message, 4000);
            }
        }

        return result.valid;
    }

    /**
     * Batch validate multiple inputs
     * @param {Array} validations - Array of {input, validator, messageElement} objects
     * @returns {boolean} - True if all validations pass
     */
    validateInputs(validations) {
        let allValid = true;
        
        validations.forEach(({input, validator, messageElement}) => {
            const isValid = this.validateInput(input, validator, messageElement);
            if (!isValid) allValid = false;
        });

        return allValid;
    }

    /**
     * Show loading state for an element
     * @param {HTMLElement} element - Element to show loading state for
     * @param {string} loadingText - Optional loading text
     */
    showLoading(element, loadingText = 'Loading...') {
        if (!element) return;

        element.classList.add('loading');
        element.disabled = true;
        
        if (!element.dataset.originalText) {
            element.dataset.originalText = element.textContent;
        }
        element.textContent = loadingText;
    }

    /**
     * Hide loading state for an element
     * @param {HTMLElement} element - Element to hide loading state for
     */
    hideLoading(element) {
        if (!element) return;

        element.classList.remove('loading');
        element.disabled = false;
        
        if (element.dataset.originalText) {
            element.textContent = element.dataset.originalText;
            delete element.dataset.originalText;
        }
    }

    /**
     * Clean up all timers and animations (call on app destruction)
     */
    cleanup() {
        // Clear all message timers
        this.messageTimers.forEach(timer => clearTimeout(timer));
        this.messageTimers.clear();

        // Cancel all animation frames
        this.animationFrames.forEach(frameId => cancelAnimationFrame(frameId));
        this.animationFrames.clear();
    }
}

// Create and export singleton instance
const uiManager = new UIManager();
