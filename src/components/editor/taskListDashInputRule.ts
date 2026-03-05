import { Extension, wrappingInputRule } from "@tiptap/core";

/**
 * Adds "-- " as an input rule to create a task list item on an empty row,
 * similar to how "- " creates a bullet list.
 */
export const TaskListDashInputRule = Extension.create({
  name: "taskListDashInputRule",

  addInputRules() {
    const taskItemType = this.editor.schema.nodes.taskItem;
    if (!taskItemType) return [];

    return [
      wrappingInputRule({
        find: /^--\s$/,
        type: taskItemType,
        getAttributes: () => ({ checked: false }),
      }),
    ];
  },
});
