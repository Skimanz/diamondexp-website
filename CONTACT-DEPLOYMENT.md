# Diamond enquiry migration

Adapted from `Skimanz/basalt-capital-website`, branch `temporary-contact`.

## Current release state

Implemented on `migrate-contact`. Resources are configured and preview submission, D1 persistence, Resend acceptance and Gmail inbox receipt were verified before production promotion. Production is deployed through GitHub main.

## Cloudflare Pages configuration

Project: `diamondexp-website`, account `4f4fa76589be91184a6b9e16502c5226`.

1. Create a separate Diamond D1 database, e.g. `diamondexp-enquiries`, and apply `migrations/0001_enquiries.sql` to it. Never bind Basalt's database.
2. Add the actual D1 database ID to `wrangler.jsonc` under `d1_databases`, with binding `ENQUIRIES`, database name and `migrations_dir: "migrations"`.
3. Create/configure a managed Turnstile widget for `diamondexp.nz` (and separately approved preview hostnames). Set public `TURNSTILE_SITE_KEY` in Wrangler vars and secret `TURNSTILE_SECRET_KEY` in Pages.
4. Configure a Resend-verified sender for Diamond. Set `CONTACT_FROM` to that sender; set secret `RESEND_API_KEY` in Pages. Recipient is fixed in the handler as `skiwithash@gmail.com`; guest email is `reply_to`.
5. Set Pages build command to `python3 scripts/build.py` and output directory to `dist`. The build copies existing public assets without rewriting their content. Backend, migration, tests, docs and secrets are excluded from static output.
6. Keep preview resources isolated. Set preview vars, secrets and a separate preview D1 binding explicitly; do not point previews at the production enquiry database.
7. Verify `/api/form-config` returns a public site key only. Missing configuration returns 503 and disables the email submission button; direct email and WhatsApp links remain available.
8. On a configured preview, submit a clearly labelled test enquiry with a fresh real Turnstile token. Confirm its D1 reference, Resend receipt and inbox delivery separately. Replay of the consumed token must fail. Do not solve an interactive challenge through automation.
9. Promote only after preview checks pass, then verify production again.

No secret keys or placeholder resource IDs are committed. Public site key, verified sender and separate D1 IDs are configured in Wrangler. No changes to iCloud, unrelated email accounts, Basalt resources, pricing, SEO or sitemap are required.

## Behaviour

All three email enquiry forms POST to `/api/contact`. The handler enforces same origin, 64 KiB streamed body limit, field validation and lengths, honeypot, Turnstile success, `contact` action and exact request hostname. It saves a UUID reference to D1 before calling Resend. Notification status is `pending`, `not_sent` or `accepted`. Provider acceptance is not inbox delivery. Saved enquiries remain successful leads even during mail failure; the visitor gets the reference and a notification warning.

GA4 receives only the existing fixed event/location labels; reference and form values are not sent to analytics. WhatsApp submission remains the existing direct conversation flow.

## Checks

- `node --test tests/*.test.js`: backend validation, persistence before delivery, Resend failures, config gating, frontend failure/success handling, duplicate-submit protection and Turnstile reset.
- `python3 scripts/build.py`: produces static output and API-only `_routes.json`.
- Real preview checks passed: Turnstile accepted a fresh token, D1 saved the enquiry, Resend accepted notification and Gmail inbox receipt was verified. An explicit consumed-token replay test remains unverified.

## Provisioned resources (23 October 2026)

- Production D1: `diamondexp-enquiries` (`9dad7749-563d-4513-addd-e64e486ec763`).
- Preview D1: `diamondexp-enquiries-preview` (`cadeab4f-6913-4f63-be9a-7aa5f3502f23`).
- Enquiry table and index initialized in both through the Cloudflare D1 console using the checked migration SQL.
- Managed Turnstile widget: `Diamond Experiences contact`, allowing `diamondexp.nz` and `diamondexp-website.pages.dev` (including subdomains). No pre-clearance.
- Resend domain `forms.diamondexp.nz` verified. Sender: `Ash Johns Ski <website@forms.diamondexp.nz>`.
- Pages production and preview store `TURNSTILE_SECRET_KEY` and domain-restricted sending-only `RESEND_API_KEY` as encrypted secrets.
- Pages build: `python3 scripts/build.py`, output `dist`.

Preview storage was verified with reference `24bfe55c-1e60-4d0d-9046-85cbea6cdd76`; this first test recorded `not_sent`, correctly preserving the enquiry and showing a notification warning. The credential transfer was corrected afterward. Do not treat that first test as evidence of email delivery.

## Successful preview validation

Reference `7f09fb7e-975c-4909-a737-5b6b151d4206`: real Turnstile-backed submission succeeded, notification was accepted, and the matching message was independently found in the `skiwithash@gmail.com` Gmail inbox. Test message explicitly stated that no booking was requested. The guest email is used as Reply-To. Automated backend/client tests: 7 passed.
