---
title: Troubleshooting
description: Symptom-first fixes for the problems Ambikly stores actually hit — blank store pages, REST 404s, pending card orders, PayPal sandbox, missing emails, tax, shipping, jobs and webhooks.
prev:
  text: Addon SDK
  link: /developers/addon-sdk
next:
  text: System status
  link: /system-status
---

# Troubleshooting

Find the symptom, check the listed causes in order, apply the fix. Each section says why the
problem happens so you can tell whether it will come back.

Start with the System status report — the wrench icon in the top header of the Ambikly admin, not
the sidebar. It answers half of these questions on its own: missing tables, wrong database version,
which gateways are actually available, which add-ons are enabled. See
[System status](/system-status).

::: tip Not everything here is a bug
Several items on this page are features with no admin UI yet — PayPal's sandbox mode and the
Stripe webhook secret above all. Those sections say so plainly.
:::

## Storefront

### Store pages are blank, or show a raw shortcode

**What to check**

<ol class="step-list">
  <li>Confirm the Ambikly plugin is active under <span class="screen-path">Plugins → Installed Plugins</span>.</li>
  <li>Open the page in the editor and confirm its content is the shortcode — <code>[ambikly_shop]</code>, <code>[ambikly_cart]</code>, <code>[ambikly_checkout]</code>, <code>[ambikly_account]</code> or <code>[ambikly_thank_you]</code> — or the matching block.</li>
  <li>Check that the page slug recorded for the store matches the page you are looking at.</li>
</ol>

**Why it happens**

A raw shortcode means no handler was registered — the plugin is inactive, or the content was
pasted into a page-builder widget that escapes shortcodes.

A blank page is the opposite case: the shortcode ran, but the page the store points at is not the
one you are looking at. Ambikly records its page slugs in the `ambikly_settings_pages` option,
written once at setup. Rename or replace a page later and the cart, checkout and account links
keep pointing at the old slug.

**The fix**

Re-create the page with the correct shortcode. Ambikly refuses to adopt an existing `/shop` or
`/cart` page unless it actually contains the Ambikly shortcode — so another plugin's page is never
silently taken over, but neither is a page you created by hand.

<div class="ui-warn"><strong>Careful:</strong> <code>ambikly_settings_pages</code> has no admin screen. It is written by the setup wizard's Pages step and by the defaults seeder, and nowhere else. Re-pointing the store at a different page means editing that option directly — through WP-CLI or <code>update_option()</code> — not through a settings field.</div>

Also check what is on the page. `[ambikly_shop]` switches to the single-product view when
`?ambikly_product=` is present; the `ambikly/product-grid` block never does. Replacing the
shortcode with that block breaks every product URL on the site.

See [Store pages](/store-pages) and [Shortcodes](/shortcodes).

### Product links go to a 404

Product URLs are query-string based: `{shop page}?ambikly_product={slug}`. There is no pretty
permalink rewrite in the free core. A 404 means the shop page slug in the link no longer resolves —
check that page still exists and is published, and link to the shop page rather than hard-coding
product URLs.

See [Store pages](/store-pages).

### Cart or checkout loads but nothing responds when you click

The storefront JavaScript loads only on pages that actually render an Ambikly shortcode or block. If
your theme or page builder outputs the content in a way the plugin never sees — a template part that
bypasses `the_content`, say — the script and stylesheet are never enqueued and the markup sits there
inert. Check the page source for `storefront.js`; if it is absent, move the shortcode into the
page's main content.

See [Blocks & store pages](/blocks).

## REST API

### REST 404s, or `/wp-json/ambikly/v1/` does not respond

**What to check**

<ol class="step-list">
  <li>Open <span class="screen-path">Settings → Permalinks</span> and confirm the structure is not <strong>Plain</strong>.</li>
  <li>Re-save the permalink settings once, even if you change nothing — this flushes rewrite rules.</li>
  <li>Request <code>/wp-json/</code> directly. If that 404s too, the problem is WordPress-wide, not Ambikly.</li>
</ol>

**Why it happens**

WordPress serves the pretty `/wp-json/` route only when permalinks are not set to Plain. With Plain
permalinks every REST request has to use the query-string form instead — `/?rest_route=/ambikly/v1/products`.
Ambikly's own admin and storefront build their URLs with `rest_url()` and follow whichever form the
site uses, but an external integration that hard-codes `/wp-json/` will 404.

**The fix**

