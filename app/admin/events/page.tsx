"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { useUserProfile } from "@/hooks/use-user-profile"
import { calculateEventStatus } from "@/lib/supabase/database"
import { logError } from "@/lib/utils"
import { useAdminAuthStore } from "@/stores/admin-auth-store"
import { createClient } from "@/utils/supabase/client"
import { AnimatePresence, motion } from "framer-motion"
import { Bell, Calendar, Copy, Eye, FileText, MapPin, MoreVertical, Plus, Save, Share, Users, X } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
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
  current_participants?: number
  event_code: string
  created_at: string
  updated_at: string
  image_url?: string
  organizer_name?: string
  organizer_email?: string
  organizer_phone?: string
  organizer_kakao?: string
}

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

export default function AdminEventsPage() {
  const router = useRouter()
  const { admin, loading: adminLoading } = useAdminAuthStore()
  const { profile } = useUserProfile()
  const [filter, setFilter] = useState<"all" | "upcoming" | "ongoing" | "completed">("ongoing")
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [showNoticeModal, setShowNoticeModal] = useState(false)
  const [showQRBottomSheet, setShowQRBottomSheet] = useState(false)
  const [showParticipantsBottomSheet, setShowParticipantsBottomSheet] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null)
  const [participants, setParticipants] = useState<Participant[]>([])
  const [noticeTitle, setNoticeTitle] = useState("")
  const [noticeMessage, setNoticeMessage] = useState("")
  // 이벤트 데이터 가져오기
  useEffect(() => {
    // 인증 로딩이 완료된 후에만 이벤트 데이터 로드
    if (!adminLoading && admin) {
      const fetchEvents = async () => {
        try {
          setLoading(true)

          const supabase = createClient()
          // 이벤트 데이터 가져오기
          const { data, error } = await supabase
            .from('events')
            .select('*')
            .order('created_at', { ascending: false })

          if (error) {
            logError('이벤트 가져오기 오류:', error)
            toast.error('이벤트를 불러오는데 실패했습니다.')
            return
          }

          setEvents(data || [])
        } catch (error) {
          logError('이벤트 가져오기 오류:', error)
          toast.error('이벤트를 불러오는데 실패했습니다.')
        } finally {
          setLoading(false)
        }
      }

      fetchEvents()
    } else if (!adminLoading && !admin) {
      // 인증이 완료되었지만 관리자가 아닌 경우
      setLoading(false)
      router.push('/login')
    }
  }, [adminLoading, admin, router]) // supabase 의존성 제거

  // 참여자 데이터 가져오기
  const fetchParticipants = async (eventId: string) => {
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('event_participants')
        .select(`
          *,
          user_profiles!event_participants_user_profiles_fkey(full_name, email, company, role)
        `)
        .eq('event_id', eventId)

      if (error) {
        logError('참여자 가져오기 오류:', error)
        toast.error('참여자를 불러오는데 실패했습니다.')
        return
      }

      // 데이터 형식 변환
      const formattedParticipants = (data || []).map((item: any) => ({
        id: item.id,
        name: item.user_profiles?.full_name || '알 수 없음',
        email: item.user_profiles?.email || '알 수 없음',
        phone: '', // event_participants 테이블에는 phone 필드가 없으므로 빈 문자열
        university: '', // event_participants 테이블에는 university 필드가 없으므로 빈 문자열
        major: '', // event_participants 테이블에는 major 필드가 없으므로 빈 문자열
        company: item.user_profiles?.company || '알 수 없음',
        position: item.user_profiles?.role || '알 수 없음',
        interests: '', // event_participants 테이블에는 interests 필드가 없으므로 빈 문자열
        event_id: item.event_id
      }))

      setParticipants(formattedParticipants)
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
      completed: { label: "완료", color: "bg-gray-50 text-gray-700 border-gray-200" }
    }
    const config = statusConfig[status as keyof typeof statusConfig] || { label: status, color: "bg-gray-50 text-gray-700 border-gray-200" }
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

      const supabase = createClient()
      // 1. 이벤트 참가자 목록 가져오기
      const { data: participants, error: participantsError } = await supabase
        .from('event_participants')
        .select('user_id')
        .eq('event_id', selectedEvent.id)

      if (participantsError) {
        console.error('참가자 목록 조회 오류:', participantsError)
        toast.error('참가자 목록을 가져오는데 실패했습니다.')
        return
      }

      if (!participants || participants.length === 0) {
        toast.error('이벤트에 참가자가 없습니다.')
        return
      }

      // 2. 배치 처리로 효율적으로 알림 전송
      const batchSize = 50; // 한 번에 50개씩 처리
      let successCount = 0;

      for (let i = 0; i < participants.length; i += batchSize) {
        const batch = participants.slice(i, i + batchSize);

        const notifications = batch.map(participant => ({
          title: noticeTitle,
          message: noticeMessage,
          target_type: 'event_participants',
          target_event_id: selectedEvent.id,
          user_id: participant.user_id,
          sent_by: admin.id
        }));

        const { error: batchError } = await supabase
          .from('notifications')
          .insert(notifications);

        if (batchError) {
          console.error(`배치 ${Math.floor(i / batchSize) + 1} 전송 실패:`, batchError);
        } else {
          successCount += batch.length;
        }
      }

      if (successCount === participants.length) {
        toast.success(`${participants.length}명의 참가자에게 공지가 성공적으로 전송되었습니다.`)
      } else {
        toast.warning(`${successCount}명에게 전송되었습니다. (${participants.length - successCount}명 실패)`)
      }

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
      const link = `${window.location.origin}/events/${selectedEvent.id}`
      navigator.clipboard.writeText(link)
      toast.success('링크가 복사되었습니다.')
    }
  }

  const handleShare = () => {
    if (selectedEvent) {
      const link = `${window.location.origin}/events/${selectedEvent.id}`
      if (navigator.share) {
        navigator.share({
          title: selectedEvent.title,
          text: `${selectedEvent.title} 이벤트에 참여해보세요!`,
          url: link
        })
      } else {
        navigator.clipboard.writeText(link)
        toast.success('링크가 복사되었습니다.')
      }
    }
  }

  const handleSaveQR = () => {
    // QR 코드 저장 로직 구현
    toast.success('QR 코드가 저장되었습니다.')
  }

  const handleViewParticipants = async (event: Event) => {
    setSelectedEvent(event)
    await fetchParticipants(event.id)
    setShowParticipantsBottomSheet(true)
  }

  const handleViewQR = (event: Event) => {
    setSelectedEvent(event)
    setShowQRBottomSheet(true)
  }

  // 인증 로딩 중
  if (adminLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">인증 확인 중...</p>
        </div>
      </div>
    )
  }

  // 관리자가 아닌 경우
  if (!admin) {
    router.push('/admin/login')
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-purple-700 rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-sm">NN</span>
              </div>
              <div>
                <span className="text-xl font-bold text-gray-900">Neimd Network</span>
                <div className="text-xs text-gray-500">이벤트 관리</div>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/admin/events/new">
              <Button className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white px-4 py-2 rounded-lg text-sm font-medium shadow-md">
                <Plus className="h-4 w-4 mr-2" />
                새 이벤트 만들기
              </Button>
            </Link>
            <Link href="/admin/my-page">
              <div className="w-8 h-8 bg-gradient-to-br from-purple-600 to-purple-700 rounded-full flex items-center justify-center shadow-md cursor-pointer hover:shadow-lg transition-shadow">
                <span className="text-white text-xs font-medium">
                  {profile?.full_name ? profile.full_name.charAt(0).toUpperCase() : 'A'}
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
          {loading ? (
            <div className="text-center py-16">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
              <p className="mt-4 text-gray-600 font-medium">이벤트를 불러오는 중입니다...</p>
            </div>
          ) : filteredEvents.length === 0 ? (
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
                      <div className="absolute top-3 right-3">
                        <Button variant="ghost" size="sm" className="bg-black bg-opacity-20 hover:bg-opacity-30 text-white">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
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
                        <h3 className="text-lg font-bold text-gray-900 mb-2">{event.title}</h3>
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
                >
                  전송하기
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
                  <div className="w-56 h-56 bg-gradient-to-br from-gray-50 to-gray-100 border-2 border-gray-200 rounded-2xl mx-auto mb-6 flex items-center justify-center shadow-inner">
                    <div className="text-center">
                      <div className="w-40 h-40 bg-white border-2 border-gray-300 rounded-lg mx-auto mb-3 shadow-sm"></div>
                      <p className="text-xs text-gray-500 font-medium">QR Code</p>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 mb-4 leading-relaxed">
                    이 QR 코드를 스캔하거나<br />
                    아래 링크로 접속해 명함을 제출할 수 있어요
                  </p>
                  <div className="bg-gray-50 rounded-xl p-4 mb-6 border border-gray-200">
                    <p className="text-xs text-gray-600 break-all font-mono">
                      {window.location.origin}/events/{selectedEvent.id}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 mb-6">
                  <Button variant="outline" size="sm" onClick={handleCopyLink} className="flex items-center gap-2">
                    <Copy className="h-4 w-4" />
                    <span className="hidden sm:inline">링크 복사</span>
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleShare} className="flex items-center gap-2">
                    <Share className="h-4 w-4" />
                    <span className="hidden sm:inline">공유하기</span>
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
                            <div className="bg-gray-50 rounded-lg p-2">
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
    </div>
  )
}
