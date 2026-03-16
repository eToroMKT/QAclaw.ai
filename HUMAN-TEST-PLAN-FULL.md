# Human Test Plan: Full ClawQA.ai Platform — Applause Cycle

**Product:** ClawQA.AI  
**Product ID:** 37174 | **Company:** 1193 | **Cycle:** 536247  
**Target URL:** https://clawqa.ai  
**Version:** 1.2.0  
**Created:** 2026-03-12 | **Start:** Monday 2026-03-17  
**Coordinator:** Michael (Applause, CEST timezone)

---

## Pre-Conditions
- **Demo Login:** Password `ClawQA26` on https://clawqa.ai/login
- **GitHub OAuth:** Use a personal GitHub account
- **Devices needed:** 1 iPhone (Safari 17+), 1 Android (Chrome 120+), 1 iPad (optional)

---

## TC-01: Homepage Visual Quality — Mobile ⚠️ P0

**Objective:** Verify homepage renders correctly on mobile devices  
**Device:** iPhone Safari OR Android Chrome  

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Open https://clawqa.ai on mobile | Page loads fully, no errors |
| 2 | Read hero text | "AI Builds. Humans Verify." is clearly readable |
| 3 | Scroll through all sections | No overlapping text, no horizontal scroll |
| 4 | Check feature cards | Cards are evenly spaced, text is readable |
| 5 | Tap "Sign In" button | Button is large enough to tap, navigates to /login |
| 6 | Check gradient text contrast | Text is readable even in bright light |

**Pass:** All content readable, responsive layout, no visual defects  
**Fail:** Overlapping elements, horizontal scroll, unreadable text, tiny tap targets

---

## TC-02: GitHub OAuth Login — Mobile ⚠️ P0

**Objective:** Verify full GitHub OAuth login flow works on mobile  
**Device:** iPhone Safari OR Android Chrome  

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Open https://clawqa.ai/login | Login page loads with GitHub button and demo password field |
| 2 | Tap "Continue with GitHub" | Redirects to GitHub authorization page |
| 3 | Log in to GitHub (if not already) | GitHub login page works normally |
| 4 | Tap "Authorize" on GitHub consent screen | Redirects back to ClawQA |
| 5 | Wait for redirect to complete | Lands on /dashboard with GitHub name/avatar shown |

**Pass:** Full redirect chain works, user authenticated, dashboard loads  
**Fail:** Stuck on redirect, blank screen, error page, or missing user info

---

## TC-03: GitHub OAuth — Cancel/Deny 🔵 P1

**Objective:** Verify graceful handling when user denies GitHub OAuth  
**Device:** Any  

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Open https://clawqa.ai/login | Login page loads |
| 2 | Tap "Continue with GitHub" | Redirects to GitHub |
| 3 | Click "Cancel" or deny authorization | Returns to ClawQA |
| 4 | Check landing page | Back on /login, no crash, optional error message |

**Pass:** Returns to /login gracefully  
**Fail:** White screen, crash, or unhandled error

---

## TC-04: Demo Login Flow ⚠️ P0

**Objective:** Verify demo password login works end-to-end  
**Device:** Any (desktop or mobile)  

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Open https://clawqa.ai/login | Login page loads |
| 2 | Enter password: `ClawQA26` | Password field accepts input |
| 3 | Tap/click "Sign In" | Redirects to /dashboard |
| 4 | Verify dashboard loads | Stats, sidebar, and content visible |

**Pass:** Login succeeds, dashboard loads with content  
**Fail:** Login rejected, blank dashboard, or redirect loop

---

## TC-05: Wrong Password Handling 🔵 P1

**Objective:** Verify incorrect password shows proper error  
**Device:** Any  

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Open https://clawqa.ai/login | Login page loads |
| 2 | Enter password: `wrongpassword` | Field accepts input |
| 3 | Tap/click "Sign In" | Error message appears |
| 4 | Check error message | Says "Invalid password" or similar. No redirect. |

**Pass:** Clear error message, stays on login page  
**Fail:** No error shown, unexpected redirect, or generic server error

---

## TC-06: Mobile Hamburger Menu ⚠️ P0

**Objective:** Verify mobile navigation menu works correctly  
**Device:** iPhone Safari OR Android Chrome  

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Login on mobile (use demo password) | Dashboard loads |
| 2 | Tap the ☰ hamburger menu icon | Sidebar menu slides open |
| 3 | Verify all menu items visible | Dashboard, Test Cycles, Bug Reports, Analytics, etc. |
| 4 | Tap "Bug Reports" | Page navigates to /dashboard/bugs, menu closes |
| 5 | Tap ☰ again, then tap outside the sidebar | Sidebar opens, then closes on outside tap |

