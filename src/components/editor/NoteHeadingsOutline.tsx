import type { Editor } from "@tiptap/react";
import type { Node as PMNode } from "@tiptap/pm/model";
import { useCallback, useEffect, useState } from "react";
import { useAppChrome } from "../../context/AppChromeContext";

export type HeadingItem = {
  pos: number;
  level: number;
  text: string;
};

function collectHeadings(doc: PMNode): HeadingItem[] {
  const out: HeadingItem[] = [];
  doc.descendants((node, pos) => {
    if (node.type.name === "heading") {
      const level = Number(node.attrs.level) || 1;
      const text = node.textContent.trim() || "Untitled";
      out.push({ pos, level, text });
    }
  });
  return out;
}

function scrollHeadingIntoView(editor: Editor, pos: number) {
  const doc = editor.state.doc;
  const $inside = doc.resolve(pos + 1);
  editor.chain().focus().setTextSelection($inside.pos).scrollIntoView().run();
  requestAnimationFrame(() => {
    const dom = editor.view.nodeDOM(pos);
    if (dom instanceof HTMLElement) {
      dom.scrollIntoView({ block: "nearest", behavior: "smooth" });
    }
  });
}

interface NoteHeadingsOutlineProps {
  editor: Editor | null;
}

/**
 * When chrome is collapsed (tabs hidden), shows a strip of small heading chips
 * so you can jump to any section in the current note.
 */
export function NoteHeadingsOutline({ editor }: NoteHeadingsOutlineProps) {
  const { collapsed } = useAppChrome();
  const [headings, setHeadings] = useState<HeadingItem[]>([]);

  useEffect(() => {
    if (!editor) {
      setHeadings([]);
      return;
    }
    const sync = () => setHeadings(collectHeadings(editor.state.doc));
    sync();
    editor.on("update", sync);
    return () => {
      editor.off("update", sync);
    };
  }, [editor]);

  const onPick = useCallback(
    (pos: number) => {
      if (!editor) return;
      scrollHeadingIntoView(editor, pos);
    },
    [editor]
  );

  if (!collapsed || !editor || headings.length === 0) {
    return null;
  }

  return (
    <div
      className="border-b border-[var(--border-color)] bg-[var(--bg-color)]/98 backdrop-blur-sm px-2 py-1.5"
      role="navigation"
      aria-label="Headings in this note"
    >
      <div className="flex items-center gap-1 overflow-x-auto scrollbar-thin touch-pan-x overscroll-x-contain pb-0.5">
        {headings.map((h) => {
          const levelStyle =
            h.level === 1
              ? "font-semibold"
              : h.level === 2
                ? "pl-2 border-l-2 border-[var(--accent-color)]/50"
                : "pl-2.5 border-l-2 border-[var(--border-color)] text-[var(--placeholder-color)]";
          return (
            <button
              key={h.pos}
              type="button"
              onClick={() => onPick(h.pos)}
              title={h.text}
              className={`shrink-0 max-w-[min(12rem,45vw)] truncate rounded-md px-2 py-1 text-left text-[11px] sm:text-xs font-medium transition-colors touch-manipulation select-none [-webkit-tap-highlight-color:transparent] bg-[var(--hover-bg-color)] text-[var(--text-color)] active:bg-[var(--border-color)] sm:hover:bg-[var(--border-color)] ${levelStyle}`}
            >
              {h.text}
            </button>
          );
        })}
      </div>
    </div>
  );
}
