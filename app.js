// Chrome Notes Web App - Complete Implementation
class ChromeNotesWebApp {
  constructor() {
    this.user = null;
    this.state = {
      mainTabs: [],
      activeMainTabId: null,
      activeSubTabId: null,
      completedTasks: [],
      hideCompleted: false,
      lastSelectedSubTabs: {},
    };
    this.debounceTimer = null;
    this.undoStack = [];
    this.redoStack = [];
    this.MAX_UNDO_HISTORY = 20;

    this.init();
  }

  async init() {
    // Show loading screen
    this.showScreen("loading-screen");

    // Wait for Firebase to load
    await this.waitForFirebase();

    // Set up API endpoints for Chrome extension
    this.setupAPIEndpoints();

    // Set up auth state listener
    window.firebaseOnAuthStateChanged(window.firebaseAuth, (user) => {
      this.user = user;
      if (user) {
        this.showMainApp();
        this.loadDataFromCloud();
      } else {
        this.showSignInScreen();
      }
    });
  }

  setupAPIEndpoints() {
    // Store auth data for Chrome extension to access
    if (this.user) {
      localStorage.setItem('firebase_auth_data', JSON.stringify({
        user: this.user,
        expiresAt: Date.now() + (24 * 60 * 60 * 1000) // 24 hours
      }));
    }

    // Check for Chrome extension data every 5 seconds
    setInterval(() => {
      this.checkForExtensionData();
    }, 5000);
  }

  checkForExtensionData() {
    // Check if Chrome extension has data to sync
    const extensionData = localStorage.getItem('chrome_extension_data');
    if (extensionData && this.user) {
      try {
        const parsed = JSON.parse(extensionData);
        if (parsed.user === this.user.email) {
          console.log("Syncing data from Chrome extension");
          this.syncDataToCloud(parsed.data);
          localStorage.removeItem('chrome_extension_data');
        }
      } catch (e) {
        console.log("Invalid extension data");
      }
    }
  }

  async waitForFirebase() {
    return new Promise((resolve) => {
      const checkFirebase = () => {
        if (window.firebaseAuth && window.firebaseDb) {
          resolve();
        } else {
          setTimeout(checkFirebase, 100);
        }
      };
      checkFirebase();
    });
  }

  showScreen(screenId) {
    const screens = ["loading-screen", "signin-screen", "main-app"];
    screens.forEach((id) => {
      const screen = document.getElementById(id);
      if (screen) {
        screen.style.display = id === screenId ? "block" : "none";
      }
    });
  }

  showSignInScreen() {
    this.showScreen("signin-screen");

    const signinBtn = document.getElementById("signin-btn");
    if (signinBtn) {
      signinBtn.onclick = () => this.signIn();
    }
  }

  showMainApp() {
    this.showScreen("main-app");
    this.setupEventListeners();
    this.render();
  }

  async signIn() {
    try {
      const result = await window.firebaseSignIn(
        window.firebaseAuth,
        window.firebaseGoogleProvider
      );
      this.user = result.user;
      console.log("Signed in successfully:", this.user.email);
    } catch (error) {
      console.error("Sign in failed:", error);
      this.showNotification("Sign in failed. Please try again.");
    }
  }

  async signOut() {
    try {
      await window.firebaseSignOut(window.firebaseAuth);
      this.user = null;
      console.log("Signed out successfully");
    } catch (error) {
      console.error("Sign out failed:", error);
    }
  }

