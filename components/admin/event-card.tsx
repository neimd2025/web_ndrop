"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { calculateEventStatus } from "@/lib/supabase/database"
import { Calendar, Users } from "lucide-react"
import { useState } from "react"

interface Event {
  id: string
  title: string
  start_date: string
  end_date: string
  location: string
  max_participants: number
  event_code: string
  created_at: string
}

interface EventCardProps {
  event: Event
}

export function EventCard({ event }: EventCardProps) {
  const [showParticipants, setShowParticipants] = useState(false)
  const [showNotice, setShowNotice] = useState(false)

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit"
    })
  }

  const getStatusBadge = (event: Event) => {
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
    <Card className="border border-gray-200 overflow-hidden">
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
  )
}