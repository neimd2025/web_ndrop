"use client"

import { useAdminAuthStore } from '@/stores/admin-auth-store'
import { useUserAuthStore } from '@/stores/user-auth-store'
import { useEffect, useRef } from 'react'

export default function AuthInitializer() {
  const userAuth = useUserAuthStore()
  const adminAuth = useAdminAuthStore()
  const initRef = useRef(false)
  const cleanupRef = useRef<(() => void)[]>([])

  useEffect(() => {
    if (initRef.current) return
    initRef.current = true

    // 초기화 실행
    const initAuth = async () => {
      try {
        const [userCleanup, adminCleanup] = await Promise.all([
          userAuth.initializeAuth(),
          adminAuth.initializeAuth()
        ])

        // cleanup 함수들 저장
        if (userCleanup) cleanupRef.current.push(userCleanup)
        if (adminCleanup) cleanupRef.current.push(adminCleanup)
      } catch (error) {
        console.error('Auth initialization error:', error)
      }
    }

    initAuth()

    // 컴포넌트 언마운트 시 cleanup 실행
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
  }, [])

  return null
}
