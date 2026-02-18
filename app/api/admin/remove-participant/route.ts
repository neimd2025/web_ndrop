import { createClient } from "@/utils/supabase/server"
import jwt from "jsonwebtoken"
import { NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization")
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "인증 토큰이 필요합니다." }, { status: 401 })
    }

    const token = authHeader.substring(7)

    let decoded: any
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET || "fallback-secret") as any
      if (decoded.role_id !== 2) {
        return NextResponse.json({ error: "관리자 권한이 필요합니다." }, { status: 403 })
      }
    } catch (jwtError) {
      return NextResponse.json({ error: "유효하지 않은 토큰입니다." }, { status: 401 })
    }

    const { participantId } = await request.json()

    if (!participantId) {
      return NextResponse.json({ error: "참가자 ID가 필요합니다." }, { status: 400 })
    }

    const supabase = await createClient()

    const { data: participant, error: participantError } = await supabase
      .from("event_participants")
      .select("id,event_id,status")
      .eq("id", participantId)
      .single()

    if (participantError || !participant) {
      return NextResponse.json({ error: "참가자 정보를 찾을 수 없습니다." }, { status: 404 })
    }

    const { error: updateError } = await supabase
      .from("event_participants")
      .update({ status: "removed" })
      .eq("id", participantId)

    if (updateError) {
      console.error("참가자 상태 업데이트 오류:", updateError)
      return NextResponse.json({ error: "참가자를 내보내는 중 오류가 발생했습니다." }, { status: 500 })
    }

    if (participant.status === "confirmed" || participant.status === "checked_in") {
      const { data: event, error: eventError } = await supabase
        .from("events")
        .select("id,current_participants")
        .eq("id", participant.event_id)
        .single()

      if (!eventError && event) {
        const current = event.current_participants || 0
        const nextCount = current > 0 ? current - 1 : 0

        const { error: eventUpdateError } = await supabase
          .from("events")
          .update({ current_participants: nextCount })
          .eq("id", event.id)

        if (eventUpdateError) {
          console.error("이벤트 참가자 수 업데이트 오류:", eventUpdateError)
        }
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("참가자 내보내기 API 오류:", error)
    return NextResponse.json(
      {
        error: "서버 오류가 발생했습니다.",
      },
      { status: 500 },
    )
  }
}

