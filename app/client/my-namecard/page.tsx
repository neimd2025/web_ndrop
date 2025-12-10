export const dynamic = 'force-dynamic'

import { getUserMyPageData } from '@/lib/supabase/user-server-actions';
import UserMyCardDetailPage from "@/components/user/user-my-card-detail";

export default async function MyCardDetailPage() {
  const { user, businessCards, participatedEvents, stats } = await getUserMyPageData();

  return (
    <UserMyCardDetailPage user={user} businessCards={businessCards} />
  );
}
