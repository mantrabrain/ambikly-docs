---
title: Go-live checklist
description: Everything to verify before your Ambikly store takes real money — HTTPS, permalinks, live gateway credentials, tax, shipping, emails, backups, and the PayPal sandbox trap.
prev:
  text: Your first order
  link: /first-order
next:
  text: A tour of the admin
  link: /admin-tour
---

# Go-live checklist

Work down this list before you accept a real customer. Each row is a single verifiable thing, with the screen to check it on. Nothing here is optional on a store that takes money.

Read the PayPal warning first — it is the one item on this page that silently takes payments into an account you cannot withdraw from.

## Read this before you enable PayPal

::: warning PayPal runs in sandbox mode until you change the database
PayPal's `mode` setting defaults to `sandbox`, and **there is no sandbox/live switch anywhere in the Ambikly admin**. Enter live credentials, enable the gateway, and the plugin still sends every transaction to `api-m.sandbox.paypal.com`. Checkout appears to work. Orders are created. No real money ever moves.

The only fix is to set the option directly. With WP-CLI:

```bash
wp option patch update ambikly_settings_payments paypal mode live
```

Or in PHP, from a mu-plugin or one-off snippet:

```php
$payments = get_option( 'ambikly_settings_payments', [] );
$payments['paypal']['mode'] = 'live';
update_option( 'ambikly_settings_payments', $payments );
```

Then verify with a real £1/$1 purchase using a real PayPal account, and confirm the transaction lands in your live PayPal dashboard — not in the sandbox one. If it does not appear there, the flag did not take.
:::

If you are not using PayPal, skip that entirely. Stripe reads its own test/live mode from the key prefix you paste in, so it has no equivalent trap.

## The checklist

| # | Check | Where | Done when |
|---|---|---|---|
| 1 | **HTTPS everywhere** | <span class="screen-path">Settings → General</span> | WordPress Address and Site Address both start `https://`, and the padlock shows on Shop, Cart, Checkout and My Account |
| 2 | **Permalinks are not Plain** | <span class="screen-path">Settings → Permalinks</span> | Post name (or any structure other than Plain) is selected and saved |
| 3 | **Live payment credentials** | <span class="screen-path">Ambikly → Settings → Payment Settings</span> | Stripe keys are `pk_live_` / `sk_live_`; PayPal `mode` is `live` in the database; at least one method is enabled |
| 4 | **Tax configured** | <span class="screen-path">Ambikly → Settings → Tax & Duties</span> | Taxes enabled or deliberately disabled; a rate exists for every region you sell into; the basis is shipping or billing |
| 5 | **Shipping configured** | <span class="screen-path">Ambikly → Settings → Shipping</span> | Every region you ship to is covered by a zone, and each zone has at least one enabled method with a real cost |
| 6 | **Emails deliverable** | <span class="screen-path">Ambikly → Emails</span> | A test send arrives, from a From address on your own domain, and is not in spam |
| 7 | **Store pages published** | <span class="screen-path">Pages</span> | Shop, Cart, Checkout, My Account and Order Received are published, each with exactly one Ambikly shortcode |
| 8 | **Test order placed and refunded** | <span class="screen-path">Ambikly → Orders</span> | A real transaction on live credentials, checked end to end, then refunded and reconciled at the gateway |
| 9 | **System status clean** | <span class="screen-path">Ambikly → Tools</span> | `missing_tables` empty, `db_version` equals `expected_db_version`, `is_ssl` true |
| 10 | **Backups running** | Your host or backup plugin | A restorable backup of both files and database, taken today, and a restore you have actually tested |

The rest of this page expands each row.

## 1. HTTPS

Checkout collects names, addresses and — with Stripe — card details entered into an iframe on your page. Serving that over HTTP is indefensible, and both Stripe and PayPal will refuse to behave properly.

