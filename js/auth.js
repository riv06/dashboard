// Authentication utilities
const auth = {
    // Get token from localStorage
    getToken: () => {
        return localStorage.getItem('token');
    },

    // Get user from localStorage
    getUser: () => {
        const user = localStorage.getItem('user');
        return user ? JSON.parse(user) : null;
    },

    // Check if user is authenticated
    isAuthenticated: () => {
        return !!auth.getToken();
    },

    // Logout
    logout: () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = 'index.html';
    },

    // Get authorization header
    getAuthHeader: () => {
        const token = auth.getToken();
        return token ? { 'Authorization': `Bearer ${token}` } : {};
    },

    // Make authenticated API request
    fetch: async (url, options = {}) => {
        const headers = {
            'Content-Type': 'application/json',
            ...auth.getAuthHeader(),
            ...options.headers
        };

        const response = await fetch(url, {
            ...options,
            headers
        });

        if (response.status === 401) {
            alert('Sesión expirada. Por favor inicie sesión nuevamente.');
            auth.logout();
            throw new Error('Unauthorized');
        }

        return response;
    }
};

// Check authentication on protected pages
function requireAuth() {
    if (!auth.isAuthenticated()) {
        window.location.href = 'index.html';
    }
}

// Show user info in header
function showUserInfo() {
    const user = auth.getUser();
    const userNameElement = document.getElementById('user-name');
    if (userNameElement && user) {
        userNameElement.textContent = user.name || user.username;
    }
}
