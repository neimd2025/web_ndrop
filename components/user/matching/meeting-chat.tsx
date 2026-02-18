
import { useEffect, useState, useRef, useCallback } from "react";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { Send, Loader2, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import { createClient } from "@/utils/supabase/client";

interface Message {
  id: string;
  content: string;
  sender_id: string;
  created_at: string;
  sender?: {
    user_profiles?: {
      name: string;
      avatar_url: string | null;
    } | null;
  };
}

interface MeetingChatProps {
  eventId: string;
  meetingId: string;
  currentUserId: string;
  isOpen: boolean;
}

export function MeetingChat({ eventId, meetingId, currentUserId, isOpen }: MeetingChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [lastReadAtByOther, setLastReadAtByOther] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();

  const earliest = useCallback(() => {
    if (messages.length === 0) return null;
    return messages[0]?.created_at || null;
  }, [messages]);

  // 메시지 로드
  const fetchMessages = async (opts?: { before?: string | null; append?: boolean }) => {
    try {
      const params = new URLSearchParams();
      params.set("limit", opts?.before ? "50" : "50");
      if (opts?.before) params.set("before", opts.before);
      const res = await fetch(`/api/events/${eventId}/meetings/${meetingId}/messages?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to load messages");
      const data = await res.json();
      const loaded: Message[] = data.messages || [];
      if (opts?.append) {
        setMessages((prev) => [...loaded, ...prev]);
      } else {
        setMessages(loaded);
      }
      if (loaded.length < 50) {
        setHasMore(false);
      }
    } catch (error) {
      console.error("Error loading messages:", error);
      // 조용히 실패 (테이블 없을 수 있음)
    } finally {
      setIsLoading(false);
    }
  };

  const markReadForMeeting = useCallback(async () => {
    try {
      await supabase
        .from("notifications")
        .update({ read_at: new Date().toISOString() })
        .eq("user_id", currentUserId)
        .eq("notification_type", "meeting_chat")
        .is("read_at", null)
        .contains("metadata", { meeting_id: meetingId });
    } catch {}
  }, [currentUserId, meetingId, supabase]);

  const fetchReadReceipt = useCallback(async () => {
    try {
      const res = await fetch(`/api/meetings/${meetingId}/read-receipt`)
      if (!res.ok) return
      const data = await res.json()
      setLastReadAtByOther(data.lastReadAt || null)
    } catch {}
  }, [meetingId])

  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 24;
    if (nearBottom) {
      markReadForMeeting();
    }
  }, [markReadForMeeting]);

  const loadMore = async () => {
    if (!hasMore || loadingMore) return;
    setLoadingMore(true);
    try {
      await fetchMessages({ before: earliest(), append: true });
    } finally {
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchMessages();
      markReadForMeeting();
      fetchReadReceipt();
      
      // 실시간 구독 설정
      const channel = (supabase as any)
        .channel(`meeting_chat:${meetingId}`)
        .on("postgres_changes", { schema: "public", table: "event_meeting_messages", filter: `meeting_id=eq.${meetingId}` }, () => {
          fetchMessages();
        })
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [isOpen, meetingId, markReadForMeeting, fetchReadReceipt]);

  useEffect(() => {
    if (!isOpen) return;
    const onFocus = () => markReadForMeeting();
    const onVisibility = () => {
      if (document.visibilityState === "visible") markReadForMeeting();
    };
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [isOpen, markReadForMeeting]);

  useEffect(() => {
    if (!isOpen) return
    const id = setInterval(() => {
      fetchReadReceipt()
    }, 10000)
    return () => clearInterval(id)
  }, [isOpen, fetchReadReceipt])

  // 스크롤 하단 이동
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isOpen]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || isSending) return;

    setIsSending(true);
    try {
      const res = await fetch(`/api/events/${eventId}/meetings/${meetingId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: newMessage }),
      });

      if (!res.ok) throw new Error("Failed to send message");

      const data = await res.json();
      setMessages((prev) => [...prev, data.message]);
      setNewMessage("");
    } catch (error: any) {
      toast.error("메시지 전송에 실패했습니다.");
      console.error(error);
    } finally {
      setIsSending(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="mt-4 border-t border-white/5 pt-4 animate-in slide-in-from-top-2 duration-200">
      <div className="flex items-center gap-2 mb-3 text-sm text-slate-400 font-medium">
        <MessageSquare className="w-4 h-4 text-purple-400" />
        대화 내역
      </div>
      
      <div 
        ref={scrollRef}
        onScroll={handleScroll}
        className="h-[250px] overflow-y-auto mb-3 space-y-4 pr-2 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent bg-slate-950/30 rounded-xl p-4 border border-white/5 shadow-inner"
      >
        {hasMore && (
          <div className="flex justify-center mb-3">
            <button
              type="button"
              onClick={loadMore}
              disabled={loadingMore}
              className="text-[11px] px-3 py-1 rounded-lg bg-white/5 border border-white/10 text-slate-300 hover:bg-white/10"
            >
              {loadingMore ? "불러오는 중..." : "이전 메시지 더 보기"}
            </button>
          </div>
        )}
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="w-5 h-5 animate-spin text-purple-500" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-500 text-sm">
            <p className="mb-1">아직 대화가 없습니다.</p>
            <p className="text-xs text-slate-600">먼저 인사를 건네보세요!</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.sender_id === currentUserId;
            return (
              <div
                key={msg.id}
                className={`flex gap-3 ${isMe ? "flex-row-reverse" : "flex-row"}`}
              >
                {!isMe && (
                  <Avatar className="w-8 h-8 mt-1 border border-white/10 shadow-sm">
                    <AvatarImage src={msg.sender?.user_profiles?.avatar_url || ""} />
                    <AvatarFallback className="bg-slate-800 text-slate-400 text-[10px]">{msg.sender?.user_profiles?.name?.[0] || "?"}</AvatarFallback>
                  </Avatar>
                )}
                
                <div className={`flex flex-col max-w-[80%] ${isMe ? "items-end" : "items-start"}`}>
                  <div
                    className={`px-4 py-2.5 rounded-2xl text-sm shadow-sm ${
                      isMe
                        ? "bg-gradient-to-br from-purple-600 to-indigo-600 text-white rounded-tr-none"
                        : "bg-slate-800 text-slate-200 rounded-tl-none border border-white/5"
                    }`}
                  >
                    {msg.content}
                  </div>
                  <span className="text-[10px] text-slate-500 mt-1 px-1">
                    {format(new Date(msg.created_at), "a h:mm", { locale: ko })}{" "}
                    {(() => {
                      if (!lastReadAtByOther) return null
                      if (!isMe) return null
                      const lr = new Date(lastReadAtByOther).getTime()
                      const mc = new Date(msg.created_at).getTime()
                      const newerMineExists = messages.some(m => m.sender_id === currentUserId && new Date(m.created_at).getTime() > mc && new Date(m.created_at).getTime() <= lr)
                      const readThis = lr >= mc && !newerMineExists
                      return readThis ? <span className="ml-1 text-purple-400">읽음</span> : null
                    })()}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>

      <form onSubmit={handleSendMessage} className="flex gap-2 bg-slate-950/50 p-1.5 rounded-xl border border-white/10 focus-within:border-purple-500/50 transition-colors">
        <Input
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="메시지를 입력하세요..."
          className="flex-1 h-10 text-sm bg-transparent border-none text-white placeholder:text-slate-500 focus-visible:ring-0 px-3"
          disabled={isSending}
        />
        <Button 
          type="submit" 
          size="sm" 
          disabled={!newMessage.trim() || isSending}
          className="bg-purple-600 hover:bg-purple-700 text-white h-10 w-10 p-0 rounded-lg shadow-sm"
        >
          {isSending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Send className="w-4 h-4" />
          )}
        </Button>
      </form>
    </div>
  );
}
