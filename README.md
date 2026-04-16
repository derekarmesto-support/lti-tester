# LTI Launch Tester

A browser-based tool for testing Amira Learning SSO integrations across LTI 1.0, 1.2, and 1.3.

**Live tool:** https://derekarmesto-support.github.io/lti-tester

---

## What it does

Simulates an LMS launching Amira Learning via LTI — signs the request, builds the POST payload, and sends it to Amira in a new tab. Useful for verifying credentials, user ID mappings, and role configurations without needing a full LMS setup.

---

## LTI 1.0

The most common integration. Uses OAuth 1.0 / HMAC-SHA1 signing.

| Field | What to enter |
|---|---|
| Consumer Key | Provided by Amira (e.g. `admin.1000243642.ia`) |
| Consumer Secret | Provided by Amira |
| User ID Field | How Amira identifies the student or staff member — usually the sourced ID (3rd party ID) or local ID (Student/Teacher ID) |
| User ID Value | The actual student email or username to test with |
| Role | Learner for students, Instructor for teachers |

Click **Launch LTI Tool** — Amira's SSO page opens in a new tab.

---

## LTI 1.2

Same as LTI 1.0 with additional optional fields for person info, course context, and outcomes. Expand the **Context & Platform** section to fill those in if needed.

---

## LTI 1.3 ⚠️ Work in Progress

LTI 1.3 uses OIDC / JWT instead of OAuth. Full validation with Amira is still in progress.

### First-time setup
Before launching, complete LTI 1.3 registration with Amira:

1. Give Amira this Dynamic Registration URL to get started:
   ```
   https://sso.app.amiralearning.com/dwe-lti-sso/Registration/Init
   ```
2. Amira will provide a **Client ID** and **Deployment ID**
3. Generate a key pair using the **Key Management** section of the tool
4. Share the **JWKS URL** with Amira so they can verify your JWT signatures

### Launch fields

| Field | What to enter |
|---|---|
| Client ID | Provided by Amira after registration |
| Deployment ID | Provided by Amira after registration |
| Issuer ID | Your platform URL (the Apps Script web app URL if using that backend) |
| User ID | Student email or username |
| Role | Learner / Instructor / Administrator |

---

## Support

For questions about credentials or Amira SSO configuration, contact the Amira Learning support team.
