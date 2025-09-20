import { AdminAuthProvider } from '@/components/admin-auth-provider'
import Link from 'next/link'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <AdminAuthProvider>
      <div className="min-h-screen bg-gray-50">
        <div className="flex">
          {/* 사이드바 - Server Component로 렌더링 */}
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
    </AdminAuthProvider>
  )
}
