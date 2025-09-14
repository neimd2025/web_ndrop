"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createClient } from "@/utils/supabase/client"
import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowLeft, Mail, Send } from "lucide-react"
import Link from "next/link"
import { useState } from "react"
import { useForm } from 'react-hook-form'
import { toast } from "sonner"
import { z } from 'zod'

const forgotPasswordSchema = z.object({
  email: z.string().email('올바른 이메일 형식을 입력해주세요')
})

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>

export default function ForgotPasswordPage() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [emailSent, setEmailSent] = useState(false)
  const supabase = createClient()

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema)
  })

  const onSubmit = async (data: ForgotPasswordFormData) => {
    setIsSubmitting(true)

    try {
      // 현재 도메인과 정확한 리다이렉트 URL 설정
      const redirectUrl = `${window.location.origin}/reset-password`
      console.log('비밀번호 재설정 리다이렉트 URL:', redirectUrl)

      const { error } = await supabase.auth.resetPasswordForEmail(data.email, {
        redirectTo: redirectUrl
      })

      if (error) {
        console.error('비밀번호 재설정 이메일 발송 오류:', error)

        // 사용자가 존재하지 않는 경우에도 성공 메시지 표시 (보안상)
        if (error.message?.includes('User not found')) {
          setEmailSent(true)
          toast.success('비밀번호 재설정 이메일을 발송했습니다.', {
            description: '💡 이메일을 확인하여 비밀번호를 재설정해주세요.'
          })
          return
        }

        toast.error('비밀번호 재설정 이메일 발송에 실패했습니다.')
        return
      }

      setEmailSent(true)
      toast.success('비밀번호 재설정 이메일을 발송했습니다.', {
        description: '💡 이메일을 확인하여 비밀번호를 재설정해주세요.'
      })
    } catch (error) {
      console.error('비밀번호 재설정 오류:', error)
      toast.error('비밀번호 재설정 중 오류가 발생했습니다.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (emailSent) {
    return (
      <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <div className="mx-auto h-12 w-12 bg-green-600 rounded-lg flex items-center justify-center">
              <Mail className="h-6 w-6 text-white" />
            </div>
            <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
              이메일 발송 완료
            </h2>
            <p className="mt-2 text-center text-sm text-gray-600">
              비밀번호 재설정 링크가 포함된 이메일을 발송했습니다
            </p>
            <p className="mt-1 text-center text-xs text-gray-500">
              스팸함도 확인해보세요
            </p>
          </div>

          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="text-sm font-medium text-blue-900 mb-2">다음 단계</h3>
              <ol className="text-sm text-blue-800 space-y-1">
                <li>1. 이메일을 확인해주세요</li>
                <li>2. "비밀번호 재설정" 링크를 클릭하세요</li>
                <li>3. 새 비밀번호를 입력하세요</li>
              </ol>
            </div>

            <div className="flex flex-col space-y-3">
              <Link href="/login">
                <Button variant="outline" className="w-full">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  로그인으로 돌아가기
                </Button>
              </Link>

              <Button
                onClick={() => setEmailSent(false)}
                className="w-full"
              >
                다른 이메일로 다시 시도
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <div className="mx-auto h-12 w-12 bg-blue-600 rounded-lg flex items-center justify-center">
            <Mail className="h-6 w-6 text-white" />
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            비밀번호 찾기
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            가입한 이메일 주소를 입력해주세요
          </p>
          <p className="mt-1 text-center text-xs text-gray-500">
            비밀번호 재설정 링크를 이메일로 발송합니다
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
          <div>
            <Label htmlFor="email" className="block text-sm font-medium text-gray-700">
              이메일 주소
            </Label>
            <div className="mt-1 relative">
              <Input
                {...register('email')}
                type="email"
                autoComplete="email"
                placeholder="example@email.com"
                className={`pl-10 ${errors.email ? 'border-red-500' : ''}`}
              />
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            </div>
            {errors.email && (
              <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>
            )}
          </div>

          <div>
            <Button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  발송 중...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  비밀번호 재설정 이메일 발송
                </>
              )}
            </Button>
          </div>

          <div className="text-center">
            <Link href="/login" className="text-sm text-blue-600 hover:text-blue-500">
              <ArrowLeft className="w-4 h-4 inline mr-1" />
              로그인으로 돌아가기
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}
