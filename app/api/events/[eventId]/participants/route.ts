import { createClient } from "@/utils/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { Database } from "@/types/supabase";

type UserProfile = Database["public"]["Tables"]["user_profiles"]["Row"];

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  const supabase = await createClient();
  const { eventId } = await params;
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get("q");

  // 1. 권한 체크
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 2. 참가자 목록 조회
  // event_participants 테이블에서 해당 이벤트의 참가자 user_id들을 가져옴
  const { data: participantsData, error: participantsError } = await supabase
    .from("event_participants")
    .select("user_id")
    .eq("event_id", eventId);

  if (participantsError) {
    console.error("Error fetching participants:", participantsError);
    return NextResponse.json({ error: participantsError.message }, { status: 500 });
  }

  const participantIds = participantsData.map((p) => p.user_id);

  if (participantIds.length === 0) {
    return NextResponse.json({ participants: [] });
  }

  // 3. 프로필 정보 조회
  // user_profiles 테이블에 user_id 컬럼이 없고 id 컬럼이 user_id(auth.uid) 역할을 함
  let profileQuery = supabase
    .from("user_profiles")
    .select(`
      id,
      nickname,
      role,
      job_title,
      work_field,
      company,
      interest_keywords,
      profile_image_url,
      introduction
    `)
    .in("id", participantIds) // user_id -> id
    .neq("id", user.id); // user_id -> id

  // 검색 필터 적용
  if (query) {
    // interest_keywords(배열)에 대한 검색 추가 (cs: contains)
    // nickname, company, role, job_title, introduction에 대한 ilike 검색
    // 주의: cs 연산자는 정확히 일치하는 태그가 있을 때만 매칭됨 (예: "창업" 검색 시 ["창업"] 매칭, ["창업가"] 미매칭)
    const orConditions = [
      `nickname.ilike.%${query}%`,
      `company.ilike.%${query}%`,
      `role.ilike.%${query}%`,
      `job_title.ilike.%${query}%`,
      `introduction.ilike.%${query}%`,
      `interest_keywords.cs.{${query}}` // 태그 검색 추가
    ].join(",");
    
    profileQuery = profileQuery.or(orConditions);
  }

  // 1000명까지 조회 (기본 제한 해제)
  const { data: profiles, error: profilesError } = await profileQuery.range(0, 1000);

  if (profilesError) {
    console.error("Error fetching profiles:", profilesError);
    return NextResponse.json({ error: profilesError.message }, { status: 500 });
  }

  // 프론트엔드 호환성을 위해 user_id 필드 추가 (id 값을 그대로 사용)
  const mappedProfiles = profiles.map(profile => ({
    ...profile,
    user_id: profile.id
  }));

  return NextResponse.json({ participants: mappedProfiles });
}
