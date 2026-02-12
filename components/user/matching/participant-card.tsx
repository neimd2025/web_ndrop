import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Building2, Briefcase, User, MessageCircle } from "lucide-react";
import React, { memo } from "react";

interface ParticipantProfile {
  id: string;
  user_id: string;
  nickname: string | null;
  role: string | null;
  job_title?: string | null;
  work_field: string | null;
  company: string | null;
  interest_keywords: string[] | null;
  profile_image_url: string | null;
  introduction: string | null;
}

interface ParticipantCardProps {
  profile: ParticipantProfile;
  onRequest: (profileId: string, nickname: string) => void;
  requestStatus?: "pending" | "accepted" | "declined" | "confirmed" | "none" | "canceled";
  isDarkTheme?: boolean;
}

export const ParticipantCard = memo(function ParticipantCard({
  profile,
  onRequest,
  requestStatus = "none",
  isDarkTheme = false,
}: ParticipantCardProps) {
  const isRequestSent = requestStatus !== "none" && requestStatus !== "declined" && requestStatus !== "canceled";

  // 직무 표시 로직: job_title -> role (user 제외) -> work_field -> "직무 미입력"
  const validRole = profile.role && profile.role !== "user" ? profile.role : null;
  const displayRole = profile.job_title || validRole || profile.work_field || "직무 미입력";

  // 소속 표시 로직: company -> work_field (직무와 다를 경우) -> null
  const hasValidCompany = profile.company && profile.company !== "미소속" && profile.company !== "null" && profile.company.trim() !== "";
  const displayCompany = hasValidCompany ? profile.company : null;

  // Theme helper classes - backdrop-blur 제거하여 스크롤 성능 개선
  const cardBgClass = isDarkTheme ? "bg-slate-900 border-white/10 text-white" : "border-gray-200 bg-white hover:shadow-md";
  const avatarBorderClass = isDarkTheme ? "border-purple-500/30" : "border-gray-100";
  const nameClass = isDarkTheme ? "text-white" : "text-gray-900";
  const subTextClass = isDarkTheme ? "text-slate-400" : "text-gray-500";
  const iconClass = isDarkTheme ? "text-slate-500" : "text-gray-400";
  const badgeClass = isDarkTheme ? "bg-slate-800 text-slate-300 hover:bg-slate-700" : "bg-gray-100 text-gray-600 hover:bg-gray-200";

  return (
    <Card className={`mb-3 overflow-hidden shadow-sm transition-shadow border ${cardBgClass}`}>
      <CardContent className="p-4">
        <div className="flex gap-4">
          <Avatar className={`h-14 w-14 border ${avatarBorderClass} shrink-0`}>
            <AvatarImage src={profile.profile_image_url || undefined} className="object-cover" />
            <AvatarFallback className={isDarkTheme ? "bg-slate-800 text-slate-400" : "bg-gray-100 text-gray-500"}>
              {profile.nickname?.[0] || <User className="w-6 h-6" />}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1 min-w-0">
            <div className="flex justify-between items-start">
              <div className="min-w-0">
                <h3 className={`font-bold text-base truncate ${nameClass}`}>
                  {profile.nickname || "알 수 없음"}
                </h3>
                <div className={`flex items-center text-sm mt-1 ${subTextClass}`}>
                  <Briefcase className={`w-3 h-3 mr-1 shrink-0 ${iconClass}`} />
                  <span className="truncate mr-2 max-w-[80px]">
                    {displayRole}
                  </span>
                  {displayCompany && (
                    <>
                      <span className="mx-1 opacity-50 shrink-0">|</span>
                      <Building2 className={`w-3 h-3 mr-1 ml-1 shrink-0 ${iconClass}`} />
                      <span className="truncate max-w-[100px]">
                        {displayCompany}
                      </span>
                    </>
                  )}
                </div>
              </div>
              
              <Button 
                size="sm"
                className={`h-8 text-xs px-3 shadow-sm ml-2 shrink-0 ${
                  isRequestSent 
                    ? isDarkTheme ? "bg-slate-800 text-slate-500 border border-slate-700" : "bg-gray-100 text-gray-500 border border-gray-200" 
                    : "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white"
                }`}
                onClick={() => !isRequestSent && onRequest(profile.id, profile.nickname || "")}
                disabled={isRequestSent}
              >
                {isRequestSent ? (
                  <>
                    <MessageCircle className="w-3 h-3 mr-1.5" />
                    요청됨
                  </>
                ) : (
                  <>
                    <MessageCircle className="w-3 h-3 mr-1.5" />
                    미팅 신청
                  </>
                )}
              </Button>
            </div>
            
            {profile.introduction && (
              <p className={`text-xs mt-2 line-clamp-2 ${isDarkTheme ? "text-slate-400" : "text-gray-600"}`}>
                {profile.introduction}
              </p>
            )}

            {profile.interest_keywords && profile.interest_keywords.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-3">
                {profile.interest_keywords.slice(0, 3).map((keyword, i) => (
                  <Badge key={i} variant="secondary" className={`text-[10px] px-1.5 py-0 h-5 ${badgeClass}`}>
                    #{keyword}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
});
