# 🧪 ClawQA — API-First Human QA for AI Agents

**ClawQA** is a platform that bridges AI-generated code with real human testers. AI agents write code, submit test definitions, and human testers validate — then structured bug reports flow back so AI can auto-fix.

🌐 **Live:** [clawqa.ai](https://clawqa.ai) · [Self-Test](https://clawqa.ai/selfTest.html)

---

## 🎯 Vision

Traditional QA doesn't work at AI speed. ClawQA closes the loop:

```
AI Agent writes code
       ↓
Submits app + test definition via API
       ↓
ClawQA dispatches to Applause human testers
       ↓
Bugs return as structured data
       ↓
AI Agent auto-fixes and resubmits
```

The result: **continuous human-validated quality at machine speed**.

---

## ✅ Live Routes (verified 2025-03-11)

| Route | Status | Description |
|-------|--------|-------------|
| `/` | ✅ 200 | Homepage |
| `/login` | ✅ 200 | GitHub OAuth login |
| `/developers` | ✅ 200 | Developer documentation |
| `/dashboard` | ✅ 307→login | Dashboard (auth required, redirects) |
| `/about` | ✅ 200 | About page |
| `/about.html` | ✅ 200 | About page (direct) |
| `/marketing` | ✅ 200 | Marketing page |
| `/marketing.html` | ✅ 200 | Marketing page (direct) |
| `/brand.html` | ✅ 200 | Brand assets |
| `/selfTest.html` | ✅ 200 | Self-test document |
| `/api/health` | ✅ 200 | Health check endpoint |

---

## ✨ Features

- **Dashboard** — Real-time view of test cycles, bug status, and resolution progress
- **Test Cycle Management** — Create, monitor, and close test cycles programmatically
- **Applause Integration** — Direct integration with Applause (uTest) for professional crowd-testing (Company 1193, Product 37174)
- **Bug Tracking** — Structured bug reports with severity, steps to reproduce, and screenshots
- **Self-Test Generation** — Auto-generated test documents at `/selfTest.html`
- **GitHub OAuth** — Secure authentication via NextAuth
- **API-First Design** — Every action available via REST API for AI agent consumption
- **Health Endpoint** — `/api/health` for monitoring and uptime checks

---

## 🏗️ Architecture

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router) |
| Auth | NextAuth.js (GitHub OAuth) |
| ORM | Prisma |
| Database | SQLite |
| QA Platform | Applause (Company 1193 / Product 37174 / Cycle 536247) |
| Hosting | Hetzner VPS (Ubuntu) |
| Process Manager | PM2 |
| CI/CD | GitHub Actions → SSH deploy |

---

## 🚀 Getting Started

### Prerequisites

- Node.js 22+
- npm

### Installation

```bash
git clone https://github.com/yoniassia/clawqa.git
cd clawqa
npm install
npx prisma generate
npx prisma db push
```

### Environment Setup

Create a `.env` file:

```env
# Auth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-here
GITHUB_ID=your-github-oauth-app-id
GITHUB_SECRET=your-github-oauth-app-secret

# Database
DATABASE_URL=file:./prisma/dev.db

# Applause
APPLAUSE_API_KEY=your-applause-api-key
APPLAUSE_COMPANY_ID=1193
APPLAUSE_PRODUCT_ID=37174
```

### Run

```bash
npm run dev        # Development (http://localhost:3000)
npm run build      # Production build
npm start          # Production server
```

---

## 📡 API Reference

### Public

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/health` | GET | Health check — returns `{ status: "ok" }` |

### Authenticated (v1)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/test-cycles` | GET | List all test cycles |
| `/api/v1/test-cycles` | POST | Create a new test cycle |
| `/api/v1/test-cycles/[id]` | GET | Get cycle details + bugs |
| `/api/v1/test-cycles/[id]/bugs` | GET | List bugs for a cycle |
| `/api/v1/bugs` | GET | List bugs (filterable) |
| `/api/v1/bugs/[id]/fix` | POST | Mark bug as fixed |
| `/api/v1/test-plans` | GET/POST | Test plan CRUD |
| `/api/v1/test-plans/[id]/execute` | POST | Execute a test plan |
| `/api/v1/webhooks` | GET/POST | Webhook management |
| `/api/v1/escalate` | POST | Escalate a bug |
| `/api/v1/applause/status` | GET | Applause integration status |
| `/api/v1/applause/results` | GET | Fetch Applause test results |
| `/api/v1/applause/webhook` | POST | Applause webhook receiver |

### Internal

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/test-cycles` | GET/POST | Dashboard test cycle management |
| `/api/test-cycles/claim` | POST | Claim a test cycle |
| `/api/bugs/session` | GET | Session-scoped bug list |
| `/api/me` | GET | Current user info |
| `/api/api-keys` | GET/POST | API key management |

---

## 🔄 CI/CD

Automated deployment via GitHub Actions:

- **Trigger:** Push to `main`
- **Pipeline:** Lint + Build + Test → DB layout guard → SSH to server → guarded deploy script → Install → Build → PM2 restart
- **Server:** `135.181.43.68` (White Rabbit)
- **Deploy path:** `/var/www/clawqa-nextjs`

---

## 🤖 For AI Agents

ClawQA is designed to be consumed by AI agents. Typical integration flow:

1. **Authenticate** via API key or GitHub OAuth
2. **Create a test cycle** with your app URL and test definition
3. **Poll for results** or receive webhook callbacks
4. **Parse structured bugs** — each includes severity, category, steps, and evidence
5. **Fix and resubmit** — close the loop

---

## 📄 License

MIT

---

Built with 🦞 by [YoniClaw](https://github.com/yoniassia) agents.
