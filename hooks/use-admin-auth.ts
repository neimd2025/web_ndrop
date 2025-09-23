"use client"

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

interface AdminUser {
  id: string
  username: string
  name: string
  role: string
  role_id: number
}

export const useAdminAuth = () => {
  const [admin, setAdmin] = useState<AdminUser | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  // 관리자 인증 상태 확인
  useEffect(() => {
    const checkAdminAuth = () => {
      try {
        // 쿠키에서 먼저 확인
        const getCookie = (name: string) => {
          const value = `; ${document.cookie}`;
          const parts = value.split(`; ${name}=`);
          if (parts.length === 2) return parts.pop()?.split(';').shift();
          return null;
        };

        const adminToken = getCookie('admin_token')
        const adminUser = getCookie('admin_user')

        if (adminToken && adminUser) {
          const userData = JSON.parse(decodeURIComponent(adminUser))
          if (userData.role_id === 2) {
            setAdmin(userData)
            setLoading(false)
            return
          }
        }

        // 토큰이 없거나 유효하지 않은 경우
        setAdmin(null)
        setLoading(false)
      } catch (error) {
        console.error('관리자 인증 확인 오류:', error)
        setAdmin(null)
        setLoading(false)
      }
    }

    checkAdminAuth()
  }, [])

  // 로그아웃 함수
  const signOut = async () => {
    try {
      // 서버 사이드 로그아웃 API 호출
      await fetch('/api/auth/admin-logout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      })

      // 클라이언트 사이드 정리
      localStorage.removeItem('admin_token')
      localStorage.removeItem('admin_user')

      // 쿠키도 삭제
      document.cookie = 'admin_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT'
      document.cookie = 'admin_user=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT'

      setAdmin(null)
      router.push('/admin/login')
    } catch (error) {
      console.error('로그아웃 오류:', error)
      // 실패해도 로그인 페이지로 이동
      router.push('/admin/login')
    }
  }

  // 토큰 유효성 검증
  const verifyToken = async () => {
    try {
      const adminToken = localStorage.getItem('admin_token')
      if (!adminToken) {
        setAdmin(null)
        return false
      }

      // JWT 토큰 유효성 검증 (간단한 만료 시간 체크)
      const payload = JSON.parse(atob(adminToken.split('.')[1]))
      const currentTime = Math.floor(Date.now() / 1000)

      if (payload.exp < currentTime) {
        // 토큰 만료
        localStorage.removeItem('admin_token')
        localStorage.removeItem('admin_user')
        setAdmin(null)
        return false
      }

      return true
    } catch (error) {
      console.error('토큰 검증 오류:', error)
      localStorage.removeItem('admin_token')
      localStorage.removeItem('admin_user')
      setAdmin(null)
      return false
    }
  }

  return {
    admin,
    loading,
    signOut,
    verifyToken,
    isAuthenticated: !!admin
  }
}
