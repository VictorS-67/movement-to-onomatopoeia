# Movement to Onomatopoeia

A web application for collecting onomatopoeia descriptions of point light motion videos. Participants watch movement animations and provide onomatopoeia descriptions, with optional audio recording of their pronunciation.

## Overview

This application presents short animations based on motion capture data and collects participant responses describing the movements using onomatopoeia. Data is automatically stored in Google Sheets with audio files organized in Google Drive.

**Live Demo**: https://movement-to-onomatopoeia.netlify.app/

## Features

- **Multilingual Interface**: English/Japanese support with instant language switching
- **Participant Management**: Email-based identification with automated profile creation
- **Video Collection**: 144 motion capture videos with playback controls
- **Text Input**: Onomatopoeia descriptions with precise timing annotations
- **Audio Recording**: Optional microphone recording using Web Audio API
- **Data Storage**: Automatic Google Sheets integration with organized Drive folders
- **Progress Tracking**: Visual indicators for session completion

## Project Structure

```
├── index.html              # Participant login and profile setup
├── survey.html             # Main survey interface
├── sheet-info.json         # Google Sheets/Drive configuration
├── netlify.toml            # Netlify deployment settings
├── css/
│   └── style.css           # Application styles
├── js/
│   ├── app.js              # Main application logic
│   ├── surveyApp.js        # Survey page functionality
│   ├── googleApi.js        # Google API authentication
│   ├── googleSheets.js     # Sheets data operations
│   ├── languageManager.js  # Internationalization
│   └── utils.js            # Shared utilities
├── lang/
│   ├── en.json             # English translations
│   └── ja.json             # Japanese translations
├── netlify/functions/
│   ├── get-access-token.js # Google OAuth token management
│   ├── upload-audio.js     # Audio file uploads to Drive
│   ├── fetch-files.js      # File list retrieval
│   └── fetch-drive-files.js# Drive file operations
└── videos/
    └── *.mp4               # Motion capture video files (144 total)
```

## Setup Instructions

### 1. Google Cloud Setup

Create a Google Cloud project and service account:

1. Enable Google Drive API and Google Sheets API
2. Create a service account with appropriate permissions
3. Download the service account key file
4. Share your Google Sheet and Drive folder with the service account email

### 2. Configuration Files

**Update `sheet-info.json`**:
```json
{
  "spreadsheetId": "your-google-sheets-id",
  "ParticipantSheet": "Participants",
  "OnomatopoeiaSheet": "Onomatopoeia", 
  "videoSheet": "SelectedVideos",
  "audioDriveFolderId": "your-drive-folder-id"
}
```

**Required Google Sheets structure**:
- **Participants**: participantId, email, name, age, gender, movementPractice, nativeLanguage, signUpDate
- **Onomatopoeia**: participantId, participantName, video , onomatopoeia, startTime, endTime, answeredTimestamp, HasAudio, AudioFileName, reasoning, reasoningTimestamp
- **SelectedVideos**: SelectedVideoName

### 3. Environment Variables

Set this environment variable in your Netlify deployment dashboard:

**Variable Name**: `GOOGLE_APPLICATION_CREDENTIALS_CONTENT`
**Value**: The complete JSON content from your Google service account key file (as a single line string)

**How to set it up**:
1. Download your Google service account JSON key file from Google Cloud Console
2. Copy the entire JSON content 
3. In Netlify dashboard → Site settings → Environment variables
4. Add new variable with name `GOOGLE_APPLICATION_CREDENTIALS_CONTENT`
5. Paste the JSON content as the value

⚠️ **Security Note**: Never commit the service account JSON file to your repository. It should only exist as an environment variable in Netlify.

### 4. Video Files

Place your MP4 video files in the `videos/` directory. Update the video list in your Google Sheets "SelectedVideos" tab to control which videos are available to participants.

## Data Organization

### Google Sheets Structure
- Participant data is automatically created upon first login
- Each onomatopoeia entry includes timing, video reference, and audio status
- Video selection is managed through the SelectedVideos sheet

### Google Drive Organization
Audio files are stored as:
```
/Audio/
  /{ParticipantID}_{ParticipantName}/
    /{ParticipantID}_{VideoName}_{Onomatopoeia}_{Timestamp}.webm
```

## Customization

### Adding Languages
1. Create new JSON file in `lang/` directory
2. Update language selector in HTML files
3. Follow existing translation structure

### Modifying Video Collection
1. Add MP4 files to `videos/` directory
2. Update "SelectedVideos" sheet with new entries (add video names to the VideoName column)
3. The application will display all videos listed in the SelectedVideos sheet

### Styling Changes
- Modify `css/style.css` for visual customization
- Uses Tailwind CSS classes throughout HTML

## Browser Requirements

- **Audio Recording**: Modern browsers with Web Audio API support
- **Microphone Access**: User permission required for audio features
- **Video Playback**: HTML5 video support
- **JavaScript**: ES6+ features used throughout

## Technical Notes

- Uses Netlify Functions for serverless Google API integration
- Audio recorded as WebM format for browser compatibility
- Service account authentication for secure API access
- Modular JavaScript architecture with singleton patterns
- CORS headers configured for cross-origin requests

## License

MIT License 