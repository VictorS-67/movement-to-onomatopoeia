# Movement to Onomatopoeia

A web application for collecting onomatopoeia descriptions of point light motion videos.
see https://movement-to-onomatopoeia.netlify.app/

## Features

- User name entry and session management
- Video selection from Google Drive folder
- Timestamp-based onomatopoeia recording
- Data storage in Google Sheets via service account

## Tech Stack

- HTML/CSS/JavaScript frontend
- Netlify Functions for Google API integration
- Google Drive API for video file listing
- Google Sheets API for data storage

## Setup

1. Configure Google service account credentials in Netlify environment variables
2. Set `GOOGLE_APPLICATION_CREDENTIALS_CONTENT` with your service account JSON
3. Update Drive folder ID and Sheets ID in the code
4. Deploy to Netlify 