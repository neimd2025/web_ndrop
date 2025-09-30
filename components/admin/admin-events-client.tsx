"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { useAdminAuth } from "@/hooks/use-admin-auth"
import { AdminEvent } from "@/lib/supabase/admin-server-actions"
import { calculateEventStatus } from "@/lib/supabase/database"
import { getSiteUrl, logError } from "@/lib/utils"
import { AnimatePresence, motion } from "framer-motion"
import { Bell, Calendar, Copy, Edit, Eye, FileText, MapPin, Plus, Save, Share, Trash2, Users, X } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { useEffect, useState } from "react"
import { toast } from "sonner"
interface Participant {
  id: string
  name: string
  email: string
  phone: string
  university?: string
  major?: string
  company?: string
  position?: string
  interests: string
  event_id: string
}

interface AdminEventsClientProps {
  initialEvents: AdminEvent[]
}

export function AdminEventsClient({ initialEvents }: AdminEventsClientProps) {
  const { admin } = useAdminAuth()
  const [filter, setFilter] = useState<"all" | "upcoming" | "ongoing" | "completed">("ongoing")
  const [showNoticeModal, setShowNoticeModal] = useState(false)
  const [showQRBottomSheet, setShowQRBottomSheet] = useState(false)
  const [showParticipantsBottomSheet, setShowParticipantsBottomSheet] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState<AdminEvent | null>(null)
  const [participants, setParticipants] = useState<Participant[]>([])
  const [noticeTitle, setNoticeTitle] = useState("")
  const [noticeMessage, setNoticeMessage] = useState("")
  const [loading, setLoading] = useState(false)
  const [qrData, setQrData] = useState<any>(null)
  const [events, setEvents] = useState<AdminEvent[]>(initialEvents)
  const [eventsLoading, setEventsLoading] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [eventToDelete, setEventToDelete] = useState<AdminEvent | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  // 이벤트 목록 가져오기
  const fetchEvents = async () => {
    try {
      setEventsLoading(true)
      const adminToken = localStorage.getItem('admin_token')
      if (!adminToken) {
        toast.error('인증 토큰이 없습니다. 다시 로그인해주세요.')
        return
      }

      const response = await fetch('/api/admin/get-events', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${adminToken}`
        }
      })

      const result = await response.json()

      if (!response.ok) {
        console.error('이벤트 목록 조회 오류:', result)
        toast.error(result.error || '이벤트 목록을 가져오는데 실패했습니다.')
        return
      }

      setEvents(result.events || [])
    } catch (error) {
      console.error('이벤트 목록 조회 오류:', error)
      toast.error('이벤트 목록을 가져오는 중 오류가 발생했습니다.')
    } finally {
      setEventsLoading(false)
    }
  }

  // 컴포넌트 마운트 시 이벤트 목록 가져오기 (초기 데이터가 없을 때만)
  useEffect(() => {
    if (initialEvents.length === 0) {
      fetchEvents()
    }
  }, [initialEvents.length])

  // 참여자 데이터 가져오기
  const fetchParticipants = async (eventId: string) => {
    try {
      // JWT 토큰 가져오기
      const adminToken = localStorage.getItem('admin_token')
      if (!adminToken) {
        toast.error('인증 토큰이 없습니다. 다시 로그인해주세요.')
        return
      }

      // 관리자용 참여자 조회 API 호출
      const response = await fetch('/api/admin/get-participants', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`
        },
        body: JSON.stringify({ eventId })
      })

      const result = await response.json()

      if (!response.ok) {
        console.error('참여자 조회 오류:', result)
        toast.error(result.error || '참여자를 불러오는데 실패했습니다.')
        return
      }

      setParticipants(result.participants || [])
    } catch (error) {
      logError('참여자 가져오기 오류:', error)
      toast.error('참여자를 불러오는데 실패했습니다.')
    }
  }

  const getStatusBadge = (event: any) => {
    const status = calculateEventStatus(event)
    const statusConfig = {
      upcoming: { label: "예정", color: "bg-blue-50 text-blue-700 border-blue-200" },
      ongoing: { label: "진행중", color: "bg-green-50 text-green-700 border-green-200" },
      completed: { label: "완료", color: " text-gray-700 border-gray-200" }
    }
    const config = statusConfig[status as keyof typeof statusConfig] || { label: status, color: " text-gray-700 border-gray-200" }
    return <Badge variant="outline" className={config.color}>{config.label}</Badge>
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit"
    })
  }

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleString("ko-KR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "Asia/Seoul"
    })
  }

  const filteredEvents = events.filter(event => {
    if (filter === "all") return true
    const status = calculateEventStatus(event)
    return status === filter
  })

  const handleSendNotice = async () => {
    if (!selectedEvent || !noticeTitle || !noticeMessage || !admin) {
      toast.error('제목과 메시지를 모두 입력해주세요.')
      return
    }

    try {
      setLoading(true)

      // JWT 토큰 가져오기
      const adminToken = localStorage.getItem('admin_token')
      if (!adminToken) {
        toast.error('인증 토큰이 없습니다. 다시 로그인해주세요.')
        return
      }

      // 관리자용 공지 전송 API 호출
      const response = await fetch('/api/admin/send-notice', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`
        },
        body: JSON.stringify({
          eventId: selectedEvent.id,
          title: noticeTitle,
          message: noticeMessage
        })
      })

      const result = await response.json()

      if (!response.ok) {
        console.error('공지 전송 오류:', result)
        console.error('응답 상태:', response.status)
        console.error('응답 헤더:', response.headers)
        console.error('요청 데이터:', {
          eventId: selectedEvent.id,
          title: noticeTitle,
          message: noticeMessage
        })
        toast.error(result.error || result.details || '공지 전송에 실패했습니다.')
        return
      }

      toast.success(`공지가 성공적으로 전송되었습니다. (대상: ${result.targetCount}명)`)
      setShowNoticeModal(false)
      setNoticeTitle("")
      setNoticeMessage("")
      setSelectedEvent(null)
    } catch (error) {
      logError('공지 전송 오류:', error)
      toast.error('공지 전송에 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const handleCopyLink = () => {
    if (selectedEvent) {
      const eventCode = qrData?.eventCode || selectedEvent.event_code
      navigator.clipboard.writeText(eventCode)
      toast.success('이벤트 코드가 복사되었습니다.')
    }
  }

  const handleShare = () => {
    if (selectedEvent) {
      // 이벤트 상세 페이지 URL만 복사
      const baseUrl = getSiteUrl()
      const eventDetailUrl = `${baseUrl}/client/events/${selectedEvent.id}`

      navigator.clipboard.writeText(eventDetailUrl)
      toast.success('이벤트 링크가 복사되었습니다.')
    }
  }

  const handleSaveQR = () => {
    if (qrData?.dataUrl) {
      // QR 코드 이미지 다운로드
      const link = document.createElement('a')
      link.href = qrData.dataUrl
      link.download = `qr-${selectedEvent?.event_code || 'event'}.png`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      toast.success('QR 코드가 저장되었습니다.')
    } else {
      toast.error('QR 코드를 먼저 생성해주세요.')
    }
  }

  const handleCopyJoinUrl = () => {
    if (selectedEvent) {
      const baseUrl = getSiteUrl()
      const eventJoinUrl = `${baseUrl}/client/events/join`

      navigator.clipboard.writeText(eventJoinUrl)
      toast.success('참여 페이지 링크가 복사되었습니다.')
    }
  }

  const handleCopyAll = () => {
    if (selectedEvent) {
      const baseUrl = getSiteUrl()
      const eventCode = qrData?.eventCode || selectedEvent.event_code
      const eventDetailUrl = `${baseUrl}/client/events/${selectedEvent.id}`
      const eventJoinUrl = `${baseUrl}/client/events/join`

      const allInfo = `이벤트 코드: ${eventCode}\n이벤트 상세: ${eventDetailUrl}\n참여 페이지: ${eventJoinUrl}`

      navigator.clipboard.writeText(allInfo)
      toast.success('모든 정보가 복사되었습니다.')
    }
  }

  const handleViewParticipants = async (event: AdminEvent) => {
    setSelectedEvent(event)
    await fetchParticipants(event.id)
    setShowParticipantsBottomSheet(true)
  }

  const handleViewQR = async (event: AdminEvent) => {
    setSelectedEvent(event)

    try {
      // JWT 토큰 가져오기
      const adminToken = localStorage.getItem('admin_token')
      if (!adminToken) {
        toast.error('인증 토큰이 없습니다. 다시 로그인해주세요.')
        return
      }

      // 관리자용 QR 코드 생성 API 호출
      const response = await fetch('/api/admin/generate-qr', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`
        },
        body: JSON.stringify({ eventId: event.id })
      })

      const result = await response.json()

      if (!response.ok) {
        console.error('QR 코드 생성 오류:', result)
        toast.error(result.error || 'QR 코드 생성에 실패했습니다.')
        return
      }

      setQrData(result.qr)
      setShowQRBottomSheet(true)
    } catch (error) {
      console.error('QR 코드 생성 오류:', error)
      toast.error('QR 코드 생성 중 오류가 발생했습니다.')
    }
  }

  // 이벤트 삭제 함수
  const handleDeleteEvent = async () => {
    if (!eventToDelete) return

    try {
      setDeleteLoading(true)

      // JWT 토큰 가져오기
      const adminToken = localStorage.getItem('admin_token')
      if (!adminToken) {
        toast.error('인증 토큰이 없습니다. 다시 로그인해주세요.')
        return
      }

      // 관리자용 이벤트 삭제 API 호출
      const response = await fetch(`/api/admin/delete-event/${eventToDelete.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${adminToken}`
        }
      })

      const result = await response.json()

      if (!response.ok) {
        console.error('이벤트 삭제 오류:', result)
        toast.error(result.error || '이벤트 삭제에 실패했습니다.')
        return
      }

      toast.success('이벤트가 성공적으로 삭제되었습니다.')

      // 이벤트 목록에서 제거
      setEvents(prevEvents => prevEvents.filter(event => event.id !== eventToDelete.id))

      // 모달 닫기
      setShowDeleteModal(false)
      setEventToDelete(null)
    } catch (error) {
      console.error('이벤트 삭제 오류:', error)
      toast.error('이벤트 삭제 중 오류가 발생했습니다.')
    } finally {
      setDeleteLoading(false)
    }
  }

  // 삭제 확인 모달 열기
  const handleDeleteClick = (event: AdminEvent) => {
    setEventToDelete(event)
    setShowDeleteModal(true)
  }

  return (
    <>
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <Image src="/images/logo.png" alt="ndrop" width={40} height={40} />
              <div>
                <span className="text-xl font-bold text-gray-900">ndrop</span>
                <div className="text-xs text-gray-500">이벤트 관리</div>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/admin/events/new">
              <Button className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white px-4 py-2 rounded-lg text-sm font-medium shadow-md">
                <Plus className="h-4 w-4 mr-2" />
                새 이벤트
              </Button>
            </Link>
            <Link href="/admin/my-page">
              <div className="w-8 h-8 bg-gradient-to-br from-purple-600 to-purple-700 rounded-full flex items-center justify-center shadow-md cursor-pointer hover:shadow-lg transition-shadow">
                <span className="text-white text-xs font-medium">
                  {admin?.name ? admin.name.charAt(0).toUpperCase() : 'A'}
                </span>
              </div>
            </Link>
          </div>
        </div>
      </div>

      <div className="px-6 py-8">
        {/* 필터 버튼 */}
        <div className="mb-6">
          <div className="bg-gray-100 rounded-lg p-1 inline-flex">
            {(["ongoing", "upcoming", "completed"] as const).map((status) => (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={`px-8 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
                  filter === status
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                {status === "ongoing" && "진행중"}
                {status === "upcoming" && "예정"}
                {status === "completed" && "종료"}
              </button>
            ))}
          </div>
        </div>

        {/* 이벤트 목록 */}
        <div className="space-y-6">
          {filteredEvents.length === 0 ? (
            <Card className="bg-white shadow-lg border-0">
              <CardContent className="p-12 text-center">
                <div className="w-20 h-20 bg-gradient-to-br from-purple-100 to-purple-200 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Calendar className="h-10 w-10 text-purple-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">이벤트가 없습니다</h3>
                <p className="text-gray-600 mb-6">새로운 이벤트를 생성하여 네트워킹을 시작해보세요</p>
                <Link href="/admin/events/new">
                  <Button className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 shadow-lg">
                    <Plus className="h-4 w-4 mr-2" />
                    이벤트 생성
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {filteredEvents.map((event) => (
                <Card key={event.id} className="overflow-hidden bg-white shadow-lg hover:shadow-xl transition-all duration-300 border-0">
                  <div className="relative">
                    {/* 이벤트 이미지 */}
                    <div className="h-32 relative overflow-hidden">
                      {event.image_url ? (
                        <img
                          src={event.image_url}
                          alt={event.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-purple-400 via-purple-500 to-purple-600 flex items-center justify-center">
                          <Calendar className="h-8 w-8 text-white opacity-50" />
                        </div>
                      )}

                      {/* 오버레이 및 상태 배지 */}
                      <div className="absolute top-3 left-3 flex items-center gap-2">
                        {getStatusBadge(event)}
                      </div>
                      <div className="absolute bottom-3 left-3 right-3">
                        <div className="flex items-center gap-2 text-white">
                          <MapPin className="h-4 w-4" />
                          <span className="text-sm font-medium">{event.location || "온라인"}</span>
                        </div>
                      </div>
                    </div>

                    {/* 이벤트 정보 */}
                    <div className="p-6">
                      <div className="mb-4">
                        <Link href={`/admin/events/${event.id}`}>
                          <h3 className="text-lg font-bold text-gray-900 mb-2 hover:text-purple-600 transition-colors cursor-pointer">
                            {event.title}
                          </h3>
                        </Link>
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            <span>{formatDateTime(event.start_date)}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Users className="h-4 w-4" />
                            <span>{event.current_participants || 0}/{event.max_participants}명</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-medium text-gray-500">코드:</span>
                          <code className="bg-gray-100 px-2 py-1 rounded text-xs font-mono text-gray-700">
                            {event.event_code}
                          </code>
                        </div>
                        <div className="w-6 h-6 border-2 border-purple-600 rounded-sm relative">
                          <div className="absolute inset-0.5 border border-purple-600 rounded-sm"></div>
                          <div className="absolute top-0.5 left-0.5 w-1 h-1 bg-purple-600 rounded-full"></div>
                          <div className="absolute bottom-0.5 right-0.5 w-1 h-1 bg-purple-600 rounded-full"></div>
                        </div>
                      </div>

                      {/* 액션 버튼 */}
                      <div className="space-y-3">
                        {/* 기본 액션 버튼 */}
                        <div className="grid grid-cols-3 gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex items-center gap-2 hover:bg-blue-50 hover:border-blue-200"
                            onClick={() => handleViewParticipants(event)}
                          >
                            <Eye className="h-4 w-4" />
                            <span className="hidden sm:inline">참여자 보기</span>
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex items-center gap-2 hover:bg-green-50 hover:border-green-200"
                            onClick={() => {
                              setSelectedEvent(event)
                              setShowNoticeModal(true)
                            }}
                          >
                            <Bell className="h-4 w-4" />
                            <span className="hidden sm:inline">공지 전송</span>
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex items-center gap-2 hover:bg-purple-50 hover:border-purple-200"
                            onClick={() => handleViewQR(event)}
                          >
                            <FileText className="h-4 w-4" />
                            <span className="hidden sm:inline">리포트 받기</span>
                          </Button>
                        </div>

                        {/* 관리 액션 버튼 */}
                        <div className="grid grid-cols-2 gap-2">
                          <Link href={`/admin/events/edit/${event.id}`}>
                            <Button
                              variant="outline"
                              size="sm"
                              className="flex items-center gap-2 hover:bg-orange-50 hover:border-orange-200 w-full"
                            >
                              <Edit className="h-4 w-4" />
                              <span className="hidden sm:inline">수정</span>
                            </Button>
                          </Link>
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex items-center gap-2 hover:bg-red-50 hover:border-red-200 text-red-600 hover:text-red-700"
                            onClick={() => handleDeleteClick(event)}
                          >
                            <Trash2 className="h-4 w-4" />
                            <span className="hidden sm:inline">삭제</span>
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 공지 전송 모달 */}
      {showNoticeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center">
                    <Bell className="h-5 w-5 text-white" />
                  </div>
                  <h2 className="text-xl font-semibold text-gray-900">공지 전송</h2>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowNoticeModal(false)}
                  className="hover:bg-gray-100"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">제목</label>
                  <input
                    type="text"
                    value={noticeTitle}
                    onChange={(e) => setNoticeTitle(e.target.value)}
                    placeholder="공지사항 제목을 입력하세요"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">메시지</label>
                  <textarea
                    value={noticeMessage}
                    onChange={(e) => setNoticeMessage(e.target.value)}
                    placeholder="참가자들에게 전달할 메시지를 입력하세요"
                    rows={4}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-8">
                <Button
                  variant="outline"
                  className="flex-1 py-3"
                  onClick={() => setShowNoticeModal(false)}
                >
                  취소
                </Button>
                <Button
                  className="flex-1 py-3 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800"
                  onClick={handleSendNotice}
                  disabled={loading}
                >
                  {loading ? '전송 중...' : '전송하기'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* QR 코드 바텀시트 */}
      <AnimatePresence>
        {showQRBottomSheet && selectedEvent && (
          <>
            {/* 배경 오버레이 */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black bg-opacity-50 z-50"
              onClick={() => setShowQRBottomSheet(false)}
            />

            {/* 바텀시트 */}
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-3xl shadow-2xl max-h-[90vh] overflow-hidden max-w-md mx-auto"
            >
              {/* 핸들 */}
              <div className="flex justify-center pt-4 pb-2">
                <div className="w-12 h-1 bg-gray-300 rounded-full"></div>
              </div>

              <div className="px-6 pb-8">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center">
                      <div className="w-5 h-5 border-2 border-white rounded-sm relative">
                        <div className="absolute inset-0.5 border border-white rounded-sm"></div>
                        <div className="absolute top-0.5 left-0.5 w-1 h-1 bg-white rounded-full"></div>
                        <div className="absolute bottom-0.5 right-0.5 w-1 h-1 bg-white rounded-full"></div>
                      </div>
                    </div>
                    <h2 className="text-xl font-semibold text-gray-900">참여자 QR 코드</h2>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowQRBottomSheet(false)}
                    className="hover:bg-gray-100"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                <div className="text-center mb-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-purple-700 rounded-xl flex items-center justify-center">
                      <span className="text-white font-bold text-sm">ND</span>
                    </div>
                    <div className="text-left">
                      <span className="font-semibold text-gray-900 text-lg">{selectedEvent.title}</span>
                      <div className="text-sm text-gray-600 space-y-1">
                        <p>{selectedEvent.event_code}</p>
                        <p>{formatDateTime(selectedEvent.start_date)}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="text-center mb-6">
                  <div className="w-56 h-56 rounded-2xl mx-auto mb-6 flex items-center justify-center shadow-inner">
                    {qrData ? (
                      <img
                        src={qrData.dataUrl}
                        alt="QR Code"
                        className="w-40 h-40 rounded-lg shadow-sm"
                      />
                    ) : (
                      <div className="text-center">
                        <div className="w-40 h-40 bg-white border-2 border-gray-300 rounded-lg mx-auto mb-3 shadow-sm flex items-center justify-center">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
                        </div>
                        <p className="text-xs text-gray-500 font-medium">QR 코드 생성 중...</p>
                      </div>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mb-4 leading-relaxed">
                    행사 참여에서 QR 코드를 스캔하면<br />자동으로 이벤트에 참여할 수 있어요<br />
                    또는 아래 코드를 직접 입력해도 됩니다
                  </p>
                  <div className="space-y-3 mb-6">
                    {/* 이벤트 코드 */}
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <p className="text-xs text-gray-500 mb-1">이벤트 코드</p>
                        <p className="text-sm font-mono text-gray-900">{qrData?.eventCode || selectedEvent.event_code}</p>
                      </div>
                      <Button variant="outline" size="sm" onClick={handleCopyLink} className="ml-3">
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>

                    {/* 이벤트 상세 */}
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <p className="text-xs text-gray-500 mb-1">이벤트 상세</p>
                        <p className="text-xs text-gray-600 break-all">{getSiteUrl()}/client/events/{selectedEvent.id}</p>
                      </div>
                      <Button variant="outline" size="sm" onClick={handleShare} className="ml-3">
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>

                    {/* 참여 페이지 */}
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <p className="text-xs text-gray-500 mb-1">참여 페이지</p>
                        <p className="text-xs text-gray-600 break-all">{getSiteUrl()}/client/events/join</p>
                      </div>
                      <Button variant="outline" size="sm" onClick={handleCopyJoinUrl} className="ml-3">
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 mb-6">
                  <Button variant="outline" size="sm" onClick={handleCopyAll} className="flex items-center gap-2">
                    <Share className="h-4 w-4" />
                    <span className="hidden sm:inline">모든 정보 복사</span>
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleSaveQR} className="flex items-center gap-2">
                    <Save className="h-4 w-4" />
                    <span className="hidden sm:inline">QR 저장</span>
                  </Button>
                </div>

                <Button
                  className="w-full py-3 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800"
                  onClick={() => setShowQRBottomSheet(false)}
                >
                  닫기
                </Button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* 참여자 명함보기 바텀시트 */}
      <AnimatePresence>
        {showParticipantsBottomSheet && selectedEvent && (
          <>
            {/* 배경 오버레이 */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black bg-opacity-50 z-50"
              onClick={() => setShowParticipantsBottomSheet(false)}
            />

            {/* 바텀시트 */}
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-3xl shadow-2xl max-h-[90vh] overflow-hidden max-w-md mx-auto"
            >
              {/* 핸들 */}
              <div className="flex justify-center pt-4 pb-2">
                <div className="w-12 h-1 bg-gray-300 rounded-full"></div>
              </div>

              <div className="px-6 pb-8">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                      <Users className="h-5 w-5 text-white" />
                    </div>
                    <h2 className="text-xl font-semibold text-gray-900">참여자 명함보기</h2>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowParticipantsBottomSheet(false)}
                    className="hover:bg-gray-100"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                <div className="space-y-4 max-h-[60vh] overflow-y-auto">
                  {participants.length === 0 ? (
                    <div className="text-center py-8">
                      <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600">아직 참여자가 없습니다.</p>
                    </div>
                  ) : (
                    participants.map((participant) => (
                      <Card key={participant.id} className="bg-white shadow-sm border border-gray-200">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between mb-3">
                            <div>
                              <h3 className="font-semibold text-gray-900 text-lg">{participant.name}</h3>
                              <p className="text-sm text-gray-600">
                                {participant.university && participant.major
                                  ? `${participant.university} / ${participant.major}`
                                  : participant.company && participant.position
                                  ? `${participant.company} / ${participant.position}`
                                  : "정보 없음"
                                }
                              </p>
                            </div>
                            <Button variant="outline" size="sm">
                              <Save className="h-4 w-4" />
                            </Button>
                          </div>
                          <div className="space-y-2">
                            <p className="text-sm text-gray-600">{participant.email}</p>
                            <p className="text-sm text-gray-600">{participant.phone}</p>
                            <div className=" rounded-lg p-2">
                              <p className="text-xs text-gray-600">관심분야: {participant.interests}</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* 삭제 확인 모달 */}
      {showDeleteModal && eventToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-red-600 rounded-lg flex items-center justify-center">
                    <Trash2 className="h-5 w-5 text-white" />
                  </div>
                  <h2 className="text-xl font-semibold text-gray-900">이벤트 삭제</h2>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setShowDeleteModal(false)
                    setEventToDelete(null)
                  }}
                  className="hover:bg-gray-100"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <div className="space-y-4">
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                    <span className="font-medium text-red-800">삭제할 이벤트</span>
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-1">{eventToDelete.title}</h3>
                  <p className="text-sm text-gray-600">
                    {formatDateTime(eventToDelete.start_date)} • {eventToDelete.current_participants || 0}명 참여
                  </p>
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-start gap-2">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2"></div>
                    <div>
                      <p className="font-medium text-yellow-800 mb-1">삭제 시 주의사항</p>
                      <ul className="text-sm text-yellow-700 space-y-1">
                        <li>• 이벤트와 관련된 모든 데이터가 삭제됩니다</li>
                        <li>• 참여자 정보와 피드백이 모두 삭제됩니다</li>
                        <li>• 삭제된 데이터는 복구할 수 없습니다</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <p className="text-sm text-gray-700">
                    정말로 이 이벤트를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.
                  </p>
                </div>
              </div>

              <div className="flex gap-3 mt-8">
                <Button
                  variant="outline"
                  className="flex-1 py-3"
                  onClick={() => {
                    setShowDeleteModal(false)
                    setEventToDelete(null)
                  }}
                  disabled={deleteLoading}
                >
                  취소
                </Button>
                <Button
                  className="flex-1 py-3 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800"
                  onClick={handleDeleteEvent}
                  disabled={deleteLoading}
                >
                  {deleteLoading ? (
                    <div className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      삭제 중...
                    </div>
                  ) : (
                    '삭제하기'
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
