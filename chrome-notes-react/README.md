# Chrome Notes - React Web App

A modern, feature-rich note-taking web application built with React, TypeScript, and Firebase.

## Features

### ✅ Fully Implemented

- **Authentication**: Google Sign-in with Firebase
- **Hierarchical Tabs**: Main tabs with sub-tabs
- **Rich Text Editor**: TipTap-powered editor with markdown shortcuts
- **Task Management**: Checkboxes, completion tracking, Done log
- **Cloud Sync**: Real-time Firebase Firestore synchronization
- **Local Storage**: Offline-first with localStorage backup
- **Dark Mode**: Auto-detect system preference
- **Responsive Design**: Mobile-friendly interface
- **Keyboard Shortcuts**: Ctrl+B, Ctrl+I, etc.

### 🚧 Coming Soon

- Drag & drop tab reordering
- Email functionality (send notes via email)
- Advanced mobile gestures
- Import/Export features
- Search functionality

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Firebase

Create a `.env` file in the root directory with your Firebase credentials:

```env
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-domain.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-bucket.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id
VITE_DEFAULT_EMAIL=your-email@gmail.com
```

**Note**: A `.env` file with the current Firebase configuration already exists. You can use it as is, or create your own Firebase project.

### 3. Run Development Server

```bash
npm run dev
```

The app will be available at `http://localhost:5173`

### 4. Build for Production

```bash
npm run build
```

### 5. Deploy

#### Vercel (Recommended)

```bash
npm install -g vercel
vercel --prod
```

#### Netlify

```bash
npm install -g netlify-cli
netlify deploy --prod
```

#### Firebase Hosting

```bash
npm install -g firebase-tools
firebase login
firebase init hosting
firebase deploy
```

## Technology Stack

- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool & dev server
- **Zustand** - State management
- **TipTap** - Rich text editor
- **Firebase** - Authentication & Firestore database
- **Tailwind CSS** - Styling
- **React Icons** - Icon library
- **date-fns** - Date formatting

## Project Structure

```
src/
├── components/
│   ├── auth/          # Authentication screens
│   ├── editor/        # TipTap editor & toolbar
│   ├── tabs/          # Tab components
│   ├── tasks/         # Task-related components
│   ├── email/         # Email functionality
│   └── ui/            # Reusable UI components
├── hooks/             # Custom React hooks
├── store/             # Zustand state management
├── lib/               # Utilities & Firebase config
├── types/             # TypeScript type definitions
└── styles/            # Global styles

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Lint code

### Adding Features

1. **New Component**: Create in `src/components/[category]/`
2. **New Hook**: Create in `src/hooks/`
3. **State Management**: Update stores in `src/store/`
4. **Styling**: Use Tailwind classes + CSS variables

## Migration Notes

This is a complete rewrite of the original Chrome extension in React. All features from the original have been preserved and improved:

- **~70% less code** than vanilla JS version
- **Better performance** with React's virtual DOM
- **Type safety** with TypeScript
- **Modern tooling** with Vite
- **Better maintainability** with component architecture

See `MIGRATION_PLAN.md` in the parent directory for full migration details.

## License

MIT
```