Use a permalink structure other than Plain. If you must stay on Plain, have integrations call
`?rest_route=` instead.

Two more causes: **security plugins or host rules** that block `/wp-json/` — disable the rule and
retest; and **authentication, not routing** — a `401` or `403` means the route exists and your
request was rejected. Ambikly uses WordPress's own REST authentication, the logged-in cookie plus
an `X-WP-Nonce` header, or Application Passwords.

See [REST API](/developers/rest-api).

## Payments

### PayPal takes no real money

::: danger PayPal runs in sandbox until the option is set in the database
The PayPal gateway's `mode` setting defaults to `sandbox` and **there is no sandbox/live switch
in the admin UI**. Entering live credentials on
<span class="screen-path">Ambikly → Settings → Payment Settings</span> is not enough — the gateway
still talks to `api-m.sandbox.paypal.com`, so orders complete, the customer sees a success page,
and no real money moves.
:::

**What to check.** Place a small test order through PayPal and look for the payment in your live
PayPal account. If the order is marked paid in Ambikly but nothing appears in PayPal, you are in
sandbox.

**Why it happens.** The gateway selects the live API host only when `mode` is exactly `live`. No
admin field writes that value, so on a fresh install it is absent and the sandbox default applies.

**The fix.** Set `mode` to `live` in the payments settings group directly — through the settings
REST endpoint or a one-off `update_option()` against `ambikly_settings_payments`. Then place a real
test order and confirm the payment lands in your live PayPal account before you announce the store.

Until then, treat PayPal as disabled for real trading. To take card payments today, use
[Stripe](/payments-stripe) or an [offline method](/payments-offline).

See [PayPal](/payments-paypal).

### An order is stuck in Pending after a card payment

**What to check**

<ol class="step-list">
  <li>Open the order at <span class="screen-path">Ambikly → Orders</span> and check its payment status and transaction notes.</li>
  <li>In the Stripe dashboard, open the payment and look at the webhook delivery attempts for that event.</li>
  <li>Check the response code Stripe recorded. <code>503</code> and <code>400</code> mean two different things — see below.</li>
</ol>

**Why it happens**

Stripe checkout is a redirect flow. The customer pays on Stripe's page and returns to your
thank-you page, but the order is only marked paid when Stripe's webhook reaches
`/wp-json/ambikly/v1/stripe/webhook` and its signature verifies. Verification is mandatory —
without it, anyone who knows your site URL could forge a successful payment.

| Stripe shows | Meaning |
|---|---|
| `503 Webhook secret not configured` | No signing secret is stored, so Ambikly refuses the request outright |
| `400 Invalid signature` | A secret is stored, but it does not match the endpoint that sent the event |

::: warning The Stripe signing secret has no field in the admin UI
The payments screen exposes only the publishable key and the secret key. The webhook signing
secret is read from `webhook_secret` inside the `stripe` entry of the payments settings group and
must be written there directly — through the settings REST endpoint or `update_option()` against
`ambikly_settings_payments`. Until it is set, the webhook returns `503` and card orders never
leave Pending.
:::

**The fix**

<ol class="step-list">
  <li>Create the webhook endpoint in Stripe pointing at <code>https://your-site/wp-json/ambikly/v1/stripe/webhook</code>.</li>
  <li>Copy its signing secret and store it as <code>webhook_secret</code> under the <code>stripe</code> key in the payments settings group.</li>
  <li>Re-send the failed event from Stripe and confirm the order flips to paid.</li>
</ol>

Note that capture is always automatic — there is no manual-capture option in the UI.

See [Stripe](/payments-stripe).

### A gateway you switched on is not offered at checkout

::: danger The enable toggle alone saves nothing
On <span class="screen-path">Ambikly → Settings → Payment Settings</span>, flipping a gateway's
on/off toggle only changes the screen. Nothing is written until you open that gateway's
**Configure** panel and click **Save Gateway**. Leave the page after toggling and the change is
gone — which is an easy way to launch a store with the wrong gateways live.
:::

Toggle the gateway, open **Configure**, click **Save Gateway**, then reload the screen and confirm
the badge still reads ACTIVE. The `available_gateways` field in the system status report is the
authoritative list — it is what the server actually offers at checkout. Checkout separately rejects
an order with *"Selected payment method is not available"* when the chosen gateway left that set
between the customer loading the page and submitting.

See [Payments overview](/payments) and [System status](/system-status).

## Email

### Emails are not arriving

Work through these in order — the first two are far more common than the rest.

