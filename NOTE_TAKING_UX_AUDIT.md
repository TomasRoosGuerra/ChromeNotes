# SpontaNotes: Feature Analysis & UX Audit

## Industry Best Practices (2024–2026)

Based on research from AppFlowy, NoteApps.info, Fellow.ai, and The Tool Chief:

### Essential Features Users Care About
- **Offline support** — reliability when disconnected
- **Data ownership** — control over where data lives
- **Cross-platform sync** — seamless across devices
- **Performance at scale** — fast with large note collections
- **Markdown & shortcuts** — keyboard-first, format while typing
- **Smart defaults** — works out of the box, customize when needed

### UX Pitfalls to Avoid
- **Too basic** — lack of organization (e.g., Apple Notes)
- **Too complex** — overwhelming setup (e.g., Notion 4+ min onboarding)
- **Slow load times** — users abandon apps that feel sluggish
- **Poor mobile experience** — touch targets, keyboard handling

### Top App Strengths (Reference)
| App | Strength |
|-----|----------|
| Obsidian | Markdown-native, graph view, local-first |
| Notion | Collaboration, databases, all-in-one |
| Apple Notes | Fast launch (0.3s), cross-device sync |
| Bear | 93% writing completion, beautiful UI |
| Amplenote | To-do + calendar integration |

---

## SpontaNotes Feature Inventory

### ✅ Strong Areas

| Feature | Status | Notes |
|---------|--------|-------|
| **Offline** | ✅ | localStorage fallback, sync when online |
| **Sync** | ✅ | Firebase/Firestore, debounced saves |
| **Markdown shortcuts** | ✅ | `# `, `- `, `-.` for headings/lists |
| **Keyboard shortcuts** | ✅ | Ctrl+B/I, Alt+P, Alt+↑/↓ |
| **Touch targets** | ✅ | 44px min on mobile |
| **Responsive layout** | ✅ | sm: breakpoint, mobile-first |
| **Dark mode** | ✅ | `prefers-color-scheme` |
| **Task lists** | ✅ | Checkboxes, Done log |
| **Planning mode** | ✅ | Timeline, drag-drop, gaps |
| **Import/Export** | ✅ | Clipboard, email |
| **Collapsible sections** | ✅ | Headings, list items |
| **Progress tracking** | ✅ | Per-item %, duration |

### ⚠️ Gaps & Improvement Opportunities

| Area | Gap | Priority |
|------|-----|----------|
| **Search** | No global or in-note search | High |
| **Shortcut discoverability** | Users don't know Alt+P, etc. | Medium |
| **QuickFormatBar (mobile)** | Missing headings, blockquote | Medium |
| **Empty states** | Could be more inviting | Low |
| **Sync status** | No visible save/sync indicator | Medium |
| **First-time guidance** | No onboarding | Low |
| **FAB long-press** | No visual/haptic feedback | Low |
| **Progress modal** | Could be more discoverable on mobile | Medium |

---

## Mobile UX Audit

### Strengths
- **QuickFormatBar** — Fixed bottom, repositions above keyboard (VisualViewport)
- **Touch targets** — 44–48px buttons
- **MoreOptionsMenu** — Bottom sheet on mobile (thumb-friendly)
- **Font size** — 16px prevents iOS zoom on focus
- **Safe area** — `viewport-fit=cover`, safe-area insets
- **Scroll** — `-webkit-overflow-scrolling: touch`

### Improvements Needed
1. **QuickFormatBar** — Add H1/H2/H3 for headings (currently missing)
2. **Progress** — Progress button only shows when in list item; add tooltip/hint
3. **FAB** — Long-press (500ms) has no feedback; add subtle animation
4. **Bottom padding** — `pb-16` for QuickFormatBar; verify with keyboard open
5. **Collapse gutter** — 56px on mobile; ensure tap target is adequate

---

## Desktop UX Audit

### Strengths
- **Full toolbar** — All formatting visible
- **Horizontal scroll** — Toolbar scrolls on narrow desktop
- **Hover states** — Delete, group-hover on Done log
- **Dropdown menus** — MoreOptionsMenu as dropdown
- **Drag & drop** — Tabs, planning tasks

### Improvements Needed
1. **Shortcut hints** — Tooltips show "Bold (Ctrl+B)" etc.; ensure all have them
2. **Progress** — Toolbar shows "%" label; Alt+P in modal title
3. **Focus mode** — Consider optional distraction-free writing
4. **Search** — Ctrl+F for in-note search (future)

---

## Recommended UX Improvements (Prioritized)

### High Impact
1. **Add in-note search (Ctrl+F)** — Core note-taking expectation
2. **Sync/save indicator** — Reassurance that data is safe

### Medium Impact
3. **QuickFormatBar headings** — Mobile users need H1/H2/H3
4. **Shortcut hints everywhere** — Tooltips on all toolbar/QuickFormatBar buttons
5. **Progress discoverability** — Always show progress button, disabled state with hint
6. **Empty state polish** — Friendlier copy, maybe illustration

### Low Impact
7. **FAB long-press feedback** — Scale/pulse animation at 400ms
8. **Placeholder text** — Expand with more shortcut examples
9. **Done log empty state** — Already good; minor tweaks

---

## Implementation Checklist

- [ ] In-note search (Ctrl+F)
- [ ] Sync status indicator
- [ ] QuickFormatBar: add H1/H2/H3 (mobile)
- [ ] All toolbar/QuickFormatBar buttons: shortcut tooltips
- [ ] Progress button: always visible, disabled + hint when not in list
- [ ] FAB long-press: visual feedback
- [ ] Placeholder: more shortcuts
- [ ] Empty states: polish copy
