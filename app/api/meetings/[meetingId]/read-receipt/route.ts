import { NextRequest, NextResponse } from "next/server"
import { createClient, createAdminClient } from "@/utils/supabase/server"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ meetingId: string }> }
) {
  const supabase = await createClient()
  const supabaseAdmin = await createAdminClient()
  const { meetingId } = await params

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { data: meeting, error: mErr } = await supabase
    .from("event_meetings")
    .select("requester_id, receiver_id")
    .eq("id", meetingId)
    .single()
  if (mErr || !meeting) {
    return NextResponse.json({ lastReadAt: null })
  }
  const otherUserId = meeting.requester_id === user.id ? meeting.receiver_id : meeting.requester_id

  const { data: reads } = await supabaseAdmin
    .from("notifications")
    .select("read_at")
    .eq("user_id", otherUserId)
    .eq("notification_type", "meeting_chat")
    .not("read_at", "is", null)
    .contains("metadata", { meeting_id: meetingId })
    .order("read_at", { ascending: false })
    .limit(1)

  const lastReadAt = Array.isArray(reads) && reads.length > 0 ? (reads[0] as any).read_at as string : null
  return NextResponse.json({ lastReadAt })
}
