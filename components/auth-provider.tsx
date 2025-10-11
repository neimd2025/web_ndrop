"use client"

import { useAuthStore } from '@/stores/auth-store'
import { useEffect, useRef } from 'react'

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const { initializeAuth } = useAuthStore()
  const initRef = useRef(false)
  const cleanupRef = useRef<(() => void)[]>([])

  useEffect(() => {
    if (initRef.current) return
    initRef.current = true

    const initAuth = async () => {
      try {
        const cleanup = await initializeAuth()
        if (cleanup) cleanupRef.current.push(cleanup)
      } catch (error) {
        console.error('Auth initialization error:', error)
      }
    }

    initAuth()

    return () => {
      cleanupRef.current.forEach(cleanup => {
        try {
          cleanup()
        } catch (error) {
          console.error('Auth cleanup error:', error)
        }
      })
      cleanupRef.current = []
    }
  }, [initializeAuth])

  return <>{children}</>
}
