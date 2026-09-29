/**
 * Minecraft-Integrated Authentication System
 * Features: User accounts, favorites, and Minecraft player head profile pictures
 * Stores user data in localStorage (no backend required for basic setup)
 */

const AuthSystem = {
    storageKey: 'prosper_user',
    minecraftApiUrl: 'https://api.mojang.com/users/profiles/minecraft',
    minecraftTexturesUrl: 'https://crafatar.com/avatars',
    minecraftHeadUrl: 'https://crafatar.com/renders/head',
    
    /**
     * Initialize auth system on page load
     */
    init() {
        this.updateUI();
        this.setupEventListeners();
    },

    /**
     * Create new user account
     */
    register(username, email, password, minecraftUuid = null) {
        if (!username || !email || !password) {
            return { success: false, error: 'All fields required' };
        }

        if (username.length < 3) {
            return { success: false, error: 'Username must be at least 3 characters' };
        }

        // Check if username already exists
        if (this.getUserByUsername(username)) {
            return { success: false, error: 'Username already taken' };
        }

        const user = {
            id: this.generateId(),
            username,
            email,
            password: this.hashPassword(password),
            minecraftUuid: minecraftUuid || null,
            minecraftUsername: null,
            profilePicUrl: null,
            createdAt: new Date().toISOString(),
            favorites: []
        };

        const users = this.getAllUsers();
        users.push(user);
        localStorage.setItem('prosper_users', JSON.stringify(users));

        return { success: true, message: 'Account created successfully', user };
    },

    /**
     * Login user
     */
    login(username, password) {
        const user = this.getUserByUsername(username);
        
        if (!user) {
            return { success: false, error: 'User not found' };
        }

        if (user.password !== this.hashPassword(password)) {
            return { success: false, error: 'Incorrect password' };
        }

        // Store current user session
        const sessionUser = { ...user };
        delete sessionUser.password;
        localStorage.setItem(this.storageKey, JSON.stringify(sessionUser));

        return { success: true, message: 'Logged in successfully', user: sessionUser };
    },

    /**
     * Logout current user
     */
    logout() {
        localStorage.removeItem(this.storageKey);
        this.updateUI();
        return { success: true, message: 'Logged out successfully' };
    },

    /**
     * Get current logged-in user
     */
    getCurrentUser() {
        const user = localStorage.getItem(this.storageKey);
        return user ? JSON.parse(user) : null;
    },

    /**
     * Check if user is logged in
     */
    isLoggedIn() {
        return this.getCurrentUser() !== null;
    },

    /**
     * Get user by username
     */
    getUserByUsername(username) {
        const users = this.getAllUsers();
        return users.find(u => u.username === username);
    },

    /**
     * Get all users (for demo purposes)
     */
    getAllUsers() {
        const users = localStorage.getItem('prosper_users');
        return users ? JSON.parse(users) : [];
    },

    /**
     * Resolve Minecraft username/UUID to get official UUID
     * @param {string} minecraftIdentifier - Username or UUID
     * @returns {Promise} - Resolves to UUID and username
     */
    async resolveMinecraftUuid(minecraftIdentifier) {
        try {
            // If it's already a UUID format, validate it
            if (this.isValidUuid(minecraftIdentifier)) {
                return {
                    success: true,
                    uuid: minecraftIdentifier.replace(/-/g, ''),
                    username: minecraftIdentifier
                };
            }

            // Query Mojang API to resolve username to UUID
            const response = await fetch(`${this.minecraftApiUrl}/${minecraftIdentifier}`);
            
            if (!response.ok) {
                return {
                    success: false,
                    error: 'Minecraft username not found'
                };
            }

            const data = await response.json();
            return {
                success: true,
                uuid: data.id,
                username: data.name
            };
        } catch (error) {
            console.error('Error resolving Minecraft UUID:', error);
            return {
                success: false,
                error: 'Failed to connect to Minecraft servers. Please try again.'
            };
        }
    },

    /**
     * Check if string is valid UUID format
     */
    isValidUuid(uuid) {
        const uuidRegex = /^[0-9a-f]{8}-?[0-9a-f]{4}-?[0-9a-f]{4}-?[0-9a-f]{4}-?[0-9a-f]{12}$/i;
        return uuidRegex.test(uuid);
    },

    /**
     * Link Minecraft account to user profile
     */
    async linkMinecraftAccount(minecraftIdentifier) {
        const user = this.getCurrentUser();
        if (!user) {
            return { success: false, error: 'Must be logged in' };
        }

        // Resolve UUID
        const resolution = await this.resolveMinecraftUuid(minecraftIdentifier);
        if (!resolution.success) {
            return { success: false, error: resolution.error };
        }

        // Get player head URL
        const headUrl = `${this.minecraftHeadUrl}/${resolution.uuid}?scale=8`;
        
        // Update user in session
        user.minecraftUuid = resolution.uuid;
        user.minecraftUsername = resolution.username;
        user.profilePicUrl = headUrl;
        
        // Update in storage
        const allUsers = this.getAllUsers();
        const userIndex = allUsers.findIndex(u => u.id === user.id);
        if (userIndex !== -1) {
            allUsers[userIndex] = { ...allUsers[userIndex], ...user };
            localStorage.setItem('prosper_users', JSON.stringify(allUsers));
        }
        
        // Update session
        localStorage.setItem(this.storageKey, JSON.stringify(user));

        return {
            success: true,
            message: `Linked Minecraft account: ${resolution.username}`,
            user
        };
    },

    /**
     * Unlink Minecraft account
     */
    unlinkMinecraftAccount() {
        const user = this.getCurrentUser();
        if (!user) {
            return { success: false, error: 'Must be logged in' };
        }

        user.minecraftUuid = null;
        user.minecraftUsername = null;
        user.profilePicUrl = null;

        // Update in storage
        const allUsers = this.getAllUsers();
        const userIndex = allUsers.findIndex(u => u.id === user.id);
        if (userIndex !== -1) {
            allUsers[userIndex] = allUsers[userIndex];
            allUsers[userIndex].minecraftUuid = null;
            allUsers[userIndex].minecraftUsername = null;
            allUsers[userIndex].profilePicUrl = null;
            localStorage.setItem('prosper_users', JSON.stringify(allUsers));
        }

        localStorage.setItem(this.storageKey, JSON.stringify(user));
        return { success: true, message: 'Minecraft account unlinked' };
    },

    /**
     * Get profile picture URL
     */
    getProfilePicUrl(user = null) {
        const targetUser = user || this.getCurrentUser();
        if (!targetUser) return null;
        
        return targetUser.profilePicUrl || `${this.minecraftHeadUrl}/00000000-0000-0000-0000-000000000000?scale=8`;
    },

    /**
     * Add schematic to user favorites
     */
    addFavorite(schematicId) {
        const user = this.getCurrentUser();
        if (!user) {
            return { success: false, error: 'Must be logged in' };
        }

        if (user.favorites.includes(schematicId)) {
            return { success: false, error: 'Already favorited' };
        }

        user.favorites.push(schematicId);
        
        // Update in storage
        const allUsers = this.getAllUsers();
        const userIndex = allUsers.findIndex(u => u.id === user.id);
        if (userIndex !== -1) {
            allUsers[userIndex].favorites = user.favorites;
            localStorage.setItem('prosper_users', JSON.stringify(allUsers));
        }
        
        localStorage.setItem(this.storageKey, JSON.stringify(user));

        return { success: true, message: 'Added to favorites' };
    },

    /**
     * Remove schematic from user favorites
     */
    removeFavorite(schematicId) {
        const user = this.getCurrentUser();
        if (!user) {
            return { success: false, error: 'Must be logged in' };
        }

        user.favorites = user.favorites.filter(id => id !== schematicId);
        
        // Update in storage
        const allUsers = this.getAllUsers();
        const userIndex = allUsers.findIndex(u => u.id === user.id);
        if (userIndex !== -1) {
            allUsers[userIndex].favorites = user.favorites;
            localStorage.setItem('prosper_users', JSON.stringify(allUsers));
        }

        localStorage.setItem(this.storageKey, JSON.stringify(user));

        return { success: true, message: 'Removed from favorites' };
    },

    /**
     * Check if schematic is favorited
     */
    isFavorited(schematicId) {
        const user = this.getCurrentUser();
        return user ? user.favorites.includes(schematicId) : false;
    },

    /**
     * Simple password hash (for demo - use bcrypt in production)
     */
    hashPassword(password) {
        return btoa(password); // Base64 encoding (NOT secure for production!)
    },

    /**
     * Generate unique ID
     */
    generateId() {
        return `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    },

    /**
     * Update UI to reflect auth state
     */
    updateUI() {
        const user = this.getCurrentUser();
        const authContainer = document.getElementById('auth-container');
        
        if (!authContainer) return;

        if (user) {
            const profilePic = this.getProfilePicUrl(user);
            const minecraftInfo = user.minecraftUsername 
                ? `<div class="minecraft-badge">⛏️ ${user.minecraftUsername}</div>`
                : '';
            
            authContainer.innerHTML = `
                <div class="user-menu">
                    <img src="${profilePic}" alt="${user.username}" class="profile-pic" onerror="this.src='data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 8 8%22%3E%3Crect fill=%2200ff88%22 width=%228%22 height=%228%22/%3E%3C/svg%3E'">
                    <div class="user-info">
                        <div class="username">👤 ${this.escapeHtml(user.username)}</div>
                        ${minecraftInfo}
                    </div>
                    <button class="btn-profile" onclick="AuthSystem.toggleProfileModal()">Profile</button>
                    <button class="btn-logout" onclick="AuthSystem.logout(); location.reload();">Logout</button>
                </div>
            `;
        } else {
            authContainer.innerHTML = `
                <div class="auth-buttons">
                    <button class="btn-login" onclick="AuthSystem.toggleAuthModal('login')">Login</button>
                    <button class="btn-register" onclick="AuthSystem.toggleAuthModal('register')">Register</button>
                </div>
            `;
        }
    },

    /**
     * Toggle authentication modal
     */
    toggleAuthModal(mode) {
        const modal = document.getElementById('auth-modal');
        if (!modal) return;

        if (modal.style.display === 'block') {
            modal.style.display = 'none';
        } else {
            modal.style.display = 'block';
            this.switchAuthMode(mode);
        }
    },

    /**
     * Toggle profile modal
     */
    toggleProfileModal() {
        const modal = document.getElementById('profile-modal');
        if (!modal) return;

        if (modal.style.display === 'block') {
            modal.style.display = 'none';
        } else {
            modal.style.display = 'block';
            this.loadProfileData();
        }
    },

    /**
     * Load and display profile data
     */
    loadProfileData() {
        const user = this.getCurrentUser();
        if (!user) return;

        const profileContent = document.getElementById('profile-content');
        if (!profileContent) return;

        const profilePic = this.getProfilePicUrl(user);
        const minecraftSection = user.minecraftUsername 
            ? `
            <div class="profile-section">
                <h4>Minecraft Account</h4>
                <p><strong>Username:</strong> ${this.escapeHtml(user.minecraftUsername)}</p>
                <p><strong>UUID:</strong> <code>${user.minecraftUuid}</code></p>
                <button class="btn-small" onclick="AuthSystem.unlinkMinecraftAccount(); AuthSystem.loadProfileData();">Unlink Account</button>
            </div>
            `
            : `
            <div class="profile-section">
                <h4>Link Minecraft Account</h4>
                <p>Link your Minecraft account to display your player head as your profile picture.</p>
                <input type="text" id="minecraft-username-input" placeholder="Enter Minecraft username or UUID" class="profile-input">
                <button class="btn-small" onclick="AuthSystem.linkMinecraftAccountFromInput();">Link Account</button>
                <div id="minecraft-link-message" class="profile-message"></div>
            </div>
            `;

        profileContent.innerHTML = `
            <div class="profile-header">
                <img src="${profilePic}" alt="${user.username}" class="profile-pic-large">
                <div class="profile-details">
                    <h3>${this.escapeHtml(user.username)}</h3>
                    <p>${this.escapeHtml(user.email)}</p>
                    <p class="profile-date">Joined ${new Date(user.createdAt).toLocaleDateString()}</p>
                </div>
            </div>

            ${minecraftSection}

            <div class="profile-section">
                <h4>Favorites</h4>
                <p>${user.favorites.length} schematic${user.favorites.length !== 1 ? 's' : ''} favorited</p>
            </div>

            <div class="profile-section">
                <h4>Account Settings</h4>
                <button class="btn-small btn-danger" onclick="if(confirm('Are you sure? This cannot be undone.')) AuthSystem.deleteAccount();">Delete Account</button>
            </div>
        `;
    },

    /**
     * Link Minecraft account from input field
     */
    async linkMinecraftAccountFromInput() {
        const input = document.getElementById('minecraft-username-input');
        if (!input || !input.value.trim()) {
            this.showProfileMessage('Please enter a Minecraft username or UUID', false);
            return;
        }

        const result = await this.linkMinecraftAccount(input.value.trim());
        this.showProfileMessage(result.message || result.error, result.success);

        if (result.success) {
            setTimeout(() => {
                this.loadProfileData();
                this.updateUI();
            }, 1500);
        }
    },

    /**
     * Delete user account
     */
    deleteAccount() {
        const user = this.getCurrentUser();
        if (!user) return;

        const allUsers = this.getAllUsers();
        const updatedUsers = allUsers.filter(u => u.id !== user.id);
        localStorage.setItem('prosper_users', JSON.stringify(updatedUsers));
        
        this.logout();
        alert('Account deleted. You will be logged out.');
        location.reload();
    },

    /**
     * Show profile modal message
     */
    showProfileMessage(message, isSuccess) {
        const messageDiv = document.getElementById('minecraft-link-message');
        if (!messageDiv) return;

        messageDiv.textContent = message;
        messageDiv.className = `profile-message ${isSuccess ? 'success' : 'error'}`;
        messageDiv.style.display = 'block';

        setTimeout(() => {
            messageDiv.style.display = 'none';
        }, 4000);
    },

    /**
     * Switch between login and register modes
     */
    switchAuthMode(mode) {
        document.querySelectorAll('.auth-form').forEach(form => form.style.display = 'none');
        document.getElementById(`${mode}-form`).style.display = 'block';
        document.querySelectorAll('.auth-tab').forEach(tab => tab.classList.remove('active'));
        document.querySelector(`[data-mode="${mode}"]`).classList.add('active');
    },

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Close auth modal when clicking outside
        const authModal = document.getElementById('auth-modal');
        if (authModal) {
            window.addEventListener('click', (e) => {
                if (e.target === authModal) {
                    authModal.style.display = 'none';
                }
            });
        }

        // Close profile modal when clicking outside
        const profileModal = document.getElementById('profile-modal');
        if (profileModal) {
            window.addEventListener('click', (e) => {
                if (e.target === profileModal) {
                    profileModal.style.display = 'none';
                }
            });
        }

        // Register form submission
        const registerForm = document.getElementById('register-form-element');
        if (registerForm) {
            registerForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const username = document.getElementById('register-username').value;
                const email = document.getElementById('register-email').value;
                const password = document.getElementById('register-password').value;
                const minecraftUsername = document.getElementById('register-minecraft').value;

                let minecraftUuid = null;

                // Validate and resolve Minecraft username if provided
                if (minecraftUsername.trim()) {
                    this.resolveMinecraftUuid(minecraftUsername).then(result => {
                        if (result.success) {
                            minecraftUuid = result.uuid;
                            this.completeRegistration(username, email, password, minecraftUuid, registerForm);
                        } else {
                            this.showAuthMessage(result.error, false);
                        }
                    });
                } else {
                    this.completeRegistration(username, email, password, minecraftUuid, registerForm);
                }
            });
        }

        // Login form submission
        const loginForm = document.getElementById('login-form-element');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const username = document.getElementById('login-username').value;
                const password = document.getElementById('login-password').value;

                const result = this.login(username, password);
                this.showAuthMessage(result.message || result.error, result.success);

                if (result.success) {
                    setTimeout(() => {
                        authModal.style.display = 'none';
                        this.updateUI();
                        location.reload();
                    }, 1500);
                }
            });
        }
    },

    /**
     * Complete registration
     */
    completeRegistration(username, email, password, minecraftUuid, registerForm) {
        const result = this.register(username, email, password, minecraftUuid);
        this.showAuthMessage(result.message || result.error, result.success);

        if (result.success) {
            setTimeout(() => {
                this.switchAuthMode('login');
                registerForm.reset();
            }, 1500);
        }
    },

    /**
     * Show auth modal message
     */
    showAuthMessage(message, isSuccess) {
        const messageDiv = document.getElementById('auth-message');
        if (!messageDiv) return;

        messageDiv.textContent = message;
        messageDiv.className = `auth-message ${isSuccess ? 'success' : 'error'}`;
        messageDiv.style.display = 'block';

        setTimeout(() => {
            messageDiv.style.display = 'none';
        }, 3000);
    },

    /**
     * Escape HTML to prevent XSS
     */
    escapeHtml(text) {
        const div = document.createElement("div");
        div.textContent = text;
        return div.innerHTML;
    }
};

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    AuthSystem.init();
});
