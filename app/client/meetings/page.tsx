'use client'

import Link from "next/link"
import Image from "next/image"
import { createClient } from "@/utils/supabase/client"
import { useEffect, useMemo, useState } from "react"

type Profile = {
  id: string
  nickname: string | null
  profile_image_url: string | null
  job_title: string | null
  company: string | null
  role: string | null
  work_field: string | null
}

type MeetingRow = {
  id: string
  event_id: string
  status: "pending" | "accepted" | "confirmed" | "completed" | "declined" | "canceled"
  requester_id: string
  receiver_id: string
  created_at: string
  events: { id: string; title: string } | null
  requester: Profile | null
  receiver: Profile | null
}

type PersonItem = {
  key: string
  profile: Profile
  eventTitle: string
  meetingId: string
  status: MeetingRow["status"]
  direction: "sent" | "received"
  created_at: string
  eventId: string
  lastIsChat?: boolean
}

export default function AllMeetingsPage() {
  const [items, setItems] = useState<PersonItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          setItems([])
          setLoading(false)
          return
        }

        const { data: baseMeetings, error: baseErr } = await supabase
          .from("event_meetings")
          .select("id, event_id, status, requester_id, receiver_id, created_at")
          .or(`requester_id.eq.${user.id},receiver_id.eq.${user.id}`)
          .order("created_at", { ascending: false })

        if (baseErr) {
          setItems([])
        } else {
          const rows = (baseMeetings || []) as unknown as MeetingRow[]

          // Collect other user ids and event ids
          const otherIds = Array.from(new Set(rows.map((m) => (m.receiver_id === user.id ? m.requester_id : m.receiver_id))))
          const eventIds = Array.from(new Set(rows.map((m) => m.event_id)))

          // Fetch profiles and events in batch
          const [{ data: profiles }, { data: events }] = await Promise.all([
            otherIds.length > 0
              ? supabase.from("user_profiles").select("id, nickname, profile_image_url, job_title, company, role, work_field").in("id", otherIds)
              : Promise.resolve({ data: [] as any[] } as any),
            eventIds.length > 0
              ? supabase.from("events").select("id, title").in("id", eventIds)
              : Promise.resolve({ data: [] as any[] } as any),
          ])

          const profileMap = new Map((profiles || []).map((p: any) => [p.id, p]))
          const eventMap = new Map((events || []).map((e: any) => [e.id, e]))

          const meetingIds = rows.map(r => r.id)
          let lastByMeeting = new Map<string, string>()
          let hasChat = new Set<string>()
          if (meetingIds.length > 0) {
            const { data: msgs } = await supabase
              .from("event_meeting_messages")
              .select("meeting_id, created_at")
              .in("meeting_id", meetingIds)
              .order("created_at", { ascending: false })
            if (msgs) {
              for (const msg of msgs as any[]) {
                if (!lastByMeeting.has(msg.meeting_id)) {
                  lastByMeeting.set(msg.meeting_id, msg.created_at)
                  hasChat.add(msg.meeting_id)
                }
              }
            }
          }

          const mapped = rows.map((m: any) => {
            const isSent = m.requester_id === user.id
            const otherId = isSent ? m.receiver_id : m.requester_id
            const profile = profileMap.get(otherId) as Profile | undefined
            const e: any = eventMap.get(m.event_id) || null
            return {
              key: `${profile?.id ?? ""}`,
              profile: profile || {
                id: otherId,
                nickname: "알 수 없음",
                profile_image_url: null,
                job_title: null,
                company: null,
                role: null,
                work_field: null,
              },
              eventTitle: e?.title ?? "",
              meetingId: m.id,
              status: m.status,
              direction: isSent ? "sent" as const : "received" as const,
              created_at: lastByMeeting.get(m.id) || m.created_at,
              eventId: m.event_id,
              lastIsChat: hasChat.has(m.id)
            }
          }).filter(i => i.profile && i.profile.id)

          // Filter: show only meetings with chat started
          const chatOnly = rows.filter(r => hasChat.has(r.id))

          const dedup = new Map<string, PersonItem>()
          const statusPriority = (s: PersonItem["status"]) => (
            s === "confirmed" ? 0 :
            s === "accepted" ? 1 :
            s === "pending" ? 2 :
            s === "completed" ? 3 : 4
          )
          for (const it of mapped.filter(m => chatOnly.find(r => r.id === m.meetingId))) {
            const prev = dedup.get(it.key)
            if (!prev) {
              dedup.set(it.key, it)
            } else {
              const p1 = statusPriority(prev.status)
              const p2 = statusPriority(it.status)
              if (p2 < p1 || (p2 === p1 && new Date(it.created_at).getTime() > new Date(prev.created_at).getTime())) {
                dedup.set(it.key, it)
              }
            }
          }
          const arr = Array.from(dedup.values()).sort((a, b) => {
            const sp = statusPriority(a.status) - statusPriority(b.status)
            if (sp !== 0) return sp
            return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          })
          setItems(arr)
        }
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const empty = useMemo(() => items.length === 0, [items.length])

  return (
    <div className="min-h-screen bg-slate-950 text-white pb-20">
      <div className="max-w-md mx-auto px-5 py-6">
        <h1 className="text-xl font-bold mb-4">전체 미팅</h1>
        <p className="text-[11px] text-slate-500 mb-3">진행 중인 채팅만 보여줍니다. 카드 하단에 행사 출처와 최근 대화 시간을 표시합니다.</p>
        {loading ? (
          <div className="text-center py-16 text-slate-400">불러오는 중...</div>
        ) : empty ? (
          <div className="text-center py-16 text-slate-400">표시할 채팅이 없습니다</div>
        ) : (
          <div className="space-y-3">
            {items.map((p) => (
              <div key={p.key} className="bg-white/5 border border-white/10 rounded-xl p-4">
                <div className="flex gap-3 items-center">
                  <div className="w-12 h-12 rounded-full overflow-hidden bg-slate-800 flex items-center justify-center border border-white/10">
                    {p.profile.profile_image_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={p.profile.profile_image_url} alt="프로필" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-slate-300 text-sm">{p.profile.nickname?.[0] || "?"}</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <div className="min-w-0">
                        <div className="font-semibold text-sm truncate">{p.profile.nickname || "알 수 없음"}</div>
                        <div className="text-xs text-slate-400 truncate">
                          {(p.profile.job_title || p.profile.role || p.profile.work_field) || "직무 미입력"}
                          {p.profile.company ? ` · ${p.profile.company}` : ""}
                        </div>
                      </div>
                      <div className={`text-[10px] px-2 py-0.5 rounded-full border ${
                        p.status === "confirmed" ? "bg-green-500/20 text-green-300 border-green-500/30" :
                        p.status === "accepted" ? "bg-blue-500/20 text-blue-300 border-blue-500/30" :
                        p.status === "pending" ? "bg-yellow-500/20 text-yellow-300 border-yellow-700/30" :
                        "bg-gray-600/30 text-gray-300 border-gray-500/30"
                      }`}>
                        {p.status === "confirmed" ? "확정" :
                         p.status === "accepted" ? "수락" :
                         p.status === "pending" ? "요청" : "완료"}
                      </div>
                    </div>
                    <div className="text-[11px] text-slate-500 mt-1">
                      {p.eventTitle || "행사"} · 최근 대화 · {new Date(p.created_at).toLocaleString()}
                    </div>
                  </div>
                </div>
                <div className="mt-3 flex gap-2">
                  <Link
                    href={`/client/events/${p.eventId}?tab=meetings&meetingId=${p.meetingId}&openChat=true`}
                    className="flex-1 text-center text-sm bg-purple-600 hover:bg-purple-500 rounded-lg py-2"
                  >
                    대화하기
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
