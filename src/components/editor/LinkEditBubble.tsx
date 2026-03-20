import { getMarkRange, posToDOMRect } from "@tiptap/core";
import type { Editor } from "@tiptap/core";
import { BubbleMenu } from "@tiptap/react";
import type { EditorState } from "@tiptap/pm/state";
import { PluginKey } from "@tiptap/pm/state";
import type { EditorView } from "@tiptap/pm/view";
import { FiEdit2 } from "react-icons/fi";
import { useCallback, useRef } from "react";

const linkEditBubblePluginKey = new PluginKey("linkEditBubble");

interface LinkEditBubbleProps {
  editor: Editor | null;
  onEditLink: () => void;
  linkPopoverOpen: boolean;
}

type ShouldShowProps = {
  editor: Editor;
  element: HTMLElement;
  view: EditorView;
  state: EditorState;
  oldState?: EditorState;
  from: number;
  to: number;
};

export const LinkEditBubble = ({
  editor,
  onEditLink,
  linkPopoverOpen,
}: LinkEditBubbleProps) => {
  const editorRef = useRef(editor);
  editorRef.current = editor;

  const linkPopoverOpenRef = useRef(linkPopoverOpen);
  linkPopoverOpenRef.current = linkPopoverOpen;

  const shouldShow = useCallback(({ editor: ed, view, element }: ShouldShowProps) => {
    if (!ed.isEditable || linkPopoverOpenRef.current) return false;
    if (!ed.isActive("link")) return false;

    const isChildOfMenu = element.contains(document.activeElement);
    const hasEditorFocus = view.hasFocus() || isChildOfMenu;
    if (!hasEditorFocus) return false;

    return true;
  }, []);

  const getReferenceClientRect = useCallback(() => {
    const ed = editorRef.current;
    if (!ed) return new DOMRect();
    const { state, view } = ed;
    const { $from } = state.selection;
    const linkType = state.schema.marks.link;
    if (!linkType) return new DOMRect();

    const range = getMarkRange($from, linkType);
    if (!range) {
      return posToDOMRect(view, state.selection.from, state.selection.to);
    }
    return posToDOMRect(view, range.from, range.to);
  }, []);

  if (!editor) return null;

  return (
    <BubbleMenu
      editor={editor}
      pluginKey={linkEditBubblePluginKey}
      updateDelay={0}
      shouldShow={shouldShow}
      tippyOptions={{
        placement: "top-end",
        offset: [0, 6],
        appendTo: () => document.body,
        zIndex: 50,
        moveTransition: "transform 0.12s ease-out",
        getReferenceClientRect,
      }}
      className="link-edit-bubble-root"
    >
      <button
        type="button"
        className="link-edit-bubble"
        onMouseDown={(e) => e.preventDefault()}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onEditLink();
        }}
        title="Edit link"
        aria-label="Edit link"
      >
        <FiEdit2 className="w-4 h-4" aria-hidden />
      </button>
    </BubbleMenu>
  );
};
