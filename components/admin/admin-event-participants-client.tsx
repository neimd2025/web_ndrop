"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { AdminEvent } from "@/lib/supabase/admin-server-actions"
import { ArrowLeft, Download, Mail, QrCode, Search, Users, XCircle } from "lucide-react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { toast } from "sonner"

interface Participant {
  id: string
  name: string
  email: string
  phone?: string
  company?: string
  position?: string
  profile_image_url?: string | null
  event_id: string
  status?: string
  created_at?: string
}

interface AdminEventParticipantsClientProps {
  event: AdminEvent
}

export function AdminEventParticipantsClient({ event }: AdminEventParticipantsClientProps) {
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState("")
  const [participants, setParticipants] = useState<Participant[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const fetchParticipants = async () => {
      try {
        setLoading(true)
        const adminToken = typeof window !== "undefined" ? localStorage.getItem("admin_token") : null

        if (!adminToken) {
          toast.error("인증 토큰이 없습니다. 다시 로그인해주세요.")
          return
        }

        const response = await fetch("/api/admin/get-participants", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${adminToken}`,
          },
          body: JSON.stringify({ eventId: event.id }),
        })

        const result = await response.json()

        if (!response.ok || !result.success) {
          console.error("참가자 조회 오류:", result)
          toast.error(result.error || "참가자 목록을 불러오는데 실패했습니다.")
          return
        }

        setParticipants(result.participants || [])
      } catch (error) {
        console.error("참가자 조회 오류:", error)
        toast.error("참가자 목록을 불러오는데 실패했습니다.")
      } finally {
        setLoading(false)
      }
    }

    fetchParticipants()
  }, [event.id])

  const totalParticipants = participants.length || event.current_participants || 0

  const filteredParticipants = participants.filter(participant => {
    const q = searchTerm.trim().toLowerCase()
    if (!q) return true

    return (
      participant.name.toLowerCase().includes(q) ||
      participant.email.toLowerCase().includes(q) ||
      (participant.company || "").toLowerCase().includes(q) ||
      (participant.position || "").toLowerCase().includes(q)
    )
  })

  const handleKickParticipant = async (participant: Participant) => {
    if (!participant.id) return

    const confirmKick = window.confirm(
      `${participant.name}님을 참가자 목록에서 내보내시겠어요?\n내보낸 참가자는 이 이벤트에 다시 참가할 수 없습니다.`,
    )

    if (!confirmKick) return

    try {
      const adminToken = typeof window !== "undefined" ? localStorage.getItem("admin_token") : null

      if (!adminToken) {
        toast.error("인증 토큰이 없습니다. 다시 로그인해주세요.")
        return
      }

      const response = await fetch("/api/admin/remove-participant", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({ participantId: participant.id }),
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        console.error("참가자 내보내기 오류:", result)
        toast.error(result.error || "참가자를 내보내는데 실패했습니다.")
        return
      }

      setParticipants(prev => prev.filter(p => p.id !== participant.id))
      toast.success(`${participant.name}님을 내보냈습니다.`)
    } catch (error) {
      console.error("참가자 내보내기 오류:", error)
      toast.error("참가자를 내보내는데 실패했습니다.")
    }
  }

  const getStatusBadge = (status?: string) => {
    if (!status) {
      return (
        <Badge variant="outline" className="bg-gray-50 text-gray-600 border-gray-200">
          등록됨
        </Badge>
      )
    }

    if (status === "confirmed") {
      return (
        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
          참여 확정
        </Badge>
      )
    }

    if (status === "checked_in") {
      return (
        <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
          현장 체크인
        </Badge>
      )
    }

    if (status === "canceled") {
      return (
        <Badge variant="outline" className="bg-red-50 text-red-600 border-red-200">
          취소
        </Badge>
      )
    }

    return (
      <Badge variant="outline" className="bg-gray-50 text-gray-600 border-gray-200">
        {status}
      </Badge>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Button variant="ghost" size="sm" onClick={() => router.back()} className="p-2">
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center">
              <Users className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">참가자 현황</h1>
              <p className="text-sm text-gray-600">{event.title}</p>
            </div>
          </div>
          <div className="flex space-x-2">
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              내보내기
            </Button>
            <Button variant="outline" size="sm">
              <QrCode className="h-4 w-4 mr-2" />
              QR 코드
            </Button>
          </div>
        </div>
      </div>

      <div className="px-6 py-8">
        <div className="max-w-6xl mx-auto space-y-6">
          <Card className="border-0 shadow-sm">
            <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between space-y-3 md:space-y-0 gap-4">
              <div>
                <CardTitle className="text-base font-semibold text-gray-900">
                  실시간 참가자 현황
                </CardTitle>
                <p className="mt-1 text-sm text-gray-500">
                  참가자 정보, 소속 및 역할, 상태를 한눈에 확인할 수 있어요.
                </p>
              </div>
              <div className="flex items-center gap-4 w-full md:w-auto md:justify-end">
                <div className="hidden md:flex items-center rounded-2xl bg-purple-50 px-4 py-2 flex-shrink-0">
                  <div className="w-8 h-8 rounded-xl bg-purple-600 flex items-center justify-center">
                    <Users className="h-4 w-4 text-white" />
                  </div>
                  <div className="ml-3">
                    <p className="text-[11px] font-medium text-purple-700 uppercase tracking-wide whitespace-nowrap leading-tight">
                      실시간 참가자 수
                    </p>
                    <p className="text-base font-semibold text-gray-900 whitespace-nowrap leading-tight">
                      {totalParticipants}
                    </p>
                  </div>
                </div>
                <div className="flex-1 max-w-xs md:max-w-sm">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      type="text"
                      placeholder="참가자 검색..."
                      value={searchTerm}
                      onChange={e => setSearchTerm(e.target.value)}
                      className="pl-9 pr-3 h-9 rounded-full bg-gray-50 border-gray-200 focus:bg-white text-sm"
                    />
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="rounded-2xl border border-gray-200 bg-gray-50/60 mx-6 mt-0 mb-6">
                <div className="px-6 pt-4 pb-3 border-b border-gray-200 text-xs font-medium text-gray-500 flex items-center">
                  <div className="flex-1">참가자 정보</div>
                  <div className="w-48">소속 및 역할</div>
                  <div className="w-28">상태</div>
                  <div className="w-24 text-center">커넥션</div>
                  <div className="w-16 text-right">옵션</div>
                </div>
                {loading ? (
                  <div className="py-10 text-center text-gray-500 text-sm bg-white rounded-b-2xl">
                    참가자 목록을 불러오는 중...
                  </div>
                ) : filteredParticipants.length === 0 ? (
                  <div className="py-10 text-center text-gray-500 text-sm bg-white rounded-b-2xl">
                    아직 참가자가 없거나 검색 조건에 맞는 참가자가 없습니다.
                  </div>
                ) : (
                  <div className="bg-white rounded-b-2xl">
                    {filteredParticipants.map((participant, index) => (
                      <div
                        key={participant.id}
                        className={`px-6 py-4 flex items-center ${
                          index !== filteredParticipants.length - 1 ? "border-b border-gray-100" : ""
                        }`}
                      >
                        <div className="flex-1 flex items-center gap-3">
                          <Avatar className="h-10 w-10">
                            {participant.profile_image_url ? (
                              <AvatarImage src={participant.profile_image_url} alt={participant.name} />
                            ) : (
                              <AvatarFallback className="bg-purple-100 text-purple-700 font-semibold text-sm">
                                {participant.name?.charAt(0) || "?"}
                              </AvatarFallback>
                            )}
                          </Avatar>
                          <div>
                            <div className="text-sm font-medium text-gray-900">{participant.name}</div>
                            <div className="text-xs text-gray-500">{participant.email}</div>
                          </div>
                        </div>
                        <div className="w-48">
                          {participant.company ? (
                            <>
                              <div className="text-sm text-gray-900">
                                {participant.company}
                              </div>
                              {participant.position && (
                                <div className="text-xs text-gray-500 mt-0.5">
                                  {participant.position}
                                </div>
                              )}
                            </>
                          ) : participant.position ? (
                            <div className="text-sm text-gray-900">
                              {participant.position}
                            </div>
                          ) : (
                            <div className="text-sm text-gray-400">
                              소속 정보 없음
                            </div>
                          )}
                        </div>
                        <div className="w-28">
                          {getStatusBadge(participant.status)}
                        </div>
                        <div className="w-24 text-center text-sm font-semibold text-purple-600">
                          -
                        </div>
                        <div className="w-16 text-right">
                          <div className="flex items-center justify-end gap-1">
                            {participant.email && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="text-gray-400 hover:text-purple-600"
                                onClick={() => window.open(`mailto:${participant.email}`, "_blank")}
                              >
                                <Mail className="h-4 w-4" />
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-gray-400 hover:text-red-600"
                              onClick={() => handleKickParticipant(participant)}
                            >
                              <XCircle className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
