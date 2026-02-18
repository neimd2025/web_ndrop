import { NextRequest, NextResponse } from "next/server"
import jwt from "jsonwebtoken"
import { createAdminClient } from "@/utils/supabase/server"

function groupCollectionsWithAllHours(
  collections: any[],
  groupBy: string,
  startDate: string,
  endDate: string
) {
  const groupMap = new Map<string, number>()

  const start = new Date(startDate)
  const end = new Date(endDate)
  const current = new Date(start)

  while (current <= end) {
    if (groupBy === "hour") {
      for (let hour = 0; hour < 24; hour++) {
        const dateStr = current.toISOString().split("T")[0]
        const key = `${dateStr} ${hour.toString().padStart(2, "0")}:00`
        groupMap.set(key, 0)
      }
      current.setDate(current.getDate() + 1)
    } else if (groupBy === "day") {
      const key = current.toISOString().split("T")[0]
      groupMap.set(key, 0)
      current.setDate(current.getDate() + 1)
    }
  }

  collections.forEach((collection: any) => {
    if (!collection.collected_at) return

    const date = new Date(collection.collected_at)
    let key: string

    switch (groupBy) {
      case "hour":
        key = `${date.toISOString().split("T")[0]} ${date
          .getHours()
          .toString()
          .padStart(2, "0")}:00`
        break
      case "day":
      default:
        key = date.toISOString().split("T")[0]
        break
    }

    if (groupMap.has(key)) {
      groupMap.set(key, (groupMap.get(key) || 0) + 1)
    }
  })

  return Array.from(groupMap.entries())
    .map(([label, count]) => ({
      date: label,
      count,
    }))
    .sort((a, b) => a.date.localeCompare(b.date))
}

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
    } catch {
      return NextResponse.json({ error: "유효하지 않은 토큰입니다." }, { status: 401 })
    }

    const body = await request.json()
    const eventId = body.eventId as string | undefined
    const groupBy = (body.groupBy as string | undefined) || "hour"

    if (!eventId) {
      return NextResponse.json({ error: "이벤트 ID가 필요합니다." }, { status: 400 })
    }

    const supabase = await createAdminClient()

    const { data: event, error: eventError } = await supabase
      .from("events")
      .select("start_date, end_date")
      .eq("id", eventId)
      .single()

    if (eventError || !event) {
      return NextResponse.json(
        { error: "이벤트 정보를 찾을 수 없습니다." },
        { status: 404 },
      )
    }

    const { data: participants, error: participantsError } = await supabase
      .from("event_participants")
      .select("user_id")
      .eq("event_id", eventId)
      .in("status", ["confirmed"])

    if (participantsError) {
      return NextResponse.json(
        { error: "참가자 정보를 불러오는데 실패했습니다." },
        { status: 500 },
      )
    }

    if (!participants || participants.length === 0) {
      return NextResponse.json({ success: true, timeline: [] })
    }

    const participantIds = (participants as any[])
      .map((p) => (p as any).user_id as string | null)
      .filter((id): id is string => Boolean(id))

    if (participantIds.length === 0) {
      return NextResponse.json({ success: true, timeline: [] })
    }

    const { data: collections, error: collectionsError } = await supabase
      .from("collected_cards")
      .select("collected_at")
      .in("collector_id", participantIds as any)
      .gte("collected_at", (event as any).start_date as string)
      .lte("collected_at", (event as any).end_date as string)
      .order("collected_at", { ascending: true })

    if (collectionsError) {
      return NextResponse.json(
        { error: "명함 수집 데이터를 불러오는데 실패했습니다." },
        { status: 500 },
      )
    }

    if (!collections || collections.length === 0) {
      return NextResponse.json({ success: true, timeline: [] })
    }

    const timeline = groupCollectionsWithAllHours(
      collections as any[],
      groupBy,
      (event as any).start_date as string,
      (event as any).end_date as string,
    )

    return NextResponse.json({
      success: true,
      timeline,
    })
  } catch {
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다." },
      { status: 500 },
    )
  }
}

