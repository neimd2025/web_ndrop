"use client"

import type React from "react"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { createClient } from "@/utils/supabase/client"
import { Bell, X } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"

interface NotificationSendModalProps {
  open: boolean
  onClose: () => void
  onSuccess?: () => void
}

export default function NotificationSendModal({ open, onClose, onSuccess }: NotificationSendModalProps) {
  const [formData, setFormData] = useState({
    title: "",
    message: "",
    target_type: "all" as "all" | "specific" | "event_participants",
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
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
          target_type: formData.target_type,
          // target_event_id: ... (Modal doesn't support selecting event yet, defaulting to null)
        })
      })

      const result = await response.json()

      if (!response.ok) {
        toast.error(result.error || '알림 발송에 실패했습니다.')
        return
      }

      toast.success('알림이 성공적으로 발송되었습니다!')
      setFormData({
        title: "",
        message: "",
        target_type: "all",
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
              <span>푸시 알림 발송</span>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
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

          <div className="space-y-3">
            <Label>발송 대상</Label>
            <div className="space-y-2">
              <label className="flex items-center space-x-2">
                <input
                  type="radio"
                  name="targetType"
                  value="all"
                  checked={formData.target_type === "all"}
                  onChange={(e) => setFormData({ ...formData, target_type: e.target.value as any })}
                  className="text-purple-600"
                />
                <span>전체 회원</span>
              </label>
              <label className="flex items-center space-x-2">
                <input
                  type="radio"
                  name="targetType"
                  value="event_participants"
                  checked={formData.target_type === "event_participants"}
                  onChange={(e) => setFormData({ ...formData, target_type: e.target.value as any })}
                  className="text-purple-600"
                />
                <span>이벤트 참가자</span>
              </label>
              <label className="flex items-center space-x-2">
                <input
                  type="radio"
                  name="targetType"
                  value="specific"
                  checked={formData.target_type === "specific"}
                  onChange={(e) => setFormData({ ...formData, target_type: e.target.value as any })}
                  className="text-purple-600"
                />
                <span>특정 회원</span>
              </label>
            </div>
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
