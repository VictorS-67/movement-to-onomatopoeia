# Well-Factored Loading States Architecture

## 🏗️ **Architecture Strategy: Leveraging Existing Patterns**

The key to maintaining well-factored code is to **extend the existing architecture** rather than creating parallel systems. Your current codebase already demonstrates excellent patterns:

- ✅ **BaseApp pattern** for common functionality
- ✅ **Service-based architecture** (UIManager, GoogleSheetsService, etc.)
- ✅ **Singleton pattern** for managers
- ✅ **Template method pattern** for subclass customization

## 🎯 **Best Practice: Extend UIManager + Create LoadingManager**

### **Strategy 1: Extend UIManager (Recommended)**
Enhance the existing UIManager with loading capabilities, maintaining consistency with current patterns.

### **Strategy 2: Create LoadingManager Service**
Add a specialized LoadingManager that works alongside UIManager, following the same architectural patterns.

### **Strategy 3: Hybrid Approach** 
Combine both strategies for optimal separation of concerns.

## 🛠️ **Implementation Strategy: Hybrid Approach**

Let's follow the **hybrid approach** which maintains the best factoring:

### **Phase 1: Extend UIManager with Core Loading Methods**
Add loading methods to UIManager to maintain consistency with existing UI patterns.

### **Phase 2: Create Specialized LoadingManager**
Create LoadingManager as a service for complex loading scenarios (skeleton screens, progress tracking).

### **Phase 3: Enhance BaseApp Template Methods**
Add loading hooks to BaseApp so all subclasses get consistent loading behavior.

## 📋 **Detailed Implementation Plan**

### **1. Enhanced UIManager (Extends Existing Patterns)**

```javascript
// Add to existing js/uiManager.js
class UIManager {
    constructor() {
        this.messageTimers = new Map();
        this.animationFrames = new Map();
        // NEW: Loading state tracking
        this.loadingStates = new Map();
        this.buttonStates = new Map();
    }

    // NEW: Button loading states (extends existing button management)
    setButtonLoading(button, loadingText = 'Loading...', operation = null) {
        if (!button) return null;
        
        const buttonId = button.id || this.generateButtonId(button);
        
        // Store original state
        this.buttonStates.set(buttonId, {
            originalText: button.textContent,
            originalDisabled: button.disabled,
            operation: operation
        });
        
        // Apply loading state
        button.disabled = true;
        button.classList.add('button--loading');
        button.innerHTML = `
            <span class="loading-spinner"></span>
            <span class="button-text">${loadingText}</span>
        `;
        
        // Return cleanup function (maintains existing pattern)
        return () => this.resetButton(button);
    }

    setButtonSuccess(button, successText = 'Success!', duration = 2000) {
        if (!button) return;
        
        button.classList.remove('button--loading');
        button.classList.add('button--success');
        button.innerHTML = `
            <span class="success-checkmark">✓</span>
            <span class="button-text">${successText}</span>
        `;
        
        // Auto-reset after duration
        setTimeout(() => this.resetButton(button), duration);
    }

    resetButton(button) {
        if (!button) return;
        
        const buttonId = button.id || this.generateButtonId(button);
        const originalState = this.buttonStates.get(buttonId);
        
        if (originalState) {
            button.textContent = originalState.originalText;
            button.disabled = originalState.originalDisabled;
            button.classList.remove('button--loading', 'button--success', 'button--error');
            this.buttonStates.delete(buttonId);
        }
    }

    // NEW: Loading overlays (follows existing message pattern)
    showLoadingOverlay(container, message = 'Loading...') {
        if (!container) return null;
        
        const overlayId = this.generateOverlayId(container);
        
        const overlay = document.createElement('div');
        overlay.className = 'loading-overlay';
        overlay.innerHTML = `
            <div class="loading-content">
                <div class="loading-spinner loading-spinner--large"></div>
                <div class="loading-message">${message}</div>
            </div>
        `;
        
        container.style.position = 'relative';
        container.appendChild(overlay);
        
        this.loadingStates.set(overlayId, overlay);
        
        return () => this.hideLoadingOverlay(container);
    }

    hideLoadingOverlay(container) {
        if (!container) return;
        
        const overlay = container.querySelector('.loading-overlay');
        if (overlay) {
            overlay.remove();
        }
    }

    // NEW: Progress tracking (extends existing message system)
    showProgress(container, current, total, message) {
        if (!container) return;
        
        const percentage = Math.round((current / total) * 100);
        
        container.innerHTML = `
            <div class="progress-container">
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${percentage}%"></div>
                </div>
                <div class="progress-text">${message} (${current} of ${total})</div>
                <div class="progress-percentage">${percentage}%</div>
            </div>
        `;
    }

    // Helper methods (maintain existing patterns)
    generateButtonId(button) {
        return `btn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    generateOverlayId(container) {
        return `overlay_${container.id || Date.now()}`;
    }

    // Enhanced cleanup (extends existing cleanup method)
    cleanup() {
        // Existing cleanup
        this.messageTimers.forEach(timer => clearTimeout(timer));
        this.animationFrames.forEach(frame => cancelAnimationFrame(frame));
        
        // NEW: Loading state cleanup
        this.loadingStates.clear();
        this.buttonStates.clear();
    }
}
```

### **2. Specialized LoadingManager Service**

```javascript
// NEW: js/loadingManager.js
/**
 * Loading Manager - Specialized service for skeleton screens and complex loading states
 * Works alongside UIManager for comprehensive loading experience
 */
