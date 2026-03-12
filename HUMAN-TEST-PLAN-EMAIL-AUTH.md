# Human Test Plan: Email Registration & Login — ClawQA.ai

**Product:** ClawQA.AI  
**Project ID:** `cmlu5qwin00035dz3r1j1msfh`  
**Target URL:** https://clawqa.ai  
**Feature:** Email Registration & Login (ported from Clawdet)  
**Created:** 2026-03-12  
**Priority:** P1 (auth is critical path)

---

## Test Cases for Applause

### TC-EA-01: Registration Page UI Loads Correctly
- **Priority:** P1 — Critical
- **Category:** UI / Smoke
- **Steps:**
  1. Navigate to https://clawqa.ai/login
  2. Observe the page loads with two tabs: "Sign In" and "Register"
  3. Observe "Continue with GitHub" button is visible
  4. Click the "Register" tab
  5. Verify fields: Name, Email, Password ("Min 8 characters"), Confirm Password ("Repeat password")
  6. Verify "Create Account" button is visible
- **Expected:** All elements render correctly, no layout issues, responsive on mobile/desktop
- **Devices:** Desktop Chrome, Desktop Firefox, Mobile Safari, Mobile Chrome

### TC-EA-02: Register with Valid Email and Password
- **Priority:** P1 — Critical
- **Category:** Functional
- **Steps:**
  1. Navigate to https://clawqa.ai/login
  2. Click "Register" tab
  3. Enter a valid name (e.g., "Test User")
  4. Enter a unique email (e.g., testXXX@example.com)
  5. Enter a strong password (min 8 chars, e.g., "SecurePass123!")
  6. Re-enter the same password in Confirm
  7. Click "Create Account"
- **Expected:** User is registered and auto-redirected to /dashboard within 15 seconds
- **Devices:** Desktop Chrome, Mobile Chrome

### TC-EA-03: Register with Mismatched Passwords
- **Priority:** P2 — High
- **Category:** Validation
- **Steps:**
  1. Navigate to https://clawqa.ai/login → Register tab
  2. Fill name, email, password ("Pass1234!")
  3. Enter different confirm password ("DifferentPass!")
  4. Click "Create Account"
- **Expected:** Inline error "Passwords don't match" shown, no redirect, no account created
- **Devices:** Desktop Chrome

### TC-EA-04: Register with Short Password
- **Priority:** P2 — High
- **Category:** Validation
- **Steps:**
  1. Navigate to https://clawqa.ai/login → Register tab
  2. Fill name, email, password = "abc" (< 8 chars)
  3. Fill confirm = "abc"
  4. Click "Create Account"
- **Expected:** Error about minimum password length, no redirect
- **Devices:** Desktop Chrome

### TC-EA-05: Register with Invalid Email
- **Priority:** P2 — High
- **Category:** Validation
- **Steps:**
  1. Navigate to https://clawqa.ai/login → Register tab
  2. Fill name, email = "not-an-email", valid password
  3. Click "Create Account"
- **Expected:** Error about invalid email format
- **Devices:** Desktop Chrome

### TC-EA-06: Register with Duplicate Email
- **Priority:** P1 — Critical
- **Category:** Functional
- **Steps:**
  1. Register a new account with email X (TC-EA-02)
  2. Log out or open incognito
  3. Try to register again with the same email X
- **Expected:** Error message indicating email already exists (409), user not created twice
- **Devices:** Desktop Chrome

### TC-EA-07: Sign In with Valid Credentials
- **Priority:** P1 — Critical
- **Category:** Functional
- **Steps:**
  1. Register an account (TC-EA-02)
  2. Log out or open incognito
  3. Navigate to https://clawqa.ai/login (Sign In tab, default)
  4. Enter the registered email and password
  5. Click Sign In submit button
- **Expected:** Redirected to /dashboard, user name visible in UI
- **Devices:** Desktop Chrome, Mobile Safari

### TC-EA-08: Sign In with Wrong Password
- **Priority:** P1 — Critical
- **Category:** Security
- **Steps:**
  1. Navigate to https://clawqa.ai/login
  2. Enter a valid registered email
  3. Enter an incorrect password
  4. Click Sign In
