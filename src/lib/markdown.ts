import type { MainTab, SubTab } from "../types/notes";

export const formatTabsForCopy = (mainTabs: MainTab[]): string => {
  let output = "";

  mainTabs.forEach((mainTab) => {
    output += `# ${mainTab.name}\n\n`;

    mainTab.subTabs.forEach((subTab) => {
      output += `## ${subTab.name}\n\n`;

      // Convert HTML to markdown-like text
      const content = htmlToMarkdown(subTab.content);
      output += content + "\n\n";
    });

    output += "---\n\n";
  });

  return output.trim();
};

const htmlToMarkdown = (html: string): string => {
  if (!html) return "";

  let text = html;

  // Convert task lists
  text = text.replace(
    /<li data-checked="true"[^>]*><label[^>]*><input[^>]*><\/label><div>(.*?)<\/div><\/li>/gi,
    "☑ $1"
  );
  text = text.replace(
    /<li data-checked="false"[^>]*><label[^>]*><input[^>]*><\/label><div>(.*?)<\/div><\/li>/gi,
    "☐ $1"
  );

  // Convert lists
  text = text.replace(/<li>(.*?)<\/li>/gi, "• $1\n");
  text = text.replace(/<ul[^>]*>(.*?)<\/ul>/gis, "$1");
  text = text.replace(/<ol[^>]*>(.*?)<\/ol>/gis, (_match, content) => {
    let counter = 1;
    return content.replace(/• /g, () => `${counter++}. `);
  });

  // Convert headings
  text = text.replace(/<h1[^>]*>(.*?)<\/h1>/gi, "# $1\n");
  text = text.replace(/<h2[^>]*>(.*?)<\/h2>/gi, "## $1\n");
  text = text.replace(/<h3[^>]*>(.*?)<\/h3>/gi, "### $1\n");

  // Convert blockquotes
  text = text.replace(/<blockquote[^>]*>(.*?)<\/blockquote>/gis, "> $1\n");

  // Convert formatting
  text = text.replace(/<strong[^>]*>(.*?)<\/strong>/gi, "**$1**");
  text = text.replace(/<b[^>]*>(.*?)<\/b>/gi, "**$1**");
  text = text.replace(/<em[^>]*>(.*?)<\/em>/gi, "_$1_");
  text = text.replace(/<i[^>]*>(.*?)<\/i>/gi, "_$1_");
  text = text.replace(/<s[^>]*>(.*?)<\/s>/gi, "~~$1~~");
  text = text.replace(/<strike[^>]*>(.*?)<\/strike>/gi, "~~$1~~");

  // Convert paragraphs
  text = text.replace(/<p[^>]*>(.*?)<\/p>/gi, "$1\n");

  // Remove remaining HTML tags
  text = text.replace(/<[^>]+>/g, "");

  // Clean up whitespace
  text = text.replace(/\n{3,}/g, "\n\n");
  text = text.trim();

  return text;
};

export const parseImportedContent = (text: string): MainTab[] => {
  const tabs: MainTab[] = [];
  const sections = text.split(/^---$/gm);

  sections.forEach((section) => {
    const lines = section.trim().split("\n");
    if (lines.length === 0) return;

    let currentMainTab: MainTab | null = null;
    let currentSubTab: SubTab | null = null;
    let contentBuffer: string[] = [];

    lines.forEach((line) => {
      // Main tab (# Heading)
      if (line.startsWith("# ")) {
        // Save previous sub tab if exists
        if (currentMainTab !== null && currentSubTab !== null) {
          const subTab: SubTab = {
            ...currentSubTab,
            content: markdownToHtml(contentBuffer.join("\n")),
          };
          currentMainTab.subTabs.push(subTab);
        }

        currentMainTab = {
          id: Date.now().toString() + Math.random(),
          name: line.substring(2).trim(),
          subTabs: [],
        };
        currentSubTab = null;
        contentBuffer = [];
      }
      // Sub tab (## Heading)
      else if (line.startsWith("## ")) {
        // Save previous sub tab if exists
        if (currentMainTab !== null && currentSubTab !== null) {
          const subTab: SubTab = {
            ...currentSubTab,
            content: markdownToHtml(contentBuffer.join("\n")),
          };
          currentMainTab.subTabs.push(subTab);
        }

        currentSubTab = {
          id: Date.now().toString() + Math.random(),
          name: line.substring(3).trim(),
          content: "",
        };
        contentBuffer = [];
      }
      // Content
      else if (currentSubTab !== null) {
        contentBuffer.push(line);
      }
    });

    // Add last sub tab and main tab
    if (currentMainTab) {
      if (currentSubTab) {
        (currentMainTab as MainTab).subTabs.push({
          id: (currentSubTab as SubTab).id,
          name: (currentSubTab as SubTab).name,
          content: markdownToHtml(contentBuffer.join("\n")),
        });
      }
      
      if ((currentMainTab as MainTab).subTabs.length > 0) {
        tabs.push(currentMainTab as MainTab);
      }
    }
  });

  return tabs;
};

const markdownToHtml = (markdown: string): string => {
  if (!markdown) return "<p></p>";

  let html = markdown;

  // Convert task lists
  html = html.replace(/^☑ (.*)$/gm, '<li data-checked="true">$1</li>');
  html = html.replace(/^☐ (.*)$/gm, '<li data-checked="false">$1</li>');

  // Convert lists
  html = html.replace(/^• (.*)$/gm, "<li>$1</li>");
  html = html.replace(/^(\d+)\. (.*)$/gm, "<li>$2</li>");

  // Wrap lists
  html = html.replace(/(<li>.*<\/li>\n?)+/g, (match) => {
    if (match.includes('data-checked="')) {
      return `<ul data-type="taskList">${match}</ul>`;
    }
    return `<ul>${match}</ul>`;
  });

  // Convert headings
  html = html.replace(/^### (.*)$/gm, "<h3>$1</h3>");
  html = html.replace(/^## (.*)$/gm, "<h2>$1</h2>");
  html = html.replace(/^# (.*)$/gm, "<h1>$1</h1>");

  // Convert blockquotes
  html = html.replace(/^> (.*)$/gm, "<blockquote>$1</blockquote>");

  // Convert formatting
  html = html.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
  html = html.replace(/_(.*?)_/g, "<em>$1</em>");
  html = html.replace(/~~(.*?)~~/g, "<strike>$1</strike>");

  // Convert paragraphs
  html = html.replace(/^(?!<[hbu]|<li|<blockquote)(.+)$/gm, "<p>$1</p>");

  return html;
};
