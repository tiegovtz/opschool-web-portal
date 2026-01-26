import { useAuthStore } from '@/stores/auth'
import { pinia } from '@/stores/pinia'

export function authToken(): string {
  const auth = useAuthStore(pinia)

  return auth.token ?? ''
}

