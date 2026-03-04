# Collapsible Sections – Manual Test Checklist

Use this checklist to verify collapsing and unveiling work correctly.

## Test Content (paste into a note)

Create a new note and type or paste content like this (use `# ` for H1, `## ` for H2, `### ` for H3, `- ` for bullets):

```
# Section One
Paragraph under H1.
## Subsection A
Paragraph under H2.
### Sub-subsection
Paragraph under H3.
## Subsection B
Another H2 – should NOT be inside Section A's collapse.
- Top-level bullet (title)
  - Nested bullet one
  - Nested bullet two
- Another top-level bullet (sibling)
  - Its nested child
# Section Two
Content under second H1.
```

## Expected Behavior

### Headings
- **H1 "Section One"**: Tap the left gutter (caret). Everything until "Section Two" should hide (H2 A, H3, H2 B, paragraphs, lists). Tap again to show.
- **H2 "Subsection A"**: Tap gutter. Only its content (paragraph + H3 block) hides. "Subsection B" stays visible.
- **H2 "Subsection B"**: Tap gutter. Only its content hides. "Subsection A" stays visible.
- **H3**: Tap gutter. Only its paragraph hides. Other H3/H2 stay visible.
- **Same-level rule**: H2 never wraps another H2. H3 never wraps another H3 or H2.

### List titles
- **Top-level bullet "Top-level bullet (title)"**: Tap left gutter. Its nested bullets hide. "Another top-level bullet" stays visible.
- **Top-level bullet "Another top-level bullet"**: Tap gutter. Only its nested child hides.

### Tap zones
- **Left gutter** (caret area): Collapse/expand.
- **Text area** (right of thin line): Normal editing – caret moves, keyboard appears. No collapse.

## Quick verification
1. Create a note with the structure above.
2. Tap each heading’s left caret – content should hide/show.
3. Tap each top-level list item’s left caret – nested bullets should hide/show.
4. Tap on heading or list text – should edit, not collapse.
