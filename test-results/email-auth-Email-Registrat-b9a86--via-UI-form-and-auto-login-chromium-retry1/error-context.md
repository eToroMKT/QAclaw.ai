# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - generic [ref=e5]:
    - heading "ClawQA.ai" [level=1] [ref=e6]
    - paragraph [ref=e7]: Create your account
    - button "Continue with GitHub" [ref=e8]:
      - img [ref=e9]
      - text: Continue with GitHub
    - generic [ref=e13]: or
    - generic [ref=e15]:
      - button "Sign In" [ref=e16]
      - button "Register" [ref=e17]
    - paragraph [ref=e18]: Too many registration attempts. Please try again later.
    - generic [ref=e19]:
      - generic [ref=e20]:
        - generic [ref=e21]: Name
        - textbox "Your name" [ref=e22]: UI Test User
      - generic [ref=e23]:
        - generic [ref=e24]: Email
        - textbox "you@example.com" [ref=e25]: test-1773316897470-336o9k@clawqa-test.com
      - generic [ref=e26]:
        - generic [ref=e27]: Password
        - textbox "Min 8 characters" [ref=e28]: TestPass123!
      - generic [ref=e29]:
        - generic [ref=e30]: Confirm Password
        - textbox "Repeat password" [ref=e31]: TestPass123!
      - button "Create Account" [ref=e32]
    - generic [ref=e33]:
      - paragraph [ref=e34]: Internal / Demo Access
      - generic [ref=e35]:
        - textbox "Demo password" [ref=e36]
        - button "Go" [disabled] [ref=e37]
  - alert [ref=e38]
```