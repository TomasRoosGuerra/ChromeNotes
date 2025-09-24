// Wait until Gmail Compose is available, then listen for a message to inject HTML.
(function () {
  function findActiveComposeEditable() {
    // Gmail compose uses div[aria-label="Message Body"] contenteditable
    const editors = document.querySelectorAll(
      'div[aria-label="Message Body"][contenteditable="true"]'
    );
    if (editors.length > 0) return editors[0];
    // Fallback: Gmail sometimes uses div[role=textbox]
    const fallbacks = document.querySelectorAll(
      'div[role="textbox"][g_editable="true"]'
    );
    return fallbacks.length ? fallbacks[0] : null;
  }

  function findSendButton() {
    // Look for Gmail's send button
    const sendButtons = document.querySelectorAll(
      'div[role="button"][aria-label*="Send"], div[role="button"][aria-label*="send"], div[data-tooltip*="Send"], div[data-tooltip*="send"]'
    );
    for (let btn of sendButtons) {
      if (
        btn.textContent.includes("Send") ||
        btn.getAttribute("aria-label")?.toLowerCase().includes("send")
      ) {
        return btn;
      }
    }
    return null;
  }

  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request && request.action === "injectEmailBody" && request.payload) {
      const editable = findActiveComposeEditable();
      if (editable) {
        // If autoPaste is enabled, use plain text instead of HTML
        if (request.payload.autoPaste && request.payload.plainText) {
          // Clear the editable first
          editable.innerHTML = "";

          // Insert plain text
          editable.textContent = request.payload.plainText;

          // Trigger input event to ensure Gmail recognizes the content
          const inputEvent = new Event("input", { bubbles: true });
          editable.dispatchEvent(inputEvent);
        } else if (request.payload.html) {
          editable.innerHTML = request.payload.html;
        }

        // If this is an auto-send (from alarm), show confirmation and auto-send
        if (request.payload.autoSend) {
          const confirmed = confirm(
            `Sidekick Notes: Send daily email to ${request.payload.to}?\n\nClick OK to send automatically, or Cancel to review first.`
          );
          if (confirmed) {
            setTimeout(() => {
              const sendBtn = findSendButton();
              if (sendBtn) {
                sendBtn.click();
                sendResponse({ ok: true, sent: true });
              } else {
                sendResponse({ ok: false, error: "send_button_not_found" });
              }
            }, 2000); // Wait 2 seconds for Gmail to process the content
          } else {
            sendResponse({ ok: true, sent: false, cancelled: true });
          }
        } else {
          sendResponse({ ok: true });
        }
      } else {
        sendResponse({ ok: false, error: "compose_not_found" });
      }
    }
  });

  // Notify the extension that we're ready to receive the HTML
  const notifyReady = () => {
    try {
      chrome.runtime.sendMessage("gmail_inject_ready");
    } catch (e) {
      // ignore
    }
  };

  if (
    document.readyState === "complete" ||
    document.readyState === "interactive"
  ) {
    notifyReady();
  } else {
    window.addEventListener("DOMContentLoaded", notifyReady, { once: true });
  }
})();