class LoadingManager {
    static instance = null;
    
    constructor() {
        if (LoadingManager.instance) {
            return LoadingManager.instance;
        }
        
        this.skeletonRegistry = new Map();
        this.activeOperations = new Set();
        
        LoadingManager.instance = this;
    }
    
    static getInstance() {
        if (!LoadingManager.instance) {
            LoadingManager.instance = new LoadingManager();
        }
        return LoadingManager.instance;
    }

    // Skeleton screen management
    showSkeleton(element, config = {}) {
        if (!element) return null;
        
        const elementId = element.id || this.generateElementId(element);
        
        // Store original content
        this.skeletonRegistry.set(elementId, {
            element: element,
            originalContent: element.innerHTML,
            originalClasses: [...element.classList]
        });
        
        // Apply skeleton
        element.classList.add('loading-skeleton');
        element.innerHTML = this.generateSkeletonHTML(config);
        
        return () => this.hideSkeleton(element);
    }

    hideSkeleton(element) {
        if (!element) return;
        
        const elementId = element.id || this.generateElementId(element);
        const skeletonData = this.skeletonRegistry.get(elementId);
        
        if (skeletonData) {
            // Restore original content with smooth transition
            element.classList.add('skeleton-exit');
            
            setTimeout(() => {
                element.innerHTML = skeletonData.originalContent;
                element.className = skeletonData.originalClasses.join(' ');
                this.skeletonRegistry.delete(elementId);
            }, 200); // Short fade-out duration
        }
    }

    generateSkeletonHTML(config) {
        const { type = 'default', lines = 3, includeButton = false } = config;
        
        let html = '';
        
        switch (type) {
            case 'intro':
                html = `
                    <div class="shimmer-placeholder shimmer-placeholder--title"></div>
                    <div class="shimmer-placeholder shimmer-placeholder--line"></div>
                    <div class="shimmer-placeholder shimmer-placeholder--line shimmer-placeholder--shorter"></div>
                `;
                break;
                
            case 'buttons':
                html = Array(5).fill().map(() => 
                    '<div class="shimmer-placeholder shimmer-placeholder--button"></div>'
                ).join('');
                break;
                
            case 'form':
                html = `
                    <div class="shimmer-placeholder shimmer-placeholder--line"></div>
                    <div class="shimmer-placeholder shimmer-placeholder--textarea"></div>
                    <div class="shimmer-placeholder shimmer-placeholder--button"></div>
                `;
                break;
                
            default:
                html = Array(lines).fill().map((_, i) => 
                    `<div class="shimmer-placeholder shimmer-placeholder--line ${i === lines - 1 ? 'shimmer-placeholder--shorter' : ''}"></div>`
                ).join('');
        }
        
        return html;
    }

    // Operation tracking
    startOperation(operationId, description) {
        this.activeOperations.add({ id: operationId, description, startTime: Date.now() });
        this.updateGlobalLoadingState();
    }

    completeOperation(operationId) {
        this.activeOperations.delete(operationId);
        this.updateGlobalLoadingState();
    }

