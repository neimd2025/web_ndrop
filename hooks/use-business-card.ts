"use client"

import { businessCardAPI } from '@/lib/supabase/database'
import { useAuth } from '@/hooks/use-auth'
import { useEffect, useState } from 'react'

interface BusinessCard {
  id: string
  user_id: string | null
  [key: string]: any
}

export const useBusinessCard = () => {
  const { user } = useAuth('user')
  const [businessCard, setBusinessCard] = useState<BusinessCard | null>(null)
  const [loading, setLoading] = useState(true)
  const [needsBusinessCard, setNeedsBusinessCard] = useState(false)

  useEffect(() => {
    const fetchBusinessCard = async () => {
      if (!user) {
        setBusinessCard(null)
        setLoading(false)
        return
      }

      setLoading(true)
      try {
        const card = await businessCardAPI.getUserBusinessCard(user.id)
        
        if (!card) {
          setNeedsBusinessCard(true)
        } else {
          setBusinessCard(card)
          setNeedsBusinessCard(false)
        }
      } catch (error) {
        console.error('명함 가져오기 실패:', error)
        setNeedsBusinessCard(true)
      } finally {
        setLoading(false)
      }
    }

    fetchBusinessCard()
  }, [user])

  return {
    businessCard,
    loading,
    needsBusinessCard,
    refetchBusinessCard: () => {
      if (user) {
        const fetchCard = async () => {
          const card = await businessCardAPI.getUserBusinessCard(user.id)
          setBusinessCard(card)
          setNeedsBusinessCard(!card)
        }
        fetchCard()
      }
    }
  }
}