<ol class="step-list">
  <li><strong>The kill switch.</strong> <span class="screen-path">Ambikly → Emails → General</span> has a <strong>Disable all emails</strong> toggle. When it is on, every Ambikly transactional email is suppressed before it reaches WordPress. It is meant for testing and staging, and it is easy to leave on.</li>
  <li><strong>The per-event toggle.</strong> Each event has its own customer and admin enable flag. They default to on, so if one is off somebody turned it off.</li>
  <li><strong>The "From" address.</strong> An empty or invalid From name/address makes PHPMailer reject the message outright, and nothing surfaces the cause in the admin. Set both under <span class="screen-path">Ambikly → Emails → General</span>.</li>
  <li><strong>Your host.</strong> Many hosts block or silently drop <code>wp_mail()</code>. Install an SMTP plugin and send a test message that has nothing to do with Ambikly. If that does not arrive either, the problem is the host, not the store.</li>
  <li><strong>Admin recipients.</strong> Admin-targeted emails go to the newline-separated list under <span class="screen-path">Ambikly → Emails → General</span>. If the list is empty, WordPress's own administration email address is used as a fallback — so an empty list is not the cause, but a list containing one stale address is.</li>
</ol>

**What Ambikly can and cannot send.** Only four transactional emails are editable: order
notification and order status change, each in a customer and an admin version. There are no
shipping-notification, cancelled-order or refund-notification emails in the free core, so "the
refund email never arrived" is expected — that email does not exist. Two further emails are
hard-coded: the low-stock alert and the company buyer invitation. **Both call WordPress's mail
function directly and therefore bypass the "Disable all emails" switch**, which is why they still
go out on a staging site with everything supposedly off.

See [Emails](/emails).

## Products, stock and coupons

### "Insufficient stock" or "no longer available" at checkout

Working as designed. Checkout re-validates every line immediately before taking payment and refuses
the order rather than overselling. Variations are checked independently of their parent, so a
sold-out variation is rejected even when the parent still has stock overall.

| Message | Cause |
|---|---|
| `{product} (no longer available)` | The product is no longer published — unpublished or deleted after it went into the cart |
| `{product} (have 2, need 5)` | Managed stock is lower than the quantity ordered |

**The fix**: restock the product, republish it, or ask the customer to reduce the quantity. The
cart keeps its contents — only the order is refused.

See [Inventory & stock](/inventory).

### Stock dropped for an order that was never paid

**Stock is decremented when the order is created, not when it is paid.** An abandoned card payment,
a failed gateway response or an offline order awaiting a bank transfer all hold their stock
meanwhile. Cancel or delete a pending order that will never be paid to release it — on a low-stock
product, a handful of abandoned checkouts can make a product look sold out.

See [Inventory & stock](/inventory).

### A refund did not restock, and the customer heard nothing

Three separate behaviors, all expected:

| What you noticed | Why |
|---|---|
| No email reached the customer | Refunds do not go through the status-change path, so no status-change email fires — and no refund email template exists |
| A partial refund did not restock | Stock is restored only on a **full** refund |
| Download links still work after a partial refund | A partial refund leaves the order's grants in place; only a full refund or a cancellation revokes access |

Tell the customer yourself, and adjust stock by hand after a partial refund.

See [Refunds & cancellations](/refunds) and [Emails](/emails).

### A coupon is refused at checkout

Each refusal has a distinct message, and each maps to one rule:

| Message | Check |
|---|---|
| Coupon does not exist | The code, including case and stray spaces |
| Coupon is not active or has expired | Status and expiry date |
| Coupon usage limit reached | Total usage limit |
| You have already used this coupon… | Per-customer usage limit |
| Minimum order of $X required | Minimum spend |
| Maximum order of $X exceeded | Maximum spend |
| Coupon not valid for this email | The allowed-emails restriction |
| Coupons are not currently accepted | Coupons are switched off for the store |

Product include and exclude restrictions and the email restriction both work. **Category
restriction does not exist** — if you expected a coupon to apply only to one category, it will
not, regardless of what you configured elsewhere.

See [Coupons](/coupons).

### A download link expired or hit its limit

The download endpoint refuses a grant for one of these reasons, in this order:

| Message | Meaning |
|---|---|
| Invalid download token | The link is wrong, truncated, or the grant was deleted |
| Download link has expired | Past the product's expiry window, set in days at purchase time |
| Download limit reached | The per-grant counter hit the product's download limit |
| This order has been cancelled | The order is cancelled or refunded — access is revoked regardless of payment status |
| Payment is not yet confirmed for this order | The order is not paid, partially paid, processing or completed |

