export const dynamic = 'force-dynamic'
import { getAdminMembersData } from '@/lib/supabase/admin-server-actions'
import { AdminMembersClient } from '@/components/admin/admin-members-client'

interface Member {
  id: string
  full_name: string
  email: string
  company: string
  role: string
  created_at: string
  profile_image_url: string | null
}

export default async function AdminMembersPage() {
  // Fetch members data on server side
  const members = await getAdminMembersData()


  return (
    <div className="min-h-screen bg-white">
      <AdminMembersClient initialMembers={members} />
    </div>
  )
}
