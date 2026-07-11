/*
 * Sizlon contact-form backend — Google Apps Script web app.
 *
 * This is the source of truth for the script deployed behind
 * site.contactFormEndpoint (src/config/site.ts). It receives the contact-form
 * POST, appends a row to the bound Google Sheet, and emails NOTIFY.
 *
 * SETUP
 *   1. Create/open the Google Sheet that will hold submissions.
 *   2. Extensions -> Apps Script. Paste this file's contents.
 *   3. Set NOTIFY below if the address changes.
 *   4. Deploy -> New deployment -> Web app.
 *        Execute as: Me   |   Who has access: Anyone
 *      Copy the /exec URL into site.contactFormEndpoint.
 *   5. (Turnstile, optional) Create a Cloudflare Turnstile widget for sizlon.io.
 *      Put the SITE key in site.turnstileSiteKey (src/config/site.ts) and the
 *      SECRET key in Project Settings -> Script properties as TURNSTILE_SECRET.
 *      Then run authorizeExternalRequest() once from the editor and accept the
 *      permission prompt (grants script.external_request for UrlFetchApp), and
 *      redeploy. Both keys must be set for verification to take effect.
 *
 * REDEPLOY (after editing this code — keeps the SAME /exec URL)
 *   Deploy -> Manage deployments -> edit (pencil) -> Version: New version -> Deploy.
 *   (Using "New deployment" instead would mint a NEW URL.)
 *
 * DEFENSES (in order)
 *   1. Honeypot  — the hidden `company_url` field; bots fill it, humans do not.
 *   2. Min fill time — the form stamps `elapsed` (ms since page load); a sub-3s
 *      submit is bot-fast and is dropped. Absent (no-JS) is allowed to pass.
 *   3. Validation — required name/email/message, email format.
 *   4. Length caps — reject oversized payloads.
 *   5. Turnstile — verify the Cloudflare token server-side. Enforced only when a
 *      TURNSTILE_SECRET script property is set (Project Settings -> Script
 *      properties); until then the check is skipped. Pair with turnstileSiteKey
 *      in src/config/site.ts (the client widget).
 *   6. Hourly cap — a global circuit breaker so a flood cannot drain the Gmail
 *      send quota and block legitimate mail (Apps Script gives doPost no client
 *      IP, so per-IP limiting is not possible — this is a total-volume guard).
 *   7. Formula-injection scrub — values starting with = + - @ get a leading
 *      quote so opening the Sheet cannot execute them (CSV/Sheets injection).
 *   Dropped requests still return "ok" so bots do not learn they were filtered.
 *
 * NOTE: the min-fill-time, length caps, and Turnstile are paired with the
 * front-end form (src/sections/Contact.astro). Each side is independently safe
 * to deploy — a field absent on one side is simply ignored on the other.
 */

const NOTIFY = 'hello@sizlon.io';
const FROM_NAME = 'Sizlon 웹 문의'; // sender display name on the notification
// Optional: a Gmail "send mail as" alias (e.g. 'noreply@sizlon.io') set up in
// Gmail settings. When set, the notification is sent FROM it instead of the
// owner's own address — which stops Gmail from labelling it "me". Leave empty
// to send from the owner account (shows as "me" when NOTIFY is that account).
const FROM_ALIAS = '';
const HOURLY_CAP = 40; // max notification emails per hour; overflow is logged only

function doPost(e) {
  const p = (e && e.parameter) || {};
  if (p.company_url) return ok(); // 1. honeypot
  if (p.elapsed && Number(p.elapsed) < 3000) return ok(); // 2. min fill time (bot-fast)

  const name = (p.name || '').trim();
  const email = (p.email || '').trim();
  const company = (p.company || '').trim();
  const message = (p.message || '').trim();

  if (!name || !email || !message) return ok(); // 3. required
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return ok(); // email format
  if (name.length > 200 || email.length > 200 ||
      company.length > 200 || message.length > 5000) return ok(); // 4. length caps

  const props = PropertiesService.getScriptProperties();
  const secret = props.getProperty('TURNSTILE_SECRET');
  if (secret) { // 5. Turnstile
    const tv = turnstileVerify_(secret, p['cf-turnstile-response']);
    if (!tv.success) {
      // Silent drop in production. Set a TURNSTILE_DEBUG script property to log
      // the Cloudflare error-codes to the sheet while diagnosing a bad config.
      if (props.getProperty('TURNSTILE_DEBUG')) {
        SpreadsheetApp.getActiveSpreadsheet().getActiveSheet()
          .appendRow([new Date(), scrub_((p.name || '').trim()), scrub_((p.email || '').trim()),
                      scrub_((p.company || '').trim()), scrub_((p.message || '').trim()),
                      'TURNSTILE-FAIL: ' + tv.codes]);
      }
      return ok();
    }
  }

  const cache = CacheService.getScriptCache(); // 6. hourly cap
  const key = 'cnt_' + Math.floor(Date.now() / 3600000);
  const count = Number(cache.get(key) || 0);
  const over = count >= HOURLY_CAP;
  if (!over) cache.put(key, String(count + 1), 3600);

  SpreadsheetApp.getActiveSpreadsheet().getActiveSheet() // 7. log (injection-scrubbed)
    .appendRow([new Date(), scrub_(name), scrub_(email),
                scrub_(company), scrub_(message), over ? 'RATE-LIMITED' : '']);

  if (!over) {
    const mail = {
      to: NOTIFY,
      replyTo: email,
      name: FROM_NAME,
      subject: 'Sizlon 문의 — ' + name,
      body: '이름: ' + name + '\n이메일: ' + email +
            '\n회사: ' + company + '\n\n' + message,
    };
    if (FROM_ALIAS) mail.from = FROM_ALIAS;
    MailApp.sendEmail(mail);
  }
  return ok();
}

// Verify a Cloudflare Turnstile token against the siteverify API. Returns
// { success, codes } — codes carries Cloudflare's error-codes for diagnosis
// (e.g. invalid-input-secret, hostname-mismatch, timeout-or-duplicate).
function turnstileVerify_(secret, token) {
  if (!token) return { success: false, codes: 'missing-token' };
  try {
    const res = UrlFetchApp.fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'post',
      payload: { secret: secret, response: token },
      muteHttpExceptions: true,
    });
    const data = JSON.parse(res.getContentText());
    return { success: data.success === true, codes: (data['error-codes'] || []).join(',') };
  } catch (err) {
    return { success: false, codes: 'fetch-error:' + err };
  }
}

// Neutralize Google Sheets formula injection: a cell beginning with one of
// = + - @ (or tab/CR) is prefixed with a quote so it is stored as text.
function scrub_(v) {
  v = String(v);
  return /^[=+\-@\t\r]/.test(v) ? "'" + v : v;
}

function ok() {
  return ContentService.createTextOutput('ok');
}

// One-time authorization. After adding UrlFetchApp (Turnstile), the script needs
// the script.external_request scope. Select this function in the editor and click
// Run once, then accept the permission prompt. Harmless to leave in place; the
// request uses dummy values and its result is ignored.
function authorizeExternalRequest() {
  UrlFetchApp.fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'post',
    payload: { secret: 'setup', response: 'setup' },
    muteHttpExceptions: true,
  });
}
