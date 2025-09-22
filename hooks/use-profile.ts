"use client"

import { userProfileAPI } from '@/lib/supabase/database'
import { useAuth } from '@/hooks/use-auth'
import { useEffect, useState } from 'react'

interface UserProfile {
  id: string
  full_name: string | null
  personality_keywords: string[] | null
  [key: string]: any
}

export const useProfile = () => {
  const { user } = useAuth('user')
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [needsOnboarding, setNeedsOnboarding] = useState(false)

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) {
        setProfile(null)
        setLoading(false)
        setNeedsOnboarding(false)
        return
      }

      setLoading(true)
      try {
        const userProfile = await userProfileAPI.getUserProfile(user.id)

        if (!userProfile) {
          setNeedsOnboarding(true)
          setProfile(null)
        } else {
          setProfile(userProfile)
          // 프로필이 불완전한 경우 온보딩 필요
          const hasBasicInfo = userProfile.full_name &&
                              userProfile.personality_keywords &&
                              userProfile.personality_keywords.length > 0
          setNeedsOnboarding(!hasBasicInfo)
        }
      } catch (error) {
        console.error('프로필 가져오기 실패:', error)
        setNeedsOnboarding(true)
        setProfile(null)
      } finally {
        setLoading(false)
      }
    }

    fetchProfile()
  }, [user?.id]) // user 객체 대신 user.id만 의존성으로 사용

  return {
    profile,
    loading,
    needsOnboarding,
    refetchProfile: () => {
      if (user) {
        const fetchProfile = async () => {
          const userProfile = await userProfileAPI.getUserProfile(user.id)
          setProfile(userProfile)
          if (userProfile) {
            const hasBasicInfo = userProfile.full_name && 
                                userProfile.personality_keywords && 
                                userProfile.personality_keywords.length > 0
            setNeedsOnboarding(!hasBasicInfo)
          }
        }
        fetchProfile()
      }
    }
  }
}