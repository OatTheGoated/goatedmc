// ============================================
// PROSPER AUTH SYSTEM
// Unified authentication for all pages
// ============================================

const { createClient } = supabase;

const supabaseClient = createClient(
  "https://gthgxmyccwsygbopksgz.supabase.co",
  "sb_publishable_rj-DwglUPiebIvlhWzoHhg_2632GYgW"
);

// AuthSystem object - safe to reference anywhere
const AuthSystem = {
  client: supabaseClient,
  currentUser: null,
  currentProfile: null,

  // Initialize auth state
  async init() {
    try {
      const { data: { user } } = await this.client.auth.getUser();
      this.currentUser = user;

      if (user) {
        const { data: profile, error: profileError } = await this.client
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .maybeSingle();

        if (profileError) {
          console.error("Profile load error:", profileError.message);
        }

        this.currentProfile = profile || null;
      }

      console.log("AuthSystem initialized", { user: this.currentUser, profile: this.currentProfile });
    } catch (error) {
      console.error("Error initializing AuthSystem:", error);
    }
  },

  // Check if user is logged in
  isLoggedIn() {
    return !!this.currentUser;
  },

  // Get current user
  getUser() {
    return this.currentUser;
  },

  // Get current profile
  getProfile() {
    return this.currentProfile;
  },

  // Register new user
  async register(email, password) {
    try {
      const { data, error } = await this.client.auth.signUp({ email, password });
      if (error) throw error;
      return { success: true, user: data.user };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  // Login user
  async login(email, password) {
    try {
      const { data, error } = await this.client.auth.signInWithPassword({ email, password });
      if (error) throw error;

      // Refresh session
      const sessionRes = await this.client.auth.getSession();
      const user = sessionRes.data.session?.user;

      if (!user) throw new Error("No user returned after login");

      // DO NOT insert into profiles here anymore
      // Just check if a profile exists
      const { data: profile, error: profileError } = await this.client
        .from("profiles")
        .select("Username")
        .eq("id", user.id)
        .maybeSingle();

      if (profileError) {
        console.error("Profile check error:", profileError.message);
      }

      this.currentUser = user;
      this.currentProfile = profile || null;

      // If no profile or no Username, send user to set-username
      if (!profile || !profile.Username) {
        return { success: true, user, needsUsername: true };
      }

      return { success: true, user, needsUsername: false };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  // Logout user
  async logout() {
    try {
      await this.client.auth.signOut();
      this.currentUser = null;
      this.currentProfile = null;
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  // Save username
  async setUsername(username) {
    try {
      if (!this.currentUser) throw new Error("Not logged in");
      if (username.length < 3) throw new Error("Username must be at least 3 characters");

      // Check if username exists
      const { data: existing, error: lookupError } = await this.client
        .from("profiles")
        .select("id")
        .eq("Username", username);

      if (lookupError) {
        throw new Error("Error checking username: " + lookupError.message);
      }

      if (existing && existing.length > 0) {
        throw new Error("Username already taken");
      }

      // Update username
      const { error: updateError } = await this.client
        .from("profiles")
        .update({ Username: username })
        .eq("id", this.currentUser.id);

      if (updateError) throw updateError;

      this.currentProfile = { ...(this.currentProfile || {}), Username: username };
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  // Check if item is favorited
  isFavorited(itemId) {
    if (!this.isLoggedIn()) return false;
    
    const favorites = JSON.parse(localStorage.getItem(`favorites_${this.currentUser.id}`) || "[]");
    return favorites.includes(itemId);
  },

  // Add favorite
  addFavorite(itemId) {
    if (!this.isLoggedIn()) return;
    
    const key = `favorites_${this.currentUser.id}`;
    const favorites = JSON.parse(localStorage.getItem(key) || "[]");
    
    if (!favorites.includes(itemId)) {
      favorites.push(itemId);
      localStorage.setItem(key, JSON.stringify(favorites));
    }
  },

  // Remove favorite
  removeFavorite(itemId) {
    if (!this.isLoggedIn()) return;
    
    const key = `favorites_${this.currentUser.id}`;
    const favorites = JSON.parse(localStorage.getItem(key) || "[]");
    
    const filtered = favorites.filter(id => id !== itemId);
    localStorage.setItem(key, JSON.stringify(filtered));
  },

  // Toggle auth modal
  toggleAuthModal(action) {
    console.log("Auth action:", action);
    if (action === "login") {
      window.location.href = "index.html#account";
    }
  }
};

// Auto-initialize when page loads
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    AuthSystem.init();
  });
} else {
  AuthSystem.init();
}

