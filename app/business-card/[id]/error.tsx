'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { AlertCircle, ArrowLeft, Home } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

interface ErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function BusinessCardError({ error, reset }: ErrorProps) {
  const router = useRouter()

  useEffect(() => {
    console.error('Business card error:', error)
  }, [error])

  const getErrorMessage = () => {
    if (error.message === 'NOT_FOUND') {
      return {
        title: '명함을 찾을 수 없습니다',
        description: '요청하신 명함이 존재하지 않거나 삭제되었습니다.',
        icon: '🔍'
      }
    } else if (error.message === 'NOT_PUBLIC') {
      return {
        title: '비공개 명함입니다',
        description: '이 명함은 공개 설정이 되어있지 않아 볼 수 없습니다.',
        icon: '🔒'
      }
    } else {
      return {
        title: '명함을 불러올 수 없습니다',
        description: '일시적인 오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
        icon: '⚠️'
      }
    }
  }

  const errorInfo = getErrorMessage()

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <CardContent className="p-8 text-center">
          <div className="text-6xl mb-4">{errorInfo.icon}</div>

          <h1 className="text-xl font-bold text-gray-900 mb-2">
            {errorInfo.title}
          </h1>

          <p className="text-gray-600 mb-6 leading-relaxed">
            {errorInfo.description}
          </p>

          <div className="space-y-3">
            <Button
              onClick={reset}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white"
            >
              <AlertCircle className="w-4 h-4 mr-2" />
              다시 시도
            </Button>

            <div className="flex gap-2">
              <Button
                onClick={() => router.back()}
                variant="outline"
                className="flex-1"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                이전 페이지
              </Button>

              <Button
                onClick={() => router.push('/')}
                variant="outline"
                className="flex-1"
              >
                <Home className="w-4 h-4 mr-2" />
                홈으로
              </Button>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-xs text-gray-500">
              Powered by Neimed
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
