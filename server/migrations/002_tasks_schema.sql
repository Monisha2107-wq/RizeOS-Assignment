CREATE TABLE IF NOT EXISTS tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    assigned_to UUID REFERENCES employees(id) ON DELETE SET NULL,
    created_by UUID REFERENCES employees(id) ON DELETE SET NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    priority VARCHAR(50) DEFAULT 'medium',
    status VARCHAR(50) DEFAULT 'assigned',
    required_skills JSONB DEFAULT '[]'::jsonb,
    due_date TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS org_isolation_tasks ON tasks;

CREATE POLICY org_isolation_tasks ON tasks
    USING (org_id = nullif(current_setting('app.current_org_id', true), '')::uuid);

CREATE INDEX IF NOT EXISTS idx_tasks_org_status ON tasks (org_id, status);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to ON tasks (assigned_to);