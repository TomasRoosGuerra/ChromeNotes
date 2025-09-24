document.addEventListener("DOMContentLoaded", async () => {
  // --- DOM Elements ---
  const notebook = document.getElementById("notebook");
  const appContainer = document.getElementById("app-container");
  const tabsList = document.getElementById("tabs-list");
  const addTabBtn = document.getElementById("add-tab-btn");
  const copyAllBtn = document.getElementById("copy-all-btn");
  const emailAllBtn = document.getElementById("email-all-btn");

  // --- Firebase Sync ---
  let firebaseSync = null;

  // Initialize Firebase sync
  try {
    firebaseSync = new window.FirebaseSync();
    const initialized = await firebaseSync.initialize();

    if (initialized) {
      console.log("Firebase sync initialized successfully");
      setupSyncControls();

      // Listen for cloud data updates
      document.addEventListener("cloudDataUpdate", (event) => {
        const cloudData = event.detail;
        if (cloudData) {
          mergeCloudData(cloudData);
        }
      });
    }
  } catch (error) {
    console.error("Firebase sync initialization failed:", error);
  }

  // --- State ---
  let state = {
    mainTabs: [],
    activeMainTabId: null,
    activeSubTabId: null,
    completedTasks: [],
    hideCompleted: false,
    lastSelectedSubTabs: {}, // Track last selected sub-tab for each main tab
  };
  let debounceTimer;

  // --- Undo/Redo System ---
  let undoStack = [];
  let redoStack = [];
  const MAX_UNDO_HISTORY = 20;

  // --- Undo/Redo Functions ---
  const saveUndoState = () => {
    const activeTab = getActiveTab();
    if (!activeTab) return;

    const undoState = {
      content: activeTab.content,
      timestamp: Date.now(),
    };

    undoStack.push(undoState);
    if (undoStack.length > MAX_UNDO_HISTORY) {
      undoStack.shift();
    }

    // Clear redo stack when new action is performed
    redoStack = [];
    updateUndoRedoButtons();
  };

  const undo = () => {
    if (undoStack.length === 0) return;

    const activeTab = getActiveTab();
    if (!activeTab) return;

    // Save current state to redo stack
    redoStack.push({
      content: activeTab.content,
      timestamp: Date.now(),
    });

    // Restore previous state
    const previousState = undoStack.pop();
    activeTab.content = previousState.content;

    // Re-render the notebook
    renderNotebook();
    updateUndoRedoButtons();
  };

  const redo = () => {
    if (redoStack.length === 0) return;

    const activeTab = getActiveTab();
    if (!activeTab) return;

    // Save current state to undo stack
    undoStack.push({
      content: activeTab.content,
      timestamp: Date.now(),
    });

    // Restore next state
    const nextState = redoStack.pop();
    activeTab.content = nextState.content;

    // Re-render the notebook
    renderNotebook();
    updateUndoRedoButtons();
  };

  const updateUndoRedoButtons = () => {
    const undoBtn = document.getElementById("undo-btn");
    const redoBtn = document.getElementById("redo-btn");

    if (undoBtn) {
      undoBtn.disabled = undoStack.length === 0;
      undoBtn.style.opacity = undoStack.length === 0 ? "0.5" : "1";
    }

    if (redoBtn) {
      redoBtn.disabled = redoStack.length === 0;
      redoBtn.style.opacity = redoStack.length === 0 ? "0.5" : "1";
    }
  };

  // --- Firebase Sync Functions ---
  const setupSyncControls = () => {
    const signinBtn = document.getElementById("sync-signin-btn");
    const statusBtn = document.getElementById("sync-status-btn");

    if (signinBtn) {
      signinBtn.addEventListener("click", async () => {
        if (firebaseSync) {
          const success = await firebaseSync.signIn();
          if (success) {
            updateSyncStatus();
            // Sync current data to cloud
            await syncToCloud();
          }
        }
      });
    }

    if (statusBtn) {
      statusBtn.addEventListener("click", async () => {
        if (firebaseSync && firebaseSync.user) {
          const success = await firebaseSync.signOut();
          if (success) {
            updateSyncStatus();
          }
        }
      });
    }

    updateSyncStatus();
  };

  const updateSyncStatus = () => {
    const signinBtn = document.getElementById("sync-signin-btn");
    const statusBtn = document.getElementById("sync-status-btn");

    if (!firebaseSync) return;

    const status = firebaseSync.getSyncStatus();

    if (status.isSignedIn) {
      if (signinBtn) signinBtn.style.display = "none";
      if (statusBtn) {
        statusBtn.style.display = "block";
        statusBtn.title = `Signed in as ${status.userEmail}`;
      }
    } else {
      if (signinBtn) signinBtn.style.display = "block";
      if (statusBtn) statusBtn.style.display = "none";
    }
  };

  const syncToCloud = async () => {
    if (firebaseSync && firebaseSync.user) {
      const success = await firebaseSync.syncToCloud(state);
      if (success) {
        showNotification("Notes synced to cloud");
      } else {
        showNotification("Sync failed");
      }
    }
  };

  const mergeCloudData = (cloudData) => {
    // Simple merge strategy - you might want to implement more sophisticated conflict resolution
    if (cloudData.mainTabs) {
      state.mainTabs = cloudData.mainTabs;
      state.activeMainTabId = cloudData.activeMainTabId;
      state.activeSubTabId = cloudData.activeSubTabId;
      state.completedTasks = cloudData.completedTasks || [];
      state.hideCompleted = cloudData.hideCompleted || false;
      state.lastSelectedSubTabs = cloudData.lastSelectedSubTabs || {};

      render();
      showNotification("Notes updated from cloud");
    }
  };

  // --- Data Management ---
  const saveData = async () => {
    const activeTab = getActiveTab();
    if (activeTab && notebook.isContentEditable) {
      activeTab.content = notebook.innerHTML;
    }

    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(async () => {
      // Save locally first
      chrome.storage.local.set({ sidekickNotesData_v2_4: state }, () => {
        console.log("Data saved locally.");
      });

      // Then sync to cloud if signed in
      if (firebaseSync && firebaseSync.user) {
        await syncToCloud();
      }
    }, 300);
  };

  const loadData = () => {
    chrome.storage.local.get(
      ["sidekickNotesData_v2_4", "sidekickNotesData_v2_3"],
      (result) => {
        console.log("loadData result:", result);
        const data =
          result.sidekickNotesData_v2_4 || result.sidekickNotesData_v2_3;

        if (data) {
          console.log("Found data:", data);
          // Migrate from old structure if needed
          if (data.tabs && !data.mainTabs) {
            console.log("Migrating from old structure");
            state = {
              mainTabs: data.tabs.map((tab) => ({
                id: tab.id,
                name: tab.name,
                subTabs: [
                  {
                    id: tab.id + "_default",
                    name: "Main",
                    content: tab.content,
                  },
                ],
              })),
              activeMainTabId: data.activeTabId,
              activeSubTabId: data.activeTabId + "_default",
              completedTasks: data.completedTasks || [],
              hideCompleted: data.hideCompleted || false,
              lastSelectedSubTabs: {},
            };
          } else {
            console.log("Using new structure");
            state = {
              mainTabs: data.mainTabs || [],
              activeMainTabId: data.activeMainTabId || null,
              activeSubTabId: data.activeSubTabId || null,
              completedTasks: data.completedTasks || [],
              hideCompleted: data.hideCompleted || false,
              lastSelectedSubTabs: data.lastSelectedSubTabs || {},
            };
          }
        } else {
          console.log("No data found, creating default structure");
          // Create default structure
          const firstMainTab = {
            id: Date.now(),
            name: "Notes",
            subTabs: [{ id: Date.now() + 1, name: "Main", content: "" }],
          };
          state = {
            mainTabs: [firstMainTab],
            activeMainTabId: firstMainTab.id,
            activeSubTabId: firstMainTab.subTabs[0].id,
            completedTasks: [],
            hideCompleted: false,
            lastSelectedSubTabs: {},
          };
        }
        console.log("Final state:", state);
        render();
      }
    );
  };

  // Helper function to get the currently active tab
  const getActiveTab = () => {
    if (!state.activeMainTabId || !state.activeSubTabId) return null;

    const mainTab = state.mainTabs.find(
      (tab) => tab.id === state.activeMainTabId
    );
    if (!mainTab) return null;

    return mainTab.subTabs.find((subTab) => subTab.id === state.activeSubTabId);
  };

  // --- Rendering ---
  const render = () => {
    renderMainTabs();
    renderSubTabs();
    if (state.activeSubTabId === "done-log") {
      renderDoneLog();
    } else {
      renderNotebook();
    }
    updateUiState();
  };

  const renderMainTabs = () => {
    const mainTabsList = document.getElementById("main-tabs-list");
    mainTabsList.innerHTML = "";

    state.mainTabs.forEach((tab) => {
      mainTabsList.appendChild(createMainTabElement(tab));
    });

    const activeMainTabEl = mainTabsList.querySelector(
      `[data-main-tab-id="${state.activeMainTabId}"]`
    );
    if (activeMainTabEl) activeMainTabEl.classList.add("active");
  };

  const renderSubTabs = () => {
    const subTabsContainer = document.getElementById("sub-tabs-container");
    const subTabsList = document.getElementById("sub-tabs-list");

    if (!state.activeMainTabId) {
      subTabsContainer.classList.add("hidden");
      return;
    }

    const activeMainTab = state.mainTabs.find(
      (tab) => tab.id === state.activeMainTabId
    );
    if (!activeMainTab) {
      subTabsContainer.classList.add("hidden");
      return;
    }

    subTabsContainer.classList.remove("hidden");
    subTabsList.innerHTML = "";

    activeMainTab.subTabs.forEach((subTab) => {
      subTabsList.appendChild(createSubTabElement(subTab));
    });

    // Add Done tab
    subTabsList.appendChild(
      createSubTabElement({ id: "done-log", name: "Done" }, true)
    );

    const activeSubTabEl = subTabsList.querySelector(
      `[data-sub-tab-id="${state.activeSubTabId}"]`
    );
    if (activeSubTabEl) activeSubTabEl.classList.add("active");
  };

  const renderNotebook = () => {
    const activeTab = getActiveTab();
    if (activeTab) {
      notebook.innerHTML = activeTab.content;
    } else {
      notebook.innerHTML = "";
    }
    notebook.contentEditable = "true";
    notebook.classList.remove("notebook-readonly");

    // Ensure the notebook is visible and focused
    notebook.style.display = "block";
    notebook.style.visibility = "visible";
  };

  const renderDoneLog = () => {
    notebook.contentEditable = "false";
    notebook.classList.add("notebook-readonly");

    // Ensure the notebook is visible
    notebook.style.display = "block";
    notebook.style.visibility = "visible";

    const tasks = state.completedTasks || [];
    if (tasks.length === 0) {
      notebook.innerHTML = "";
      return;
    }
    const groupedByTab = tasks.reduce((acc, task) => {
      (acc[task.tabName] = acc[task.tabName] || []).push(task);
      return acc;
    }, {});

    let html = "";
    for (const tabName in groupedByTab) {
      html += `<div class="done-log-tab-group"><div class="done-log-tab-name">${tabName}</div>`;

      const tasksInGroup = groupedByTab[tabName];
      const groupedByDate = tasksInGroup.reduce((acc, task) => {
        const date = new Date(task.completedAt).toLocaleDateString();
        (acc[date] = acc[date] || []).push(task);
        return acc;
      }, {});

      for (const date in groupedByDate) {
        html += `<div class="done-log-date-group"><div class="done-log-date">${date}</div>`;
        groupedByDate[date].forEach((task, index) => {
          html += `<div class="done-log-item" data-task-id="${
            task.id || `${task.completedAt}-${index}`
          }">
            <span class="done-log-text">${task.text}</span>
            <button class="done-log-delete-btn" title="Delete task">×</button>
          </div>`;
        });
        html += `</div>`;
      }
      html += `</div>`;
    }
    notebook.innerHTML = html;
  };

  const updateUiState = () => {
    appContainer.classList.toggle("hide-completed", state.hideCompleted);
    document.getElementById("eye-open-icon").style.display = state.hideCompleted
      ? "none"
      : "block";
    document.getElementById("eye-closed-icon").style.display =
      state.hideCompleted ? "block" : "none";
    updateUndoRedoButtons();
  };

  // --- Tab Management ---
  const createMainTabElement = (tab) => {
    const el = document.createElement("div");
    el.className = "main-tab";
    el.dataset.mainTabId = tab.id;
    el.draggable = true;
    el.innerHTML = `<span class="tab-name">${tab.name}</span><button class="main-tab-delete-btn">×</button>`;

    el.addEventListener("click", (e) => {
      // Check if this is a drag operation
      if (e.target.closest(".main-tab").classList.contains("dragging")) {
        return;
      }

      if (e.target.classList.contains("main-tab-delete-btn")) {
        deleteMainTab(tab.id);
      } else {
        switchMainTab(tab.id);
      }
    });

    el.querySelector(".tab-name").addEventListener("dblclick", (e) =>
      makeTabEditable(e.currentTarget, "main")
    );

    // Add drag and drop event listeners
    addDragAndDropListeners(el, "main");

    return el;
  };

  const createSubTabElement = (subTab, isSpecial = false) => {
    const el = document.createElement("div");
    el.className = `sub-tab ${isSpecial ? "special-tab" : ""}`;
    el.dataset.subTabId = subTab.id;
    el.innerHTML = `<span class="tab-name">${subTab.name}</span>${
      !isSpecial ? '<button class="sub-tab-delete-btn">×</button>' : ""
    }`;

    el.addEventListener("click", (e) => {
      // Check if this is a drag operation
      if (e.target.closest(".sub-tab").classList.contains("dragging")) {
        return;
      }

      if (e.target.classList.contains("sub-tab-delete-btn")) {
        deleteSubTab(subTab.id);
      } else {
        switchSubTab(subTab.id);
      }
    });

    if (!isSpecial) {
      el.draggable = true;
      el.querySelector(".tab-name").addEventListener("dblclick", (e) =>
        makeTabEditable(e.currentTarget, "sub")
      );
      // Add drag and drop event listeners for non-special tabs
      addDragAndDropListeners(el, "sub");
    }

    return el;
  };

  const makeTabEditable = (nameEl, tabType) => {
    nameEl.contentEditable = "true";
    nameEl.focus();
    const onBlur = () => {
      nameEl.contentEditable = "false";
      const newName = nameEl.textContent.trim() || "Untitled";

      if (tabType === "main") {
        const tabId = Number(nameEl.closest(".main-tab").dataset.mainTabId);
        const tabToRename = state.mainTabs.find((t) => t.id === tabId);
        if (tabToRename) {
          tabToRename.name = newName;
          nameEl.textContent = newName;
          saveData();
        }
      } else if (tabType === "sub") {
        const subTabId = nameEl.closest(".sub-tab").dataset.subTabId;
        const subTabIdNum =
          subTabId === "done-log" ? "done-log" : Number(subTabId);

        const activeMainTab = state.mainTabs.find(
          (tab) => tab.id === state.activeMainTabId
        );
        if (activeMainTab) {
          const subTabToRename = activeMainTab.subTabs.find(
            (t) => t.id === subTabIdNum
          );
          if (subTabToRename) {
            subTabToRename.name = newName;
            nameEl.textContent = newName;
            saveData();
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
  };

  const switchMainTab = (mainTabId) => {
    if (state.activeMainTabId === mainTabId) return;
    saveData();

    // Save the current sub-tab selection for the current main tab
    if (state.activeMainTabId && state.activeSubTabId) {
      state.lastSelectedSubTabs[state.activeMainTabId] = state.activeSubTabId;
    }

    state.activeMainTabId = mainTabId;

    // Try to restore the last selected sub-tab for this main tab, otherwise use the first one
    const mainTab = state.mainTabs.find((tab) => tab.id === mainTabId);
    if (mainTab && mainTab.subTabs.length > 0) {
      const lastSelectedSubTabId = state.lastSelectedSubTabs[mainTabId];
      const subTabExists = mainTab.subTabs.find(
        (subTab) => subTab.id === lastSelectedSubTabId
      );

      if (subTabExists) {
        state.activeSubTabId = lastSelectedSubTabId;
      } else {
        state.activeSubTabId = mainTab.subTabs[0].id;
      }
    }
    render();
  };

  const switchSubTab = (subTabId) => {
    const subTabIdNum = subTabId === "done-log" ? "done-log" : Number(subTabId);
    if (state.activeSubTabId === subTabIdNum) return;
    saveData();
    state.activeSubTabId = subTabIdNum;
    render();
  };

  const addMainTab = () => {
    const newMainTab = {
      id: Date.now(),
      name: "New Tab",
      subTabs: [{ id: Date.now() + 1, name: "Main", content: "" }],
    };
    state.mainTabs.push(newMainTab);
    switchMainTab(newMainTab.id);
  };

  const addSubTab = () => {
    if (!state.activeMainTabId) return;

    const activeMainTab = state.mainTabs.find(
      (tab) => tab.id === state.activeMainTabId
    );
    if (!activeMainTab) return;

    const newSubTab = { id: Date.now(), name: "New Sub-tab", content: "" };
    activeMainTab.subTabs.push(newSubTab);
    switchSubTab(newSubTab.id);
  };

  const deleteMainTab = (mainTabId) => {
    if (state.mainTabs.length <= 1) return;

    state.mainTabs = state.mainTabs.filter((tab) => tab.id !== mainTabId);

    if (state.activeMainTabId === mainTabId) {
      state.activeMainTabId = state.mainTabs[0].id;
      state.activeSubTabId = state.mainTabs[0].subTabs[0].id;
    }

    render();
    saveData();
  };

  const deleteSubTab = (subTabId) => {
    const activeMainTab = state.mainTabs.find(
      (tab) => tab.id === state.activeMainTabId
    );
    if (!activeMainTab || activeMainTab.subTabs.length <= 1) return;

    activeMainTab.subTabs = activeMainTab.subTabs.filter(
      (subTab) => subTab.id !== subTabId
    );

    if (state.activeSubTabId === subTabId) {
      state.activeSubTabId = activeMainTab.subTabs[0].id;
    }

    render();
    saveData();
  };

  // --- Drag and Drop Functionality ---
  let draggedElement = null;
  let draggedIndex = -1;
  let isDragging = false;

  const addDragAndDropListeners = (element, tabType) => {
    element.addEventListener("dragstart", (e) => {
      isDragging = true;
      draggedElement = element;
      draggedIndex = getTabIndex(element, tabType);
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
      draggedElement = null;
      draggedIndex = -1;

      // Reset dragging flag after a short delay to prevent click events
      setTimeout(() => {
        isDragging = false;
      }, 100);
    });

    element.addEventListener("dragover", (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = "move";
    });

    element.addEventListener("dragenter", (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (draggedElement && draggedElement !== element) {
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

      if (draggedElement && draggedElement !== element) {
        const dropIndex = getTabIndex(element, tabType);
        moveTab(draggedIndex, dropIndex, tabType);
      }
    });

    // Prevent click events during drag
    element.addEventListener("click", (e) => {
      if (isDragging) {
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
        if (draggedElement && draggedElement !== element) {
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

        if (draggedElement && draggedElement !== element) {
          const dropIndex = getTabIndex(element, tabType);
          moveTab(draggedIndex, dropIndex, tabType);
        }
      });
    }

    if (deleteBtn) {
      deleteBtn.addEventListener("dragenter", (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (draggedElement && draggedElement !== element) {
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

        if (draggedElement && draggedElement !== element) {
          const dropIndex = getTabIndex(element, tabType);
          moveTab(draggedIndex, dropIndex, tabType);
        }
      });
    }
  };

  const getTabIndex = (element, tabType) => {
    const container = tabType === "main" ? "#main-tabs-list" : "#sub-tabs-list";
    const tabs = Array.from(document.querySelectorAll(container + " > *"));
    return tabs.indexOf(element);
  };

  const moveTab = (fromIndex, toIndex, tabType) => {
    if (fromIndex === toIndex) {
      return;
    }

    if (tabType === "main") {
      // Move main tab
      const tab = state.mainTabs[fromIndex];
      if (!tab) {
        return;
      }
      state.mainTabs.splice(fromIndex, 1);
      state.mainTabs.splice(toIndex, 0, tab);
    } else {
      // Move sub tab
      const activeMainTab = state.mainTabs.find(
        (tab) => tab.id === state.activeMainTabId
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

    // Re-render to reflect the new order
    render();
    saveData();
  };

  // --- Event Listeners Setup ---
  const setupEventListeners = () => {
    document
      .getElementById("add-main-tab-btn")
      .addEventListener("click", addMainTab);
    document
      .getElementById("add-sub-tab-btn")
      .addEventListener("click", addSubTab);
    copyAllBtn.addEventListener("click", () => {
      const allContent = formatTabsForCopy(state.mainTabs);
      navigator.clipboard.writeText(allContent);
    });
    emailAllBtn.addEventListener("click", copyAndEmailAllTabs);
    document
      .getElementById("import-btn")
      .addEventListener("click", importFromClipboard);

    // Toolbar Buttons - Updated for better compatibility
    document
      .getElementById("bold-btn")
      .addEventListener("click", () => toggleFormat("bold"));
    document
      .getElementById("italic-btn")
      .addEventListener("click", () => toggleFormat("italic"));
    document
      .getElementById("strikethrough-btn")
      .addEventListener("click", () => toggleFormat("strikeThrough"));
    document
      .getElementById("h1-btn")
      .addEventListener("click", () => toggleBlockFormat("h1"));
    document
      .getElementById("h2-btn")
      .addEventListener("click", () => toggleBlockFormat("h2"));
    document
      .getElementById("bullet-list-btn")
      .addEventListener("click", () => toggleList("ul"));
    document
      .getElementById("blockquote-btn")
      .addEventListener("click", () => toggleBlockFormat("blockquote"));
    document
      .getElementById("todo-btn")
      .addEventListener("click", toggleTodoItem);
    document
      .getElementById("color-picker")
      .addEventListener("input", (e) =>
        toggleFormat("foreColor", e.target.value)
      );
    document.getElementById("undo-btn").addEventListener("click", undo);
    document.getElementById("redo-btn").addEventListener("click", redo);
    document
      .getElementById("toggle-completed-btn")
      .addEventListener("click", () => {
        state.hideCompleted = !state.hideCompleted;
        updateUiState();
        saveData();
      });

    notebook.addEventListener("input", () => {
      saveUndoState();
      saveData();
    });
    notebook.addEventListener("keydown", handleKeydown);
    notebook.addEventListener("paste", handlePaste);
    notebook.addEventListener("click", handleNotebookClick);
  };

  // --- Improved Formatting Functions ---
  function toggleFormat(command, value = null) {
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

  function toggleBlockFormat(tagName) {
    document.execCommand("formatBlock", false, tagName);
  }

  function toggleList(listType) {
    const command =
      listType === "ul" ? "insertUnorderedList" : "insertOrderedList";
    document.execCommand(command);
  }

  // --- Enhanced Event Handlers ---
  function handleKeydown(e) {
    // Handle undo/redo shortcuts
    if (e.ctrlKey || e.metaKey) {
      if (e.key === "z" && !e.shiftKey) {
        e.preventDefault();
        undo();
        return;
      } else if (e.key === "y" || (e.key === "z" && e.shiftKey)) {
        e.preventDefault();
        redo();
        return;
      }
    }

    // Handle markdown shortcuts on space - works on ANY row
    if (e.key === " ") {
      if (handleMarkdownShortcuts(e)) return;
    }

    // Improved Enter key handling
    if (e.key === "Enter") {
      if (handleEnterKey(e)) return;
    }

    // Better Tab handling
    if (e.key === "Tab") {
      e.preventDefault();
      document.execCommand(e.shiftKey ? "outdent" : "indent");
    }

    // Backspace handling - removes empty bullets/checkboxes
    if (e.key === "Backspace") {
      if (handleBackspaceKey(e)) return;
    }
  }

  function handleEnterKey(e) {
    const selection = window.getSelection();
    if (!selection.rangeCount) return false;

    const element =
      selection.anchorNode.nodeType === Node.TEXT_NODE
        ? selection.anchorNode.parentElement
        : selection.anchorNode;

    // Handle Enter in todo items
    const taskItem = element.closest(".task-item");
    if (taskItem) {
      e.preventDefault();

      // Check if we're at the end of the current task content
      const taskContent = taskItem.querySelector(".task-item-content");
      const range = selection.getRangeAt(0);
      const isAtEnd = range.endOffset === taskContent.textContent.length;

      if (isAtEnd && taskContent.textContent.trim() !== "") {
        // Create new todo item after current one
        const newTodo = createTodoElement();
        taskItem.insertAdjacentElement("afterend", newTodo);
        placeCursorInElement(newTodo.querySelector(".task-item-content"), true);
      } else {
        // Create a new div element instead of another todo
        const newDiv = document.createElement("div");
        newDiv.innerHTML = "&#8203;"; // Zero-width space
        taskItem.insertAdjacentElement("afterend", newDiv);
        placeCursorInElement(newDiv, true);
      }
      return true;
    }

    return false;
  }

  function handleBackspaceKey(e) {
    const selection = window.getSelection();
    if (!selection.rangeCount || selection.anchorOffset !== 0) return false;

    const range = selection.getRangeAt(0);
    if (!range.collapsed) return false;

    const element = range.startContainer;
    const parentElement =
      element.nodeType === Node.TEXT_NODE ? element.parentElement : element;

    // Handle backspace in empty todo items
    const taskItem = parentElement.closest(".task-item");
    if (
      taskItem &&
      taskItem.querySelector(".task-item-content").textContent.trim() === ""
    ) {
      e.preventDefault();
      const div = document.createElement("div");
      div.innerHTML = "&#8203;"; // Zero-width space
      taskItem.parentElement.replaceChild(div, taskItem);
      placeCursorInElement(div, true);
      return true;
    }

    return false;
  }

  function handleMarkdownShortcuts(e) {
    const selection = window.getSelection();
    if (!selection.rangeCount) return false;

    const range = selection.getRangeAt(0);
    if (!range.collapsed) return false;

    let node = range.startContainer;
    if (node.nodeType !== Node.TEXT_NODE) return false;

    const textContent = node.textContent.substring(0, range.startOffset);
    const parentElement = node.parentElement;

    const shortcuts = {
      "-": () => toggleList("ul"),
      "1.": () => toggleList("ol"),
      ">": () => toggleBlockFormat("blockquote"),
      "#": () => toggleBlockFormat("h1"),
      "##": () => toggleBlockFormat("h2"),
      "###": () => toggleBlockFormat("h3"),
      "-.": () => toggleTodoItem(),
    };

    const handler = shortcuts[textContent.trim()];
    if (
      handler &&
      parentElement !== notebook &&
      parentElement.tagName === "DIV"
    ) {
      e.preventDefault();
      // Clear the shortcut text
      node.textContent = node.textContent.substring(range.startOffset);
      // Apply the format
      handler();
      return true;
    }

    return false;
  }

  function handlePaste(e) {
    e.preventDefault();
    const text = e.clipboardData.getData("text/plain");
    document.execCommand("insertText", false, text);
  }

  function handleNotebookClick(e) {
    if (e.target.matches(".task-item-checkbox")) {
      const taskItem = e.target.closest(".task-item");
      const isChecked = e.target.checked;
      taskItem.classList.toggle("completed", isChecked);

      if (isChecked) {
        const activeMainTab = state.mainTabs.find(
          (t) => t.id === state.activeMainTabId
        );
        const activeSubTab = activeMainTab?.subTabs.find(
          (st) => st.id === state.activeSubTabId
        );

        if (!activeMainTab || !activeSubTab) return;

        const taskText =
          taskItem.querySelector(".task-item-content").textContent;
        if (taskText.trim()) {
          state.completedTasks.push({
            id: Date.now(),
            text: taskText,
            completedAt: Date.now(),
            tabName: `${activeMainTab.name} / ${activeSubTab.name}`,
          });
        }
      }
      saveData();
    } else if (e.target.matches(".done-log-delete-btn")) {
      const taskItem = e.target.closest(".done-log-item");
      const taskId = taskItem.dataset.taskId;

      // Remove the task from completedTasks
      state.completedTasks = state.completedTasks.filter(
        (task) =>
          (task.id ||
            `${task.completedAt}-${state.completedTasks.indexOf(task)}`) !==
          taskId
      );

      // Re-render the done log
      renderDoneLog();
      saveData();
    }
  }

  // --- Content Formatting ---
  function formatContentForCopy(htmlContent) {
    if (!htmlContent) return "";

    // Create a temporary div to parse the HTML
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
              // Regular div - process children
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
            // Process children for unknown tags
            const defaultChildren = Array.from(node.childNodes);
            defaultChildren.forEach((child) => processNode(child, depth));
            break;
        }
      }
    }

    // Process all child nodes
    Array.from(tempDiv.childNodes).forEach((node) => processNode(node));

    // Clean up extra whitespace
    return formattedText
      .replace(/\n\s*\n\s*\n/g, "\n\n") // Remove excessive line breaks
      .replace(/^\s+|\s+$/g, "") // Trim start and end
      .trim();
  }

  // --- Core Functionality ---
  function createTodoElement(content = "&#8203;") {
    const wrapper = document.createElement("div");
    wrapper.className = "task-item";

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

    return wrapper;
  }

  function toggleTodoItem() {
    const selection = window.getSelection();
    if (!selection.rangeCount) {
      // No selection - insert new todo item
      document.execCommand(
        "insertHTML",
        false,
        '<div class="task-item"><input type="checkbox" class="task-item-checkbox"><div class="task-item-content" contenteditable="true">&#8203;</div></div>'
      );
      const lastTaskItem = notebook.querySelector(
        ".task-item:last-of-type .task-item-content"
      );
      if (lastTaskItem) {
        placeCursorInElement(lastTaskItem, true);
      }
      return;
    }

    const range = selection.getRangeAt(0);
    const selectedElement =
      range.commonAncestorContainer.nodeType === Node.TEXT_NODE
        ? range.commonAncestorContainer.parentElement
        : range.commonAncestorContainer;

    // Check if we're in a bulleted list item
    const listItem = selectedElement.closest("li");
    if (listItem) {
      // Check if multiple list items are selected
      const allListItems = notebook.querySelectorAll("li");
      const selectedListItems = [];

      // Find all list items that are within the selection range
      allListItems.forEach((item) => {
        if (range.intersectsNode(item)) {
          selectedListItems.push(item);
        }
      });

      if (selectedListItems.length > 1) {
        // Convert multiple list items to todo items
        const todoItems = [];

        selectedListItems.forEach((item) => {
          const textContent = item.textContent.trim();
          const todoItem = createTodoElement(textContent);
          todoItems.push(todoItem);
        });

        // Replace all selected list items with todo items
        selectedListItems.forEach((item, index) => {
          item.parentNode.replaceChild(todoItems[index], item);
        });

        // Place cursor in the first converted todo item
        const firstTodoContent =
          todoItems[0].querySelector(".task-item-content");
        if (firstTodoContent) {
          placeCursorInElement(firstTodoContent, false);
        }
      } else {
        // Convert single bulleted list item to todo item
        const textContent = listItem.textContent.trim();
        const todoItem = createTodoElement(textContent);

        // Replace the list item with the todo item
        listItem.parentNode.replaceChild(todoItem, listItem);

        // Place cursor in the new todo item
        const todoContent = todoItem.querySelector(".task-item-content");
        if (todoContent) {
          placeCursorInElement(todoContent, false);
        }
      }

      // Save undo state
      saveUndoState();
      saveData();
    } else {
      // No list item selected - insert new todo item
      document.execCommand(
        "insertHTML",
        false,
        '<div class="task-item"><input type="checkbox" class="task-item-checkbox"><div class="task-item-content" contenteditable="true">&#8203;</div></div>'
      );
      const lastTaskItem = notebook.querySelector(
        ".task-item:last-of-type .task-item-content"
      );
      if (lastTaskItem) {
        placeCursorInElement(lastTaskItem, true);
      }
    }
  }

  function placeCursorInElement(el, atStart = false) {
    try {
      const range = document.createRange();
      const sel = window.getSelection();

      // Ensure element has content for cursor placement
      if (el.childNodes.length === 0) {
        el.appendChild(document.createTextNode("\u200B")); // Zero-width space
      }

      range.selectNodeContents(el);
      range.collapse(atStart);
      sel.removeAllRanges();
      sel.addRange(range);

      el.focus();
    } catch (e) {
      console.warn("Could not place cursor:", e);
    }
  }

  // --- Email Functionality ---
  function emailAllTabs() {
    const subject = `Sidekick Notes – ${new Date().toLocaleDateString()}`;
    const html = buildEmailHtml(state.mainTabs);
    const to = "tomas.roosguerra@gmail.com";
    const url = `https://mail.google.com/mail/u/0/?view=cm&fs=1&to=${encodeURIComponent(
      to
    )}&su=${encodeURIComponent(subject)}&tf=1`;

    chrome.tabs.create({ url }, (tab) => {
      const listener = (msg, sender) => {
        if (sender.tab?.id === tab.id && msg === "gmail_inject_ready") {
          chrome.tabs.sendMessage(tab.id, {
            action: "injectEmailBody",
            payload: { html },
          });
          chrome.runtime.onMessage.removeListener(listener);
        }
      };
      chrome.runtime.onMessage.addListener(listener);
    });
  }

  // New function to copy and open Gmail with auto-paste
  function copyAndEmailAllTabs() {
    // First copy the formatted content to clipboard
    const allContent = formatTabsForCopy(state.mainTabs);

    // Copy to clipboard
    navigator.clipboard
      .writeText(allContent)
      .then(() => {
        // Then open Gmail
        const subject = `Sidekick Notes – ${new Date().toLocaleDateString()}`;
        const to = "tomas.roosguerra@gmail.com";
        const url = `https://mail.google.com/mail/u/0/?view=cm&fs=1&to=${encodeURIComponent(
          to
        )}&su=${encodeURIComponent(subject)}&tf=1`;

        chrome.tabs.create({ url }, (tab) => {
          const listener = (msg, sender) => {
            if (sender.tab?.id === tab.id && msg === "gmail_inject_ready") {
              // Send both HTML and plain text versions
              chrome.tabs.sendMessage(tab.id, {
                action: "injectEmailBody",
                payload: {
                  html: buildEmailHtml(state.mainTabs),
                  plainText: allContent,
                  autoPaste: true,
                },
              });
              chrome.runtime.onMessage.removeListener(listener);
            }
          };
          chrome.runtime.onMessage.addListener(listener);
        });
      })
      .catch((err) => {
        console.error("Failed to copy to clipboard:", err);
        // Fallback to regular email if clipboard fails
        emailAllTabs();
      });
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

  // --- Improved Copy Formatting ---
  function formatTabsForCopy(mainTabs) {
    if (!mainTabs || mainTabs.length === 0) {
      return "No tabs found.";
    }

    return mainTabs
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
  }

  // --- Import Functionality ---
  async function importFromClipboard() {
    try {
      const clipboardText = await navigator.clipboard.readText();
      const importedTabs = parseImportedContent(clipboardText);

      if (importedTabs.length > 0) {
        // Add imported tabs to existing tabs
        state.mainTabs.push(...importedTabs);

        // Switch to the first imported tab
        if (importedTabs.length > 0) {
          state.activeMainTabId = importedTabs[0].id;
          state.activeSubTabId = importedTabs[0].subTabs[0].id;
        }

        render();
        saveData();

        // Show success message
        showNotification(
          `Imported ${importedTabs.length} tab(s) successfully!`
        );
      } else {
        showNotification("No valid tabs found in clipboard content.");
      }
    } catch (err) {
      console.error("Failed to read clipboard:", err);
      showNotification("Failed to read from clipboard. Please try again.");
    }
  }

  function parseImportedContent(text) {
    const tabs = [];
    const lines = text.split("\n");
    let currentTab = null;
    let currentSubTab = null;
    let currentContent = [];
    let inContent = false;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      // Main tab header (e.g., "# 1. Tab Name")
      if (line.match(/^#\s*\d+\.\s*.+/)) {
        // Save previous tab if exists
        if (currentTab) {
          if (currentSubTab) {
            const formattedContent = formatImportedContent(
              currentContent.join("\n")
            );
            currentSubTab.content = formattedContent;
            currentTab.subTabs.push(currentSubTab);
          }
          tabs.push(currentTab);
        }

        // Start new main tab
        const tabName = line.replace(/^#\s*\d+\.\s*/, "");
        currentTab = {
          id: Date.now() + Math.random(),
          name: tabName,
          subTabs: [],
        };
        currentSubTab = null;
        currentContent = [];
        inContent = false;
      }
      // Sub tab header (e.g., "## 1. Sub Tab Name")
      else if (line.match(/^##\s*\d+\.\s*.+/)) {
        // Save previous sub tab if exists
        if (currentSubTab) {
          const formattedContent = formatImportedContent(
            currentContent.join("\n")
          );
          currentSubTab.content = formattedContent;
          currentTab.subTabs.push(currentSubTab);
        }

        // Start new sub tab
        const subTabName = line.replace(/^##\s*\d+\.\s*/, "");
        currentSubTab = {
          id: Date.now() + Math.random(),
          name: subTabName,
          content: "",
        };
        currentContent = [];
        inContent = true;
      }
      // Separator line
      else if (line.match(/^=+$/)) {
        // This is a separator, continue
        continue;
      }
      // Content line
      else if (inContent && line) {
        currentContent.push(line);
      }
      // Empty line in content
      else if (inContent) {
        currentContent.push("");
      }
    }

    // Save the last tab and sub tab
    if (currentTab) {
      if (currentSubTab) {
        const formattedContent = formatImportedContent(
          currentContent.join("\n")
        );
        currentSubTab.content = formattedContent;
        currentTab.subTabs.push(currentSubTab);
      }
      tabs.push(currentTab);
    }

    return tabs;
  }

  // Function to convert imported plain text back to HTML format
  function formatImportedContent(text) {
    if (!text || text.trim() === "") return "";

    const lines = text.split("\n");
    let htmlContent = "";
    let inList = false;
    let listType = "";
    let listItems = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmedLine = line.trim();

      // Headers
      if (trimmedLine.match(/^###\s/)) {
        // Close any open list
        if (inList) {
          htmlContent += closeList(listType, listItems);
          inList = false;
          listItems = [];
        }
        const headerText = trimmedLine.replace(/^###\s/, "");
        htmlContent += `<h3>${headerText}</h3>`;
      } else if (trimmedLine.match(/^##\s/)) {
        // Close any open list
        if (inList) {
          htmlContent += closeList(listType, listItems);
          inList = false;
          listItems = [];
        }
        const headerText = trimmedLine.replace(/^##\s/, "");
        htmlContent += `<h2>${headerText}</h2>`;
      } else if (trimmedLine.match(/^#\s/)) {
        // Close any open list
        if (inList) {
          htmlContent += closeList(listType, listItems);
          inList = false;
          listItems = [];
        }
        const headerText = trimmedLine.replace(/^#\s/, "");
        htmlContent += `<h1>${headerText}</h1>`;
      }
      // Checkbox items (☐ or ☑)
      else if (trimmedLine.match(/^[☐☑]\s/)) {
        // Close any open list
        if (inList) {
          htmlContent += closeList(listType, listItems);
          inList = false;
          listItems = [];
        }
        const isChecked = trimmedLine.startsWith("☑");
        const taskText = trimmedLine.replace(/^[☐☑]\s/, "");
        htmlContent += `<div class="task-item ${isChecked ? "completed" : ""}">
          <input type="checkbox" class="task-item-checkbox" ${
            isChecked ? "checked" : ""
          }>
          <div class="task-item-content" contenteditable="true">${taskText}</div>
        </div>`;
      }
      // Bullet lists
      else if (trimmedLine.match(/^•\s/)) {
        if (!inList || listType !== "ul") {
          // Close previous list
          if (inList) {
            htmlContent += closeList(listType, listItems);
          }
          // Start new unordered list
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
          // Close previous list
          if (inList) {
            htmlContent += closeList(listType, listItems);
          }
          // Start new ordered list
          inList = true;
          listType = "ol";
          listItems = [];
        }
        const itemText = trimmedLine.replace(/^\d+\.\s/, "");
        listItems.push(itemText);
      }
      // Blockquotes
      else if (trimmedLine.match(/^>\s/)) {
        // Close any open list
        if (inList) {
          htmlContent += closeList(listType, listItems);
          inList = false;
          listItems = [];
        }
        const quoteText = trimmedLine.replace(/^>\s/, "");
        htmlContent += `<blockquote>${quoteText}</blockquote>`;
      }
      // Regular text
      else if (trimmedLine) {
        // Close any open list
        if (inList) {
          htmlContent += closeList(listType, listItems);
          inList = false;
          listItems = [];
        }
        // Handle bold and italic formatting
        const formattedText = formatInlineText(trimmedLine);
        htmlContent += `<div>${formattedText}</div>`;
      }
      // Empty line
      else {
        // Close any open list
        if (inList) {
          htmlContent += closeList(listType, listItems);
          inList = false;
          listItems = [];
        }
        htmlContent += "<div><br></div>";
      }
    }

    // Close any remaining list
    if (inList) {
      htmlContent += closeList(listType, listItems);
    }

    return htmlContent;
  }

  // Helper function to close lists
  function closeList(type, items) {
    if (items.length === 0) return "";

    const listItems = items
      .map((item) => {
        const formattedItem = formatInlineText(item);
        return `<li>${formattedItem}</li>`;
      })
      .join("");

    return `<${type}>${listItems}</${type}>`;
  }

  // Helper function to format inline text (bold, italic, etc.)
  function formatInlineText(text) {
    // Handle bold text (**text**)
    text = text.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");

    // Handle italic text (*text*)
    text = text.replace(/\*(.*?)\*/g, "<em>$1</em>");

    return text;
  }

  function showNotification(message) {
    // Create a simple notification
    const notification = document.createElement("div");
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: var(--accent-color);
      color: white;
      padding: 12px 20px;
      border-radius: 6px;
      font-size: 14px;
      z-index: 1000;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    `;
    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => {
      notification.remove();
    }, 3000);
  }

  // --- Initialization ---

  setupEventListeners();
  loadData();
});
