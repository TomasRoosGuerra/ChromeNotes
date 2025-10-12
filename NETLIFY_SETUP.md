# 🚀 Netlify Deployment - Simple Steps

## ✅ What's Done

- ✅ All old files deleted (Chrome extension, old webapp)
- ✅ React app moved to root directory
- ✅ Code pushed to GitHub: https://github.com/TomasRoosGuerra/ChromeNotes
- ✅ `netlify.toml` configuration ready

---

## 🌐 Deploy to Your Existing Netlify Site

Your existing site: **https://chrome-notes-webapp.netlify.app**

### Quick Steps:

1. **Go to Netlify**: https://app.netlify.com/
2. **Find your site**: `chrome-notes-webapp`
3. **Go to**: Site Settings → Build & Deploy → Build Settings
4. **Update**:
   - Build command: `npm run build`
   - Publish directory: `dist`
5. **Go to**: Site Settings → Environment Variables
6. **Add these** (click "Add a variable"):
   ```
   VITE_FIREBASE_API_KEY = AIzaSyBx5HGGzz7e9FU3E1ra878mUqqaFRTzfxM
   VITE_FIREBASE_AUTH_DOMAIN = chromenotes-52954.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID = chromenotes-52954
   VITE_FIREBASE_STORAGE_BUCKET = chromenotes-52954.firebasestorage.app
   VITE_FIREBASE_MESSAGING_SENDER_ID = 34266562578
   VITE_FIREBASE_APP_ID = 1:34266562578:web:c8d2cb76de1092b5f3d8cb
   VITE_DEFAULT_EMAIL = tomas.roosguerra@gmail.com
   ```
7. **Deploy**: Go to Deploys → Trigger deploy → Deploy site

---

## ⚡ Or Use CLI (Faster)

```bash
cd /Users/tomasroosguerra/Dev/ChromeNotes

# Install CLI
npm install -g netlify-cli

# Login
netlify login

# Link to existing site
netlify link

# Build
npm run build

# Deploy
netlify deploy --prod
```

---

## 🎉 That's It!

Your React app will be live at:
**https://chrome-notes-webapp.netlify.app**

It will auto-deploy on every push to `main` branch!

---

## ✅ Final Checklist

- [x] Node.js upgraded to v20.19.5
- [x] Old files deleted
- [x] React app in root
- [x] Code pushed to GitHub
- [ ] Environment variables added to Netlify
- [ ] Site deployed

**Last step**: Add environment variables and deploy!

