# 🔥 Firebase Configuration - SAFE BACKUP

**Project**: SpontaNotes
**Project ID**: chromenotes-52954
**Date**: October 12, 2025

---

## 🔑 Firebase Credentials

```env
# Add these to .env.local when rebuilding
VITE_FIREBASE_API_KEY=AIzaSyBx5HGGzz7e9FU3E1ra878mUqqaFRTzfxM
VITE_FIREBASE_AUTH_DOMAIN=chromenotes-52954.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=chromenotes-52954
VITE_FIREBASE_STORAGE_BUCKET=chromenotes-52954.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=34266562578
VITE_FIREBASE_APP_ID=1:34266562578:web:c8d2cb76de1092b5f3d8cb
```

---

## 📋 Firebase Console Links

- **Main Console**: https://console.firebase.google.com/project/chromenotes-52954
- **Authentication**: https://console.firebase.google.com/project/chromenotes-52954/authentication
- **Firestore**: https://console.firebase.google.com/project/chromenotes-52954/firestore
- **Project Settings**: https://console.firebase.google.com/project/chromenotes-52954/settings/general

---

## ⚙️ Required Firebase Setup

### 1. Authentication - Google Provider

✅ Should already be enabled

- Go to Authentication → Sign-in method
- Ensure "Google" is enabled
- Support email configured

### 2. Firestore Database

✅ Should already be created

- Database created in production mode
- Location: (check in console)

### 3. Firestore Security Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // User can only read/write their own notes
    match /userNotes/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

### 4. Authorized Domains

Ensure these are added:

- `localhost` (for development)
- Your production domain (e.g., `spontanotes.com`)

---

## 🗄️ Firestore Data Structure

### Collection: `userNotes`

```typescript
// Document ID: {userId}
{
  mainTabs: Array<{
    id: string;
    name: string;
    subTabs: Array<{
      id: string;
      name: string;
      content: string; // HTML from TipTap
    }>;
  }>;
  activeMainTabId: string;
  activeSubTabId: string;
  completedTasks: Array<{
    id: string;
    text: string;
    tabName: string;
    subTabName: string;
    completedAt: number;
  }>;
  hideCompleted: boolean;
  lastSelectedSubTabs: Record<string, string>;
  scrollPositions: Record<string, number>;
  updatedAt: number; // Timestamp
}
```

---

## 🚀 Quick Setup for Rebuild

1. **Create `.env.local`** in project root
2. **Copy credentials** from above
3. **Initialize Firebase** in `src/lib/firebase.ts`
4. **Verify setup** - check console logs for:
   - "✅ Firebase config validated"
   - "✅ Firebase app initialized"
   - "✅ Firebase services ready"

---

## 🔒 Security Notes

- ⚠️ **DO NOT** commit `.env.local` to git (already in .gitignore)
- ✅ Use environment variables for all credentials
- ✅ Firestore rules ensure user data isolation
- ✅ Only authenticated users can access their own data

---

**Status**: ✅ Backed up and ready for rebuild
