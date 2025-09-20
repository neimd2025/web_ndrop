import { SimpleUserLayout } from '@/components/user/simple-user-layout'

export default function UserLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <SimpleUserLayout>
      {children}
    </SimpleUserLayout>
  )
}