import type { Editor } from "@tiptap/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { FiChevronDown, FiChevronUp, FiRepeat, FiX } from "react-icons/fi";

interface SearchBarProps {
  editor: Editor;
  onClose: () => void;
}

export const SearchBar = ({ editor, onClose }: SearchBarProps) => {
  const [query, setQuery] = useState("");
  const [replace, setReplace] = useState("");
  const [showReplace, setShowReplace] = useState(false);
  const [matches, setMatches] = useState<{ from: number; to: number }[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const findMatches = useCallback(
    (q: string) => {
      if (!q || q.length < 1) {
        setMatches([]);
        setCurrentIdx(0);
        return;
      }

      const results: { from: number; to: number }[] = [];
      const lowerQ = q.toLowerCase();
      editor.state.doc.descendants((node, pos) => {
        if (!node.isText || !node.text) return;
        const text = node.text.toLowerCase();
        let idx = text.indexOf(lowerQ);
        while (idx !== -1) {
          results.push({ from: pos + idx, to: pos + idx + q.length });
          idx = text.indexOf(lowerQ, idx + 1);
        }
      });

      setMatches(results);
      setCurrentIdx(results.length > 0 ? 0 : -1);

      if (results.length > 0) {
        scrollToMatch(results[0]);
      }
    },
    [editor]
  );

  const scrollToMatch = useCallback(
    (match: { from: number; to: number }) => {
      editor.commands.setTextSelection(match);
      const { view } = editor;
      try {
        const dom = view.domAtPos(match.from);
        const el =
          dom.node.nodeType === Node.TEXT_NODE
            ? dom.node.parentElement
            : (dom.node as HTMLElement);
        el?.scrollIntoView({ behavior: "smooth", block: "center" });
      } catch { /* domAtPos can throw */ }
    },
    [editor]
  );

  const goToNext = useCallback(() => {
    if (matches.length === 0) return;
    const next = (currentIdx + 1) % matches.length;
    setCurrentIdx(next);
    scrollToMatch(matches[next]);
  }, [matches, currentIdx, scrollToMatch]);

  const goToPrev = useCallback(() => {
    if (matches.length === 0) return;
    const prev = (currentIdx - 1 + matches.length) % matches.length;
    setCurrentIdx(prev);
    scrollToMatch(matches[prev]);
  }, [matches, currentIdx, scrollToMatch]);

  const handleReplaceCurrent = useCallback(() => {
    if (matches.length === 0 || currentIdx < 0) return;
    const match = matches[currentIdx];
    editor
      .chain()
      .focus()
      .setTextSelection(match)
      .insertContent(replace)
      .run();
    // Re-find matches after replacement
    setTimeout(() => findMatches(query), 50);
  }, [editor, matches, currentIdx, replace, query, findMatches]);

  const handleReplaceAll = useCallback(() => {
    if (matches.length === 0) return;
    // Replace from last to first to preserve positions
    const sorted = [...matches].sort((a, b) => b.from - a.from);
    editor.chain().focus().command(({ tr }) => {
      for (const match of sorted) {
        tr.insertText(replace, match.from, match.to);
      }
      return true;
    }).run();
    setMatches([]);
    setCurrentIdx(0);
  }, [editor, matches, replace]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      onClose();
    } else if (e.key === "Enter" && !showReplace) {
      if (e.shiftKey) goToPrev();
      else goToNext();
    } else if (e.key === "Enter" && showReplace) {
      if (e.metaKey || e.ctrlKey) {
        e.preventDefault();
        handleReplaceAll();
      } else {
        e.preventDefault();
        handleReplaceCurrent();
      }
    }
  };

  useEffect(() => {
    findMatches(query);
  }, [query, findMatches]);

  return (
    <div className="border-b border-[var(--border-color)] bg-[var(--bg-color)] animate-slide-down">
      <div className="flex items-center gap-2 px-3 py-2">
        <button
          onClick={() => setShowReplace(!showReplace)}
          className={`p-1.5 rounded transition-colors flex-shrink-0 ${
            showReplace
              ? "bg-[var(--accent-color)] text-white"
              : "hover:bg-[var(--hover-bg-color)]"
          }`}
          title="Toggle replace"
        >
          <FiRepeat className="w-3.5 h-3.5" />
        </button>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Find in note..."
          className="flex-1 px-3 py-1.5 text-sm bg-[var(--hover-bg-color)] border border-[var(--border-color)] rounded-lg outline-none focus:border-[var(--accent-color)] transition-colors min-w-0"
        />
        <span className="text-xs text-[var(--placeholder-color)] tabular-nums whitespace-nowrap min-w-[3.5rem] text-center">
          {matches.length > 0 ? `${currentIdx + 1}/${matches.length}` : "0/0"}
        </span>
        <button
          onClick={goToPrev}
          disabled={matches.length === 0}
          className="p-1.5 rounded hover:bg-[var(--hover-bg-color)] disabled:opacity-30 transition-colors"
          title="Previous (Shift+Enter)"
        >
          <FiChevronUp className="w-4 h-4" />
        </button>
        <button
          onClick={goToNext}
          disabled={matches.length === 0}
          className="p-1.5 rounded hover:bg-[var(--hover-bg-color)] disabled:opacity-30 transition-colors"
          title="Next (Enter)"
        >
          <FiChevronDown className="w-4 h-4" />
        </button>
        <button
          onClick={onClose}
          className="p-1.5 rounded hover:bg-[var(--hover-bg-color)] transition-colors"
          title="Close (Esc)"
        >
          <FiX className="w-4 h-4" />
        </button>
      </div>
      {showReplace && (
        <div className="flex items-center gap-2 px-3 pb-2">
          <div className="w-[30px] flex-shrink-0" />
          <input
            type="text"
            value={replace}
            onChange={(e) => setReplace(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Replace with..."
            className="flex-1 px-3 py-1.5 text-sm bg-[var(--hover-bg-color)] border border-[var(--border-color)] rounded-lg outline-none focus:border-[var(--accent-color)] transition-colors min-w-0"
          />
          <button
            onClick={handleReplaceCurrent}
            disabled={matches.length === 0}
            className="px-2.5 py-1.5 text-xs font-medium rounded-lg bg-[var(--hover-bg-color)] border border-[var(--border-color)] hover:bg-[var(--border-color)] disabled:opacity-30 transition-colors whitespace-nowrap"
            title="Replace current match"
          >
            Replace
          </button>
          <button
            onClick={handleReplaceAll}
            disabled={matches.length === 0}
            className="px-2.5 py-1.5 text-xs font-medium rounded-lg bg-[var(--accent-color)] text-white hover:bg-[var(--accent-hover)] disabled:opacity-30 transition-colors whitespace-nowrap"
            title="Replace all matches"
          >
            All
          </button>
        </div>
      )}
    </div>
  );
};
