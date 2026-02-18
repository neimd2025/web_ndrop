"use client"

import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useEffect, useState } from 'react'
import Link from "next/link"
import { calculateEventStatus } from "@/lib/supabase/database"
import { Calendar, Users, Settings, MessageSquare, BarChart3, Edit3, Plus, X } from "lucide-react"
import NotificationSendModal from "@/components/admin/notification-send-modal"

interface AdminUser {
  id: string
  email: string
  role_id: number
}

export function SimpleAdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const router = useRouter()
  const [admin, setAdmin] = useState<AdminUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [events, setEvents] = useState<Array<{ id: string; title: string; start_date?: string; end_date?: string; status?: string }>>([])
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null)
  const [showNoticeModal, setShowNoticeModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showNewModal, setShowNewModal] = useState(false)


  // 인증 페이지 체크 (hooks 호출 후)
  const isAuthPage = pathname === '/admin/login' || pathname === '/admin/signup'
  const isEmbed = searchParams.get('embed') === '1'

  useEffect(() => {
    // 인증 페이지에서는 인증 체크 스킵
    if (isAuthPage) {
      setLoading(false)
      return
    }

    let mounted = true
    let timeoutId: NodeJS.Timeout

    const checkAuth = () => {
      try {
        // 쿠키에서 먼저 확인
        const getCookie = (name: string) => {
          const value = `; ${document.cookie}`;
          const parts = value.split(`; ${name}=`);
          if (parts.length === 2) return parts.pop()?.split(';').shift();
          return null;
        };

        const adminToken = getCookie('admin_token')
        const adminUser = getCookie('admin_user')

        if (!mounted) return

        if (!adminToken || !adminUser) {
          timeoutId = setTimeout(() => {
            if (mounted) router.push('/admin/login')
          }, 100)
          return
        }

        const userData = JSON.parse(decodeURIComponent(adminUser))
        if (userData.role_id !== 2) {
          timeoutId = setTimeout(() => {
            if (mounted) router.push('/admin/login?error=unauthorized')
          }, 100)
          return
        }

        if (mounted) {
          setAdmin(userData)
        }
      } catch (error) {
        console.error('Cookie Auth check failed:', error)
        if (mounted) {
          timeoutId = setTimeout(() => {
            if (mounted) router.push('/admin/login?error=auth_failed')
          }, 100)
        }
      } finally {
        if (mounted) {
          setLoading(false)
        }
      }
    }

    checkAuth()

    return () => {
      mounted = false
      if (timeoutId) {
        clearTimeout(timeoutId)
      }
    }
  }, [pathname, isAuthPage])

  // 이벤트 목록/선택 관리
  useEffect(() => {
    if (!admin) return
    let active = true
    ;(async () => {
      try {
        const token =
          typeof window !== "undefined" ? window.localStorage.getItem("admin_token") : null
        if (!token) {
          if (active) setEvents([])
          return
        }

        const response = await fetch("/api/admin/get-events", {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        if (!response.ok) {
          if (active) setEvents([])
          return
        }

        const result = await response.json()
        const data = Array.isArray(result.events) ? result.events : []
        if (!active) return
        setEvents(data || [])
      } catch {
        setEvents([])
      }
    })()
    const match = pathname?.match(/\/admin\/events\/([^/]+)/)
    if (match?.[1]) {
      setSelectedEventId(match[1])
      if (typeof window !== "undefined") {
        localStorage.setItem("admin:selectedEventId", match[1])
      }
    } else {
      if (typeof window !== "undefined") {
        const stored = localStorage.getItem("admin:selectedEventId")
        if (stored) setSelectedEventId(stored)
      }
    }
    return () => {
      active = false
    }
  }, [admin, pathname])

  useEffect(() => {
    if (isAuthPage) return
    if (!admin) return
    if (pathname !== '/admin' && pathname !== '/admin/') return
    if (!events || events.length === 0) return

    let targetId = selectedEventId

    if (!targetId) {
      if (typeof window !== 'undefined') {
        const stored = localStorage.getItem('admin:selectedEventId')
        if (stored && events.some(e => e.id === stored)) {
          targetId = stored
        }
      }
      if (!targetId) {
        targetId = events[0].id
      }
      setSelectedEventId(targetId)
      if (typeof window !== 'undefined') {
        localStorage.setItem('admin:selectedEventId', targetId)
      }
    }

    if (targetId) {
      router.replace(`/admin/events/${targetId}`)
    }
  }, [admin, events, selectedEventId, pathname, router, isAuthPage])

  const onSelectEvent = (id: string) => {
    setSelectedEventId(id)
    if (typeof window !== "undefined") {
      localStorage.setItem("admin:selectedEventId", id)
    }
    router.push(`/admin/events/${id}`)
  }

  // 인증 페이지는 바로 렌더링
  if (isAuthPage) {
    return <>{children}</>
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">로그인 확인 중...</p>
        </div>
      </div>
    )
  }

  if (!admin) {
    return null // 리다이렉트 중
  }

  const gotoSection = (section: string) => {
    if (!selectedEventId) return
    if (section === "home") {
      router.push(`/admin/events/${selectedEventId}`)
    } else if (section === "participants") {
      router.push(`/admin/events/${selectedEventId}/participants`)
    } else if (section === "report") {
      router.push(`/admin/events/${selectedEventId}/report`)
    }
  }

  const currentEvent = events.find(e => e.id === selectedEventId) || null

  const getEventStatusLabel = () => {
    if (!currentEvent) return null
    const status = calculateEventStatus(currentEvent)
    if (status === "ongoing") return "LIVE"
    if (status === "upcoming") return "예정"
    if (status === "completed") return "종료"
    return null
  }

  if (isEmbed) {
    return <>{children}</>
  }

  // 관리자 인증 완료 - 레이아웃 렌더링
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex h-screen">
        <aside className="hidden md:flex w-64 flex-col bg-white border-r border-gray-200">
          <div className="h-16 flex items-center px-4 border-b border-gray-200">
            <div>
              <div className="text-xs font-semibold text-purple-600 tracking-wide">ndrop</div>
              <div className="text-sm font-semibold text-gray-900">Event Console</div>
            </div>
          </div>
          <nav className="flex-1 p-3 space-y-1">
            <button
              className={`w-full text-left flex items-center px-3 py-2 rounded-md hover:bg-gray-100 ${
                pathname?.match(/\/admin\/events\/[^/]+(\/?$)/) ? "bg-gray-100 text-gray-900" : "text-gray-700"
              }`}
              disabled={!selectedEventId}
              onClick={() => gotoSection("home")}
            >
              <Calendar className="w-4 h-4 mr-2" />
              운영 대시보드
            </button>
            <button
              className={`w-full text-left flex items-center px-3 py-2 rounded-md hover:bg-gray-100 ${
                pathname?.includes("/participants") ? "bg-gray-100 text-gray-900" : "text-gray-700"
              }`}
              disabled={!selectedEventId}
              onClick={() => gotoSection("participants")}
            >
              <Users className="w-4 h-4 mr-2" />
              참가자 현황
            </button>
            <button
              className={`w-full text-left flex items-center px-3 py-2 rounded-md hover:bg-gray-100 ${
                pathname?.includes("/report") ? "bg-gray-100 text-gray-900" : "text-gray-700"
              }`}
              disabled={!selectedEventId}
              onClick={() => gotoSection("report")}
            >
              <BarChart3 className="w-4 h-4 mr-2" />
              리포트 분석
            </button>
          </nav>
          <div className="border-t border-gray-200 p-3">
            <Link href="/admin/my-page" className="block text-sm text-gray-600 hover:text-gray-900">계정 설정</Link>
          </div>
        </aside>

        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-20 bg-white border-b border-gray-200 px-6 flex items-center justify-between">
            <div className="flex flex-col">
              <div className="text-xs font-semibold text-purple-600 tracking-wide">ndrop Event Console</div>
              <div className="flex items-center gap-3 mt-1">
                <span className="text-base font-semibold text-gray-900">
                  {currentEvent ? currentEvent.title : "행사를 선택하세요"}
                </span>
                {currentEvent && (
                  (() => {
                    const status = calculateEventStatus(currentEvent)
                    return (
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full border ${
                      status === "ongoing"
                        ? "bg-green-50 text-green-700 border-green-200"
                        : status === "upcoming"
                        ? "bg-blue-50 text-blue-700 border-blue-200"
                        : "bg-gray-50 text-gray-600 border-gray-200"
                    }`}
                  >
                    {getEventStatusLabel()}
                  </span>
                    )
                  })()
                )}
              </div>
            </div>
            <div className="flex items-center gap-2 w-[28rem] max-w-full justify-center">
              <select
                className="border border-gray-300 rounded-md px-3 py-1.5 text-sm text-gray-800 bg-white w-full max-w-md"
                value={selectedEventId ?? ""}
                onChange={(e) => onSelectEvent(e.target.value)}
              >
                <option value="" disabled>행사를 선택하세요</option>
                {events.map(evt => (
                  <option key={evt.id} value={evt.id}>{evt.title}</option>
                ))}
              </select>
              <button
                type="button"
                disabled={!selectedEventId}
                onClick={() => selectedEventId && setShowEditModal(true)}
                className="w-9 h-9 flex items-center justify-center rounded-full border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Edit3 className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setShowNewModal(true)}
                className="w-9 h-9 flex items-center justify-center rounded-full border border-purple-200 bg-purple-50 text-purple-600 hover:bg-purple-100"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
            <div className="flex items-center gap-3">
              <button
                disabled={!selectedEventId}
                onClick={() => selectedEventId && setShowNoticeModal(true)}
                className="text-sm px-3 py-1.5 rounded-md border border-gray-300 text-gray-800 bg-white disabled:opacity-50"
              >
                공지 전송
              </button>
              <button
                disabled={!selectedEventId}
                onClick={() => selectedEventId && router.push(`/admin/events/${selectedEventId}/report`)}
                className="text-sm px-3 py-1.5 rounded-md bg-purple-600 text-white hover:bg-purple-700 disabled:opacity-50"
              >
                리포트 분석
              </button>
            </div>
          </header>

          <main className="flex-1 overflow-auto p-6">
            {children}
          </main>
        </div>
        {selectedEventId && (
          <NotificationSendModal
            open={showNoticeModal}
            onClose={() => setShowNoticeModal(false)}
            eventId={selectedEventId}
            eventTitle={currentEvent?.title}
          />
        )}
        {showEditModal && selectedEventId && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl h-[80vh] flex flex-col overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b">
                <div className="text-sm font-semibold text-gray-900">행사 정보 수정</div>
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="p-1 rounded-full hover:bg-gray-100 text-gray-500"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <iframe
                src={`/admin/events/edit/${selectedEventId}?embed=1`}
                className="flex-1 w-full border-0"
              />
            </div>
          </div>
        )}
        {showNewModal && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl h-[80vh] flex flex-col overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b">
                <div className="text-sm font-semibold text-gray-900">새 이벤트 생성</div>
                <button
                  type="button"
                  onClick={() => setShowNewModal(false)}
                  className="p-1 rounded-full hover:bg-gray-100 text-gray-500"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <iframe
                src="/admin/events/new?embed=1"
                className="flex-1 w-full border-0"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
