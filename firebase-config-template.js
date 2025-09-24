// Firebase Configuration Template
// Replace the values below with your actual Firebase project configuration

const firebaseConfig = {
  apiKey: "your-api-key-here",
  authDomain: "your-project-id.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project-id.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdef1234567890",
};

// Instructions:
// 1. Go to Firebase Console (https://console.firebase.google.com/)
// 2. Create a new project or select existing project
// 3. Go to Project Settings > General > Your apps
// 4. Click "Add app" > Web app
// 5. Copy the config object and replace the values above
// 6. Enable Authentication:
//    - Go to Authentication > Sign-in method
//    - Enable Google sign-in
// 7. Enable Firestore:
//    - Go to Firestore Database
//    - Create database in production mode
// 8. Update both firebase-sync.js and web-app/firebase-config.js with your config
