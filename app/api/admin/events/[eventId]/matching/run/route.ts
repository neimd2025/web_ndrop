import { createClient, createAdminClient } from "@/utils/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { Database } from "@/types/supabase";

type UserProfile = Database["public"]["Tables"]["user_profiles"]["Row"];
type EventParticipant = Database["public"]["Tables"]["event_participants"]["Row"] & {
  user_profiles: UserProfile | null;
};
type MatchRecommendationInsert = Database["public"]["Tables"]["event_match_recommendations"]["Insert"];

interface ScoredCandidate {
  candidateId: string;
  score: number;
  reasons: Record<string, any>;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  const supabase = await createClient(); // For auth check
  const supabaseAdmin = await createAdminClient(); // For actual operations
  const { eventId } = await params;

  // 1. 권한 체크
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Admin 권한 체크: 실제 DB 조회
  const { data: adminAccount } = await supabaseAdmin
    .from("admin_accounts")
    .select("id")
    .eq("id", user.id)
    .single();

  if (!adminAccount) {
    return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
  }

  // 2. 매칭 설정 조회
  const { data: config } = await supabaseAdmin
    .from("event_matching_configs")
    .select("*")
    .eq("event_id", eventId)
    .single();

  // 기본 추천 인원: 3명 (사용자 요청 반영)
  const maxRecommendations = (config as any)?.max_requests_per_user || 3;
  const scoringWeights = ((config as any)?.scoring_weights as Record<string, any>) || {};
  
  // 확장 가능한 제외 정책 설정 (matching_config.rules가 없으므로 scoring_weights 내에 rules 객체를 포함한다고 가정하거나 기본값 사용)
  const rules = scoringWeights.rules || {
    exclude_declined: false, // 거절된 사용자도 다시 추천 가능 (기본값)
    exclude_canceled: false, // 취소된 사용자도 다시 추천 가능 (기본값)
  };

  // 3. 기존 데이터 정리 및 참가자/미팅 정보 조회
  
  // (1) 이미 존재하는 미팅 관계 조회 (제외 대상)
  // 기본 정책: pending, accepted, confirmed 상태는 무조건 제외
  const excludeStatuses = ["pending", "accepted", "confirmed"];
  
  // 설정에 따라 declined, canceled 상태도 제외 목록에 추가
  if (rules.exclude_declined) excludeStatuses.push("declined");
  if (rules.exclude_canceled) excludeStatuses.push("canceled");

  const { data: existingMeetings } = await supabaseAdmin
    .from("event_meetings")
    .select("requester_id, receiver_id")
    .eq("event_id", eventId)
    .in("status", excludeStatuses);

  const meetingPairs = new Set<string>();
  if (existingMeetings) {
    for (const m of (existingMeetings as any[])) {
      // 양방향 체크를 위해 정렬해서 키 생성
      const [u1, u2] = [m.requester_id, m.receiver_id].sort();
      meetingPairs.add(`${u1}:${u2}`);
    }
  }

  // (2) 참가자 목록 조회
  // user_profiles 정보도 함께 가져와서 매칭 로직에 사용
  const { data: participants, error: participantsError } = await supabaseAdmin
    .from("event_participants")
    .select(`
      user_id,
      user_profiles (
        id,
        interest_keywords,
        work_field,
        company,
        role
      )
    `)
    .eq("event_id", eventId);

  if (participantsError || !participants) {
    return NextResponse.json(
      { error: "Failed to fetch participants" },
      { status: 500 }
    );
  }

  // 4. 매칭 알고리즘 실행
  const batchId = crypto.randomUUID();
  const recommendationsToInsert: MatchRecommendationInsert[] = [];

