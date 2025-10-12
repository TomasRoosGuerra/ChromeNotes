import type { NotesState } from "../types/notes";

/**
 * Format notes content to markdown-style text for copying
 */
export const formatTabsForCopy = (state: NotesState): string => {
  if (!state.mainTabs || state.mainTabs.length === 0) {
    return "No tabs found.";
  }

  return state.mainTabs
    .map((mainTab, mainIndex) => {
      const subTabsContent = mainTab.subTabs
        .map((subTab, subIndex) => {
          const formattedContent = formatContentForCopy(subTab.content);
          const subTabHeader = `## ${subIndex + 1}. ${subTab.name}`;
          return `${subTabHeader}\n\n${formattedContent}`;
        })
        .join("\n\n");

      const mainTabHeader = `# ${mainIndex + 1}. ${mainTab.name}`;
      return `${mainTabHeader}\n\n${subTabsContent}`;
    })
    .join("\n\n" + "=".repeat(50) + "\n\n");
};

/**
 * Convert HTML content to readable markdown format
 */
export const formatContentForCopy = (htmlContent: string): string => {
  if (!htmlContent) return "";

  const tempDiv = document.createElement("div");
  tempDiv.innerHTML = htmlContent;

  let formattedText = "";

  function processNode(node: Node, depth = 0): void {
    const indent = "  ".repeat(depth);

    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent?.trim();
      if (text) {
        formattedText += text;
      }
      return;
    }

    if (node.nodeType === Node.ELEMENT_NODE) {
      const element = node as HTMLElement;
      const tagName = element.tagName.toLowerCase();

      switch (tagName) {
        case "h1":
          formattedText += `\n${indent}# ${element.textContent?.trim()}\n\n`;
          break;
        case "h2":
          formattedText += `\n${indent}## ${element.textContent?.trim()}\n\n`;
          break;
        case "h3":
          formattedText += `\n${indent}### ${element.textContent?.trim()}\n\n`;
          break;
        case "ul":
          if (element.getAttribute("data-type") === "taskList") {
            // Task list
            Array.from(element.children).forEach((li) => {
              const checkbox = li.querySelector('input[type="checkbox"]');
              const isChecked = checkbox?.hasAttribute("checked");
              const text = li.textContent?.trim();
              if (text) {
                formattedText += `${indent}${isChecked ? "☑" : "☐"} ${text}\n`;
              }
            });
          } else {
            // Regular bullet list
            Array.from(element.children).forEach((li) => {
              formattedText += `${indent}• ${li.textContent?.trim()}\n`;
            });
          }
          formattedText += "\n";
          break;
        case "ol":
          Array.from(element.children).forEach((li, index) => {
            formattedText += `${indent}${
              index + 1
            }. ${li.textContent?.trim()}\n`;
          });
          formattedText += "\n";
          break;
        case "blockquote":
          formattedText += `\n${indent}> ${element.textContent?.trim()}\n\n`;
          break;
        case "strong":
        case "b":
          formattedText += `**${element.textContent?.trim()}**`;
          break;
        case "em":
        case "i":
          formattedText += `*${element.textContent?.trim()}*`;
          break;
        case "br":
          formattedText += "\n";
          break;
        default:
          Array.from(node.childNodes).forEach((child) =>
            processNode(child, depth)
          );
          break;
      }
    }
  }

  Array.from(tempDiv.childNodes).forEach((node) => processNode(node));

  return formattedText
    .replace(/\n\s*\n\s*\n/g, "\n\n")
    .replace(/^\s+|\s+$/g, "")
    .trim();
};

/**
 * Parse imported markdown content and reconstruct tabs
 */
