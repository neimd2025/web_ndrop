import { createAdminClient } from "@/utils/supabase/server"
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

    const { eventId } = await request.json()
    if (!eventId) {
      return NextResponse.json({ error: "이벤트 ID가 필요합니다." }, { status: 400 })
    }

    const supabase = await createAdminClient()

    const { data: event, error: eventError } = await supabase
      .from("events")
      .select("id,start_date,end_date")
      .eq("id", eventId)
      .single()

    if (eventError || !event) {
      return NextResponse.json({ error: "이벤트 정보를 찾을 수 없습니다." }, { status: 404 })
    }

    const { data: participants, error: participantsError } = await supabase
      .from("event_participants")
      .select("user_id")
      .eq("event_id", eventId)
      .in("status", ["confirmed"])

    if (participantsError) {
      console.error("참가자 조회 오류:", participantsError)
      return NextResponse.json({ error: "참가자 정보를 불러오는데 실패했습니다." }, { status: 500 })
    }

    if (!participants || participants.length === 0) {
      return NextResponse.json({ success: true, totalConnections: 0 })
    }

    const ids = (participants as any[])
      .map((p) => (p as any).user_id as string | null)
      .filter((id): id is string => Boolean(id))

    if (ids.length === 0) {
      return NextResponse.json({ success: true, totalConnections: 0 })
    }

    const { count, error: connectionsError } = await supabase
      .from("collected_cards")
      .select("*", { count: "exact", head: true })
      .in("collector_id", ids as any)
      .gte("collected_at", (event as any).start_date as string)
      .lte("collected_at", (event as any).end_date as string)

    if (connectionsError) {
      console.error("명함 교환 횟수 조회 오류:", connectionsError)
      return NextResponse.json(
        { error: "명함 교환 횟수를 계산하는 중 오류가 발생했습니다." },
        { status: 500 },
      )
    }

    return NextResponse.json({
      success: true,
      totalConnections: count || 0,
    })
  } catch (error) {
    console.error("명함 교환 횟수 API 오류:", error)
    return NextResponse.json(
      {
        error: "서버 오류가 발생했습니다.",
      },
      { status: 500 },
    )
  }
}
