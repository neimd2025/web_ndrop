"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { calculateEventStatus } from "@/lib/supabase/database"
import { useAdminAuthStore } from "@/stores/admin-auth-store"
import { createClient } from "@/utils/supabase/client"
import { Calendar, Plus, Users } from "lucide-react"
import Link from "next/link"
import { useEffect, useState } from "react"
import { toast } from "sonner"

interface Event {
  id: string
  title: string
  start_date: string
  end_date: string
  location: string
  status: "upcoming" | "ongoing" | "completed"
  max_participants: number
  event_code: string
  created_at: string
}

export default function AdminDashboard() {
  const { admin } = useAdminAuthStore()
  const [activeTab, setActiveTab] = useState("진행중")
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [showParticipants, setShowParticipants] = useState(false)
  const [showNotice, setShowNotice] = useState(false)
  const supabase = createClient()

  // 이벤트 데이터 가져오기
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setLoading(true)

                        // 이벤트 데이터 가져오기
        const { data, error } = await supabase
          .from('events')
          .select('*')
          .order('created_at', { ascending: false })

        if (error) {
          console.error('이벤트 가져오기 오류:', error)
          toast.error('이벤트를 불러오는데 실패했습니다.')
          return
        }

        setEvents(data || [])
      } catch (error) {
        console.error('이벤트 가져오기 오류:', error)
        toast.error('이벤트를 불러오는데 실패했습니다.')
      } finally {
        setLoading(false)
      }
    }

    fetchEvents()
  }, [supabase])

  const tabs = ["진행중", "예정", "종료"]

  // 탭에 따른 이벤트 필터링 - 현재 시간 기준으로 상태 계산
  const filteredEvents = events.filter(event => {
    const status = calculateEventStatus(event)
    switch (activeTab) {
      case "진행중":
        return status === "ongoing"
      case "예정":
        return status === "upcoming"
      case "종료":
        return status === "completed"
      default:
        return true
    }
  })

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit"
    })
  }

  const getStatusBadge = (event: any) => {
    const status = calculateEventStatus(event)
    const statusConfig = {
      upcoming: { label: "예정", color: "bg-blue-600" },
      ongoing: { label: "진행중", color: "bg-green-600" },
      completed: { label: "종료", color: "bg-gray-600" }
    }
    const config = statusConfig[status as keyof typeof statusConfig] || { label: status, color: "bg-gray-600" }
    return <Badge className={`${config.color} text-white`}>{config.label}</Badge>
  }

  return (
    <div className="min-h-screen bg-white">
      {/* AdminHeader */}
      {/* This component was removed as per the new_code, but the import was kept. */}
      {/* Assuming AdminHeader is no longer needed or will be re-added elsewhere. */}

      <div className="px-4 py-6 space-y-6">
        {/* Tabs */}
        <div className="flex space-x-1 bg-gray-100 p-1 rounded-xl">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
                activeTab === tab ? "bg-white text-gray-900 shadow-sm" : "text-gray-600 hover:text-gray-900"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Events List */}
        <div className="space-y-4">
          {loading ? (
            <p>이벤트를 불러오는 중입니다...</p>
          ) : filteredEvents.length === 0 ? (
            <p>현재 표시된 이벤트가 없습니다.</p>
          ) : (
            filteredEvents.map((event) => (
              <Card key={event.id} className="border border-gray-200 overflow-hidden">
                                  <div className="relative">
                    <img src="/placeholder.svg" alt={event.title} className="w-full h-48 object-cover" />
                    {getStatusBadge(event)}
                  </div>
                <CardContent className="p-4 space-y-4">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">{event.title}</h3>
                    <p className="text-gray-500">
                      시작: {formatDate(event.start_date)}, 종료: {formatDate(event.end_date)}
                    </p>
                    <p className="text-gray-500">위치: {event.location}</p>
                    <div className="flex items-center justify-between mt-2">
                      <p className="text-sm text-gray-600">최대 참여자: {event.max_participants}명</p>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-500">코드: {event.event_code}</span>
                        <Badge variant="outline" className="text-purple-600 border-purple-200">
                          링크
                        </Badge>
                      </div>
                    </div>
                  </div>

                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 bg-transparent"
                      onClick={() => setShowParticipants(true)}
                    >
                      <Users className="h-4 w-4 mr-2" />
                      참여자 보기
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 bg-transparent"
                      onClick={() => setShowNotice(true)}
                    >
                      <Calendar className="h-4 w-4 mr-2" />
                      공지 전송
                    </Button>
                    <Button variant="outline" size="sm" className="flex-1 bg-transparent">
                      리포트 받기
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>

      {/* Floating Action Button */}
      <Link href="/admin/events/new">
        <Button
          size="lg"
          className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-purple-600 hover:bg-purple-700 shadow-lg"
        >
          <Plus className="h-6 w-6" />
        </Button>
      </Link>

      {/* Modals */}
      {/* ParticipantModal and NoticeModal were removed as per the new_code, but their imports were kept. */}
      {/* Assuming they will be re-added elsewhere or are no longer needed. */}
    </div>
  )
}
