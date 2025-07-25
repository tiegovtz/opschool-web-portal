// stores/auth.ts
import { defineStore } from 'pinia';



export const useAuthStore = defineStore('auth', {
    state: () => ({
        token: localStorage.getItem('auth_token') || '', // Load token from localStorage
        user: JSON.parse(localStorage.getItem('auth_user') || 'null'), // Load user from localStorage
    }),
    actions: {
        setToken(token: string) {
            this.token = token;
            localStorage.setItem('auth_token', token); // Persist token in localStorage
        },
        setUser(user: any) {
            this.user = user;
            localStorage.setItem('auth_user', JSON.stringify(user)); // Persist user in localStorage
        },
        clearAuthData() {
            this.token = '';
            this.user = null;
            localStorage.removeItem('auth_token'); // Remove token from localStorage
            localStorage.removeItem('auth_user'); // Remove user from localStorage
        },
    },
    getters: {
        isAuthenticated: (state) => !!state.token,
        getUser: (state) => state.user,
    },
});
