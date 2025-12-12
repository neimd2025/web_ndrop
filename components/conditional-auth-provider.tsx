"use client"

import AuthErrorHandler from "@/components/auth-error-handler"
import AuthProvider from "@/components/auth-provider"
import ClientOnly from "@/components/client-only"
import { LoadingProvider } from "@/components/loading-provider"
import { usePathname } from "next/navigation"
import type React from "react"

interface ConditionalAuthProviderProps {
  children: React.ReactNode
}

export default function ConditionalAuthProvider({ children }: ConditionalAuthProviderProps) {
  const pathname = usePathname()

  // AuthProvider를 제외할 경로 패턴들
  const isAdminPage = pathname?.startsWith('/admin')
  const isPublicCardBookPage = pathname?.startsWith('/card-books/')

  // AuthProvider가 필요 없는 페이지들
  if (isAdminPage || isPublicCardBookPage) {
    return (
      <ClientOnly>
        <LoadingProvider>
          <main className="pb-20">{children}</main>
        </LoadingProvider>
      </ClientOnly>
    )
  }

  // 일반 사용자 페이지: AuthProvider 포함
  return (
    <AuthProvider>
      <AuthErrorHandler>
        <ClientOnly>
          <LoadingProvider>
            <main className="pb-20">{children}</main>
          </LoadingProvider>
        </ClientOnly>
      </AuthErrorHandler>
    </AuthProvider>
  )
}