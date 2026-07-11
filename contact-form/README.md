# Contact form

Developer reference for the Sizlon marketing-site contact form: a static form
that submits into the owner's own Google Workspace — no third-party form SaaS,
so submissions never leave infrastructure Sizlon controls.

## Architecture

```
sizlon.io/contact  (static Astro form)
        │  POST (application/x-www-form-urlencoded), targeting a hidden <iframe>
        ▼
Google Apps Script web app  (/exec)
        ├── validates + verifies (see Defenses)
        ├── appends a row to a Google Sheet   ← submission log
        └── MailApp emails NOTIFY             ← notification
```

The POST targets a hidden `<iframe>` rather than using `fetch`, which sidesteps
CORS/preflight entirely (Apps Script web apps do not send CORS headers). The
client cannot read the response, so success is shown optimistically when the
iframe finishes loading. Cloudflare Turnstile guards against bots.

## Files

| File | Role |
|------|------|
| `src/sections/Contact.astro` | The form markup, styles, and client-side enhancement script (elapsed stamp, honeypot guard, Turnstile token gate, success swap). |
| `src/config/site.ts` | `contactFormEndpoint` (the `/exec` URL) and `turnstileSiteKey`. Both are client-visible, not secrets. |
| `src/i18n/content.ts` | `contact.*` strings (labels, `sending`, `sentTitle`, `sentBody`, `verifyNeeded`) in en + ko. |
| `contact-form/Code.gs` | Source of truth for the deployed Apps Script. Not built by Astro — it is copied into the Apps Script editor by hand. |

`Code.gs` lives in the repo but is **not** auto-deployed. After editing it you
must paste it into the Apps Script editor and redeploy (see below).

## Configuration

**`src/config/site.ts`** (committed, public):
- `contactFormEndpoint` — the Apps Script web-app `/exec` URL. Empty ⇒ the form
  no-ops on submit and the mailto fallback carries.
- `turnstileSiteKey` — Cloudflare Turnstile site key. Empty ⇒ widget not rendered
  and the server skips the Turnstile check.

**`contact-form/Code.gs`** constants:
- `NOTIFY` — where notifications are sent (`hello@sizlon.io`).
- `FROM_NAME` — sender display name on the notification.
- `FROM_ALIAS` — optional Gmail "send mail as" alias to send *from*. Empty ⇒
  sends from the owner account. Because `hello@` is an alias of `admin@`, the
  owner-sent notification shows as "me" in Gmail (self-to-self); set a distinct
  send-as alias here to change that. Cosmetic — left empty by choice.
- `HOURLY_CAP` — max notification emails per hour (quota circuit breaker).

**Apps Script → Project Settings → Script properties** (secrets, never in repo):
- `TURNSTILE_SECRET` — Cloudflare Turnstile secret key. Set ⇒ server enforces
  Turnstile. Read at runtime, so changing it takes effect **without** redeploy.
- `TURNSTILE_DEBUG` — set to any value to log Turnstile *failures* to the sheet
  as `TURNSTILE-FAIL: <error-codes>` for diagnosis. Remove in normal operation
  (otherwise bots with bad tokens fill the sheet).

## Defenses (in order, all in `Code.gs::doPost`)

1. **Honeypot** — hidden `company_url` field; filled ⇒ dropped.
2. **Min fill time** — form stamps `elapsed` (ms since page load); `< 3000` ⇒
   dropped (bot-fast). Absent (no-JS) passes.
3. **Validation** — required name/email/message, email format.
4. **Length caps** — oversized fields dropped (client `maxlength` mirrors this).
5. **Turnstile** — server-side `siteverify`, enforced only when `TURNSTILE_SECRET`
   is set.
6. **Hourly cap** — global send-rate breaker protecting the Gmail quota. (Apps
   Script gives `doPost` no client IP, so per-IP limiting is impossible.)
7. **Formula-injection scrub** — cells starting with `= + - @` get a leading
   quote before hitting the sheet (CSV/Sheets injection).

Dropped requests still return `ok` so bots do not learn they were filtered.

## Deploy / redeploy

First deploy: see the SETUP block at the top of `Code.gs`.

