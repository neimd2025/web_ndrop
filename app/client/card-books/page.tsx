import { getUserSavedCardsData } from "@/lib/supabase/user-server-actions";
import { UserMyPageClient } from '@/components/user/user-my-page-client';
import { getUserMyPageData } from '@/lib/supabase/user-server-actions';
import CardBooks from "@/components/user/card-books";

export default async function SavedCardsPage() {
  const { user, savedCards } = await getUserSavedCardsData();
  const { user_, businessCards, participatedEvents, stats } = await getUserMyPageData();

  return (
    <CardBooks user={user} businessCards={businessCards} savedCards={savedCards} />
  );
}
