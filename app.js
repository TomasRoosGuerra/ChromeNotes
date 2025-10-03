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
      scrollPositions: {}, // Store scroll positions for each tab
    };
    this.debounceTimer = null;
    this.undoStack = [];
    this.redoStack = [];
    this.MAX_UNDO_HISTORY = 20;

    // Drag and drop variables
    this.draggedElement = null;
    this.draggedIndex = -1;
    this.isDragging = false;

    // Swipe gesture variables
    this.swipeStartX = 0;
    this.swipeStartY = 0;
    this.swipeEndX = 0;
    this.swipeEndY = 0;
    this.isKeyboardOpen = false;
    this.isSwiping = false;

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
      this.updateUiState();
    });
  }

  setupAPIEndpoints() {
    // Store auth data for Chrome extension to access
    if (this.user) {
      localStorage.setItem(
        "firebase_auth_data",
        JSON.stringify({
          user: this.user,
          expiresAt: Date.now() + 24 * 60 * 60 * 1000, // 24 hours
        })
      );
    }

    // Check for Chrome extension data every 5 seconds
    setInterval(() => {
      this.checkForExtensionData();
    }, 5000);
  }

  checkForExtensionData() {
    // Check if Chrome extension has data to sync
    const extensionData = localStorage.getItem("chrome_extension_data");
    if (extensionData && this.user) {
      try {
        const parsed = JSON.parse(extensionData);
        if (parsed.user === this.user.email) {
          console.log("Syncing data from Chrome extension");
          this.syncDataToCloud(parsed.data);
          localStorage.removeItem("chrome_extension_data");
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

  // Popup menu functions
  togglePopupMenu(e) {
    e.stopPropagation();
    const menu = document.getElementById("more-options-menu");
    if (menu.style.display === "none" || !menu.style.display) {
      this.showPopupMenu();
    } else {
      this.hidePopupMenu();
    }
  }

  showPopupMenu() {
    const menu = document.getElementById("more-options-menu");
    const button = document.getElementById("more-options-btn");

    if (menu && button) {
      // Position the menu below the button
      const buttonRect = button.getBoundingClientRect();
      menu.style.display = "block";
      menu.style.top = `${buttonRect.bottom + window.scrollY}px`;
      menu.style.left = `${buttonRect.right - menu.offsetWidth}px`;
    }
  }

  hidePopupMenu() {
    const menu = document.getElementById("more-options-menu");
    if (menu) {
      menu.style.display = "none";
    }
  }

  handlePopupMenuAction(action) {
    switch (action) {
      case "import":
        console.log("Import button clicked!"); // Debug log
        this.importFromClipboard();
        break;
      case "copy-all":
        this.copyAllTabs();
        break;
      case "clean-all":
        this.cleanAllTabs();
        break;
      case "email-all":
        this.emailAllTabs();
        break;
      case "toggle-completed":
        this.state.hideCompleted = !this.state.hideCompleted;
        this.updateUiState();
        this.saveData();
        break;
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
      // Removed notification to prevent spam during editing
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

  // --- Drag and Drop Functionality ---
  addDragAndDropListeners(element, tabType) {
    element.addEventListener("dragstart", (e) => {
      this.isDragging = true;
      this.draggedElement = element;
      this.draggedIndex = this.getTabIndex(element, tabType);
      element.classList.add("dragging");
      e.dataTransfer.effectAllowed = "move";
      e.dataTransfer.setData("text/html", element.outerHTML);

      // Add visual feedback immediately
      element.style.opacity = "0.5";
      element.style.transform = "rotate(5deg)";
    });

    element.addEventListener("dragend", (e) => {
      element.classList.remove("dragging");
      element.style.opacity = "";
      element.style.transform = "";

      // Remove all drag-over classes
      const allTabs = document.querySelectorAll(
        tabType === "main" ? ".main-tab" : ".sub-tab"
      );
      allTabs.forEach((tab) => tab.classList.remove("drag-over"));
      this.draggedElement = null;
      this.draggedIndex = -1;

      // Reset dragging flag after a short delay to prevent click events
      setTimeout(() => {
        this.isDragging = false;
      }, 100);
    });

    element.addEventListener("dragover", (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = "move";
    });

    element.addEventListener("dragenter", (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (this.draggedElement && this.draggedElement !== element) {
        element.classList.add("drag-over");
        element.style.borderColor = "var(--accent-color)";
        element.style.backgroundColor = "rgba(59, 130, 246, 0.1)";
      }
    });

    element.addEventListener("dragleave", (e) => {
      // Only remove drag-over if we're actually leaving the tab element
      if (!element.contains(e.relatedTarget)) {
        element.classList.remove("drag-over");
        element.style.borderColor = "";
        element.style.backgroundColor = "";
      }
    });

    element.addEventListener("drop", (e) => {
      e.preventDefault();
      e.stopPropagation();
      element.classList.remove("drag-over");
      element.style.borderColor = "";
      element.style.backgroundColor = "";

      if (this.draggedElement && this.draggedElement !== element) {
        const dropIndex = this.getTabIndex(element, tabType);
        this.moveTab(this.draggedIndex, dropIndex, tabType);
      }
    });

    // Prevent click events during drag
    element.addEventListener("click", (e) => {
      if (this.isDragging) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }
    });

    // Add drag events to child elements to ensure the entire tab area is draggable
    const tabName = element.querySelector(".tab-name");
    const deleteBtn = element.querySelector(
      ".main-tab-delete-btn, .sub-tab-delete-btn"
    );

    if (tabName) {
      tabName.addEventListener("dragenter", (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (this.draggedElement && this.draggedElement !== element) {
          element.classList.add("drag-over");
          element.style.borderColor = "var(--accent-color)";
          element.style.backgroundColor = "rgba(59, 130, 246, 0.1)";
        }
      });

      tabName.addEventListener("dragleave", (e) => {
        if (!element.contains(e.relatedTarget)) {
          element.classList.remove("drag-over");
          element.style.borderColor = "";
          element.style.backgroundColor = "";
        }
      });

      tabName.addEventListener("drop", (e) => {
        e.preventDefault();
        e.stopPropagation();
        element.classList.remove("drag-over");
        element.style.borderColor = "";
        element.style.backgroundColor = "";

        if (this.draggedElement && this.draggedElement !== element) {
          const dropIndex = this.getTabIndex(element, tabType);
          this.moveTab(this.draggedIndex, dropIndex, tabType);
        }
      });
    }

    if (deleteBtn) {
      deleteBtn.addEventListener("dragenter", (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (this.draggedElement && this.draggedElement !== element) {
          element.classList.add("drag-over");
          element.style.borderColor = "var(--accent-color)";
          element.style.backgroundColor = "rgba(59, 130, 246, 0.1)";
        }
      });

      deleteBtn.addEventListener("dragleave", (e) => {
        if (!element.contains(e.relatedTarget)) {
          element.classList.remove("drag-over");
          element.style.borderColor = "";
          element.style.backgroundColor = "";
        }
      });

      deleteBtn.addEventListener("drop", (e) => {
        e.preventDefault();
        e.stopPropagation();
        element.classList.remove("drag-over");
        element.style.borderColor = "";
        element.style.backgroundColor = "";

        if (this.draggedElement && this.draggedElement !== element) {
          const dropIndex = this.getTabIndex(element, tabType);
          this.moveTab(this.draggedIndex, dropIndex, tabType);
        }
      });
    }
  }

  getTabIndex(element, tabType) {
    const container = tabType === "main" ? "#main-tabs-list" : "#sub-tabs-list";
    const tabs = Array.from(document.querySelectorAll(container + " > *"));
    return tabs.indexOf(element);
  }

  moveTab(fromIndex, toIndex, tabType) {
    if (fromIndex === toIndex) {
      return;
    }

    if (tabType === "main") {
      // Move main tab
      const tab = this.state.mainTabs[fromIndex];
      if (!tab) {
        return;
      }
      this.state.mainTabs.splice(fromIndex, 1);
      this.state.mainTabs.splice(toIndex, 0, tab);
    } else {
      // Move sub tab
      const activeMainTab = this.state.mainTabs.find(
        (tab) => tab.id === this.state.activeMainTabId
      );
      if (activeMainTab) {
        const subTab = activeMainTab.subTabs[fromIndex];
        if (!subTab) {
          return;
        }
        activeMainTab.subTabs.splice(fromIndex, 1);
        activeMainTab.subTabs.splice(toIndex, 0, subTab);
      }
    }

    this.saveData();
  }

  saveData() {
    const activeTab = this.getActiveTab();
    const notebook = document.getElementById("notebook");

    if (activeTab && notebook && notebook.isContentEditable) {
      // Only update content if it's actually different to prevent unnecessary changes
      const currentContent = notebook.innerHTML;
      if (activeTab.content !== currentContent) {
        activeTab.content = currentContent;
        console.log("Content saved for tab:", activeTab.name);
      }
    }

    // Save scroll position
    this.saveScrollPosition();

    clearTimeout(this.debounceTimer);
    this.debounceTimer = setTimeout(async () => {
      await this.saveDataToCloud();
    }, 1000); // Increased timeout to prevent interference with typing
  }

  saveScrollPosition() {
    const notebook = document.getElementById("notebook");
    if (notebook && this.state.activeMainTabId && this.state.activeSubTabId) {
      const tabKey = `${this.state.activeMainTabId}-${this.state.activeSubTabId}`;
      this.state.scrollPositions[tabKey] = {
        scrollTop: notebook.scrollTop,
        scrollLeft: notebook.scrollLeft,
      };
    }
  }

  restoreScrollPosition() {
    const notebook = document.getElementById("notebook");
    if (notebook && this.state.activeMainTabId && this.state.activeSubTabId) {
      const tabKey = `${this.state.activeMainTabId}-${this.state.activeSubTabId}`;
      const scrollPos = this.state.scrollPositions[tabKey];
      if (scrollPos) {
        notebook.scrollTop = scrollPos.scrollTop;
        notebook.scrollLeft = scrollPos.scrollLeft;
      }
    }
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
    const activeTab = this.getActiveTab();
    const notebook = document.getElementById("notebook");
    if (!notebook) return;

    // Store current scroll position
    const currentScrollTop = notebook.scrollTop;
    const currentScrollLeft = notebook.scrollLeft;

    // Only update content if it's actually different to prevent unnecessary clearing
    const currentContent = notebook.innerHTML;
    const newContent = activeTab && activeTab.content ? activeTab.content : "";

    if (currentContent !== newContent) {
      // Save cursor position if possible
      const selection = window.getSelection();
      let cursorPosition = null;
      if (selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        cursorPosition = {
          startOffset: range.startOffset,
          endOffset: range.endOffset,
          startContainer: range.startContainer,
          endContainer: range.endContainer,
        };
      }

      notebook.innerHTML = newContent;

      // Restore scroll position
      notebook.scrollTop = currentScrollTop;
      notebook.scrollLeft = currentScrollLeft;

      // Restore cursor position if possible
      if (
        cursorPosition &&
        cursorPosition.startContainer &&
        cursorPosition.startContainer.parentNode
      ) {
        try {
          const newRange = document.createRange();
          newRange.setStart(
            cursorPosition.startContainer,
            cursorPosition.startOffset
          );
          newRange.setEnd(
            cursorPosition.endContainer,
            cursorPosition.endOffset
          );
          selection.removeAllRanges();
          selection.addRange(newRange);
        } catch (e) {
          // If cursor restoration fails, just focus the notebook
          notebook.focus();
        }
      }
    }

    notebook.contentEditable = "true";
    notebook.classList.remove("notebook-readonly");

    // Enhanced auto-focus with smooth behavior
    setTimeout(() => {
      if (!document.activeElement || document.activeElement === document.body) {
        notebook.focus();
        this.scrollToCursor();
      }
      // Restore scroll position after content is loaded
      this.restoreScrollPosition();
    }, 50); // Reduced timeout to prevent cursor interference
  }

  createMainTabElement(tab) {
    const el = document.createElement("div");
    el.className = "main-tab";
    el.dataset.mainTabId = tab.id;
    el.draggable = true;
    el.innerHTML = `<span class="tab-name">${tab.name}</span><button class="main-tab-delete-btn">×</button>`;

    // Add drag and drop listeners
    this.addDragAndDropListeners(el, "main");

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
    el.draggable = !isSpecial; // Only allow dragging for non-special tabs
    el.innerHTML = `<span class="tab-name">${subTab.name}</span>${
      !isSpecial ? '<button class="sub-tab-delete-btn">×</button>' : ""
    }`;

    // Add drag and drop listeners for non-special tabs
    if (!isSpecial) {
      this.addDragAndDropListeners(el, "sub");
    }

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

    // Select all text for quick overwrite
    setTimeout(() => {
      const range = document.createRange();
      range.selectNodeContents(nameEl);
      const selection = window.getSelection();
      selection.removeAllRanges();
      selection.addRange(range);
    }, 10);

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

    // Update sync button visibility
    const signinBtn = document.getElementById("sync-signin-btn");
    const signoutBtn = document.getElementById("sign-out-btn");

    if (signinBtn && signoutBtn) {
      if (this.user) {
        signinBtn.style.display = "none";
        signoutBtn.style.display = "block";
      } else {
        signinBtn.style.display = "block";
        signoutBtn.style.display = "none";
      }
    }

    // Update popup menu eye icon
    const eyeOpenIconMenu = document.getElementById("eye-open-icon-menu");
    if (eyeOpenIconMenu) {
      // Update the eye icon in the popup menu
      const eyeIcon = eyeOpenIconMenu.querySelector("path");
      if (eyeIcon) {
        if (this.state.hideCompleted) {
          // Show closed eye icon
          eyeIcon.setAttribute(
            "d",
            "M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"
          );
          eyeOpenIconMenu.innerHTML = `
            <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"></path>
            <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"></path>
            <line x1="2" y1="2" x2="22" y2="22"></line>
          `;
        } else {
          // Show open eye icon
          eyeOpenIconMenu.innerHTML = `
            <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"></path>
            <circle cx="12" cy="12" r="3"></circle>
          `;
        }
      }
    }
  }

  setupEventListeners() {
    // Swipe gesture listeners
    this.setupSwipeGestures();

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
    // Old button handlers removed - now in popup menu
    document
      .getElementById("sync-signin-btn")
      ?.addEventListener("click", () => this.signIn());
    // sync-status-btn removed
    document
      .getElementById("sign-out-btn")
      ?.addEventListener("click", () => this.signOut());

    // Popup menu functionality
    document
      .getElementById("more-options-btn")
      ?.addEventListener("click", (e) => this.togglePopupMenu(e));

    // Popup menu item handlers
    document.addEventListener("click", (e) => {
      if (e.target.closest(".popup-menu-item")) {
        const action = e.target.closest(".popup-menu-item").dataset.action;
        this.handlePopupMenuAction(action);
        this.hidePopupMenu();
      } else if (
        !e.target.closest("#more-options-menu") &&
        !e.target.closest("#more-options-btn")
      ) {
        this.hidePopupMenu();
      }
    });

    // Notebook events
    const notebook = document.getElementById("notebook");
    // Mobile-specific fixes for contenteditable scrolling
    if (notebook) {
      notebook.addEventListener("focus", (e) => {
        // Prevent mobile viewport zoom and scroll issues
        if (window.innerWidth <= 768) {
          // Prevent zoom on focus
          const viewport = document.querySelector('meta[name="viewport"]');
          if (viewport) {
            viewport.setAttribute(
              "content",
              "width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no"
            );
          }

          // Prevent unwanted scrolling
          setTimeout(() => {
            window.scrollTo(0, 0);
          }, 100);
        }
      });

      notebook.addEventListener("blur", (e) => {
        // Restore normal viewport behavior when not focused
        if (window.innerWidth <= 768) {
          const viewport = document.querySelector('meta[name="viewport"]');
          if (viewport) {
            viewport.setAttribute(
              "content",
              "width=device-width, initial-scale=1.0"
            );
          }
        }
      });

      notebook.addEventListener("input", () => {
        this.saveUndoState();
        this.saveData();
        this.detectAndConvertURLs();
      });
      notebook.addEventListener("keydown", (e) => this.handleKeydown(e));
      notebook.addEventListener("paste", (e) => this.handlePaste(e));
      notebook.addEventListener("click", (e) => this.handleNotebookClick(e));

      // Detect keyboard visibility on mobile
      notebook.addEventListener("focus", () => {
        this.isKeyboardOpen = true;
      });

      notebook.addEventListener("blur", () => {
        setTimeout(() => {
          this.isKeyboardOpen = false;
        }, 100);
        this.detectAndConvertURLs();
      });
    }
  }

  // Formatting functions - moved to avoid duplication

  handleKeydown(e) {
    // Handle undo/redo shortcuts
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

    // Handle markdown shortcuts on space - works on ANY row
    if (e.key === " ") {
      if (this.handleMarkdownShortcuts(e)) return;
      // Trigger URL detection on space
      setTimeout(() => this.detectAndConvertURLs(), 100);
    }

    // Improved Enter key handling
    if (e.key === "Enter") {
      if (this.handleEnterKey(e)) return;
    }

    // Handle arrow key navigation
    if (e.key === "ArrowUp" || e.key === "ArrowDown") {
      if (this.handleArrowNavigation(e)) return;
    }

    // Better Tab handling for indentation
    if (e.key === "Tab") {
      if (this.handleTabIndentation(e)) return;
    }

    // Backspace handling - removes empty bullets/checkboxes
    if (e.key === "Backspace") {
      if (this.handleBackspaceKey(e)) return;
    }

    // Enhanced cursor management - smooth scroll to cursor (only when needed)
    setTimeout(() => this.scrollToCursorIfNeeded(), 10);
  }

  handleArrowNavigation(e) {
    const selection = window.getSelection();
    if (!selection.rangeCount) return false;

    const element =
      selection.anchorNode.nodeType === Node.TEXT_NODE
        ? selection.anchorNode.parentElement
        : selection.anchorNode;

    // Check if we're in a checkbox
    const taskItem = element.closest(".task-item");
    if (taskItem) {
      const allTaskItems = Array.from(document.querySelectorAll(".task-item"));
      const currentIndex = allTaskItems.indexOf(taskItem);

      if (e.key === "ArrowUp" && currentIndex > 0) {
        e.preventDefault();
        const prevTaskItem = allTaskItems[currentIndex - 1];
        const prevContentDiv = prevTaskItem.querySelector(".task-item-content");
        this.placeCursorInElement(prevContentDiv, true);
        return true;
      } else if (
        e.key === "ArrowDown" &&
        currentIndex < allTaskItems.length - 1
      ) {
        e.preventDefault();
        const nextTaskItem = allTaskItems[currentIndex + 1];
        const nextContentDiv = nextTaskItem.querySelector(".task-item-content");
        this.placeCursorInElement(nextContentDiv, true);
        return true;
      }
    }

    return false;
  }

  handleTabIndentation(e) {
    const selection = window.getSelection();
    if (!selection.rangeCount) return false;

    const element =
      selection.anchorNode.nodeType === Node.TEXT_NODE
        ? selection.anchorNode.parentElement
        : selection.anchorNode;

    // Check if we're in a checkbox
    const taskItem = element.closest(".task-item");
    if (taskItem) {
      e.preventDefault();

      if (e.shiftKey) {
        // Outdent (move left)
        this.outdentTaskItem(taskItem);
      } else {
        // Indent (move right)
        this.indentTaskItem(taskItem);
      }

      this.saveUndoState();
      this.saveData();
      return true;
    }

    // Handle blockquote reversion with Shift+Tab
    const blockquote = element.closest("blockquote");
    if (blockquote && e.shiftKey) {
      e.preventDefault();
      this.revertBlockquote(blockquote);
      this.saveUndoState();
      this.saveData();
      return true;
    }

    // Handle regular blockquote indentation with Tab
    if (blockquote && !e.shiftKey) {
      e.preventDefault();
      // Allow normal blockquote behavior or add custom indentation
      return true;
    }

    return false;
  }

  revertBlockquote(blockquote) {
    // Convert blockquote back to regular div
    const content = blockquote.innerHTML;
    const div = document.createElement("div");
    div.innerHTML = content;

    // Replace blockquote with div
    blockquote.parentNode.replaceChild(div, blockquote);

    // Place cursor in the new div
    this.placeCursorInElement(div, true);
  }

  indentTaskItem(taskItem) {
    const currentLevel = parseInt(taskItem.dataset.level || "0");
    const maxLevel = 5; // Maximum indentation level

    if (currentLevel < maxLevel) {
      taskItem.dataset.level = currentLevel + 1;
      this.updateTaskItemIndentation(taskItem);
    }
  }

  outdentTaskItem(taskItem) {
    const currentLevel = parseInt(taskItem.dataset.level || "0");

    if (currentLevel > 0) {
      taskItem.dataset.level = currentLevel - 1;
      this.updateTaskItemIndentation(taskItem);
    }
  }

  updateTaskItemIndentation(taskItem) {
    const level = parseInt(taskItem.dataset.level || "0");
    const indentPixels = level * 24; // 24px per level

    // Only set padding on the task item, not on the checkbox
    taskItem.style.paddingLeft = `${indentPixels}px`;

    // Reset checkbox margin to prevent double indentation
    const checkbox = taskItem.querySelector(".task-item-checkbox");
    if (checkbox) {
      checkbox.style.marginLeft = "0px";
    }
  }

  handleMarkdownShortcuts(e) {
    const selection = window.getSelection();
    if (!selection.rangeCount) return false;

    const range = selection.getRangeAt(0);
    if (!range.collapsed) return false;

    let node = range.startContainer;
    if (node.nodeType !== Node.TEXT_NODE) return false;

    const textContent = node.textContent.substring(0, range.startOffset);
    const parentElement = node.parentElement;

    const shortcuts = {
      "-": () => this.toggleList("ul"),
      "1.": () => this.toggleList("ol"),
      ">": () => this.toggleBlockFormat("blockquote"),
      "#": () => this.toggleBlockFormat("h1"),
      "##": () => this.toggleBlockFormat("h2"),
      "###": () => this.toggleBlockFormat("h3"),
      "-.": () => this.toggleTodoItem(),
    };

    const handler = shortcuts[textContent.trim()];
    if (handler && parentElement.tagName === "DIV") {
      e.preventDefault();

      // Clear the shortcut text
      node.textContent = node.textContent.substring(range.startOffset);

      // Apply the format
      handler();

      // Ensure cursor is properly positioned after formatting
      setTimeout(() => {
        const newRange = document.createRange();
        const newSelection = window.getSelection();
        newRange.setStart(node, 0);
        newRange.collapse(true);
        newSelection.removeAllRanges();
        newSelection.addRange(newRange);
      }, 10);

      return true;
    }

    return false;
  }

  handleEnterKey(e) {
    const selection = window.getSelection();
    if (!selection.rangeCount) return false;

    const element =
      selection.anchorNode.nodeType === Node.TEXT_NODE
        ? selection.anchorNode.parentElement
        : selection.anchorNode;

    // Handle Enter in todo items - let the todo handler take care of it
    const taskItem = element.closest(".task-item");
    if (taskItem) {
      // The todo keydown handler will take care of this
      return false;
    }

    return false;
  }

  handleBackspaceKey(e) {
    const selection = window.getSelection();
    if (!selection.rangeCount || selection.anchorOffset !== 0) return false;

    const range = selection.getRangeAt(0);
    if (!range.collapsed) return false;

    const element = range.startContainer;
    const parentElement =
      element.nodeType === Node.TEXT_NODE ? element.parentElement : element;

    // Handle backspace in todo items - let the todo handler take care of it
    const taskItem = parentElement.closest(".task-item");
    if (taskItem) {
      // The todo keydown handler will take care of this
      return false;
    }

    return false;
  }

  toggleFormat(command, value = null) {
    if (
      document.queryCommandSupported &&
      document.queryCommandSupported(command)
    ) {
      document.execCommand(command, false, value);
    } else {
      // Fallback for unsupported commands
      const selection = window.getSelection();
      if (selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        if (command === "bold") {
          const strong = document.createElement("strong");
          try {
            range.surroundContents(strong);
          } catch (e) {
            strong.appendChild(range.extractContents());
            range.insertNode(strong);
          }
        }
        // Add other fallbacks as needed
      }
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
    const selection = window.getSelection();
    if (!selection.rangeCount) return;

    const range = selection.getRangeAt(0);
    const element =
      range.startContainer.nodeType === Node.TEXT_NODE
        ? range.startContainer.parentElement
        : range.startContainer;

    // Check if we're in a list item
    const listItem = element.closest("li");
    if (listItem) {
      const textContent = listItem.textContent.trim();

      // If multiple list items are selected
      const selectedListItems = this.getSelectedListItems();
      if (selectedListItems.length > 1) {
        const todoItems = selectedListItems.map((item) => {
          const textContent = item.textContent.trim();
          return this.createTodoElement(textContent);
        });

        // Replace all selected list items with todo items
        selectedListItems.forEach((item, index) => {
          item.parentNode.replaceChild(todoItems[index], item);
        });

        // Place cursor in the first converted todo item
        const firstTodoContent =
          todoItems[0].querySelector(".task-item-content");
        if (firstTodoContent) {
          this.placeCursorInElement(firstTodoContent, false);
        }
      } else {
        const todoItem = this.createTodoElement(textContent);

        // Replace the list item with the todo item
        listItem.parentNode.replaceChild(todoItem, listItem);

        // Place cursor in the new todo item
        const todoContent = todoItem.querySelector(".task-item-content");
        if (todoContent) {
          this.placeCursorInElement(todoContent, false);
        }
      }

      // Save undo state
      this.saveUndoState();
      this.saveData();
    } else {
      // Check if we have a text selection spanning multiple elements
      const selectedElements = this.getSelectedElements();

      if (selectedElements.length > 1) {
        // Convert multiple selected elements to todo items
        const todoItems = selectedElements.map((el) => {
          const textContent = el.textContent.trim();
          return this.createTodoElement(textContent);
        });

        // Replace all selected elements with todo items
        selectedElements.forEach((el, index) => {
          el.parentNode.replaceChild(todoItems[index], el);
        });

        // Place cursor in the first converted todo item
        const firstTodoContent =
          todoItems[0].querySelector(".task-item-content");
        if (firstTodoContent) {
          this.placeCursorInElement(firstTodoContent, false);
        }
      } else {
        // Create a new todo item at the current position
        const todoItem = this.createTodoElement();

        // Insert the todo item after the current element
        if (element.tagName === "DIV") {
          element.insertAdjacentElement("afterend", todoItem);
        } else {
          range.insertNode(todoItem);
        }

        this.placeCursorInElement(
          todoItem.querySelector(".task-item-content"),
          true
        );
      }

      this.saveUndoState();
      this.saveData();
    }
  }

  createTodoElement(content = "&#8203;", level = 0) {
    const wrapper = document.createElement("div");
    wrapper.className = "task-item";
    wrapper.dataset.level = level;

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.className = "task-item-checkbox";

    const contentDiv = document.createElement("div");
    contentDiv.className = "task-item-content";
    contentDiv.contentEditable = "true";
    contentDiv.innerHTML = content;

    // Ensure proper structure
    wrapper.appendChild(checkbox);
    wrapper.appendChild(contentDiv);

    // Set initial indentation
    this.updateTaskItemIndentation(wrapper);

    // Add comprehensive event listeners
    this.setupTodoEventListeners(wrapper, checkbox, contentDiv);

    return wrapper;
  }

  setupTodoEventListeners(wrapper, checkbox, contentDiv) {
    // Checkbox change handler
    checkbox.addEventListener("change", (e) => {
      const isChecked = e.target.checked;
      wrapper.classList.toggle("completed", isChecked);

      if (isChecked) {
        const activeMainTab = this.state.mainTabs.find(
          (t) => t.id === this.state.activeMainTabId
        );
        const activeSubTab = activeMainTab?.subTabs.find(
          (st) => st.id === this.state.activeSubTabId
        );

        if (!activeMainTab || !activeSubTab) return;

        const taskText = contentDiv.textContent;
        if (taskText.trim()) {
          this.state.completedTasks.push({
            id: Date.now(),
            text: taskText,
            completedAt: Date.now(),
            tabName: `${activeMainTab.name} / ${activeSubTab.name}`,
          });
        }
      }
      this.saveData();
    });

    // Enhanced content div event handling
    contentDiv.addEventListener("keydown", (e) => {
      this.handleTodoKeydown(e, wrapper, contentDiv);
    });

    contentDiv.addEventListener("input", () => {
      this.saveUndoState();
      this.saveData();
    });

    contentDiv.addEventListener("focus", () => {
      wrapper.classList.add("focused");
    });

    contentDiv.addEventListener("blur", () => {
      wrapper.classList.remove("focused");
    });

    // Prevent checkbox from stealing focus and handle clicks properly
    checkbox.addEventListener("mousedown", (e) => {
      e.preventDefault();
      checkbox.checked = !checkbox.checked;
      checkbox.dispatchEvent(new Event("change"));
    });

    // Handle clicks on the wrapper to focus the content
    wrapper.addEventListener("click", (e) => {
      if (e.target === wrapper || e.target === checkbox) {
        e.preventDefault();
        contentDiv.focus();
        this.placeCursorInElement(contentDiv, true);
      }
    });

    // Add drag and drop functionality
    this.setupTaskItemDragAndDrop(wrapper);
  }

  handleTodoKeydown(e, wrapper, contentDiv) {
    const selection = window.getSelection();
    if (!selection.rangeCount) return;

    const range = selection.getRangeAt(0);

    // Handle Enter key - always create new checkbox
    if (e.key === "Enter") {
      e.preventDefault();

      // Get current indentation level
      const currentLevel = parseInt(wrapper.dataset.level || "0");

      // Create new todo item after current one with same indentation
      const newTodo = this.createTodoElement("&#8203;", currentLevel);
      wrapper.insertAdjacentElement("afterend", newTodo);

      // Place cursor in the new todo item
      const newContentDiv = newTodo.querySelector(".task-item-content");
      this.placeCursorInElement(newContentDiv, true);

      this.saveUndoState();
      this.saveData();
      return;
    }

    // Handle Backspace key - delete empty checkbox or merge with previous
    if (e.key === "Backspace") {
      const isAtStart = range.startOffset === 0;
      const isEmpty = contentDiv.textContent.trim() === "";

      if (isEmpty || isAtStart) {
        e.preventDefault();

        if (isEmpty) {
          // Delete empty checkbox
          const prevElement = wrapper.previousElementSibling;
          if (prevElement) {
            if (prevElement.classList.contains("task-item")) {
              // Merge with previous checkbox
              const prevContent =
                prevElement.querySelector(".task-item-content");
              const currentContent = contentDiv.textContent;
              prevContent.textContent += currentContent;
              wrapper.remove();
              this.placeCursorInElement(prevContent, true);
            } else {
              // Replace with regular div
              const div = document.createElement("div");
              div.innerHTML = "&#8203;";
              wrapper.parentNode.replaceChild(div, wrapper);
              this.placeCursorInElement(div, true);
            }
          } else {
            // Replace with regular div if no previous element
            const div = document.createElement("div");
            div.innerHTML = "&#8203;";
            wrapper.parentNode.replaceChild(div, wrapper);
            this.placeCursorInElement(div, true);
          }
        } else if (isAtStart) {
          // Move cursor to end of previous element
          const prevElement = wrapper.previousElementSibling;
          if (prevElement) {
            if (prevElement.classList.contains("task-item")) {
              const prevContent =
                prevElement.querySelector(".task-item-content");
              this.placeCursorInElement(prevContent, true);
            } else {
              this.placeCursorInElement(prevElement, true);
            }
          }
        }

        this.saveUndoState();
        this.saveData();
        return;
      }
    }

    // Handle Tab key for indentation
    if (e.key === "Tab") {
      e.preventDefault();

      if (e.shiftKey) {
        // Outdent (move left)
        this.outdentTaskItem(wrapper);
      } else {
        // Indent (move right)
        this.indentTaskItem(wrapper);
      }

      this.saveUndoState();
      this.saveData();
      return;
    }
  }

  setupTaskItemDragAndDrop(taskItem) {
    taskItem.draggable = true;
    taskItem.style.cursor = "grab";

    taskItem.addEventListener("dragstart", (e) => {
      taskItem.style.opacity = "0.5";
      taskItem.style.cursor = "grabbing";
      e.dataTransfer.effectAllowed = "move";
      e.dataTransfer.setData("text/html", taskItem.outerHTML);
    });

    taskItem.addEventListener("dragend", (e) => {
      taskItem.style.opacity = "";
      taskItem.style.cursor = "grab";

      // Remove all drag-over classes
      const allTaskItems = document.querySelectorAll(".task-item");
      allTaskItems.forEach((item) => item.classList.remove("drag-over"));
    });

    taskItem.addEventListener("dragover", (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = "move";
    });

    taskItem.addEventListener("dragenter", (e) => {
      e.preventDefault();
      taskItem.classList.add("drag-over");
    });

    taskItem.addEventListener("dragleave", (e) => {
      if (!taskItem.contains(e.relatedTarget)) {
        taskItem.classList.remove("drag-over");
      }
    });

    taskItem.addEventListener("drop", (e) => {
      e.preventDefault();
      taskItem.classList.remove("drag-over");

      const draggedElement = document.querySelector(
        ".task-item[draggable='true']"
      );
      if (draggedElement && draggedElement !== taskItem) {
        const draggedIndex = Array.from(
          document.querySelectorAll(".task-item")
        ).indexOf(draggedElement);
        const dropIndex = Array.from(
          document.querySelectorAll(".task-item")
        ).indexOf(taskItem);

        if (draggedIndex !== dropIndex) {
          this.moveTaskItem(draggedElement, taskItem, draggedIndex < dropIndex);
        }
      }
    });
  }

  moveTaskItem(draggedElement, targetElement, isMovingDown) {
    const parent = draggedElement.parentNode;

    if (isMovingDown) {
      // Moving down - insert after target
      parent.insertBefore(draggedElement, targetElement.nextSibling);
    } else {
      // Moving up - insert before target
      parent.insertBefore(draggedElement, targetElement);
    }

    this.saveUndoState();
    this.saveData();
  }

  getSelectedListItems() {
    const selection = window.getSelection();
    if (!selection.rangeCount) return [];

    const range = selection.getRangeAt(0);
    const container = range.commonAncestorContainer;

    // Find all list items in the selection
    const listItems = [];
    const walker = document.createTreeWalker(
      container,
      NodeFilter.SHOW_ELEMENT,
      (node) => {
        return node.tagName === "LI"
          ? NodeFilter.FILTER_ACCEPT
          : NodeFilter.FILTER_SKIP;
      }
    );

    let node;
    while ((node = walker.nextNode())) {
      listItems.push(node);
    }

    return listItems;
  }

  getSelectedElements() {
    const selection = window.getSelection();
    if (!selection.rangeCount) return [];

    const range = selection.getRangeAt(0);
    const container = range.commonAncestorContainer;

    // Find all div elements in the selection
    const elements = [];
    const walker = document.createTreeWalker(
      container,
      NodeFilter.SHOW_ELEMENT,
      (node) => {
        return node.tagName === "DIV" && node.textContent.trim() !== ""
          ? NodeFilter.FILTER_ACCEPT
          : NodeFilter.FILTER_SKIP;
      }
    );

    let node;
    while ((node = walker.nextNode())) {
      elements.push(node);
    }

    return elements;
  }

  placeCursorInElement(element, atEnd = false) {
    const range = document.createRange();
    const selection = window.getSelection();

    if (atEnd) {
      range.selectNodeContents(element);
      range.collapse(false);
    } else {
      range.setStart(element, 0);
      range.collapse(true);
    }

    selection.removeAllRanges();
    selection.addRange(range);
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

  // copyAllTabs moved to avoid duplication

  cleanAllTabs() {
    if (this.state.mainTabs.length <= 1) {
      this.showNotification("Cannot delete the last tab");
      return;
    }

    const confirmed = confirm(
      `Are you sure you want to delete all ${this.state.mainTabs.length} tabs? This action cannot be undone.`
    );

    if (confirmed) {
      // Keep only the first tab and reset it
      const firstTab = this.state.mainTabs[0];
      this.state.mainTabs = [firstTab];
      this.state.activeMainTabId = firstTab.id;
      this.state.activeSubTabId = firstTab.subTabs[0].id;

      // Clear completed tasks
      this.state.completedTasks = [];

      this.render();
      this.saveData();
      this.showNotification("All tabs deleted successfully");
    }
  }
  scrollToCursorIfNeeded() {
    const selection = window.getSelection();
    if (!selection.rangeCount) return;

    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();
    const notebook = document.getElementById("notebook");
    const notebookRect = notebook.getBoundingClientRect();

    // Only scroll if cursor is significantly outside visible area
    const margin = 50; // Add margin to prevent unnecessary scrolling
    if (
      rect.bottom > notebookRect.bottom + margin ||
      rect.top < notebookRect.top - margin
    ) {
      // Use a more controlled scroll approach
      const scrollContainer = notebook.parentElement;
      const elementRect =
        range.startContainer.parentElement?.getBoundingClientRect();

      if (elementRect && scrollContainer) {
        const scrollTop = scrollContainer.scrollTop;
        const elementTop = elementRect.top - notebookRect.top + scrollTop;
        const containerHeight = scrollContainer.clientHeight;

        // Only scroll if element is not visible
        if (
          elementTop < scrollTop ||
          elementTop > scrollTop + containerHeight
        ) {
          scrollContainer.scrollTo({
            top: elementTop - containerHeight / 2,
            behavior: "smooth",
          });
        }
      }
    }
  }

  emailAllTabs() {
    const subject = `Chrome Notes – ${new Date().toLocaleDateString()}`;
    const html = this.buildEmailHtml(this.state.mainTabs);
    const to = "tomas.roosguerra@gmail.com";

    // Detect if mobile device
    const isMobile =
      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent
      );

    if (isMobile) {
      // Use mailto: for mobile devices
      const mailtoUrl = `mailto:${to}?subject=${encodeURIComponent(
        subject
      )}&body=${encodeURIComponent(html)}`;
      window.location.href = mailtoUrl;
      this.showNotification("Opening email app with your notes");
    } else {
      // Use Gmail web interface for desktop
      const url = `https://mail.google.com/mail/u/0/?view=cm&fs=1&to=${encodeURIComponent(
        to
      )}&su=${encodeURIComponent(subject)}&tf=1&body=${encodeURIComponent(
        html
      )}`;

      // Open Gmail in new tab
      window.open(url, "_blank");
      this.showNotification("Opening Gmail with your notes");
    }
  }

  buildEmailHtml(mainTabs) {
    if (!mainTabs || mainTabs.length === 0) {
      return "No notes found.";
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
        }
        .main-tab {
          margin-bottom: 30px;
          border-bottom: 2px solid #e0e0e0;
          padding-bottom: 20px;
        }
        .main-tab:last-child {
          border-bottom: none;
        }
        .main-tab-title {
          font-size: 24px;
          font-weight: 600;
          color: #1a1a1a;
          margin-bottom: 15px;
          border-bottom: 1px solid #e0e0e0;
          padding-bottom: 8px;
        }
        .sub-tab {
          margin-bottom: 20px;
        }
        .sub-tab-title {
          font-size: 18px;
          font-weight: 500;
          color: #3b82f6;
          margin-bottom: 10px;
        }
        .sub-tab-content {
          background-color: #f8f9fa;
          padding: 15px;
          border-radius: 8px;
          border-left: 4px solid #3b82f6;
        }
        .task-item {
          margin: 8px 0;
          padding: 4px 0;
        }
        .task-item.completed {
          text-decoration: line-through;
          color: #888;
        }
        .task-item-checkbox {
          margin-right: 8px;
        }
        ul, ol {
          margin: 10px 0;
          padding-left: 20px;
        }
        li {
          margin: 4px 0;
        }
        blockquote {
          border-left: 4px solid #e5e7eb;
          padding-left: 16px;
          margin: 10px 0;
          font-style: italic;
          color: #6b7280;
        }
        h1, h2, h3 {
          margin: 15px 0 10px 0;
          color: #1a1a1a;
        }
        h1 { font-size: 24px; }
        h2 { font-size: 20px; }
        h3 { font-size: 18px; }
        strong { font-weight: 600; }
        em { font-style: italic; }
      `;

    const content = mainTabs
      .map((mainTab) => {
        const subTabsHtml = mainTab.subTabs
          .map((subTab) => {
            const formattedContent = this.formatContentForEmail(subTab.content);
            return `
          <div class="sub-tab">
            <div class="sub-tab-title">${subTab.name}</div>
            <div class="sub-tab-content">${formattedContent}</div>
          </div>
        `;
          })
          .join("");

        return `
        <div class="main-tab">
          <div class="main-tab-title">${mainTab.name}</div>
          ${subTabsHtml}
        </div>
      `;
      })
      .join("");

    return `
      <html>
        <head>
          <style>${styles}</style>
        </head>
        <body>
          <div class="email-container">
            ${content}
          </div>
        </body>
      </html>
    `;
  }

  formatContentForEmail(htmlContent) {
    if (!htmlContent) return "";

    // Create a temporary div to parse the HTML
    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = htmlContent;

    let formattedText = "";

    function processNode(node, depth = 0) {
      if (node.nodeType === Node.TEXT_NODE) {
        formattedText += node.textContent;
        return;
      }

      const tagName = node.tagName.toLowerCase();
      const indent = "  ".repeat(depth);

      switch (tagName) {
        case "div":
          if (node.textContent.trim()) {
            formattedText += `${indent}${node.textContent.trim()}\n`;
          }
          break;
        case "ul":
          formattedText += "\n";
          Array.from(node.children).forEach((li) => {
            formattedText += `${indent}• ${li.textContent.trim()}\n`;
          });
          formattedText += "\n";
          break;
        case "ol":
          formattedText += "\n";
          Array.from(node.children).forEach((li, index) => {
            formattedText += `${indent}${
              index + 1
            }. ${li.textContent.trim()}\n`;
          });
          formattedText += "\n";
          break;
        case "blockquote":
          formattedText += `${indent}> ${node.textContent.trim()}\n\n`;
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
        case "strong":
          formattedText += `**${node.textContent}**`;
          break;
        case "em":
          formattedText += `*${node.textContent}*`;
          break;
        default:
          // For other elements, process children
          Array.from(node.childNodes).forEach((child) => {
            processNode(child, depth);
          });
      }
    }

    Array.from(tempDiv.childNodes).forEach((node) => {
      processNode(node);
    });

    return formattedText.trim();
  }

  async importFromClipboard() {
    console.log("importFromClipboard function called!"); // Debug log

    try {
      console.log("Checking clipboard permissions..."); // Debug log

      // Check if clipboard API is available
      if (!navigator.clipboard) {
        throw new Error("Clipboard API not available");
      }

      console.log("Reading clipboard text..."); // Debug log
      const clipboardText = await navigator.clipboard.readText();
      console.log(
        "Clipboard text received:",
        clipboardText.substring(0, 100) + "..."
      ); // Debug log

      if (!clipboardText || clipboardText.trim() === "") {
        this.showNotification(
          "Clipboard is empty. Please copy some content first."
        );
        return;
      }

      console.log("Parsing imported content..."); // Debug log

      // Check if clipboard contains JSON data
      let importedTabs;
      try {
        const jsonData = JSON.parse(clipboardText);
        if (jsonData.mainTabs && Array.isArray(jsonData.mainTabs)) {
          console.log("Detected JSON format, importing directly...");
          importedTabs = jsonData.mainTabs;

          // Update state with JSON data
          if (jsonData.activeMainTabId)
            this.state.activeMainTabId = jsonData.activeMainTabId;
          if (jsonData.activeSubTabId)
            this.state.activeSubTabId = jsonData.activeSubTabId;
          if (jsonData.completedTasks)
            this.state.completedTasks = jsonData.completedTasks;
          if (jsonData.hideCompleted !== undefined)
            this.state.hideCompleted = jsonData.hideCompleted;
          if (jsonData.lastSelectedSubTabs)
            this.state.lastSelectedSubTabs = jsonData.lastSelectedSubTabs;
        } else {
          throw new Error("Invalid JSON format");
        }
      } catch (jsonError) {
        console.log("Not JSON format, parsing as text...");
        // Try parsing as text format
        importedTabs = this.parseImportedContent(clipboardText);
      }

      console.log("Parsed tabs:", importedTabs); // Debug log

      if (importedTabs && importedTabs.length > 0) {
        // Validate imported tabs before adding
        const validTabs = importedTabs.filter(
          (tab) =>
            tab &&
            tab.id &&
            tab.name &&
            tab.subTabs &&
            Array.isArray(tab.subTabs)
        );

        if (validTabs.length > 0) {
          // Add imported tabs to existing tabs
          this.state.mainTabs.push(...validTabs);

          // Switch to the first imported tab
          if (validTabs[0].subTabs.length > 0) {
            this.state.activeMainTabId = validTabs[0].id;
            this.state.activeSubTabId = validTabs[0].subTabs[0].id;
          }

          this.render();
          this.saveData();

          // Show success message
          this.showNotification(
            `Imported ${validTabs.length} tab(s) successfully!`
          );
        } else {
          throw new Error("No valid tabs found in parsed data");
        }
      } else {
        // If no structured tabs found, try to import as plain text into current tab
        const activeTab = this.getActiveTab();
        if (activeTab && clipboardText.trim()) {
          const formattedContent = this.formatImportedContent(clipboardText);
          activeTab.content = formattedContent;
          this.render();
          this.saveData();
          this.showNotification("Imported content into current tab!");
        } else {
          this.showNotification("No valid tabs found in clipboard content.");
        }
      }
    } catch (err) {
      console.error("Import failed with error:", err);
      console.error("Error details:", err.message);

      if (err.name === "NotAllowedError") {
        this.showNotification(
          "Clipboard access denied. Please allow clipboard permissions and try again."
        );
      } else if (err.name === "NotFoundError") {
        this.showNotification(
          "Clipboard is empty. Please copy some content first."
        );
      } else {
        this.showNotification(`Import failed: ${err.message}`);
      }
    }
  }

  parseImportedContent(text) {
    console.log("Starting to parse:", text.substring(0, 200) + "..."); // Debug log

    const tabs = [];
    const lines = text.split("\n");
    let currentTab = null;
    let currentSubTab = null;
    let currentContent = [];
    let inContentMode = false;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmedLine = line.trim();

      console.log(`Line ${i}: "${line}" (trimmed: "${trimmedLine}")`); // Debug log

      // Main tab header (e.g., "# 1. Tab Name")
      if (
        trimmedLine.match(/^#\s*\d+\.\s*.+/) &&
        !trimmedLine.match(/^##\s*\d+\.\s*.+/)
      ) {
        console.log("Found main tab:", trimmedLine); // Debug log

        // Save previous tab if exists
        if (currentTab) {
          if (currentSubTab) {
            const formattedContent = this.formatImportedContent(
              currentContent.join("\n")
            );
            currentSubTab.content = formattedContent;
            currentTab.subTabs.push(currentSubTab);
            console.log("Saved sub tab:", currentSubTab.name); // Debug log
          }
          tabs.push(currentTab);
          console.log("Saved main tab:", currentTab.name); // Debug log
        }

        // Start new main tab
        const tabName = trimmedLine.replace(/^#\s*\d+\.\s*/, "");
        currentTab = {
          id: Date.now() + Math.random(),
          name: tabName,
          subTabs: [],
        };
        currentSubTab = null;
        currentContent = [];
        inContentMode = false;
      }
      // Sub tab header (e.g., "## 1. Sub Tab Name")
      else if (trimmedLine.match(/^##\s*\d+\.\s*.+/)) {
        console.log("Found sub tab:", trimmedLine); // Debug log

        // Save previous sub tab if exists
        if (currentSubTab) {
          const formattedContent = this.formatImportedContent(
            currentContent.join("\n")
          );
          currentSubTab.content = formattedContent;
          currentTab.subTabs.push(currentSubTab);
          console.log("Saved sub tab:", currentSubTab.name); // Debug log
        }

        // Start new sub tab
        const subTabName = trimmedLine.replace(/^##\s*\d+\.\s*/, "");
        currentSubTab = {
          id: Date.now() + Math.random(),
          name: subTabName,
          content: "",
        };
        currentContent = [];
        inContentMode = true; // We're now in content mode
      }
      // Separator line (skip it)
      else if (trimmedLine.match(/^=+$/)) {
        console.log("Found separator, skipping"); // Debug log
        continue;
      }
      // Content line (only if we have a current sub tab and we're in content mode)
      else if (currentSubTab && inContentMode) {
        currentContent.push(line); // Keep original line including whitespace
        console.log("Added content line:", line); // Debug log
      }
      // If we have a current tab but no sub tab yet, skip this line
      else if (currentTab && !currentSubTab) {
        console.log("Skipping line (no sub tab yet):", line); // Debug log
        continue;
      }
    }

    // Save the last tab and sub tab
    if (currentTab) {
      if (currentSubTab) {
        const formattedContent = this.formatImportedContent(
          currentContent.join("\n")
        );
        currentSubTab.content = formattedContent;
        currentTab.subTabs.push(currentSubTab);
        console.log("Saved final sub tab:", currentSubTab.name); // Debug log
      }
      tabs.push(currentTab);
      console.log("Saved final main tab:", currentTab.name); // Debug log
    }

    console.log("Final parsed tabs:", tabs); // Debug log
    return tabs;
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
            const subTabHeader = `# ${subIndex + 1}. ${subTab.name}`;
            return `${subTabHeader}\n\n${formattedContent}`;
          })
          .join("\n\n");

        const mainTabHeader = `## ${mainIndex + 1}. ${mainTab.name}`;
        return `${mainTabHeader}\n\n${subTabsContent}`;
      })
      .join("\n\n=====================================\n\n");
  }

  formatContentForCopy(htmlContent) {
    if (!htmlContent) return "";

    // Create a temporary div to parse the HTML
    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = htmlContent;

    let formattedText = "";

    function processNode(node, depth = 0) {
      if (node.nodeType === Node.TEXT_NODE) {
        formattedText += node.textContent;
        return;
      }

      const tagName = node.tagName.toLowerCase();
      const indent = "  ".repeat(depth);

      switch (tagName) {
        case "div":
          if (node.textContent.trim()) {
            formattedText += `${indent}${node.textContent.trim()}\n`;
          }
          break;
        case "ul":
          formattedText += "\n";
          Array.from(node.children).forEach((li) => {
            formattedText += `${indent}• ${li.textContent.trim()}\n`;
          });
          formattedText += "\n";
          break;
        case "ol":
          formattedText += "\n";
          Array.from(node.children).forEach((li, index) => {
            formattedText += `${indent}${
              index + 1
            }. ${li.textContent.trim()}\n`;
          });
          formattedText += "\n";
          break;
        case "blockquote":
          formattedText += `${indent}> ${node.textContent.trim()}\n\n`;
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
        case "strong":
          formattedText += `**${node.textContent}**`;
          break;
        case "em":
          formattedText += `*${node.textContent}*`;
          break;
        default:
          // For other elements, process children
          Array.from(node.childNodes).forEach((child) => {
            processNode(child, depth);
          });
      }
    }

    Array.from(tempDiv.childNodes).forEach((node) => {
      processNode(node);
    });

    return formattedText.trim();
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

  // Copy all tabs to clipboard
  async copyAllTabs() {
    try {
      const allContent = this.formatTabsForCopy(this.state.mainTabs);
      await navigator.clipboard.writeText(allContent);
      this.showNotification("All tabs copied to clipboard!");
    } catch (err) {
      console.error("Failed to copy:", err);
      this.showNotification("Failed to copy to clipboard");
    }
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
            const subTabHeader = `# ${subIndex + 1}. ${subTab.name}`;
            return `${subTabHeader}\n\n${formattedContent}`;
          })
          .join("\n\n");

        const mainTabHeader = `## ${mainIndex + 1}. ${mainTab.name}`;
        return `${mainTabHeader}\n\n${subTabsContent}`;
      })
      .join("\n\n=====================================\n\n");
  }

  formatContentForCopy(htmlContent) {
    if (!htmlContent) return "";

    // Create a temporary div to parse the HTML
    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = htmlContent;

    let formattedText = "";

    function processNode(node, depth = 0) {
      if (node.nodeType === Node.TEXT_NODE) {
        formattedText += node.textContent;
        return;
      }

      const tagName = node.tagName.toLowerCase();
      const indent = "  ".repeat(depth);

      switch (tagName) {
        case "div":
          if (node.textContent.trim()) {
            formattedText += `${indent}${node.textContent.trim()}\n`;
          }
          break;
        case "ul":
          formattedText += "\n";
          Array.from(node.children).forEach((li) => {
            formattedText += `${indent}• ${li.textContent.trim()}\n`;
          });
          formattedText += "\n";
          break;
        case "ol":
          formattedText += "\n";
          Array.from(node.children).forEach((li, index) => {
            formattedText += `${indent}${
              index + 1
            }. ${li.textContent.trim()}\n`;
          });
          formattedText += "\n";
          break;
        case "blockquote":
          formattedText += `${indent}> ${node.textContent.trim()}\n\n`;
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
        case "strong":
          formattedText += `**${node.textContent}**`;
          break;
        case "em":
          formattedText += `*${node.textContent}*`;
          break;
        default:
          // For other elements, process children
          Array.from(node.childNodes).forEach((child) => {
            processNode(child, depth);
          });
      }
    }

    Array.from(tempDiv.childNodes).forEach((node) => {
      processNode(node);
    });

    return formattedText.trim();
  }

  // Helper function to format inline text (bold, italic, etc.)
  formatInlineText(text) {
    // Handle bold text (**text**)
    text = text.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");

    // Handle italic text (*text*)
    text = text.replace(/\*(.*?)\*/g, "<em>$1</em>");

    return text;
  }

  // Swipe gesture detection for tab navigation
  setupSwipeGestures() {
    const notebook = document.getElementById("notebook");
    if (!notebook) return;

    // Touch events for mobile
    notebook.addEventListener(
      "touchstart",
      (e) => {
        if (this.isKeyboardOpen) return;
        this.swipeStartX = e.touches[0].clientX;
        this.swipeStartY = e.touches[0].clientY;
        this.isSwiping = true;
      },
      { passive: true }
    );

    notebook.addEventListener(
      "touchmove",
      (e) => {
        if (!this.isSwiping || this.isKeyboardOpen) return;
        this.swipeEndX = e.touches[0].clientX;
        this.swipeEndY = e.touches[0].clientY;
      },
      { passive: true }
    );

    notebook.addEventListener("touchend", (e) => {
      if (!this.isSwiping || this.isKeyboardOpen) return;
      this.handleSwipe();
      this.isSwiping = false;
    });

    // Mouse/trackpad events for desktop - only for strong horizontal swipes
    let swipeTimeout = null;

    notebook.addEventListener(
      "wheel",
      (e) => {
        // Only trigger on strong horizontal swipes (trackpad)
        const isHorizontalSwipe = Math.abs(e.deltaX) > Math.abs(e.deltaY) * 2;
        const isStrongSwipe = Math.abs(e.deltaX) > 100;

        if (isHorizontalSwipe && isStrongSwipe) {
          // Debounce to prevent multiple triggers
          clearTimeout(swipeTimeout);
          swipeTimeout = setTimeout(() => {
            if (e.deltaX > 0) {
              // Swipe left (next tab)
              this.switchToNextSubTab();
            } else {
              // Swipe right (previous tab)
              this.switchToPreviousSubTab();
            }
          }, 50);
        }
      },
      { passive: true }
    );
  }

  handleSwipe() {
    const deltaX = this.swipeEndX - this.swipeStartX;
    const deltaY = this.swipeEndY - this.swipeStartY;
    const absDeltaX = Math.abs(deltaX);
    const absDeltaY = Math.abs(deltaY);

    // Check if swipe is mostly horizontal (>70% horizontal) and significant
    const totalDistance = absDeltaX + absDeltaY;
    const horizontalRatio = absDeltaX / totalDistance;
    const minSwipeDistance = 80; // Increased threshold

    if (horizontalRatio > 0.7 && absDeltaX > minSwipeDistance) {
      // Add subtle visual feedback
      this.showSwipeFeedback(deltaX > 0 ? "right" : "left");

      if (deltaX > 0) {
        // Swipe right (previous tab)
        this.switchToPreviousSubTab();
      } else {
        // Swipe left (next tab)
        this.switchToNextSubTab();
      }
    }
  }

  switchToNextSubTab() {
    const activeMainTab = this.state.mainTabs.find(
      (tab) => tab.id === this.state.activeMainTabId
    );
    if (!activeMainTab || !activeMainTab.subTabs) return;

    const currentIndex = activeMainTab.subTabs.findIndex(
      (subTab) => subTab.id === this.state.activeSubTabId
    );

    if (currentIndex < activeMainTab.subTabs.length - 1) {
      const nextSubTab = activeMainTab.subTabs[currentIndex + 1];
      this.switchSubTab(nextSubTab.id);
    }
  }

  switchToPreviousSubTab() {
    const activeMainTab = this.state.mainTabs.find(
      (tab) => tab.id === this.state.activeMainTabId
    );
    if (!activeMainTab || !activeMainTab.subTabs) return;

    const currentIndex = activeMainTab.subTabs.findIndex(
      (subTab) => subTab.id === this.state.activeSubTabId
    );

    if (currentIndex > 0) {
      const prevSubTab = activeMainTab.subTabs[currentIndex - 1];
      this.switchSubTab(prevSubTab.id);
    }
  }

  showSwipeFeedback(direction) {
    const notebook = document.getElementById("notebook");
    if (!notebook) return;

    // Subtle visual feedback - just a brief tint
    notebook.style.transition = "opacity 0.15s ease";
    notebook.style.opacity = "0.92";

    setTimeout(() => {
      notebook.style.opacity = "1";
      setTimeout(() => {
        notebook.style.transition = "";
      }, 150);
    }, 50);
  }

  // URL Detection and Link Card Creation
  detectAndConvertURLs() {
    const notebook = document.getElementById("notebook");
    if (!notebook) return;

    const selection = window.getSelection();
    const cursorNode = selection.anchorNode;

    // URL regex pattern
    const urlPattern = /(https?:\/\/[^\s]+)/g;

    // Walk through all text nodes
    const walker = document.createTreeWalker(
      notebook,
      NodeFilter.SHOW_TEXT,
      null,
      false
    );

    let node;
    const nodesToProcess = [];

    while ((node = walker.nextNode())) {
      if (node.nodeValue && urlPattern.test(node.nodeValue)) {
        // Skip if this is the node we're currently editing
        if (node === cursorNode) continue;
        nodesToProcess.push(node);
      }
    }

    nodesToProcess.forEach((node) => {
      this.convertURLToCard(node);
    });
  }

  convertURLToCard(textNode) {
    const urlPattern = /(https?:\/\/[^\s]+)/g;
    const text = textNode.nodeValue;
    const match = text.match(urlPattern);

    if (!match) return;

    const url = match[0];
    const beforeURL = text.substring(0, text.indexOf(url));
    const afterURL = text.substring(text.indexOf(url) + url.length);

    // Create link card element
    const linkCard = this.createLinkCard(url);

    // Replace text node with link card
    const parent = textNode.parentNode;

    if (beforeURL) {
      parent.insertBefore(document.createTextNode(beforeURL), textNode);
    }

    parent.insertBefore(linkCard, textNode);

    if (afterURL) {
      parent.insertBefore(document.createTextNode(afterURL), textNode);
    }

    parent.removeChild(textNode);
  }

  createLinkCard(url) {
    const card = document.createElement("a");
    card.href = url;
    card.target = "_blank";
    card.rel = "noopener noreferrer";
    card.className = "link-card";
    card.contentEditable = "false";

    // Extract domain for display
    let domain = url;
    try {
      domain = new URL(url).hostname.replace("www.", "");
    } catch (e) {
      // If URL parsing fails, use original
    }

    card.innerHTML = `
      <span class="link-card-icon">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
          <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
        </svg>
      </span>
      <span class="link-card-content">
        <span class="link-card-domain">${domain}</span>
        <span class="link-card-url">${url}</span>
      </span>
    `;

    // Prevent card from being edited
    card.addEventListener("mousedown", (e) => {
      e.stopPropagation();
    });

    return card;
  }
}

// Initialize the app when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  new ChromeNotesWebApp();
});
