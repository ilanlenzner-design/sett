# Google Drive Integration Setup Guide

This guide will walk you through setting up Google Drive integration for the AI Image Expander app.

## Overview

The Google Drive integration allows users to browse their Google Drive folders and select images directly from their Drive to use with the AI Image Expander.

## Prerequisites

- A Google Cloud Project
- Google Drive API enabled
- OAuth 2.0 Client ID configured

## Setup Instructions

### 1. Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click on "Select a project" dropdown at the top
3. Click "New Project"
4. Enter a project name (e.g., "AI Image Expander")
5. Click "Create"

### 2. Enable Google Drive API

1. In your Google Cloud Console, navigate to "APIs & Services" > "Library"
2. Search for "Google Drive API"
3. Click on "Google Drive API"
4. Click "Enable"

### 3. Configure OAuth Consent Screen

1. Navigate to "APIs & Services" > "OAuth consent screen"
2. Choose "External" user type (unless you have a Google Workspace)
3. Click "Create"
4. Fill in the required fields:
   - **App name**: AI Image Expander
   - **User support email**: Your email
   - **Developer contact email**: Your email
5. Click "Save and Continue"
6. On the "Scopes" page, click "Add or Remove Scopes"
7. Add the following scope:
   - `https://www.googleapis.com/auth/drive.readonly` (View files in your Google Drive)
8. Click "Update" and then "Save and Continue"
9. On "Test users" page, add your email address as a test user
10. Click "Save and Continue"

### 4. Create OAuth 2.0 Client ID

1. Navigate to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "OAuth client ID"
3. Choose "Web application" as the application type
4. Enter a name (e.g., "AI Image Expander Web Client")
5. Under "Authorized JavaScript origins", add:
   - `http://localhost:3000` (for local development)
   - Your production domain (if deploying)
6. Under "Authorized redirect URIs", add:
   - `http://localhost:3000` (for local development)
   - Your production domain (if deploying)
7. Click "Create"
8. Copy your **Client ID** (it will look like: `xxxxx.apps.googleusercontent.com`)

### 5. Configure Environment Variables

1. Create a `.env.local` file in the root of your project (if it doesn't exist)
2. Add your credentials:

```env
# Google Generative AI API Key
GEMINI_API_KEY=your_gemini_api_key_here

# Google OAuth Client ID for Drive API
GOOGLE_CLIENT_ID=your_google_client_id_here.apps.googleusercontent.com
```

3. Save the file

**Important**: Never commit `.env.local` to version control. It's already in `.gitignore`.

### 6. Run the Application

1. Install dependencies (if you haven't already):
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

3. Open your browser to `http://localhost:3000`

### 7. Test the Integration

1. Click the "Browse Google Drive" button
2. You'll be prompted to sign in with your Google account
3. Grant the necessary permissions (read-only access to your Drive)
4. Browse your folders and select an image
5. The selected image will be loaded into the AI Image Expander

## Features

- **Browse Folders**: Navigate through your entire Google Drive folder structure
- **Breadcrumb Navigation**: Easily navigate back to parent folders
- **Image Preview**: See thumbnails of your images
- **File Type Filtering**: Only image files are selectable
- **Secure Authentication**: Uses OAuth 2.0 for secure, read-only access

## Troubleshooting

### "Google Identity Services not loaded" Error

- Make sure you have an active internet connection
- Check that the Google Identity Services script is loading in `index.html`
- Try refreshing the page

### "Authentication failed" Error

- Verify your `GOOGLE_CLIENT_ID` is correctly set in `.env.local`
- Make sure your app URL is listed in "Authorized JavaScript origins" in Google Cloud Console
- Check that the Google Drive API is enabled in your project

### "Failed to fetch files" Error

- Ensure you granted the necessary permissions when signing in
- Try signing out and signing in again
- Check that the Drive API is enabled and the scope is correctly configured

### Token Expired

- The access token expires after 1 hour
- Simply try the operation again - you'll be prompted to re-authenticate

## Security Notes

- The app only requests **read-only** access to your Google Drive
- Access tokens are stored in memory only (not persisted)
- No data is sent to any server - all processing happens in your browser
- You can revoke access at any time from [Google Account Permissions](https://myaccount.google.com/permissions)

## Production Deployment

When deploying to production:

1. Update "Authorized JavaScript origins" in Google Cloud Console to include your production domain
2. Update "Authorized redirect URIs" to include your production domain
3. Set the `GOOGLE_CLIENT_ID` environment variable in your production environment
4. Consider moving from "Testing" to "In production" in the OAuth consent screen settings

## Additional Resources

- [Google Identity Services Documentation](https://developers.google.com/identity/gsi/web)
- [Google Drive API Documentation](https://developers.google.com/drive/api/guides/about-sdk)
- [OAuth 2.0 for Client-side Web Applications](https://developers.google.com/identity/protocols/oauth2/javascript-implicit-flow)
