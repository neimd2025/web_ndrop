"use client"

import { useAuth } from '@/hooks/use-auth'
import { useUserProfile } from '@/hooks/use-user-profile'
import { createContext, ReactNode, useContext, useEffect, useState } from 'react'

interface LoadingContextType {
  isLoading: boolean
  authLoading: boolean
  profileLoading: boolean
}

const LoadingContext = createContext<LoadingContextType>({
  isLoading: true,
  authLoading: true,
  profileLoading: true
})

export const useLoading = () => useContext(LoadingContext)

interface LoadingProviderProps {
  children: ReactNode
}

export const LoadingProvider = ({ children }: LoadingProviderProps) => {
  const { loading: authLoading, initialized: authInitialized } = useAuth()
  const { loading: profileLoading } = useUserProfile()
  const [isTimeout, setIsTimeout] = useState(false)

  // 안전장치: 로딩이 너무 길어지면 강제로 해제 (5초)
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsTimeout(true)
    }, 5000)
    return () => clearTimeout(timer)
  }, [])

  const isLoading = !isTimeout && (authLoading || !authInitialized || profileLoading)

  return (
    <LoadingContext.Provider value={{ isLoading, authLoading, profileLoading }}>
      {children}
    </LoadingContext.Provider>
  )
}
