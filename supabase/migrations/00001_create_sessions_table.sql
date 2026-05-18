CREATE TABLE sessions (
    session_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    extracted_document_text TEXT,
    audience_category TEXT,
    harshness_level TEXT DEFAULT 'Constructive',
    all_roast_outputs JSONB,
    aggregate_score NUMERIC,
    consensus_verdict TEXT,
    consensus_objections JSONB,
    top_rewrite_target TEXT,
    rewrite_json JSONB,
    defence_transcript JSONB DEFAULT '[]'::jsonb,
    share_url TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_sessions_updated_at
    BEFORE UPDATE ON sessions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Allow public access for this app (no auth required per spec)
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "allow_all_select" ON sessions FOR SELECT TO anon USING (true);
CREATE POLICY "allow_all_insert" ON sessions FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "allow_all_update" ON sessions FOR UPDATE TO anon USING (true);
