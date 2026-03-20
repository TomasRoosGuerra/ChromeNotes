/** Label for the link shortcut (⌘K on Apple platforms, Ctrl+K elsewhere). */
export function linkShortcutLabel(): string {
  if (typeof navigator === "undefined") return "Ctrl+K";
  return /Mac|iPhone|iPad|iPod/i.test(navigator.userAgent) ? "⌘K" : "Ctrl+K";
}