**Pass:** Menu opens/closes smoothly, correct pages load, no overlap after closing  
**Fail:** Menu stuck open, animation glitch, outside tap doesn't close, wrong page

---

## TC-07: Bug Detail Page — Mobile ⚠️ P0

**Objective:** Verify bug report details are fully readable on mobile  
**Device:** iPhone Safari OR Android Chrome  

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Login → navigate to Bug Reports | Bug list loads |
| 2 | Tap on any bug from the list | Detail page opens |
| 3 | Check title and severity badge | Title readable, severity badge colored (red/yellow/green) |
| 4 | Scroll to "Steps to Reproduce" | Steps are numbered and readable |
| 5 | Check "Expected Result" and "Actual Result" | Both fields visible, not truncated |
| 6 | Check device info section | Shows device/browser info if present |

**Pass:** All fields readable, badges colored, no truncated text  
**Fail:** Missing fields, cut-off text, overlapping elements

---

## TC-08: Test Cycle Detail — Mobile 🔵 P1

**Objective:** Verify test cycle details are usable on mobile  
**Device:** iPhone Safari OR Android Chrome  

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Login → navigate to Test Cycles | Test cycle list loads |
| 2 | Tap on a test cycle | Detail page opens |
| 3 | Check title and status | Both visible and formatted correctly |
| 4 | Check test steps list | Steps are numbered and readable |
| 5 | Check linked bugs section | Bug references are visible and tappable |

**Pass:** All content visible, no horizontal overflow  
**Fail:** Content cut off, horizontal scroll required, links broken

---

## TC-09: Full Flow — iPhone Safari ⚠️ P0

**Objective:** Verify entire app works end-to-end on iPhone Safari  
**Device:** iPhone 13 or newer, Safari 17+  

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Open https://clawqa.ai in Safari | Homepage loads correctly |
| 2 | Tap "Sign In" → login with demo password | Redirects to /dashboard |
| 3 | Navigate to Dashboard | Stats/overview loads |
| 4 | Navigate to Test Cycles | Page loads with cycle list |
| 5 | Navigate to Bug Reports | Bug list renders |
| 6 | Navigate to Analytics | Charts/data loads |
| 7 | Navigate to Settings | Settings page loads |
| 8 | Logout (if available) or close | Session ends cleanly |

**Pass:** Entire flow works without errors on Safari  
**Fail:** Any page fails to load, layout broken, or JS errors

---

## TC-10: Full Flow — Android Chrome ⚠️ P0

**Objective:** Verify entire app works end-to-end on Android Chrome  
**Device:** Android phone (Pixel/Samsung), Chrome 120+  

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1-8 | Same steps as TC-09 | Same expected results |

**Pass:** Entire flow works without errors on Android Chrome  
**Fail:** Any page fails to load, layout broken, or JS errors

---

## TC-11: Tablet Layout — iPad 🔵 P1

**Objective:** Verify tablet-specific layout works  
**Device:** iPad, Safari  

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Open https://clawqa.ai on iPad | Homepage renders with appropriate spacing |
| 2 | Login → navigate dashboard | Dashboard loads |
| 3 | Check sidebar behavior | Either permanent sidebar or hamburger — should look intentional |
| 4 | Navigate through all sections | Content uses width appropriately, not cramped |
| 5 | Try portrait and landscape | Layout adjusts for both orientations |

**Pass:** Clean tablet layout, intentional sidebar behavior  
**Fail:** Mobile layout forced on tablet, or desktop layout too cramped

---

## TC-12: Landscape Orientation 🔵 P1

**Objective:** Verify app works in landscape mode  
**Device:** Any mobile phone  

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Rotate phone to landscape | Screen rotates |
| 2 | Open https://clawqa.ai/login | Login form fully visible |
| 3 | Login with demo password | Dashboard loads |
| 4 | Navigate to Bug Reports | Content renders correctly in landscape |

**Pass:** Login form and dashboard fully usable in landscape  
**Fail:** Login form cut off, buttons hidden, content overflows  
**Note:** Related to known bug #7083435

---

## TC-13: Slow Connection (3G) 🟢 P2

**Objective:** Verify app degrades gracefully on slow networks  
**Device:** Any mobile (enable 3G throttling or use real slow connection)  

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Enable 3G throttling on device/browser | Slow connection active |
| 2 | Load https://clawqa.ai | Page eventually loads with loading indicators |
| 3 | Login with demo password | Login completes (may be slow) |
| 4 | Navigate to Dashboard | Content loads, no timeouts |

**Pass:** Loading states visible, pages eventually load, no unhandled timeouts  
**Fail:** Blank screens, connection errors, or confusing loading states

---

## TC-14: Accessibility — Screen Reader 🟢 P2

