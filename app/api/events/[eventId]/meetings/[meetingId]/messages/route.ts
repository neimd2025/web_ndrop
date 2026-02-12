
import { createClient, createAdminClient } from "@/utils/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ eventId: string; meetingId: string }> }
) {
  const supabase = await createClient();
  const { meetingId } = await params;

  // 인증 확인
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 메시지 조회 (오래된 순으로 정렬)
  const { data, error } = await supabase
    .from("event_meeting_messages")
    .select(`
      *,
      sender:user_profiles!sender_id (
        id,
        nickname,
        profile_image_url
      )
    `)
    .eq("meeting_id", meetingId)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Error fetching messages:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // 클라이언트에서 기대하는 형식으로 매핑 (이전 코드와의 호환성 유지)
  const formattedMessages = data?.map(msg => ({
    ...msg,
    sender: {
      user_profiles: {
        name: msg.sender?.nickname,
        avatar_url: msg.sender?.profile_image_url
      }
    }
  }));

  return NextResponse.json({ messages: formattedMessages });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ eventId: string; meetingId: string }> }
) {
  const supabase = await createClient();
  const { meetingId } = await params;
  const body = await request.json();
  const { content } = body;

  if (!content || !content.trim()) {
    return NextResponse.json({ error: "Content is required" }, { status: 400 });
  }

  // 인증 확인
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 메시지 생성
  const { data, error } = await supabase
    .from("event_meeting_messages")
    .insert({
      meeting_id: meetingId,
      sender_id: user.id,
      content: content.trim(),
    })
    .select(`
      *,
      sender:user_profiles!sender_id (
        id,
        nickname,
        profile_image_url
      )
    `)
    .single();

  if (error) {
    console.error("Error sending message:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // 포맷팅
  const formattedMessage = {
    ...data,
    sender: {
      user_profiles: {
        name: data.sender?.nickname,
        avatar_url: data.sender?.profile_image_url
      }
    }
  };

  // 알림 생성 (동기로 처리하여 확실한 전송 보장)
  try {
    // 1. 미팅 정보 조회 (상대방 ID 확인)
    const { data: meeting } = await supabase
      .from("event_meetings")
      .select("requester_id, receiver_id, event_id")
      .eq("id", meetingId)
      .single();

    if (meeting) {
      const targetUserId =
        meeting.requester_id === user.id ? meeting.receiver_id : meeting.requester_id;

      // 알림 데이터 준비
      const notificationData = {
        user_id: targetUserId,
        title: "새로운 메시지",
        message: content.length > 50 ? content.substring(0, 50) + "..." : content,
        notification_type: "meeting_chat",
        target_type: "specific",
        target_event_id: meeting.event_id,
        related_event_id: meeting.event_id,
        metadata: { meeting_id: meetingId },
        sent_by: user.id,
        read_at: null
      };

      // 2. 알림 생성 (Admin 권한으로 전송하여 RLS 우회)
            try {
              console.log('🚀 [MeetingChat] Attempting to send notification via Admin Client...');
              console.log('📦 Chat Notification Payload:', JSON.stringify(notificationData, null, 2));

              const supabaseAdmin = await createAdminClient();
              const { data: notiResult, error: adminError } = await supabaseAdmin
                .from("notifications")
                .insert(notificationData as any)
                .select()
                .single();

              if (adminError) {
                  console.error("❌ [MeetingChat] Admin notification failed:", adminError);
                  console.error("❌ [MeetingChat] Admin Error Details:", JSON.stringify(adminError, null, 2));
                  throw adminError; // Fallback
              }
              console.log('✅ [MeetingChat] Admin notification sent successfully:', notiResult);
            } catch (adminError) {
              console.warn("⚠️ [MeetingChat] Failed to use admin client, trying normal client:", adminError);
              
              // Fallback to user client
              try {
                const { data: fallbackResult, error: normalError } = await supabase
                  .from("notifications")
                  .insert(notificationData as any)
                  .select()
                  .single();

                if (normalError) {
                   console.error("❌ [MeetingChat] Normal notification failed:", normalError);
                   console.error("❌ [MeetingChat] Normal Error Details:", JSON.stringify(normalError, null, 2));
                } else {
                   console.log('✅ [MeetingChat] Normal notification sent successfully:', fallbackResult);
                }
              } catch (fallbackError) {
                 console.error("❌ [MeetingChat] Fallback notification failed:", fallbackError);
              }
            }
    }
  } catch (notiError) {
    console.error("Error creating notification:", notiError);
  }

  return NextResponse.json({ message: formattedMessage });
}