  async loadDataFromCloud() {
    if (!this.user) return;

    try {
      const userDocRef = window.firebaseDoc(
        window.firebaseDb,
        "users",
        this.user.uid
      );
      const docSnap = await window.firebaseGetDoc(userDocRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.notesData) {
          this.state = { ...this.state, ...data.notesData };
          this.render();
          this.showNotification("Notes loaded from cloud");
        }
      } else {
        // Create default structure if no data exists
        this.createDefaultStructure();
        this.render();
      }

      // Set up real-time sync
      this.setupRealtimeSync();
    } catch (error) {
      console.error("Failed to load data from cloud:", error);
      this.createDefaultStructure();
      this.render();
    }
  }

  createDefaultStructure() {
    const firstMainTab = {
      id: Date.now(),
      name: "Notes",
      subTabs: [{ id: Date.now() + 1, name: "Main", content: "" }],
    };
    this.state = {
      mainTabs: [firstMainTab],
      activeMainTabId: firstMainTab.id,
      activeSubTabId: firstMainTab.subTabs[0].id,
      completedTasks: [],
      hideCompleted: false,
      lastSelectedSubTabs: {},
    };
  }

  setupRealtimeSync() {
    if (!this.user) return;

    const userDocRef = window.firebaseDoc(
      window.firebaseDb,
      "users",
      this.user.uid
    );

    window.firebaseOnSnapshot(userDocRef, (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        const cloudData = data.notesData;

        if (cloudData && this.isCloudDataNewer(cloudData)) {
          console.log("Real-time sync: Updating from cloud");
          this.mergeCloudData(cloudData);
        }
      }
    });
  }

  isCloudDataNewer(cloudData) {
    const cloudTimestamp = new Date(cloudData.lastUpdated || 0);
    const localTimestamp = new Date(this.state.lastUpdated || 0);
    return cloudTimestamp > localTimestamp;
  }

  mergeCloudData(cloudData) {
    if (cloudData.mainTabs) {
      this.state = { ...this.state, ...cloudData };
      this.render();
      this.showNotification("Notes updated from cloud");
    }
  }

  async saveDataToCloud() {
    if (!this.user) return;

    try {
      const userDocRef = window.firebaseDoc(
        window.firebaseDb,
        "users",
        this.user.uid
      );
      await window.firebaseSetDoc(
        userDocRef,
        {
          notesData: {
            ...this.state,
            lastUpdated: new Date().toISOString(),
          },
          email: this.user.email,
        },
        { merge: true }
      );

      console.log("Data synced to cloud successfully");
    } catch (error) {
      console.error("Cloud sync failed:", error);
    }
  }

  saveData() {
    const activeTab = this.getActiveTab();
    const notebook = document.getElementById("notebook");

    if (activeTab && notebook && notebook.isContentEditable) {
      activeTab.content = notebook.innerHTML;
    }

    clearTimeout(this.debounceTimer);
    this.debounceTimer = setTimeout(async () => {
      await this.saveDataToCloud();
    }, 300);
  }

  getActiveTab() {
    if (!this.state.activeMainTabId || !this.state.activeSubTabId) return null;

    const mainTab = this.state.mainTabs.find(
      (tab) => tab.id === this.state.activeMainTabId
    );
    if (!mainTab) return null;

    return mainTab.subTabs.find(
      (subTab) => subTab.id === this.state.activeSubTabId
    );
  }

  render() {
    this.renderMainTabs();
    this.renderSubTabs();
    this.renderNotebook();
    this.updateUiState();
  }

  renderMainTabs() {
    const mainTabsList = document.getElementById("main-tabs-list");
    if (!mainTabsList) return;

    mainTabsList.innerHTML = "";

    this.state.mainTabs.forEach((tab) => {
      mainTabsList.appendChild(this.createMainTabElement(tab));
    });

    const activeMainTabEl = mainTabsList.querySelector(
      `[data-main-tab-id="${this.state.activeMainTabId}"]`
    );
    if (activeMainTabEl) activeMainTabEl.classList.add("active");
  }

  renderSubTabs() {
    const subTabsContainer = document.getElementById("sub-tabs-container");
    const subTabsList = document.getElementById("sub-tabs-list");

    if (!this.state.activeMainTabId) {
      subTabsContainer.classList.add("hidden");
      return;
    }

    const activeMainTab = this.state.mainTabs.find(
      (tab) => tab.id === this.state.activeMainTabId
    );
    if (!activeMainTab) {
      subTabsContainer.classList.add("hidden");
      return;
    }

    subTabsContainer.classList.remove("hidden");
    subTabsList.innerHTML = "";

    activeMainTab.subTabs.forEach((subTab) => {
      subTabsList.appendChild(this.createSubTabElement(subTab));
    });

    // Add Done tab
    subTabsList.appendChild(
      this.createSubTabElement({ id: "done-log", name: "Done" }, true)
    );

    const activeSubTabEl = subTabsList.querySelector(
      `[data-sub-tab-id="${this.state.activeSubTabId}"]`
    );
    if (activeSubTabEl) activeSubTabEl.classList.add("active");
  }

  renderNotebook() {
    const notebook = document.getElementById("notebook");
    if (!notebook) return;

    const activeTab = this.getActiveTab();
    if (activeTab) {
      notebook.innerHTML = activeTab.content;
    } else {
      notebook.innerHTML = "";
    }
    notebook.contentEditable = "true";
    notebook.classList.remove("notebook-readonly");
  }

  createMainTabElement(tab) {
    const el = document.createElement("div");
    el.className = "main-tab";
    el.dataset.mainTabId = tab.id;
    el.innerHTML = `<span class="tab-name">${tab.name}</span><button class="main-tab-delete-btn">×</button>`;

    el.addEventListener("click", (e) => {
      if (e.target.classList.contains("main-tab-delete-btn")) {
        this.deleteMainTab(tab.id);
      } else {
        this.switchMainTab(tab.id);
      }
    });

    el.querySelector(".tab-name").addEventListener("dblclick", (e) =>
      this.makeTabEditable(e.currentTarget, "main")
    );

    return el;
  }

  createSubTabElement(subTab, isSpecial = false) {
    const el = document.createElement("div");
    el.className = `sub-tab ${isSpecial ? "special-tab" : ""}`;
    el.dataset.subTabId = subTab.id;
    el.innerHTML = `<span class="tab-name">${subTab.name}</span>${
      !isSpecial ? '<button class="sub-tab-delete-btn">×</button>' : ""
    }`;

    el.addEventListener("click", (e) => {
      if (e.target.classList.contains("sub-tab-delete-btn")) {
        this.deleteSubTab(subTab.id);
      } else {
        this.switchSubTab(subTab.id);
      }
    });

    if (!isSpecial) {
      el.querySelector(".tab-name").addEventListener("dblclick", (e) =>
        this.makeTabEditable(e.currentTarget, "sub")
      );
    }

    return el;
  }

  makeTabEditable(nameEl, tabType) {
    nameEl.contentEditable = "true";
    nameEl.focus();
    const onBlur = () => {
      nameEl.contentEditable = "false";
      const newName = nameEl.textContent.trim() || "Untitled";

      if (tabType === "main") {
        const tabId = Number(nameEl.closest(".main-tab").dataset.mainTabId);
        const tabToRename = this.state.mainTabs.find((t) => t.id === tabId);
        if (tabToRename) {
          tabToRename.name = newName;
          nameEl.textContent = newName;
          this.saveData();
        }
      } else if (tabType === "sub") {
        const subTabId = nameEl.closest(".sub-tab").dataset.subTabId;
        const subTabIdNum =
          subTabId === "done-log" ? "done-log" : Number(subTabId);

        const activeMainTab = this.state.mainTabs.find(
          (tab) => tab.id === this.state.activeMainTabId
        );
        if (activeMainTab) {
          const subTabToRename = activeMainTab.subTabs.find(
            (t) => t.id === subTabIdNum
          );
          if (subTabToRename) {
            subTabToRename.name = newName;
            nameEl.textContent = newName;
            this.saveData();
          }
        }
      }
    };
    nameEl.addEventListener("blur", onBlur, { once: true });
    nameEl.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        nameEl.blur();
      }
    });
  }

  switchMainTab(mainTabId) {
    if (this.state.activeMainTabId === mainTabId) return;

    // Save the current sub-tab selection for the current main tab
    if (this.state.activeMainTabId && this.state.activeSubTabId) {
      this.state.lastSelectedSubTabs[this.state.activeMainTabId] =
        this.state.activeSubTabId;
    }

    this.state.activeMainTabId = mainTabId;

    // Try to restore the last selected sub-tab for this main tab
    const mainTab = this.state.mainTabs.find((tab) => tab.id === mainTabId);
    if (mainTab && mainTab.subTabs.length > 0) {
      const lastSelectedSubTabId = this.state.lastSelectedSubTabs[mainTabId];
      const subTabExists = mainTab.subTabs.find(
        (subTab) => subTab.id === lastSelectedSubTabId
      );

      if (subTabExists) {
        this.state.activeSubTabId = lastSelectedSubTabId;
      } else {
        this.state.activeSubTabId = mainTab.subTabs[0].id;
      }
    }

    this.render();
    this.saveData();
  }

  switchSubTab(subTabId) {
    const subTabIdNum = subTabId === "done-log" ? "done-log" : Number(subTabId);
    if (this.state.activeSubTabId === subTabIdNum) return;

    this.state.activeSubTabId = subTabIdNum;
    this.render();
    this.saveData();
  }

  addMainTab() {
    const newMainTab = {
      id: Date.now(),
      name: "New Tab",
      subTabs: [{ id: Date.now() + 1, name: "Main", content: "" }],
    };
    this.state.mainTabs.push(newMainTab);
    this.switchMainTab(newMainTab.id);
  }

  addSubTab() {
    if (!this.state.activeMainTabId) return;

    const activeMainTab = this.state.mainTabs.find(
      (tab) => tab.id === this.state.activeMainTabId
    );
    if (!activeMainTab) return;

    const newSubTab = { id: Date.now(), name: "New Sub-tab", content: "" };
    activeMainTab.subTabs.push(newSubTab);
    this.switchSubTab(newSubTab.id);
  }

  deleteMainTab(mainTabId) {
    if (this.state.mainTabs.length <= 1) return;

    this.state.mainTabs = this.state.mainTabs.filter(
      (tab) => tab.id !== mainTabId
    );

    if (this.state.activeMainTabId === mainTabId) {
      this.state.activeMainTabId = this.state.mainTabs[0].id;
      this.state.activeSubTabId = this.state.mainTabs[0].subTabs[0].id;
    }

    this.render();
    this.saveData();
  }

  deleteSubTab(subTabId) {
    const activeMainTab = this.state.mainTabs.find(
      (tab) => tab.id === this.state.activeMainTabId
    );
    if (!activeMainTab || activeMainTab.subTabs.length <= 1) return;

    activeMainTab.subTabs = activeMainTab.subTabs.filter(
      (subTab) => subTab.id !== subTabId
    );

    if (this.state.activeSubTabId === subTabId) {
      this.state.activeSubTabId = activeMainTab.subTabs[0].id;
    }

    this.render();
    this.saveData();
  }

  updateUiState() {
    const appContainer = document.getElementById("app-container");
    if (appContainer) {
      appContainer.classList.toggle("hide-completed", this.state.hideCompleted);
    }

    const eyeOpenIcon = document.getElementById("eye-open-icon");
    const eyeClosedIcon = document.getElementById("eye-closed-icon");

    if (eyeOpenIcon) {
      eyeOpenIcon.style.display = this.state.hideCompleted ? "none" : "block";
    }
    if (eyeClosedIcon) {
      eyeClosedIcon.style.display = this.state.hideCompleted ? "block" : "none";
    }
  }

  setupEventListeners() {
    // Tab management
    document
      .getElementById("add-main-tab-btn")
      ?.addEventListener("click", () => this.addMainTab());
    document
      .getElementById("add-sub-tab-btn")
      ?.addEventListener("click", () => this.addSubTab());

    // Toolbar buttons
    document
      .getElementById("bold-btn")
      ?.addEventListener("click", () => this.toggleFormat("bold"));
    document
      .getElementById("italic-btn")
      ?.addEventListener("click", () => this.toggleFormat("italic"));
    document
      .getElementById("strikethrough-btn")
      ?.addEventListener("click", () => this.toggleFormat("strikeThrough"));
    document
      .getElementById("h1-btn")
      ?.addEventListener("click", () => this.toggleBlockFormat("h1"));
    document
      .getElementById("h2-btn")
      ?.addEventListener("click", () => this.toggleBlockFormat("h2"));
    document
      .getElementById("bullet-list-btn")
      ?.addEventListener("click", () => this.toggleList("ul"));
    document
      .getElementById("todo-btn")
      ?.addEventListener("click", () => this.toggleTodoItem());
    document
      .getElementById("blockquote-btn")
      ?.addEventListener("click", () => this.toggleBlockFormat("blockquote"));
    document
      .getElementById("undo-btn")
      ?.addEventListener("click", () => this.undo());
    document
      .getElementById("redo-btn")
      ?.addEventListener("click", () => this.redo());
    document
      .getElementById("color-picker")
      ?.addEventListener("input", (e) =>
        this.toggleFormat("foreColor", e.target.value)
      );
    document
      .getElementById("copy-all-btn")
      ?.addEventListener("click", () => this.copyAllTabs());
    document
      .getElementById("toggle-completed-btn")
      ?.addEventListener("click", () => {
        this.state.hideCompleted = !this.state.hideCompleted;
        this.updateUiState();
        this.saveData();
      });
    document
      .getElementById("sync-status-btn")
      ?.addEventListener("click", () => this.signOut());

    // Notebook events
    const notebook = document.getElementById("notebook");
    if (notebook) {
      notebook.addEventListener("input", () => {
        this.saveUndoState();
        this.saveData();
      });
      notebook.addEventListener("keydown", (e) => this.handleKeydown(e));
      notebook.addEventListener("paste", (e) => this.handlePaste(e));
      notebook.addEventListener("click", (e) => this.handleNotebookClick(e));
    }
  }

  // Formatting functions
  toggleFormat(command, value = null) {
    if (
      document.queryCommandSupported &&
      document.queryCommandSupported(command)
    ) {
      document.execCommand(command, false, value);
    }
  }

  toggleBlockFormat(tagName) {
    document.execCommand("formatBlock", false, tagName);
  }

  toggleList(listType) {
    const command =
      listType === "ul" ? "insertUnorderedList" : "insertOrderedList";
    document.execCommand(command);
  }

  toggleTodoItem() {
    document.execCommand(
      "insertHTML",
      false,
      '<div class="task-item"><input type="checkbox" class="task-item-checkbox"><div class="task-item-content" contenteditable="true">&#8203;</div></div>'
    );
  }

  handleKeydown(e) {
    if (e.ctrlKey || e.metaKey) {
      if (e.key === "z" && !e.shiftKey) {
        e.preventDefault();
        this.undo();
        return;
      } else if (e.key === "y" || (e.key === "z" && e.shiftKey)) {
        e.preventDefault();
        this.redo();
        return;
      }
    }
  }

  handlePaste(e) {
    e.preventDefault();
    const text = e.clipboardData.getData("text/plain");
    document.execCommand("insertText", false, text);
  }

  handleNotebookClick(e) {
    if (e.target.matches(".task-item-checkbox")) {
      const taskItem = e.target.closest(".task-item");
      const isChecked = e.target.checked;
      taskItem.classList.toggle("completed", isChecked);
      this.saveData();
    }
  }

  copyAllTabs() {
    const allContent = this.formatTabsForCopy(this.state.mainTabs);
    navigator.clipboard.writeText(allContent);
    this.showNotification("All tabs copied to clipboard");
  }

  formatTabsForCopy(mainTabs) {
    if (!mainTabs || mainTabs.length === 0) {
      return "No tabs found.";
    }

    return mainTabs
      .map((mainTab, mainIndex) => {
        const subTabsContent = mainTab.subTabs
          .map((subTab, subIndex) => {
            const formattedContent = this.formatContentForCopy(subTab.content);
            const subTabHeader = `## ${subIndex + 1}. ${subTab.name}`;
            return `${subTabHeader}\n\n${formattedContent}`;
          })
          .join("\n\n");

        const mainTabHeader = `# ${mainIndex + 1}. ${mainTab.name}`;
        return `${mainTabHeader}\n\n${subTabsContent}`;
      })
      .join("\n\n" + "=".repeat(50) + "\n\n");
  }

  formatContentForCopy(htmlContent) {
    if (!htmlContent) return "";

    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = htmlContent;

    let formattedText = "";

    function processNode(node, depth = 0) {
      const indent = "  ".repeat(depth);

      if (node.nodeType === Node.TEXT_NODE) {
        const text = node.textContent.trim();
        if (text) {
          formattedText += text;
        }
        return;
      }

      if (node.nodeType === Node.ELEMENT_NODE) {
        const tagName = node.tagName.toLowerCase();

        switch (tagName) {
          case "div":
            if (node.classList.contains("task-item")) {
              const checkbox = node.querySelector(".task-item-checkbox");
              const content = node.querySelector(".task-item-content");
              const isCompleted = checkbox && checkbox.checked;
              const taskText = content ? content.textContent.trim() : "";

              if (taskText) {
                formattedText += `${indent}${
                  isCompleted ? "☑" : "☐"
                } ${taskText}\n`;
              }
            } else {
              const children = Array.from(node.childNodes);
              children.forEach((child) => processNode(child, depth));
              if (children.length > 0) {
                formattedText += "\n";
              }
            }
            break;

          case "h1":
            formattedText += `\n${indent}# ${node.textContent.trim()}\n\n`;
            break;

          case "h2":
            formattedText += `\n${indent}## ${node.textContent.trim()}\n\n`;
            break;

          case "h3":
            formattedText += `\n${indent}### ${node.textContent.trim()}\n\n`;
            break;

          case "ul":
            const ulChildren = Array.from(node.children);
            ulChildren.forEach((child) => processNode(child, depth));
            formattedText += "\n";
            break;

          case "li":
            formattedText += `${indent}• ${node.textContent.trim()}\n`;
            break;

          case "ol":
            const olChildren = Array.from(node.children);
            olChildren.forEach((child, index) => {
              if (child.tagName.toLowerCase() === "li") {
                formattedText += `${indent}${
                  index + 1
                }. ${child.textContent.trim()}\n`;
              }
            });
            formattedText += "\n";
            break;

          case "blockquote":
            formattedText += `\n${indent}> ${node.textContent.trim()}\n\n`;
            break;

          case "strong":
          case "b":
            formattedText += `**${node.textContent.trim()}**`;
            break;

          case "em":
          case "i":
            formattedText += `*${node.textContent.trim()}*`;
            break;

          case "br":
            formattedText += "\n";
            break;

          default:
            const defaultChildren = Array.from(node.childNodes);
            defaultChildren.forEach((child) => processNode(child, depth));
            break;
        }
      }
    }

    Array.from(tempDiv.childNodes).forEach((node) => processNode(node));

    return formattedText
      .replace(/\n\s*\n\s*\n/g, "\n\n")
      .replace(/^\s+|\s+$/g, "")
      .trim();
  }

  // Undo/Redo functionality
  saveUndoState() {
    const activeTab = this.getActiveTab();
    if (!activeTab) return;

    const undoState = {
      content: activeTab.content,
      timestamp: Date.now(),
    };

    this.undoStack.push(undoState);
    if (this.undoStack.length > this.MAX_UNDO_HISTORY) {
      this.undoStack.shift();
    }

    this.redoStack = [];
    this.updateUndoRedoButtons();
  }

  undo() {
    if (this.undoStack.length === 0) return;

    const activeTab = this.getActiveTab();
    if (!activeTab) return;

    this.redoStack.push({
      content: activeTab.content,
      timestamp: Date.now(),
    });

    const previousState = this.undoStack.pop();
    activeTab.content = previousState.content;

    this.renderNotebook();
    this.updateUndoRedoButtons();
  }

  redo() {
    if (this.redoStack.length === 0) return;

    const activeTab = this.getActiveTab();
    if (!activeTab) return;

    this.undoStack.push({
      content: activeTab.content,
      timestamp: Date.now(),
    });

    const nextState = this.redoStack.pop();
    activeTab.content = nextState.content;

    this.renderNotebook();
    this.updateUndoRedoButtons();
  }

  updateUndoRedoButtons() {
    const undoBtn = document.getElementById("undo-btn");
    const redoBtn = document.getElementById("redo-btn");

    if (undoBtn) {
      undoBtn.disabled = this.undoStack.length === 0;
      undoBtn.style.opacity = this.undoStack.length === 0 ? "0.5" : "1";
    }

    if (redoBtn) {
      redoBtn.disabled = this.redoStack.length === 0;
      redoBtn.style.opacity = this.redoStack.length === 0 ? "0.5" : "1";
    }
  }

  showNotification(message) {
    const notification = document.createElement("div");
    notification.className = "notification";
    notification.textContent = message;
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: var(--accent-color);
      color: white;
      padding: 12px 20px;
      border-radius: 8px;
      font-size: 14px;
      z-index: 1000;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
      animation: slideIn 0.3s ease;
    `;

    document.body.appendChild(notification);

    setTimeout(() => {
      notification.remove();
    }, 3000);
  }
}

// Initialize the app when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  new ChromeNotesWebApp();
});
