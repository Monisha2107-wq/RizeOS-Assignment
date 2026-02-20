CREATE TABLE IF NOT EXISTS ai_scores (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    employee_id UUID UNIQUE NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    productivity_score DECIMAL(5,2) DEFAULT 0.00,
    task_completion_rate DECIMAL(5,2) DEFAULT 0.00,
    avg_completion_time_hrs DECIMAL(10,2) DEFAULT 0.00,
    score_breakdown JSONB DEFAULT '{}'::jsonb,
    trend VARCHAR(50) DEFAULT 'stable', 
    computed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE ai_scores ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS org_isolation_ai_scores ON ai_scores;

CREATE POLICY org_isolation_ai_scores ON ai_scores
    USING (org_id = nullif(current_setting('app.current_org_id', true), '')::uuid);