# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - generic [ref=e5]:
    - heading "ClawQA.ai" [level=1] [ref=e6]
    - paragraph [ref=e7]: Sign in to continue
    - button "Continue with GitHub" [ref=e8]:
      - img [ref=e9]
      - text: Continue with GitHub
    - generic [ref=e13]: or
    - generic [ref=e15]:
      - button "Sign In" [ref=e16]
      - button "Register" [ref=e17]
    - generic [ref=e18]:
      - generic [ref=e19]:
        - generic [ref=e20]: Email
        - textbox "you@example.com" [ref=e21]
      - generic [ref=e22]:
        - generic [ref=e23]: Password
        - textbox "Enter password" [ref=e24]
      - button "Sign In" [disabled] [ref=e25]
    - generic [ref=e26]:
      - paragraph [ref=e27]: Internal / Demo Access
      - generic [ref=e28]:
        - textbox "Demo password" [ref=e29]
        - button "Go" [disabled] [ref=e30]
  - alert [ref=e31]
```