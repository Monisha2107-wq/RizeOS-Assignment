# RizeOS Mini AI-HRMS
> **Multi-tenant, AI-powered, Web3-auditable Workforce Intelligence Platform**
> Built for the RizeOS Founder Engineer Internship Assessment

[![Demo Video](https://img.shields.io/badge/Demo%20Video-Watch-red?style=for-the-badge)](https://drive.google.com/file/d/1fj4SUELxNvOqvghYOhGss7IFK9-2BZxz/view)
[![GitHub](https://img.shields.io/badge/GitHub-Repo-black?style=for-the-badge)](https://github.com/Monisha2107-wq/RizeOS-Assignment)

---

## Table of Contents

- [Problem Statement](#-problem-statement)
- [Solution Overview](#-solution-overview)
- [X-Factor Architecture Strategy](#-x-factor-architecture-strategy)
- [Tech Stack & Decision Rationale](#-tech-stack--decision-rationale)
- [System Architecture](#-system-architecture)
- [Database Schema & Design](#-database-schema--design)
- [API Contract](#-api-contract)
- [AI Workforce Intelligence — Logic Explained](#-ai-workforce-intelligence--logic-explained)
- [Web3 Integration](#-web3-integration)
- [Real-Time WebSocket Design](#-real-time-websocket-design)
- [Scalability Design](#-scalability-design-100k-employees--1m-task-logs)
- [Frontend Architecture](#-frontend-architecture)
- [Project Structure](#-project-structure)
- [Local Setup & Running](#-local-setup--running)
- [Environment Variables](#-environment-variables)
- [GTM & Monetization Strategy](#-gtm--monetization-strategy)
- [Evaluation Rubric Mapping](#-evaluation-rubric-mapping)

---

## Problem Statement

Modern SMBs and startups struggle with fragmented HR tooling — spreadsheets for employee tracking, Slack for task management, and zero visibility into workforce productivity. Existing HRMS platforms are either too expensive, too generic, or completely lack AI-driven workforce intelligence and tamper-proof audit capabilities.

**RizeOS Mini AI-HRMS** solves this by unifying employee management, task tracking, AI productivity insights, and optional blockchain-based workforce logging into a single, scalable platform.

---

## Solution Overview

| Module | What It Does |
|---|---|
| **Org & Employee Management** | Multi-tenant org onboarding, JWT auth, employee CRUD with skill tagging |
| **Task Management** | Admin assigns tasks; employees update status (Assigned → In Progress → Completed) |
| **Workforce Dashboard** | Real-time KPIs — headcount, active tasks, productivity scores, trend charts |
| **AI Workforce Intelligence** | Productivity scoring, skill gap detection, smart task assignment, trend prediction |
| **Web3 Workforce Logging** | MetaMask/Phantom wallet connect; task events hashed and logged on-chain |

---

## ⚡ X-Factor Architecture Strategy

Most HRMS demos are CRUD apps with a `productivity = completedTasks/total * 100` formula bolted on. This system is architected differently:

| What Others Build | What This System Does |
|---|---|
| Simple productivity % | Multi-dimensional AI scoring engine with weighted signals |
| Basic JWT auth | Org-scoped multi-tenant architecture with Row-Level Security |
| Flat employee table | JSONB skill taxonomy with role-requirement mapping |
| Web3 as an afterthought | Web3 as a first-class tamper-proof audit layer |
| One AI feature | AI woven into every module (score, assign, predict, detect gaps) |
| Static dashboard | Real-time WebSocket-powered dashboard with live updates |

**Core Concept: Every meaningful action (task created/completed/status changed) fires an internal event that simultaneously feeds:**
1. The relational DB (source of truth)
2. The AI scoring engine (rolling score recompute)
3. The blockchain logger (tamper-proof audit trail)

---

## Tech Stack & Decision Rationale

| Layer | Choice | Why |
|---|---|---|
| **Frontend** | React.js + Vite + TailwindCSS | Fast DX, component reusability, Tailwind for rapid styling |
| **State Management** | Zustand + React Query | Zustand for auth/org state; React Query for server state + caching |
| **Backend** | Node.js + Express | <!-- OR: Golang + Gin --> Fast iteration, rich ecosystem, async event handling |
| **Database** | PostgreSQL | Row-Level Security for multi-tenancy, JSONB for flexible skill data, better joins than MongoDB for this schema |
| **Blockchain** | Polygon Mumbai Testnet | Low gas fees, EVM-compatible, good tooling with ethers.js |
| **Wallet** | MetaMask | Widest browser support, mature ethers.js integration |
| **AI/ML** | Custom scoring engine (Node.js) | No external API dependency, fully explainable logic, fast iteration |
| **Real-Time** | WebSocket (ws library) | Lightweight, org-scoped rooms for live dashboard updates |

> **Why PostgreSQL over MongoDB?**
> Multi-tenant row-level security is a first-class PostgreSQL feature. JSONB columns give us MongoDB-like flexibility for skills/scores while maintaining ACID compliance for financial-adjacent payroll data.

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                             │
│  React + Vite + TailwindCSS + React Query + Zustand             │
│  Pages: Auth | Dashboard | Employees | Tasks | AI Insights      │
└────────────────────────┬────────────────────────────────────────┘
                         │ HTTPS / WebSocket
┌────────────────────────▼────────────────────────────────────────┐
│                      API GATEWAY (Node/Express)                 │
│  Rate Limiting | JWT Middleware | Org-Scoping | Request Logger  │
│                                                                 │
│  ┌─────────────┐ ┌──────────────┐ ┌────────────┐ ┌──────────┐  │
│  │ Auth Router │ │ Org/Employee │ │ Task Router│ │ AI Router│  │
│  └─────────────┘ └──────────────┘ └────────────┘ └──────────┘  │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │               EVENT BUS (EventEmitter / Bull Queue)      │   │
│  │  task.completed → [AI scorer] + [Web3 logger] + [WS emit]│   │
│  └──────────────────────────────────────────────────────────┘   │
└────────┬──────────────────────┬──────────────────────┬──────────┘
         │                      │                      │
┌────────▼──────┐    ┌──────────▼────────┐   ┌────────▼──────────┐
│  PostgreSQL   │    │   AI Engine       │   │  Web3 Logger      │
│  (Primary DB) │    │   (Node Service)  │   │  (Polygon/Mumbai) │
│  Multi-tenant │    │  Scoring Engine   │   │  ethers.js        │
│  Row-Level    │    │  Skill Gap        │   │  Event Hash Log   │
│  Security     │    │  Smart Assign     │   │                   │
│               │    │  Trend Predict    │   │                   │
└───────────────┘    └───────────────────┘   └───────────────────┘
```

---

## Database Schema & Design

### Entity-Relationship Overview

```
organizations (1) ──────────────── (many) employees
                                         │
                                         │ (1-to-many)
                                         ▼
                                       tasks
                                         │
                                         │ (1-to-many)
                                         ▼
                              ai_scores | workforce_events
```

---

### Table: `organizations`

```sql
CREATE TABLE organizations (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          VARCHAR(255) NOT NULL,
  slug          VARCHAR(100) UNIQUE NOT NULL,        -- used in URL routing
  email         VARCHAR(255) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  plan          VARCHAR(50) DEFAULT 'free',           -- free | starter | growth | enterprise
  created_at    TIMESTAMPTZ DEFAULT NOW()
);
```

---

### Table: `employees`

```sql
CREATE TABLE employees (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id         UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name           VARCHAR(255) NOT NULL,
  email          VARCHAR(255) NOT NULL,
  role           VARCHAR(100),                         -- e.g. "Backend Engineer"
  department     VARCHAR(100),                         -- e.g. "Engineering"
  status         VARCHAR(20) DEFAULT 'active',         -- active | inactive
  skills         JSONB DEFAULT '[]',                   -- ["React", "Node.js", "PostgreSQL"]
  wallet_address VARCHAR(255),                         -- optional MetaMask/Phantom address
  hired_at       DATE,
  created_at     TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(email, org_id)                                -- email unique within org
);

-- Indexes
CREATE INDEX idx_employees_org_id ON employees(org_id);
CREATE INDEX idx_employees_skills ON employees USING GIN(skills);
```

---

### Table: `tasks`

```sql
CREATE TABLE tasks (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id          UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  assigned_to     UUID REFERENCES employees(id) ON DELETE SET NULL,
  created_by      UUID REFERENCES employees(id) ON DELETE SET NULL,
  title           VARCHAR(500) NOT NULL,
  description     TEXT,
  priority        VARCHAR(20) DEFAULT 'medium',       -- low | medium | high | critical
  status          VARCHAR(30) DEFAULT 'assigned',     -- assigned | in_progress | completed | cancelled
  required_skills JSONB DEFAULT '[]',                 -- skills needed for this task
  due_date        DATE,
  completed_at    TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_tasks_org_id ON tasks(org_id);
CREATE INDEX idx_tasks_assigned_to ON tasks(assigned_to);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_created_at ON tasks(created_at);  -- for trend queries
```

---

### Table: `ai_scores`

```sql
CREATE TABLE ai_scores (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id          UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  org_id               UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  productivity_score   NUMERIC(5,2),                  -- 0.00 to 100.00
  skill_match_score    NUMERIC(5,2),                  -- how well skills match assigned tasks
  velocity_score       NUMERIC(5,2),                  -- task completion rate over time
  overdue_penalty      NUMERIC(5,2),                  -- deduction for overdue tasks
  composite_score      NUMERIC(5,2),                  -- final weighted score
  score_breakdown      JSONB,                         -- full breakdown for UI explainability
  computed_at          TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_ai_scores_employee_id ON ai_scores(employee_id);
CREATE INDEX idx_ai_scores_org_id ON ai_scores(org_id);
CREATE INDEX idx_ai_scores_computed_at ON ai_scores(computed_at);
```

---

### Table: `workforce_events` (Web3 Audit Log)

```sql
CREATE TABLE workforce_events (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id        UUID NOT NULL REFERENCES organizations(id),
  employee_id   UUID NOT NULL REFERENCES employees(id),
  event_type    VARCHAR(100),                         -- task_completed | payroll_proof | status_change
  event_payload JSONB,                               -- raw event data
  event_hash    VARCHAR(66),                         -- keccak256 hash of payload
  tx_hash       VARCHAR(66),                         -- on-chain transaction hash
  chain         VARCHAR(50) DEFAULT 'polygon_mumbai',
  logged_at     TIMESTAMPTZ DEFAULT NOW()
);
```

---

### Multi-Tenancy: Row-Level Security

```sql
-- Enable RLS on all tables
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- Policy: orgs can only read/write their own data
CREATE POLICY org_isolation ON employees
  USING (org_id = current_setting('app.current_org_id')::UUID);

CREATE POLICY org_isolation ON tasks
  USING (org_id = current_setting('app.current_org_id')::UUID);
```

> This means even if a developer forgets to add a `WHERE org_id = ?` clause, the DB enforces isolation at the row level.

---

## API Contract

### Base URL
```
Development: http://localhost:5000/api/v1
```

### Authentication
All protected routes require:
```
Authorization: Bearer <jwt_token>
```
JWT payload: `{ orgId, adminId, iat, exp }`

---

### Auth Endpoints

#### `POST /auth/register`
Register a new organization.
```json
// Request Body
{
  "orgName": "Acme Corp",
  "email": "admin@acme.com",
  "password": "securepass123"
}

// Response 201
{
  "token": "eyJhbGc...",
  "org": {
    "id": "uuid",
    "name": "Acme Corp",
    "slug": "acme-corp"
  }
}
```

#### `POST /auth/login`
```json
// Request Body
{ "email": "admin@acme.com", "password": "securepass123" }

// Response 200
{ "token": "eyJhbGc...", "org": { ... } }
```

---

### Employee Endpoints

#### `GET /employees`
Returns all employees in the authenticated org.
```json
// Response 200
{
  "employees": [
    {
      "id": "uuid",
      "name": "Jane Doe",
      "role": "Backend Engineer",
      "department": "Engineering",
      "status": "active",
      "skills": ["Node.js", "PostgreSQL", "Docker"],
      "wallet_address": "0xabc...",
      "ai_score": {
        "composite_score": 87.4,
        "computed_at": "2024-01-15T10:30:00Z"
      }
    }
  ],
  "total": 24,
  "active": 22
}
```

#### `POST /employees`
Add a new employee.
```json
// Request Body
{
  "name": "Jane Doe",
  "email": "jane@acme.com",
  "role": "Backend Engineer",
  "department": "Engineering",
  "skills": ["Node.js", "PostgreSQL"],
  "hired_at": "2024-01-01"
}

// Response 201
{ "employee": { "id": "uuid", ... } }
```

#### `GET /employees/:id`
Returns full employee profile including AI score breakdown and task history.

#### `PUT /employees/:id`
Update employee details.

#### `DELETE /employees/:id`
Soft-delete (sets `status = inactive`).

---

### Task Endpoints

#### `GET /tasks`
```
Query params: status, assigned_to, priority, page, limit
```
```json
// Response 200
{
  "tasks": [
    {
      "id": "uuid",
      "title": "Implement JWT middleware",
      "status": "in_progress",
      "priority": "high",
      "assigned_to": { "id": "uuid", "name": "Jane Doe" },
      "due_date": "2024-02-01",
      "required_skills": ["Node.js", "JWT"]
    }
  ],
  "total": 45,
  "by_status": {
    "assigned": 10,
    "in_progress": 15,
    "completed": 20
  }
}
```

#### `POST /tasks`
Create and assign a task.
```json
{
  "title": "Build authentication module",
  "description": "JWT-based auth with refresh tokens",
  "assigned_to": "employee-uuid",
  "priority": "high",
  "required_skills": ["Node.js", "JWT"],
  "due_date": "2024-02-01"
}
```

#### `PATCH /tasks/:id/status`
Update task status (employee-facing).
```json
// Request
{ "status": "completed" }

// Response — triggers AI rescore + optional Web3 log
{
  "task": { ... },
  "ai_score_updated": true,
  "web3_tx_hash": "0xabc..." // if Web3 enabled
}
```

#### `GET /tasks/:id/smart-assign`
Returns the AI-recommended best employee for this task.
```json
// Response
{
  "recommended": {
    "employee": { "id": "uuid", "name": "Jane Doe" },
    "match_score": 94.2,
    "reasoning": {
      "skill_overlap": ["Node.js", "JWT"],
      "current_workload": "low",
      "productivity_score": 87.4
    }
  },
  "alternatives": [ ... ]
}
```

---

### AI Endpoints

#### `GET /ai/scores/:employeeId`
Full AI score breakdown for an employee.
```json
{
  "employee_id": "uuid",
  "scores": {
    "productivity_score": 78.5,
    "skill_match_score": 85.0,
    "velocity_score": 72.3,
    "overdue_penalty": -5.0,
    "composite_score": 82.7
  },
  "breakdown": {
    "total_tasks": 20,
    "completed_on_time": 14,
    "completed_late": 3,
    "in_progress": 2,
    "overdue": 1
  },
  "trend": [
    { "week": "2024-W01", "score": 76.2 },
    { "week": "2024-W02", "score": 79.1 },
    { "week": "2024-W03", "score": 82.7 }
  ]
}
```

#### `GET /ai/skill-gaps/:employeeId`
```json
{
  "employee_id": "uuid",
  "role": "Backend Engineer",
  "current_skills": ["Node.js", "PostgreSQL"],
  "required_for_role": ["Node.js", "PostgreSQL", "Docker", "Redis", "System Design"],
  "gaps": ["Docker", "Redis", "System Design"],
  "gap_severity": "medium",
  "recommendations": [
    { "skill": "Docker", "priority": "high", "resource": "docs.docker.com" }
  ]
}
```

#### `GET /ai/org-health`
Org-level productivity intelligence.
```json
{
  "org_productivity_score": 74.3,
  "top_performers": [ ... ],
  "underperformers": [ ... ],
  "department_breakdown": {
    "Engineering": 81.2,
    "Design": 69.4,
    "Marketing": 72.1
  },
  "overloaded_employees": [ ... ],   // workload > threshold
  "predicted_trend": "improving"    // improving | stable | declining
}
```

---

### Web3 Endpoints

#### `POST /web3/log-event`
Log a workforce event on-chain (called internally by event bus, or manually).
```json
// Request
{
  "event_type": "task_completed",
  "employee_id": "uuid",
  "task_id": "uuid"
}

// Response
{
  "tx_hash": "0xabc123...",
  "chain": "polygon_mumbai",
  "block_number": 45123456,
  "event_hash": "0xdef456..."
}
```

#### `GET /web3/events/:employeeId`
Returns all on-chain events for an employee.

---

## AI Workforce Intelligence — Logic Explained

> This section explains exactly how the AI scoring works. No black boxes.

### Productivity Score Formula

```
Composite Score = (
  (task_completion_rate × 0.40) +
  (on_time_rate        × 0.30) +
  (velocity_score      × 0.20) +
  (skill_match_score   × 0.10)
) − overdue_penalty
```

**Component Definitions:**

| Component | Formula | Weight |
|---|---|---|
| `task_completion_rate` | `completed / (completed + in_progress + overdue)` × 100 | 40% |
| `on_time_rate` | `completed_on_time / completed` × 100 | 30% |
| `velocity_score` | Tasks completed in last 7 days vs. org average | 20% |
| `skill_match_score` | Overlap between employee skills and assigned task required_skills | 10% |
| `overdue_penalty` | `−5 points per overdue task` (capped at −25) | deduction |

**Example:**
```
Employee: Jane Doe
- Tasks completed: 14 / 17 → completion_rate = 82.3
- On-time completions: 11/14 → on_time_rate = 78.5
- Velocity: 4 tasks/week vs org avg 3.2 → velocity_score = 90.0
- Skill match on assigned tasks: avg 85.0
- Overdue tasks: 1 → penalty = -5

Composite = (82.3×0.4) + (78.5×0.3) + (90.0×0.2) + (85.0×0.1) − 5
          = 32.92 + 23.55 + 18.00 + 8.50 − 5
          = 77.97
```

---

### Skill Gap Detection Logic

```javascript
// Role → required skills mapping (stored in DB or config)
const ROLE_SKILL_MAP = {
  "Backend Engineer": ["Node.js", "PostgreSQL", "Docker", "Redis", "REST APIs"],
  "Frontend Engineer": ["React", "TypeScript", "CSS", "Testing"],
  // ...
};

function detectSkillGap(employee) {
  const required = ROLE_SKILL_MAP[employee.role] || [];
  const gaps = required.filter(skill => !employee.skills.includes(skill));
  const severity = gaps.length === 0 ? "none"
                 : gaps.length <= 2 ? "low"
                 : gaps.length <= 4 ? "medium" : "high";
  return { gaps, severity };
}
```

---

### Smart Task Assignment Logic

```javascript
function recommendEmployee(task, employees) {
  return employees
    .map(emp => {
      const skillOverlap = task.required_skills.filter(s => emp.skills.includes(s)).length;
      const skillScore = (skillOverlap / task.required_skills.length) * 100;

      const activeTasks = emp.active_task_count;
      const workloadScore = activeTasks <= 2 ? 100
                          : activeTasks <= 5 ? 60 : 20;

      const productivityScore = emp.ai_score?.composite_score || 50;

      const matchScore = (skillScore * 0.50) + (workloadScore * 0.30) + (productivityScore * 0.20);
      return { employee: emp, match_score: matchScore, skillOverlap };
    })
    .sort((a, b) => b.match_score - a.match_score)[0];
}
```

---

### Performance Trend Prediction

```javascript
// Simple linear regression over last N weekly scores
function predictTrend(weeklyScores) {
  // weeklyScores = [{ week: "W01", score: 74 }, ...]
  const n = weeklyScores.length;
  if (n < 3) return "insufficient_data";

  const recent = weeklyScores.slice(-3).map(w => w.score);
  const avg_recent = recent.reduce((a, b) => a + b, 0) / 3;
  const avg_older  = weeklyScores.slice(0, -3).reduce(...) / (n - 3);

  const delta = avg_recent - avg_older;
  if (delta > 5)  return "improving";
  if (delta < -5) return "declining";
  return "stable";
}
```

---

## Web3 Integration

### Architecture

```
task.completed event fires
  │
  └─ web3.service.logEvent(data)   [async, non-blocking]
      ├─ Encode orgId/employeeId/taskId as bytes32 hashes
      ├─ Call WorkforceLogger.logEvent() via backend signer wallet
      ├─ Wait for tx receipt
      ├─ Store tx_hash in workforce_events table
      └─ Push tx_hash via WebSocket → Frontend shows: "Logged on-chain: 0xabc..."
```

### Smart Contract (WorkforceLogger.sol)

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract WorkforceLogger {
    event WorkforceEvent(
        bytes32 indexed orgId,
        bytes32 indexed employeeId,
        bytes32 taskId,
        string  eventType,
        uint256 timestamp
    );

    function logEvent(
        bytes32 orgId,
        bytes32 employeeId,
        bytes32 taskId,
        string calldata eventType
    ) external {
        emit WorkforceEvent(orgId, employeeId, taskId, eventType, block.timestamp);
    }
}
```

> **Gas Cost:** ~21,000 gas per log = ~$0.0001 on Polygon Mumbai

### Deployed Contract
- **Network:** Polygon Mumbai Testnet
- **Contract Address:** `0xYOUR_CONTRACT_ADDRESS`
- **Verified on:** [PolygonScan Mumbai](https://mumbai.polygonscan.com/address/0xYOUR_ADDRESS)

### MetaMask Employee Wallet Flow
1. Employee visits profile → clicks "Connect Wallet"
2. MetaMask popup → employee approves connection
3. Wallet address stored in `employees.wallet_address`
4. Employee can independently verify their on-chain history at any time

---

## Real-Time WebSocket Design

```
Connection:  ws://localhost:5000
Handshake:   client sends { type: "auth", token: "JWT", orgId: "uuid" }
Server:      verifies JWT, adds socket to org room (Map<orgId, Set<WebSocket>>)

Events pushed to org room:
  task.created      → { type: "task.created",   payload: { task } }
  task.completed    → { type: "task.completed",  payload: { task, newScore } }
  employee.added    → { type: "employee.added",  payload: { employee } }
  ai.score.updated  → { type: "ai.score",        payload: { employeeId, score } }
  web3.logged       → { type: "web3.logged",     payload: { tx_hash, event_type } }

Frontend: useWebSocket hook → receives events → React Query cache invalidation → UI updates
```

---

## Scalability Design (100K employees / 1M task logs)

### Database Layer

```sql
-- Table partitioning for tasks (partition by month)
CREATE TABLE tasks (
  /* columns */
) PARTITION BY RANGE (created_at);

CREATE TABLE tasks_2024_01 PARTITION OF tasks
  FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');

-- Connection pooling
-- Use PgBouncer in transaction mode (poolSize = CPU cores × 2)

-- Read replicas
-- Dashboard SELECT queries → read replica
-- Writes → primary
```

### Application Layer

| Concern | Solution |
|---|---|
| Horizontal API scaling | Stateless Express instances behind load balancer (Nginx/Railway) |
| AI scoring at scale | Move to Bull Queue (Redis-backed); score computed async, not per-request |
| WebSocket multi-instance | Redis Pub/Sub adapter; WS events published to Redis, all instances broadcast |
| Dashboard speed | Redis cache on `/dashboard/:orgId` with 30s TTL; invalidated on task.completed |
| Bulk imports | Background job with streaming CSV parsing; progress via WebSocket |

### Caching Strategy

```
GET /dashboard/:orgId
  └─ Redis.get(`dashboard:${orgId}`)
      ├─ HIT  → return JSON (TTL: 30s)
      └─ MISS → query DB → Redis.setEx(key, 30, data) → return

Invalidation trigger: task.completed event → Redis.del(`dashboard:${orgId}`)

AI scores: computed on task.completed, stored in DB, cached in Redis (TTL: 5min)
```

### Estimated Capacity

| Metric | Estimate |
|---|---|
| Employees per org | Up to 500 on Growth plan |
| Task logs (1M) | ~1.2GB in PostgreSQL with indexes |
| Concurrent WebSocket connections | ~10K per instance with ws library |
| API response time (p95) | < 100ms for all CRUD operations |

---

## Frontend Architecture

### Page Structure

| Page | Key Components | Data Source |
|---|---|---|
| `/login`, `/register` | AuthForm, OrgNameField | REST API |
| `/dashboard` | StatCards, TaskTrendChart, TopPerformers, ActivityFeed | REST + WebSocket |
| `/employees` | EmployeeGrid, DeptFilter, SkillTagFilter | REST + WebSocket |
| `/employees/:id` | ProfileDrawer, ScoreGauge, SkillRadar, TaskTimeline | REST |
| `/tasks` | KanbanBoard (3 cols), TaskCard, SmartAssignModal | REST + WebSocket |
| `/ai-insights` | OrgHealthScore, EmployeeRanking, SkillHeatmap, TrendChart | REST |

### State Architecture

```
Zustand (client-only state):
  authStore    → { token, org, admin }
  uiStore      → { sidebarOpen, theme }

React Query (server state):
  useEmployees()       → GET /employees
  useTasks()           → GET /tasks
  useAIScore(empId)    → GET /ai/scores/:id
  useOrgHealth()       → GET /ai/org-health

WebSocket (real-time):
  useWebSocket() → listens for events → invalidates React Query cache
```

---

## Project Structure

```
RizeOS-Assignment/
├── client/
│   ├── src/
│   │   ├── api/              # Axios instances + query functions
│   │   ├── components/
│   │   │   ├── ui/           # Button, Card, Badge, Modal, Input
│   │   │   ├── layout/       # Sidebar, Topbar, PageWrapper
│   │   │   ├── dashboard/    # StatCard, TaskChart, ActivityFeed
│   │   │   ├── employees/    # EmployeeCard, SkillTag, ProfileDrawer
│   │   │   ├── tasks/        # KanbanBoard, TaskCard, AssignModal
│   │   │   └── ai/           # ScoreGauge, SkillRadar, TrendLine
│   │   ├── pages/            # Login, Register, Dashboard, Employees, Tasks, AIInsights
│   │   ├── store/            # Zustand: authStore, uiStore
│   │   ├── hooks/            # useWebSocket, useWallet, useAIScore
│   │   └── utils/            # web3.js, formatters, constants
│   └── vite.config.js
│
├── server/
│   ├── src/
│   │   ├── config/           # db.js, env.js (zod-validated), constants
│   │   ├── middleware/        # auth, rateLimit, error, requestLogger
│   │   ├── modules/
│   │   │   ├── auth/         # routes, controller, service
│   │   │   ├── organizations/ # routes, controller, service
│   │   │   ├── employees/    # routes, controller, service
│   │   │   ├── tasks/        # routes, controller, service
│   │   │   ├── ai/           # routes, controller, service, scoring.engine.js
│   │   │   └── web3/         # routes, controller, service (ethers.js)
│   │   ├── events/           # eventBus.js + handlers/
│   │   ├── websocket/        # ws.server.js (org-scoped rooms)
│   │   └── app.js
│   └── migrations/           # SQL migration files (001_orgs, 002_employees, ...)
│
│
└── README.md
```

---

## Local Setup & Running

### Prerequisites

- Node.js v18+
- PostgreSQL 14+
- Redis (optional, for queue/cache)
- MetaMask browser extension (for Web3 testing)

### 1. Clone the Repository

```bash
git clone https://github.com/Monisha2107-wq/RizeOS-Assignment.git
cd RizeOS-Assignment
```

### 2. Backend Setup

```bash
cd server
npm install


# Run DB migrations
psql -U postgres -d rizeos_hrms -f migrations/001_initial_schema.sql
psql -U postgres -d rizeos_hrms -f migrations/002_tasks_schema.sql
psql -U postgres -d rizeos_hrms -f migrations/003_ai_scores_schema.sql

# Start backend
npm run dev   # development (nodemon)
npm start     # production
```

### 3. Frontend Setup

```bash
cd client
npm install

npm run dev   # → http://localhost:5173
```

---

## Environment Variables

### Backend `.env`

```env
# Server
PORT=5000
NODE_ENV=development

# Database
DATABASE_URL=postgresql://USER:PASSWORD@localhost:5432/rizeos_hrms

# JWT
JWT_SECRET=your-super-secret-key-here
JWT_EXPIRES_IN=7d

# Redis (optional)
REDIS_URL=redis://localhost:6379

# Web3
POLYGON_MUMBAI_RPC=https://rpc-mumbai.maticvigil.com
BACKEND_SIGNER_PRIVATE_KEY=0xYOUR_PRIVATE_KEY   # testnet wallet, never mainnet funds
CONTRACT_ADDRESS=0xYOUR_CONTRACT_ADDRESS
```

### Frontend `.env`

```env
VITE_API_URL=http://localhost:5000/api/v1
VITE_WS_URL=ws://localhost:5000
```

---

## GTM & Monetization Strategy

### Target Segments

| Segment | Size | Pain Point |
|---|---|---|
| Indian startups (Seed–Series A) | 10–100 employees | No HRMS, using spreadsheets |
| Remote-first tech teams | 20–200 employees | No visibility into distributed workforce |
| Web3 companies | Any size | Need tamper-proof workforce audit |

**Primary HR Personas:** HR Manager, Founder/CEO (small cos), Operations Lead

---

### 3-Month Onboarding Roadmap (First 50–100 Companies)

**Month 1 — Foundation & Early Access (Target: 10 companies)**
- ProductHunt launch + IndiaHacks community posts
- DM 200 Indian startup founders on Twitter/LinkedIn (free beta offer)
- Partner with 2–3 incubators (NSRCEL, T-Hub) for pilot access

**Month 2 — Community & Content (Target: 30 companies)**
- YouTube Shorts: "How we automated HR scoring for 10 startups"
- Post in HR WhatsApp/Slack communities (SHRM India, People Matters)
- Referral program: 1 free month per successful referral
- Cold email to Series A startups with 25+ employees

**Month 3 — Convert & Retain (Target: 50–100 companies)**
- Case studies from early adopters
- Launch paid tiers with AI + Web3 features
- G2 / Capterra listing
- Bundle partnership with payroll/CA firms

---

### ₹5,000 Experimental Marketing Budget

| Channel | Spend | Expected Outcome |
|---|---|---|
| LinkedIn Sponsored (HR Managers, Founders) | ₹2,000 | 5,000 impressions, ~50 clicks |
| ProductHunt Launch boost | ₹1,500 | Community visibility |
| HR community WhatsApp (Canva whitepapers) | ₹500 | 10 community groups |
| Cold email tool (free tier) + domain warm-up | ₹500 | 500 targeted emails |
| Twitter/X promoted post (startup ecosystem) | ₹500 | Startup reach |

---

### Revenue Streams

**Stream 1 — SaaS Subscription**

| Plan | Price | Limit | Features |
|---|---|---|---|
| Free | ₹0 | 10 employees | Basic task tracking, dashboard |
| Starter | ₹2,999/mo | 50 employees | AI scoring, department analytics |
| Growth | ₹7,999/mo | 200 employees | Full AI suite, Web3 audit logs, smart assign |
| Enterprise | Custom | Unlimited | SSO, dedicated support, custom integrations |

**Stream 2 — AI Insights Add-On**
- Skill gap reports: ₹499/report or ₹1,999/month unlimited
- Performance prediction alerts: ₹999/month
- Smart task optimization: included in Growth+

**Stream 3 (Future) — Web3 Payroll Verification**
- On-chain salary disbursement proofs for remote/global teams
- ₹99/employee/month for verifiable payroll audit trail
- Especially high value for Web3-native companies and cross-border remote teams

---

## Evaluation Rubric Mapping

| Rubric Category | Weight | How This Project Addresses It |
|---|---|---|
| **HRMS System Design Thinking** | 25% | Multi-tenant architecture, event sourcing, modular backend, RLS |
| **Backend + Data Architecture** | 25% | PostgreSQL with RLS, indexed queries, EventBus, WebSocket server, migration-based schema |
| **AI Integration** | 20% | Multi-signal scoring engine, skill gap detection, smart assign, trend prediction — all with explainable logic |
| **Web3 Integration** | 10% | WorkforceLogger.sol on Polygon Mumbai, MetaMask connect, tx_hash stored and displayed |
| **UI/UX** | 10% | Kanban board, AI score gauges, skill radar chart, real-time dashboard updates |
| **Documentation & Demo** | 10% | This README + 15-20 min demo video covering all modules |

---

## Demo Video

**[Watch the 15-20 min demo walkthrough here](YOUR_VIDEO_URL)**

**Video covers:**
1. Introduction & architecture overview
2. Org registration and employee management
3. Task assignment
4. AI scoring engine demonstration
5. Skill gap detection and smart assign
6. Web3 wallet connection and on-chain logging
7. Real-time WebSocket dashboard updates
8. Scalability thinking discussion
9. GTM & monetization strategy

---

## Author

**Monisha Kanugula**
- GitHub: [@Monisha2107-wq](https://github.com/Monisha2107-wq)
- LinkedIn: [Monisha Kanugula](https://www.linkedin.com/in/monisha-kanugula-software-developer/)
- Email: monishakanugula@gmail.com

---

*Built with ❤️ for the RizeOS Founder Engineer Internship Assessment*
