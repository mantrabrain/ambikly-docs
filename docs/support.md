---
title: Support
description: Where to get help with Ambikly, what to include so the first reply is useful, how to report a security issue privately, the refund policy, and what support covers.
prev:
  text: Changelog
  link: /changelog
---

# Support

Where to ask, what to send, and what support can and cannot do for you. Sending the right four
things with your first message is usually the difference between an answer and a request for more
information.

## Before you write

Two steps solve a large share of reports on their own, and both produce information you will need
anyway.

<ol class="step-list">
  <li>Check <a href="/troubleshooting">Troubleshooting</a> for your symptom. It is organized by what you are seeing, not by feature, and it covers the problems that generate the most tickets — blank store pages, REST 404s, orders stuck in Pending, PayPal's sandbox default, missing emails, tax and shipping surprises, paused add-ons after a migration.</li>
  <li>Open the system status report — the wrench icon in the top header of the Ambikly admin, which opens <span class="screen-path">Ambikly → Tools</span> — click <strong>Show status</strong>, then <strong>Copy</strong>. See <a href="/system-status">System status</a>.</li>
</ol>

<div class="ui-tip"><strong>Tip:</strong> The system status report contains no payment credentials, API keys, license keys or customer data. It is safe to paste into a ticket or a forum post.</div>

## Where to get help

