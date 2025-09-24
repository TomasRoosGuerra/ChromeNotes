// Extension icon behavior is now handled by setPanelBehavior
// Left-click: Opens sidepanel directly
// Right-click: Shows context menu

// Listen for messages from the side panel to fetch page titles for URLs.
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "fetchTitle") {
    fetch(request.url)
      .then((response) => response.text())
      .then((text) => {
        const match = text.match(/<title>(.*?)<\/title>/i);
        sendResponse({ title: match ? match[1] : request.url });
      })
      .catch(() => sendResponse({ title: request.url }));
    return true; // Indicates that the response is sent asynchronously.
  }
  if (request.action === "scheduleDailyEmail") {
    scheduleDailyEmail();
    sendResponse({ ok: true });
  }
  if (request.action === "rescheduleDailyEmail") {
    scheduleDailyEmail(request.time);
    sendResponse({ ok: true });
  }
  if (request.action === "testDailyEmail") {
    console.log("Testing daily email trigger");
    triggerEmailComposeFromStoredNotes();
    sendResponse({ ok: true });
  }
});

// Schedule a daily alarm at 9:00 AM local time
function scheduleDailyEmail(optionalTime) {
  chrome.storage.local.get("sidekickNotesEmailTime", (res) => {
    const timeStr = optionalTime || res.sidekickNotesEmailTime || "09:00";
    const [hh, mm] = timeStr.split(":").map((s) => parseInt(s, 10));
    const now = new Date();
    const target = new Date();
    target.setHours(hh || 9, mm || 0, 0, 0);
    if (target <= now) target.setDate(target.getDate() + 1);
    const delayMs = target.getTime() - now.getTime();

    console.log(
      `Scheduling daily email for ${timeStr}, next trigger in ${Math.round(
        delayMs / 1000 / 60
      )} minutes`
    );

    chrome.alarms.clear("dailyEmail", () => {
      chrome.alarms.create("dailyEmail", {
        when: Date.now() + delayMs,
        periodInMinutes: 24 * 60,
      });
      console.log("Daily email alarm created");
    });
  });
}

chrome.runtime.onInstalled.addListener(() => {
  console.log("Extension installed, scheduling daily email");
  scheduleDailyEmail();

  // Set sidepanel to open directly on action click
  chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });
});

chrome.runtime.onStartup.addListener(() => {
  console.log("Chrome started, rescheduling daily email");
  scheduleDailyEmail();
});

chrome.alarms.onAlarm.addListener((alarm) => {
  console.log("Alarm triggered:", alarm.name);
  if (alarm.name === "dailyEmail") {
    console.log("Triggering daily email");
    triggerEmailComposeFromStoredNotes();
  }
});

function triggerEmailComposeFromStoredNotes() {
  chrome.storage.local.get(
    ["sidekickNotesData_v2_4", "sidekickNotesData_v2_3"],
    (result) => {
      const data =
        result.sidekickNotesData_v2_4 || result.sidekickNotesData_v2_3;
      if (!data) return;

      // Handle different data structures
      let mainTabs;
      if (data.mainTabs) {
        mainTabs = data.mainTabs;
      } else if (data.tabs) {
        // Convert old structure to new structure
        mainTabs = data.tabs.map((tab) => ({
          id: tab.id,
          name: tab.name,
          subTabs: [
            { id: tab.id + "_default", name: "Main", content: tab.content },
          ],
        }));
      } else {
        return;
      }

      if (!mainTabs || mainTabs.length === 0) return;

      const subject = `Sidekick Notes – ${new Date().toLocaleDateString()}`;
      const html = buildEmailHtml(mainTabs);
      const to = "tomas.roosguerra@gmail.com";

      const url = `https://mail.google.com/mail/u/0/?view=cm&fs=1&to=${encodeURIComponent(
        to
      )}&su=${encodeURIComponent(subject)}&tf=1`;

      chrome.tabs.create({ url }, (tab) => {
        const listenForReady = (message, sender) => {
          if (
            sender.tab &&
            sender.tab.id === tab.id &&
            message === "gmail_inject_ready"
          ) {
            const tryInject = (attemptsLeft) => {
              chrome.tabs.sendMessage(
                tab.id,
                {
                  action: "injectEmailBody",
                  payload: { html, autoSend: true, to },
                },
                (response) => {
                  if (!response || response.ok !== true) {
                    if (attemptsLeft > 0)
                      setTimeout(() => tryInject(attemptsLeft - 1), 500);
                  } else if (response.sent) {
                    console.log("Daily email sent successfully");
                  } else if (response.cancelled) {
                    console.log("Daily email cancelled by user");
                  }
                }
              );
            };
            tryInject(10);
            chrome.runtime.onMessage.removeListener(listenForReady);
          }
        };
        chrome.runtime.onMessage.addListener(listenForReady);
      });
    }
  );
}

function buildEmailHtml(mainTabs) {
  if (!mainTabs || mainTabs.length === 0) {
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
    .task-item-checkbox-symbol {
      margin-right: 10px;
      font-size: 18px;
      line-height: 1.2;
      color: #555;
    }
    .task-item.completed .task-item-content { 
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
    hr {
      border: none;
      border-top: 1px solid #e0e0e0;
      margin: 30px 0;
    }
    .note-content div, .note-content p {
        line-height: 1.6;
    }
  `;

  const formatNoteContentForEmail = (htmlString) => {
    if (!htmlString) return "";
    let processedHtml = htmlString;

    processedHtml = processedHtml.replace(
      /<div class="task-item completed"[^>]*>.*?<div class="task-item-content"[^>]*>(.*?)<\/div>.*?<\/div>/gis,
      '<div class="task-item completed"><span class="task-item-checkbox-symbol">☑</span><div class="task-item-content">$1</div></div>'
    );
    processedHtml = processedHtml.replace(
      /<div class="task-item"[^>]*>.*?<div class="task-item-content"[^>]*>(.*?)<\/div>.*?<\/div>/gis,
      '<div class="task-item"><span class="task-item-checkbox-symbol">☐</span><div class="task-item-content">$1</div></div>'
    );

    processedHtml = processedHtml.replace(/ contenteditable="true"/g, "");

    return `<div class="note-content">${processedHtml}</div>`;
  };

  const body = mainTabs
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
}
