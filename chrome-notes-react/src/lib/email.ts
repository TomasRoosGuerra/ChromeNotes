import { NotesState } from "../types/notes";

/**
 * Generate HTML email template from notes
 */
export const buildEmailHtml = (state: NotesState): string => {
  if (!state.mainTabs || state.mainTabs.length === 0) {
    return `<html><body><p>No notes found.</p></body></html>`;
  }

  const styles = `
    body { 
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
      line-height: 1.6; 
      color: #1a1a1a; 
      background-color: #fdfdfd;
      margin: 0;
      padding: 0;
    }
    .email-container {
      max-width: 680px; 
      margin: 0 auto; 
      padding: 20px;
      border: 1px solid #e0e0e0;
      background-color: #ffffff;
    }
    h1.main-tab-title { 
      color: #000000; 
      border-bottom: 2px solid #3b82f6; 
      padding-bottom: 10px; 
      margin-top: 24px; 
      margin-bottom: 20px;
      font-size: 24px;
      font-weight: 600;
    } 
    h1.main-tab-title:first-of-type {
      margin-top: 0;
    }
    h2.sub-tab-title { 
      color: #333333; 
      border-bottom: 1px solid #e0e0e0;
      padding-bottom: 6px;
      margin-top: 25px; 
      margin-bottom: 15px;
      font-size: 18px;
      font-weight: 600;
    } 
    .note-content h1, .note-content h2, .note-content h3 {
      margin-top: 1.2em;
      margin-bottom: 0.6em;
      font-weight: 600;
    }
    .note-content h1 { font-size: 1.8em; }
    .note-content h2 { font-size: 1.4em; }
    .note-content h3 { font-size: 1.2em; }
    .task-item { 
      display: flex;
      align-items: flex-start;
      margin: 6px 0; 
      padding: 4px 0;
    }
    .task-checkbox {
      margin-right: 10px;
      font-size: 18px;
      line-height: 1.2;
      color: #555;
    }
    .task-completed { 
      text-decoration: line-through; 
      color: #888888; 
    }
    ul, ol {
      padding-left: 24px;
      margin: 10px 0;
    }
    li {
      margin-bottom: 5px;
    }
    blockquote {
      border-left: 4px solid #e5e7eb;
      padding-left: 16px;
      margin: 16px 0;
      color: #6b7280;
    }
  `;

  const formatNoteContentForEmail = (htmlString: string): string => {
    if (!htmlString) return "";
    let processedHtml = htmlString;

    // Convert task items to checkboxes
    processedHtml = processedHtml.replace(
      /<li[^>]*data-checked="true"[^>]*>.*?<\/li>/gis,
      (match) => {
        const text = match.replace(/<[^>]+>/g, "").trim();
        return `<div class="task-item"><span class="task-checkbox">☑</span><span class="task-completed">${text}</span></div>`;
      }
    );

    processedHtml = processedHtml.replace(
      /<li[^>]*data-type="taskItem"[^>]*>.*?<\/li>/gis,
      (match) => {
        const isChecked = match.includes("checked");
        const text = match.replace(/<[^>]+>/g, "").trim();
        return `<div class="task-item"><span class="task-checkbox">${
          isChecked ? "☑" : "☐"
        }</span><span${
          isChecked ? ' class="task-completed"' : ""
        }>${text}</span></div>`;
      }
    );

    return `<div class="note-content">${processedHtml}</div>`;
  };

  const body = state.mainTabs
    .map((mainTab) => {
      const subTabsContent = mainTab.subTabs
        .map((subTab) => {
          const cleanContent = formatNoteContentForEmail(subTab.content);
          return `<h2 class="sub-tab-title">${subTab.name}</h2>${cleanContent}`;
        })
        .join("");
      return `<h1 class="main-tab-title">${mainTab.name}</h1>${subTabsContent}`;
    })
    .join("");

  return `<!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <style>${styles}</style>
      </head>
      <body>
        <div class="email-container">
          ${body}
        </div>
      </body>
    </html>`;
};

/**
 * Open Gmail compose window with notes
 */
export const emailNotes = (state: NotesState, recipientEmail: string): void => {
  const subject = `Chrome Notes – ${new Date().toLocaleDateString()}`;
  const body = buildEmailHtml(state);

  // Convert HTML to plain text for mailto (better compatibility)
  const tempDiv = document.createElement("div");
  tempDiv.innerHTML = body;
  const plainText = tempDiv.textContent || tempDiv.innerText || "";

  // Use mailto link (works everywhere)
  const mailtoUrl = `mailto:${recipientEmail}?subject=${encodeURIComponent(
    subject
  )}&body=${encodeURIComponent(plainText.substring(0, 2000))}...`;

  window.open(mailtoUrl, "_blank");
};
