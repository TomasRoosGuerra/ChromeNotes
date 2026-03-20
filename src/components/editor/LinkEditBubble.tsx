import { getMarkRange, posToDOMRect } from "@tiptap/core";
import type { Editor } from "@tiptap/core";
import type { EditorView } from "@tiptap/pm/view";
import { FiEdit2 } from "react-icons/fi";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";

const BTN_PX = 16;
const VIEW_PAD = 4;

/** Prefer real <a> bounds — coordsAtPos/posToDOMRect can be wrong inside overflow scroll on mobile WebKit. */
function getLinkAnchorRect(
  view: EditorView,
  from: number,
  to: number
): DOMRect | null {
  if (to <= from) return null;

  const candidates = [
    Math.min(from + 1, to - 1),
    from,
    Math.floor((from + to) / 2),
    to - 1,
  ];
  const seen = new Set<number>();
  for (const pos of candidates) {
    if (pos < from || pos >= to || seen.has(pos)) continue;
    seen.add(pos);
    try {
      const at = view.domAtPos(pos);
      let node: Node | null = at.node;
      if (node.nodeType === Node.TEXT_NODE) {
        node = node.parentElement;
      }
      const el = node as HTMLElement | null;
      if (!el) continue;
      const a = el.closest("a");
      if (a && view.dom.contains(a)) {
        return a.getBoundingClientRect();
      }
    } catch {
      continue;
    }
  }
  return null;
}

function findScrollableAncestors(el: HTMLElement | null): HTMLElement[] {
  const out: HTMLElement[] = [];
  let p: HTMLElement | null = el;
  while (p) {
    const { overflowY, overflow } = getComputedStyle(p);
    const oy = overflowY;
    const ox = overflow;
    if (
      /(auto|scroll|overlay)/.test(oy) ||
      /(auto|scroll|overlay)/.test(ox)
    ) {
      out.push(p);
    }
    p = p.parentElement;
  }
  return out;
}

function dedupeElements(els: HTMLElement[]): HTMLElement[] {
  const seen = new Set<HTMLElement>();
  const out: HTMLElement[] = [];
  for (const el of els) {
    if (!seen.has(el)) {
      seen.add(el);
      out.push(el);
    }
  }
  return out;
}

/** Clamp fixed position so the pen stays on-screen (mobile address bar / rotation). */
function clampToViewport(left: number, top: number): { left: number; top: number } {
  const vv = typeof window !== "undefined" ? window.visualViewport : null;
  const vw = vv?.width ?? window.innerWidth;
  const vh = vv?.height ?? window.innerHeight;
  const vx = vv?.offsetLeft ?? 0;
  const vy = vv?.offsetTop ?? 0;

  const maxL = vx + vw - BTN_PX - VIEW_PAD;
  const minL = vx + VIEW_PAD;
  const maxT = vy + vh - BTN_PX - VIEW_PAD;
  const minT = vy + VIEW_PAD;

  return {
    left: Math.min(maxL, Math.max(minL, left)),
    top: Math.min(maxT, Math.max(minT, top)),
  };
}

interface LinkEditBubbleProps {
  editor: Editor | null;
  onEditLink: () => void;
  linkPopoverOpen: boolean;
  /** Main note scroll area (after mount) — reliable scroll updates on mobile. */
  scrollContainerEl?: HTMLElement | null;
}

/**
 * Floating pen anchored to the link. Uses <a>.getBoundingClientRect when possible
 * and listens to scroll on all scrollable ancestors (scroll does not bubble to window).
 */
