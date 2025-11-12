<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# AI Image Expander with Google Drive Integration

Expand your images with AI! Upload a photo or browse from Google Drive, choose a new aspect ratio, and let AI creatively fill in the rest.

View your app in AI Studio: https://ai.studio/apps/drive/1Q-8kd41WBaTfO12tv0J8afQFZJuQrZIx

## Features

- **AI-Powered Image Expansion**: Intelligently expand images to different aspect ratios
- **Google Drive Integration**: Browse and select images directly from your Google Drive
- **Multiple Aspect Ratios**: Choose from Square (1:1), Landscape (16:9), Portrait (9:16), and more
- **Smart Description**: AI automatically describes your image to guide the expansion
- **Local File Upload**: Upload images directly from your device

## Run Locally

**Prerequisites:**  Node.js

1. Install dependencies:
   ```bash
   npm install
   ```

2. Set up environment variables:
   - Copy `.env.local.example` to `.env.local`
   - Set the `GEMINI_API_KEY` to your Gemini API key
   - (Optional) Set `GOOGLE_CLIENT_ID` for Google Drive integration

3. Run the app:
   ```bash
   npm run dev
   ```

4. Open your browser to `http://localhost:3000`

## Google Drive Setup

To enable Google Drive integration, you'll need to set up OAuth 2.0 credentials. Follow the detailed instructions in [GOOGLE_DRIVE_SETUP.md](./GOOGLE_DRIVE_SETUP.md).

**Quick summary:**
1. Create a Google Cloud Project
2. Enable Google Drive API
3. Configure OAuth consent screen
4. Create OAuth 2.0 Client ID
5. Add your Client ID to `.env.local`
