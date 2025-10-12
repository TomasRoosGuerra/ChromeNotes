# 📋 Chrome Notes - Complete Feature Specification

> **Purpose**: Document ALL features for rebuilding the app from scratch
> **Review Status**: ⏳ Pending approval from Tomas

---

## 🔐 **1. Authentication**

### Sign-In

- [ ] Google Sign-In with Firebase Authentication
- [ ] Beautiful sign-in screen with logo and branding
- [ ] Loading screen during auth initialization
- [ ] Error handling for sign-in failures
- [ ] Auto sign-in on return visits (persistent session)

### Sign-Out

- [ ] Sign-out button in toolbar/header
- [ ] Clear local data on sign-out
- [ ] Redirect to sign-in screen

### User Info

- [ ] Display user email in UI
- [ ] User profile picture (optional)

---

## 📑 **2. Hierarchical Tab System**

### Main Tabs

- [ ] Create new main tabs (+ button)
- [ ] Rename main tabs (click to edit or prompt)
- [ ] Delete main tabs (X button)
- [ ] Minimum 1 main tab enforced
- [ ] Switch between main tabs
- [ ] Visual indicator for active tab
- [ ] Horizontal scroll when many tabs

### Sub-Tabs

- [ ] Create new sub-tabs per main tab (+ button)
- [ ] Rename sub-tabs (click to edit or prompt)
- [ ] Delete sub-tabs (X button)
- [ ] Minimum 1 sub-tab per main tab enforced
- [ ] Switch between sub-tabs
- [ ] Visual indicator for active sub-tab
- [ ] Remember last selected sub-tab per main tab
- [ ] Special "Done" tab (read-only, shows completed tasks)

---

## ✍️ **3. Rich Text Editor (TipTap)**

### Text Formatting

- [ ] **Bold** (button + Ctrl/Cmd+B)
- [ ] _Italic_ (button + Ctrl/Cmd+I)
- [ ] ~~Strikethrough~~ (button)
- [ ] H1 headings (button)
- [ ] H2 headings (button)
- [ ] H3 headings (button)
- [ ] Blockquotes (button)
- [ ] Bullet lists (button)
- [ ] Numbered lists (button)
- [ ] Task lists with checkboxes (button)

### Markdown Shortcuts

- [ ] `# ` + Space → H1
- [ ] `## ` + Space → H2
- [ ] `### ` + Space → H3
- [ ] `- ` + Space → Bullet list
- [ ] `1. ` + Space → Numbered list
- [ ] `> ` + Space → Blockquote
- [ ] `-.` + Space → Task item

### Editor Features

- [ ] Placeholder text when empty ("Start typing...")
- [ ] Spell check support
- [ ] Line breaks and paragraphs
- [ ] Undo/Redo with keyboard shortcuts
- [ ] Focus management
- [ ] Proper cursor positioning

---

## ✅ **4. Task Management**

### Task Creation

- [ ] Create checkboxes via toolbar button
- [ ] Create checkboxes via markdown shortcut (`-.`)
- [ ] Check/uncheck tasks by clicking checkbox
- [ ] Edit task text inline

### Task Completion

- [ ] Strikethrough text when checked
- [ ] Gray color for completed tasks
- [ ] Track completion timestamp
- [ ] Track originating tab/sub-tab name
- [ ] Move to "Done Log" on completion

### Done Log

- [ ] Special "Done" tab per main tab
- [ ] Show all completed tasks
- [ ] Group by tab name
- [ ] Group by completion date
- [ ] Display completion timestamp
- [ ] Delete individual tasks from log
- [ ] Clear all completed tasks option
- [ ] Empty state message ("No tasks completed yet")
- [ ] Toggle visibility (hide/show completed) option

---

## 🔄 **5. Undo/Redo**

- [ ] Undo button in toolbar (disabled when nothing to undo)
- [ ] Redo button in toolbar (disabled when nothing to redo)
- [ ] Keyboard shortcut: Ctrl/Cmd+Z (undo)
- [ ] Keyboard shortcut: Ctrl/Cmd+Y (redo)
- [ ] Visual feedback for button states
- [ ] Works across all formatting operations

