import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Building2, Briefcase, Star, MessageCircle } from "lucide-react";

interface RecommendationProfile {
  id: string;
  nickname: string | null;
  role: string | null;
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
}

export function RecommendationCard({
  profile,
  score,
  matchReasons,
  onRequest,
}: RecommendationCardProps) {
  return (
    <Card className="mb-4 overflow-hidden border-purple-100 shadow-sm">
      <CardContent className="p-0">
        <div className="flex p-4 gap-4">
          <Avatar className="h-16 w-16 border-2 border-white shadow-sm">
            <AvatarImage src={profile.profile_image_url || undefined} />
            <AvatarFallback>{profile.nickname?.[0] || "?"}</AvatarFallback>
          </Avatar>
          
          <div className="flex-1 min-w-0">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-bold text-lg truncate">
                  {profile.nickname || "알 수 없음"}
                </h3>
                <div className="flex items-center text-sm text-gray-500 mt-1">
                  <Briefcase className="w-3 h-3 mr-1" />
                  <span className="truncate mr-2">
                    {profile.role || "직무 미입력"}
                  </span>
                  {(profile.company || profile.work_field) && (
                    <>
                      <span className="mx-1 text-gray-300">|</span>
                      <Building2 className="w-3 h-3 mr-1 ml-1" />
                      <span className="truncate">
                        {profile.company || profile.work_field}
                      </span>
                    </>
                  )}
                </div>
              </div>
              <Badge variant="secondary" className="bg-purple-50 text-purple-700 hover:bg-purple-100">
                <Star className="w-3 h-3 mr-1 fill-purple-700" />
                {score}점
              </Badge>
            </div>
            
            {profile.interest_keywords && profile.interest_keywords.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-3">
                {profile.interest_keywords.slice(0, 3).map((keyword, i) => (
                  <Badge key={i} variant="outline" className="text-xs py-0 h-5 bg-gray-50 text-gray-600 border-gray-200">
                    #{keyword}
                  </Badge>
                ))}
                {profile.interest_keywords.length > 3 && (
                  <Badge variant="outline" className="text-xs py-0 h-5 bg-gray-50 text-gray-600 border-gray-200">
                    +{profile.interest_keywords.length - 3}
                  </Badge>
                )}
              </div>
            )}
          </div>
        </div>
        
        <div className="px-4 pb-4 pt-0">
           {/* 매칭 사유 표시 (옵션) */}
           {matchReasons?.common_interests && matchReasons.common_interests.length > 0 && (
             <div className="mb-3 text-xs text-purple-600 bg-purple-50 p-2 rounded-md">
               ✨ <strong>{matchReasons.common_interests.join(", ")}</strong>에 함께 관심이 있어요!
             </div>
           )}

          <Button 
            className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white shadow-md"
            onClick={() => onRequest(profile.id, profile.nickname || "")}
          >
            <MessageCircle className="w-4 h-4 mr-2" />
            미팅 요청하기
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
