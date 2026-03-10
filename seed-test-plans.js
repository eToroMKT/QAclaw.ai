// Seed ClawQA + Clawdet test plans into the platform via API
const BASE = 'https://clawqa.ai/api/v1';

// We need an API key — create one first or use existing
// For now, seed directly via Prisma since we have server access

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const testPlans = [
  // ========== ClawQA Test Plans ==========
  {
    project: 'clawqa',
    title: 'Authentication & Onboarding',
    description: 'GitHub OAuth login flow, session management, access protection',
    priority: 'critical',
    targetUrl: 'https://clawqa.ai',
    deviceReqs: ['Desktop Chrome', 'Desktop Firefox', 'Desktop Safari', 'iOS Safari', 'Android Chrome'],
    steps: [
      { title: 'GitHub OAuth Login (Happy Path)', description: '1. Navigate to https://clawqa.ai\n2. Click "Sign in with GitHub" button\n3. On GitHub authorization page, click "Authorize"\n4. Wait for redirect back to ClawQA', expectedResult: 'User lands on /dashboard with their GitHub avatar and name in the top bar. No error messages.' },
      { title: 'GitHub OAuth Login (Deny Access)', description: '1. Navigate to https://clawqa.ai\n2. Click "Sign in with GitHub"\n3. On GitHub page, click "Cancel" or deny authorization', expectedResult: 'User is redirected back to /login with a clear error message. No crash, no blank page.' },
      { title: 'Session Persistence', description: '1. Log in via GitHub OAuth\n2. Close the browser tab completely\n3. Open a new tab, navigate to https://clawqa.ai/dashboard', expectedResult: 'User is still logged in — dashboard loads without requiring re-authentication.' },
      { title: 'Logout', description: '1. Log in via GitHub OAuth\n2. Click user avatar/menu in top bar\n3. Click "Sign out"\n4. Try navigating to /dashboard directly', expectedResult: 'User is logged out, redirected to /login. /dashboard is not accessible.' },
      { title: 'Unauthenticated Access Protection', description: '1. Open a private/incognito browser window\n2. Navigate directly to https://clawqa.ai/dashboard\n3. Try https://clawqa.ai/settings\n4. Try https://clawqa.ai/dashboard/analytics', expectedResult: 'All protected pages redirect to /login (HTTP 307). No dashboard content is visible.' }
    ]
  },
  {
    project: 'clawqa',
    title: 'Dashboard & Navigation',
    description: 'Dashboard load, sidebar nav, mobile responsive, project cards',
    priority: 'high',
    targetUrl: 'https://clawqa.ai/dashboard',
    deviceReqs: ['Desktop Chrome', 'Desktop Firefox', 'iPad Safari', 'iPhone Safari', 'Pixel Chrome'],
    steps: [
      { title: 'Dashboard Load', description: '1. Log in to ClawQA\n2. Navigate to /dashboard', expectedResult: 'Dashboard shows project cards with cycle counts and bug counts. Loading state appears briefly, then content renders. No layout shifts.' },
      { title: 'Sidebar Navigation', description: '1. From the dashboard, click each sidebar link in order: Dashboard, Test Cycles, Bug Reports, Analytics, Test Plans, Webhooks, API Keys, Settings\n2. For each, verify the page loads', expectedResult: 'Every sidebar link navigates to the correct page. Active link is visually highlighted. No 404s or blank pages.' },
      { title: 'Mobile Responsive Layout', description: '1. Open https://clawqa.ai/dashboard on a mobile phone\n2. Check if sidebar collapses into a hamburger menu\n3. Tap the hamburger to open nav\n4. Navigate to Test Cycles, then back to Dashboard', expectedResult: 'Sidebar collapses on mobile. Hamburger menu opens/closes smoothly. All pages render without horizontal scroll. Text is readable without zooming.' },
      { title: 'Project Cards', description: '1. From the dashboard, find the project cards (Clawdet, ClawQA)\n2. Click on a project card', expectedResult: 'Navigates to /projects/[slug] with project details, test cycles list, and bug summary.' }
    ]
  },
  {
    project: 'clawqa',
    title: 'Test Cycles (Core Feature)',
    description: 'CRUD test cycles, API creation, Applause escalation',
    priority: 'critical',
    targetUrl: 'https://clawqa.ai/dashboard/test-cycles',
    deviceReqs: ['Desktop Chrome', 'Desktop Firefox', 'Desktop Safari'],
    steps: [
      { title: 'View Test Cycles List', description: '1. Navigate to /dashboard/test-cycles\n2. Check the list of test cycles', expectedResult: 'Shows all test cycles with title, project name, status badge (open/in_progress/completed), creation date, and bug count.' },
      { title: 'View Test Cycle Detail', description: '1. Navigate to /dashboard/test-cycles\n2. Click on any test cycle', expectedResult: 'Shows cycle title, status, target URL, all test steps with expandable details, linked bugs, and "Escalate to Applause" button.' },
      { title: 'Create Test Cycle via API', description: '1. Go to /api-keys and create a new API key\n2. Send POST https://clawqa.ai/api/v1/test-cycles with Authorization header and JSON body containing projectId, title, targetUrl, steps array\n3. Refresh /dashboard/test-cycles', expectedResult: 'API returns 201 with cycle ID. New cycle appears in the dashboard list.' },
      { title: 'Escalate to Applause', description: '1. Navigate to a test cycle detail page\n2. Click "Escalate to Applause" button', expectedResult: 'If Applause configured: success message with run ID. If not: graceful 503 explaining credentials needed. No crash.' }
    ]
  },
  {
    project: 'clawqa',
    title: 'Bug Reports',
    description: 'View, create, and fix bugs via API',
    priority: 'high',
    targetUrl: 'https://clawqa.ai/dashboard/bugs',
    deviceReqs: ['Desktop Chrome', 'Desktop Firefox'],
    steps: [
      { title: 'View Bug Reports', description: '1. Navigate to /dashboard/bugs', expectedResult: 'Shows bug report list with title, severity badge (critical/major/minor), status, project name, creation date. Filterable by severity and status.' },
      { title: 'Create Bug via API', description: '1. Using your API key, send POST https://clawqa.ai/api/v1/bugs with JSON body containing cycleId, title, severity, stepsToReproduce, expectedResult, actualResult', expectedResult: 'Returns 201 with bug ID. Bug appears in /dashboard/bugs and on the cycle detail page.' },
      { title: 'Submit Fix for Bug', description: '1. Using your API key, send POST https://clawqa.ai/api/v1/bugs/<bugId>/fix with commitUrl, deployUrl, notes', expectedResult: 'Returns 200. Bug status changes to "re_testing". Fix attempt appears in bug detail.' }
    ]
  },
  {
    project: 'clawqa',
    title: 'API Keys & Settings',
    description: 'API key lifecycle and Applause configuration',
    priority: 'high',
    targetUrl: 'https://clawqa.ai/api-keys',
    deviceReqs: ['Desktop Chrome'],
    steps: [
      { title: 'Generate API Key', description: '1. Navigate to /api-keys\n2. Click "Create API Key"\n3. Enter a name\n4. Click Generate', expectedResult: 'New API key displayed with prefix clq_live_. Key shown only once with copy button. Warning to save it.' },
      { title: 'Revoke API Key', description: '1. Navigate to /api-keys\n2. Find an existing key\n3. Click "Revoke"\n4. Try using the revoked key in an API call', expectedResult: 'Key shows as revoked in list. API calls with revoked key return 401 Unauthorized.' },
      { title: 'Applause Configuration', description: '1. Navigate to /settings\n2. Check Applause fields (API Key, Product ID, URLs)\n3. Click "Test Connection" without credentials', expectedResult: 'Shows 4 input fields. Test Connection shows "Not configured" or status. No crash on empty fields.' }
    ]
  },
  {
    project: 'clawqa',
    title: 'Developer Portal & MCP Server',
    description: 'Public API docs and MCP protocol testing',
    priority: 'medium',
    targetUrl: 'https://clawqa.ai/developers',
    deviceReqs: ['Desktop Chrome', 'Desktop Firefox', 'iOS Safari'],
    steps: [
      { title: 'Developer Portal Page', description: '1. Navigate to https://clawqa.ai/developers (no login required)\n2. Scroll through the entire page', expectedResult: 'Shows full API documentation with endpoints, request/response examples, authentication guide, webhook reference. Properly formatted.' },
      { title: 'MCP Server Initialize', description: '1. Send POST to https://clawqa.ai/api/mcp with JSON-RPC: {"jsonrpc":"2.0","id":1,"method":"initialize","params":{}}', expectedResult: 'Returns JSON-RPC response with server info, protocol version "2024-11-05", and tool capabilities.' },
      { title: 'MCP Tools List', description: '1. Send POST to https://clawqa.ai/api/mcp with: {"jsonrpc":"2.0","id":2,"method":"tools/list","params":{}}', expectedResult: 'Returns list of 6 tools: list_projects, list_cycles, create_cycle, get_bugs, submit_fix, escalate. Each with schema.' }
    ]
  },
  {
    project: 'clawqa',
    title: 'Analytics & Webhooks',
    description: 'Analytics dashboard, webhook management and delivery',
    priority: 'medium',
    targetUrl: 'https://clawqa.ai/dashboard/analytics',
    deviceReqs: ['Desktop Chrome'],
    steps: [
      { title: 'Analytics Dashboard', description: '1. Navigate to /dashboard/analytics', expectedResult: 'Shows summary cards (total bugs, open bugs, fix rate, avg time to fix), severity distribution, bugs over time, per-project breakdown.' },
      { title: 'Analytics API', description: '1. Send GET https://clawqa.ai/api/v1/analytics', expectedResult: 'Returns JSON with totalBugs, openBugs, fixedBugs, bugsBySeverity, bugsPerProject, fixSuccessRate, avgTimeToFix.' },
      { title: 'Register Webhook', description: '1. Using API key, send POST https://clawqa.ai/api/v1/webhooks with url and events array', expectedResult: 'Returns 201 with webhook ID, auto-generated secret, and active=true.' },
      { title: 'Test Webhook Delivery', description: '1. Send POST https://clawqa.ai/api/v1/webhooks/test with webhook ID', expectedResult: 'Sends test ping to registered URL. Returns delivery status.' },
      { title: 'Webhook Delivery Logs', description: '1. Navigate to /dashboard/webhooks\n2. Check delivery history', expectedResult: 'Shows registered webhooks with success rate, last delivery time, and expandable delivery log.' }
    ]
  },
  {
    project: 'clawqa',
    title: 'Cross-Browser & Performance',
    description: 'Visual rendering, interactive elements, page load speed',
    priority: 'medium',
    targetUrl: 'https://clawqa.ai',
    deviceReqs: ['Desktop Chrome', 'Desktop Firefox', 'Desktop Safari', 'Desktop Edge', 'iOS Safari', 'Android Chrome', 'iPad Safari'],
    steps: [
      { title: 'Homepage Cross-Browser', description: '1. Navigate to https://clawqa.ai on assigned browser\n2. Check visual rendering: hero section, nav bar, project cards, docs grid\n3. Click "Sign in with GitHub" — verify button is clickable', expectedResult: 'Layout renders correctly. No overlapping elements. Glassmorphism effects visible. All interactive elements clickable. Text readable.' },
      { title: 'Docs Pages Cross-Browser', description: '1. Navigate to https://clawqa.ai/docs/\n2. Visit each doc page (Overview, Architecture, For PMs, For Agents, Roadmap)\n3. Check animated diagrams render\n4. Test interactive elements (clickable nodes, tabs)', expectedResult: 'All pages load. SVG diagrams render and animate. Interactive elements work. Scroll animations trigger. No broken layouts.' },
      { title: 'Page Load Performance', description: '1. Open DevTools → Network tab\n2. Navigate to https://clawqa.ai (hard refresh)\n3. Note total load time and largest contentful paint', expectedResult: 'Page loads under 3 seconds on broadband. No blocking resources. LCP under 2.5s.' }
    ]
  },

  // ========== Clawdet Test Plans ==========
  {
    project: 'clawdet',
    title: 'Landing Page',
    description: 'Landing page load, responsive, SEO, performance',
    priority: 'high',
    targetUrl: 'https://clawdet.com',
    deviceReqs: ['Desktop Chrome', 'Desktop Firefox', 'Desktop Safari', 'iOS Safari', 'Android Chrome', 'iPad Safari'],
    steps: [
      { title: 'Landing Page Load', description: '1. Navigate to https://clawdet.com\n2. Wait for page to fully load', expectedResult: 'Page loads with Clawdet branding and link to Telegram bot. No console errors. SSL valid.' },
      { title: 'Mobile Responsive', description: '1. Open https://clawdet.com on mobile\n2. Check text is readable without horizontal scroll\n3. Check all buttons/links tappable (44x44px min)\n4. Rotate to landscape and back', expectedResult: 'Layout adapts to mobile. No horizontal overflow. All elements tappable. Rotation doesn\'t break layout.' },
      { title: 'Telegram Bot Link', description: '1. Find the Telegram bot link on landing page\n2. Click/tap the link', expectedResult: 'Opens Telegram with @Clawdet2bot chat. If Telegram not installed, opens t.me/Clawdet2bot in browser.' },
      { title: 'SEO & Meta Tags', description: '1. View page source of https://clawdet.com\n2. Check for: title, meta description, og:title, og:description, og:image', expectedResult: 'All meta tags present. Title contains "Clawdet". Description is relevant.' },
      { title: 'Page Speed', description: '1. Open DevTools → Lighthouse\n2. Run performance audit', expectedResult: 'Performance score ≥ 80. FCP < 2s. No render-blocking resources.' }
    ]
  },
  {
    project: 'clawdet',
    title: 'Telegram Bot — First Interaction',
    description: 'Start command, help, profile, error handling',
    priority: 'critical',
    targetUrl: 'https://t.me/Clawdet2bot',
    deviceReqs: ['iOS Telegram', 'Android Telegram', 'Telegram Desktop', 'Telegram Web'],
    steps: [
      { title: 'Bot Start Command', description: '1. Open Telegram\n2. Search for @Clawdet2bot\n3. Tap "Start" or type /start\n4. Wait for response', expectedResult: 'Bot responds with welcome message explaining what Clawdet does. Includes available commands. Response under 5 seconds.' },
      { title: 'Help Command', description: '1. In Clawdet bot chat, type /help\n2. Wait for response', expectedResult: 'Bot responds with list of available commands and descriptions. Well formatted, readable.' },
      { title: 'Bot Profile', description: '1. Open bot profile page in Telegram\n2. Check: name, username, picture, description', expectedResult: 'Bot has profile picture (not default). Description explains what Clawdet does. Username is @Clawdet2bot.' },
      { title: 'Invalid Command', description: '1. Type "asdfghjkl" and send\n2. Type /nonexistentcommand and send', expectedResult: 'Bot responds gracefully — helpful "try /help" message or ignores. No errors or crashes.' }
    ]
  },
  {
    project: 'clawdet',
    title: 'Telegram Bot — Core Features',
    description: 'Text interaction, long messages, rapid fire, emoji, memory',
    priority: 'critical',
    targetUrl: 'https://t.me/Clawdet2bot',
    deviceReqs: ['iOS Telegram', 'Android Telegram'],
    steps: [
      { title: 'Text Message Interaction', description: '1. Send a normal text message: "Hello, how are you?"\n2. Wait for response', expectedResult: 'Bot responds with AI-generated response. Relevant and coherent. Under 10 seconds.' },
      { title: 'Long Message Handling', description: '1. Send a very long message (500+ characters)\n2. Wait for response', expectedResult: 'Bot processes full message and responds. No truncation errors. Response is relevant.' },
      { title: 'Rapid Messages', description: '1. Send 5 messages in quick succession (within 3 seconds)\n2. Wait for all responses', expectedResult: 'Bot responds to each message. No duplicates. No dropped messages. If rate-limited, friendly message.' },
      { title: 'Emoji & Special Characters', description: '1. Send "🚀 What\'s up? 🦞"\n2. Send "Hello! @#$% ^&*()"\n3. Send "こんにちは"', expectedResult: 'Bot handles all character types. Responds appropriately. No encoding issues.' },
      { title: 'Conversation Memory', description: '1. Send "My name is TestUser123"\n2. Wait for response\n3. Send "What\'s my name?"', expectedResult: 'Bot remembers context and correctly recalls "TestUser123".' }
    ]
  },
  {
    project: 'clawdet',
    title: 'Telegram Bot — Media Handling',
    description: 'Image, voice, document, sticker handling',
    priority: 'medium',
    targetUrl: 'https://t.me/Clawdet2bot',
    deviceReqs: ['iOS Telegram', 'Android Telegram'],
    steps: [
      { title: 'Image Sent to Bot', description: '1. Send a photo to the bot\n2. Wait for response', expectedResult: 'Bot acknowledges the image — analyzes it or explains limitation. No crash.' },
      { title: 'Voice Message', description: '1. Record and send a voice message\n2. Wait for response', expectedResult: 'Bot transcribes and responds, or explains limitation. No crash.' },
      { title: 'Document/File', description: '1. Send a PDF or text file\n2. Wait for response', expectedResult: 'Bot acknowledges file — processes or explains limitations. No silent failure.' },
      { title: 'Sticker', description: '1. Send a sticker to the bot\n2. Wait for response', expectedResult: 'Bot responds gracefully. No error.' }
    ]
  },
  {
    project: 'clawdet',
    title: 'Telegram Bot — Edge Cases',
    description: 'Recovery, short input, forwarded messages, groups, concurrency',
    priority: 'high',
    targetUrl: 'https://t.me/Clawdet2bot',
    deviceReqs: ['iOS Telegram', 'Android Telegram', 'Telegram Desktop'],
    steps: [
      { title: 'Bot Recovery After Idle', description: '1. Send a message, confirm bot works\n2. Wait 10 minutes\n3. Send another message', expectedResult: 'Bot responds normally after idle. No "offline" errors. Session continuity maintained.' },
      { title: 'Very Short Input', description: '1. Send just "a"\n2. Send just "."', expectedResult: 'Bot handles gracefully — responds or asks for more context. No error.' },
      { title: 'Forwarded Message', description: '1. Forward a message from another chat to the bot\n2. Wait for response', expectedResult: 'Bot processes forwarded message and responds. No crash.' },
      { title: 'Group Chat Add', description: '1. Create a new Telegram group\n2. Add @Clawdet2bot\n3. Send "@Clawdet2bot hello"', expectedResult: 'Bot responds in group or has clear policy. No unexpected behavior.' },
      { title: 'Concurrent Users', description: '1. Have 3 Telegram accounts message bot simultaneously\n2. Each sends unique message\n3. Check all get responses', expectedResult: 'Each user gets correct response. No cross-contamination. All within 15 seconds.' }
    ]
  },
  {
    project: 'clawdet',
    title: 'Telegram Bot — Cross-Platform',
    description: 'Multi-device sync and command menu',
    priority: 'medium',
    targetUrl: 'https://t.me/Clawdet2bot',
    deviceReqs: ['iOS Telegram', 'Android Telegram', 'Telegram Desktop macOS', 'Telegram Desktop Windows', 'Telegram Web'],
    steps: [
      { title: 'Conversation Sync Across Platforms', description: '1. Start conversation on mobile\n2. Open same conversation on desktop\n3. Send message from desktop\n4. Check response on both', expectedResult: 'Conversation syncs. Responses appear on all devices. Formatting consistent.' },
      { title: 'Bot Commands Menu', description: '1. Open bot chat\n2. Tap menu button (/ icon)\n3. Check available commands', expectedResult: 'Commands appear in menu. Tapping sends command. Descriptions visible.' }
    ]
  },
  {
    project: 'clawdet',
    title: 'Accessibility',
    description: 'Screen reader and keyboard navigation on landing page',
    priority: 'medium',
    targetUrl: 'https://clawdet.com',
    deviceReqs: ['Desktop Chrome + screen reader', 'iOS VoiceOver', 'Android TalkBack'],
    steps: [
      { title: 'Screen Reader Navigation', description: '1. Navigate to https://clawdet.com with screen reader\n2. Tab through all interactive elements\n3. Check images have alt text\n4. Check heading hierarchy', expectedResult: 'All content accessible. Images have alt text. Headings properly nested. Links/buttons announced correctly.' },
      { title: 'Keyboard Navigation', description: '1. Navigate to https://clawdet.com\n2. Use only Tab to navigate all elements\n3. Press Enter to activate links/buttons', expectedResult: 'Tab order follows visual layout. Focus indicator visible. All elements reachable and activatable via keyboard.' }
    ]
  }
];