Expiry and limit are stamped onto the grant when the order is paid, from the product's stored values
at that moment — changing the product later does not change grants already issued, so reissue the
grant instead.

<div class="ui-warn"><strong>Careful:</strong> The product editor has no input for the download limit or the expiry window, even though both columns exist and are enforced. Unless a value was set out of band — through the REST API or directly in the database — a download is unlimited and never expires. "The limit isn't being applied" usually means no limit was ever stored, not that enforcement is broken.</div>

See [Digital downloads](/digital-downloads).

## Tax and shipping

### Tax is not being applied

**What to check**

<ol class="step-list">
  <li><span class="screen-path">Ambikly → Settings → Tax &amp; Duties</span> — taxes must be enabled. With taxes off, calculation returns zero no matter how many rates exist.</li>
  <li>The rate rows: country, state, postcode and city all have to match the customer's address.</li>
  <li>Which address is used — calculation is by the shipping or the billing address.</li>
</ol>

**Why it happens**

A rate matches when each of its country, state, postcode and city columns is either exactly the
customer's value or `*`. There is no other matching logic.

::: danger Postcode ranges and comma lists do not work
The tax panel's help text suggests you can write a range such as `SW1A...SW1Z` or a comma-separated
list. **Neither is implemented.** The lookup does a plain equality match plus `*`. A rate row
containing a range or a list matches nobody, and the tax silently never applies.
:::

Two more limits: the **Store Address** calculation option has no backend behavior, so calculation
is by shipping or billing address only; and the rate table's `city` column exists in the data model
but has no column in the admin table, so you cannot edit it from the screen.

**The fix.** Replace ranges and lists with one row per exact postcode, or a single row with `*` in
the postcode column covering the whole country or state.

See [Tax](/tax).

### Shipping shows the wrong rate

**Why it happens**

Zones are evaluated in their stored order — position first, then id — and the **first** zone whose
regions match the destination wins, so a broad zone sitting above a specific one takes every order
the specific zone was meant to catch. There is also a fallback that surprises people: if no zone
matches at all, the **last** zone in the list is used as a synthetic "Rest of World" zone. If your
last zone is a domestic flat rate, international customers get the domestic rate.

**The fix**

<ol class="step-list">
  <li>Order zones from most specific to least specific.</li>
  <li>Make the last zone in the list a deliberate catch-all — a Rest of World zone with rates you are happy to charge anyone.</li>
  <li>Check free shipping minimums: a free-shipping method is hidden entirely, not shown at full price, when the cart subtotal is below its minimum.</li>
</ol>

Two limits: the flat-rate **per-item cost has no admin field** — only Title, Cost and Enabled are
editable, and per-item is created as 0 — and **product shipping classes are cosmetic**, a
hard-coded list that is never read when rates are calculated.

See [Shipping](/shipping).

## Background jobs and webhooks

### Background jobs are not running

Ambikly runs deferred work — webhook deliveries above all — through a durable job queue in the
`ambikly_jobs` table, driven by a WP-Cron tick every minute.

**What to check**

| Check | How |
|---|---|
| Queue depth | `GET /wp-json/ambikly/v1/jobs/status` returns pending, running and failed counts |
| Failed jobs | `GET /wp-json/ambikly/v1/jobs/failed` returns up to 200 rows with `last_error` |
| Cron is firing | Confirm WP-Cron is not disabled, or that a real system cron calls it |

**Why it happens**

WP-Cron only fires on an incoming request, so on a low-traffic site the one-minute tick is bounded
by traffic rather than the clock — jobs run late rather than never. If `DISABLE_WP_CRON` is set and
no system cron replaces it, nothing runs at all. Otherwise, individual jobs fail on their own
terms: a job retries up to five attempts by default, backing off
1 minute, 5 minutes, 30 minutes, 2 hours, 6 hours and then once a day; when attempts run out the
row is kept as `failed`. Successful jobs are deleted, so an empty table is a healthy table — there
is no "completed" state to look for. One error is worth recognizing: `No handler registered for job
hook: {hook}` means nothing is listening for that job type, usually because the add-on that would
handle it is disabled or the license lapsed.

**The fix**