export const parseImportedContent = (
  text: string
): Array<{ id: string; name: string; subTabs: Array<any> }> => {
  const tabs: Array<{ id: string; name: string; subTabs: Array<any> }> = [];
  const lines = text.split("\n");
  let currentTab: any = null;
  let currentSubTab: any = null;
  let currentContent: string[] = [];
  let inContent = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // Main tab header (e.g., "# 1. Tab Name")
    if (line.match(/^#\s*\d+\.\s*.+/)) {
      if (currentTab) {
        if (currentSubTab) {
          currentSubTab.content = formatImportedContent(
            currentContent.join("\n")
          );
          currentTab.subTabs.push(currentSubTab);
        }
        tabs.push(currentTab);
      }

      const tabName = line.replace(/^#\s*\d+\.\s*/, "");
      currentTab = {
        id: `${Date.now()}-${Math.random()}`,
        name: tabName,
        subTabs: [],
      };
      currentSubTab = null;
      currentContent = [];
      inContent = false;
    }
    // Sub tab header (e.g., "## 1. Sub Tab Name")
    else if (line.match(/^##\s*\d+\.\s*.+/)) {
      if (currentSubTab) {
        currentSubTab.content = formatImportedContent(
          currentContent.join("\n")
        );
        currentTab.subTabs.push(currentSubTab);
      }

      const subTabName = line.replace(/^##\s*\d+\.\s*/, "");
      currentSubTab = {
        id: `${Date.now()}-${Math.random()}`,
        name: subTabName,
        content: "",
      };
      currentContent = [];
      inContent = true;
    }
    // Separator line
    else if (line.match(/^=+$/)) {
      continue;
    }
    // Content line
    else if (inContent) {
      currentContent.push(line);
    }
  }

  // Save the last tab and sub tab
  if (currentTab) {
    if (currentSubTab) {
      currentSubTab.content = formatImportedContent(currentContent.join("\n"));
      currentTab.subTabs.push(currentSubTab);
    }
    tabs.push(currentTab);
  }

  return tabs;
};

/**
 * Convert imported plain text back to HTML format
 */
const formatImportedContent = (text: string): string => {
  if (!text || text.trim() === "") return "";

  const lines = text.split("\n");
  let htmlContent = "";
  let inList = false;
  let listType = "";
  let listItems: string[] = [];

  for (const line of lines) {
    const trimmedLine = line.trim();

    // Headers
    if (trimmedLine.match(/^###\s/)) {
      if (inList) {
        htmlContent += closeList(listType, listItems);
        inList = false;
        listItems = [];
      }
      const headerText = trimmedLine.replace(/^###\s/, "");
      htmlContent += `<h3>${headerText}</h3>`;
    } else if (trimmedLine.match(/^##\s/)) {
      if (inList) {
        htmlContent += closeList(listType, listItems);
        inList = false;
        listItems = [];
      }
      const headerText = trimmedLine.replace(/^##\s/, "");
      htmlContent += `<h2>${headerText}</h2>`;
    } else if (trimmedLine.match(/^#\s/)) {
      if (inList) {
        htmlContent += closeList(listType, listItems);
        inList = false;
        listItems = [];
      }
      const headerText = trimmedLine.replace(/^#\s/, "");
      htmlContent += `<h1>${headerText}</h1>`;
    }
    // Checkbox items
    else if (trimmedLine.match(/^[☐☑]\s/)) {
      if (inList) {
        htmlContent += closeList(listType, listItems);
        inList = false;
        listItems = [];
      }
      const isChecked = trimmedLine.startsWith("☑");
      const taskText = trimmedLine.replace(/^[☐☑]\s/, "");
      htmlContent += `<li data-checked="${isChecked}" data-type="taskItem"><label><input type="checkbox" ${
        isChecked ? "checked" : ""
      }><span></span></label><div><p>${taskText}</p></div></li>`;
    }
    // Bullet lists
    else if (trimmedLine.match(/^•\s/)) {
      if (!inList || listType !== "ul") {
        if (inList) {
          htmlContent += closeList(listType, listItems);
        }
        inList = true;
        listType = "ul";
        listItems = [];
      }
      const itemText = trimmedLine.replace(/^•\s/, "");
      listItems.push(itemText);
    }
    // Numbered lists
    else if (trimmedLine.match(/^\d+\.\s/)) {
      if (!inList || listType !== "ol") {
        if (inList) {
          htmlContent += closeList(listType, listItems);
        }
        inList = true;
        listType = "ol";
        listItems = [];
      }
      const itemText = trimmedLine.replace(/^\d+\.\s/, "");
      listItems.push(itemText);
    }
    // Blockquotes
    else if (trimmedLine.match(/^>\s/)) {
      if (inList) {
        htmlContent += closeList(listType, listItems);
        inList = false;
        listItems = [];
      }
      const quoteText = trimmedLine.replace(/^>\s/, "");
      htmlContent += `<blockquote><p>${quoteText}</p></blockquote>`;
    }
    // Regular text
    else if (trimmedLine) {
      if (inList) {
        htmlContent += closeList(listType, listItems);
        inList = false;
        listItems = [];
      }
      const formattedText = formatInlineText(trimmedLine);
      htmlContent += `<p>${formattedText}</p>`;
    }
  }

  if (inList) {
    htmlContent += closeList(listType, listItems);
  }

  return htmlContent;
};

const closeList = (type: string, items: string[]): string => {
  if (items.length === 0) return "";

  const listItems = items
    .map((item) => {
      const formattedItem = formatInlineText(item);
      return `<li><p>${formattedItem}</p></li>`;
    })
    .join("");

  return `<${type}>${listItems}</${type}>`;
};

const formatInlineText = (text: string): string => {
  // Handle bold text (**text**)
  text = text.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");

  // Handle italic text (*text*)
  text = text.replace(/\*(.*?)\*/g, "<em>$1</em>");

  return text;
};
