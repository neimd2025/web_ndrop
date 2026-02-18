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
    } catch {
      return NextResponse.json({ error: "유효하지 않은 토큰입니다." }, { status: 401 })
    }

    const { eventId } = await request.json()
    if (!eventId) {
      return NextResponse.json({ error: "이벤트 ID가 필요합니다." }, { status: 400 })
    }

    const supabase = await createAdminClient()

    const [
      { data: event },
      participantsRes,
      feedbackRes,
      confirmedRes,
      meetingsRes,
    ] = await Promise.all([
      supabase
        .from("events")
        .select("title, start_date, end_date, location, max_participants")
        .eq("id", eventId)
        .single(),
      supabase
        .from("event_participants")
        .select("id,status,user_id,joined_at")
        .eq("event_id", eventId),
      supabase.from("feedback").select("rating").eq("event_id", eventId),
      supabase
        .from("event_participants")
        .select("user_id")
        .eq("event_id", eventId)
        .in("status", ["confirmed"]),
      supabase.from("event_meetings").select("id").eq("event_id", eventId),
    ])

    let capacity = 0
    let eventInfo: {
      title: string
      startDate: string
      endDate: string
      location: string | null
    } | null = null

    if (event) {
      eventInfo = {
        title: (event as any).title,
        startDate: (event as any).start_date,
        endDate: (event as any).end_date,
        location: (event as any).location ?? null,
      }
      capacity = (event as any).max_participants ?? 0
    }

    const participants = (participantsRes.data || []) as any[]
    const feedbackRows = (feedbackRes.data || []) as any[]
    const confirmedParticipants = (confirmedRes.data || []) as {
      user_id: string
    }[]
    const meetings = (meetingsRes.data || []) as { id: string }[]

    const totalRegistered = participants.length
    const totalCheckedIn = participants.filter(p => p.status === "confirmed").length

    const attendanceBase = capacity > 0 ? capacity : totalRegistered
    const attendanceRate =
      attendanceBase > 0 ? Math.round((totalCheckedIn / attendanceBase) * 100) : 0

    let totalConnections = 0
    if (confirmedParticipants.length > 0 && event) {
      const ids = confirmedParticipants.map(p => p.user_id)
      const { count } = await supabase
        .from("collected_cards")
        .select("*", { count: "exact", head: true })
        .in("collector_id", ids as any)
        .gte("collected_at", (event as any).start_date as string)
        .lte("collected_at", (event as any).end_date as string)
      totalConnections = count || 0
    }

    let totalMessages = 0
    const messageSenderSet = new Set<string>()
    if (meetings.length > 0) {
      const meetingIds = meetings.map(m => m.id)
      const chunkSize = 100
      for (let i = 0; i < meetingIds.length; i += chunkSize) {
        const chunk = meetingIds.slice(i, i + chunkSize)
        const { data: messagesChunk } = await supabase
          .from("event_meeting_messages")
          .select("sender_id")
          .in("meeting_id", chunk as any)
        const rows = (messagesChunk || []) as { sender_id: string | null }[]
        totalMessages += rows.length
        for (const row of rows) {
          if (row.sender_id) {
            messageSenderSet.add(row.sender_id)
          }
        }
      }
    }

    const networkingParticipants = messageSenderSet.size
    const networkingParticipationRate =
      totalCheckedIn > 0
        ? Math.round((networkingParticipants / totalCheckedIn) * 100)
        : 0

    let avgRating: number | null = null
    if (feedbackRows.length > 0) {
      const sum = feedbackRows.reduce(
        (acc: number, row: any) => acc + (row.rating || 0),
        0,
      )
      avgRating = sum / feedbackRows.length
    }

    const avgConnectionsPerPerson =
      totalCheckedIn > 0 ? Number((totalConnections / totalCheckedIn).toFixed(1)) : 0

    const timelineBucketsMap = new Map<string, number>()
    for (const p of participants) {
      if (p.status !== "confirmed") continue
      const joinedAt = (p as any).joined_at as string | null
      if (!joinedAt) continue
      const date = new Date(joinedAt)
      if (Number.isNaN(date.getTime())) continue
      const dateStr = date.toISOString().split("T")[0]
      const hourStr = date.getHours().toString().padStart(2, "0")
      const key = `${dateStr} ${hourStr}:00`
      timelineBucketsMap.set(key, (timelineBucketsMap.get(key) || 0) + 1)
    }
    const checkinTimeline = Array.from(timelineBucketsMap.entries())
      .map(([label, count]) => ({ date: label, count }))
      .sort((a, b) => a.date.localeCompare(b.date))

    const participantUserIds = Array.from(
      new Set(
        participants
          .map(p => p.user_id)
          .filter((id): id is string => Boolean(id)),
      ),
    )

    let interestStats: { label: string; value: number }[] = []
    let roleStats: { label: string; value: number }[] = []
    let ageStats: { label: string; value: number }[] = []
    let mbtiStats: { label: string; value: number }[] = []

    if (participantUserIds.length > 0) {
      const { data: profiles } = await supabase
        .from("user_profiles")
        .select(
          "id, interest_keywords, work_field, birth_date, affiliation_type, job_title, mbti",
        )
        .in("id", participantUserIds as any)

      const interestMap: Record<string, number> = {}
      const roleMap: Record<string, number> = {}
      const ageMap: Record<string, number> = {}
      const mbtiMap: Record<string, number> = {}

      const currentYear = new Date().getFullYear()

      for (const profile of (profiles || []) as any[]) {
        const interestKeywords = (profile.interest_keywords || []) as string[]
        const affiliationType = profile.affiliation_type as string | null
        const jobTitle = profile.job_title as string | null
        const workField = profile.work_field as string | null
        const birthDate = profile.birth_date as string | null
        const mbti = (profile.mbti as string | null) || null

        for (const keyword of interestKeywords) {
          if (!keyword) continue
          interestMap[keyword] = (interestMap[keyword] || 0) + 1
        }

        let workLabel: string | null = null
        if (affiliationType === "소속") {
          workLabel =
            jobTitle && typeof jobTitle === "string" && jobTitle.trim() !== ""
              ? jobTitle
              : null
        } else if (affiliationType === "미소속") {
          workLabel =
            workField && typeof workField === "string" && workField.trim() !== ""
              ? workField
              : null
        } else {
          if (jobTitle && typeof jobTitle === "string" && jobTitle.trim() !== "") {
            workLabel = jobTitle
          } else if (
            workField &&
            typeof workField === "string" &&
            workField.trim() !== ""
          ) {
            workLabel = workField
          }
        }

        if (workLabel) {
          roleMap[workLabel] = (roleMap[workLabel] || 0) + 1
        }

        if (birthDate) {
          const birthYear = new Date(birthDate).getFullYear()
          if (!Number.isNaN(birthYear)) {
            const age = currentYear - birthYear
            const ageLabel =
              age >= 20 && age < 23
                ? "20대 초반"
                : age >= 23 && age < 26
                  ? "20대 중반"
                  : age >= 26 && age < 30
                    ? "20대 후반"
                    : age >= 30
                      ? "30대 이상"
                      : null
            if (ageLabel) {
              ageMap[ageLabel] = (ageMap[ageLabel] || 0) + 1
            }
          }
        }

        if (mbti) {
          const key = mbti.toUpperCase()
          mbtiMap[key] = (mbtiMap[key] || 0) + 1
        }
      }

      interestStats = Object.entries(interestMap)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 6)
        .map(([label, value]) => ({ label, value }))

      roleStats = Object.entries(roleMap)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .map(([label, value]) => ({ label, value }))

      ageStats = Object.entries(ageMap)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .map(([label, value]) => ({ label, value }))

      mbtiStats = Object.entries(mbtiMap)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 6)
        .map(([label, value]) => ({ label, value }))
    }

    return NextResponse.json({
      eventInfo,
      kpi: {
        attendanceRate,
        totalParticipants: totalRegistered,
        checkedIn: totalCheckedIn,
        connections: totalConnections,
        avgConnectionsPerPerson,
        messages: totalMessages,
        satisfaction: avgRating,
        networkingParticipationRate,
        networkingParticipants,
      },
      checkinTimeline,
      analytics: {
        interestStats,
        roleStats,
        ageStats,
        mbtiStats,
      },
    })
  } catch (error) {
    console.error("이벤트 리포트 데이터 생성 오류:", error)
    return NextResponse.json(
      { error: "이벤트 리포트 데이터를 가져오는 중 오류가 발생했습니다." },
      { status: 500 },
    )
  }
}