export const LinkEditBubble = ({
  editor,
  onEditLink,
  linkPopoverOpen,
  scrollContainerEl,
}: LinkEditBubbleProps) => {
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
  const pointerEngagedRef = useRef(false);

  const updatePosition = useCallback(() => {
    if (!editor || editor.isDestroyed || linkPopoverOpen) {
      setPos(null);
      return;
    }
    if (!editor.isActive("link")) {
      setPos(null);
      return;
    }
    if (!editor.isFocused && !pointerEngagedRef.current) {
      setPos(null);
      return;
    }

    const { state, view } = editor;
    const $from = state.selection.$from;
    const linkType = state.schema.marks.link;
    if (!linkType) {
      setPos(null);
      return;
    }

    const range = getMarkRange($from, linkType);
    if (!range) {
      setPos(null);
      return;
    }

    const anchorRect = getLinkAnchorRect(view, range.from, range.to);
    const rect =
      anchorRect && anchorRect.width > 0 && anchorRect.height > 0
        ? anchorRect
        : posToDOMRect(view, range.from, range.to);

    // Hide when the link is fully off-screen (saves stray floats while scrolling).
    const vv = typeof window !== "undefined" ? window.visualViewport : null;
    const vw = vv?.width ?? window.innerWidth;
    const vh = vv?.height ?? window.innerHeight;
    const vx = vv?.offsetLeft ?? 0;
    const vy = vv?.offsetTop ?? 0;
    if (
      rect.bottom < vy - 8 ||
      rect.top > vy + vh + 8 ||
      rect.right < vx - 8 ||
      rect.left > vx + vw + 8
    ) {
      setPos(null);
      return;
    }

    // Vertically center on the link line; pin to trailing edge.
    const rawTop = rect.top + Math.max(0, (rect.height - BTN_PX) / 2);
    const rawLeft = rect.right - BTN_PX;
    setPos(clampToViewport(rawLeft, rawTop));
  }, [editor, linkPopoverOpen]);

  useLayoutEffect(() => {
    if (!editor) return;

    const schedule = () => {
      requestAnimationFrame(updatePosition);
    };

    editor.on("selectionUpdate", schedule);
    editor.on("transaction", schedule);
    editor.on("focus", schedule);
    editor.on("blur", schedule);

    window.addEventListener("resize", schedule);

    const vv = typeof window !== "undefined" ? window.visualViewport : null;
    if (vv) {
      vv.addEventListener("resize", schedule);
      vv.addEventListener("scroll", schedule);
    }

    const scrollRoots = dedupeElements([
      ...(scrollContainerEl ? [scrollContainerEl] : []),
      ...findScrollableAncestors(editor.view.dom as HTMLElement),
    ]);
    for (const el of scrollRoots) {
      el.addEventListener("scroll", schedule, { passive: true });
    }
    document.addEventListener("scroll", schedule, {
      capture: true,
      passive: true,
    });

    schedule();

    return () => {
      editor.off("selectionUpdate", schedule);
      editor.off("transaction", schedule);
      editor.off("focus", schedule);
      editor.off("blur", schedule);
      window.removeEventListener("resize", schedule);
      if (vv) {
        vv.removeEventListener("resize", schedule);
        vv.removeEventListener("scroll", schedule);
      }
      for (const el of scrollRoots) {
        el.removeEventListener("scroll", schedule);
      }
      document.removeEventListener("scroll", schedule, true);
    };
  }, [editor, updatePosition, scrollContainerEl]);

  useEffect(() => {
    if (linkPopoverOpen) {
      pointerEngagedRef.current = false;
      setPos(null);
    }
  }, [linkPopoverOpen]);

  if (!editor || !pos || linkPopoverOpen) {
    return null;
  }

  const bubble = (
    <button
      type="button"
      tabIndex={-1}
      className="link-edit-bubble"
      style={{
        position: "fixed",
        top: pos.top,
        left: pos.left,
        zIndex: 10000,
      }}
      onPointerDown={(e) => {
        pointerEngagedRef.current = true;
        e.stopPropagation();
      }}
      onPointerUp={(e) => {
        e.stopPropagation();
      }}
      onPointerCancel={() => {
        pointerEngagedRef.current = false;
      }}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        pointerEngagedRef.current = false;
        onEditLink();
      }}
      title="Edit link"
      aria-label="Edit link"
    >
      <FiEdit2 className="link-edit-bubble-icon" aria-hidden />
    </button>
  );

  return createPortal(bubble, document.body);
};
