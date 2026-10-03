// ============================================
// PROSPER AUTH SYSTEM
// Unified authentication for all pages
// ============================================

const { createClient } = supabase;

const supabaseClient = createClient(
  "https://gthgxmyccwsygbopksgz.supabase.co",
  "sb_publishable_rj-DwglUPiebIvlhWzoHhg_2632GYgW"
);

window.supabase = supabaseClient;

const AuthSystem = {
  client: supabaseClient,
  currentUser: null,
  currentProfile: null,

  async init() {
    try {
      const { data: { user } } = await this.client.auth.getUser();
      this.currentUser = user;

      if (user) {
        const { data: profile } = await this.client
          .from("profiles")
          .select("id, Email, Username, pfp_url")
          .eq("id", user.id)
          .maybeSingle();

        this.currentProfile = profile || null;
      }

      console.log("AuthSystem initialized", {
        user: this.currentUser,
        profile: this.currentProfile
      });
    } catch (error) {
      console.error("Error initializing AuthSystem:", error);
    }
  },

  isLoggedIn() {
    return !!this.currentUser;
  },

  // ⭐ FIXED: always fetch fresh user
  async getUser() {
    const { data: { user } } = await this.client.auth.getUser();
    this.currentUser = user || null;
    return this.currentUser;
  },

  getProfile() {
    return this.currentProfile;
  },

  async register(email, password) {
    try {
      const { data, error } = await this.client.auth.signUp({ email, password });
      if (error) throw error;
      return { success: true, user: data.user };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  async login(email, password) {
    try {
      const { data, error } = await this.client.auth.signInWithPassword({ email, password });
      if (error) throw error;

      const sessionRes = await this.client.auth.getSession();
      const user = sessionRes.data.session?.user;

      if (!user) throw new Error("No user returned after login");

      const { data: profile } = await this.client
        .from("profiles")
        .select("Username")
        .eq("id", user.id)
        .maybeSingle();

      this.currentUser = user;
      this.currentProfile = profile || null;

      if (!profile || !profile.Username) {
        return { success: true, user, needsUsername: true };
      }

      return { success: true, user, needsUsername: false };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

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

  async setUsername(username) {
    try {
      if (!this.currentUser) throw new Error("Not logged in");
      if (username.length < 3) throw new Error("Username must be at least 3 characters");

      const { data: existing } = await this.client
        .from("profiles")
        .select("id")
        .eq("Username", username);

      if (existing && existing.length > 0) {
        throw new Error("Username already taken");
      }

      const { error } = await this.client
        .from("profiles")
        .update({ Username: username })
        .eq("id", this.currentUser.id);

      if (error) throw error;

      this.currentProfile = { ...(this.currentProfile || {}), Username: username };
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  isFavorited(itemId) {
    if (!this.isLoggedIn()) return false;
    const favorites = JSON.parse(localStorage.getItem(`favorites_${this.currentUser.id}`) || "[]");
    return favorites.includes(itemId);
  },

  addFavorite(itemId) {
    if (!this.isLoggedIn()) return;
    const key = `favorites_${this.currentUser.id}`;
    const favorites = JSON.parse(localStorage.getItem(key) || "[]");

    if (!favorites.includes(itemId)) {
      favorites.push(itemId);
      localStorage.setItem(key, JSON.stringify(favorites));
    }
  },

  removeFavorite(itemId) {
    if (!this.isLoggedIn()) return;
    const key = `favorites_${this.currentUser.id}`;
    const favorites = JSON.parse(localStorage.getItem(key) || "[]");

    const filtered = favorites.filter(id => id !== itemId);
    localStorage.setItem(key, JSON.stringify(filtered));
  },

  toggleAuthModal(action) {
    if (action === "login") {
      window.location.href = "index.html#account";
    }
  }
};

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => AuthSystem.init());
} else {
  AuthSystem.init();
}

