# Movement to Onomatopoeia

A web application for collecting onomatopoeia descriptions of point light motion videos with optional audio recording capabilities.
see https://movement-to-onomatopoeia.netlify.app/

## Features

- **Multilingual Support**: Full English/Japanese interface with instant language switching
- **Participant Management**: Email-based identification with unique participant IDs
- **Video Collection**: View and annotate movement videos with timestamp precision
- **Text Input**: Write onomatopoeia descriptions with timing information
- **Audio Recording**: Optional microphone recording of onomatopoeia pronunciation
- **Data Storage**: Automatic saving to Google Sheets with audio files stored in Google Drive
- **Progress Tracking**: Visual indicators for completed videos and session management

## Audio Recording Features

- **Optional Recording**: Users can choose to record audio pronunciation of their onomatopoeia
- **Browser-based**: Uses Web Audio API for in-browser recording (no plugins required)
- **Real-time Feedback**: Visual waveform animation during recording and playback
- **Quality Control**: Play, delete, and re-record functionality
- **Automatic Upload**: Audio files uploaded to Google Drive with organized folder structure
- **Metadata Tracking**: "hasAudio" column in spreadsheet tracks which entries include audio

## Tech Stack

- **Frontend**: HTML/CSS/JavaScript with Tailwind CSS
- **Backend**: Netlify Functions for Google API integration
- **Audio**: Web Audio API for recording, WebM format for storage
- **APIs**: Google Drive API for file storage, Google Sheets API for data management
- **Internationalization**: JSON-based translation system

## Setup

1. Configure Google service account credentials in Netlify environment variables:
   - `GOOGLE_PROJECT_ID`
   - `GOOGLE_PRIVATE_KEY_ID` 
   - `GOOGLE_PRIVATE_KEY`
   - `GOOGLE_CLIENT_EMAIL`
   - `GOOGLE_CLIENT_ID`
2. Update `sheet-info.json` with your Google Sheets ID and sheet names
3. Ensure Google Drive and Sheets API access for the service account
4. Deploy to Netlify with functions enabled

## Audio File Organization

Audio files are automatically organized in Google Drive as:
```
/Audio/
  /{participantId}/
    /{participantId}_{videoName}_{onomatopoeia}_{timestamp}.webm
```

## Browser Compatibility

- **Audio Recording**: Requires modern browsers with Web Audio API support
- **Microphone Access**: Users will be prompted for microphone permissions
- **Fallback**: App works fully without audio recording if not supported 