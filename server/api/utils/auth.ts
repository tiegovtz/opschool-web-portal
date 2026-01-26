import { useAuthStore } from '@/stores/auth'
import { pinia } from '@/stores/pinia'

export function authHeader(): string {
  const auth = useAuthStore(pinia)

  return auth.token ?? ''
}