    updateGlobalLoadingState() {
        // Could emit events for global loading indicators
        if (this.activeOperations.size > 0) {
            document.body.classList.add('app-loading');
        } else {
            document.body.classList.remove('app-loading');
        }
    }

    generateElementId(element) {
        return `elem_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
}

// Export singleton instance
const loadingManager = LoadingManager.getInstance();
```

### **3. Enhanced BaseApp with Loading Hooks**

```javascript
// Add to existing js/baseApp.js
class BaseApp {
    constructor() {
        this.elements = {};
        this.config = null;
        this.participantInfo = null;
        this.videoManager = null;
        
        // NEW: Loading state management
        this.loadingOperations = new Map();
        
        this.initializeElements();
        this.initialize();
    }

    async initialize() {
        // NEW: Show initialization loading
        const hideAppSkeleton = this.showInitializationLoading();
        
        try {
            // Existing initialization with progress tracking
            const operationId = 'app-init';
            loadingManager.startOperation(operationId, 'Initializing application');
            
            const [langInitialized, config] = await Promise.all([
                langManager.ensureInitialized(),
                ConfigManager.getSheetConfig()
            ]);
            
            this.config = config;
            console.log('Configuration loaded');

            // NEW: Update progress
            this.updateInitializationProgress(50, 'Configuration loaded');
            
            await this.initializeSubclass();
            
            // NEW: Complete loading
            loadingManager.completeOperation(operationId);
            hideAppSkeleton();
            
            // NEW: Show ready state
            this.onInitializationComplete();
            
        } catch (error) {
            hideAppSkeleton();
            console.error('Failed to initialize app:', error);
            this.handleInitializationError(error);
        }
    }

    // NEW: Loading template methods (can be overridden by subclasses)
    showInitializationLoading() {
        // Default implementation - subclasses can override
        const mainContainer = document.querySelector('main') || document.body;
        return loadingManager.showSkeleton(mainContainer, { type: 'default' });
    }

    updateInitializationProgress(percentage, message) {
        // Default implementation - subclasses can override
        const progressContainer = document.querySelector('.progress-container');
        if (progressContainer) {
            uiManager.showProgress(progressContainer, percentage, 100, message);
        }
    }

    onInitializationComplete() {
        // Hook for subclasses - can be overridden
        document.body.classList.add('app-ready');
    }

    // NEW: Async operation wrapper with loading states
    async executeWithLoading(operation, config = {}) {
        const {
            button = null,
            container = null,
            loadingText = 'Loading...',
            successText = 'Success!',
            progressCallback = null
        } = config;

        let resetButton = null;
        let hideOverlay = null;

        try {
            // Setup loading states
            if (button) {
                resetButton = uiManager.setButtonLoading(button, loadingText);
            }
            
            if (container) {
                hideOverlay = uiManager.showLoadingOverlay(container, loadingText);
            }

            // Execute operation with optional progress tracking
            const result = await operation(progressCallback);

            // Show success state
            if (button) {
                uiManager.setButtonSuccess(button, successText);
            }

            return result;

        } catch (error) {
            // Handle error state
            if (resetButton) resetButton();
            if (hideOverlay) hideOverlay();
            
            if (button) {
                uiManager.setButtonError(button, 'Error - Retry');
            }
            
            throw error;
        }
    }

    // ...existing methods...
}
```

### **4. CSS Loading Framework**

```css
/* Add to existing css/style.css */

/* Loading Framework Variables */
:root {
    --skeleton-base: #f0f0f0;
    --skeleton-highlight: #f8f8f8;
    --loading-duration: 1.5s;
    --transition-duration: 0.2s;
}

/* Dark mode support */
[data-theme="dark"] {
    --skeleton-base: #2a2a2a;
    --skeleton-highlight: #3a3a3a;
}

/* Shimmer Animation Base */
@keyframes shimmer {
    0% { background-position: -468px 0; }
    100% { background-position: 468px 0; }
}

.shimmer-placeholder {
    background: linear-gradient(
        90deg,
        var(--skeleton-base) 25%, 
        var(--skeleton-highlight) 37%, 
        var(--skeleton-base) 63%
    );
    background-size: 400% 100%;
    animation: shimmer var(--loading-duration) ease-in-out infinite;
    border-radius: 4px;
    min-height: 1em;
}

/* Skeleton Variants */
.shimmer-placeholder--line {
    height: 1.2em;
    margin: 0.5em 0;
    width: 100%;
}

.shimmer-placeholder--shorter {
    width: 75%;
}

.shimmer-placeholder--title {
    height: 2em;
    margin: 1em 0;
}

.shimmer-placeholder--button {
    height: 2.5em;
    width: 120px;
    border-radius: var(--button-radius, 4px);
    margin: 0.5em 0.5em 0.5em 0;
}

.shimmer-placeholder--textarea {
    height: 4em;
    margin: 0.5em 0;
}

/* Button Loading States */
.button--loading {
    position: relative;
    pointer-events: none;
    opacity: 0.9;
}

.loading-spinner {
    display: inline-block;
    width: 16px;
    height: 16px;
    border: 2px solid transparent;
    border-top: 2px solid currentColor;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin-right: 8px;
    vertical-align: middle;
}

.loading-spinner--large {
    width: 32px;
    height: 32px;
    border-width: 3px;
}

@keyframes spin {
    to { transform: rotate(360deg); }
}

/* Button Success State */
.button--success {
    background-color: var(--success-color, #22c55e);
    transform: scale(1.02);
    transition: all var(--transition-duration) ease;
}

.success-checkmark {
    display: inline-block;
    margin-right: 8px;
    animation: checkmark-appear 0.3s ease;
}

@keyframes checkmark-appear {
    0% { transform: scale(0); }
    50% { transform: scale(1.2); }
    100% { transform: scale(1); }
}

/* Loading Overlay */
.loading-overlay {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(255, 255, 255, 0.9);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    border-radius: inherit;
}

.loading-content {
    text-align: center;
    padding: 2rem;
}

.loading-message {
    margin-top: 1rem;
    font-weight: 500;
    color: var(--text-color);
}

/* Progress Bar */
.progress-container {
    width: 100%;
    margin: 1rem 0;
}

.progress-bar {
    width: 100%;
    height: 8px;
    background-color: var(--skeleton-base);
    border-radius: 4px;
    overflow: hidden;
}

.progress-fill {
    height: 100%;
    background: linear-gradient(90deg, var(--primary-color), var(--primary-light));
    border-radius: 4px;
    transition: width 0.3s ease;
    animation: progress-shimmer 2s ease-in-out infinite;
}

@keyframes progress-shimmer {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.8; }
}

.progress-text {
    display: block;
    margin-top: 0.5rem;
    font-size: 0.9em;
    color: var(--text-secondary);
}

/* Skeleton Exit Animation */
.skeleton-exit {
    animation: skeleton-fade-out 0.2s ease;
}

@keyframes skeleton-fade-out {
    to { opacity: 0; }
}

/* Loading Skeleton States */
.loading-skeleton {
    pointer-events: none;
}

/* Global App Loading State */
.app-loading {
    cursor: wait;
}

.app-loading * {
    pointer-events: none;
}

/* Responsive Loading States */
@media (max-width: 768px) {
    .loading-spinner {
        width: 14px;
        height: 14px;
    }
    
    .loading-content {
        padding: 1rem;
    }
    
    .progress-container {
        margin: 0.5rem 0;
    }
}

/* Accessibility */
@media (prefers-reduced-motion: reduce) {
    .shimmer-placeholder,
    .loading-spinner,
    .progress-fill {
        animation: none;
    }
    
    .shimmer-placeholder {
        background: var(--skeleton-base);
    }
}

/* High Contrast Mode */
@media (prefers-contrast: high) {
    .loading-overlay {
        background: rgba(255, 255, 255, 0.95);
        border: 2px solid var(--border-color);
    }
    
    .shimmer-placeholder {
        border: 1px solid var(--border-color);
        background: var(--skeleton-base);
    }
}
```

## 🏗️ **Integration Example: Well-Factored Survey App Enhancement**

```javascript
// Enhanced js/surveyApp.js (maintaining existing patterns)
class SurveyApp extends BaseApp {
    // Override BaseApp loading hooks for specific behavior
    showInitializationLoading() {
        // Show skeleton for survey-specific content
        const introSkeleton = loadingManager.showSkeleton(
            this.elements.collapsibleIntro?.querySelector('.intro-text'),
            { type: 'intro' }
        );
        
        const buttonsSkeleton = loadingManager.showSkeleton(
            this.elements.videoButtons,
            { type: 'buttons' }
        );
        
        return () => {
            introSkeleton();
            buttonsSkeleton();
        };
    }

    updateInitializationProgress(percentage, message) {
        // Survey-specific progress updates
        if (this.elements.videoButtons) {
            const progressContainer = document.createElement('div');
            progressContainer.className = 'progress-container';
            this.elements.videoButtons.appendChild(progressContainer);
            
            uiManager.showProgress(progressContainer, percentage, 100, message);
        }
    }

    async initializeSubclass() {
        // Use inherited loading wrapper
        return this.executeWithLoading(async (progressCallback) => {
            this.loadAndValidateParticipantInfo();
            
            if (progressCallback) progressCallback(25, 'Participant loaded');

            if (this.videoManager) {
                await this.videoManager.loadVideos(this.config);
                if (progressCallback) progressCallback(50, 'Videos loaded');
            }

            const data = await googleSheetsService.loadOnomatopoeiaData(
                this.config.spreadsheetId, 
                this.config.OnomatopoeiaSheet, 
                this.participantInfo.participantId
            );
            
            this.filteredData = data;
            if (progressCallback) progressCallback(75, 'Data loaded');

            this.setupEventListeners();
            this.updateParticipantDisplay();
            this.loadInitialData();
            
            if (progressCallback) progressCallback(100, 'Ready');
        }, {
            container: document.querySelector('main'),
            loadingText: 'Loading survey...'
        });
    }

    async handleSaveOnomatopoeia() {
        // Use inherited loading wrapper for consistent UX
        return this.executeWithLoading(async () => {
            const onomatopoeia = this.elements.onomatopoeiaInput.value.trim();
            const startTime = this.elements.startDisplay.textContent;
            const endTime = this.elements.endDisplay.textContent;

            // Validation logic...
            const validation = ValidationUtils.validateOnomatopoeiaData(infoDict);
            if (!validation.isValid) {
                throw new Error(validation.errorMessage);
            }

            await this.saveOnomatopoeia(
                this.filteredData, 
                infoDict, 
                this.config.spreadsheetId, 
                this.config.OnomatopoeiaSheet, 
                this.elements.messageDisplay
            );

            this.proceedToNextVideo();
        }, {
            button: this.elements.saveOnomatopoeiaButton,
            loadingText: 'Saving...',
            successText: 'Saved!'
        });
    }

    // ...existing methods remain unchanged...
}
```

## 🎯 **Key Architectural Benefits**

### **1. Separation of Concerns**
- **UIManager**: Handles UI state, messages, basic loading
- **LoadingManager**: Specialized for skeleton screens and complex loading
- **BaseApp**: Provides loading hooks and patterns for all apps

### **2. Consistent Patterns**
- All services follow singleton pattern
- Template method pattern for customization
- Cleanup functions maintain existing patterns
- Progressive enhancement approach

### **3. Zero Breaking Changes**
- All existing code continues to work
- New functionality is purely additive
- Maintains existing error handling
- Preserves current architecture

### **4. Maintainability**
- Single responsibility principle maintained
- Clear abstraction boundaries
- Reusable components across all apps
- Easy to test and debug

### **5. Extensibility**
- Easy to add new loading types
- Configurable behaviors
- Hook-based customization
- Theme and accessibility support

## 📋 **Implementation Order for Best Factoring**

### **Phase 1: Foundation** (Day 1)
1. Add CSS loading framework to `style.css`
2. Extend `UIManager` with basic loading methods
3. Test button loading states on existing forms

### **Phase 2: Service Layer** (Day 2)
1. Create `LoadingManager` service
2. Add skeleton screen capabilities
3. Test with one component (e.g., video buttons)

### **Phase 3: Architecture Integration** (Day 3)
1. Enhance `BaseApp` with loading hooks
2. Add initialization loading patterns
3. Test across all apps

### **Phase 4: App-Specific Enhancement** (Day 4)
1. Enhance each app with specific loading patterns
2. Add progress tracking for long operations
3. Polish and optimize

**This approach maintains your excellent existing architecture while adding comprehensive loading states that feel native to the application. Ready to start with Phase 1?**
