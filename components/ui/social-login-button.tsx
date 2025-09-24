'use client'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export type SocialProvider = 'google' | 'kakao'

interface SocialLoginButtonProps {
  provider: SocialProvider
  onClick: () => void
  disabled?: boolean
  className?: string
}

const providerConfig = {
  google: {
    name: 'Google',
    label: 'Google으로 계속하기',
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24">
        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
      </svg>
    )
  },
  kakao: {
    name: 'Kakao',
    label: '카카오톡으로 계속하기',
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24">
        <path fill="#FEE500" d="M12 3C6.48 3 2 6.48 2 12c0 2.25.75 4.31 2 5.94L3 22l5.06-1c1.31.63 2.78 1 4.94 1 5.52 0 10-4.48 10-10S17.52 3 12 3z"/>
        <path fill="#000000" d="M12 5c-3.87 0-7 2.79-7 6.25 0 2.25 1.5 4.25 3.75 5.5L9 18l2.25-1.25c.25 0 .5-.25.75-.25s.5.25.75.25L15 18l.25-1.25c2.25-1.25 3.75-3.25 3.75-5.5C19 7.79 15.87 5 12 5z"/>
      </svg>
    )
  }
}

export function SocialLoginButton({
  provider,
  onClick,
  disabled = false,
  className
}: SocialLoginButtonProps) {
  const config = providerConfig[provider]

  if (!config) {
    console.error(`Unsupported social provider: ${provider}`)
    return null
  }

  return (
    <Button
      type="button"
      variant="outline"
      className={cn(
        "w-full border-gray-200 hover: py-4 rounded-xl",
        className
      )}
      onClick={onClick}
      disabled={disabled}
    >
      <div className="flex items-center justify-center gap-4">
        {config.icon}
        <span className="text-gray-700 font-medium">{config.label}</span>
      </div>
    </Button>
  )
}
