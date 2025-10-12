# Chrome Notes - React Web App

A modern, feature-rich note-taking web application built with React, TypeScript, and Firebase.

🌐 **Live Demo**: https://chrome-notes-webapp.netlify.app (will auto-deploy)

---

## ✨ Features

### Core Features
- 🔐 **Google Authentication** - Secure sign-in with Firebase
- 📑 **Hierarchical Tabs** - Main tabs with sub-tabs for organization
- ✍️ **Rich Text Editor** - TipTap-powered editor with markdown shortcuts
- ✅ **Task Management** - Checkboxes, completion tracking, Done log
- ☁️ **Cloud Sync** - Real-time synchronization with Firebase Firestore
- 💾 **Offline Support** - Works offline, syncs when connected
- 🌙 **Dark Mode** - Auto-detect system preference
- 📱 **Mobile Responsive** - Works beautifully on all devices
- ⌨️ **Keyboard Shortcuts** - Ctrl+B, Ctrl+I, Ctrl+Z, etc.

### Advanced Features
- 📋 **Copy/Import** - Export to markdown, import from clipboard
- 📧 **Email Notes** - Send notes via email
- 🔄 **Undo/Redo** - Full history with keyboard shortcuts
- 🎨 **Rich Formatting** - Bold, italic, strikethrough, headings, lists, blockquotes
- 📊 **Done Log** - Track completed tasks grouped by tab and date
- 🔔 **Toast Notifications** - Visual feedback for all actions

---

## 🚀 Quick Start

### Prerequisites
- Node.js 20.19+ (Required)
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/TomasRoosGuerra/ChromeNotes.git
cd ChromeNotes

# Install dependencies
npm install

# Start development server
npm run dev
```

Open http://localhost:5173 and sign in with Google!

---

## 📦 Deployment

### Netlify (Automatic)
This repository is configured to auto-deploy to Netlify. Just push to `main` branch.

### Manual Deployment

#### Vercel
```bash
npm install -g vercel
npm run build
vercel --prod
```

#### Netlify CLI
```bash
npm install -g netlify-cli
npm run build
netlify deploy --prod --dir=dist
```

#### Firebase Hosting
```bash
npm install -g firebase-tools
npm run build
firebase init hosting
firebase deploy
```

---

## 🛠️ Tech Stack

- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool & dev server
- **Zustand** - State management
- **TipTap** - Rich text editor
- **Firebase** - Authentication & Firestore database
- **Tailwind CSS** - Styling
- **React Hot Toast** - Notifications
- **React Icons** - Icon library
- **date-fns** - Date formatting

---

## 📖 Documentation

- **`SETUP.md`** - Detailed setup instructions
- **`COMPLETED_FEATURES.md`** - Full feature list
- **`MIGRATION_PLAN.md`** - Migration from Chrome extension
- **`STATUS.md`** - Current status
- **`FINAL_SUMMARY.md`** - Quick reference

---

## 🎯 Keyboard Shortcuts

- `Ctrl/Cmd + B` - Bold
- `Ctrl/Cmd + I` - Italic
- `Ctrl/Cmd + Z` - Undo
- `Ctrl/Cmd + Y` - Redo
- `#` + `Space` - H1 heading
- `##` + `Space` - H2 heading
- `-` + `Space` - Bullet list
- `-.` + `Space` - Task list

---

## 🔧 Development

```bash
npm run dev      # Start dev server
npm run build    # Build for production
npm run preview  # Preview production build
npm run lint     # Lint code
```

---

## 📝 Project Structure

```
ChromeNotes/
├── src/
│   ├── components/      # React components
│   ├── hooks/           # Custom React hooks
│   ├── store/           # Zustand state management
│   ├── lib/             # Utilities & Firebase
│   ├── types/           # TypeScript types
│   └── App.tsx          # Main app component
├── public/              # Static assets
├── netlify.toml         # Netlify configuration
└── package.json         # Dependencies
```

---

## 🌟 Migration from Chrome Extension

This app was migrated from a Chrome extension to a standalone React web app:

- ✅ 45% less code
- ✅ 100% TypeScript
- ✅ Modern architecture
- ✅ Better performance
- ✅ Easier to maintain

See `MIGRATION_PLAN.md` for details.

---

## 📄 License

MIT

---

## 👨‍💻 Author

Tomas Roos Guerra

---

## 🤝 Contributing

Feel free to open issues or submit pull requests!

---

**⭐ Star this repo if you find it useful!**
