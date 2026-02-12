// @ts-nocheck
// app/components/notification-modal.tsx
"use client"

import { UserNotification } from '@/lib/supabase/user-server-actions'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Megaphone, Calendar } from "lucide-react"
import { useEffect, useState } from "react"
import { createClient } from "@/utils/supabase/client"

interface NotificationModalProps {
  notification: UserNotification | null
  isOpen: boolean
  onClose: () => void
}

export function NotificationModal({ notification, isOpen, onClose }: NotificationModalProps) {
  const [eventTitle, setEventTitle] = useState<string>('')
  const [loadingEvent, setLoadingEvent] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    if (notification?.target_event_id) {
      fetchEventTitle(notification.target_event_id)
    } else {
      setEventTitle('')
    }
  }, [notification])

  const fetchEventTitle = async (eventId: string) => {
    try {
      setLoadingEvent(true)
      const { data, error } = await supabase
        .from('events')
        .select('title')
        .eq('id', eventId)
        .single()

      if (!error && data) {
        setEventTitle(data.title)
      } else {
        setEventTitle('')
      }
    } catch (error) {
      console.error('이벤트 제목 조회 오류:', error)
      setEventTitle('')
    } finally {
      setLoadingEvent(false)
    }
  }

  if (!notification) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg bg-slate-900 border border-white/10 text-white">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-500/20 rounded-full flex items-center justify-center">
              <Megaphone className="h-5 w-5 text-orange-400" />
            </div>
            <DialogTitle className="text-xl text-white">알림</DialogTitle>
          </div>
        </DialogHeader>

        <div className="space-y-5">
          {/* 공지사항 내용 섹션 */}
          <div className="space-y-3">
            <div>
              <div className="text-sm text-slate-400 mb-1">행사명</div>
              <div className="text-md font-bold text-white">{eventTitle}</div>
            </div>

            <div>
              <div className="text-sm text-slate-400 mb-1">제목</div>
              <div className="text-xl font-bold text-white">{notification.title}</div>
            </div>

            <div>
              <div className="text-sm text-slate-400 mb-2">내용</div>
              <div className="bg-slate-800/50 p-4 rounded-lg border border-white/10 min-h-[120px]">
                <p className="text-slate-200 whitespace-pre-line leading-relaxed">
                  {notification.message}
                </p>
              </div>
            </div>
          </div>

          {/* 발송 정보 */}
          <div className="pt-4 border-t border-white/10">
            <div className="text-xs text-slate-500 space-y-1">
              {notification.created_at && (
                <div className="flex items-center gap-1">
                  <span className="font-medium">발송일시:</span>
                  <span>{new Date(notification.created_at).toLocaleString('ko-KR')}</span>
                </div>
              )}
              
              {/* 메타데이터에서 발송자 정보가 있으면 표시 */}
              {notification.metadata?.sender_name && (
                <div className="flex items-center gap-1">
                  <span className="font-medium">발송자:</span>
                  <span>{notification.metadata.sender_name}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
