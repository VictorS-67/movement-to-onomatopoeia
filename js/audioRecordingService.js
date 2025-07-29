// Audio Recording Service
// Centralized audio recording functionality for survey and tutorial apps

class AudioRecordingService {
    constructor() {
        this.state = {
            mediaRecorder: null,
            audioChunks: [],
            recordedAudioBlob: null,
            audioUrl: null,
            isRecording: false,
            isSupported: this.checkSupport()
        };
        
        // Callbacks for UI management
        this.onStateChange = null;
        this.onError = null;
    }

    // Check if audio recording is supported
    checkSupport() {
        return !!(window.MediaRecorder && navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
    }

    // Get optimal MIME type for recording
    getOptimalMimeType() {
        const types = [
            'audio/webm;codecs=opus',
            'audio/webm',
            'audio/mp4',
            'audio/wav'
        ];
        
        for (const type of types) {
            if (MediaRecorder.isTypeSupported(type)) {
                return type;
            }
        }
        return 'audio/webm'; // fallback
    }

    // Start audio recording
    async startRecording() {
        if (!this.state.isSupported) {
            this.handleError('NOT_SUPPORTED', 'Audio recording is not supported in this browser');
            return false;
        }

        if (this.state.isRecording) {
            console.warn('Recording already in progress');
            return false;
        }

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mimeType = this.getOptimalMimeType();
            
            this.state.mediaRecorder = new MediaRecorder(stream, { mimeType });
            this.state.audioChunks = [];
            this.state.isRecording = true;

            // Set up event listeners
            this.setupRecorderEvents(stream);
            
            // Start recording
            this.state.mediaRecorder.start();
            this.notifyStateChange('RECORDING');
            
            return true;
        } catch (error) {
            const errorType = error.name === 'NotAllowedError' ? 'PERMISSION_DENIED' : 'GENERIC_ERROR';
            this.handleError(errorType, error.message);
            return false;
        }
    }

    // Set up MediaRecorder event listeners
    setupRecorderEvents(stream) {
        this.state.mediaRecorder.addEventListener('dataavailable', (event) => {
            if (event.data.size > 0) {
                // Check file size - 10MB limit
                const currentSize = this.state.audioChunks.reduce((total, chunk) => total + chunk.size, 0);
                const newSize = currentSize + event.data.size;
                
                if (newSize > 10 * 1024 * 1024) { // 10MB in bytes
                    this.stopRecording();
                    this.handleError('FILE_TOO_LARGE', 'Recording too large (10MB limit)');
                    return;
                }

                this.state.audioChunks.push(event.data);
            }
        });

        this.state.mediaRecorder.addEventListener('stop', () => {
            // Create blob from chunks
            this.state.recordedAudioBlob = new Blob(this.state.audioChunks, { 
                type: this.state.mediaRecorder.mimeType || 'audio/webm' 
            });
            
            // Clean up previous URL and create new one
            if (this.state.audioUrl) {
                URL.revokeObjectURL(this.state.audioUrl);
            }
            this.state.audioUrl = URL.createObjectURL(this.state.recordedAudioBlob);
            
            // Clean up stream
            stream.getTracks().forEach(track => track.stop());
            
            this.state.isRecording = false;
            this.notifyStateChange('RECORDED');
        });
    }

    // Stop recording
    stopRecording() {
        if (this.state.mediaRecorder && this.state.mediaRecorder.state === 'recording') {
            this.state.mediaRecorder.stop();
            return true;
        }
        return false;
    }

    // Play recorded audio
    playRecording() {
        if (!this.state.audioUrl) {
            this.handleError('NO_RECORDING', 'No recording available to play');
            return false;
        }

        const audio = new Audio(this.state.audioUrl);
        this.notifyStateChange('PLAYING');
        
        audio.addEventListener('ended', () => {
            this.notifyStateChange('RECORDED');
        });
        
        audio.addEventListener('error', () => {
            this.handleError('PLAYBACK_ERROR', 'Failed to play recording');
        });
        
        audio.play().catch(error => {
            this.handleError('PLAYBACK_ERROR', error.message);
        });
        
        return true;
    }

    // Delete recording
    deleteRecording() {
        this.reset();
        this.notifyStateChange('READY');
        return true;
    }

    // Reset recording state
    reset() {
        // Stop any active recording
        if (this.state.isRecording) {
            this.stopRecording();
        }

        // Clean up URLs and references
        if (this.state.audioUrl) {
            URL.revokeObjectURL(this.state.audioUrl);
        }

        // Reset state
        this.state = {
            ...this.state,
            mediaRecorder: null,
            audioChunks: [],
            recordedAudioBlob: null,
            audioUrl: null,
            isRecording: false
        };
    }

    // Get current recording as blob (for upload)
    getRecordingBlob() {
        return this.state.recordedAudioBlob;
    }

    // Get current state
    getState() {
        return {
            isSupported: this.state.isSupported,
            isRecording: this.state.isRecording,
            hasRecording: !!this.state.recordedAudioBlob,
            audioUrl: this.state.audioUrl
        };
    }

    // Handle errors
    handleError(type, message) {
        console.error(`Audio Recording Error [${type}]:`, message);
        
        if (this.onError) {
            this.onError(type, message);
        }
        
        // Reset recording state on error
        this.reset();
    }

    // Notify state change
    notifyStateChange(newState) {
        if (this.onStateChange) {
            this.onStateChange(newState, this.getState());
        }
    }

    // Clean up resources when service is destroyed
    destroy() {
        this.reset();
        this.onStateChange = null;
        this.onError = null;
    }
}

// Create singleton instance
const audioRecordingService = new AudioRecordingService();
