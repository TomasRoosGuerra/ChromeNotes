import type { Editor } from "@tiptap/react";
import { useCallback, useEffect, useRef, useState } from "react";

interface LinkPopoverProps {
  editor: Editor;
  onClose: () => void;
}

function ensureProtocol(url: string): string {
  const trimmed = url.trim();
  if (!trimmed) return "";
  if (/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

export const LinkPopover = ({ editor, onClose }: LinkPopoverProps) => {
  const [url, setUrl] = useState("");
  const [linkText, setLinkText] = useState("");
  const urlInputRef = useRef<HTMLInputElement>(null);
  const isEditing = editor.getAttributes("link").href;

  useEffect(() => {
    const { from, to } = editor.state.selection;
    const selectedText = editor.state.doc.textBetween(from, to, " ");
    const href = editor.getAttributes("link").href as string | undefined;

    setUrl(href ?? "");
    setLinkText(selectedText || (href ?? ""));
  }, [editor]);

  useEffect(() => {
    urlInputRef.current?.focus();
    urlInputRef.current?.select();
  }, []);

  const handleApply = useCallback(() => {
    const href = ensureProtocol(url);
    if (!href) return;

    const { from, to } = editor.state.selection;
    const selectedText = editor.state.doc.textBetween(from, to, " ");
    const hasSelection = from !== to;

    if (hasSelection && !linkText) {
      editor.chain().focus().setLink({ href }).run();
    } else if (hasSelection && linkText === selectedText) {
      editor.chain().focus().setLink({ href }).run();
    } else {
      editor
        .chain()
        .focus()
        .deleteSelection()
        .insertContent(`<a href="${href}">${linkText.trim() || href}</a>`)
        .run();
    }
    onClose();
  }, [editor, url, linkText, onClose]);

  const handleRemove = useCallback(() => {
    editor.chain().focus().unsetLink().run();
    onClose();
  }, [editor, onClose]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter") {
        e.preventDefault();
        handleApply();
      }
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    },
    [handleApply, onClose]
  );

  return (
    <div
      className="fixed inset-0 z-40 flex items-end sm:items-center justify-center bg-black/30 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-[var(--bg-color)] border border-[var(--border-color)] rounded-t-2xl sm:rounded-xl shadow-xl p-5 w-full sm:w-96 max-w-[100vw] sm:max-w-[90vw] animate-slide-up sm:animate-none"
        onClick={(ev) => ev.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-sm">
            {isEditing ? "Edit link" : "Add link"}
          </h3>
          <span className="text-[10px] text-[var(--placeholder-color)] bg-[var(--hover-bg-color)] px-2 py-0.5 rounded">
            Cmd+K
          </span>
        </div>

        <div className="space-y-3 mb-5">
          <div>
            <label className="text-xs font-medium text-[var(--placeholder-color)] block mb-1.5">
              URL
            </label>
            <input
              ref={urlInputRef}
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com"
              className="w-full px-3 py-2.5 text-sm border border-[var(--border-color)] rounded-lg bg-[var(--bg-color)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-color)]"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-[var(--placeholder-color)] block mb-1.5">
              Link text (optional)
            </label>
            <input
              type="text"
              value={linkText}
              onChange={(e) => setLinkText(e.target.value)}
              placeholder="Link text"
              className="w-full px-3 py-2.5 text-sm border border-[var(--border-color)] rounded-lg bg-[var(--bg-color)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-color)]"
            />
          </div>
        </div>

        <div className="flex gap-2">
          {isEditing && (
            <button
              type="button"
              onClick={handleRemove}
              className="px-3 py-2.5 text-sm text-red-600 dark:text-red-400 border border-[var(--border-color)] rounded-lg bg-[var(--bg-color)] hover:bg-[var(--hover-bg-color)] transition-colors"
            >
              Remove link
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-3 py-2.5 text-sm border border-[var(--border-color)] rounded-lg bg-[var(--bg-color)] hover:bg-[var(--hover-bg-color)] transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleApply}
            disabled={!url.trim()}
            className="flex-1 px-3 py-2.5 text-sm font-medium rounded-lg bg-[var(--accent-color)] text-white hover:bg-[var(--accent-hover)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Apply
          </button>
        </div>
      </div>
    </div>
  );
};
