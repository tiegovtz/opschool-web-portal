// stores/auth.ts
import { defineStore } from 'pinia';



export const useAuthStore = defineStore('auth', {
    state: () => ({
        token: process.client ? localStorage.getItem('auth_token') || '' : '',
        user: process.client
            ? JSON.parse(localStorage.getItem('auth_user') || 'null')
            : null,
    }),
    actions: {
        setToken(token: string) {
            this.token = token;
            if (process.client) {
                localStorage.setItem('auth_token', token);
            }
        },
        setUser(user: any) {
            this.user = user;
            if (process.client) {
                localStorage.setItem('auth_user', JSON.stringify(user));
            }
        },
        clearAuthData() {
            this.token = '';
            this.user = null;
            if (process.client) {
                localStorage.removeItem('auth_token');
                localStorage.removeItem('auth_user');
            }
        },
    },
    getters: {
        isAuthenticated: (state) => !!state.token,
        getUser: (state) => state.user,
    },
});
