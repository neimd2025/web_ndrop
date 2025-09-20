"use client"

import { useAdminAuthStore } from '@/stores/admin-auth-store'
import { useEffect } from 'react'

export const useAdminAuth = () => {
  const store = useAdminAuthStore()

  useEffect(() => {
    // 5초 후에도 로딩 중이면 강제 초기화
    const timeout = setTimeout(() => {
      if (store.loading && !store.initialized) {
        console.warn('Admin auth loading timeout - forcing initialization')
        store.setLoading(false)
        store.setInitialized(true)
      }
    }, 5000)

    return () => clearTimeout(timeout)
  }, [store.loading, store.initialized, store])

  return store
}