async function seed() {
  // Get project IDs
  const clawqa = await prisma.project.findUnique({ where: { slug: 'clawqa' } });
  const clawdet = await prisma.project.findUnique({ where: { slug: 'clawdet' } });

  if (!clawqa || !clawdet) {
    console.error('Projects not found! Available:');
    const all = await prisma.project.findMany();
    console.log(all.map(p => `${p.slug} (${p.id})`));
    process.exit(1);
  }

  const projectMap = {
    'clawqa': clawqa.id,
    'clawdet': clawdet.id
  };

  let created = 0;
  for (const plan of testPlans) {
    const projectId = projectMap[plan.project];
    if (!projectId) {
      console.warn(`Skipping ${plan.title} — project ${plan.project} not found`);
      continue;
    }

    // Create as TestCycle (ready to escalate to Applause)
    const cycle = await prisma.testCycle.create({
      data: {
        projectId,
        title: plan.title,
        description: plan.description,
        targetUrl: plan.targetUrl,
        priority: plan.priority,
        status: 'ready', // Ready to send to Applause
        stepsJson: JSON.stringify(plan.steps),
        deviceReqs: JSON.stringify(plan.deviceReqs)
      }
    });
    created++;
    console.log(`✅ Created: [${plan.project}] ${plan.title} (${plan.steps.length} steps) → ID: ${cycle.id}`);
  }

  console.log(`\n🎉 Seeded ${created} test cycles (${testPlans.reduce((a, p) => a + p.steps.length, 0)} total test steps)`);
  console.log('Status: "ready" — will escalate to Applause when API key is configured');
}

seed()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
