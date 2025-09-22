"use client"

import { useAuthStore } from '@/stores/auth-store'
import { useEffect, useRef } from 'react'

type AuthType = 'user' | 'admin'

export const useAuth = (type: AuthType = 'user') => {
  const store = useAuthStore()
  const initializeRef = useRef(false)

  const isUser = type === 'user'
  const currentUser = isUser ? store.user : store.admin
  const currentSession = isUser ? store.userSession : store.adminSession
  const currentProfile = isUser ? store.userProfile : store.adminProfile
  const currentLoading = isUser ? store.userLoading : store.adminLoading
  const currentInitialized = isUser ? store.userInitialized : store.adminInitialized

  useEffect(() => {
    if (initializeRef.current) return

    if (!currentInitialized) {
      initializeRef.current = true
      store.initializeAuth(type)
    }
  }, [currentInitialized, store, type])

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (currentLoading && !currentInitialized) {
        console.warn(`${type} auth loading timeout - forcing initialization`)
        if (isUser) {
          store.setUserState({ userLoading: false, userInitialized: true })
        } else {
          store.setAdminState({ adminLoading: false, adminInitialized: true })
        }
      }
    }, 5000)

    return () => clearTimeout(timeout)
  }, [currentLoading, currentInitialized, store, type, isUser])

  return {
    user: currentUser,
    session: currentSession,
    profile: currentProfile,
    loading: currentLoading,
    initialized: currentInitialized,
    signInWithEmail: (email: string, password: string) => store.signInWithEmail(email, password, type),
    signUpWithEmail: (email: string, password: string, name?: string) => store.signUpWithEmail(email, password, name, type),
    signInWithOAuth: (provider: 'google' | 'kakao' | 'naver', returnTo?: string) => store.signInWithOAuth(provider, type, returnTo),
    signOut: () => store.signOut(type),
    clearAuthCache: store.clearAuthCache,
    resetAuth: () => store.resetAuth(type),
  }
}