| Channel | Who it is for | What to expect |
|---|---|---|
| These docs | Everyone | Reference for every screen, field and endpoint |
| [wordpress.org/plugins/ambikly](https://wordpress.org/plugins/ambikly/) support forum | Free core users | Public threads, answered as time allows |
| support@ambikly.com | Pro and Agency license holders | Priority email support |
| support@ambikly.com with a `Security:` subject | Anyone | Private handling — see below |

### The documentation

Start here even when you intend to write in. Most answers are on a page:

<div class="ak-cards">
<a class="ak-card" href="/troubleshooting"><span class="ak-card__icon">🔧</span><h3>Troubleshooting</h3><p>Symptom-first fixes for the problems stores actually hit.</p><span class="ak-card__cta">Read more →</span></a>
<a class="ak-card" href="/system-status"><span class="ak-card__icon">🩺</span><h3>System status</h3><p>Every field in the diagnostic report and what a bad value means.</p><span class="ak-card__cta">Read more →</span></a>
<a class="ak-card" href="/faq"><span class="ak-card__icon">❓</span><h3>FAQ</h3><p>Honest answers, including what does not work yet.</p><span class="ak-card__cta">Read more →</span></a>
<a class="ak-card" href="/settings"><span class="ak-card__icon">⚙️</span><h3>Settings reference</h3><p>Every setting, what it does, and its default.</p><span class="ak-card__cta">Read more →</span></a>
</div>

### The WordPress.org support forum

For the free plugin, post in the support forum on the
[WordPress.org plugin page](https://wordpress.org/plugins/ambikly/). Threads are public, which is
useful — someone else with the same symptom finds your thread later.

Because they are public, never post license keys, API keys, admin credentials, customer names or
order contents. Paste the system status report instead; it carries none of those.

### Priority email for Pro and Agency

Pro and Agency license holders get priority email support at
**[support@ambikly.com](mailto:support@ambikly.com)**.

Write from the email address on the license, or include the email the license was purchased under.
Support has to be able to match your message to a license before it can be treated as priority.

<div class="pro-callout">
  <div class="pro-callout__head"><span class="pro-callout__badge">PRO</span><span class="pro-callout__title">Priority email support</span></div>
  <p class="pro-callout__desc">Pro and Agency licenses include priority email support alongside all 35 add-ons and updates for the license term.</p>
  <a class="pro-callout__cta" href="https://ambikly.com/pricing/">See pricing →</a>
</div>

## What to include in a report

Six things. The first four are enough for most reports.

| Include | Why it matters |
|---|---|
| **The system status report** | Versions, environment, missing tables, gateways and add-ons in one paste. Removes a whole round trip |
| **What you expected, and what happened** | Two sentences in that order. "I expected the order to be marked paid. It stayed in Pending." |
| **Steps to reproduce** | Numbered, starting from a screen anyone can open. If it only happens sometimes, say how often |
| **The exact error text** | Copied verbatim, not paraphrased. Error strings map to specific code paths; a summary does not |
| **The order number** | If an order is involved. It lets support look at exactly the right record |
| **Screenshots** | For anything visual — a wrong total, a missing field, an unexpected admin notice. Crop out customer names |

### For background-work problems

If something that should have happened in the background did not — an email, a webhook, a
subscription renewal — include the failing record itself, not just its absence:

- **A failed job entry**, from `GET /wp-json/ambikly/v1/jobs/failed`. Include the whole row: `id`,
  `hook`, `group_slug`, `attempts`, `max_attempts`, `last_error`, `run_at`, `updated_at`. The
  `last_error` field is the single most useful line in the report.
- **A webhook delivery entry**, from the delivery log on
  <span class="screen-path">Ambikly → Webhooks</span>. Include the status code, the duration, the
  error, and the truncated response body.
- **The queue counts**, from `GET /wp-json/ambikly/v1/jobs/status`. A pending count that only grows
  is a different problem from a job that fails repeatedly.

See [System status](/system-status) for how to read all three.

### For payment problems

Add the gateway's own view of the event. For Stripe, that is the webhook attempt in the Stripe
dashboard with the response code it recorded — `503` and `400` mean two different things and point
at two different fixes. For PayPal, confirm whether the payment appears in your **live** account,
since PayPal runs in sandbox until its `mode` setting is changed in the database.

Never send API keys, secret keys or webhook signing secrets. Support never needs them.

See [Stripe](/payments-stripe) and [PayPal](/payments-paypal).

### A good report looks like this

> **Expected:** the customer's card order to be marked paid.
> **Happened:** it stayed in Pending. Three orders since Tuesday, all Stripe.
>
> **Steps:** 1. Add a product to the cart. 2. Check out with Stripe. 3. Pay with a live card.
> 4. Order lands on the thank-you page but stays Pending in
> <span class="screen-path">Ambikly → Orders</span>.
>
> **Error:** Stripe's dashboard shows the webhook attempt returning
> `503 {"error":"Webhook secret not configured"}`.
>
> **Order:** #1043.
>
> **System status:** attached.

That report can be answered on the first reply. A report that says "orders aren't working" cannot.

## Security reports

Report a suspected security issue **privately**. Do not open a public forum thread, and do not post
details in a comment anywhere.

<ol class="step-list">
  <li>Email <a href="mailto:support@ambikly.com">support@ambikly.com</a> with <strong>Security:</strong> at the start of the subject line.</li>
  <li>Describe the issue, the affected version, and how to reproduce it.</li>
  <li>Include the impact as you see it, and any proof-of-concept you have.</li>
  <li>Give time for a fix before disclosing publicly.</li>
</ol>

Full policy and scope: [ambikly.com/security/](https://ambikly.com/security/).

Please do not run automated scanners against sites you do not own, and do not test against a live
store that is taking real orders — yours or anyone else's.

## Refunds

- **14 days on a first purchase.** If Ambikly Pro is not right for you, ask within 14 days of a
  first purchase and you will be refunded.
- **Renewals are not refundable.** A renewal continues a license you have already used and
  evaluated. Cancel before a renewal bills if you do not intend to continue.

Full policy: [ambikly.com/refund/](https://ambikly.com/refund/).

If you are unsure whether Pro does what you need, ask before buying — a question costs less than a
refund request. Note in particular that the free core has no white-label option and no storefront
template-override system, and that a handful of Pro features are still narrower than they sound;
the [FAQ](/faq) lists those plainly.

## What support covers

### Covered

| Area | Examples |
|---|---|
| Ambikly's own behavior | A screen that errors, a setting that does not apply, a calculation that is wrong |
| Configuration questions | How to set up a tax rate, a shipping zone, a coupon rule |
| Ambikly Pro add-ons | Any of the 35 add-ons, with a valid license |
| Licensing and updates | Activation, moving a license to a new domain, updates not appearing |
| The REST API and hooks | Documented endpoints, payload shapes, hook arguments and firing order |
| Bug reports | With reproduction steps, against a current version |

### Not covered

| Area | Why | Where to go |
|---|---|---|
| Your hosting | Mail delivery, WP-Cron, PHP limits, database permissions and outbound HTTP are your host's domain | Your host's support |
| Your theme | Styling conflicts, layout problems, template behavior | Your theme's author |
| Third-party plugins | Conflicts with plugins Ambikly has no relationship with | That plugin's author |
| Custom code | Code you or a developer wrote against Ambikly's hooks and API | [Developer overview](/developers/) |
| Custom development | Building a feature, writing an add-on, bespoke integration work | Hire a developer |
| Data recovery | Restoring data lost to a failed update, a bad migration or a partial restore | Your backups |
| Server administration | Migrations, staging setups, SSL certificates, CDNs | Your host or sysadmin |

A useful test: if the problem reproduces on a clean WordPress install with only Ambikly active,
it is an Ambikly problem. If it disappears there, the cause is in your theme, another plugin or
your host — and finding out which is the fastest thing you can do before writing in.

<div class="ui-warn"><strong>Careful:</strong> Support cannot recover data. Take a backup before every update, before re-running database migrations, and before any bulk import. See <a href="/changelog">Changelog</a> for the safe update order.</div>

### Known limitations are not bugs

Some behavior that looks broken is documented and deliberate, or simply not built yet. Reporting it
is still welcome — it helps prioritize — but it will not be fixed by a support reply. The main
ones:

| Behavior | Status |
|---|---|
| PayPal runs in sandbox with no UI switch | Known limitation — [PayPal](/payments-paypal) |
| The Stripe signing secret has no admin field | Known limitation — [Stripe](/payments-stripe) |
| Tax postcode ranges and comma lists do not match | Not implemented — [Tax](/tax) |
| Product shipping classes are never read | Not implemented — [Shipping](/shipping) |
| Coupons have no category restriction | Not implemented — [Coupons](/coupons) |
| No storefront template overrides | Not implemented — [Template overrides](/developers/templates) |
| Customers cannot edit saved addresses | Not implemented — [Customers](/customers) |
| No shipping, cancellation or refund emails | Not implemented — [Emails](/emails) |
| Grouped and external products have no admin UI | Not implemented — [Products](/products) |
| Orders and customers do not import from other plugins | Not supported — [Import & export (CSV)](/import-export) |

The [FAQ](/faq) covers each of these with the detail behind it.

## Response expectations

- **Priority email** is for Pro and Agency license holders, matched against the license on your
  account.
- **The WordPress.org forum** is volunteer-paced and public. Free core questions are welcome there.
- **Security reports** are handled privately and take precedence.

A report that arrives with the system status attached, the exact error quoted and steps to
reproduce is answered materially faster than one that does not — not as a policy, but because
there is nothing left to ask before someone can start looking.

## Quick links

| Need | Link |
|---|---|
| Symptom-first fixes | [Troubleshooting](/troubleshooting) |
| The diagnostic report | [System status](/system-status) |
| Honest answers about limits | [FAQ](/faq) |
| Versions and safe update order | [Changelog](/changelog) |
| Free plugin downloads and forum | [wordpress.org/plugins/ambikly](https://wordpress.org/plugins/ambikly/) |
| License account and Pro downloads | [store.ambikly.com](https://store.ambikly.com) |
| Pricing | [ambikly.com/pricing/](https://ambikly.com/pricing/) |
| Security policy | [ambikly.com/security/](https://ambikly.com/security/) |
| Refund policy | [ambikly.com/refund/](https://ambikly.com/refund/) |
| Email support | [support@ambikly.com](mailto:support@ambikly.com) |
