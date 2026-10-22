# Diamond enquiry migration

Adapted from `Skimanz/basalt-capital-website`, branch `temporary-contact`.

## Current release state

Prepared on `migrate-contact`. Do not promote to production until the resources below are configured and a preview is verified. Production still uses its existing Formspree integration until promotion.

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

No keys or placeholder resource IDs are committed. No changes to iCloud, unrelated email accounts, Basalt resources, pricing, SEO or sitemap are required.

## Behaviour

All three email enquiry forms POST to `/api/contact`. The handler enforces same origin, 64 KiB streamed body limit, field validation and lengths, honeypot, Turnstile success, `contact` action and exact request hostname. It saves a UUID reference to D1 before calling Resend. Notification status is `pending`, `not_sent` or `accepted`. Provider acceptance is not inbox delivery. Saved enquiries remain successful leads even during mail failure; the visitor gets the reference and a notification warning.

GA4 receives only the existing fixed event/location labels; reference and form values are not sent to analytics. WhatsApp submission remains the existing direct conversation flow.

## Checks

- `node --test tests/*.test.js`: backend validation, persistence before delivery, Resend failures, config gating, frontend failure/success handling, duplicate-submit protection and Turnstile reset.
- `python3 scripts/build.py`: produces static output and API-only `_routes.json`.
- Real Cloudflare binding, Turnstile, notification and inbox checks remain pending until account configuration is available.
