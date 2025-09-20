'use client'

import { useUserAuthStore } from '@/stores/user-auth-store'
import { useEffect } from 'react'

export function UserAuthInitializer() {
  const { initializeAuth } = useUserAuthStore()

  useEffect(() => {
    let cleanup: (() => void) | undefined

    const setupAuth = async () => {
      cleanup = await initializeAuth()
    }

    setupAuth()

    return () => {
      if (cleanup) cleanup()
    }
  }, [initializeAuth])

  return null
}
