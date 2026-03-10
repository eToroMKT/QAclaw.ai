# Testing & Code Quality Tools — ClawQA

## The PR Workflow

```
Developer pushes code
        ↓
┌─── GitHub Actions CI ───┐
│  npm test (unit tests)   │
│  npm run build           │
│  coverage report → Codecov│
│  SonarCloud scan          │
└──────────┬───────────────┘
           ↓
┌─── CodeRabbit AI ───────┐
│  AI reviews every PR     │
│  Finds bugs, security,   │
│  performance issues       │
│  Suggests improvements    │
└──────────┬───────────────┘
           ↓
┌─── Codecov ─────────────┐
│  Coverage report in PR   │
│  Target: 60% project     │
│  Target: 70% new code    │
│  Blocks if drops below   │
└──────────┬───────────────┘
           ↓
┌─── SonarCloud ──────────┐
│  Static analysis         │
│  Code smells, bugs       │
│  Security hotspots       │
│  Duplication detection   │
└──────────┬───────────────┘
           ↓
┌─── Dependabot ──────────┐
│  Weekly dependency scan  │
│  Auto-PRs for vulns     │
│  npm ecosystem           │
└──────────────────────────┘
           ↓
      Merge to main
```

## Tool Details

### 1. CodeRabbit (AI Code Review)
- **What:** AI-powered code reviewer that comments on every PR
- **Trigger:** Automatic on every PR
- **Config:** `.coderabbit.yaml`
- **Cost:** Free (public repo)
- **Install:** https://github.com/apps/coderabbitai → Select repo
- **Status:** ⏳ Needs manual GitHub App install

### 2. Codecov (Coverage Tracking)
- **What:** Tracks test coverage, reports in PRs, blocks if coverage drops
- **Trigger:** After CI runs tests with `--coverage`
- **Config:** `codecov.yml`
- **Cost:** Free (public repo)
- **Install:** https://github.com/apps/codecov → Select repo
- **Status:** ⏳ Needs manual GitHub App install

### 3. SonarCloud (Static Analysis)
- **What:** Deep code analysis — bugs, code smells, security vulnerabilities, duplication
- **Trigger:** On every push via GitHub Actions
- **Config:** `sonar-project.properties`
- **Cost:** Free (public repo)
- **Install:** https://sonarcloud.io → Import repo
- **Status:** ⏳ Needs manual setup + SONAR_TOKEN secret

### 4. Dependabot (Dependency Security)
- **What:** Scans npm dependencies for known vulnerabilities, creates auto-fix PRs
- **Trigger:** Weekly scan (configurable)
- **Config:** `.github/dependabot.yml`
- **Cost:** Free (built into GitHub)
- **Status:** ✅ Active

### 5. GitHub Actions CI
- **What:** Runs tests, build, coverage on every push/PR
- **Trigger:** Push to main, any PR
- **Config:** `.github/workflows/ci.yml`
- **Cost:** Free (2000 min/month for public repos)
- **Status:** ⏳ File ready on disk, needs PAT with `workflow` scope to push

## Setup Checklist

- [x] Dependabot config pushed
- [x] SonarCloud properties pushed
- [x] CodeRabbit config created
- [x] Codecov config created
- [x] Vitest coverage configured
- [x] CI workflow file ready
- [ ] Install CodeRabbit GitHub App
- [ ] Install Codecov GitHub App
- [ ] Connect SonarCloud + add SONAR_TOKEN
- [ ] Update GitHub PAT with `workflow` scope
- [ ] Push CI workflow to GitHub
