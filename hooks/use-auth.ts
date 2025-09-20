"use client"

import { useUserAuthStore } from '@/stores/user-auth-store'
import { useEffect, useRef } from 'react'

export const useAuth = () => {
  const store = useUserAuthStore()
  const initializeRef = useRef(false)
  const cacheClearedRef = useRef(false)

  console.log('=== useAuth 훅 호출됨 ===')
  console.log('사용자:', store.user)
  console.log('로딩:', store.loading)
  console.log('초기화됨:', store.initialized)

  // 한 번만 캐시 클리어 (개발 중에만)
  useEffect(() => {
    if (!cacheClearedRef.current && typeof window !== 'undefined') {
      const shouldClear = localStorage.getItem('auth-cache-cleared') !== 'true'
      if (shouldClear) {
        console.log('캐시 클리어 중...')
        localStorage.setItem('auth-cache-cleared', 'true')
        store.clearAuthCache()
        cacheClearedRef.current = true
      }
    }
  }, [])

  useEffect(() => {
    // 이미 초기화를 시도했다면 스킵
    if (initializeRef.current) return

    // 초기화되지 않았으면 강제 초기화
    if (!store.initialized) {
      console.log('강제 auth 초기화 실행')
      initializeRef.current = true
      store.initializeAuth()
    }
  }, [store.initialized, store.initializeAuth])

  useEffect(() => {
    // 사용자가 있는데 로딩 중이면 로딩 상태 해제
    if (store.user && store.loading) {
      console.log('사용자 있음, 로딩 상태 해제')
      store.setLoading(false)
    }
  }, [store.user, store.loading, store.setLoading])

  return store
}
