// Firebase Sync for Chrome Notes Extension
// Using direct API calls instead of Firebase SDK to avoid CSP issues
class FirebaseSync {
  constructor() {
    this.user = null;
    this.isInitialized = false;
    this.projectId = "chromenotes-52954";
    this.apiKey = "AIzaSyBx5HGGzz7e9FU3E1ra878mUqqaFRTzfxM";
  }

  async initialize() {
    try {
      console.log("Initializing Firebase sync (API mode)...");

      // Check if user is already signed in by checking localStorage
      const authData = localStorage.getItem("firebase_auth_data");
      if (authData) {
        try {
          const parsed = JSON.parse(authData);
          if (parsed.user && parsed.expiresAt > Date.now()) {
            this.user = parsed.user;
            console.log("User already signed in:", this.user.email);
            this.dispatchAuthEvent(true, this.user);
          }
        } catch (e) {
          console.log("Invalid auth data in localStorage");
        }
      }

      this.isInitialized = true;
      return true;
    } catch (error) {
      console.error("Firebase initialization failed:", error);
      return false;
    }
  }

  dispatchAuthEvent(isSignedIn, user) {
    const event = new CustomEvent("firebaseAuthChanged", {
      detail: { user: user, isSignedIn: isSignedIn },
    });
    document.dispatchEvent(event);
  }

  async signIn() {
    console.log("FirebaseSync.signIn() called");
    if (!this.isInitialized) {
      console.log("Firebase not initialized, initializing...");
      await this.initialize();
    }

    try {
      // For Chrome extensions, we need to use redirect-based auth
      // Open the web app in a new tab for authentication
      const webAppUrl = "https://chrome-notes-webapp.netlify.app";
      console.log("Opening web app URL:", webAppUrl);

      chrome.tabs.create({ url: webAppUrl });
      console.log("Tab created successfully");

      // Show notification to user
      this.showAuthNotification();
      console.log("Auth notification shown");

      // Start checking for auth status
      this.startAuthCheck();

      return true;
    } catch (error) {
      console.error("Sign in failed:", error);
      return false;
    }
  }

  startAuthCheck() {
    // Check every 2 seconds if user has signed in via web app
    const checkInterval = setInterval(() => {
      this.checkAuthStatus().then((isSignedIn) => {
        if (isSignedIn) {
          clearInterval(checkInterval);
          console.log("User signed in via web app!");
        }
      });
    }, 2000);

    // Stop checking after 5 minutes
    setTimeout(() => {
      clearInterval(checkInterval);
    }, 300000);
  }

  async checkAuthStatus() {
    try {
      // Check if web app has stored auth data in localStorage
      // We'll use a different approach - check if user opened web app
      const authData = localStorage.getItem("firebase_auth_data");
      if (authData) {
        try {
          const parsed = JSON.parse(authData);
          if (parsed.user && parsed.expiresAt > Date.now()) {
            this.user = parsed.user;
            this.dispatchAuthEvent(true, parsed.user);
            return true;
          }
        } catch (e) {
          console.log("Invalid auth data");
        }
      }
    } catch (error) {
      console.log("Auth check failed:", error);
    }
    return false;
  }

  showAuthNotification() {
    // Create a notification in the side panel
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
      max-width: 300px;
    `;
    notification.innerHTML = `
      <div style="font-weight: bold; margin-bottom: 8px;">Sign in to sync notes</div>
      <div style="font-size: 12px;">A new tab opened with the web app. Sign in there, then return to this extension.</div>
    `;
    document.body.appendChild(notification);

    setTimeout(() => {
      notification.remove();
    }, 8000);
  }

  async signOut() {
    if (this.auth) {
      await this.auth.signOut();
      this.user = null;
      console.log("Signed out successfully");
    }
  }

  async syncToCloud(data) {
    if (!this.user) {
      console.log("Not signed in");
      return false;
    }

    try {
      // Store data in localStorage for web app to pick up
      localStorage.setItem(
        "chrome_extension_data",
        JSON.stringify({
          data: data,
          timestamp: new Date().toISOString(),
          user: this.user.email,
        })
      );

      console.log("Data prepared for web app sync");
      return true;
    } catch (error) {
      console.error("Cloud sync failed:", error);
      return false;
    }
  }

  async syncFromCloud() {
    if (!this.user) {
      console.log("Not signed in");
      return null;
    }

    try {
      // Check if web app has synced data
      const webAppData = localStorage.getItem("web_app_data");
      if (webAppData) {
        const parsed = JSON.parse(webAppData);
        console.log("Data synced from web app");
        return parsed.data;
      }
      return null;
    } catch (error) {
      console.error("Cloud sync failed:", error);
      return null;
    }
  }

  setupRealtimeSync() {
    if (!this.user) {
      return;
    }

    // Check for updates every 30 seconds
    setInterval(() => {
      this.checkForUpdates();
    }, 30000);
  }

  async checkForUpdates() {
    try {
      const cloudData = await this.syncFromCloud();
      if (cloudData && this.isCloudDataNewer(cloudData)) {
        console.log("Real-time sync: Updating from cloud");
        this.mergeCloudData(cloudData);
      }
    } catch (error) {
      console.log("Update check failed:", error);
    }
  }

  isCloudDataNewer(cloudData) {
    // Simple check - you might want to implement more sophisticated conflict resolution
    const localData = JSON.parse(
      localStorage.getItem("sidekickNotesData_v2_4") || "{}"
    );
    const cloudTimestamp = new Date(cloudData.lastUpdated || 0);
    const localTimestamp = new Date(localData.lastUpdated || 0);

    return cloudTimestamp > localTimestamp;
  }

  mergeCloudData(cloudData) {
    // Dispatch custom event to notify sidepanel.js of cloud updates
    const event = new CustomEvent("cloudDataUpdate", { detail: cloudData });
    document.dispatchEvent(event);
  }

  getSyncStatus() {
    return {
      isSignedIn: !!this.user,
      userEmail: this.user?.email || null,
      isInitialized: this.isInitialized,
    };
  }
}

// Make FirebaseSync available globally
window.FirebaseSync = FirebaseSync;
