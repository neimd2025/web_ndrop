"use client"
import { useEffect, useState } from "react"
import Link from "next/link"
import { createClient } from "@/utils/supabase/client"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { MessageSquare, Clock } from "lucide-react"

interface ChatItem {
  meetingId: string
  eventId: string
  status: "accepted" | "confirmed"
  otherProfile: {
    id: string
    nickname: string | null
    profile_image_url: string | null
    role?: string | null
    job_title?: string | null
    company?: string | null
    work_field?: string | null
  }
  lastMessage?: string | null
  lastAt?: string | null
  eventTitle?: string | null
}

export default function ChatsPage() {
  const [items, setItems] = useState<ChatItem[]>([])
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

        const { data: meetings } = await supabase
          .from("event_meetings")
          .select("id, event_id, status, requester_id, receiver_id, created_at")
          .or(`requester_id.eq.${user.id},receiver_id.eq.${user.id}`)
          .in("status", ["accepted", "confirmed"])
          .order("created_at", { ascending: false })

        if (!meetings || meetings.length === 0) {
          setItems([])
          setLoading(false)
          return
        }

        const otherIds = Array.from(new Set(meetings.map((m: any) => (m.receiver_id === user.id ? m.requester_id : m.receiver_id))))
        const eventIds = Array.from(new Set(meetings.map((m: any) => m.event_id)))

        const [{ data: profiles }, { data: events }] = await Promise.all([
          supabase.from("user_profiles").select("id, nickname, profile_image_url, role, job_title, company, work_field").in("id", otherIds),
          supabase.from("events").select("id, title").in("id", eventIds)
        ])

        const profileMap = new Map((profiles || []).map((p: any) => [p.id, p]))
        const eventMap = new Map((events || []).map((e: any) => [e.id, e]))

        const meetingIds = (meetings as any[]).map((m: any) => m.id)
        const { data: messages } = await supabase
          .from("event_meeting_messages")
          .select("id, meeting_id, content, created_at")
          .in("meeting_id", meetingIds)
          .order("created_at", { ascending: false })

        const lastByMeeting = new Map<string, { content: string; created_at: string }>()
        ;(messages || []).forEach((msg: any) => {
          if (!lastByMeeting.has(msg.meeting_id)) {
            lastByMeeting.set(msg.meeting_id, { content: msg.content, created_at: msg.created_at })
          }
        })

        const rows: ChatItem[] = (meetings as any[]).map((m: any) => {
          const otherId = m.receiver_id === user.id ? m.requester_id : m.receiver_id
          const p: any = profileMap.get(otherId) || { id: otherId, nickname: "알 수 없음", profile_image_url: null }
          const last = lastByMeeting.get(m.id)
          const e: any = eventMap.get(m.event_id) || null
          return {
            meetingId: m.id,
            eventId: m.event_id,
            status: m.status,
            otherProfile: {
              id: p.id,
              nickname: p.nickname ?? null,
              profile_image_url: p.profile_image_url ?? null,
              role: p.role ?? null,
              job_title: p.job_title ?? null,
              company: p.company ?? null,
              work_field: p.work_field ?? null
            },
            lastMessage: last?.content ?? null,
            lastAt: last?.created_at ?? m.created_at,
            eventTitle: e?.title ?? null
          }
        })

        setItems(rows)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const empty = items.length === 0
  return (
    <div className="min-h-screen bg-slate-950 text-white pb-20">
      <div className="max-w-md mx-auto px-5 py-6">
        <h1 className="text-xl font-bold mb-4">채팅</h1>
        {loading ? (
          <div className="text-center py-16 text-slate-400">불러오는 중...</div>
        ) : empty ? (
          <div className="text-center py-16 text-slate-400">표시할 채팅이 없습니다</div>
        ) : (
          <div className="space-y-3">
            {items.map((item) => {
              const role = item.otherProfile.job_title || item.otherProfile.role || item.otherProfile.work_field || "직무 미입력"
              const company = item.otherProfile.company && item.otherProfile.company !== "미소속" ? item.otherProfile.company : null
              const subtitle = [role, company].filter(Boolean).join(" | ")
              return (
                <Link
                  key={item.meetingId}
                  href={`/client/events/${item.eventId}?tab=meetings&meetingId=${item.meetingId}&openChat=true`}
                  className="block bg-white/5 border border-white/10 rounded-xl p-4 hover:bg-white/10 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10 border border-purple-500/30">
                      <AvatarImage src={item.otherProfile.profile_image_url || undefined} className="object-cover" />
                      <AvatarFallback className="bg-slate-800 text-slate-400">
                        {item.otherProfile.nickname?.[0] || "?"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <div className="font-bold text-sm truncate">{item.otherProfile.nickname || "알 수 없음"}</div>
                        <div className="text-[10px] text-slate-500 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          <span>{new Date(item.lastAt || Date.now()).toLocaleString()}</span>
                        </div>
                      </div>
                      <div className="text-xs text-slate-400 truncate">{subtitle}</div>
                      <div className="text-[11px] text-slate-500 truncate mt-1">
                        {item.eventTitle ? `${item.eventTitle} · ` : ""}
                        {item.lastMessage ? item.lastMessage : "메시지를 시작해 보세요"}
                      </div>
                    </div>
                    <MessageSquare className="w-5 h-5 text-purple-400 shrink-0" />
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
