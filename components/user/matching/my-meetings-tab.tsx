import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { createClient } from "@/utils/supabase/client";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { Check, X, Clock, CalendarCheck } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

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
    company: string | null;
  };
  is_received: boolean; // 내가 받은 요청인지 여부
}

interface MyMeetingsTabProps {
  eventId: string;
  userId: string;
}

export function MyMeetingsTab({ eventId, userId }: MyMeetingsTabProps) {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeSegment, setActiveSegment] = useState<"received" | "sent">("received");

  const fetchMeetings = async () => {
    setLoading(true);
    const supabase = createClient();
    
    // 내가 참여한 모든 미팅 조회
    const { data, error } = await supabase
      .from("event_meetings")
      .select(`
        *,
        requester:user_profiles!event_meetings_requester_id_fkey(id, nickname, profile_image_url, role, company),
        receiver:user_profiles!event_meetings_receiver_id_fkey(id, nickname, profile_image_url, role, company)
      `)
      .eq("event_id", eventId)
      .or(`requester_id.eq.${userId},receiver_id.eq.${userId}`)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching meetings:", error);
      toast.error("미팅 목록을 불러오지 못했습니다.");
      setLoading(false);
      return;
    }

    const formattedMeetings = data.map((m: any) => {
      const isReceived = m.receiver_id === userId;
      const otherProfile = isReceived ? m.requester : m.receiver;
      return {
        ...m,
        other_profile: otherProfile,
        is_received: isReceived,
      };
    });

    setMeetings(formattedMeetings);
    setLoading(false);
  };

  useEffect(() => {
    fetchMeetings();
  }, [eventId, userId]);

  const handleUpdateStatus = async (meetingId: string, newStatus: string) => {
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("event_meetings")
        .update({ status: newStatus })
        .eq("id", meetingId);

      if (error) throw error;

      toast.success(
        newStatus === "accepted" ? "요청을 수락했습니다." : 
        newStatus === "declined" ? "요청을 거절했습니다." : 
        "상태가 변경되었습니다."
      );
      
      // 목록 갱신
      fetchMeetings();
    } catch (error) {
      console.error("Update status error:", error);
      toast.error("상태 변경에 실패했습니다.");
    }
  };

  const filteredMeetings = meetings.filter(
    (m) => activeSegment === "received" ? m.is_received : !m.is_received
  );

  if (loading) return <div className="p-8 text-center text-gray-500">로딩 중...</div>;

  return (
    <div className="space-y-4">
      <div className="flex bg-gray-100 p-1 rounded-lg">
        <button
          className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${
            activeSegment === "received" ? "bg-white shadow-sm text-purple-700" : "text-gray-500"
          }`}
          onClick={() => setActiveSegment("received")}
        >
          받은 요청
        </button>
        <button
          className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${
            activeSegment === "sent" ? "bg-white shadow-sm text-purple-700" : "text-gray-500"
          }`}
          onClick={() => setActiveSegment("sent")}
        >
          보낸 요청
        </button>
      </div>

      {filteredMeetings.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-gray-500">
            {activeSegment === "received" ? "받은 미팅 요청이 없습니다." : "보낸 미팅 요청이 없습니다."}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredMeetings.map((meeting) => (
            <Card key={meeting.id} className="overflow-hidden border-gray-200">
              <CardContent className="p-4">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={meeting.other_profile?.profile_image_url || undefined} />
                      <AvatarFallback>{meeting.other_profile?.nickname?.[0]}</AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-bold text-sm">
                        {meeting.other_profile?.nickname || "알 수 없음"}
                      </div>
                      <div className="text-xs text-gray-500">
                        {meeting.other_profile?.company || meeting.other_profile?.role || "정보 없음"}
                      </div>
                    </div>
                  </div>
                  <Badge 
                    variant={
                      meeting.status === "confirmed" ? "default" :
                      meeting.status === "accepted" ? "secondary" :
                      meeting.status === "pending" ? "outline" : "destructive"
                    }
                    className={
                        meeting.status === "confirmed" ? "bg-green-600" :
                        meeting.status === "accepted" ? "bg-blue-100 text-blue-700 hover:bg-blue-200" :
                        meeting.status === "pending" ? "text-yellow-600 border-yellow-300 bg-yellow-50" : ""
                    }
                  >
                    {meeting.status === "confirmed" ? "확정됨" :
                     meeting.status === "accepted" ? "수락됨" :
                     meeting.status === "pending" ? "대기중" :
                     meeting.status === "declined" ? "거절됨" : "취소됨"}
                  </Badge>
                </div>

                {meeting.message && (
                  <div className="bg-gray-50 p-3 rounded-md text-sm text-gray-700 mb-3">
                    "{meeting.message}"
                  </div>
                )}
                
                <div className="flex justify-between items-center text-xs text-gray-400 mb-3">
                  <span>{format(new Date(meeting.created_at), "M월 d일 a h:mm", { locale: ko })}</span>
                </div>

                {/* 액션 버튼 */}
                <div className="flex gap-2 mt-2">
                  {meeting.is_received && meeting.status === "pending" && (
                    <>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="flex-1 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                        onClick={() => handleUpdateStatus(meeting.id, "declined")}
                      >
                        <X className="w-4 h-4 mr-1" />
                        거절
                      </Button>
                      <Button 
                        size="sm" 
                        className="flex-1 bg-purple-600 hover:bg-purple-700 text-white"
                        onClick={() => handleUpdateStatus(meeting.id, "accepted")}
                      >
                        <Check className="w-4 h-4 mr-1" />
                        수락
                      </Button>
                    </>
                  )}

                  {!meeting.is_received && meeting.status === "pending" && (
                     <Button 
                        size="sm" 
                        variant="outline" 
                        className="w-full border-gray-300 text-gray-500"
                        onClick={() => handleUpdateStatus(meeting.id, "canceled")}
                      >
                        요청 취소
                      </Button>
                  )}

                  {meeting.status === "accepted" && (
                    <Button 
                      size="sm" 
                      className="w-full bg-green-600 hover:bg-green-700 text-white"
                      onClick={() => toast.info("시간 확정 기능은 준비 중입니다.")}
                    >
                      <Clock className="w-4 h-4 mr-1" />
                      시간 확정하기
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
