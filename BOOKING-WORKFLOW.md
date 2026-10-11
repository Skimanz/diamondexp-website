# Japan 2026–27 availability

The private workbook remains the booking and payment record. This public repository must never contain guest details, contact information, invoice PDFs, bank details, booking IDs or payment records.

`availability.json` contains only season boundaries, the update date and date statuses. Dates absent from `days` are available to enquire. Mark a date unavailable if any booking or personal commitment prevents offering that day. This is a whole-day calendar, not a time-slot booking engine.

## Each update

1. Check all sessions in the current workbook for clashes, including held dates. An enquiry or sample invoice does not reserve dates.
2. On actual invoice issue, record a unique invoice number, issue timestamp, payment deadline in JST, PDF link, terms version/acceptance and Held status in the private records. Publish the lesson dates as pending.
3. Invoices issued before 1 December 2026 JST get seven days. From 1 December they get 48 hours. Last-minute deadlines must be specifically agreed before the lesson start. Do not backdate from the sample invoice.
4. On verified payment, record the receipt and written confirmation, then publish unavailable. Do not infer payment from a guest saying they paid.
5. At expiry, check receipts and transfers in progress with Ash. Release a hold only on Ash's instruction and after checking no other booking blocks the date. Never release automatically in browser code.
6. Review the local change, commit and publish, then verify the live date status. Updating the workbook alone does not update the website, and this tool neither sends invoices nor schedules reminders.

Examples (substitute real dates only after following the checks above):

```sh
node tools/availability-admin.mjs pending YYYY-MM-DD YYYY-MM-DD
node tools/availability-admin.mjs unavailable YYYY-MM-DD
node tools/availability-admin.mjs available YYYY-MM-DD
node tools/availability-admin.mjs deadline ISSUE_TIMESTAMP_WITH_OFFSET LESSON_TIMESTAMP_WITH_OFFSET
```

An expired pending date intentionally stays pending until checked and explicitly released. No expiry timestamp, guest identifier or private booking reference is published.

Ash may also explicitly pencil in an existing guest arrangement before invoicing. Record it as a provisional Held booking privately and Pending publicly, with no invented payment or invoice date. The seven-day or 48-hour payment clock starts only when the actual invoice is issued. Check Ash's existing commitments before releasing any such date.

For an invoice covering multiple days, cancellation bands apply separately to each lesson. More than 14 days: 90% refund; from 7 to 14 days inclusive: 50%; less than 7 days: no guest-cancellation refund, subject to applicable law. Preserve the terms issued to each guest rather than applying future website edits retroactively.
