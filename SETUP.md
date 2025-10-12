# Setup Guide for Chrome Notes React

## ⚠️ IMPORTANT: Node.js Version Requirement

**You need Node.js 20.19+ or 22.12+ to run this project.**

Your current version: **Node.js 18.18.0**

### How to Upgrade Node.js

#### Option 1: Using NVM (Recommended)

```bash
# Install nvm if you don't have it
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

# Install Node.js 20 LTS
nvm install 20

# Use Node.js 20
nvm use 20

# Set as default
nvm alias default 20

# Verify
node --version  # Should show v20.x.x
```

#### Option 2: Download from nodejs.org

Visit https://nodejs.org/ and download Node.js 20 LTS (Long Term Support)

#### Option 3: Using Homebrew (macOS)

```bash
brew install node@20
```

---

## Setup Instructions

### 1. Upgrade Node.js (Required)

Follow the instructions above to upgrade to Node.js 20.19+

### 2. Install Dependencies

```bash
cd /Users/tomasroosguerra/Dev/ChromeNotes/chrome-notes-react
npm install
```

### 3. Configure Environment Variables

The `.env` file is already configured with your existing Firebase credentials. If you need to change them:

```bash
# Edit .env file
nano .env
```

### 4. Run Development Server

```bash
npm run dev
```

The app will be available at: **http://localhost:5173**

---

## Troubleshooting

### Error: "crypto.hash is not a function"

**Cause**: Node.js version is too old (< 20.19)
**Solution**: Upgrade Node.js following the instructions above

### Error: "Cannot find module"

**Cause**: Dependencies not installed
**Solution**: Run `npm install`

### Error: Firebase configuration

**Cause**: Missing or invalid `.env` file
**Solution**: Check that `.env` exists and contains valid Firebase credentials

---

## Quick Start (After Node.js Upgrade)

```bash
# Navigate to project
cd /Users/tomasroosguerra/Dev/ChromeNotes/chrome-notes-react

# Install dependencies (if not already done)
npm install

# Start dev server
npm run dev

# Open in browser
# http://localhost:5173
```

---

## Deployment

### Vercel (Recommended - Easiest)

```bash
npm install -g vercel
vercel --prod
```

### Netlify

```bash
npm install -g netlify-cli
npm run build
netlify deploy --prod --dir=dist
```

### Firebase Hosting

```bash
npm install -g firebase-tools
firebase login
firebase init hosting
npm run build
firebase deploy
```

---

## What's Working

✅ All core features implemented:

- Authentication (Google Sign-In)
- Hierarchical tabs (Main + Sub tabs)
- Rich text editor with ALL formatting options
- Task management with checkboxes
- Undo/Redo
- Copy/Import functionality
- Email notes
- Cloud sync with Firebase
- Dark mode
- Mobile responsive

---

## Next Steps

1. **Upgrade Node.js** to version 20.19+
2. Run `npm run dev`
3. Open http://localhost:5173
4. Sign in with Google
5. Start using your notes!

---

## Need Help?

If you encounter any issues:

1. Make sure Node.js version is 20.19+ (`node --version`)
2. Delete `node_modules` and run `npm install` again
3. Check that `.env` file exists
4. Check browser console for errors (F12)

**Common Node.js Versions:**

- ✅ Node.js 20.19+ (Supported)
- ✅ Node.js 22.12+ (Supported)
- ❌ Node.js 18.x (Too old - current version)
- ❌ Node.js 16.x (Too old)
