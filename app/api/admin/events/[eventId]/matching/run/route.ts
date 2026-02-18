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
  const supabase = await createClient();
  const supabaseAdmin = await createAdminClient();
  const { eventId } = await params;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: adminAccount } = await supabaseAdmin
    .from("admin_accounts")
    .select("id")
    .eq("id", user.id)
    .single();

  if (!adminAccount) {
    return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
  }

  const { data: config } = await supabaseAdmin
    .from("event_matching_configs")
    .select("*")
    .eq("event_id", eventId)
    .single();

  const maxRecommendations = (config as any)?.max_requests_per_user || 3;
  const scoringWeights = ((config as any)?.scoring_weights as Record<string, any>) || {};
  const rules = scoringWeights.rules || {
    exclude_declined: false,
    exclude_canceled: false,
  };

  const excludeStatuses = ["pending", "accepted", "confirmed"];
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
      const [u1, u2] = [m.requester_id, m.receiver_id].sort();
      meetingPairs.add(`${u1}:${u2}`);
    }
  }

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

  const batchId = crypto.randomUUID();
  const recommendationsToInsert: MatchRecommendationInsert[] = [];

  for (const participant of (participants as any[])) {
    const userId = participant.user_id;
    const userProfile = (participant as unknown as EventParticipant).user_profiles;
    if (!userProfile) continue;

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

      if (userProfile.work_field && userProfile.work_field === candidateProfile.work_field) {
        const weight = scoringWeights.same_work_field || 30;
        score += weight;
        reasons.same_work_field = userProfile.work_field;
      }

      if (userProfile.role && userProfile.role === candidateProfile.role) {
        const weight = 20;
        score += weight;
        reasons.same_role = userProfile.role;
      }

      if (userProfile.interest_keywords && candidateProfile.interest_keywords) {
        const myInterests = new Set(userProfile.interest_keywords);
        const commonInterests = candidateProfile.interest_keywords.filter((k: string) =>
          myInterests.has(k)
        );
        if (commonInterests.length > 0) {
          const weight = scoringWeights.interest_match || 5;
          score += commonInterests.length * weight;
          reasons.common_interests = commonInterests;
        }
      }

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
      score += Math.random() * 5;

      return {
        candidateId: candidate.user_id,
        score: Math.round(score),
        reasons,
      };
    });

    scoredCandidates.sort((a: any, b: any) => b.score - a.score);
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

  if (recommendationsToInsert.length > 0) {
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

    const { error: deleteError } = await supabaseAdmin
      .from("event_match_recommendations")
      .delete()
      .eq("event_id", eventId)
      .neq("batch_id", batchId);
    if (deleteError) {
      console.error("Failed to cleanup old recommendations:", deleteError);
    }
  }

  return NextResponse.json({
    success: true,
    batch_id: batchId,
    count: recommendationsToInsert.length,
    message: `Generated ${recommendationsToInsert.length} recommendations for ${participants.length} participants.`,
  });
}
