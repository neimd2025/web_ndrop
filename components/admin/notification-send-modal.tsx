"use client"

import type React from "react"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Bell, Users, X } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"

interface NotificationSendModalProps {
  open: boolean
  onClose: () => void
  onSuccess?: () => void
  eventId: string | null
  eventTitle?: string
}

export default function NotificationSendModal({
  open,
  onClose,
  onSuccess,
  eventId,
  eventTitle,
}: NotificationSendModalProps) {
  const [formData, setFormData] = useState({
    title: "",
    message: "",
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      if (!eventId) {
        toast.error("행사를 먼저 선택해주세요.")
        return
      }

      const adminToken = localStorage.getItem('admin_token')
      if (!adminToken) {
        toast.error('인증 토큰이 없습니다. 다시 로그인해주세요.')
        return
      }

      const response = await fetch('/api/admin/send-notification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`
        },
        body: JSON.stringify({
          title: formData.title,
          message: formData.message,
          target_type: "event_participants",
          target_event_id: eventId,
        })
      })

      const result = await response.json()

      if (!response.ok) {
        toast.error(result.error || '알림 발송에 실패했습니다.')
        return
      }

      toast.success('이 행사 참가자에게 공지가 전송되었습니다.')
      setFormData({
        title: "",
        message: "",
      })
      onSuccess?.()
      onClose()
    } catch (error) {
      console.error('알림 발송 오류:', error)
      toast.error('알림 발송 중 오류가 발생했습니다.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md mx-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Bell className="h-5 w-5" />
              <span>행사 참가자 공지 전송</span>
            </div>
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex items-center gap-2 text-xs text-gray-600 bg-gray-50 border border-gray-200 rounded-md px-3 py-2">
            <Users className="w-4 h-4 text-purple-600" />
            <div className="flex flex-col">
              <span className="font-medium text-gray-800">
                {eventTitle || "선택된 행사 참가자 전체"}
              </span>
              <span className="text-[11px] text-gray-500">
                이 행사에 참가한 모든 사용자에게 공지가 발송됩니다.
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="title">알림 제목</Label>
            <Input
              id="title"
              placeholder="예: 새로운 이벤트 안내"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="border-2 border-gray-200 focus:border-purple-500"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="message">메시지</Label>
            <Textarea
              id="message"
              placeholder="회원들에게 전달할 메시지를 입력하세요"
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              className="border-2 border-gray-200 focus:border-purple-500 min-h-[120px]"
              required
            />
          </div>

          <div className="flex space-x-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1 bg-transparent">
              취소
            </Button>
            <Button type="submit" className="flex-1 bg-purple-600 hover:bg-purple-700">
              발송하기
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
