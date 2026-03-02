import { Extension } from "@tiptap/core";

export const ListItemProgress = Extension.create({
  name: "listItemProgress",

  addGlobalAttributes() {
    return [
      {
        types: ["listItem", "taskItem"],
        attributes: {
          progress: {
            default: null,
            parseHTML: (element) => {
              const raw = element.getAttribute("data-progress");
              if (raw == null) return null;
              const num = Number(raw);
              if (Number.isNaN(num)) return null;
              const clamped = Math.max(0, Math.min(100, num));
              return clamped;
            },
            renderHTML: (attributes) => {
              const value = attributes.progress as number | null;
              if (value == null || value <= 0) {
                return {};
              }

              const clamped = Math.max(0, Math.min(100, value));

              let level = 0;
              if (clamped >= 100) level = 4;
              else if (clamped >= 67) level = 3;
              else if (clamped >= 34) level = 2;
              else if (clamped > 0) level = 1;

              return {
                "data-progress": String(clamped),
                "data-progress-level": String(level),
              };
            },
          },
          durationMinutes: {
            default: null,
            parseHTML: (element) => {
              const raw = element.getAttribute("data-duration");
              if (raw == null) return null;
              const num = Number(raw);
              if (Number.isNaN(num)) return null;
              const clamped = Math.max(0, Math.min(24 * 60, num));
              return clamped;
            },
            renderHTML: (attributes) => {
              const total = attributes.durationMinutes as number | null;
              if (total == null || total <= 0) {
                return {};
              }

              const clamped = Math.max(0, Math.min(24 * 60, total));
              const progress = (attributes.progress as number | null) ?? 0;
              const ratio = Math.max(0, Math.min(1, progress / 100));
              const spent = Math.max(0, Math.round(clamped * ratio));

              return {
                "data-duration": String(clamped),
                "data-spent": String(spent),
              };
            },
          },
        },
      },
    ];
  },
});

