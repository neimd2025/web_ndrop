
-- event_meeting_messages 테이블 생성
CREATE TABLE IF NOT EXISTS public.event_meeting_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    meeting_id UUID NOT NULL REFERENCES public.event_meetings(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_event_meeting_messages_meeting_id ON public.event_meeting_messages(meeting_id);
CREATE INDEX IF NOT EXISTS idx_event_meeting_messages_created_at ON public.event_meeting_messages(created_at);

-- RLS 활성화
ALTER TABLE public.event_meeting_messages ENABLE ROW LEVEL SECURITY;

-- RLS 정책
-- 1. 조회: 미팅의 참여자(requester, receiver)만 조회 가능
CREATE POLICY "Participants can view messages" ON public.event_meeting_messages
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.event_meetings m
            WHERE m.id = meeting_id
            AND (m.requester_id = auth.uid() OR m.receiver_id = auth.uid())
        )
    );

-- 2. 생성: 미팅의 참여자만 생성 가능
CREATE POLICY "Participants can send messages" ON public.event_meeting_messages
    FOR INSERT WITH CHECK (
        auth.uid() = sender_id
        AND EXISTS (
            SELECT 1 FROM public.event_meetings m
            WHERE m.id = meeting_id
            AND (m.requester_id = auth.uid() OR m.receiver_id = auth.uid())
        )
    );

-- 3. 관리자: 전체 접근
CREATE POLICY "Admin full access for messages" ON public.event_meeting_messages
    FOR ALL USING (EXISTS (SELECT 1 FROM public.admin_accounts WHERE id = auth.uid()))
    WITH CHECK (EXISTS (SELECT 1 FROM public.admin_accounts WHERE id = auth.uid()));
