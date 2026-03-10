# Changelog — ClawQA.AI

All notable changes to this project will be documented in this file.
Format based on [Keep a Changelog](https://keepachangelog.com/).

---

## [1.2.0] — 2026-02-20

### Added
- 21 eToro platform test cases uploaded to Applause crowdtesting
- Test suite "eToro Platform - Full QA Suite" (Applause ID: 9613)
- Detailed test steps for Registration, Login+2FA, Portfolio, CopyTrader, Trade Execution
- Test cases for: Deposit, Withdrawal, Smart Portfolios, Social Feed, Crypto Trading, Mobile App, Virtual Portfolio, Notifications, Search, Charts, Close Positions, Risk Score, News, Settings, Leverage/CFD
- Active Applause test cycle 536247 with full eToro scope
- Applause skill documentation (60+ API endpoints)

### Changed
- Updated Applause cycle 536247 with comprehensive eToro testing scope and instructions

---

## [1.1.0] — 2026-02-19

### Added
- Applause SDK integration (real API at prod-auto-api.cloud.applause.com)
- Applause community API integration (api.applause.com/v2)
- Settings page with Applause configuration and "Test Connection" button
- Interactive docs rebuilt with pure CSS/SVG animations (zero Mermaid.js)
- 6 documentation pages: Overview, Architecture, API Reference, MCP, Auto-Fix, Escalation
- Password login (demo: ClawQA26) for Applause reviewers
- 15 seeded test plans
- GitHub repository (yoniassia/clawqa, public)
- MCP server with JSON-RPC 2.0 (protocol 2024-11-05, 6 tools)
- Rate limiting (100 req/min per API key)
- 27 E2E Playwright tests

### Changed
- Migrated from guessed Applause API to real SDK client
- All docs diagrams converted from Mermaid.js to animated SVG

---

## [1.0.0] — 2026-02-18

### Added
- All 13 phases complete:
  - Phase 1: Authentication (GitHub OAuth via NextAuth v5)
  - Phase 2: REST API (test-cycles CRUD, bugs CRUD, fix submissions)
  - Phase 3: Dashboard (project pages, 7 real test cycles seeded)
  - Phase 4: API key authentication (SHA-256 hashed clq_live_* keys)
  - Phase 5: Webhook system with delivery tracking
  - Phase 6: Applause webhook receiver
  - Phase 7: Auto-fix loop (AI agent submits fixes)
  - Phase 8: Escalation rules engine
  - Phase 9: MCP server
  - Phase 10: Developer portal
  - Phase 11: Analytics dashboard
  - Phase 12: Multi-agent support with agent assignments
  - Phase 13: GitHub PR integration
- 18 Prisma models (SQLite)
- 58 unit tests (Vitest)
- Homepage with hero, features, pricing tiers
- Next.js 16.1.6 + NextAuth v5 beta 30 + Prisma 6.19.2

### Technical
- Stack: Next.js, NextAuth, Prisma, SQLite, Vitest, Playwright
- Auth: GitHub OAuth + Credentials provider
- API: RESTful with API key auth
- Pricing: Starter $25/test, Pro $15/test, Scale $10/test
