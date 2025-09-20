import { SimpleAdminLayout } from '@/components/admin/simple-admin-layout'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <SimpleAdminLayout>
      {children}
    </SimpleAdminLayout>
  )
}
