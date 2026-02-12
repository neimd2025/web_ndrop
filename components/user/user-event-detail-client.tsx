"use client"

import { UserProfile, UserEvent } from '@/lib/supabase/user-server-actions'
import { MapPin, Users, Calendar, Clock, Info, Share2 } from 'lucide-react'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"

interface UserEventDetailClientProps {
  user: UserProfile
  event: UserEvent
}

export function UserEventDetailClient({ user, event }: UserEventDetailClientProps) {
  // 날짜 포맷팅 (예외 처리 포함)
  const eventDate = event.start_date ? new Date(event.start_date) : new Date();
  const formattedDate = format(eventDate, "yyyy년 M월 d일 (EEE)", { locale: ko });
  const formattedTime = format(eventDate, "a h:mm", { locale: ko });

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* 1. 이벤트 헤더 카드 */}
      <div className="bg-slate-900/40 border border-white/10 rounded-3xl p-6 backdrop-blur-md shadow-xl relative overflow-hidden group">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-transparent to-blue-500/5 group-hover:from-purple-500/10 transition-colors duration-500" />
        
        <div className="relative">
          <div className="flex justify-between items-start mb-4">
            <Badge variant="outline" className="bg-purple-500/10 text-purple-300 border-purple-500/30 px-3 py-1">
              진행중인 행사
            </Badge>
            <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white hover:bg-white/10 rounded-full h-8 w-8">
              <Share2 className="w-4 h-4" />
            </Button>
          </div>

          <h1 className="text-2xl font-bold text-white mb-2 leading-tight">
            {event.title}
          </h1>
          
          <div className="flex items-center gap-2 text-slate-400 text-sm mb-6">
            <span className="bg-slate-800/50 px-2 py-0.5 rounded text-xs border border-white/5">오프라인</span>
            <span className="w-1 h-1 bg-slate-600 rounded-full" />
            <span>{event.location}</span>
          </div>

          <Separator className="bg-white/10 mb-6" />

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-950/30 p-3 rounded-2xl border border-white/5 flex items-center gap-3">
              <div className="bg-blue-500/20 p-2 rounded-xl">
                <Calendar className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <div className="text-xs text-slate-500 mb-0.5">날짜</div>
                <div className="text-sm font-medium text-slate-200">{formattedDate}</div>
              </div>
            </div>
            
            <div className="bg-slate-950/30 p-3 rounded-2xl border border-white/5 flex items-center gap-3">
              <div className="bg-purple-500/20 p-2 rounded-xl">
                <Clock className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <div className="text-xs text-slate-500 mb-0.5">시간</div>
                <div className="text-sm font-medium text-slate-200">{formattedTime}</div>
              </div>
            </div>

            <div className="bg-slate-950/30 p-3 rounded-2xl border border-white/5 flex items-center gap-3 col-span-2">
              <div className="bg-green-500/20 p-2 rounded-xl">
                <MapPin className="w-5 h-5 text-green-400" />
              </div>
              <div>
                <div className="text-xs text-slate-500 mb-0.5">장소</div>
                <div className="text-sm font-medium text-slate-200">{event.location}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. 상세 정보 */}
      <div className="bg-slate-900/40 border border-white/10 rounded-3xl p-6 backdrop-blur-md shadow-xl">
        <div className="flex items-center gap-2 mb-4">
          <Info className="w-5 h-5 text-slate-400" />
          <h2 className="text-lg font-bold text-white">행사 소개</h2>
        </div>
        
        <div className="text-slate-300 text-sm leading-relaxed whitespace-pre-wrap bg-slate-950/30 p-4 rounded-2xl border border-white/5">
          {event.description || "행사 상세 설명이 없습니다."}
        </div>
      </div>

      {/* 3. 참가자 현황 */}
      <div className="bg-slate-900/40 border border-white/10 rounded-3xl p-6 backdrop-blur-md shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-slate-400" />
            <h2 className="text-lg font-bold text-white">참가자 현황</h2>
          </div>
          <span className="text-purple-400 font-bold bg-purple-500/10 px-3 py-1 rounded-full text-xs border border-purple-500/20">
            {event.current_participants}명 참여 중
          </span>
        </div>

        <div className="relative h-2 bg-slate-800 rounded-full overflow-hidden">
          <div 
            className="absolute top-0 left-0 h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"
            style={{ width: `${Math.min(((event.current_participants || 0) / (event.max_participants || 100)) * 100, 100)}%` }}
          />
        </div>
        <div className="flex justify-between mt-2 text-xs text-slate-500">
          <span>0명</span>
          <span>최대 {event.max_participants}명</span>
        </div>
      </div>
    </div>
  )
}