"use client"

import { useUserAuthStore } from '@/stores/user-auth-store'
import { useEffect } from 'react'

export default function UserAuthInitializer() {
  const { initializeAuth, initialized } = useUserAuthStore()

  useEffect(() => {
    if (!initialized) {
      initializeAuth()
    }
  }, [initializeAuth, initialized])

  return null
}