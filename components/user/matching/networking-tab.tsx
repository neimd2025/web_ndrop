// @ts-nocheck
import { createClient } from "@/utils/supabase/client";
import { useEffect, useState } from "react";
import { RecommendationCard } from "./recommendation-card";
import { ParticipantCard } from "./participant-card";
import { MeetingRequestSheet } from "./meeting-request-sheet";
import { Loader2, Search, Users, Sparkles } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

interface NetworkingTabProps {
  eventId: string;
}

export function NetworkingTab({ eventId }: NetworkingTabProps) {
  // Common State
  const [selectedProfile, setSelectedProfile] = useState<{ id: string; nickname: string } | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [sentRequests, setSentRequests] = useState<Set<string>>(new Set());

  // Recommendations State
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [recLoading, setRecLoading] = useState(true);

  // Participants State
  const [participants, setParticipants] = useState<any[]>([]);
  const [partLoading, setPartLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const [userProfile, setUserProfile] = useState<any>(null);

  const fetchSentRequests = async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Fetch user profile if not already fetched
    if (!userProfile) {
      const { data: profile } = await supabase
        .from("user_profiles")
        .select("*")
        .eq("id", user.id)
        .single();
      if (profile) setUserProfile(profile);
    }

    const { data } = await supabase
      .from("event_meetings")
      .select("receiver_id, status")
      .eq("event_id", eventId)
      .eq("requester_id", user.id)
      .in("status", ["pending", "accepted", "confirmed"]);

    if (data) {
      const requestedIds = new Set(data.map(m => m.receiver_id));
      setSentRequests(requestedIds);
    }
  };

  const fetchRecommendations = async () => {
    setRecLoading(true);
    try {
      // 1. 기본 매칭 후보자 가져오기
      const res = await fetch(`/api/events/${eventId}/matching/recommendations`);
      if (res.ok) {
        const data = await res.json();
        let formatted = data.recommendations.map((rec: any) => ({
          ...rec,
          profile: rec.recommended_profile,
        }));
        
        // [Filter] 필수 정보(직무 또는 소속)가 없는 사용자는 추천 목록에서 제외
        formatted = formatted.filter((item: any) => {
           const p = item.profile;
           // 이름이 없거나, (직무와 소속이 모두 없는 경우) 제외
           if (!p.nickname && !p.name) return false;
           if (!p.job_title && !p.company && (!p.work_field || p.work_field === '')) return false;
           return true;
        });

        // 1단계: 기본 데이터 먼저 보여주기 (빠른 렌더링)
        setRecommendations(formatted);
        setRecLoading(false); // 로딩 해제

        // 2. OpenAI를 이용한 심층 분석 및 추천 사유 생성 (백그라운드 실행)
        // userProfile이 있고 후보자가 있을 때만 실행
        if (formatted.length > 0) {
           // userProfile이 아직 상태에 없을 수 있으므로 직접 가져오거나 확인
           let currentUser = userProfile;
           if (!currentUser) {
             const supabase = createClient();
             const { data: { user } } = await supabase.auth.getUser();
             if (user) {
               const { data: profile } = await supabase
                .from("user_profiles")
                .select("*")
                .eq("id", user.id)
                .single();
              currentUser = profile;
              setUserProfile(profile);
            }
          }

          if (currentUser) {
            console.log("Calling AI Recommendation API...");
            try {
              const aiRes = await fetch('/api/ai/recommendation', {
                 method: 'POST',
                 headers: { 'Content-Type': 'application/json' },
                 body: JSON.stringify({
                   userProfile: currentUser,
                   candidateProfiles: formatted.map((f: any) => f.profile),
                   eventId: eventId // 이벤트 정보 조회를 위해 ID 전달
                 })
               });

               if (aiRes.ok) {
                 const aiData = await aiRes.json();
                 const aiRecommendations = aiData.recommendations || [];
                 
                 // AI가 선택한 추천 목록으로 교체 (AI가 더 똑똑하게 선별했다고 가정)
                 // 만약 AI가 아무도 추천하지 않았다면 기존 목록 유지 (혹은 빈 목록)
                 if (aiRecommendations.length > 0) {
                    const newRecommendations = aiRecommendations.map((aiRec: any) => {
                        // 기존 formatted 목록에서 해당 프로필 찾기
                        const original = formatted.find((f: any) => f.profile.id === aiRec.id || f.profile.user_id === aiRec.id);
                        if (original) {
                            return {
                                ...original,
                                match_reasons: {
                                    ...original.match_reasons,
                                    summary: aiRec.reason,
                                    type: aiRec.type // type 정보도 저장 (strategic | community)
                                }
                            };
                        }
                        return null;
                    }).filter(Boolean);
                    
                    // AI가 엄선한 목록으로 업데이트
                    setRecommendations(newRecommendations);
                 }
               }
             } catch (aiError) {
               console.error("AI Recommendation API Error:", aiError);
               // AI 실패 시에도 기본 매칭 결과는 유지됨
             }
           }
        }
      } else {
        setRecLoading(false);
      }
    } catch (error) {
      console.error("Error fetching recommendations:", error);
      setRecLoading(false);
    }
  };

  const fetchParticipants = async (query?: string) => {
    setPartLoading(true);
    try {
      const url = new URL(`/api/events/${eventId}/participants`, window.location.origin);
      if (query) url.searchParams.set("q", query);
      
      const res = await fetch(url.toString());
      if (!res.ok) throw new Error("Failed to fetch participants");
      const data = await res.json();
      
      setParticipants(data.participants || []);
    } catch (error) {
      console.error("Error fetching participants:", error);
      toast.error("참가자 목록을 불러오지 못했습니다.");
    } finally {
      setPartLoading(false);
    }
  };

  useEffect(() => {
    fetchSentRequests();
    fetchRecommendations();
    fetchParticipants();
  }, [eventId]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchParticipants(searchQuery);
  };

  const handleRequest = (userId: string, nickname: string) => {
    setSelectedProfile({ id: userId, nickname });
    setIsSheetOpen(true);
  };

  const handleRequestSuccess = () => {
    toast.success("요청 전송 완료");
    fetchSentRequests();
    // 추천 목록이나 참가자 목록 갱신이 필요하다면 여기서 호출
    fetchRecommendations(); 
  };

  return (
    <div className="space-y-8 pb-20 relative min-h-[500px]">
      {/* 1. AI 추천 매칭 섹션 */}
      <section className="bg-slate-900/30 rounded-2xl border border-white/5 p-4 backdrop-blur-md">
        <div className="flex items-center gap-2 mb-4">
            <div className="bg-purple-500/20 p-2 rounded-xl border border-purple-500/30 shadow-[0_0_15px_rgba(168,85,247,0.15)]">
                <Sparkles className="w-5 h-5 text-purple-300" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white leading-none">AI 스마트 매칭</h2>
              <p className="text-xs text-slate-400 mt-1">프로필을 종합 분석하여 추천된 파트너입니다</p>
            </div>
        </div>
        
        {recLoading ? (
            <div className="flex justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-purple-400" />
            </div>
        ) : recommendations.length > 0 ? (
            <ScrollArea className="w-full whitespace-nowrap pb-2">
                <div className="flex w-max space-x-4 pr-4">
                    {recommendations.map((rec) => (
                        <div key={rec.id} className="w-[280px] shrink-0 whitespace-normal">
                            <RecommendationCard
                                profile={rec.profile}
                                score={rec.score}
                                matchReasons={rec.match_reasons}
                                onRequest={handleRequest}
                                requestStatus={
                                    sentRequests.has(rec.profile.id) ? "pending" : "none"
                                }
                                isDarkTheme={true}
                            />
                        </div>
                    ))}
                </div>
                <ScrollBar orientation="horizontal" className="bg-slate-700/30" />
            </ScrollArea>
        ) : (
            <div className="bg-slate-800/30 border border-white/5 rounded-xl p-8 text-center mx-1">
                <p className="text-purple-300 font-medium mb-1">아직 매칭 결과가 없습니다</p>
                <p className="text-slate-400 text-xs">프로필을 분석하여 최적의 파트너를 찾고 있어요!</p>
            </div>
        )}
      </section>

      {/* 2. 전체 참가자 섹션 */}
      <section className="bg-slate-900/30 rounded-2xl border border-white/5 p-4 backdrop-blur-md">
        <div className="flex flex-col gap-4 mb-4">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="bg-blue-500/20 p-2 rounded-xl border border-blue-500/30">
                        <Users className="w-5 h-5 text-blue-300" />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-white leading-none">전체 참여자</h2>
                        <p className="text-xs text-slate-400 mt-1">총 {participants.length}명의 참가자가 있어요</p>
                    </div>
                </div>
            </div>

            <div className="bg-slate-950/50 rounded-xl border border-white/10 shadow-inner">
                <form onSubmit={handleSearch} className="relative">
                    <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-500 w-4 h-4" />
                    <Input 
                        placeholder="이름, 회사, 직무 검색..." 
                        className="pl-11 h-12 bg-transparent border-none focus-visible:ring-0 text-white placeholder:text-slate-600 text-sm"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </form>
            </div>
        </div>

        <div className="space-y-3">
            {partLoading ? (
                <div className="flex flex-col items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-purple-400 mb-2" />
                    <p className="text-slate-400 text-sm">참가자 목록을 불러오는 중...</p>
                </div>
            ) : participants.length === 0 ? (
                <div className="text-center py-12 bg-slate-900/30 rounded-lg border border-dashed border-white/10">
                    <p className="text-slate-500">검색 결과가 없습니다.</p>
                </div>
            ) : (
                participants.map((participant) => (
                    <ParticipantCard
                        key={participant.id}
                        profile={participant}
                        onRequest={handleRequest}
                        requestStatus={
                            sentRequests.has(participant.id) ? "pending" : "none"
                        }
                        isDarkTheme={true}
                    />
                ))
            )}
        </div>
      </section>

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