<ol class="step-list">
  <li>Install a certificate through your host. Almost every host offers Let's Encrypt free.</li>
  <li>Set both WordPress Address and Site Address to the <code>https://</code> form under <span class="screen-path">Settings → General</span>.</li>
  <li>Force a redirect from HTTP at the server or with a plugin.</li>
  <li>Load Shop, Cart, Checkout and My Account and confirm no mixed-content warnings. A single HTTP image on the checkout page breaks the padlock.</li>
</ol>

Confirm it in System status: `is_ssl` should be `true`.

## 2. Permalinks

Ambikly registers no rewrite rules, so any permalink structure works — but Plain produces URLs like `/?page_id=42&ambikly_product=blue-mug`, which are ugly, hard to share, and awkward for search engines.

Set <span class="screen-path">Settings → Permalinks</span> to **Post name** and save. You never need to flush rewrite rules for Ambikly specifically.

Remember that product URLs remain query-string based in the free core — `{shop page}?ambikly_product={slug}` — regardless of this setting. That is expected and is canonicalized properly. See [Store pages](/store-pages).

## 3. Payment credentials

Go through every gateway you intend to enable and confirm it is pointed at production.

| Gateway | What to verify |
|---|---|
| Stripe | Keys start `pk_live_` and `sk_live_`, not `pk_test_` / `sk_test_`. The webhook endpoint is registered in your live Stripe dashboard and its signing secret is saved. |
| PayPal | Live Client ID and Secret from the live app, **and** `mode` set to `live` in the database. See the warning above. |
| Cash on Delivery | Enabled only if you genuinely accept cash. Leaving it on by accident is the most common go-live mistake — it was on by default. |
| Bank Transfer | Enabled only with real account details filled into the instructions field, since those are what the customer receives. |
| Check Payments | Enabled only with a real payable-to name and mailing address. |
| Manual | Safe to leave on. It is never shown to the public — only to logged-in users who can manage the store. |
| Net Terms | Only relevant if you sell to B2B companies on invoice. |

<div class="ui-warn"><strong>Careful:</strong> Stripe's capture mode is always automatic. There is no manual-capture field in the admin, so you cannot authorize now and capture on shipment. Plan your fulfillment around that. See <a href="/payments-stripe">Stripe</a>.</div>

Disable everything you do not use. An enabled gateway with blank credentials still shows at checkout in some configurations and produces failed orders.

<div class="ui-warn"><strong>Careful:</strong> On the Payment Settings screen, a gateway's enable toggle only changes the form. Nothing is written until you open that gateway's <strong>Configure</strong> panel and click <strong>Save Gateway</strong>. Reload the page after saving and confirm each toggle is where you left it — this is an easy way to go live with a gateway you thought you had turned off.</div>

## 4. Tax

Getting this wrong is expensive in a way the others are not.

<ol class="step-list">
  <li>Decide whether you charge tax at all. If not, switch taxes off under <span class="screen-path">Ambikly → Settings → Tax &amp; Duties</span> and move on.</li>
  <li>Set <strong>Calculate based on</strong> to the shipping address (normal for physical goods) or the billing address (normal for digital).</li>
  <li>Add a rate for every country or state you have an obligation in. Set the store's default with a <code>*</code> country rate if you need a catch-all.</li>
  <li>Decide whether your entered prices include tax, and set that consistently.</li>
  <li>Place a test order into each tax region and check the tax line on the order.</li>
</ol>

Two limits to design around:

::: warning Postcode matching is exact
The tax panel's help text suggests postcode ranges like `SW1A...SW1Z` and comma-separated lists work. They do not. Rate matching is a plain equality check plus the `*` wildcard, so one rate row matches one exact postcode, or everything. If you need postcode-level rates, create one row per postcode.
:::

The "Store Address" calculation option that appears in Settings has no implementation behind it — calculation is by shipping or billing address only. The tax rate `city` column exists in the database but has no column in the admin table, so it is not editable. See [Tax](/tax).

