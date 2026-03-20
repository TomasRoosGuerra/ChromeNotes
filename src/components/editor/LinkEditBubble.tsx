import { getMarkRange, posToDOMRect } from "@tiptap/core";
import type { Editor } from "@tiptap/core";
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
const GAP_PX = 2;

interface LinkEditBubbleProps {
  editor: Editor | null;
  onEditLink: () => void;
  linkPopoverOpen: boolean;
}

/**
 * Floating pen control anchored to the link mark (top-end). Manual positioning
 * avoids BubbleMenu + Tippy blur/focus races that broke clicks on touch and desktop.
 */
export const LinkEditBubble = ({
  editor,
  onEditLink,
  linkPopoverOpen,
}: LinkEditBubbleProps) => {
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
  /** True between pointer down on the pen and opening the popover — keeps UI visible while editor blurs. */
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

    const rect = posToDOMRect(view, range.from, range.to);
    setPos({
      top: rect.top - BTN_PX - GAP_PX,
      left: rect.right - BTN_PX,
    });
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

    window.addEventListener("scroll", schedule, true);
    window.addEventListener("resize", schedule);

    schedule();

    return () => {
      editor.off("selectionUpdate", schedule);
      editor.off("transaction", schedule);
      editor.off("focus", schedule);
      editor.off("blur", schedule);
      window.removeEventListener("scroll", schedule, true);
      window.removeEventListener("resize", schedule);
    };
  }, [editor, updatePosition]);

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
