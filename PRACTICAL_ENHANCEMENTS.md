# Practical Editor Enhancements

Focused, actionable improvements that enhance daily writing workflow.

---

## 📝 List & Indentation Behaviors

### Tab/Shift-Tab for Lists

- **Tab to indent bullets** - Press Tab to nest bullet points deeper
- **Shift+Tab to outdent** - Move bullets back one level
- **Tab on checkboxes** - Indent task lists with Tab key
- **Shift+Tab on tasks** - Outdent task items
- **Preserve list type on indent** - Bullets stay bullets, numbers stay numbers
- **Auto-adjust numbering** - Renumber when indenting/outdenting numbered lists
- **Max indent depth limit** - Prevent infinite nesting (e.g., max 6 levels)

### Smart List Behaviors

- **Enter continues list** - Pressing Enter creates next bullet/number
- **Enter twice exits list** - Double Enter exits the list
- **Backspace on empty bullet removes it** - Clean way to exit lists
- **Auto-detect list on paste** - Convert pasted lines to bullets if they look like a list
- **Smart numbering** - Auto-increment 1, 2, 3 or a, b, c or i, ii, iii
- **Nested list shortcuts** - Ctrl+] to indent, Ctrl+[ to outdent (like VS Code)
- **Convert between list types** - Toggle bullet ↔ numbered ↔ checkbox

### Checkbox/Task Specific

- **Tab on checked item** - Still works on completed tasks
- **Check parent when all children checked** - Smart hierarchy checking
- **Inherit parent checkbox style** - Keep formatting when indenting
- **Quick checkbox insertion** - Type `[]` + space auto-converts to checkbox
- **Type `[x]` + space** - Creates checked checkbox
- **Checkbox shortcuts** - Ctrl+Shift+C to toggle checkbox on current line

---

## ⌨️ Smart Typing Behaviors

### Auto-Completion & Shortcuts

- **Type `# ` for heading** - Auto-format as H1
- **Type `## ` for H2, `### ` for H3** - Quick heading levels
- **Type `- ` or `* ` for bullet** - Auto-convert to bullet point
- **Type `1. ` for numbered list** - Start numbered list
- **Type `> ` for blockquote** - Instant quote formatting
- **Type `---` for divider** - Creates horizontal rule
- **Type `` ` `` three times for code block** - Markdown code fence
- **Type `[ ]` for checkbox** - Instant task item
- **Type `**text**` auto-bolds** - Live markdown rendering

### Smart Text Manipulation

- **Alt+Up/Down moves line** - Reorder lines quickly
- **Ctrl+D duplicates line** - Copy current line below
- **Ctrl+Shift+K deletes line** - Remove entire line
- **Ctrl+/ toggles comment** - Wrap in `<!-- comment -->`
- **Ctrl+L selects line** - Quick line selection
- **Ctrl+Shift+D duplicates selection** - Copy selected text
- **Hold Ctrl+drag** - Multi-cursor placement

### Smart Selection

- **Double-click selects word** - Standard behavior
- **Triple-click selects paragraph** - Select entire paragraph
- **Ctrl+Shift+→ selects next word** - Word-by-word selection
- **Ctrl+Shift+↑/↓ selects lines** - Line-by-line selection
- **Alt+Shift+→ expands selection** - Gradually expand selection
- **Ctrl+A in list item** - Select current list item, not all content
- **Double-click bullet** - Select entire list item text

---

## 🔄 Undo/Redo Enhancements

### Granular Undo

- **Undo respects word boundaries** - Don't undo entire paragraph of typing
- **Pause-based undo chunks** - Create undo point after 1 second of no typing
- **Action-based undo** - Formatting changes are separate undo steps
- **Undo tab changes** - Ctrl+Z after switching tabs goes back
- **Undo stack per tab** - Each tab has its own undo history
- **Persistent undo** - Undo history survives app refresh
- **Undo limit** - Store last 100 actions to save memory

### Visual Undo Feedback

- **Show what will undo** - Tooltip preview of undo action
- **Undo/redo indicators** - Fade animation showing what changed
- **Undo history panel** - See list of recent changes
- **Highlight undone change** - Flash the affected text briefly
- **Redo availability indicator** - Show when redo is available

---

## 📋 Copy/Paste Enhancements

### Smart Paste

- **Paste plain text** - Ctrl+Shift+V strips formatting
- **Auto-detect list on paste** - Pasted lines become bullets if appropriate
- **Paste URL auto-links** - URLs become clickable links
- **Paste with formatting preserved** - Keep bold, italic, lists from source
- **Paste markdown** - Detect and render markdown syntax
- **Paste code as code block** - Auto-detect code and format appropriately
- **Smart quote conversion** - Convert straight quotes to smart quotes on paste

### Copy Enhancements

- **Copy as markdown** - Ctrl+Shift+C copies with markdown syntax
- **Copy as plain text** - Strip all formatting on copy
- **Copy line without selection** - Ctrl+C on empty selection copies current line
- **Copy link URL** - Right-click link to copy URL directly
- **Copy entire list** - Click bullet and copy to get whole list
- **Copy with metadata** - Include source tab name in clipboard

---

## 🎯 Selection & Navigation

### Keyboard Navigation

- **Ctrl+Home/End** - Jump to start/end of document
- **Ctrl+← / →** - Jump by word
- **Alt+← / →** - Jump by paragraph
- **Ctrl+G go to line** - Jump to specific line number
- **Ctrl+↑/↓** - Scroll without moving cursor
- **Page Up/Down** - Navigate by screen
- **Ctrl+F find** - Search in current note

### Smart Cursor Movement

- **Home key behavior** - First press: go to indent, second: go to line start
- **End key behavior** - Go to last character before newline
- **Word boundary detection** - Stop at punctuation when jumping words
- **Paragraph navigation** - Ctrl+Alt+↑/↓ jumps between paragraphs
- **Heading navigation** - Ctrl+H jumps to next heading
- **List navigation** - Alt+↓ jumps to next list item

---

## 💬 Text Formatting Enhancements

### Quick Formatting

- **Ctrl+B for bold** - Toggle bold on selection
- **Ctrl+I for italic** - Toggle italic
- **Ctrl+U for underline** - Toggle underline
- **Ctrl+K insert link** - Quick link insertion dialog
- **Ctrl+Shift+X strikethrough** - Cross out text
- **Ctrl+` inline code** - Monospace code formatting
- **Ctrl+E center align** - Text alignment options
- **Apply formatting to word** - No selection needed, formats current word

### Format Shortcuts

- **Ctrl+1-6 for headings** - Quick heading levels
- **Ctrl+0 for normal text** - Remove heading formatting
- **Ctrl+Shift+7 numbered list** - Start/stop numbered list
- **Ctrl+Shift+8 bullet list** - Start/stop bullet list
- **Ctrl+Shift+9 checkbox list** - Start/stop task list
- **Ctrl+] increase heading** - H2 → H1
- **Ctrl+[ decrease heading** - H1 → H2

### Format Preservation

- **Maintain formatting on Enter** - Bold continues to next line until toggled off
- **Format only selection** - Don't apply to whole line unless intended
- **Clear formatting** - Ctrl+\ removes all formatting from selection
- **Copy formatting** - Ctrl+Alt+C copies format, Ctrl+Alt+V applies it
- **Format painter** - Click text, copy format, click target

---

## 🔗 Link & Media Handling

### Link Behaviors

- **Auto-detect URLs** - Automatically linkify pasted URLs
- **Edit link text** - Double-click link to edit text without breaking link
- **Ctrl+Click to follow** - Open links without breaking flow
- **Link preview on hover** - Show URL tooltip on hover
- **Quick unlink** - Ctrl+Shift+K removes link but keeps text
- **Link autocomplete** - Show recently used links when typing
- **Paste link on selection** - Auto-creates link with selected text

### Media Pasting

- **Paste images inline** - Ctrl+V with image in clipboard
- **Image size controls** - Resize pasted images
- **Paste as attachment** - Option to link instead of embed
- **Auto-optimize images** - Compress pasted images automatically
- **Screenshot paste** - Direct paste from screenshot tools
- **Image alt text** - Prompt for accessibility text on paste

---

## ✨ Context-Aware Behaviors

### Smart Enter Key

- **Enter in heading** - Creates normal paragraph below
- **Enter in list** - Creates next list item
- **Enter in checklist** - Creates next checkbox
- **Enter in code block** - Creates new line of code (doesn't exit)
- **Shift+Enter** - Soft break (line break without new paragraph/item)
- **Ctrl+Enter** - Exit current block and create paragraph

### Smart Backspace

- **Backspace on empty list item** - Removes item, exits list
- **Backspace on empty heading** - Converts to normal paragraph
- **Backspace on indented item** - Outdents instead of deleting
- **Backspace on link start** - Unlinks instead of deleting
- **Ctrl+Backspace** - Delete entire word backward
- **Ctrl+Delete** - Delete entire word forward

### Smart Delete Key

- **Delete at line end** - Joins with next line
- **Delete in list** - Merges list items intelligently
- **Delete selection with typing** - Replace selected text
- **Ctrl+D on word** - Select and delete word
- **Delete preserves formatting** - Keep format when deleting text

---

## 📐 Whitespace & Formatting

### Indentation Controls

- **Tab width setting** - Choose 2 or 4 spaces
- **Convert tabs to spaces** - Automatic conversion
- **Show whitespace** - Toggle visibility of spaces/tabs
- **Auto-indent** - Match previous line's indentation
- **Smart indent** - Context-aware indentation
- **Trim trailing spaces** - Auto-remove on save
- **Normalize line endings** - Consistent \n handling

### Line & Paragraph

- **Join lines** - Ctrl+J merges selected lines
- **Split line** - Ctrl+Shift+Enter breaks line at cursor
- **Remove empty lines** - Bulk cleanup of whitespace
- **Add line above** - Ctrl+Shift+Enter inserts line above
- **Add line below** - Ctrl+Enter inserts line below
- **Wrap text** - Toggle soft wrap for long lines

---

## 🔢 Numbering & Lists

### Smart Numbering

- **Continue numbering** - Auto-increment from last number
- **Restart numbering** - Right-click to start from 1
- **Custom start number** - Begin list at any number
- **Letter numbering** - a, b, c or A, B, C
- **Roman numerals** - i, ii, iii or I, II, III
- **Auto-fix numbering** - Renumber entire list automatically
- **Multi-level numbering** - 1.1, 1.2, 2.1 style

### List Manipulation

- **Merge lists** - Join two lists together
- **Split list** - Break one list into two
- **Sort list alphabetically** - Organize items A-Z
- **Sort list by checked** - Move completed items to bottom
- **Reverse list** - Flip order
- **Shuffle list** - Randomize order
- **Remove duplicates** - Clean up repeated items

---

## 🎨 Visual Enhancements

### Editor Polish

- **Smooth cursor animation** - Animated cursor movement
- **Current line highlight** - Subtle highlight of active line
- **Indent guides** - Vertical lines showing indentation
- **Bracket matching** - Highlight matching brackets/parentheses
- **Color code headings** - Different colors for H1, H2, H3
- **Fade inactive paragraphs** - Focus on current paragraph
- **Word wrap indicator** - Show where text wraps

### Live Preview

- **Markdown preview toggle** - Side-by-side rendered view
- **Live rendering** - See formatting as you type
- **Syntax highlighting** - Color code in code blocks
- **Math equation rendering** - Display LaTeX math
- **Emoji shortcodes** - :smile: → 😊
- **Table editing** - Visual table editor
- **Mermaid diagrams** - Render flowcharts/diagrams

---

## ⚡ Performance & Efficiency

### Lazy Loading

- **Load content on demand** - Only load visible portions of long notes
- **Virtualized scrolling** - Smooth scrolling for huge documents
- **Debounced saving** - Wait for pause before saving
- **Throttled sync** - Limit cloud sync frequency
- **Background parsing** - Parse markdown without blocking

### Memory Optimization

- **Unload inactive tabs** - Free memory from hidden tabs
- **Compress old history** - Reduce undo stack size
- **Image lazy loading** - Load images as they scroll into view
- **Cache rendered content** - Reuse rendered output
- **Garbage collect** - Clean up unused data

---

## 🛡️ Safety & Recovery

### Auto-Save & Recovery

- **Auto-save every X seconds** - Never lose work
- **Crash recovery** - Restore unsaved changes after crash
- **Conflict resolution UI** - Choose which version to keep
- **Save before close** - Warn if unsaved changes exist
- **Periodic snapshots** - Automatic backups every 5 minutes
- **Draft recovery** - Restore from last draft

### Change Protection

- **Warn before bulk delete** - Confirm deleting multiple items
- **Trash/recycle bin** - 30-day recovery for deleted tabs
- **Accidental close protection** - Confirm closing tab with content
- **Lock/freeze note** - Prevent editing temporarily
- **Read-only mode** - View without ability to edit

---

## 🔧 Power User Features

### Advanced Selection

- **Column selection** - Alt+drag for rectangular selection
- **Multi-cursor** - Ctrl+Click to add cursors
- **Select all occurrences** - Ctrl+D repeatedly selects same word
- **Expand/shrink selection** - Alt+Shift+→/←
- **Select matching bracket** - Ctrl+Shift+M

### Advanced Editing

- **Macro recording** - Record and replay actions
- **Snippet insertion** - Quick templates (date, signature, etc.)
- **Variable substitution** - Auto-insert date, time, tab name
- **Text transformation** - UPPERCASE, lowercase, Title Case
- **Increment numbers** - Ctrl+A to increase numbers
- **Decrement numbers** - Ctrl+X to decrease numbers

### Vim Mode (Optional)

- **Vim keybindings** - For Vim enthusiasts
- **Normal/Insert/Visual modes** - Classic Vim modes
- **Vim motions** - dd, yy, p, etc.
- **Vim commands** - :w to save, :q to close tab
- **Toggleable** - Easy on/off in settings

---

## 🎯 Implementation Priority

### Immediate Impact (Week 1)

1. ✅ **Tab/Shift-Tab for list indentation** - Most requested
2. ⌨️ **Smart Enter/Backspace in lists** - Natural behavior
3. 📋 **Paste plain text option** - Essential control
4. 🔄 **Basic undo/redo** - Critical safety net
5. ⌨️ **Ctrl+B/I/U formatting** - Standard expectations

### High Value (Week 2-3)

6. 💬 **Auto-continue lists on Enter** - Smooth writing
7. ⌨️ **Line manipulation (Alt+Up/Down)** - Power user feature
8. 🔗 **Auto-detect and linkify URLs** - Modern expectation
9. ✨ **Markdown shortcuts (# , - , [ ])** - Quick formatting
10. 📐 **Smart Home/End key behavior** - Better navigation

### Polish (Week 4+)

11. 🎨 **Current line highlight** - Visual feedback
12. 🔢 **Smart numbering** - Auto-increment, renumber
13. 📋 **Format painter** - Copy formatting
14. 🛡️ **Auto-save indicators** - User confidence
15. ⚡ **Performance optimizations** - Handle large notes

---

## Quick Reference: Must-Have Keyboard Shortcuts

```
Lists & Indentation:
Tab             - Indent list item (bullets, numbers, checkboxes)
Shift+Tab       - Outdent list item
Enter           - Continue list / New list item
Enter Enter     - Exit list
Backspace       - Remove empty list item

Formatting:
Ctrl+B          - Bold
Ctrl+I          - Italic
Ctrl+U          - Underline
Ctrl+K          - Insert link
Ctrl+\          - Clear formatting

Line Manipulation:
Alt+↑/↓         - Move line up/down
Ctrl+D          - Duplicate line
Ctrl+Shift+K    - Delete line
Ctrl+L          - Select line

Text Shortcuts:
# + Space       - Heading 1
## + Space      - Heading 2
- + Space       - Bullet list
1. + Space      - Numbered list
[ ] + Space     - Checkbox
> + Space       - Blockquote

Undo/Redo:
Ctrl+Z          - Undo
Ctrl+Shift+Z    - Redo (or Ctrl+Y)
```

---

## Testing Checklist

Before shipping each feature:

- [ ] Works with keyboard only (no mouse needed)
- [ ] Behavior matches user expectations
- [ ] Works on mobile (tap/swipe equivalent)
- [ ] Undo/redo works correctly
- [ ] Syncs properly to cloud
- [ ] Handles edge cases (empty lists, single item, etc.)
- [ ] Accessible (screen reader compatible)
- [ ] Fast (no lag or jank)

---

**Remember**: These enhancements should feel natural and invisible. The best editor is one where users don't think about the tool—they just write.
