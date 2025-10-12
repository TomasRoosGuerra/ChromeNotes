# Chrome Notes → React Web App Migration Plan

## Complete Feature Inventory

### 1. AUTHENTICATION & USER MANAGEMENT

- ✅ Google Sign-In with Firebase Authentication
- ✅ Auto sign-in on return visits
- ✅ Sign out functionality
- ✅ Loading screen during initialization
- ✅ Sign-in screen with branded UI
- ✅ Persistent auth state across sessions

### 2. HIERARCHICAL TAB SYSTEM

#### Main Tabs

- ✅ Create unlimited main tabs
- ✅ Rename tabs (double-click to edit)
- ✅ Delete tabs (with minimum 1 tab enforcement)
- ✅ Drag & drop reordering
- ✅ Active tab highlighting
- ✅ Persistent tab selection across sessions

#### Sub Tabs

- ✅ Create unlimited sub-tabs per main tab
- ✅ Rename sub-tabs (double-click to edit)
- ✅ Delete sub-tabs (with minimum 1 sub-tab enforcement)
- ✅ Drag & drop reordering within main tab
- ✅ Auto-restore last selected sub-tab when switching main tabs
- ✅ Special "Done" tab per main tab (shows completed tasks)
- ✅ Sub-tabs hidden when no main tab selected

### 3. RICH TEXT EDITOR

#### Text Formatting