  for (const participant of (participants as any[])) {
    const userId = participant.user_id;
    // 타입 단언을 사용하여 안전하게 접근
    const userProfile = (participant as unknown as EventParticipant).user_profiles;

    if (!userProfile) continue;

    // 후보군: 자기 자신 제외 AND 이미 미팅 관계가 있는 사람 제외
    const candidates = (participants as any[]).filter((p: any) => {
      if (p.user_id === userId) return false;
      
      const [u1, u2] = [userId, p.user_id].sort();
      if (meetingPairs.has(`${u1}:${u2}`)) return false;

      return true;
    });

    const scoredCandidates = candidates.map((candidate: any) => {
      const candidateProfile = (candidate as unknown as EventParticipant).user_profiles;
      if (!candidateProfile) return { candidateId: candidate.user_id, score: 0, reasons: {} };


      let score = 0;
      const reasons: Record<string, any> = {};

      // 로직 1: 업무 분야(Industry) 매칭 (가장 중요)
      if (userProfile.work_field && userProfile.work_field === candidateProfile.work_field) {
        const weight = scoringWeights.same_work_field || 30; // 가중치 상향 (5 -> 30)
        score += weight;
        reasons.same_work_field = userProfile.work_field;
      }

      // 로직 2: 직무(Role) 매칭 (중요)
      if (userProfile.role && userProfile.role === candidateProfile.role) {
        const weight = 20; // 가중치 추가
        score += weight;
        reasons.same_role = userProfile.role;
      }

      // 로직 3: 관심사 매칭 (보완)
      if (userProfile.interest_keywords && candidateProfile.interest_keywords) {
        const myInterests = new Set(userProfile.interest_keywords);
        const commonInterests = candidateProfile.interest_keywords.filter((k: string) =>
          myInterests.has(k)
        );
        if (commonInterests.length > 0) {
          const weight = scoringWeights.interest_match || 5; // 가중치 하향 (10 -> 5)
          score += commonInterests.length * weight;
          reasons.common_interests = commonInterests;
        }
      }

      // 추천 사유 생성 (문장형 요약)
      const summaryParts = [];
      if (reasons.same_work_field) {
        summaryParts.push(`같은 ${reasons.same_work_field} 분야에 계시네요.`);
      } else if (reasons.same_role) {
         summaryParts.push(`비슷한 ${reasons.same_role} 직무를 갖고 계세요.`);
      }

      if (reasons.common_interests && reasons.common_interests.length > 0) {
        const interests = reasons.common_interests.join(", ");
        if (summaryParts.length > 0) {
          summaryParts.push(`특히 ${interests}에 공통된 관심사가 있어 대화가 잘 통하실 거예요!`);
        } else {
          summaryParts.push(`${interests} 분야에 관심이 있으셔서 추천해 드려요!`);
        }
      } else {
        if (summaryParts.length > 0) {
           summaryParts.push("업무 연관성이 높아 시너지를 기대해 볼 수 있어요!");
        } else {
           summaryParts.push("새로운 분야의 분과 교류해보시는 건 어떨까요?");
        }
      }
      
      reasons.summary = summaryParts.join(" ");

      // 로직 4: 랜덤 요소 (약간의 다양성)
      score += Math.random() * 5;

      return {
        candidateId: candidate.user_id,
        score: Math.round(score),
        reasons,
      };
    });

    // 점수 내림차순 정렬
    scoredCandidates.sort((a: any, b: any) => b.score - a.score);

    // 상위 N명 선정
    const topCandidates = scoredCandidates.slice(0, maxRecommendations);

    for (const match of topCandidates) {
      recommendationsToInsert.push({
        event_id: eventId,
        user_id: userId,
        recommended_user_id: match.candidateId,
        batch_id: batchId,
        score: match.score,
        match_reasons: match.reasons,
      });
    }
  }

  // 5. 결과 저장 (Batch Insert & Clean up)
  if (recommendationsToInsert.length > 0) {
    // (1) 새로운 배치 삽입
    const { error: insertError } = await supabaseAdmin
      .from("event_match_recommendations")
      .insert(recommendationsToInsert as any);

    if (insertError) {
      console.error("Match insert error:", insertError);
      return NextResponse.json(
        { error: "Failed to save recommendations: " + insertError.message },
        { status: 500 }
      );
    }

    // (2) 이전 배치 데이터 삭제 (추천 공백 방지)
    // 현재 배치가 아닌 이전 데이터 삭제
    const { error: deleteError } = await supabaseAdmin
      .from("event_match_recommendations")
      .delete()
      .eq("event_id", eventId)
      .neq("batch_id", batchId);
      
    if (deleteError) {
      console.error("Failed to cleanup old recommendations:", deleteError);
      // 치명적인 오류는 아니므로 로그만 남기고 진행
    }
  }

  return NextResponse.json({
    success: true,
    batch_id: batchId,
    count: recommendationsToInsert.length,
    message: `Generated ${recommendationsToInsert.length} recommendations for ${participants.length} participants.`,
  });
}

