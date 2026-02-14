import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Briefcase, Building2, Check, X, MessageSquare } from "lucide-react";
import React, { memo } from "react";
import { MeetingChat } from "./meeting-chat";

interface MeetingProfile {
  id: string;
  nickname: string | null;
  profile_image_url: string | null;
  role: string | null;
  job_title?: string | null;
  company: string | null;
  work_field?: string | null;
}

interface Meeting {
  id: string;
  created_at: string;
  status: "pending" | "accepted" | "confirmed" | "declined" | "canceled";
  message: string | null;
  slot_id: string | null;
  requester_id: string;
  receiver_id: string;
  other_profile: MeetingProfile;
  is_received: boolean;
}

interface MeetingCardProps {
  meeting: Meeting;
  eventId: string;
  currentUserId: string;
  openChatMeetingId: string | null;
  onUpdateStatus: (meetingId: string, status: string) => void;
  onToggleChat: (meetingId: string) => void;
}

export const MeetingCard = memo(function MeetingCard({
  meeting,
  eventId,
  currentUserId,
  openChatMeetingId,
  onUpdateStatus,
  onToggleChat,
}: MeetingCardProps) {
  // Helper to determine display role
  const getDisplayRole = (profile: MeetingProfile) => {
    const validRole = profile.role && profile.role !== "user" ? profile.role : null;
    return profile.job_title || validRole || profile.work_field || "직무 미입력";
  };

  // Helper to determine display company
  const getDisplayCompany = (profile: MeetingProfile) => {
    const hasValidCompany = profile.company && profile.company !== "미소속" && profile.company !== "null" && profile.company.trim() !== "";
    return hasValidCompany ? profile.company : null;
  };

  const displayRole = getDisplayRole(meeting.other_profile);
  const displayCompany = getDisplayCompany(meeting.other_profile);

  const statusBadgeVariant = 
    meeting.status === "confirmed" ? "default" :
    meeting.status === "accepted" ? "secondary" :
    meeting.status === "pending" ? "outline" : "destructive";

  const statusBadgeClass = 
    meeting.status === "confirmed" ? "bg-green-900/50 text-green-400 border-green-800" :
    meeting.status === "accepted" ? "bg-blue-900/50 text-blue-400 border-blue-800 hover:bg-blue-900/70" :
    meeting.status === "pending" ? "bg-yellow-900/30 text-yellow-500 border-yellow-700" : "";

  const statusText = 
    meeting.status === "confirmed" ? "확정됨" :
    meeting.status === "accepted" ? "수락됨" :
    meeting.status === "pending" ? "대기중" : 
    meeting.status === "declined" ? "거절됨" : "취소됨";

  // Backdrop blur removed for better performance
  const cardClass = "overflow-hidden border-white/10 bg-slate-900 shadow-lg transition-all duration-300 hover:border-white/20 mb-4";

  return (
    <Card id={`meeting-${meeting.id}`} className={cardClass}>
      <CardContent className="p-5">
        <div className="flex justify-between items-start mb-3">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10 border border-purple-500/30 shrink-0">
              <AvatarImage src={meeting.other_profile?.profile_image_url || undefined} className="object-cover" />
              <AvatarFallback className="bg-slate-800 text-slate-400">
                {meeting.other_profile?.nickname?.[0]}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <div className="font-bold text-sm text-white truncate">
                {meeting.other_profile?.nickname || "알 수 없음"}
              </div>
              <div className="text-xs text-slate-400 flex items-center mt-0.5">
                <Briefcase className="w-3 h-3 mr-1 text-slate-500 shrink-0" />
                <span className="truncate max-w-[80px] mr-1">
                  {displayRole}
                </span>
                {displayCompany && (
                  <>
                    <span className="mx-1 text-slate-600 shrink-0">|</span>
                    <Building2 className="w-3 h-3 mr-1 ml-1 text-slate-500 shrink-0" />
                    <span className="truncate max-w-[100px]">
                      {displayCompany}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>
          <Badge variant={statusBadgeVariant} className={`shrink-0 ${statusBadgeClass}`}>
            {statusText}
          </Badge>
        </div>

        {/* Message Bubble */}
        {meeting.message && (
          <div className="bg-slate-800/50 rounded-lg p-3 mb-4 text-sm text-slate-300 relative border border-white/5">
            <div className="absolute top-0 left-4 -mt-1 w-2 h-2 bg-slate-800/50 rotate-45 border-t border-l border-white/5"></div>
            "{meeting.message}"
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-2 mt-2">
          {meeting.is_received && meeting.status === "pending" && (
            <>
              <Button 
                size="sm" 
                variant="outline" 
                className="h-8 border-red-900/30 text-red-400 hover:bg-red-900/20 hover:text-red-300"
                onClick={() => onUpdateStatus(meeting.id, "declined")}
              >
                <X className="w-3.5 h-3.5 mr-1" />
                거절
              </Button>
              <Button 
                size="sm" 
                className="h-8 bg-purple-600 hover:bg-purple-700 text-white border-none"
                onClick={() => onUpdateStatus(meeting.id, "accepted")}
              >
                <Check className="w-3.5 h-3.5 mr-1" />
                수락
              </Button>
            </>
          )}

          {!meeting.is_received && meeting.status === "pending" && (
            <Button 
              size="sm" 
              variant="outline" 
              className="h-8 border-slate-700 bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-slate-300"
              onClick={() => onUpdateStatus(meeting.id, "canceled")}
            >
              요청 취소
            </Button>
          )}

          {(meeting.status === "accepted" || meeting.status === "confirmed") && (
            <Button 
              size="sm" 
              variant="outline"
              className={`h-8 border-purple-500/30 ${openChatMeetingId === meeting.id ? 'bg-purple-500/10 text-purple-300' : 'text-purple-400 hover:bg-purple-500/10'}`}
              onClick={() => onToggleChat(meeting.id)}
            >
              <MessageSquare className="w-3.5 h-3.5 mr-1" />
              {openChatMeetingId === meeting.id ? "대화 닫기" : "대화하기"}
            </Button>
          )}
        </div>

        {/* Chat Area */}
        {(meeting.status === "accepted" || meeting.status === "confirmed") && (
          <div className={`mt-4 border-t border-white/10 pt-4 animate-in slide-in-from-top-2 duration-200 ${openChatMeetingId === meeting.id ? 'block' : 'hidden'}`}>
             {/* Only mount chat if open to save resources, or use CSS display:none if we want to keep state */}
             {openChatMeetingId === meeting.id && (
               <MeetingChat 
                 eventId={eventId}
                 meetingId={meeting.id} 
                 currentUserId={currentUserId}
                 isOpen={openChatMeetingId === meeting.id}
               />
             )}
          </div>
        )}
      </CardContent>
    </Card>
  );
});
