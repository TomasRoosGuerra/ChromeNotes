# Chrome Notes - Extension & Web App

A beautiful note-taking extension for Chrome with cloud sync and mobile web app access.

## Features

- **Chrome Extension**: Side panel note-taking with rich text editing
- **Web App**: Access your notes from any device via web browser
- **Cloud Sync**: Real-time synchronization using Firebase
- **Offline Support**: Works offline, syncs when connected
- **Mobile Optimized**: Responsive design for mobile devices
- **PWA Support**: Install as app on mobile devices

## Setup Instructions

### 1. Firebase Setup

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project
3. Enable Authentication:
   - Go to Authentication > Sign-in method
   - Enable Google sign-in
4. Enable Firestore Database:
   - Go to Firestore Database
   - Create database in production mode
5. Get your Firebase config:
   - Go to Project Settings > General > Your apps
   - Click "Add app" > Web app
   - Copy the config object

### 2. Update Firebase Configuration

Replace the Firebase config in these files with your actual config:

- `firebase-sync.js` (line 15-22)
- `web-app/firebase-config.js` (line 8-15)

```javascript
const firebaseConfig = {
  apiKey: "your-actual-api-key",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "your-app-id",
};
```

### 3. Chrome Extension Setup

1. Open Chrome and go to `chrome://extensions/`
2. Enable "Developer mode"
3. Click "Load unpacked" and select the ChromeNotes folder
4. The extension will appear in your Chrome toolbar

### 4. Web App Deployment

#### Option A: Firebase Hosting (Recommended)

1. Install Firebase CLI:

   ```bash
   npm install -g firebase-tools
   ```

2. Login to Firebase:

   ```bash
   firebase login
   ```

3. Initialize hosting in the web-app folder:

   ```bash
   cd web-app
   firebase init hosting
   ```

4. Deploy:
   ```bash
   firebase deploy
   ```

#### Option B: Any Web Hosting

Simply upload the contents of the `web-app` folder to any web hosting service.

### 5. Usage

#### Chrome Extension

- Click the extension icon to open the side panel
- Right-click for context menu
- Sign in with Google to enable cloud sync
- All notes automatically sync to the cloud

#### Web App

- Visit your deployed web app URL
- Sign in with the same Google account
- Access and edit your notes from any device
- Changes sync in real-time

## File Structure

```
ChromeNotes/
├── manifest.json              # Chrome extension manifest
├── background.js             # Extension background script
├── sidepanel.html            # Extension side panel HTML
├── sidepanel.css             # Extension styles
├── sidepanel.js              # Extension main script
├── firebase-sync.js          # Firebase sync for extension
├── gmail_inject.js           # Gmail integration
├── icons/                    # Extension icons
├── web-app/                  # Web application
│   ├── index.html            # Web app HTML
│   ├── styles.css            # Web app styles
│   ├── app.js                # Web app JavaScript
│   ├── firebase-config.js    # Firebase config for web app
│   └── manifest.json         # PWA manifest
├── firebase-config-template.js # Firebase config template
└── README.md                 # This file
```

## Features Implemented

### Chrome Extension

- ✅ Persistent sub-tab selection when switching main tabs
- ✅ Extension icon behavior: left-click opens sidepanel, right-click shows menu
- ✅ Firebase cloud sync integration
- ✅ Real-time synchronization
- ✅ Offline support with local storage

### Web App

- ✅ Mobile-responsive design
- ✅ PWA support for mobile installation
- ✅ Firebase authentication
- ✅ Real-time cloud sync
- ✅ Identical UI to Chrome extension
- ✅ Offline support

## Technical Details

- **Storage**: Chrome storage.local + Firebase Firestore
- **Authentication**: Firebase Auth with Google sign-in
- **Sync**: Real-time using Firebase Firestore listeners
- **Offline**: Works offline, syncs when connected
- **Mobile**: Responsive design with touch-friendly interface

## Troubleshooting

### Extension not loading

- Check that all files are in the correct location
- Verify manifest.json is valid
- Check Chrome developer console for errors

### Sync not working

- Verify Firebase configuration is correct
- Check Firebase project has Authentication and Firestore enabled
- Ensure same Google account is used on both extension and web app

### Web app not loading

- Check Firebase configuration
- Verify hosting is properly configured
- Check browser console for errors

## License

This project is open source. Feel free to modify and distribute.
