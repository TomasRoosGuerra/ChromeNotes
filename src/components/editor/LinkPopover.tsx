import { getMarkRange } from "@tiptap/core";
import type { Editor } from "@tiptap/react";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { escapeAttr, escapeHtml } from "../../lib/linkEscape";
import { linkShortcutLabel } from "../../lib/platformShortcut";

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
  const titleId = useId();
  const isEditing = Boolean(editor.getAttributes("link").href);

  useEffect(() => {
    const href = editor.getAttributes("link").href as string | undefined;
    let displayText = "";

    if (editor.isActive("link")) {
      const $from = editor.state.selection.$from;
      const linkType = editor.schema.marks.link;
      if (linkType) {
        const range = getMarkRange($from, linkType);
        if (range) {
          displayText = editor.state.doc.textBetween(
            range.from,
            range.to,
            ""
          );
        }
      }
    } else {
      const { from, to } = editor.state.selection;
      if (from !== to) {
        displayText = editor.state.doc.textBetween(from, to, "");
      }
    }

    setUrl(href ?? "");
    setLinkText(displayText || (href ?? ""));
  }, [editor]);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  useEffect(() => {
    requestAnimationFrame(() => {
      urlInputRef.current?.focus();
      urlInputRef.current?.select();
    });
  }, []);

  const handleClose = useCallback(() => {
    editor.chain().focus().run();
    onClose();
  }, [editor, onClose]);

  const handleApply = useCallback(() => {
    const href = ensureProtocol(url);
    if (!href) return;

    const { from, to } = editor.state.selection;
    const selectedText = editor.state.doc.textBetween(from, to, "");
    const hasSelection = from !== to;

    if (editor.isActive("link")) {
      editor.chain().focus().extendMarkRange("link").run();
      const sel = editor.state.selection;
      const text = linkText.trim() || href;
      editor
        .chain()
        .focus()
        .deleteRange({ from: sel.from, to: sel.to })
        .insertContent(
          `<a href="${escapeAttr(href)}">${escapeHtml(text)}</a>`
        )
        .run();
      handleClose();
      return;
    }

    if (hasSelection) {
      if (linkText.trim() && linkText !== selectedText) {
        editor
          .chain()
          .focus()
          .deleteSelection()
          .insertContent(
            `<a href="${escapeAttr(href)}">${escapeHtml(linkText.trim())}</a>`
          )
          .run();
      } else {
        editor.chain().focus().setLink({ href }).run();
      }
      handleClose();
      return;
    }

    const text = linkText.trim() || href;
    editor
      .chain()
      .focus()
      .insertContent(`<a href="${escapeAttr(href)}">${escapeHtml(text)}</a>`)
      .run();
    handleClose();
  }, [editor, url, linkText, handleClose]);

  const handleRemove = useCallback(() => {
    editor.chain().focus().unsetLink().run();
    handleClose();
  }, [editor, handleClose]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        const target = e.target as HTMLElement;
        if (target.tagName === "TEXTAREA") return;
        e.preventDefault();
        handleApply();
      }
      if (e.key === "Escape") {
        e.preventDefault();
        handleClose();
      }
    },
    [handleApply, handleClose]
  );

  return (
    <div
      className="fixed inset-0 z-40 flex items-end sm:items-center justify-center bg-black/30 backdrop-blur-sm p-0 sm:p-4"
      onClick={handleClose}
      onKeyDown={handleKeyDown}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="bg-[var(--bg-color)] border border-[var(--border-color)] rounded-t-2xl sm:rounded-xl shadow-xl p-5 w-full sm:w-96 max-w-[100vw] sm:max-w-[90vw] animate-slide-up sm:animate-none outline-none focus:outline-none"
        onClick={(ev) => ev.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4 gap-2">
          <h3 id={titleId} className="font-semibold text-sm">
            {isEditing ? "Edit link" : "Add link"}
          </h3>
          <span
            className="text-[10px] text-[var(--placeholder-color)] bg-[var(--hover-bg-color)] px-2 py-0.5 rounded shrink-0 tabular-nums"
            aria-hidden
          >
            {linkShortcutLabel()}
          </span>
        </div>

        <div className="space-y-3 mb-5">
          <div>
            <label
              htmlFor={`${titleId}-url`}
              className="text-xs font-medium text-[var(--placeholder-color)] block mb-1.5"
            >
              URL
            </label>
            <input
              id={`${titleId}-url`}
              ref={urlInputRef}
              type="url"
              inputMode="url"
              autoComplete="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com"
              className="w-full px-3 py-2.5 text-sm border border-[var(--border-color)] rounded-lg bg-[var(--bg-color)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-color)] focus:ring-offset-2 focus:ring-offset-[var(--bg-color)]"
            />
          </div>
          <div>
            <label
              htmlFor={`${titleId}-text`}
              className="text-xs font-medium text-[var(--placeholder-color)] block mb-1.5"
            >
              Link text (optional)
            </label>
            <input
              id={`${titleId}-text`}
              type="text"
              value={linkText}
              onChange={(e) => setLinkText(e.target.value)}
              placeholder="Link text"
              className="w-full px-3 py-2.5 text-sm border border-[var(--border-color)] rounded-lg bg-[var(--bg-color)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-color)] focus:ring-offset-2 focus:ring-offset-[var(--bg-color)]"
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-2 sm:flex-nowrap">
          {isEditing && (
            <button
              type="button"
              onClick={handleRemove}
              className="px-3 py-2.5 text-sm text-red-600 dark:text-red-400 border border-[var(--border-color)] rounded-lg bg-[var(--bg-color)] hover:bg-[var(--hover-bg-color)] transition-colors min-h-[44px] sm:min-h-0"
            >
              Remove link
            </button>
          )}
          <button
            type="button"
            onClick={handleClose}
            className="flex-1 min-w-[calc(50%-0.25rem)] sm:min-w-0 px-3 py-2.5 text-sm border border-[var(--border-color)] rounded-lg bg-[var(--bg-color)] hover:bg-[var(--hover-bg-color)] transition-colors min-h-[44px] sm:min-h-0"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleApply}
            disabled={!url.trim()}
            className="flex-1 min-w-[calc(50%-0.25rem)] sm:min-w-0 px-3 py-2.5 text-sm font-medium rounded-lg bg-[var(--accent-color)] text-white hover:bg-[var(--accent-hover)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px] sm:min-h-0"
          >
            Apply
          </button>
        </div>
      </div>
    </div>
  );
};
