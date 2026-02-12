export const dynamic = 'force-dynamic'

import { getUserSavedCardsData } from "@/lib/supabase/user-server-actions";
import { UserSavedCardsClient } from "@/components/user/user-saved-cards-client";

export default async function SavedCardsPage() {
  try {
    const { user, savedCards } = await getUserSavedCardsData();

    return (
        <UserSavedCardsClient 
          user={user} 
          savedCards={savedCards} 
        />
    );
  } catch (error) {
    console.error('명함첩 데이터 로드 오류:', error);
    
    // 에러 UI
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] p-4 text-center">
        <h2 className="text-xl font-bold mb-2">데이터를 불러올 수 없습니다</h2>
        <p className="text-gray-500 mb-6 text-sm">
          잠시 후 다시 시도해주세요.<br/>
          {error instanceof Error && (
            <span className="text-xs text-red-400 mt-2 block opacity-70">
              Error: {error.message}
            </span>
          )}
        </p>
        <a 
          href="/" 
          className="px-4 py-2 bg-slate-800 text-white text-sm rounded-lg hover:bg-slate-700 transition-colors"
        >
          홈으로 돌아가기
        </a>
      </div>
    );
  }
}
