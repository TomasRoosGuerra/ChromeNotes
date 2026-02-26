import { TextSelection } from "@tiptap/pm/state";

export const moveListItem = (
  editorInstance: any,
  direction: "up" | "down"
): boolean => {
  const { state, view } = editorInstance;
  const { selection } = state;
  const $from = selection.$from;
  const itemTypes = ["listItem", "taskItem"];

  let itemDepth = -1;
  for (let d = $from.depth; d > 0; d -= 1) {
    const node = $from.node(d);
    if (itemTypes.includes(node.type.name)) {
      itemDepth = d;
      break;
    }
  }
  if (itemDepth === -1) return false;

  const listDepth = itemDepth - 1;
  const listNode = $from.node(listDepth);
  const index = $from.index(listDepth);
  const itemPos = $from.before(itemDepth);
  const item = state.doc.nodeAt(itemPos);
  if (!item || !listNode) return false;

  if (direction === "up") {
    if (index === 0) return false;
    const prev = listNode.child(index - 1);
    let tr = state.tr;
    tr = tr.delete(itemPos, itemPos + item.nodeSize);
    const insertPos = itemPos - prev.nodeSize;
    tr = tr.insert(insertPos, item);
    const newSelPos = insertPos + 1;
    tr = tr.setSelection(
      TextSelection.near(tr.doc.resolve(newSelPos), -1)
    );
    view.dispatch(tr.scrollIntoView());
    return true;
  }

  if (index >= listNode.childCount - 1) return false;
  const next = listNode.child(index + 1);
  let tr = state.tr;
  const afterItemPos = itemPos + item.nodeSize;
  tr = tr.delete(itemPos, afterItemPos);
  const insertPos = itemPos + next.nodeSize;
  const newSelPos = insertPos + 1;
  tr = tr.insert(insertPos, item);
  tr = tr.setSelection(
    TextSelection.near(tr.doc.resolve(newSelPos), -1)
  );
  view.dispatch(tr.scrollIntoView());
  return true;
};

