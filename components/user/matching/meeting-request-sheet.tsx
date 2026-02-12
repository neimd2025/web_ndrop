import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";
import { Send } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { toast } from "sonner";

interface MeetingRequestSheetProps {
  isOpen: boolean;
  onClose: () => void;
  targetProfile: { id: string; nickname: string } | null;
  eventId: string;
  onSuccess: () => void;
}

export function MeetingRequestSheet({
  isOpen,
  onClose,
  targetProfile,
  eventId,
  onSuccess,
}: MeetingRequestSheetProps) {
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!targetProfile) return;
    
    setIsSubmitting(true);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) throw new Error("Unauthorized");

      const res = await fetch(`/api/events/${eventId}/meetings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          receiver_id: targetProfile.id,
          message: message,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        if (res.status === 409) {
          throw new Error("이미 요청을 보냈거나 처리 중인 상대입니다.");
        }
        throw new Error(errorData.error || "Failed to send request");
      }

      toast.success(`${targetProfile.nickname}님께 미팅을 요청했습니다.`);
      setMessage("");
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error("Meeting request error:", error);
      toast.error(error.message || "미팅 요청에 실패했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="bottom" className="rounded-t-xl h-[80vh] bg-slate-950 border-white/10 text-white">
        <SheetHeader className="text-left mb-4">
          <SheetTitle className="text-white">미팅 요청 보내기</SheetTitle>
          <SheetDescription className="text-slate-400">
            <strong className="text-purple-400">{targetProfile?.nickname}</strong>님에게 보낼 메시지를 작성해주세요.
            <br />
            어떤 점이 흥미로웠는지, 왜 만나고 싶은지 적으면 수락 확률이 올라갑니다!
          </SheetDescription>
        </SheetHeader>
        
        <div className="space-y-4 py-4">
          <Textarea
            placeholder="안녕하세요! 같은 업계에 계신 것 같아 이야기 나눠보고 싶습니다."
            className="min-h-[150px] resize-none bg-slate-900 border-white/10 text-white placeholder:text-slate-500 focus-visible:ring-purple-500"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
        </div>

        <SheetFooter className="mt-4">
          <Button 
            className="w-full bg-purple-600 hover:bg-purple-700 text-white" 
            onClick={handleSubmit} 
            disabled={isSubmitting || !message.trim()}
          >
            {isSubmitting ? (
              "전송 중..."
            ) : (
              <>
                <Send className="w-4 h-4 mr-2" />
                요청 보내기
              </>
            )}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
