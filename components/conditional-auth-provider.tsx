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

  // 관리자 페이지에서는 AuthProvider를 제외
  const isAdminPage = pathname?.startsWith('/admin')

  if (isAdminPage) {
    // 관리자 페이지: AuthProvider 없이 렌더링
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
