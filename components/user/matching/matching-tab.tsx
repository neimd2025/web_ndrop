import { createClient } from "@/utils/supabase/client";
import { useEffect, useState } from "react";
import { RecommendationCard } from "./recommendation-card";
import { MeetingRequestSheet } from "./meeting-request-sheet";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface MatchingTabProps {
  eventId: string;
}

export function MatchingTab({ eventId }: MatchingTabProps) {
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProfile, setSelectedProfile] = useState<{ id: string; nickname: string } | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  const fetchRecommendations = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/events/${eventId}/matching/recommendations`);
      if (!res.ok) throw new Error("Failed to fetch recommendations");
      const data = await res.json();
      
      // 데이터 가공
      const formatted = data.recommendations.map((rec: any) => ({
        ...rec,
        profile: rec.recommended_profile,
      }));
      
      setRecommendations(formatted);
    } catch (error) {
      console.error("Error fetching recommendations:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecommendations();
  }, [eventId]);

  const handleRequest = (profileId: string, nickname: string) => {
    setSelectedProfile({ id: profileId, nickname });
    setIsSheetOpen(true);
  };

  const handleRequestSuccess = () => {
    // 요청 성공 시 추천 목록을 다시 불러오거나(제외 로직이 있다면), 
    // 혹은 해당 카드를 목록에서 제거하는 등의 처리를 할 수 있음.
    // 여기서는 간단히 목록 갱신
    fetchRecommendations();
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-purple-600 mb-2" />
        <p className="text-gray-500 text-sm">AI가 최적의 파트너를 찾고 있습니다...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-2">
        <h2 className="text-lg font-bold text-gray-800">추천 네트워킹 파트너</h2>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={fetchRecommendations}
          className="text-gray-500 text-xs h-8"
        >
          새로고침
        </Button>
      </div>

      {recommendations.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg border border-dashed border-gray-200">
          <p className="text-gray-500 mb-2">아직 추천된 파트너가 없습니다.</p>
          <p className="text-xs text-gray-400">행사 주최자가 매칭을 시작하면 목록이 표시됩니다.</p>
        </div>
      ) : (
        recommendations.map((rec) => (
          <RecommendationCard
            key={rec.id}
            profile={rec.profile}
            score={rec.score}
            matchReasons={rec.match_reasons}
            onRequest={handleRequest}
          />
        ))
      )}

      <MeetingRequestSheet
        isOpen={isSheetOpen}
        onClose={() => setIsSheetOpen(false)}
        targetProfile={selectedProfile}
        eventId={eventId}
        onSuccess={handleRequestSuccess}
      />
    </div>
  );
}
