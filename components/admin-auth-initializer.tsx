"use client"

import { useAdminAuthStore } from '@/stores/admin-auth-store'
import { useEffect } from 'react'

export default function AdminAuthInitializer() {
  const { initializeAuth, initialized } = useAdminAuthStore()

  useEffect(() => {
    if (!initialized) {
      initializeAuth()
    }
  }, [initializeAuth, initialized])

  return null
}