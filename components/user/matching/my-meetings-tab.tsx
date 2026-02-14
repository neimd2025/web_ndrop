import { MeetingCard } from "./meeting-card";
import { createClient } from "@/utils/supabase/client";
import { Loader2, MessageSquare } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

interface Meeting {
  id: string;
  created_at: string;
  status: "pending" | "accepted" | "confirmed" | "declined" | "canceled";
  message: string | null;
  slot_id: string | null;
  requester_id: string;
  receiver_id: string;
  other_profile: {
    id: string;
    nickname: string | null;
    profile_image_url: string | null;
    role: string | null;
    job_title?: string | null;
    company: string | null;
    work_field?: string | null;
  };
  is_received: boolean; // 내가 받은 요청인지 여부
}

interface MyMeetingsTabProps {
  eventId: string;
  userId: string;
  initialMeetingId?: string;
  initialOpenChat?: boolean;
}

export function MyMeetingsTab({ eventId, userId, initialMeetingId, initialOpenChat }: MyMeetingsTabProps) {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);
  const [openChatMeetingId, setOpenChatMeetingId] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string>(userId);

  const fetchMeetings = async () => {
    setLoading(true);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) setCurrentUserId(user.id);

      const res = await fetch(`/api/events/${eventId}/meetings?t=${Date.now()}`, {
        cache: 'no-store',
        headers: {
          'Pragma': 'no-cache',
          'Cache-Control': 'no-cache'
        }
      });
      if (!res.ok) throw new Error("Failed to fetch meetings");
      const data = await res.json();
      
      // 정렬 로직 추가
      // 1순위: 내가 받은 요청 중 대기중인 것 (액션 필요)
      // 2순위: 수락된 미팅 (대화 가능)
      // 3순위: 내가 보낸 요청 중 대기중인 것
      // 4순위: 나머지 (종료, 거절 등)
      const sortedMeetings = (data.meetings || []).sort((a: Meeting, b: Meeting) => {
        const getPriority = (m: Meeting) => {
          if (m.is_received && m.status === 'pending') return 1;
          if (m.status === 'accepted' || m.status === 'confirmed') return 2;
          if (!m.is_received && m.status === 'pending') return 3;
          return 4;
        };

        const priorityA = getPriority(a);
        const priorityB = getPriority(b);

        if (priorityA !== priorityB) return priorityA - priorityB;
        
        // 같은 우선순위 내에서는 최신순
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });

      setMeetings(sortedMeetings);
    } catch (error) {
      console.error("Error fetching meetings:", error);
      toast.error("미팅 목록을 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMeetings();
    
    // 실시간 미팅 요청 구독
    const supabase = createClient();
    const channel = supabase
      .channel(`event_meetings:${eventId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'event_meetings'
      }, (payload) => {
        // 내 미팅(보낸거/받은거) 변경사항이 생기면 목록 새로고침
        const newRecord = payload.new as any;
        const oldRecord = payload.old as any;
        
        // 현재 이벤트와 관련된 것인지 확인
        const isEventRelated = 
          (newRecord && newRecord.event_id === eventId) || 
          (oldRecord && oldRecord.event_id === eventId);

        if (!isEventRelated) return;
        
        const isRelated = 
          (newRecord && (newRecord.requester_id === currentUserId || newRecord.receiver_id === currentUserId)) ||
          (oldRecord && (oldRecord.requester_id === currentUserId || oldRecord.receiver_id === currentUserId));
          
        if (isRelated) {
          fetchMeetings();
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [eventId, userId, currentUserId]);

  useEffect(() => {
    if (meetings.length > 0 && initialMeetingId) {
      const targetMeeting = meetings.find(m => m.id === initialMeetingId);
      if (targetMeeting) {
        if (initialOpenChat) {
          setOpenChatMeetingId(initialMeetingId);
        }
        // 스크롤 이동
        setTimeout(() => {
          const element = document.getElementById(`meeting-${initialMeetingId}`);
          if (element) {
            element.scrollIntoView({ behavior: "smooth", block: "center" });
            // 강조 효과
            element.classList.add("ring-2", "ring-purple-500");
            setTimeout(() => element.classList.remove("ring-2", "ring-purple-500"), 2000);
          }
        }, 500);
      }
    }
  }, [meetings, initialMeetingId, initialOpenChat]);

  const handleUpdateStatus = async (meetingId: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/events/${eventId}/meetings/${meetingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to update status");
      }

      toast.success(
        newStatus === "accepted" ? "요청을 수락했습니다." : 
        newStatus === "declined" ? "요청을 거절했습니다." : 
        "상태가 변경되었습니다."
      );
      
      // 목록 갱신
      fetchMeetings();
    } catch (error: any) {
      console.error("Update status error:", error);
      toast.error(error.message || "상태 변경에 실패했습니다.");
    }
  };

  const toggleChat = (meetingId: string) => {
    setOpenChatMeetingId(prev => prev === meetingId ? null : meetingId);
  };

  const displayMeetings = meetings;

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-20">
      <Loader2 className="w-8 h-8 animate-spin text-purple-500 mb-4" />
      <p className="text-slate-400">미팅 목록을 불러오는 중...</p>
    </div>
  );

  return (
    <div className="space-y-4 pb-20 relative min-h-[500px]">
      {displayMeetings.length === 0 ? (
        <div className="text-center py-16 bg-slate-900/30 rounded-2xl border border-white/5 backdrop-blur-sm">
          <div className="w-16 h-16 bg-slate-800/50 rounded-full flex items-center justify-center mx-auto mb-4">
            <MessageSquare className="w-8 h-8 text-slate-500" />
          </div>
          <p className="text-slate-300 font-medium mb-1">아직 미팅 내역이 없습니다</p>
          <p className="text-slate-500 text-sm">참가자들에게 미팅을 요청해보세요!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {displayMeetings.map((meeting) => (
            <MeetingCard
              key={meeting.id}
              meeting={meeting}
              eventId={eventId}
              currentUserId={currentUserId}
              openChatMeetingId={openChatMeetingId}
              onUpdateStatus={handleUpdateStatus}
              onToggleChat={toggleChat}
            />
          ))}
        </div>
      )}
    </div>
  );
}