## 5. Shipping

<ol class="step-list">
  <li>List every country you actually ship to.</li>
  <li>Under <span class="screen-path">Ambikly → Settings → Shipping</span>, confirm a zone covers each one. The seeded "Rest of World" zone matches everything with <code>*</code>, so start by deciding whether you want that catch-all at all.</li>
  <li>Give every zone at least one enabled method with a real cost. The seed created a $10 flat rate and free shipping over $100 — change those or delete them.</li>
  <li>Place a test order to an address in each zone and confirm the method appears and prices correctly.</li>
</ol>

<div class="ui-warn"><strong>Careful:</strong> A destination matched by no zone offers <strong>no shipping methods</strong>, and checkout cannot complete. Either add a catch-all zone or make it clear on your store which countries you serve.</div>

Two things not to rely on: a shipping method's per-item cost is always 0 with no field to change it, and product shipping classes are a hard-coded cosmetic list that the shipping engine never reads. Build your rates from zone costs alone. See [Shipping](/shipping).

## 6. Emails

If order emails do not arrive, customers assume the order failed and either buy again or charge back.

<ol class="step-list">
  <li>Under <span class="screen-path">Ambikly → Emails</span>, set the From name and From address. Use an address on your own domain — not gmail.com, and not <code>wordpress@yoursite.com</code>.</li>
  <li>Send a test of each of the four templates and confirm each one arrives.</li>
  <li>Check the spam folder. If they land there, install an SMTP plugin and send through a real mail service rather than PHP mail.</li>
  <li>Set up SPF, DKIM and DMARC for your sending domain.</li>
  <li>Confirm the admin recipient address is a mailbox somebody actually reads.</li>
  <li>Check the templates for placeholder text left over from the defaults.</li>
</ol>

Plan around the fact that only four templates exist: order notification to customer and admin, and order status change to customer and admin. There is no shipping-notification email, no cancellation email and no refund email. If your customers expect shipment notice, you will be sending it another way. See [Emails](/emails).

## 7. Store pages

<ol class="step-list">
  <li>Under <span class="screen-path">Pages</span>, confirm Shop, Cart, Checkout, My Account and Order Received are all published, not drafts.</li>
  <li>Confirm each carries exactly one Ambikly shortcode, and that no shortcode appears on two pages.</li>
  <li>Trash any leftover duplicates from a re-run of the wizard — <code>shop-2</code>, <code>cart-2</code> and friends.</li>
  <li>Confirm <code>ambikly_settings_pages</code> maps each key to the slug of the right page: <code>wp option get ambikly_settings_pages --format=json</code>.</li>
  <li>Add Shop and My Account to your navigation menu. Do <strong>not</strong> add Order Received — nobody should reach it except after buying.</li>
  <li>Write and link your Terms, Privacy, Refund and Shipping policy pages. Customers and card networks both expect them.</li>
</ol>

See [Store pages](/store-pages).

## 8. A real test order on live credentials

Your earlier offline test proved the mechanics. This one proves the money.

<ol class="step-list">
  <li>Buy a real, cheap product from your own storefront, logged out, using a real card or a real PayPal account.</li>
  <li>Confirm the order appears at <span class="screen-path">Ambikly → Orders</span> with payment status <strong>Paid</strong>.</li>
  <li>Confirm the charge appears in your <strong>live</strong> Stripe or PayPal dashboard — this is the step that catches sandbox mode.</li>
  <li>Confirm the customer and admin emails arrived.</li>
  <li>Open the invoice and check it for placeholder text.</li>
  <li>For a digital product, confirm the download grant appeared and the file downloads.</li>
  <li>Refund the order in full from the order screen, and confirm the refund lands at the gateway too.</li>
  <li>Confirm stock was restored by the full refund.</li>
</ol>

<div class="ui-tip"><strong>Tip:</strong> Remember that a refund sends no email and fires no status-change notification. If you are testing whether customers get told about refunds, the answer is that they do not — plan a manual step.</div>

