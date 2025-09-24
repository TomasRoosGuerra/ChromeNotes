// Firebase Sync for Chrome Notes Extension
class FirebaseSync {
  constructor() {
    this.user = null;
    this.db = null;
    this.auth = null;
    this.isInitialized = false;
  }

  async initialize() {
    try {
      // Import Firebase modules dynamically
      const { initializeApp } = await import(
        "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js"
      );
      const {
        getAuth,
        signInWithPopup,
        GoogleAuthProvider,
        onAuthStateChanged,
      } = await import(
        "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js"
      );
      const { getFirestore, doc, setDoc, getDoc, onSnapshot } = await import(
        "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js"
      );

      // Firebase config - Your actual config
      const firebaseConfig = {
        apiKey: "AIzaSyBx5HGGzz7e9FU3E1ra878mUqqaFRTzfxM",
        authDomain: "chromenotes-52954.firebaseapp.com",
        projectId: "chromenotes-52954",
        storageBucket: "chromenotes-52954.firebasestorage.app",
        messagingSenderId: "34266562578",
        appId: "1:34266562578:web:c8d2cb76de1092b5f3d8cb",
      };

      // Initialize Firebase
      const app = initializeApp(firebaseConfig);
      this.auth = getAuth(app);
      this.db = getFirestore(app);

      // Set up auth state listener
      onAuthStateChanged(this.auth, (user) => {
        this.user = user;
        if (user) {
          console.log("User signed in:", user.email);
          this.setupRealtimeSync();
        } else {
          console.log("User signed out");
        }
      });

      this.isInitialized = true;
      return true;
    } catch (error) {
      console.error("Firebase initialization failed:", error);
      return false;
    }
  }

  async signIn() {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(this.auth, provider);
      this.user = result.user;
      console.log("Signed in successfully:", this.user.email);
      return true;
    } catch (error) {
      console.error("Sign in failed:", error);
      return false;
    }
  }

  async signOut() {
    if (this.auth) {
      await this.auth.signOut();
      this.user = null;
      console.log("Signed out successfully");
    }
  }

  async syncToCloud(data) {
    if (!this.user || !this.db) {
      console.log("Not signed in or Firebase not initialized");
      return false;
    }

    try {
      const userDocRef = doc(this.db, "users", this.user.uid);
      await setDoc(
        userDocRef,
        {
          notesData: data,
          lastUpdated: new Date().toISOString(),
          email: this.user.email,
        },
        { merge: true }
      );

      console.log("Data synced to cloud successfully");
      return true;
    } catch (error) {
      console.error("Cloud sync failed:", error);
      return false;
    }
  }

  async syncFromCloud() {
    if (!this.user || !this.db) {
      console.log("Not signed in or Firebase not initialized");
      return null;
    }

    try {
      const userDocRef = doc(this.db, "users", this.user.uid);
      const docSnap = await getDoc(userDocRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        console.log("Data synced from cloud successfully");
        return data.notesData;
      } else {
        console.log("No cloud data found");
        return null;
      }
    } catch (error) {
      console.error("Cloud sync failed:", error);
      return null;
    }
  }

  setupRealtimeSync() {
    if (!this.user || !this.db) {
      return;
    }

    const userDocRef = doc(this.db, "users", this.user.uid);

    // Listen for real-time updates
    onSnapshot(userDocRef, (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        const cloudData = data.notesData;

        // Only sync if the cloud data is newer than local data
        if (cloudData && this.isCloudDataNewer(cloudData)) {
          console.log("Real-time sync: Updating from cloud");
          this.mergeCloudData(cloudData);
        }
      }
    });
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