---

## 💾 **6. Data Persistence**

### Local Storage

- [ ] Auto-save to localStorage every 300ms after changes
- [ ] Save all tabs and content
- [ ] Save active tab selections
- [ ] Save completed tasks
- [ ] Save UI preferences (hide completed, etc.)
- [ ] Load from localStorage on app start

### Cloud Sync (Firebase Firestore)

- [ ] Sync to cloud when signed in
- [ ] Real-time listener for cloud updates
- [ ] Load user data from cloud on sign-in
- [ ] Offline support (local-first, sync when online)
- [ ] Per-user data isolation (security rules)
- [ ] Conflict resolution (last-write-wins)

---

## 📋 **7. Import/Export**

### Copy All Tabs

- [ ] "Copy all tabs" button in more options menu
- [ ] Convert all tabs to markdown format
- [ ] Include all main tabs and sub-tabs
- [ ] Preserve structure with headers
- [ ] Convert HTML to readable markdown:
  - [ ] Checkboxes: ☐ (unchecked) ☑ (checked)
  - [ ] Bullet lists: •
  - [ ] Numbered lists: 1., 2., 3.
  - [ ] Headings: #, ##, ###
  - [ ] Blockquotes: >
  - [ ] Bold: **text**
  - [ ] Italic: _text_
- [ ] Copy to clipboard
- [ ] Toast notification on success/error

### Import from Clipboard

- [ ] "Import from clipboard" button in more options menu
- [ ] Read text from clipboard
- [ ] Parse markdown format
- [ ] Reconstruct tab hierarchy
- [ ] Convert markdown back to HTML
- [ ] Append to existing tabs (not replace)
- [ ] Toast notification on success/error
- [ ] Handle invalid/empty clipboard gracefully

---

## 📧 **8. Email Functionality**

- [ ] "Email all notes" button in more options menu
- [ ] Generate formatted HTML email
- [ ] Open default email client (mailto: link)
- [ ] Pre-fill recipient (from environment variable)
- [ ] Pre-fill subject with date
- [ ] Include all tabs and content
- [ ] Convert checkboxes to readable symbols
- [ ] Toast notification

---

## 🎨 **9. User Interface**

### Toolbar

- [ ] Formatting buttons (bold, italic, strikethrough, etc.)
- [ ] Heading buttons (H1, H2, H3)
- [ ] List buttons (bullet, numbered, task)
- [ ] Quote button
- [ ] Undo/redo buttons
- [ ] More options menu (⋮)
- [ ] User email display
- [ ] Sign out button
- [ ] Button tooltips
- [ ] Visual button states (active, disabled)
- [ ] Button dividers for grouping
- [ ] Horizontal scroll on overflow
- [ ] Responsive layout

### More Options Menu

- [ ] Dropdown menu triggered by ⋮ button
- [ ] Import from clipboard
- [ ] Copy all tabs
- [ ] Email all notes
- [ ] Toggle completed tasks visibility
- [ ] Clean all tabs (delete all content)
- [ ] Click outside to close
- [ ] Proper positioning (aligned to button)
- [ ] Smooth open/close animation

### Visual Feedback

- [ ] Toast notifications (success, error, info)
- [ ] Loading spinner during auth/operations
- [ ] Active tab highlighting
- [ ] Hover states on buttons/tabs
- [ ] Smooth transitions and animations
- [ ] Empty state messages
- [ ] Disabled button styling

### Layout

- [ ] Header with toolbar
- [ ] Main tabs bar
- [ ] Sub-tabs bar
- [ ] Editor area (scrollable)
- [ ] Toast container (fixed position)
- [ ] Full viewport height utilization
- [ ] Responsive design (mobile-friendly)

---

## 🌙 **10. Dark Mode**