**Objective:** Verify basic accessibility with screen reader  
**Device:** iPhone (VoiceOver) or Android (TalkBack)  

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Enable VoiceOver/TalkBack | Screen reader active |
| 2 | Navigate to https://clawqa.ai | Homepage elements announced |
| 3 | Navigate to Sign In button | Button is announced as "Sign In" |
| 4 | Navigate login form | Password field has label, button is announced |
| 5 | After login, navigate dashboard | Sidebar items announced correctly |

**Pass:** Screen reader can navigate the full flow  
**Fail:** Unlabeled buttons, missing headings, navigation traps

---

## TC-15: Add Project Button — Role Visibility ⚠️ P0

**Goal:** Verify the "Add Project" button only appears for agent-owner / admin roles  
**Pre-condition:** Logged in via demo account (admin role)

| Step | Action | Expected |
|------|--------|----------|
| 1 | Log in as admin/demo user | Dashboard loads |
| 2 | Locate the action bar below Auto-Fix Engine widget | "➕ Add Project" button visible alongside "📋 New Test Cycle" and "📖 Documentation" |
| 3 | Go to Settings → change role to "tester" → Save | Settings saved |
| 4 | Navigate back to Dashboard | "➕ Add Project" button is NOT visible; other buttons remain |
| 5 | Go to Settings → change role to "agent-owner" → Save | Settings saved |
| 6 | Navigate back to Dashboard | "➕ Add Project" button is visible again |

**Pass:** Button visibility matches role (agent-owner/admin = visible, tester = hidden)  
**Fail:** Button visible for testers, or hidden for agent-owner/admin

---

## TC-16: Add Project Modal — Form & Validation ⚠️ P0

**Goal:** Verify the Add Project modal opens, validates input, and creates a project  
**Pre-condition:** Logged in as admin or agent-owner

| Step | Action | Expected |
|------|--------|----------|
| 1 | Click "➕ Add Project" | Modal overlay appears with form fields: Name, Slug, Description, Target URL, Repository URL |
| 2 | Click outside the modal | Modal closes |
| 3 | Click "➕ Add Project" again | Modal re-opens |
| 4 | Leave Name and Slug empty, click "Create Project" | Error: "Name and slug are required." |
| 5 | Enter "Test Project" in Name | Slug auto-fills to "test-project" |
| 6 | Edit slug manually to "custom-slug" | Slug updates, stops auto-syncing with name |
| 7 | Fill in Description, Target URL, Repo URL | Fields accept input |
| 8 | Click "Create Project" | Modal closes, dashboard refreshes, new project card appears |
| 9 | Open modal again, try creating "Test Project" with slug "custom-slug" | Error: "Project with this slug already exists" |
| 10 | Click "Cancel" | Modal closes without creating |

**Pass:** Project created successfully, appears on dashboard, validation works  
**Fail:** Modal doesn't open, project not created, no validation errors shown

---

## TC-17: Add Project — Tester Role Blocked (API) 🔵 P1

**Goal:** Verify testers cannot create projects even via direct API call  
**Pre-condition:** Logged in as tester role

| Step | Action | Expected |
|------|--------|----------|
| 1 | Log in as tester (change role in Settings) | Dashboard loads, no Add Project button |
| 2 | Open browser DevTools → Console | Console ready |
| 3 | Run: `fetch('/api/v1/projects', {method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({name:'Hack',slug:'hack'})}).then(r=>r.json()).then(console.log)` | Response: `{ error: "Forbidden: only agent-owner or admin can create projects" }` with 403 status |

**Pass:** API rejects with 403  
**Fail:** Project gets created or different error returned

---

## Priority Summary

| Priority | Test Cases | Count | Est. Time |
|----------|-----------|-------|-----------|
| ⚠️ P0 | TC-01, 02, 04, 06, 07, 09, 10, 15, 16 | 9 | ~55 min |
| 🔵 P1 | TC-03, 05, 08, 11, 12, 17 | 6 | ~35 min |
| 🟢 P2 | TC-13, 14 | 2 | ~20 min |
| **Total** | | **17** | **~110 min** |

## Minimum Viable Test

If limited time: run TC-01, TC-04, TC-06, TC-07, TC-09 (or TC-10), TC-15, TC-16.  
**7 tests, ~35 minutes, 1 mobile device.**

---

## Bug Reporting

When filing bugs, include:
- **Device:** iPhone 14 / Safari 17.2 (or whatever you're testing on)
- **Steps to reproduce:** Exact steps from the test case
- **Expected vs Actual:** What should happen vs what happened
- **Screenshot or screen recording:** Attach if possible
- **Severity:** Critical (blocks usage), Major (broken feature), Minor (cosmetic)

Report bugs via Applause platform → they'll appear in ClawQA automatically.

---

*Generated by QAClaw 🧪 | clawqa.ai v1.2.0*