**After editing `Code.gs`:** copy it into the Apps Script editor (replace all),
then **Deploy → Manage deployments → edit (pencil) → Version: New version →
Deploy**. This keeps the same `/exec` URL. Using **New deployment** instead mints
a *new* URL and would require updating `contactFormEndpoint`.

Adding a new API (e.g. `UrlFetchApp` for Turnstile) needs a new OAuth scope:
run `authorizeExternalRequest()` once from the editor and accept the prompt, then
redeploy.

## Turnstile setup

1. Create a Turnstile widget in the Cloudflare dashboard. Add `sizlon.io` (and
   any other test hostnames) to its **Hostnames**. Mode: Managed.
2. Site key → `turnstileSiteKey` in `site.ts` (commit). Secret key →
   `TURNSTILE_SECRET` script property.
3. Deploy the `UrlFetchApp`-enabled `Code.gs` and run `authorizeExternalRequest()`
   **before** relying on the secret, or every token verification throws.
4. Activation needs BOTH keys. With only the site key, the widget renders but the
   server does not enforce (submissions still pass) — no lockout.

Client behaviour: the submit handler blocks with the `verifyNeeded` message
until the widget has produced a `cf-turnstile-response` token. Managed widgets
usually solve within a second; if a visitor submits first, they must wait/retry.

## Testing the endpoint (curl)

A POST that the script *processes* or *silently drops* both return `302` →
`script.googleusercontent.com/.../echo`. A POST that makes `doPost` **throw**
returns `200` with an inline error page. So:

```bash
URL=".../exec"
curl -s -o /dev/null -D - -X POST "$URL" \
  --data-urlencode "name=probe" --data-urlencode "email=a@b.co" \
  --data-urlencode "message=probe" --data-urlencode "elapsed=9000" \
  --data-urlencode "company_url=" | grep -i '^HTTP/'
# 302 → ran clean (processed OR dropped — check the sheet to tell which)
# 200 → doPost threw (read the body for the exception)
```

curl **cannot** produce a valid Turnstile token, so once `TURNSTILE_SECRET` is
set, curl posts are always dropped. Verify the happy path from a real browser.
`try/catch` inside `turnstileVerify_` swallows errors — use `TURNSTILE_DEBUG` to
surface them in the sheet.

## Troubleshooting

| Symptom | Cause / fix |
|---------|-------------|
| Sheet row appears but no email | Gmail filter with "skip inbox" diverts it to a label; and self-sent mail hides from inbox. Check the `웹 문의` label / All Mail / Spam. |
| Submissions silently dropped (no row, no email) | Turnstile misconfig. Set `TURNSTILE_DEBUG`, submit once, read `TURNSTILE-FAIL: <code>` in the sheet. |
| `TURNSTILE-FAIL: fetch-error … external_request` | `UrlFetchApp` scope not authorized. Run `authorizeExternalRequest()` and accept, then redeploy. |
| `TURNSTILE-FAIL: invalid-input-secret` | `TURNSTILE_SECRET` is not the secret paired with `turnstileSiteKey`'s widget. |
| `TURNSTILE-FAIL: hostname-mismatch` | Add the test domain to the widget's Hostnames. |
| `TURNSTILE-FAIL: timeout-or-duplicate` | Token expired/reused — resubmit for a fresh one. |
| Red "wait for verification" on submit | Widget has not produced a token yet (submitted too early) or is not solving (hostname / render). Wait for the green check, or check the console for Turnstile errors. |
| "Thanks…" shows before submitting | A `display` rule beating the UA `[hidden]` rule (fixed with a scoped `[hidden]{display:none!important}`). |
| Sender shows as "me" | Owner-sent notification to an alias of the same account. Cosmetic; use `FROM_ALIAS` (a distinct send-as) to change it. |
| Code edits not taking effect at `/exec` | You saved but did not deploy a **new version** (Manage deployments), or you created a **new deployment** (new URL). |

## Data & privacy

Submissions live in the Google Sheet and in Gmail — inside the owner's Workspace.
The privacy policy (`content.ts` → `legal.privacy`) discloses Cloudflare Turnstile
for spam protection. If the backend ever moves to a third-party form service,
update the "Sharing" / "What we collect" sections accordingly.
