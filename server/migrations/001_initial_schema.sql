CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS organizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    plan VARCHAR(50) DEFAULT 'free',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS employees (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    role VARCHAR(100) NOT NULL,
    department VARCHAR(100),
    status VARCHAR(50) DEFAULT 'active',
    skills JSONB DEFAULT '[]'::jsonb,
    wallet_address VARCHAR(255),
    hired_at DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(org_id, email) 
);

ALTER TABLE employees ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS org_isolation_policy ON employees;

CREATE POLICY org_isolation_policy ON employees
    USING (org_id = nullif(current_setting('app.current_org_id', true), '')::uuid);

CREATE INDEX IF NOT EXISTS idx_employees_org_id ON employees(org_id);
CREATE INDEX IF NOT EXISTS idx_employee_skills ON employees USING GIN (skills);
CREATE INDEX IF NOT EXISTS idx_active_employees ON employees (org_id) WHERE status = 'active';