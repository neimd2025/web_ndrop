BEGIN;

-- 1. ENUM Types
DO $$ BEGIN
    CREATE TYPE meeting_status AS ENUM ('pending', 'accepted', 'confirmed', 'declined', 'canceled');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. Tables (IF NOT EXISTS)
CREATE TABLE IF NOT EXISTS public.event_matching_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    is_active BOOLEAN DEFAULT false,
    slot_duration INTEGER DEFAULT 15,
    max_requests_per_user INTEGER DEFAULT 5,
    scoring_weights JSONB DEFAULT '{"interest": 0.4, "job": 0.3, "mbti": 0.2, "activity": 0.1}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT event_matching_configs_event_id_key UNIQUE (event_id)
);

CREATE TABLE IF NOT EXISTS public.event_time_slots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE NOT NULL,
    is_blocked BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT event_time_slots_event_id_start_time_key UNIQUE (event_id, start_time)
);

CREATE TABLE IF NOT EXISTS public.event_match_recommendations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    recommended_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    score FLOAT NOT NULL,
    match_reasons JSONB DEFAULT '[]'::jsonb,
    batch_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT event_match_recommendations_unique_pair UNIQUE (event_id, user_id, recommended_user_id)
);

CREATE TABLE IF NOT EXISTS public.event_meetings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    requester_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    receiver_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    slot_id UUID REFERENCES public.event_time_slots(id) ON DELETE SET NULL,
    status meeting_status DEFAULT 'pending' NOT NULL,
    message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Indexes (IF NOT EXISTS)
CREATE UNIQUE INDEX IF NOT EXISTS idx_event_meetings_confirmed_slot 
ON public.event_meetings (event_id, slot_id) 
WHERE status = 'confirmed' AND slot_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_event_meetings_bidirectional_unique 
ON public.event_meetings (event_id, LEAST(requester_id, receiver_id), GREATEST(requester_id, receiver_id));

-- 4. Enable RLS
ALTER TABLE public.event_matching_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_time_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_match_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_meetings ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies (Drop & Create)

-- A. event_matching_configs
DROP POLICY IF EXISTS "Authenticated read access for matching configs" ON public.event_matching_configs;
CREATE POLICY "Authenticated read access for matching configs" ON public.event_matching_configs
    FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Admin full access for matching configs" ON public.event_matching_configs;
CREATE POLICY "Admin full access for matching configs" ON public.event_matching_configs
    FOR ALL USING (EXISTS (SELECT 1 FROM public.admin_accounts WHERE id = auth.uid()))
    WITH CHECK (EXISTS (SELECT 1 FROM public.admin_accounts WHERE id = auth.uid()));

-- B. event_time_slots
DROP POLICY IF EXISTS "Authenticated read access for time slots" ON public.event_time_slots;
CREATE POLICY "Authenticated read access for time slots" ON public.event_time_slots
    FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Admin full access for time slots" ON public.event_time_slots;
CREATE POLICY "Admin full access for time slots" ON public.event_time_slots
    FOR ALL USING (EXISTS (SELECT 1 FROM public.admin_accounts WHERE id = auth.uid()))
    WITH CHECK (EXISTS (SELECT 1 FROM public.admin_accounts WHERE id = auth.uid()));

-- C. event_match_recommendations
DROP POLICY IF EXISTS "Users can see their own recommendations" ON public.event_match_recommendations;
CREATE POLICY "Users can see their own recommendations" ON public.event_match_recommendations
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admin full access for recommendations" ON public.event_match_recommendations;
CREATE POLICY "Admin full access for recommendations" ON public.event_match_recommendations
    FOR ALL USING (EXISTS (SELECT 1 FROM public.admin_accounts WHERE id = auth.uid()))
    WITH CHECK (EXISTS (SELECT 1 FROM public.admin_accounts WHERE id = auth.uid()));

-- D. event_meetings
DROP POLICY IF EXISTS "Users can view their own meetings" ON public.event_meetings;
CREATE POLICY "Users can view their own meetings" ON public.event_meetings
    FOR SELECT USING (auth.uid() = requester_id OR auth.uid() = receiver_id);

DROP POLICY IF EXISTS "Users can create meeting requests" ON public.event_meetings;
CREATE POLICY "Users can create meeting requests" ON public.event_meetings
    FOR INSERT WITH CHECK (auth.uid() = requester_id);

DROP POLICY IF EXISTS "Users can update their own meetings" ON public.event_meetings;
CREATE POLICY "Users can update their own meetings" ON public.event_meetings
    FOR UPDATE 
    USING (auth.uid() = requester_id OR auth.uid() = receiver_id)
    WITH CHECK (
        (auth.uid() = requester_id AND status = 'canceled') 
        OR 
        (auth.uid() = receiver_id AND status IN ('accepted', 'declined')) 
        OR 
        ((auth.uid() = requester_id OR auth.uid() = receiver_id) 
            AND status = 'confirmed' 
            AND slot_id IS NOT NULL)
    );

DROP POLICY IF EXISTS "Admin full access for meetings" ON public.event_meetings;
CREATE POLICY "Admin full access for meetings" ON public.event_meetings
    FOR ALL USING (EXISTS (SELECT 1 FROM public.admin_accounts WHERE id = auth.uid()))
    WITH CHECK (EXISTS (SELECT 1 FROM public.admin_accounts WHERE id = auth.uid()));

COMMIT;

-- Verification
SELECT 
    table_name, 
    row_security,
    (SELECT count(*) FROM pg_policies WHERE tablename = tables.table_name) as policy_count
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('event_matching_configs', 'event_time_slots', 'event_match_recommendations', 'event_meetings');
