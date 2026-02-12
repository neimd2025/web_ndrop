import { createClient } from "@/utils/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  const supabase = await createClient();
  const { eventId } = await params;

  // 1. 권한 체크 (로그인 여부)
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 2. 타임슬롯 조회
  const { data: slots, error } = await supabase
    .from("event_time_slots")
    .select("*")
    .eq("event_id", eventId)
    .eq("is_blocked", false)
    .order("start_time", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // 3. 이미 예약된 슬롯인지 확인
  // 해당 이벤트의 confirmed된 미팅들의 slot_id를 조회
  const { data: bookedMeetings, error: bookingError } = await supabase
    .from("event_meetings")
    .select("slot_id")
    .eq("event_id", eventId)
    .eq("status", "confirmed")
    .not("slot_id", "is", null);

  if (bookingError) {
    return NextResponse.json({ error: bookingError.message }, { status: 500 });
  }

  const bookedSlotIds = new Set(bookedMeetings?.map(m => m.slot_id) || []);

  // 예약 가능 여부 추가
  const slotsWithAvailability = slots.map(slot => ({
    ...slot,
    is_booked: bookedSlotIds.has(slot.id)
  }));

  return NextResponse.json({ slots: slotsWithAvailability });
}