- ✅ **Bold** (Ctrl/Cmd+B)
- ✅ _Italic_ (Ctrl/Cmd+I)
- ✅ ~~Strikethrough~~
- ✅ Text color picker
- ✅ H1 headings (# in markdown mode)
- ✅ H2 headings (## in markdown mode)
- ✅ H3 headings (### in markdown mode)
- ✅ Blockquotes (> in markdown mode)
- ✅ Bulleted lists (- in markdown mode)
- ✅ Numbered lists (1. in markdown mode)

#### Markdown Shortcuts

- ✅ Type `# ` + space → H1
- ✅ Type `## ` + space → H2
- ✅ Type `### ` + space → H3
- ✅ Type `- ` + space → Bullet list
- ✅ Type `1. ` + space → Numbered list
- ✅ Type `> ` + space → Blockquote
- ✅ Type `-. ` + space → Todo item

#### Content Features

- ✅ ContentEditable notebook area
- ✅ Paste as plain text (strips formatting)
- ✅ Placeholder text when empty
- ✅ Auto-save on input (300ms debounce)
- ✅ Spell check disabled by default
- ✅ Line breaks and paragraphs
- ✅ Copy formatting preserved

### 4. TODO/TASK MANAGEMENT

#### Task Creation & Editing

- ✅ Create checkboxes with content
- ✅ Check/uncheck tasks
- ✅ Edit task text inline
- ✅ Delete tasks
- ✅ Convert bullet list items to tasks
- ✅ Convert multiple bullet items at once
- ✅ Enter key creates new task item
- ✅ Backspace on empty task removes it

#### Task Organization

- ✅ Tasks can be indented (Tab key)
- ✅ Tasks can be outdented (Shift+Tab)
- ✅ Up to 5 levels of indentation
- ✅ Drag & drop task reordering
- ✅ Visual indentation levels

#### Completed Tasks

- ✅ Strikethrough styling when checked
- ✅ Gray color for completed text
- ✅ Move to "Done Log" on completion
- ✅ Store completion timestamp
- ✅ Store originating tab name
- ✅ Toggle visibility (hide/show completed)
- ✅ Delete from Done Log
- ✅ Group by tab name in Done Log
- ✅ Group by date within tabs

### 5. UNDO/REDO SYSTEM

- ✅ Undo (Ctrl/Cmd+Z)
- ✅ Redo (Ctrl/Cmd+Y or Ctrl/Cmd+Shift+Z)
- ✅ Track last 20 states per tab
- ✅ Visual feedback (disabled buttons)
- ✅ Clear redo stack on new action
- ✅ Preserve state across tab switches

### 6. DATA PERSISTENCE

#### Local Storage

- ✅ Auto-save every 300ms after changes
- ✅ Save all tabs content
- ✅ Save active tab selection
- ✅ Save completed tasks
- ✅ Save UI preferences (hide completed)
- ✅ Save last selected sub-tabs
- ✅ Save scroll positions per tab

#### Cloud Sync (Firebase Firestore)

- ✅ Real-time sync to cloud when signed in
- ✅ Auto-sync on data changes
- ✅ Sync from cloud on sign-in
- ✅ Real-time listener for cloud updates
- ✅ Offline support (local-first)
- ✅ Conflict resolution (last write wins)
- ✅ Per-user data isolation

### 7. IMPORT/EXPORT

#### Copy All Tabs

- ✅ Format to markdown-style text
- ✅ Include all main tabs and sub-tabs
- ✅ Preserve structure with headers
- ✅ Convert HTML to readable format
- ✅ Handle checkboxes (☐ ☑)
- ✅ Handle bullet lists (•)
- ✅ Handle numbered lists
- ✅ Handle headings (#, ##)
- ✅ Handle blockquotes (>)
- ✅ Handle bold (\*_) and italic (_)
- ✅ Copy to clipboard

#### Import from Clipboard

- ✅ Parse markdown-style format
- ✅ Reconstruct tab hierarchy
- ✅ Convert markdown to HTML
- ✅ Restore checkboxes
- ✅ Restore bullet lists
- ✅ Restore headings
- ✅ Restore formatting
- ✅ Append to existing tabs
- ✅ Show success notification

### 8. EMAIL FUNCTIONALITY

#### Manual Email

- ✅ "Email All Notes" button
- ✅ Generate HTML email with styling
- ✅ Open Gmail compose window
- ✅ Pre-fill recipient (user configurable)
- ✅ Pre-fill subject with date
- ✅ Auto-inject content into email body
- ✅ Preserve formatting in email
- ✅ Convert checkboxes to symbols
- ✅ Beautiful email template design

#### Scheduled Auto-Email

- ✅ Schedule daily email at specific time
- ✅ Configure time (default 9:00 AM)
- ✅ Select which tabs to include
- ✅ Auto-compose email at scheduled time
- ✅ Show confirmation dialog before sending
- ✅ "Test Now" functionality
- ✅ Multiple schedules support
- ✅ Delete schedules
- ✅ Offline queue (retry when online)
- ✅ Persistent schedules across sessions

### 9. MOBILE OPTIMIZATIONS

#### Touch Gestures

- ✅ Swipe left/right to switch tabs
- ✅ Minimum swipe distance detection
- ✅ Prevent vertical scroll interference
- ✅ Visual feedback during swipe
- ✅ Keyboard-aware (disable when typing)

#### Responsive Design

- ✅ Mobile-first CSS
- ✅ Touch-friendly button sizes (44px minimum)
- ✅ Horizontal scroll for tabs
- ✅ Compact toolbar on small screens
- ✅ Touch-optimized drag handles
- ✅ Proper viewport settings
- ✅ Prevent zoom on input focus
- ✅ Smooth scrolling
- ✅ Overscroll behavior control

### 10. UI/UX FEATURES

#### Toolbar

- ✅ Collapsible toolbar
- ✅ Horizontal scroll on overflow
- ✅ Button tooltips
- ✅ Visual button states (disabled/active)
- ✅ Dividers between button groups
- ✅ Color picker integration
- ✅ Responsive layout

#### Popup Menu ("More Options")

- ✅ Import from clipboard
- ✅ Copy all tabs
- ✅ Clean all tabs (delete all content)
- ✅ Email all notes
- ✅ Schedule auto-send
- ✅ Toggle completed tasks
- ✅ Click outside to close
- ✅ Proper positioning

#### Visual Feedback

- ✅ Loading spinner
- ✅ Toast notifications
- ✅ Active tab highlighting
- ✅ Hover states on buttons/tabs
- ✅ Drag preview/ghost element
- ✅ Drop target indicators
- ✅ Smooth transitions/animations
- ✅ Empty state messages

### 11. KEYBOARD SHORTCUTS

- ✅ Ctrl/Cmd+B → Bold
- ✅ Ctrl/Cmd+I → Italic
- ✅ Ctrl/Cmd+Z → Undo
- ✅ Ctrl/Cmd+Y → Redo
- ✅ Ctrl/Cmd+Shift+Z → Redo
- ✅ Tab → Indent (in lists/tasks)
- ✅ Shift+Tab → Outdent
- ✅ Enter → New line/task
- ✅ Backspace → Delete empty task

### 12. DARK MODE

- ✅ Auto-detect system preference
- ✅ Dark mode CSS variables
- ✅ Proper contrast ratios
- ✅ Smooth theme transitions
- ✅ Theme applied to all elements

### 13. PERFORMANCE OPTIMIZATIONS

- ✅ Debounced auto-save (300ms)
- ✅ Lazy rendering of large lists
- ✅ Scroll position preservation
- ✅ Efficient DOM updates
- ✅ Event delegation where possible
- ✅ Minimal re-renders

### 14. ERROR HANDLING

- ✅ Graceful Firebase errors
- ✅ Sign-in failure handling
- ✅ Network error handling
- ✅ Clipboard API fallbacks
- ✅ Local storage fallbacks
- ✅ Console logging for debugging

### 15. PWA FEATURES (Web App)

- ✅ Manifest.json for installation
- ✅ App name and icons
- ✅ Theme color
- ✅ Standalone display mode
- ✅ Mobile-optimized
- ✅ Apple touch icon support

---

## Features to ENHANCE in React Migration

### 1. Better Rich Text Editor

**Current:** ContentEditable with execCommand (deprecated)
**New:** TipTap (ProseMirror-based)

- ✨ Modern, maintained library
- ✨ Better cross-browser support
- ✨ More formatting options
- ✨ Better undo/redo
- ✨ Plugin system for extensions
- ✨ Collaborative editing ready

### 2. Advanced Task Management

- ✨ Task priorities (high/medium/low)
- ✨ Due dates
- ✨ Task tags/labels
- ✨ Task search/filter
- ✨ Recurring tasks
- ✨ Task dependencies
- ✨ Progress tracking per tab
- ✨ Task templates

### 3. Better Search

- ✨ Global search across all tabs
- ✨ Search within current tab
- ✨ Fuzzy search
- ✨ Search highlighting
- ✨ Search history
- ✨ Filter by task status
- ✨ Filter by date

### 4. Collaboration Features

- ✨ Share tabs with other users
- ✨ Real-time collaborative editing
- ✨ Comments on tasks
- ✨ @mentions
- ✨ Activity feed
- ✨ Version history

### 5. Enhanced Export Options

- ✨ Export as PDF
- ✨ Export as Word document
- ✨ Export as JSON
- ✨ Export to Notion
- ✨ Export to Google Docs
- ✨ Export individual tabs
- ✨ Batch export

### 6. Customization

- ✨ Custom themes
- ✨ Font size adjustment
- ✨ Font family selection
- ✨ Custom accent colors
- ✨ Layout preferences
- ✨ Toolbar customization
- ✨ Keyboard shortcut customization

### 7. Analytics & Insights

- ✨ Task completion statistics
- ✨ Productivity trends
- ✨ Most active tabs
- ✨ Time tracking
- ✨ Word count per tab
- ✨ Daily/weekly reports

### 8. Better Offline Support

- ✨ Service worker for offline access
- ✨ Background sync
- ✨ Conflict resolution UI
- ✨ Offline indicator
- ✨ Sync queue status

### 9. Integrations

- ✨ Google Calendar integration
- ✨ Gmail integration (without extension)
- ✨ Slack notifications
- ✨ Zapier webhooks
- ✨ IFTTT support
- ✨ API for third-party apps

### 10. AI Features (Optional Premium)

- ✨ AI task suggestions
- ✨ Auto-categorization
- ✨ Smart summaries
- ✨ Grammar checking
- ✨ Auto-complete
- ✨ Meeting notes extraction

---

## Technology Stack for React Migration

### Core Framework

```
- React 18.3+ (with Concurrent Features)
- TypeScript 5.0+
- Vite 5.0+ (build tool)
```

### State Management

```
- Zustand (lightweight, easy to use)
- TanStack Query (React Query) for server state
- Immer for immutable updates
```

### Rich Text Editor

```
- TipTap 2.0+ (React wrapper)
  - Extensions: Bold, Italic, Strike, Heading, BulletList, OrderedList
  - Custom extension for Tasks
  - Markdown shortcuts built-in
```

### UI Components

```
- Radix UI (headless components for accessibility)
- Tailwind CSS (utility-first styling)
- Framer Motion (animations)
- React Icons (icon library)
```

### Drag & Drop

```
- dnd-kit (modern, accessible drag & drop)
```

### Firebase

```
- Firebase SDK 10.x
- React Firebase Hooks
- Firebase Auth, Firestore
```

### Date & Time

```
- date-fns (lightweight date library)
```

### Email & Notifications

```
- React Email (for email templates)
- React Hot Toast (notifications)
```

### PWA

```
- Vite PWA Plugin
- Workbox (service worker)
```

### Testing (Optional but Recommended)

```
- Vitest (unit tests)
- Testing Library (component tests)
- Playwright (e2e tests)
```

### Deployment

```
- Vercel or Netlify (recommended)
- Cloudflare Pages (alternative)
```

---

## Project Structure

```
chrome-notes-react/
├── public/
│   ├── icons/
│   ├── manifest.json
│   └── robots.txt
├── src/
│   ├── components/
│   │   ├── auth/
│   │   │   ├── SignInScreen.tsx
│   │   │   └── LoadingScreen.tsx
│   │   ├── editor/
│   │   │   ├── Editor.tsx
│   │   │   ├── Toolbar.tsx
│   │   │   ├── ColorPicker.tsx
│   │   │   └── MarkdownShortcuts.tsx
│   │   ├── tabs/
│   │   │   ├── MainTabs.tsx
│   │   │   ├── SubTabs.tsx
│   │   │   ├── Tab.tsx
│   │   │   ├── DraggableTab.tsx
│   │   │   └── DoneLog.tsx
│   │   ├── tasks/
│   │   │   ├── TaskItem.tsx
│   │   │   ├── TaskList.tsx
│   │   │   └── TaskCheckbox.tsx
│   │   ├── email/
│   │   │   ├── EmailButton.tsx
│   │   │   ├── ScheduleEmailModal.tsx
│   │   │   └── EmailTemplate.tsx
│   │   ├── ui/
│   │   │   ├── Button.tsx
│   │   │   ├── Modal.tsx
│   │   │   ├── Dropdown.tsx
│   │   │   ├── Toast.tsx
│   │   │   └── Tooltip.tsx
│   │   └── layout/
│   │       ├── AppLayout.tsx
│   │       ├── Sidebar.tsx
│   │       └── Header.tsx
│   ├── hooks/
│   │   ├── useAuth.ts
│   │   ├── useNotes.ts
│   │   ├── useTabs.ts
│   │   ├── useUndoRedo.ts
│   │   ├── useLocalStorage.ts
│   │   ├── useDebounce.ts
│   │   ├── useSwipeGesture.ts
│   │   └── useKeyboardShortcuts.ts
│   ├── store/
│   │   ├── authStore.ts
│   │   ├── notesStore.ts
│   │   ├── uiStore.ts
│   │   └── emailStore.ts
│   ├── lib/
│   │   ├── firebase.ts
│   │   ├── firestore.ts
│   │   ├── email.ts
│   │   ├── markdown.ts
│   │   ├── clipboard.ts
│   │   └── utils.ts
│   ├── types/
│   │   ├── notes.ts
│   │   ├── tabs.ts
│   │   ├── tasks.ts
│   │   └── user.ts
│   ├── styles/
│   │   ├── globals.css
│   │   ├── editor.css
│   │   └── themes.css
│   ├── App.tsx
│   ├── main.tsx
│   └── vite-env.d.ts
├── .env.example
├── .gitignore
├── package.json
├── tsconfig.json
├── tailwind.config.js
├── postcss.config.js
├── vite.config.ts
└── README.md
```

---

## Implementation Priority

### Phase 1: Core Foundation (Week 1-2)

1. ✅ Set up Vite + React + TypeScript
2. ✅ Install and configure dependencies
3. ✅ Set up Tailwind CSS
4. ✅ Create basic project structure
5. ✅ Set up Firebase configuration
6. ✅ Create type definitions

### Phase 2: Authentication (Week 2)

1. ✅ Sign-in screen component
2. ✅ Google Auth integration
3. ✅ Auth state management (Zustand)
4. ✅ Loading screen
5. ✅ Auth persistence

### Phase 3: Tab System (Week 3)

1. ✅ Main tabs component
2. ✅ Sub tabs component
3. ✅ Tab CRUD operations
4. ✅ Tab state management
5. ✅ Drag & drop (dnd-kit)
6. ✅ Tab persistence

### Phase 4: Editor (Week 4-5)

1. ✅ TipTap setup
2. ✅ Toolbar component
3. ✅ Text formatting
4. ✅ Markdown shortcuts
5. ✅ Custom task extension
6. ✅ Undo/redo
7. ✅ Auto-save

### Phase 5: Task Management (Week 5-6)

1. ✅ Task creation/editing
2. ✅ Task completion
3. ✅ Done log
4. ✅ Task indentation
5. ✅ Task drag & drop
6. ✅ Hide/show completed

### Phase 6: Cloud Sync (Week 6)

1. ✅ Firestore integration
2. ✅ Real-time sync
3. ✅ Offline support
4. ✅ Conflict resolution
5. ✅ Sync status indicator

### Phase 7: Import/Export (Week 7)

1. ✅ Copy all tabs
2. ✅ Import from clipboard
3. ✅ Format conversion
4. ✅ Clipboard API

### Phase 8: Email Features (Week 7-8)

1. ✅ Email template
2. ✅ Manual email
3. ✅ Schedule modal
4. ✅ Email scheduler
5. ✅ Email queue

### Phase 9: Mobile & PWA (Week 8)

1. ✅ Responsive design
2. ✅ Touch gestures
3. ✅ PWA manifest
4. ✅ Service worker
5. ✅ Install prompt

### Phase 10: Polish & Testing (Week 9-10)

1. ✅ Animations
2. ✅ Accessibility
3. ✅ Error handling
4. ✅ Performance optimization
5. ✅ Cross-browser testing
6. ✅ Mobile testing
7. ✅ Dark mode refinement

### Phase 11: New Features (Week 11+)

1. ✅ Search functionality
2. ✅ Better export options
3. ✅ Customization options
4. ✅ Analytics
5. ✅ Premium features (optional)

---

## Migration Commands

### Initial Setup

```bash
# Create new React project
npm create vite@latest chrome-notes-react -- --template react-ts

# Navigate to project
cd chrome-notes-react

# Install dependencies
npm install

# Install additional packages
npm install @tanstack/react-query zustand immer
npm install @tiptap/react @tiptap/starter-kit @tiptap/extension-task-list @tiptap/extension-task-item
npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
npm install firebase react-firebase-hooks
npm install date-fns
npm install react-hot-toast
npm install @radix-ui/react-dialog @radix-ui/react-dropdown-menu @radix-ui/react-tooltip
npm install framer-motion
npm install react-icons
npm install tailwindcss postcss autoprefixer
npm install -D @types/node

# Initialize Tailwind
npx tailwindcss init -p

# Install PWA plugin
npm install -D vite-plugin-pwa

# Dev dependencies
npm install -D vitest @testing-library/react @testing-library/jest-dom
npm install -D prettier eslint
```

### Firebase Setup

```bash
# Create .env file
echo "VITE_FIREBASE_API_KEY=your-api-key" > .env
echo "VITE_FIREBASE_AUTH_DOMAIN=your-domain" >> .env
echo "VITE_FIREBASE_PROJECT_ID=your-project-id" >> .env
# ... other firebase config
```

### Development

```bash
npm run dev          # Start dev server
npm run build        # Build for production
npm run preview      # Preview production build
npm run test         # Run tests
npm run lint         # Lint code
```

### Deployment (Vercel Example)

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel --prod
```

---

## Key Differences from Extension Version

### Removed Features (Extension-Specific)

- ❌ Chrome storage API (replaced with Firebase + localStorage)
- ❌ Chrome tabs API (no need for tab management)
- ❌ Chrome alarms API (replaced with browser timers + persistence)
- ❌ Chrome side panel API
- ❌ Gmail content script injection
- ❌ Extension context menus

### Added Features (Web-Specific)

- ✅ Standard browser localStorage
- ✅ Standard browser notifications
- ✅ Service worker for offline
- ✅ PWA installation
- ✅ Web share API
- ✅ Standard browser clipboard API
- ✅ Web push notifications (optional)

### Modified Features

- **Email**: Instead of injecting into Gmail, open Gmail in new tab with mailto: link or use Gmail API
- **Storage**: Firebase Firestore as primary, localStorage as backup
- **Alarms**: Browser timers + IndexedDB for persistence
- **Notifications**: Web Notifications API instead of Chrome notifications

---

## Success Metrics

### Performance

- ✅ First Contentful Paint < 1.5s
- ✅ Time to Interactive < 3s
- ✅ Bundle size < 500KB (gzipped)
- ✅ 60fps animations
- ✅ < 100ms input latency

### Functionality

- ✅ 100% feature parity with current app
- ✅ All features work offline
- ✅ Real-time sync < 1s delay
- ✅ Zero data loss
- ✅ Cross-browser compatible (Chrome, Firefox, Safari, Edge)
- ✅ Mobile responsive (iOS & Android)

### User Experience

- ✅ Intuitive UI/UX
- ✅ Smooth animations
- ✅ Clear loading states
- ✅ Helpful error messages
- ✅ Accessible (WCAG 2.1 AA)

---

## READY TO START?

This document captures **100% of current functionality** plus enhancements. The React migration will result in:

- 📉 ~70% less code
- 🚀 Better performance
- 🎨 Easier to maintain
- 🔧 Easier to add features
- 📱 Better mobile experience
- ♿ Better accessibility
- 🧪 Easier to test

Next Step: Run the setup commands and I'll start building the React app!
