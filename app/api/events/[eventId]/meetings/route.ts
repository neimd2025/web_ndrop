import { createClient, createAdminClient } from "@/utils/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  const supabase = await createClient();
  const { eventId } = await params;
  const body = await request.json();
  const { receiver_id, message } = body;

  // 1. 권한 체크
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!receiver_id) {
    return NextResponse.json({ error: "Receiver ID is required" }, { status: 400 });
  }

  if (user.id === receiver_id) {
    return NextResponse.json({ error: "Cannot request meeting to yourself" }, { status: 400 });
  }

  // 2. 중복 요청 확인
  const { data: existingMeeting } = await supabase
    .from("event_meetings")
    .select("id, status")
    .eq("event_id", eventId)
    .or(`and(requester_id.eq.${user.id},receiver_id.eq.${receiver_id}),and(requester_id.eq.${receiver_id},receiver_id.eq.${user.id})`)
    .maybeSingle(); // single() 대신 maybeSingle() 사용 (없을 수도 있음)

  if (existingMeeting) {
    // 이미 진행 중인 미팅이 있으면 에러 처리 (단, 취소/거절된 경우는 다시 요청 가능할 수도 있음 -> 정책에 따름)
    // 여기서는 pending, accepted, confirmed 상태면 중복 요청 불가
    if (["pending", "accepted", "confirmed"].includes(existingMeeting.status)) {
      return NextResponse.json({ error: "Meeting already exists or pending" }, { status: 409 });
    }
  }

  // 3. 미팅 요청 생성
  const { data, error } = await supabase
    .from("event_meetings")
    .insert({
      event_id: eventId,
      requester_id: user.id,
      receiver_id: receiver_id,
      status: "pending",
      message: message || null,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // 4. 알림 생성
  // 요청자 정보 가져오기 (알림 메시지 구성을 위해)
  const { data: requesterProfile } = await supabase
    .from("user_profiles")
    .select("nickname")
    .eq("id", user.id)
    .single();

  const requesterName = requesterProfile?.nickname || "누군가";

  // 알림 데이터 준비
  const notificationData = {
    user_id: receiver_id,
    notification_type: "meeting_request",
    title: "새로운 미팅 요청",
    message: `${requesterName}님이 미팅을 요청했습니다.`,
    target_type: "specific",
    target_event_id: eventId,
    related_event_id: eventId,
    metadata: { meeting_id: data.id },
    sent_by: user.id,
    read_at: null
  };

  // Admin 권한으로 알림 생성 시도 (RLS 우회 및 확실한 전송 보장)
  let notificationSuccess = false;
  
  try {
    console.log('🚀 [MeetingRequest] Attempting to send notification via Admin Client...');
    console.log('📦 Notification Payload:', JSON.stringify(notificationData, null, 2));

    const supabaseAdmin = await createAdminClient();
    const { data: notiResult, error: adminError } = await supabaseAdmin
      .from("notifications")
      .insert(notificationData as any)
      .select()
      .single();

    if (adminError) {
      console.error("❌ [MeetingRequest] Admin notification failed:", adminError);
      console.error("❌ [MeetingRequest] Error Details:", JSON.stringify(adminError, null, 2));
      throw adminError; // Fallback으로 이동
    }
    console.log('✅ [MeetingRequest] Admin notification sent successfully:', notiResult);
    notificationSuccess = true;
  } catch (error) {
    console.warn("⚠️ [MeetingRequest] Admin client failed, trying normal client:", error);
    
    // 일반 클라이언트로 재시도
    try {
      const { data: fallbackResult, error: normalError } = await supabase
        .from("notifications")
        .insert(notificationData as any)
        .select()
        .single();

      if (normalError) {
        console.error("❌ [MeetingRequest] Normal notification failed:", normalError);
        console.error("❌ [MeetingRequest] Normal Error Details:", JSON.stringify(normalError, null, 2));
      } else {
        console.log('✅ [MeetingRequest] Normal notification sent successfully:', fallbackResult);
      }
    } catch (finalError) {
      console.error("❌ [MeetingRequest] Final fallback failed:", finalError);
    }
  }

  return NextResponse.json({ message: "Meeting requested successfully", data });
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  const supabase = await createClient();
  const { eventId } = await params;

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 1. 내가 참여한 미팅 조회
  const { data: meetings, error } = await supabase
    .from("event_meetings")
    .select("*")
    .eq("event_id", eventId)
    .or(`requester_id.eq.${user.id},receiver_id.eq.${user.id}`)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!meetings || meetings.length === 0) {
    return NextResponse.json({ meetings: [] });
  }

  // 2. 관련 프로필 ID 수집
  const profileIds = new Set<string>();
  meetings.forEach((m) => {
    profileIds.add(m.requester_id);
    profileIds.add(m.receiver_id);
  });

  // 3. 프로필 정보 조회 (Application-side Join)
  // user_profiles.user_id 대신 id 컬럼 사용
  const { data: profiles, error: profilesError } = await supabase
    .from("user_profiles")
    .select("id, nickname, profile_image_url, role, job_title, company, work_field")
    .in("id", Array.from(profileIds));

  if (profilesError) {
    return NextResponse.json({ error: profilesError.message }, { status: 500 });
  }

  // 4. 데이터 병합
  const profileMap = new Map(profiles.map((p) => [p.id, p]));

  const joinedMeetings = meetings.map((m) => {
    const requester = profileMap.get(m.requester_id) || { id: m.requester_id, nickname: "알 수 없음" };
    const receiver = profileMap.get(m.receiver_id) || { id: m.receiver_id, nickname: "알 수 없음" };
    
    // 프론트엔드에서 필요한 포맷으로 변환
    const isReceived = m.receiver_id === user.id;
    const otherProfile = isReceived ? requester : receiver;

    return {
      ...m,
      requester,
      receiver,
      other_profile: otherProfile,
      is_received: isReceived,
    };
  });

  return NextResponse.json({ meetings: joinedMeetings });
}