## 9. System status

Open the Ambikly admin and click the **wrench icon in the top-right header** — the Tools screen is not in the sidebar. On the **System status** card, click **Show status**.

| Field | Wanted value |
|---|---|
| `plugin.version` | 0.0.10 or newer |
| `plugin.db_version` | Equal to `expected_db_version` |
| `database.missing_tables` | An empty list |
| `environment.php_version` | 7.4 or newer; 8.1+ preferred |
| `environment.wp_version` | 5.4 or newer |
| `environment.is_ssl` | `true` |
| `environment.memory_limit` | 128M or more |
| `commerce.currency` | Your real currency |
| `commerce.available_gateways` | Exactly the gateways you meant to enable |
| `addons` | Only the add-ons you meant to turn on |

Click **Copy** and keep the output. It is the first thing support will ask for. See [System status](/system-status).

## 10. Backups

A store is the one kind of WordPress site where losing a day of data means losing orders you were legally committed to fulfilling.

<ol class="step-list">
  <li>Confirm database backups run at least daily, and more often if you take orders overnight.</li>
  <li>Confirm files are backed up too — the media library holds your digital product files.</li>
  <li>Confirm backups are stored off the server. A backup on the same disk is not a backup.</li>
  <li><strong>Restore one to a staging site.</strong> An untested backup is a guess.</li>
  <li>Take a fresh backup immediately before launch and immediately before every future update.</li>
</ol>

## Worth doing, not blocking

| Item | Why |
|---|---|
| Set your store address, email and phone | Used on invoices and in emails. <span class="screen-path">Ambikly → Settings → Store Settings</span> |
| Configure the invoice prefix and starting number | Accountants care. <span class="screen-path">Ambikly → Settings → Invoice & Packing</span> |
| Create staff accounts with the Store Manager role | Nobody should run the store as an Administrator day to day. See [Roles & permissions](/roles) |
| Set the low-stock threshold | Low-stock alerts are hard-coded and not editable, but the threshold is yours |
| Review Visibility on every product | A product set to "Hidden — direct link only" will not appear in the shop |
| Set up webhooks | 9 events, HMAC-signed. See [Webhooks](/developers/webhooks) |
| Export your catalog | A CSV of products, kept off-site. <span class="screen-path">Ambikly → Tools</span> |

## Things that are not implemented — plan around them

Do not build a launch plan on any of these. Each is verified absent from the current release.

| Expectation | Reality |
|---|---|
| A sandbox/live toggle for PayPal | Database only. See the warning at the top |
| Manual card capture on Stripe | Capture is always automatic |
| Shipping, cancellation or refund emails | Only four templates exist |
| Postcode ranges or comma lists in tax rates | Exact match plus `*` only |
| Coupon restrictions by category | Product include/exclude and email restriction only |
| Storefront template overrides | Only the three email templates can be overridden; storefront markup is CSS, blocks and filters only |
| Customers editing their saved addresses | The account Addresses tab is display-only |
| Importing orders, customers or subscriptions | Products import by CSV; nothing else imports |
| A working Storage, Roles or Features settings tab | Those three tabs save values that nothing reads |
| White-labeling the admin | No white-label option exists |

## Launch day

<ol class="step-list">
  <li>Take a full backup.</li>
  <li>Run through the ten checks above one more time.</li>
  <li>Remove or unpublish every test product and delete every test order so your reports start clean.</li>
  <li>Reset the invoice counter if your tests consumed numbers.</li>
  <li>Turn off maintenance mode.</li>
  <li>Place one more real order the moment you are live, then refund it.</li>
  <li>Watch <span class="screen-path">Ambikly → Orders</span> closely for the first day. Failed orders cluster around gateway misconfiguration and show up fast.</li>
</ol>

## Next

[A tour of the admin](/admin-tour) maps every screen you will be living in from here.
