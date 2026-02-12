import { createClient, createAdminClient } from "@/utils/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ eventId: string; meetingId: string }> }
) {
  const supabase = await createClient();
  const { eventId, meetingId } = await params;
  const body = await request.json();
  const { status, slot_id } = body;

  if (!["accepted", "declined", "canceled", "confirmed"].includes(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  // 1. 권한 체크
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 2. 미팅 정보 조회 및 권한 검증
  const { data: meeting, error: fetchError } = await supabase
    .from("event_meetings")
    .select("*")
    .eq("id", meetingId)
    .single();

  if (fetchError || !meeting) {
    return NextResponse.json({ error: "Meeting not found" }, { status: 404 });
  }

  // 수락/거절은 receiver만 가능
  if ((status === "accepted" || status === "declined") && meeting.receiver_id !== user.id) {
    return NextResponse.json({ error: "Only receiver can accept/decline" }, { status: 403 });
  }

  // 취소는 requester만 가능 (혹은 receiver도 가능할 수 있지만 보통 요청자가 취소함)
  if (status === "canceled" && meeting.requester_id !== user.id) {
    // receiver도 accepted 상태에서는 취소(거절) 할 수 있게 허용하려면 로직 수정 필요
    // 여기서는 requester만 취소 가능하게 유지
    return NextResponse.json({ error: "Only requester can cancel" }, { status: 403 });
  }

  // 확정(confirmed)은 참여자 누구나 가능 (단, accepted 상태여야 함)
  if (status === "confirmed") {
    if (meeting.status !== "accepted") {
      return NextResponse.json({ error: "Meeting must be accepted before confirmation" }, { status: 400 });
    }
    if (meeting.requester_id !== user.id && meeting.receiver_id !== user.id) {
      return NextResponse.json({ error: "Only participants can confirm" }, { status: 403 });
    }
    if (!slot_id) {
      return NextResponse.json({ error: "Slot ID is required for confirmation" }, { status: 400 });
    }

    // 슬롯 유효성 및 중복 확인
    // 1) 슬롯 존재 여부 및 이벤트 일치 여부
    const { data: slot, error: slotError } = await supabase
      .from("event_time_slots")
      .select("*")
      .eq("id", slot_id)
      .eq("event_id", eventId)
      .single();
    
    if (slotError || !slot) {
      return NextResponse.json({ error: "Invalid slot" }, { status: 400 });
    }

    // 2) 이미 예약된 슬롯인지 확인
    const { data: existingBooking, error: bookingCheckError } = await supabase
      .from("event_meetings")
      .select("id")
      .eq("slot_id", slot_id)
      .eq("status", "confirmed")
      .neq("id", meetingId) // 자기 자신 제외 (업데이트 시)
      .maybeSingle();

    if (existingBooking) {
      return NextResponse.json({ error: "This slot is already booked" }, { status: 409 });
    }
  }

  // 3. 상태 업데이트
  const updateData: any = { status };
  if (status === "confirmed") {
    updateData.slot_id = slot_id;
  }

  const { data, error } = await supabase
    .from("event_meetings")
    .update(updateData)
    .eq("id", meetingId)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // 4. 알림 전송 (상태 변경 시)
  try {
    const targetUserId = user.id === meeting.requester_id ? meeting.receiver_id : meeting.requester_id;
    let title = "";
    let message = "";
    
    // 요청자 닉네임 가져오기
    const { data: actorProfile } = await supabase
      .from("user_profiles")
      .select("nickname")
      .eq("id", user.id)
      .single();
    const actorName = actorProfile?.nickname || "누군가";

    if (status === "accepted") {
      title = "미팅 요청 수락";
      message = `${actorName}님이 미팅 요청을 수락했습니다.`;
    } else if (status === "declined") {
      title = "미팅 요청 거절";
      message = `${actorName}님이 미팅 요청을 거절했습니다.`;
    } else if (status === "confirmed") {
      title = "미팅 확정";
      message = `${actorName}님이 미팅을 확정했습니다.`;
    } else if (status === "canceled") {
      title = "미팅 취소";
      message = `${actorName}님이 미팅을 취소했습니다.`;
    }

    if (title && message) {
        const notificationData = {
            user_id: targetUserId,
            notification_type: "meeting_status",
            title: title,
            message: message,
            target_type: "specific",
            target_event_id: eventId,
            related_event_id: eventId,
            metadata: { meeting_id: meetingId, status: status },
            sent_by: user.id,
            read_at: null
        };

        const supabaseAdmin = await createAdminClient();
        const { error: notiError } = await supabaseAdmin.from("notifications").insert(notificationData as any);
        
        if (notiError) {
             console.error("Failed to send notification:", notiError);
        } else {
             console.log(`Notification sent for status ${status} to ${targetUserId}`);
        }
    }
  } catch (notiError) {
    console.error("Error sending notification:", notiError);
  }

  return NextResponse.json({ meeting: data });
}
