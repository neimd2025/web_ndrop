import { AdminLayoutClient } from '@/components/admin/admin-layout-client'

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
