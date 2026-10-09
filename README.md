# CWG PLC Whistleblower Portal

A Vite/React policy page and confidential reporting form. Reports are delivered to `whistleblower@cwg-plc.com` by a server-side Vercel Function.

## Local development

```bash
npm install
npm run dev
```

The page works locally, but email delivery requires the Vercel Function and its environment variables. Use `vercel dev` when testing the complete submission flow locally.

## Vercel email setup

1. Create a Resend account and verify a domain that CWG controls.
2. Create a Resend API key.
3. In the Vercel project, open **Settings → Environment Variables**.
4. Add `RESEND_API_KEY` with the API key as its value.
5. Add `REPORT_FROM_EMAIL` using a sender on the verified domain, for example `CWG Whistleblower <reports@cwg-plc.com>`.
6. Apply both variables to Production, Preview, and Development as appropriate, then redeploy.

Do not place the API key in React source code or commit it to the repository. The example variable names are documented in `.env.example`.

## Checks

```bash
npm run lint
npm run build
```
