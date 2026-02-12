import { createClient } from "@/utils/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { Database } from "@/types/supabase";

type RecommendationRow = Database["public"]["Tables"]["event_match_recommendations"]["Row"];
type ProfileRow = Pick<Database["public"]["Tables"]["user_profiles"]["Row"], "id" | "user_id" | "nickname" | "role" | "work_field" | "company" | "interest_keywords" | "profile_image_url">;

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  const supabase = await createClient();
  const { eventId } = await params;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 나의 추천 목록 조회
  // FK 제약조건 없이 application-level join으로 처리 (요청사항 반영)
  // 1. 추천 목록 조회
  const { data: recommendations, error } = await supabase
    .from("event_match_recommendations")
    .select("*")
    .eq("event_id", eventId)
    .eq("user_id", user.id)
    .order("score", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // 2. 프로필 정보 별도 조회 (Application-side Join)
  const recommendedUserIds = recommendations.map((r: RecommendationRow) => r.recommended_user_id);
  
  // 빈 배열 처리
  if (recommendedUserIds.length === 0) {
    return NextResponse.json({ recommendations: [] });
  }

  const { data: profiles, error: profilesError } = await supabase
    .from("user_profiles")
    .select(`
      id,
      nickname,
      role,
      job_title,
      work_field,
      company,
      interest_keywords,
      profile_image_url
    `)
    .in("id", recommendedUserIds); // user_id -> id

  if (profilesError) {
     return NextResponse.json({ error: profilesError.message }, { status: 500 });
  }

  // 3. 데이터 병합 (event_match_recommendations.recommended_user_id ↔ user_profiles.id)
  // DB에 user_id 컬럼이 없으므로 id(auth.uid)를 사용
  const profileMap = new Map(profiles.map((p) => [p.id, { ...p, user_id: p.id }]));
  
  const joinedRecommendations = recommendations.map((rec: RecommendationRow) => ({
    ...rec,
    recommended_profile: profileMap.get(rec.recommended_user_id) || null,
  }));

  return NextResponse.json({ recommendations: joinedRecommendations });
}
