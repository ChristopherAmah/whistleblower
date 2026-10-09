# CWG PLC Whistleblower Portal

A Vite/React policy page and confidential reporting form. Reports are delivered to `whistleblower@cwg-plc.com` by a server-side Vercel Function using Twilio SendGrid.

## Local development

```bash
npm install
npm run dev
```

The page works locally, but email delivery requires the Vercel Function and its environment variables. Use `vercel dev` when testing the complete submission flow locally.

## Vercel email setup

1. In Twilio SendGrid, authenticate a CWG-controlled domain or verify a single sender address.
2. Create a SendGrid API key with Mail Send permission.
3. In the Vercel project, open **Settings → Environment Variables**.
4. Add `SENDGRID_API_KEY` with the API key as its value.
5. Add `SENDGRID_FROM_EMAIL` using a verified sender, for example `reports@cwg-plc.com`.
6. Optionally add `SENDGRID_FROM_NAME` with the value `CWG Whistleblower`.
7. Apply the variables to Production, Preview, and Development as appropriate, then redeploy.

Do not place the API key in React source code or commit it to the repository. The example variable names are documented in `.env.example`.

## Checks

```bash
npm run lint
npm run build
```
