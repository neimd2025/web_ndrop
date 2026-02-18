import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import jwt from "jsonwebtoken"
import QRCode from "qrcode"
import { createAdminClient } from "@/utils/supabase/server"
import { Database } from "@/types/supabase"
import { calculateEventStatus } from "@/lib/supabase/database"

export const dynamic = "force-dynamic"

interface EventDashboardPageProps {
  params: Promise<{
    id: string
  }>
}

export default async function EventDashboardPage({ params }: EventDashboardPageProps) {
  const { id } = await params

  const cookieStore = await cookies()
  const adminToken = cookieStore.get("admin_token")?.value

  if (!adminToken) {
    redirect("/admin/login")
  }

  let decoded: any
  try {
    decoded = jwt.verify(adminToken, process.env.JWT_SECRET || "fallback-secret") as any
    if (decoded.role_id !== 2) {
      redirect("/admin/login")
    }
  } catch {
    redirect("/admin/login")
  }

  const supabase = await createAdminClient()

  const { data: event } = await supabase
    .from("events")
    .select("*")
    .eq("id", id)
    .single()

  if (!event) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">이벤트를 찾을 수 없습니다</h1>
          <p className="text-gray-600">요청하신 이벤트가 존재하지 않거나 삭제되었습니다.</p>
        </div>
      </div>
    )
  }

  const eventRow = event as Database["public"]["Tables"]["events"]["Row"]
  const computedStatus = calculateEventStatus(eventRow)

  const [participantsRes, feedbackRes, confirmedRes, meetingsRes] = await Promise.all([
    supabase.from("event_participants").select("id,status,user_id").eq("event_id", id),
    supabase.from("feedback").select("rating").eq("event_id", id),
    supabase
      .from("event_participants")
      .select("user_id")
      .eq("event_id", id)
      .in("status", ["confirmed"]),
    supabase.from("event_meetings").select("id").eq("event_id", id),
  ])

  const participants =
    (participantsRes.data || []) as Database["public"]["Tables"]["event_participants"]["Row"][]
  const feedbackRows =
    (feedbackRes.data || []) as Database["public"]["Tables"]["feedback"]["Row"][]
  const confirmedParticipants = (confirmedRes.data || []) as { user_id: string }[]
  const meetings = (meetingsRes.data || []) as { id: string }[]

  const totalRegistered = participants.length
  const totalCheckedIn = participants.filter(p => p.status === "confirmed").length
  const capacity = eventRow.max_participants ?? 0
  const attendanceBase = capacity > 0 ? capacity : totalRegistered
  const attendanceRate =
    attendanceBase > 0 ? Math.round((totalCheckedIn / attendanceBase) * 100) : 0

  let totalConnections = 0
  if (confirmedParticipants.length > 0) {
    const ids = confirmedParticipants.map((p) => p.user_id)
    const { count } = await supabase
      .from("collected_cards")
      .select("*", { count: "exact", head: true })
      .in("collector_id", ids as any)
      .gte("collected_at", eventRow.start_date as string)
      .lte("collected_at", eventRow.end_date as string)
    totalConnections = count || 0
  }

  let totalMessages = 0
  if (meetings.length > 0) {
    const meetingIds = meetings.map((m) => m.id)
    const chunkSize = 100
    for (let i = 0; i < meetingIds.length; i += chunkSize) {
      const chunk = meetingIds.slice(i, i + chunkSize)
      const { count } = await supabase
        .from("event_meeting_messages")
        .select("*", { count: "exact", head: true })
        .in("meeting_id", chunk as any)
      totalMessages += count || 0
    }
  }

  let avgRating: number | null = null
  if (feedbackRows.length > 0) {
    const sum = feedbackRows.reduce((acc, row) => acc + (row.rating || 0), 0)
    avgRating = sum / feedbackRows.length
  }

  const participantUserIds = Array.from(
    new Set(
      participants
        .map((p) => p.user_id)
        .filter((id): id is string => Boolean(id))
    )
  )

  let interestStats: { label: string; value: number }[] = []
  let personalityStats: { label: string; value: number }[] = []
  let workFieldStats: { label: string; value: number }[] = []
  let ageGroupStats: { label: string; value: number }[] = []

  if (participantUserIds.length > 0) {
    const { data: profiles } = await supabase
      .from("user_profiles")
      .select(
        "id, interest_keywords, personality_keywords, work_field, birth_date, affiliation_type, job_title"
      )
      .in("id", participantUserIds as any)

    const interestMap: Record<string, number> = {}
    const personalityMap: Record<string, number> = {}
    const workFieldMap: Record<string, number> = {}
    const ageGroupsMap: Record<string, number> = {
      "20대 초반": 0,
      "20대 중반": 0,
      "20대 후반": 0,
      "30대 이상": 0,
    }

    const currentYear = new Date().getFullYear()

    for (const profile of (profiles || []) as any[]) {
      const interestKeywords = (profile.interest_keywords || []) as string[]
      const personalityKeywords = (profile.personality_keywords || []) as string[]
      const affiliationType = profile.affiliation_type as string | null
      const jobTitle = profile.job_title as string | null
      const birthDate = profile.birth_date as string | null

      for (const keyword of interestKeywords) {
        if (!keyword) continue
        interestMap[keyword] = (interestMap[keyword] || 0) + 1
      }

      for (const keyword of personalityKeywords) {
        if (!keyword) continue
        personalityMap[keyword] = (personalityMap[keyword] || 0) + 1
      }

      let workLabel: string | null = null
      if (affiliationType === "소속") {
        workLabel = jobTitle && typeof jobTitle === "string" && jobTitle.trim() !== "" ? jobTitle : null
      } else if (affiliationType === "미소속") {
        const workField = profile.work_field as string | null
        workLabel =
          workField && typeof workField === "string" && workField.trim() !== ""
            ? workField
            : null
      } else {
        const workField = profile.work_field as string | null
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
        workFieldMap[workLabel] = (workFieldMap[workLabel] || 0) + 1
      }

      if (birthDate) {
        const birthYear = new Date(birthDate).getFullYear()
        if (!Number.isNaN(birthYear)) {
          const age = currentYear - birthYear
          if (age >= 20 && age < 23) {
            ageGroupsMap["20대 초반"] += 1
          } else if (age >= 23 && age < 26) {
            ageGroupsMap["20대 중반"] += 1
          } else if (age >= 26 && age < 30) {
            ageGroupsMap["20대 후반"] += 1
          } else if (age >= 30) {
            ageGroupsMap["30대 이상"] += 1
          }
        }
      }
    }

    interestStats = Object.entries(interestMap)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 6)
      .map(([label, value]) => ({ label, value }))

    personalityStats = Object.entries(personalityMap)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 6)
      .map(([label, value]) => ({ label, value }))

    workFieldStats = Object.entries(workFieldMap)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([label, value]) => ({ label, value }))

    ageGroupStats = Object.entries(ageGroupsMap).map(([label, value]) => ({
      label,
      value,
    }))
  }

  const origin =
    process.env.NEXT_PUBLIC_BASE_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000")
  const qrJoinUrl = `${origin}/client/events/join?code=${eventRow.event_code}`

  const workFieldTotal = workFieldStats.reduce((sum, item) => sum + item.value, 0)
  let workFieldGradient = ""
  if (workFieldTotal > 0) {
    const colors = ["#793CE9", "#AD82FC", "#E665FF", "#FFB15C", "#5CD6FF"]
    let current = 0
    workFieldGradient = workFieldStats
      .map((item, index) => {
        const start = (current / workFieldTotal) * 100
        const end = ((current + item.value) / workFieldTotal) * 100
        const color = colors[index % colors.length]
        current += item.value
        return `${color} ${start}% ${end}%`
      })
      .join(", ")
  }

  const maxAgeGroupValue = Math.max(...ageGroupStats.map((g) => g.value), 1)
  const ageGroupTotal = ageGroupStats.reduce((sum, g) => sum + g.value, 0)

  let qrDataUrl: string | null = null
  if (eventRow.event_code) {
    try {
      qrDataUrl = await QRCode.toDataURL(qrJoinUrl, {
        width: 200,
        margin: 2,
        color: {
          dark: "#000000",
          light: "#FFFFFF",
        },
      })
    } catch {
      qrDataUrl = null
    }
  }

  return (
    <div className="min-h-screen bg-[#F5F7FB]">
      <div className="max-w-7xl mx-auto py-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <span>운영 대시보드</span>
              <span>·</span>
              <span>{eventRow.location}</span>
            </div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-semibold text-gray-900">{eventRow.title}</h1>
              <span
                className={`text-xs px-2 py-0.5 rounded-full border ${
                  computedStatus === "ongoing"
                    ? "bg-green-50 text-green-700 border-green-200"
                    : computedStatus === "upcoming"
                    ? "bg-blue-50 text-blue-700 border-blue-200"
                    : "bg-gray-50 text-gray-600 border-gray-200"
                }`}
              >
                {computedStatus === "ongoing"
                  ? "LIVE"
                  : computedStatus === "upcoming"
                  ? "예정"
                  : "종료"}
              </span>
            </div>
            <div className="text-sm text-gray-600">
              {eventRow.start_date?.slice(0, 16)} ~ {eventRow.end_date?.slice(0, 16)}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <div className="text-xs text-gray-500 mb-1">출석률</div>
            <div className="flex items-baseline gap-2">
              <div className="text-3xl font-semibold text-gray-900">{attendanceRate}%</div>
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {totalCheckedIn}명 / {(eventRow.max_participants ?? totalRegistered)}명
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <div className="text-xs text-gray-500 mb-1">네트워킹 성과 (디지털 명함 교환 횟수)</div>
            <div className="text-3xl font-semibold text-gray-900">{totalConnections}</div>
            <div className="text-xs text-gray-500 mt-1">행사 기간 동안 참가자들의 디지털 명함 교환 횟수</div>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <div className="text-xs text-gray-500 mb-1">네트워킹 메시지 참여</div>
            <div className="text-3xl font-semibold text-gray-900">{totalMessages}</div>
            <div className="text-xs text-gray-500 mt-1">네트워킹 채팅에서 주고받은 총 메시지 개수</div>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <div className="text-xs text-gray-500 mb-1">참가자 만족도</div>
            <div className="text-3xl font-semibold text-gray-900">
              {avgRating ? `${avgRating.toFixed(1)} / 5.0` : "-"}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {feedbackRows.length > 0 ? `${feedbackRows.length}건 응답` : "응답 없음"}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl border border-gray-100 p-6 flex flex-col lg:flex-row gap-6">
            <div className="flex-1">
              <div className="text-xs font-semibold text-green-600 mb-1">체크인 QR 코드</div>
              <div className="text-sm font-medium text-gray-900 mb-3">
                {eventRow.event_code ? `코드: ${eventRow.event_code}` : "이벤트 코드 없음"}
              </div>
              <div className="space-y-2 text-xs text-gray-600">
                <div>현장 입장용 QR입니다. 입구 배너/데스크에 배치하세요.</div>
                <div className="flex flex-wrap gap-2 mt-3">
                  {qrDataUrl && (
                    <a
                      href={qrDataUrl}
                      download={`checkin-${eventRow.event_code || "event"}.png`}
                      className="px-3 py-1.5 rounded-md border border-gray-300 text-gray-800"
                    >
                      QR 이미지 다운로드
                    </a>
                  )}
                </div>
                <div className="mt-3 text-xs text-gray-500 break-all">
                  체크인 링크: {qrJoinUrl}
                </div>
              </div>
            </div>
            <div className="flex items-center justify-center">
              {qrDataUrl ? (
                <div className="p-3 bg-white rounded-xl border border-gray-200 shadow-sm">
                  <img
                    src={qrDataUrl}
                    alt="체크인 QR 코드"
                    className="w-40 h-40 object-contain"
                  />
                </div>
              ) : (
                <div className="w-40 h-40 bg-gray-50 rounded-xl border border-gray-200 flex items-center justify-center text-xs text-gray-400">
                  QR 미리보기
                </div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="text-xs font-semibold text-purple-600 mb-1">참가자 비율</div>
                <div className="text-sm text-gray-800">분야 기준 구성</div>
              </div>
              {workFieldTotal > 0 && (
                <div className="text-xs text-gray-500">
                  총 {workFieldTotal}명
                </div>
              )}
            </div>
            {workFieldTotal === 0 ? (
              <div className="text-xs text-gray-400 py-8 text-center">
                참가자 비율 데이터를 불러올 수 없습니다.
              </div>
            ) : (
              <div className="flex flex-col md:flex-row items-center gap-6">
                <div className="relative w-40 h-40">
                  <div
                    className="w-full h-full rounded-full"
                    style={{
                      backgroundImage: workFieldGradient
                        ? `conic-gradient(${workFieldGradient})`
                        : undefined,
                      backgroundColor: workFieldGradient ? undefined : "#E5E7EB",
                    }}
                  />
                  <div className="absolute inset-6 bg-white rounded-full flex items-center justify-center">
                    <div className="text-center">
                      <div className="text-sm font-semibold text-gray-900">
                        참가자 비율
                      </div>
                      <div className="text-xs text-gray-500">
                        상위 {workFieldStats.length}개 분야
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex-1 space-y-2">
                  {workFieldStats.map((item, index) => {
                    const colors = ["#793CE9", "#AD82FC", "#E665FF", "#FFB15C", "#5CD6FF"]
                    const color = colors[index % colors.length]
                    const percent =
                      workFieldTotal > 0
                        ? Math.round((item.value / workFieldTotal) * 100)
                        : 0
                    return (
                      <div
                        key={item.label}
                        className="flex items-center justify-between text-xs text-gray-700"
                      >
                        <div className="flex items-center gap-2">
                          <span
                            className="w-2.5 h-2.5 rounded-full"
                            style={{ backgroundColor: color }}
                          />
                          <span className="truncate max-w-[120px] md:max-w-[180px]">
                            {item.label}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-gray-500">{item.value}명</span>
                          <span className="text-gray-400">{percent}%</span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:col-span-2">
            <div className="space-y-6">
              <div className="bg-white rounded-xl border border-gray-100 p-6">
                <div className="text-xs font-semibold text-purple-600 mb-1">실시간 참가자 구성</div>
                <div className="text-sm text-gray-800 mb-4">관심사 / 성격 키워드 분포</div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-xs text-gray-500 mb-2">관심사 분포</div>
                    <div className="space-y-2">
                      {interestStats.slice(0, 4).map((item) => (
                        <div key={item.label} className="flex items-center gap-2">
                          <div className="w-20 text-xs text-gray-600 truncate">{item.label}</div>
                          <div className="flex-1 h-2 rounded-full bg-gray-100 overflow-hidden">
                            <div
                              className="h-full bg-purple-500 rounded-full"
                              style={{
                                width: `${Math.min(
                                  100,
                                  (item.value /
                                    Math.max(...interestStats.map((i) => i.value), 1)) *
                                    100
                                )}%`,
                              }}
                            />
                          </div>
                          <div className="w-8 text-right text-xs text-gray-700">{item.value}</div>
                        </div>
                      ))}
                      {interestStats.length === 0 && (
                        <div className="text-xs text-gray-400">관심사 데이터가 없습니다.</div>
                      )}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 mb-2">성격 키워드 분포</div>
                    <div className="space-y-2">
                      {personalityStats.slice(0, 4).map((item) => (
                        <div key={item.label} className="flex items-center gap-2">
                          <div className="w-20 text-xs text-gray-600 truncate">{item.label}</div>
                          <div className="flex-1 h-2 rounded-full bg-gray-100 overflow-hidden">
                            <div
                              className="h-full bg-indigo-500 rounded-full"
                              style={{
                                width: `${Math.min(
                                  100,
                                  (item.value /
                                    Math.max(...personalityStats.map((i) => i.value), 1)) *
                                    100
                                )}%`,
                              }}
                            />
                          </div>
                          <div className="w-8 text-right text-xs text-gray-700">{item.value}</div>
                        </div>
                      ))}
                      {personalityStats.length === 0 && (
                        <div className="text-xs text-gray-400">성격 키워드 데이터가 없습니다.</div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl border border-gray-100 p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <div className="text-xs font-semibold text-purple-600 mb-1">연령대 분포</div>
                    <div className="text-sm text-gray-800">참가자 연령대 구성</div>
                  </div>
                </div>
                {ageGroupStats.every((g) => g.value === 0) ? (
                  <div className="text-xs text-gray-400 py-8 text-center">
                    연령대 데이터를 불러올 수 없습니다.
                  </div>
                ) : (
                  <div className="space-y-3 mt-2">
                    {ageGroupStats.map((group) => {
                      const width =
                        maxAgeGroupValue > 0
                          ? Math.max(8, (group.value / maxAgeGroupValue) * 100)
                          : 0
                      const percent =
                        ageGroupTotal > 0
                          ? Math.round((group.value / ageGroupTotal) * 100)
                          : 0
                      return (
                        <div
                          key={group.label}
                          className="flex items-center gap-3 text-xs text-gray-700"
                        >
                          <div className="w-16 text-[11px] text-gray-500">
                            {group.label}
                          </div>
                          <div className="flex-1 h-2.5 rounded-full bg-gray-100 overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-[#793CE9] to-[#AD82FC] rounded-full"
                              style={{ width: `${width}%` }}
                            />
                          </div>
                          <div className="w-10 text-right text-[11px] text-gray-700">
                            {group.value}명
                          </div>
                          <div className="w-8 text-right text-[11px] text-gray-400">
                            {percent}%
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>

            <div className="bg-gradient-to-r from-[#5C3BFF] to-[#8A5BFF] rounded-2xl p-8 text-white flex flex-col justify-between">
              <div>
                <div className="text-sm font-semibold opacity-90 mb-2">
                  AI 리포트 생성
                </div>
                <h2 className="text-2xl font-bold mb-3">
                  행사 성과를 AI로 즉시 분석해 보세요
                </h2>
                <p className="text-sm text-white/90 leading-relaxed">
                  실시간 데이터를 기반으로 참가자들의 만족도와 네트워킹 가치를 분석하여
                  전문적인 리포트를 자동 생성합니다.
                </p>
              </div>
              <div className="mt-6">
                <a
                  href={`/admin/events/${eventRow.id}/report`}
                  className="inline-flex items-center justify-center px-5 py-2.5 rounded-full bg-white text-[#5C3BFF] text-sm font-semibold shadow-md hover:shadow-lg hover:bg-slate-50 transition"
                >
                  지금 분석 리포트 생성
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
