import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  const owner = await prisma.user.upsert({
    where: { id: "system-agent" },
    update: {},
    create: { id: "system-agent", name: "System Agent", email: "system@clawqa.ai", role: "agent-owner" },
  });

  // Project: Clawdet
  const clawdet = await prisma.project.upsert({
    where: { slug: "clawdet" },
    update: {},
    create: {
      name: "Clawdet", slug: "clawdet",
      description: "AI assistant Telegram bot with web dashboard",
      targetUrl: "https://clawdet.com", repoUrl: "", ownerId: owner.id,
    },
  });

  await prisma.testCycle.upsert({
    where: { id: "cycle-clawdet-telegram" }, update: {},
    create: {
      id: "cycle-clawdet-telegram", projectId: clawdet.id,
      title: "Telegram Bot — Basic Commands", targetUrl: "https://clawdet.com", priority: "high",
      stepsJson: JSON.stringify([
        "Open Telegram and search for @Clawdet2bot",
        "Send /start — verify welcome message with bot description appears",
        "Send a natural language question like 'What is the weather in Tel Aviv?' — verify response within 10 seconds",
        "Send /help — verify help text lists available commands",
        "Send an image — verify bot acknowledges or processes it correctly"
      ]),
      deviceReqs: JSON.stringify([{"os":"iOS","app":"Telegram"},{"os":"Android","app":"Telegram"}]),
    },
  });

  await prisma.testCycle.upsert({
    where: { id: "cycle-clawdet-landing" }, update: {},
    create: {
      id: "cycle-clawdet-landing", projectId: clawdet.id,
      title: "Landing Page — Cross-browser", targetUrl: "https://clawdet.com", priority: "normal",
      stepsJson: JSON.stringify([
        "Navigate to https://clawdet.com in Chrome desktop",
        "Verify page loads with logo, tagline, and hero section",
        "Resize browser to mobile width (375px) — verify responsive layout",
        "Click all CTA buttons — verify they navigate correctly",
        "Open browser console — verify no JavaScript errors"
      ]),
      deviceReqs: JSON.stringify([{"os":"iOS","browser":"Safari"},{"os":"Windows","browser":"Chrome"},{"os":"Android","browser":"Chrome"}]),
    },
  });

  await prisma.testCycle.upsert({
    where: { id: "cycle-clawdet-mobile" }, update: {},
    create: {
      id: "cycle-clawdet-mobile", projectId: clawdet.id,
      title: "Coming Soon Page — Mobile Responsive", targetUrl: "https://clawdet.com", priority: "normal",
      stepsJson: JSON.stringify([
        "Open https://clawdet.com on a real mobile device (not emulator)",
        "Verify the coming soon / landing page renders without horizontal scroll",
        "Tap any interactive elements — verify touch targets are at least 44px"
      ]),
      deviceReqs: JSON.stringify([{"os":"iOS","browser":"Safari"},{"os":"Android","browser":"Chrome"}]),
    },
  });

  // Project: ClawQA
  const clawqa = await prisma.project.upsert({
    where: { slug: "clawqa" }, update: {},
    create: {
      name: "ClawQA", slug: "clawqa",
      description: "API-first human QA platform for AI coding agents",
      targetUrl: "https://clawqa.ai", repoUrl: "", ownerId: owner.id,
    },
  });

  await prisma.testCycle.upsert({
    where: { id: "cycle-clawqa-oauth" }, update: {},
    create: {
      id: "cycle-clawqa-oauth", projectId: clawqa.id,
      title: "GitHub OAuth Login Flow", targetUrl: "https://clawqa.ai", priority: "critical",
      stepsJson: JSON.stringify([
        "Navigate to https://clawqa.ai",
        "Click 'Sign in with GitHub' button",
        "Authorize the ClawQA app on GitHub's consent screen",
        "Verify redirect back to /dashboard with user info loaded",
        "Check profile shows your GitHub username and avatar",
        "Click logout — verify session ends and redirects to login"
      ]),
      deviceReqs: JSON.stringify([{"os":"any","browser":"Chrome"},{"os":"any","browser":"Safari"}]),
    },
  });

  await prisma.testCycle.upsert({
    where: { id: "cycle-clawqa-docs" }, update: {},
    create: {
      id: "cycle-clawqa-docs", projectId: clawqa.id,
      title: "Documentation Hub — All Pages", targetUrl: "https://clawqa.ai/docs/", priority: "high",
      stepsJson: JSON.stringify([
        "Navigate to https://clawqa.ai/docs/",
        "Verify hub page loads with card links to all documentation sections",
        "Click Overview link — verify content loads with introduction text",
        "Click Architecture link — verify system diagrams render",
        "Click Phases link — verify roadmap timeline loads",
        "Click For Testers — verify tester guide loads with signup instructions",
        "Click For Agents — verify API documentation loads with code examples",
        "Navigate between pages using sidebar/nav links — verify no broken links"
      ]),
      deviceReqs: JSON.stringify([{"os":"any","browser":"Chrome"},{"os":"iOS","browser":"Safari"}]),
    },
  });

  await prisma.testCycle.upsert({
    where: { id: "cycle-clawqa-apikeys" }, update: {},
    create: {
      id: "cycle-clawqa-apikeys", projectId: clawqa.id,
      title: "API Key Generation & Usage", targetUrl: "https://clawqa.ai", priority: "high",
      stepsJson: JSON.stringify([
        "Log in via GitHub OAuth",
        "Navigate to Dashboard → API Keys page",
        "Click 'Generate New Key' button",
        "Verify key is displayed once with clq_live_ prefix — copy it",
        "Test the key: curl -H 'Authorization: Bearer <key>' https://clawqa.ai/api/me — verify 200 response",
        "Revoke the key — verify subsequent API calls return 401"
      ]),
      deviceReqs: JSON.stringify([{"os":"any","browser":"Chrome"}]),
    },
  });

  await prisma.testCycle.upsert({
    where: { id: "cycle-clawqa-dashboard" }, update: {},
    create: {
      id: "cycle-clawqa-dashboard", projectId: clawqa.id,
      title: "Dashboard — Role Selection", targetUrl: "https://clawqa.ai", priority: "normal",
      stepsJson: JSON.stringify([
        "Log in via GitHub OAuth",
        "If first login, verify role selection screen appears",
        "Select 'Agent Owner' role",
        "Verify dashboard shows agent-owner view with projects and API keys section",
        "Go to Settings, verify GitHub profile info is displayed correctly",
        "Switch role to 'Tester' — verify dashboard view updates accordingly"
      ]),
      deviceReqs: JSON.stringify([{"os":"any","browser":"Chrome"}]),
    },
  });

  console.log("Seeded successfully: 2 projects, 7 test cycles");
}

main().catch(console.error).finally(() => prisma.$disconnect());
