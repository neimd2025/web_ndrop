"use client"

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuth } from '@/hooks/use-auth'
import { CheckCircle, Home, User } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function WelcomePage() {
  const { user } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!user) {
      router.push('/login')
    } else {
      // 인증된 사용자는 바로 홈으로 이동
      router.push('/client/home')
    }
  }, [user, router])

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <CardTitle className="text-xl font-bold text-gray-900">환영합니다! 🎉</CardTitle>
          <p className="text-gray-600">
            이메일 인증이 완료되었습니다. ndrop에서 네트워킹을 시작해보세요!
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <User className="w-5 h-5 text-green-600" />
              <div>
                <p className="font-medium text-green-800">{user.email}</p>
                <p className="text-sm text-green-600">계정이 성공적으로 활성화되었습니다</p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <Link href="/client/home">
              <Button className="w-full">
                <Home className="w-4 h-4 mr-2" />
                홈으로 이동
              </Button>
            </Link>

            <Link href="/profile/edit">
              <Button variant="outline" className="w-full">
                <User className="w-4 h-4 mr-2" />
                프로필 설정하기
              </Button>
            </Link>
          </div>

          <div className="text-center text-sm text-gray-500">
            <p>ndrop에서 명함을 교환하고 네트워킹을 시작하세요!</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
