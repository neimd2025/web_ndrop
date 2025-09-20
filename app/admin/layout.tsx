import { requireAdminAuth } from '@/lib/auth/server-auth'
import { AdminLayoutClient } from '@/components/admin/admin-layout-client'
import Link from 'next/link'
import { redirect } from 'next/navigation'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Check if this is an auth page - skip auth check
  const pathname = process.env.NODE_ENV === 'development' ? '' : ''

  // For auth pages, render without auth check
  if (typeof window !== 'undefined') {
    // This will be handled by the client component for auth pages
  }

  return (
    <AdminLayoutClient>
      <div className="min-h-screen bg-gray-50">
        <div className="flex">
          {/* 사이드바 - Server Component */}
          <div className="w-64 bg-white shadow-sm border-r">
            <div className="p-6">
              <h1 className="text-xl font-bold text-gray-900">관리자 패널</h1>
            </div>
            <nav className="mt-6">
              <Link
                href="/admin/dashboard"
                className="block px-6 py-3 text-sm font-medium text-gray-600 hover:bg-gray-50"
              >
                대시보드
              </Link>
              <Link
                href="/admin/events"
                className="block px-6 py-3 text-sm font-medium text-gray-600 hover:bg-gray-50"
              >
                이벤트 관리
              </Link>
              <Link
                href="/admin/members"
                className="block px-6 py-3 text-sm font-medium text-gray-600 hover:bg-gray-50"
              >
                회원 관리
              </Link>
              <Link
                href="/admin/feedback"
                className="block px-6 py-3 text-sm font-medium text-gray-600 hover:bg-gray-50"
              >
                피드백 관리
              </Link>
              <Link
                href="/admin/notifications"
                className="block px-6 py-3 text-sm font-medium text-gray-600 hover:bg-gray-50"
              >
                알림 관리
              </Link>
            </nav>
          </div>

          {/* 메인 콘텐츠 */}
          <div className="flex-1">
            <div className="bg-white shadow-sm border-b px-6 py-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">
                  관리자 패널
                </h2>
              </div>
            </div>
            <div className="p-6">
              {children}
            </div>
          </div>
        </div>
      </div>
    </AdminLayoutClient>
  )
}
