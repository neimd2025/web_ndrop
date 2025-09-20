"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AdminEvent } from '@/lib/supabase/admin-server-actions'
import { ArrowLeft, Download, Mail, QrCode, Search, Users } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState } from "react"

interface AdminEventParticipantsClientProps {
  event: AdminEvent
}

export function AdminEventParticipantsClient({ event }: AdminEventParticipantsClientProps) {
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState("")

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
              <h1 className="text-xl font-bold text-gray-900">참가자 관리</h1>
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
          {/* 통계 카드들 */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center">
                  <Users className="h-8 w-8 text-blue-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">총 참가자</p>
                    <p className="text-2xl font-bold text-gray-900">{event.current_participants || 0}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 참가자 목록 */}
          <Card>
            <CardHeader>
              <CardTitle>참가자 목록</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">참가자 데이터를 불러오는 기능 구현 예정</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}