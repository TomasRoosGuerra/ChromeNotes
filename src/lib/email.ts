import type { MainTab } from "../types/notes";

export const emailNotes = (mainTabs: MainTab[], defaultEmail: string = "") => {
  const subject = `Chrome Notes - ${new Date().toLocaleDateString()}`;
  let body = "";

  mainTabs.forEach((mainTab) => {
    body += `${mainTab.name}\n${"=".repeat(mainTab.name.length)}\n\n`;

    mainTab.subTabs.forEach((subTab) => {
      body += `${subTab.name}\n${"-".repeat(subTab.name.length)}\n\n`;

      // Convert HTML to plain text
      const content = htmlToPlainText(subTab.content);
      body += content + "\n\n";
    });

    body += "\n";
  });

  const mailtoLink = `mailto:${defaultEmail}?subject=${encodeURIComponent(
    subject
  )}&body=${encodeURIComponent(body)}`;

  window.location.href = mailtoLink;
};

const htmlToPlainText = (html: string): string => {
  if (!html) return "";

  let text = html;

  // Convert task lists
  text = text.replace(
    /<li data-checked="true"[^>]*>.*?<div>(.*?)<\/div><\/li>/gi,
    "☑ $1\n"
  );
  text = text.replace(
    /<li data-checked="false"[^>]*>.*?<div>(.*?)<\/div><\/li>/gi,
    "☐ $1\n"
  );

  // Convert lists
  text = text.replace(/<li>(.*?)<\/li>/gi, "• $1\n");

  // Convert headings
  text = text.replace(
    /<h1[^>]*>(.*?)<\/h1>/gi,
    "\n$1\n" + "=".repeat(50) + "\n"
  );
  text = text.replace(
    /<h2[^>]*>(.*?)<\/h2>/gi,
    "\n$1\n" + "-".repeat(30) + "\n"
  );
  text = text.replace(/<h3[^>]*>(.*?)<\/h3>/gi, "\n$1\n");

  // Convert blockquotes
  text = text.replace(/<blockquote[^>]*>(.*?)<\/blockquote>/gis, "> $1\n");

  // Convert paragraphs
  text = text.replace(/<p[^>]*>(.*?)<\/p>/gi, "$1\n");

  // Remove all HTML tags
  text = text.replace(/<[^>]+>/g, "");

  // Decode HTML entities
  text = text
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"');

  // Clean up whitespace
  text = text.replace(/\n{3,}/g, "\n\n");
  text = text.trim();

  return text;
};