Fix the cause, then retry: `POST /wp-json/ambikly/v1/jobs/{id}/retry`, which resets the attempt
counter to zero. Reading queue status needs store-view access; retrying needs store-manage access.
A job whose worker died mid-flight is reclaimed back to pending after 10 minutes, so a crash costs
a delay rather than the work.

See [Webhooks](/developers/webhooks).

### Webhooks are not delivering

**What to check**

<ol class="step-list">
  <li>Open <span class="screen-path">Ambikly → Webhooks</span> and check the webhook is active.</li>
  <li>Open its delivery log. Every attempt is recorded with status code, duration, an error string and a truncated request and response body.</li>
  <li>Use <strong>Send test event</strong>. A test fires synchronously and reports the real outcome immediately, instead of being queued.</li>
</ol>

**Why it happens**

| Symptom in the log | Cause |
|---|---|
| Transport error naming a blocked host | The URL resolves to a loopback, private or reserved IP address |
| HTTP 4xx | The receiver rejected the request — often signature verification on their side |
| HTTP 5xx or timeouts | The receiver is failing or slow; the timeout is 5 seconds |
| No entries at all | The webhook is inactive, or not subscribed to that event |

Deliveries go out through `wp_safe_remote_post()`, WordPress's SSRF-hardened variant, which
resolves the host and refuses loopback, private and reserved ranges before making the request —
which is why a webhook pointed at `localhost`, `127.0.0.1` or an internal `10.x`/`192.168.x`
address never fires. The scheme is restricted to `http` or `https` at save time.

Delivery is queued, never inline, so a slow receiver never delays a checkout. A failed delivery is
retried up to 8 attempts on the queue's backoff schedule, and the last 200 attempts per webhook are
kept. If the receiver rejects your signature, check it computes HMAC-SHA256 over the **raw** request
body using the webhook's secret and compares against `X-Ambikly-Signature: sha256=<hex>`.

See [Webhooks](/developers/webhooks).

## Pro and licensing

### A Pro add-on is missing, or stopped working

**What to check**

<ol class="step-list">
  <li><span class="screen-path">Ambikly → License</span> — the license status must read valid.</li>
  <li><span class="screen-path">Ambikly → Addons</span> — the add-on must be enabled.</li>
  <li>The System status report's <code>addons</code> list, which shows slug, version and enabled flag as stored.</li>
</ol>

**Why it happens**

Add-ons are gated on the license twice. Enabling one without a valid license is refused with a
`license_required` error, and every enabled add-on is re-checked on each request before it boots. A
license that later expires or is deactivated leaves the enabled flag alone but stops the add-on's
hooks and routes from registering — so it stops acting, and store staff see an admin notice saying
how many add-ons are paused. Settings and data are untouched. Also check the free core's version:
Ambikly Pro hard-checks for `0.0.10` or newer and does not load at all below that.

**The fix.** Reactivate or renew the license, then reload the admin. Nothing needs re-enabling.

See [Install & activate a license](/pro-install) and [Managing add-ons](/addons-manage).

### After a migration or clone, add-ons are paused

**Why it happens**

A license is activated against a specific site URL — the activation call sends `home_url()`, and the
license server records that domain. Copy the site to a new domain and the stored license details no
longer match the domain making the request, so revalidation returns a status other than valid and
every enabled add-on stops booting. Deactivating leaves the stored key in place, so the key you need
is usually still in the field.

**The fix**

<ol class="step-list">
  <li>On the old domain, deactivate the license if that site is still reachable — this frees a site slot.</li>
  <li>On the new domain, open <span class="screen-path">Ambikly → License</span> and activate the same key again.</li>
  <li>Reload the admin and confirm the paused-add-ons notice is gone.</li>
</ol>

Revalidation runs daily, so a license fixed at the store's end may take until the next check to
apply locally; re-activating from the License screen applies immediately. If you are out of site
activations, check the activations left on the same screen — Pro covers one site, Agency ten.

See [Install & activate a license](/pro-install).

### The database version looks wrong after an update

Migrations run automatically on `admin_init` and `plugins_loaded`, so loading any admin page once
usually closes the gap between `db_version` and `expected_db_version`. If it persists, run
`wp ambikly upgrade-db`. See [WP-CLI](/developers/wp-cli) and [System status](/system-status).

## When none of this helps

Collect the System status report, the exact error text, the order number if there is one, and the
failed job or webhook delivery entry. Then see [Support](/support) — a report with those four
things attached usually gets a real answer on the first reply instead of a request for more
information.
