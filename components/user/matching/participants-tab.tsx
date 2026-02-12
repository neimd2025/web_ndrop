import { createClient } from "@/utils/supabase/client";
import { useEffect, useState } from "react";
import { ParticipantCard } from "./participant-card";
import { MeetingRequestSheet } from "./meeting-request-sheet";
import { Loader2, Search, Users } from "lucide-react";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

interface ParticipantsTabProps {
  eventId: string;
}

export function ParticipantsTab({ eventId }: ParticipantsTabProps) {
  const [participants, setParticipants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProfile, setSelectedProfile] = useState<{ id: string; nickname: string } | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [sentRequests, setSentRequests] = useState<Set<string>>(new Set());

  const fetchParticipants = async (query?: string) => {
    setLoading(true);
    try {
      const url = new URL(`/api/events/${eventId}/participants`, window.location.origin);
      if (query) url.searchParams.set("q", query);
      
      const res = await fetch(url.toString());
      if (!res.ok) throw new Error("Failed to fetch participants");
      const data = await res.json();
      
      setParticipants(data.participants || []);
    } catch (error) {
      console.error("Error fetching participants:", error);
      toast.error("참가자 목록을 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const fetchSentRequests = async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from("event_meetings")
      .select("receiver_id, status")
      .eq("event_id", eventId)
      .eq("requester_id", user.id)
      .in("status", ["pending", "accepted", "confirmed"]);

    if (data) {
      const requestedIds = new Set(data.map(m => m.receiver_id));
      setSentRequests(requestedIds);
    }
  };

  useEffect(() => {
    fetchParticipants();
    fetchSentRequests();
  }, [eventId]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchParticipants(searchQuery);
  };

  const handleRequest = (userId: string, nickname: string) => {
    setSelectedProfile({ id: userId, nickname });
    setIsSheetOpen(true);
  };

  const handleRequestSuccess = () => {
    toast.success("요청 전송 완료");
    fetchSentRequests(); // 요청 상태 갱신
  };

  return (
    <div className="space-y-4">
      <div className="bg-white p-4 rounded-lg border border-gray-100 shadow-sm">
        <form onSubmit={handleSearch} className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input 
            placeholder="이름, 회사, 직무 검색..." 
            className="pl-9 bg-gray-50 border-gray-200"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </form>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-purple-600 mb-2" />
          <p className="text-gray-500 text-sm">참가자 목록을 불러오는 중...</p>
        </div>
      ) : participants.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg border border-dashed border-gray-200">
          <Users className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 mb-1">참가자가 없습니다.</p>
          <p className="text-xs text-gray-400">다른 참가자들이 입장할 때까지 기다려주세요.</p>
        </div>
      ) : (
        <div>
          <div className="text-xs text-gray-500 mb-2 px-1">
            총 {participants.length}명의 참가자
          </div>
          {participants.map((participant) => (
            <ParticipantCard
              key={participant.id}
              profile={participant}
              onRequest={handleRequest}
              requestStatus={sentRequests.has(participant.user_id) ? "pending" : "none"}
            />
          ))}
        </div>
      )}

      <MeetingRequestSheet
        isOpen={isSheetOpen}
        onClose={() => setIsSheetOpen(false)}
        targetProfile={selectedProfile}
        eventId={eventId}
        onSuccess={handleRequestSuccess}
      />
    </div>
  );
}