- [ ] Auto-detect system preference
- [ ] CSS variables for theming:
  - `--bg-color`
  - `--text-color`
  - `--border-color`
  - `--accent-color`
  - `--placeholder-color`
  - `--hover-bg-color`
  - `--completed-text-color`
- [ ] Light mode colors
- [ ] Dark mode colors (media query)
- [ ] Smooth theme transitions
- [ ] Consistent styling across all components

---

## ⌨️ **11. Keyboard Shortcuts**

### Editor Shortcuts

- [ ] Ctrl/Cmd+B → Bold
- [ ] Ctrl/Cmd+I → Italic
- [ ] Ctrl/Cmd+Z → Undo
- [ ] Ctrl/Cmd+Y → Redo
- [ ] Tab → Indent (in lists)
- [ ] Shift+Tab → Outdent
- [ ] Enter → New line/list item/task

### Markdown Shortcuts

- [ ] `# ` → H1
- [ ] `## ` → H2
- [ ] `### ` → H3
- [ ] `- ` → Bullet list
- [ ] `1. ` → Numbered list
- [ ] `> ` → Blockquote
- [ ] `-.` → Task item

---

## 🔔 **12. Notifications**

- [ ] Success notifications (green)
- [ ] Error notifications (red)
- [ ] Info notifications (blue)
- [ ] Auto-dismiss after 3-5 seconds
- [ ] Manual dismiss option (X button)
- [ ] Stack multiple notifications
- [ ] Smooth enter/exit animations
- [ ] Fixed position (top-right or top-center)

---

## 🛡️ **13. Error Handling**

- [ ] Firebase authentication errors
- [ ] Firestore permission errors
- [ ] Network errors (offline mode)
- [ ] Clipboard API errors
- [ ] Invalid import format errors
- [ ] User-friendly error messages
- [ ] Console logging for debugging
- [ ] Graceful degradation (offline support)
- [ ] Retry mechanisms where appropriate

---

## 📱 **14. Responsive Design**

- [ ] Mobile-first CSS approach
- [ ] Touch-friendly button sizes (min 44x44px)
- [ ] Horizontal scroll for tabs
- [ ] Compact toolbar on small screens
- [ ] Proper viewport meta tags
- [ ] Smooth scrolling
- [ ] Works on phones (320px+)
- [ ] Works on tablets (768px+)
- [ ] Works on desktops (1024px+)
- [ ] Touch gesture support (native)

---

## ⚡ **15. Performance**

- [ ] Debounced auto-save (300ms)
- [ ] Efficient React re-renders
- [ ] Lazy loading where appropriate
- [ ] Minimal bundle size
- [ ] Fast initial load (<2s)
- [ ] Instant tab switching (<100ms)
- [ ] Smooth scrolling performance

---

## 🧪 **16. Data Management**

### State Management (Zustand)

- [ ] Notes store (tabs, content, completed tasks)
- [ ] Auth store (user, loading, error)
- [ ] Persistent state (localStorage)
- [ ] Immutable updates (immer middleware)
- [ ] Type-safe actions

### Data Structure

```typescript
interface NotesState {
  mainTabs: MainTab[];
  activeMainTabId: string;
  activeSubTabId: string;
  completedTasks: CompletedTask[];
  hideCompleted: boolean;
  lastSelectedSubTabs: Record<string, string>;
  scrollPositions: Record<string, number>;
}

interface MainTab {
  id: string;
  name: string;
  subTabs: SubTab[];
}

interface SubTab {
  id: string;
  name: string;
  content: string; // HTML from TipTap
}

interface CompletedTask {
  id: string;
  text: string;
  tabName: string;
  subTabName: string;
  completedAt: number;
}
```

---

## 🎯 **Optional/Future Features**

### Drag & Drop (Nice-to-have)

- [ ] Drag to reorder main tabs
- [ ] Drag to reorder sub-tabs
- [ ] Visual drag preview
- [ ] Drop indicators

### Mobile Gestures (Nice-to-have)

