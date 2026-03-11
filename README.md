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

## ✨ Features

- **Dashboard** — Real-time view of test cycles, bug status, and resolution progress
- **Test Cycle Management** — Create, monitor, and close test cycles programmatically
- **Applause Integration** — Direct integration with Applause (uTest) for professional crowd-testing
- **Bug Tracking** — Structured bug reports with severity, steps to reproduce, and screenshots
- **Self-Test Generation** — Auto-generated test documents at `/selfTest.html`
- **GitHub OAuth** — Secure authentication via NextAuth
- **API-First Design** — Every action available via REST API for AI agent consumption

---

## 🏗️ Architecture

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router) |
| Auth | NextAuth.js (GitHub OAuth) |
| ORM | Prisma |
| Database | SQLite |
| QA Platform | Applause (Company 1193 / Product 37174) |
| Hosting | Hetzner VPS (Ubuntu) |
| Process Manager | PM2 |
| CI/CD | GitHub Actions → SSH deploy |

---

## 🚀 Getting Started

### Prerequisites

- Node.js 22+
- npm or pnpm

### Installation

```bash
git clone https://github.com/yoniassia/clawqa.git
cd clawqa
npm install
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
DATABASE_URL=file:./dev.db

# Applause
APPLAUSE_API_KEY=your-applause-api-key
APPLAUSE_COMPANY_ID=1193
APPLAUSE_PRODUCT_ID=37174
```

### Database

```bash
npx prisma generate
npx prisma db push
```

### Run

```bash
npm run dev        # Development (http://localhost:3000)
npm run build      # Production build
npm start          # Production server
```

---

## 📡 API Overview

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/test-cycles` | GET | List all test cycles |
| `/api/test-cycles` | POST | Create a new test cycle |
| `/api/test-cycles/[id]` | GET | Get cycle details + bugs |
| `/api/bugs` | GET | List bugs (filterable) |
| `/api/bugs/[id]` | PATCH | Update bug status |
| `/api/self-test` | POST | Generate self-test document |
| `/api/health` | GET | Health check |

---

## 🔄 CI/CD

Automated deployment via GitHub Actions:

- **Trigger:** Push to `main`
- **Pipeline:** Build → SSH to server → Pull → Install → Build → PM2 restart
- **Server:** `135.181.43.68` (White Rabbit)
- **Deploy path:** `/var/www/clawqa-nextjs`

Secrets configured: `DEPLOY_SSH_KEY`, `DEPLOY_HOST`, `DEPLOY_USER`, `DEPLOY_PATH`

---

## 📸 Screenshots

_Coming soon_

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
