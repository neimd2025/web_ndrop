import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Building2, Briefcase, Star, MessageCircle } from "lucide-react";

interface RecommendationProfile {
  id: string;
  nickname: string | null;
  role: string | null;
  job_title?: string | null;
  work_field: string | null;
  company: string | null;
  interest_keywords: string[] | null;
  profile_image_url: string | null;
}

interface RecommendationCardProps {
  profile: RecommendationProfile;
  score: number;
  matchReasons: any;
  onRequest: (profileId: string, nickname: string) => void;
  requestStatus?: "pending" | "accepted" | "declined" | "confirmed" | "none";
  isDarkTheme?: boolean;
}

export function RecommendationCard({
  profile,
  score,
  matchReasons,
  onRequest,
  requestStatus = "none",
  isDarkTheme = false,
}: RecommendationCardProps) {
  const isRequestSent = requestStatus !== "none" && requestStatus !== "declined";

  // 직무 표시 로직: job_title -> role (user 제외) -> work_field -> "직무 미입력"
  const validRole = profile.role && profile.role !== "user" ? profile.role : null;
  const displayRole = profile.job_title || validRole || profile.work_field || "직무 미입력";

  // 소속 표시 로직: company -> work_field (직무와 다를 경우) -> null
  const hasValidCompany = profile.company && profile.company !== "미소속" && profile.company !== "null" && profile.company.trim() !== "";
  const displayCompany = hasValidCompany ? profile.company : null;

  // Theme helper classes
  const cardBgClass = isDarkTheme ? "bg-slate-900/50 border-white/10 text-white backdrop-blur-sm" : "border-purple-100 bg-white";
  const avatarBorderClass = isDarkTheme ? "border-purple-500/30" : "border-white";
  const nameClass = isDarkTheme ? "text-white" : "text-gray-900";
  const subTextClass = isDarkTheme ? "text-slate-400" : "text-gray-500";
  const iconClass = isDarkTheme ? "text-slate-500" : "text-gray-400";
  const badgeClass = isDarkTheme ? "bg-slate-800 text-slate-300 border-slate-700" : "bg-gray-50 text-gray-600 border-gray-200";
  const summaryBgClass = isDarkTheme ? "bg-purple-900/30 text-purple-300" : "bg-purple-50 text-purple-600";

  return (
    <Card className={`mb-4 overflow-hidden shadow-sm h-full flex flex-col border ${cardBgClass}`}>
      <CardContent className="p-0 flex-1 flex flex-col">
        <div className="flex p-4 gap-4 flex-1">
          <Avatar className={`h-14 w-14 border-2 shadow-sm shrink-0 ${avatarBorderClass}`}>
            <AvatarImage src={profile.profile_image_url || undefined} />
            <AvatarFallback className={isDarkTheme ? "bg-slate-800 text-slate-400" : ""}>{profile.nickname?.[0] || "?"}</AvatarFallback>
          </Avatar>
          
          <div className="flex-1 min-w-0">
            <div className="flex justify-between items-start">
                      <div>
                        <h3 className={`font-bold text-base truncate ${nameClass}`}>
                          {profile.nickname || "알 수 없음"}
                        </h3>
                        <div className={`flex items-center text-xs mt-1 ${subTextClass}`}>
                          <Briefcase className={`w-3 h-3 mr-1 ${iconClass}`} />
                          <span className="truncate mr-2 max-w-[60px]">
                            {displayRole}
                          </span>
                          {displayCompany && (
                            <>
                              <span className="mx-1 opacity-50">|</span>
                              <Building2 className={`w-3 h-3 mr-1 ml-1 ${iconClass}`} />
                              <span className="truncate max-w-[80px]">
                                {displayCompany}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
            
            {profile.interest_keywords && profile.interest_keywords.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {profile.interest_keywords.slice(0, 2).map((keyword, i) => (
                  <Badge key={i} variant="outline" className={`text-[10px] px-1.5 py-0 h-5 ${badgeClass}`}>
                    #{keyword}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </div>
        
        <div className="px-4 pb-4 pt-0 mt-auto">
                  {matchReasons?.summary ? (
            <div className={`mb-3 text-xs p-2.5 rounded-md leading-relaxed ${summaryBgClass}`}>
              ✨ {matchReasons.summary}
            </div>
          ) : matchReasons?.common_interests && matchReasons.common_interests.length > 0 ? (
                    <div className={`mb-3 text-xs p-2 rounded-md line-clamp-1 ${summaryBgClass}`}>
                      ✨ <strong>{matchReasons.common_interests.join(", ")}</strong> 관심사 일치
                    </div>
                  ) : null}
                  <Button 
            size="sm"
            className={`w-full shadow-sm text-xs h-9 ${
              isRequestSent 
                ? isDarkTheme ? "bg-slate-800 text-slate-500 border border-slate-700" : "bg-gray-100 text-gray-500 border border-gray-200 hover:bg-gray-100" 
                : "bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white"
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
                미팅 요청하기
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