- [ ] Swipe left/right to switch tabs
- [ ] Pull to refresh
- [ ] Long-press context menu

### Advanced Features (Future)

- [ ] Search across all notes
- [ ] Tags/labels for notes
- [ ] Favorites/starred notes
- [ ] Note templates
- [ ] Export to PDF
- [ ] Collaboration/sharing
- [ ] Version history

---

## 🛠️ **Tech Stack**

### Core

- React 19 (latest)
- TypeScript (strict mode)
- Vite (build tool)

### UI & Styling

- Tailwind CSS (utility-first)
- React Icons (icon library)
- CSS variables (theming)

### Editor

- TipTap (ProseMirror-based)
- Extensions: StarterKit, TaskList, TaskItem, Placeholder

### State Management

- Zustand (lightweight state)
- Immer middleware (immutable updates)

### Backend

- Firebase Authentication (Google provider)
- Firebase Firestore (real-time database)

### Utilities

- date-fns (date formatting)
- react-hot-toast (notifications)

---

## 📦 **Project Structure**

```
ChromeNotes/
├── src/
│   ├── components/
│   │   ├── auth/
│   │   │   ├── LoadingScreen.tsx
│   │   │   └── SignInScreen.tsx
│   │   ├── editor/
│   │   │   ├── Editor.tsx
│   │   │   └── Toolbar.tsx
│   │   ├── tabs/
│   │   │   ├── MainTabs.tsx
│   │   │   ├── SubTabs.tsx
│   │   │   ├── Tab.tsx
│   │   │   └── DoneLog.tsx
│   │   └── ui/
│   │       ├── Button.tsx
│   │       ├── Toast.tsx
│   │       └── MoreOptionsMenu.tsx
│   ├── hooks/
│   │   ├── useCloudSync.ts
│   │   ├── useLocalStorage.ts
│   │   ├── useDebounce.ts
│   │   └── useUndoRedo.ts
│   ├── store/
│   │   ├── authStore.ts
│   │   └── notesStore.ts
│   ├── lib/
│   │   ├── firebase.ts
│   │   ├── firestore.ts
│   │   ├── localStorage.ts
│   │   ├── markdown.ts
│   │   └── email.ts
│   ├── types/
│   │   ├── notes.ts
│   │   └── user.ts
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── public/
│   └── favicon.ico
├── .env.local
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
├── tailwind.config.cjs
└── postcss.config.cjs
```

---

## ✅ **Review Checklist**

Please review each section and confirm:

- [ ] **Authentication**: All features listed?
- [ ] **Tab System**: Covers all tab management needs?
- [ ] **Editor**: All formatting options included?
- [ ] **Task Management**: Complete task workflow?
- [ ] **Data Persistence**: Both local and cloud covered?
- [ ] **Import/Export**: All conversion formats correct?
- [ ] **UI/UX**: All components and interactions listed?
- [ ] **Dark Mode**: Proper theming approach?
- [ ] **Keyboard Shortcuts**: All shortcuts documented?
- [ ] **Error Handling**: Comprehensive error coverage?
- [ ] **Responsive Design**: All breakpoints considered?
- [ ] **Tech Stack**: Correct libraries and versions?
- [ ] **Project Structure**: Logical file organization?

---

## 🚀 **Next Steps**

After approval:

1. Create new branch: `rebuild-from-scratch`
2. Set up fresh Vite + React + TypeScript project
3. Configure Tailwind CSS
4. Implement features in priority order
5. Test each feature thoroughly
6. Deploy to production

---

## 📝 **Questions for Review**

1. **Missing Features**: Is there anything I missed from the current app?
2. **New Features**: Are there any new features you'd like to add?
3. **Priority**: Which features are absolutely critical vs nice-to-have?
4. **Design**: Any specific design/UX changes you want?
5. **Tech Stack**: Happy with the proposed libraries?

---

**Status**: ⏳ Awaiting Review
**Created**: October 12, 2025
**Author**: AI Assistant with Tomas
