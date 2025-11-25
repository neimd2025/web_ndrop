"use client"

import { useAuthStore } from '@/stores/auth-store'
import { useEffect, useRef, useCallback } from 'react'

type AuthType = 'user' | 'admin'

export const useAuth = (type: AuthType = 'user') => {
  const store = useAuthStore()
  const initializeRef = useRef(false)
  const isUser = type === 'user'

  // 현재 타입에 따른 상태 선택
  const currentUser = isUser ? store.user : store.admin
  const currentSession = isUser ? store.userSession : store.adminSession
  const currentProfile = isUser ? store.userProfile : store.adminProfile
  const currentLoading = isUser ? store.userLoading : store.adminLoading
  const currentInitialized = isUser ? store.userInitialized : store.adminInitialized

  // 인증 초기화
  useEffect(() => {
    if (initializeRef.current || currentInitialized) return

    console.log(`[useAuth] Initializing ${type} auth`)
    initializeRef.current = true
    store.initializeAuth(type)
  }, [currentInitialized, store, type])

  // 로딩 타임아웃 처리
  useEffect(() => {
    if (!currentLoading || currentInitialized) return

    const timeout = setTimeout(() => {
      console.warn(`[useAuth] ${type} auth loading timeout - forcing initialization`)
      
      if (isUser) {
        store.setUserState({ 
          userLoading: false, 
          userInitialized: true 
        })
      } else {
        store.setAdminState({ 
          adminLoading: false, 
          adminInitialized: true 
        })
      }
    }, 5000)

    return () => clearTimeout(timeout)
  }, [currentLoading, currentInitialized, store, type, isUser])

  // 메서드들
  const signInWithEmail = useCallback((email: string, password: string) => {
    return store.signInWithEmail(email, password, type)
  }, [store, type])

  const signUpWithEmail = useCallback((email: string, password: string, name?: string) => {
    return store.signUpWithEmail(email, password, name, type)
  }, [store, type])

  const signInWithOAuth = useCallback((provider: 'google' | 'kakao' | 'naver', returnTo?: string) => {
    return store.signInWithOAuth(provider, type, returnTo)
  }, [store, type])

  const signOut = useCallback(async () => {
    console.log(`[useAuth] Starting sign out for ${type}`)
    
    try {
      await store.signOut(type)
      console.log(`[useAuth] Successfully signed out ${type}`)
    } catch (error) {
      console.error(`[useAuth] Sign out error for ${type}:`, error)
      throw error
    }
  }, [store, type])

  const resetAuth = useCallback(() => {
    console.log(`[useAuth] Resetting auth for ${type}`)
    store.resetAuth(type)
  }, [store, type])

  const clearAuthCache = useCallback(() => {
    console.log(`[useAuth] Clearing auth cache`)
    store.clearAuthCache()
  }, [store])

  return {
    // 상태
    user: currentUser,
    session: currentSession,
    profile: currentProfile,
    loading: currentLoading,
    initialized: currentInitialized,
    
    // 메서드
    signInWithEmail,
    signUpWithEmail,
    signInWithOAuth,
    signOut,
    clearAuthCache,
    resetAuth,
  }
}