"use client"

import { useUserAuthStore } from '@/stores/user-auth-store'
import { useEffect } from 'react'

export const useUserAuth = () => {
  const store = useUserAuthStore()

  useEffect(() => {
    // 5초 후에도 로딩 중이면 강제 초기화
    const timeout = setTimeout(() => {
      if (store.loading && !store.initialized) {
        console.warn('User auth loading timeout - forcing initialization')
        store.setLoading(false)
        store.setInitialized(true)
      }
    }, 5000)

    return () => clearTimeout(timeout)
  }, [store.loading, store.initialized, store])

  return store
}