- **Expected:** Error "Invalid email or password" shown, no redirect, no information leakage about whether the email exists
- **Devices:** Desktop Chrome

### TC-EA-09: Sign In with Non-Existent Email
- **Priority:** P2 — High
- **Category:** Security
- **Steps:**
  1. Navigate to https://clawqa.ai/login
  2. Enter an email that was never registered
  3. Enter any password
  4. Click Sign In
- **Expected:** Same generic "Invalid email or password" error (no hint about email existence)
- **Devices:** Desktop Chrome

### TC-EA-10: Auth Guard — Unauthenticated Access to Protected Pages
- **Priority:** P1 — Critical
- **Category:** Security
- **Steps:**
  1. Open incognito browser
  2. Navigate directly to each protected URL:
     - /dashboard
     - /dashboard/test-cycles
     - /dashboard/bugs
     - /dashboard/analytics
     - /settings
     - /projects/clawqa
  3. Verify each redirects to /login
- **Expected:** All protected pages redirect to /login, no flash of protected content
- **Devices:** Desktop Chrome

### TC-EA-11: GitHub OAuth Still Works Alongside Email Auth
- **Priority:** P1 — Critical
- **Category:** Regression
- **Steps:**
  1. Navigate to https://clawqa.ai/login
  2. Click "Continue with GitHub"
  3. Complete GitHub OAuth flow
- **Expected:** Successful login, redirected to /dashboard, GitHub user info shown
- **Devices:** Desktop Chrome

### TC-EA-12: Demo Password Login
- **Priority:** P2 — High
- **Category:** Functional
- **Steps:**
  1. Navigate to https://clawqa.ai/login
  2. Locate the "Demo password" input field
  3. Enter the demo password
- **Expected:** Demo login works, user can browse dashboard in demo mode
- **Devices:** Desktop Chrome

### TC-EA-13: Session Persistence After Registration
- **Priority:** P2 — High
- **Category:** Functional
- **Steps:**
  1. Register a new account and reach the dashboard
  2. Close the browser tab
  3. Open a new tab and navigate to https://clawqa.ai/dashboard
- **Expected:** User is still logged in (session cookie persists), dashboard loads without re-login
- **Devices:** Desktop Chrome

### TC-EA-14: Registration Rate Limiting
- **Priority:** P2 — High
- **Category:** Security
- **Steps:**
  1. Register 5 accounts rapidly from the same IP (within 1 hour)
  2. Attempt a 6th registration
- **Expected:** 6th registration returns 429 error / rate limit message
- **Devices:** Desktop Chrome

### TC-EA-15: Responsive Layout — Login/Register on Mobile
- **Priority:** P2 — High
- **Category:** UI / Responsive
- **Steps:**
  1. Open https://clawqa.ai/login on a mobile device (or mobile viewport)
  2. Switch between Sign In and Register tabs
  3. Fill out all fields
  4. Verify form is usable — no horizontal scroll, no overlapping elements
- **Expected:** Clean, usable mobile layout for all auth forms
- **Devices:** Mobile Safari (iPhone), Mobile Chrome (Android)

---

## Summary

| ID | Title | Priority | Category |
|----|-------|----------|----------|
| TC-EA-01 | Registration Page UI | P1 | UI/Smoke |
| TC-EA-02 | Register Valid | P1 | Functional |
| TC-EA-03 | Mismatched Passwords | P2 | Validation |
| TC-EA-04 | Short Password | P2 | Validation |
| TC-EA-05 | Invalid Email | P2 | Validation |
| TC-EA-06 | Duplicate Email | P1 | Functional |
| TC-EA-07 | Sign In Valid | P1 | Functional |
| TC-EA-08 | Wrong Password | P1 | Security |
| TC-EA-09 | Non-Existent Email | P2 | Security |
| TC-EA-10 | Auth Guards | P1 | Security |
| TC-EA-11 | GitHub OAuth Regression | P1 | Regression |
| TC-EA-12 | Demo Password | P2 | Functional |
| TC-EA-13 | Session Persistence | P2 | Functional |
| TC-EA-14 | Rate Limiting | P2 | Security |
| TC-EA-15 | Mobile Responsive | P2 | UI/Responsive |

**Total: 15 test cases (7 P1, 8 P2)**
