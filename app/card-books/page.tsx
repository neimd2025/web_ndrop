export const dynamic = 'force-dynamic'
import { getUserSavedCardsData } from "@/lib/supabase/user-server-actions";
import { UserMyPageClient } from '@/components/user/user-my-page-client';
import { getUserMyPageData } from '@/lib/supabase/user-server-actions';
import { UserSavedCardsClient } from "@/components/user/user-saved-cards-client";

export default async function SavedCardsPage() {
  const { user, savedCards } = await getUserSavedCardsData();

  return (
      <UserSavedCardsClient 
        user={user} 
        savedCards={savedCards} 
      />
  );
}
