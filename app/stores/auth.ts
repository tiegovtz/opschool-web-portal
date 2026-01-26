// stores/auth.ts
import { defineStore } from 'pinia'

interface AuthState {
  token: string
}

export const useAuthStore = defineStore('auth', {
  state: (): AuthState => ({
    token: ''
  }),

  getters: {
    isAuthenticated: (state) => Boolean(state.token),
    getToken: (state) => state.token
  },

  actions: {
    setToken(token: string) {
      this.token = token
    },

    clearToken() {
      this.token = ''
    }
  }
})
