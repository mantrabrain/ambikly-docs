---
title: FAQ
description: Straight answers to the questions Ambikly store owners and developers actually ask — what works, what does not yet, and where each feature is documented in full.
prev:
  text: System status
  link: /system-status
next:
  text: Changelog
  link: /changelog
---

# FAQ

Short answers, with a link to the page that covers each topic properly. Where a feature is
incomplete or has no admin UI yet, the answer says so rather than describing the intent.

[[toc]]

## Getting started

### Does Ambikly require another eCommerce plugin?

No. Ambikly is a standalone store. It does not require, extend or import from any other commerce
plugin, and it does not use WordPress posts for products — products, orders, customers and
everything else live in their own tables.

See [Introduction](/) and [Installation](/installation).

### What are the requirements?

WordPress 5.4 or newer and PHP 7.4 or newer. Ambikly Pro additionally requires the free core at
version `0.0.10` or newer and refuses to load below it.

Your host also needs to let WordPress create tables on activation, and to run WP-Cron — the job
queue ticks once a minute and drives webhook delivery.

See [Installation](/installation) and [Changelog](/changelog).

### Do I have to use the setup wizard?

No, but it is the fastest path: it writes your store settings and creates the five storefront
pages in one pass. Everything it sets can be changed afterwards under
<span class="screen-path">Ambikly → Settings</span>.

See [Setup wizard](/setup-wizard).

### Can I re-run the setup wizard later?

No. **The setup wizard cannot be re-launched from the admin UI** once it has been completed. Make
the same changes through <span class="screen-path">Ambikly → Settings</span> instead — every value
the wizard writes has a home there, and store pages can be re-created by hand.

See [Setup wizard](/setup-wizard) and [Settings reference](/settings).

### Which pages does Ambikly create, and can I move them?

Five: Shop, Cart, Checkout, My Account and Order Received. Each holds one shortcode. You can move
or rename them, but the store records the page slugs it created — change a slug and the links the
storefront builds go stale until the recorded slug is updated to match.

**There is no settings screen for that mapping.** The `ambikly_settings_pages` option is written by
the setup wizard's Pages step and by the defaults seeder, and nowhere else, so re-pointing the store
at a different page means editing the option directly through WP-CLI or `update_option()`.

Ambikly deliberately will not adopt an existing `/shop` or `/cart` page unless that page actually
contains the matching Ambikly shortcode, so a page left behind by another store plugin is never
silently taken over.

See [Store pages](/store-pages).

### Will it work with my theme?

It renders inside your theme's content area like any other page content, and inherits your
theme's typography and colors. Ambikly ships its own storefront stylesheet and loads it only on
pages that render an Ambikly shortcode or block.

What you cannot do is replace the storefront markup — see the template question under
[Development](#development) below.

See [Themes & template overrides](/themes).

### Does Ambikly work on multisite?

It installs per site: each site in the network gets its own set of tables under its own table
prefix, and its own settings, products and orders. There is no network-wide store, no shared
catalog and no network admin screen. The system status report tells you whether the current site
is part of a multisite install.

See [Installation](/installation).

## Selling

### Can I sell grouped or external products?

Not from the admin. **Grouped and external product types have no admin UI** — the editor offers no
tab for them. The CSV importer and the storefront do handle `type=external` and `type=grouped`
values, so products of those types can be created by import or through the REST API and will
render, but you cannot create or edit them on the product screen.

See [Products](/products) and [Import & export (CSV)](/import-export).

### Can I sell digital and physical products in the same store?

Yes. A product is created as physical — with shipping, stock and variations — or digital, with
files attached and per-grant download limits and expiry. Both appear in the same shop and can be
bought in the same order.

See [Products](/products) and [Digital downloads](/digital-downloads).

### Do orders, customers or subscriptions import from WooCommerce?

No. **Orders, customers and active subscriptions do not import** from other commerce plugins.
Products import by CSV only — you can map another platform's product export into Ambikly's CSV
format, but order history and live subscriptions have to stay where they are.

Plan a migration as a cutover: run the old store until open orders are fulfilled, then start
taking new orders in Ambikly.

See [Import & export (CSV)](/import-export).

### Can customers edit their saved address?

No. **Storefront address editing does not exist** — the Addresses tab in the customer account area
is display-only. A customer changes an address by entering a different one at checkout; a store
operator can edit stored details from <span class="screen-path">Ambikly → Customers</span>.

See [Customers](/customers).

### Why is there no shipping notification email?

Because it does not exist in the free core. Only **four editable transactional emails** ship: order
notification and order status change, each in a customer and an admin version. There are no
shipping-notification, cancelled-order or refund-notification emails. Low-stock alerts and company
buyer invitations are sent, but their content is hard-coded and not editable.

A status-change email does go out when you move an order to a shipped or completed status, and you
can edit its wording — that is the closest thing available in the free core.

See [Emails](/emails).

### Can I restrict a coupon to a product category?

No. **Coupons have no category restriction**, despite older wording that suggested otherwise.
Product include and exclude lists work, as do email restrictions, usage limits, minimum and maximum
spend, expiry and free-shipping rules. To approximate a category rule, list the products
explicitly.

See [Coupons](/coupons).

### Do product shipping classes do anything?

No. **Product shipping classes are cosmetic** — the list in the product editor is hard-coded and
is never read when shipping is calculated. Rates come from the matched zone's methods only.

See [Shipping](/shipping).

### Why can't I set a per-item shipping cost?

The flat-rate method supports a per-item cost internally, but **it has no admin field** — only
Title, Cost and Enabled are editable, and per-item is created as 0. A flat rate charges its cost
once per order, regardless of quantity.

See [Shipping](/shipping).

### Why is my tax rate not matching?

Almost always because of postcode formatting. **Postcode ranges and comma-separated lists are not
implemented** — the panel's help text suggests otherwise, but rate matching is an exact-equality
comparison per column, with `*` as the only wildcard. A row containing `SW1A...SW1Z` or a comma
list matches nobody and the tax silently never applies.

Also check that taxes are enabled at all: with taxes off, no rate applies no matter how many you
have configured.

See [Tax](/tax) and [Troubleshooting](/troubleshooting).

### Can tax be calculated from the store address?

No. The option appears, but **the "Store Address" calculation setting has no backend behavior** —
calculation is by the customer's shipping or billing address only.

See [Tax](/tax).

### Why do product URLs have a query string?

Because **product permalinks are query-string based**: `{shop page}?ambikly_product={slug}`. There
is no pretty-permalink rewrite for products in the free core. Product pages are indexable and
shareable as they are; they simply do not have a `/product/name/` form.

See [Store pages](/store-pages).

### Is there a B2B admin screen?

Yes. <span class="screen-path">Ambikly → Companies</span> lists company accounts and opens a
detail screen where you create and edit a company, switch on net terms, set payment terms and a
credit limit, set a price-tier discount, and invite or remove buyers. Company orders are listed on
the same screen.

The full companies REST API sits behind it, so anything the screen does not expose can be done
through the API.

See [B2B companies & Net Terms](/b2b-companies).

### How do download limits and expiry work?

Both are stamped onto the download grant when the order is paid, from the product's stored values at
that moment. Changing the product later does not change grants that already exist. A grant is
refused once the counter reaches the limit or the expiry date passes, and access is revoked outright
if the order is cancelled or fully refunded — regardless of what its payment status says.

The catch: **the product editor has no field for either value.** The columns exist and are enforced,
but unless a limit or expiry was written out of band — through the REST API or directly in the
database — downloads are unlimited and never expire.

See [Digital downloads](/digital-downloads).

### Why was an order refused at checkout for stock?

Checkout re-validates every line immediately before taking payment and refuses the order rather
than overselling. You will see `{product} (have 2, need 5)` for a stock shortfall, or
`{product} (no longer available)` if the product was unpublished after it went into the cart.
Variations are checked independently of their parent, so a sold-out variation is caught even when
the parent still has stock.

See [Inventory & stock](/inventory).

### Why did stock drop for an order nobody paid for?

Because stock is decremented when the order is **created**, not when it is paid. An abandoned card
payment, a failed gateway response or an offline order awaiting a bank transfer all hold their
stock until the order is cancelled or deleted.

See [Inventory & stock](/inventory).

### Why do my invoices show the wrong company details?

Because invoices and packing slips are built from the **Store** Information and Address fields, not
from the Company Information fields. Those Company Information settings currently have no readers at
all, so filling them in changes nothing on a printed document. Put the details you want on invoices
into the Store fields.

See [Invoices & packing slips](/invoices) and [Settings reference](/settings).

### Why don't my reports match the Customers list?

Two known reasons, both legitimate rather than bugs in your data:

- **Refunded orders are treated differently.** `wp ambikly recompute customer-totals` excludes
  refunded orders; the live calculation behind the Customers list does not. On a store with refunds,
  the two figures differ by design.
- **Report buckets can skew across a timezone boundary.** Reports bucket on the order's `created_at`
  timestamp, which falls through to the database column default rather than being written in the
  site's timezone, so an order placed near midnight can land in the adjacent day's bucket.

See [Reports](/reports) and [Customers](/customers).

### Can I export my products and orders?

Yes. <span class="screen-path">Ambikly → Tools</span> — the wrench icon in the top header —
exports products as CSV, with optional status and type filters, and orders as CSV for a date
range. The same exports are available from the command line.

See [Import & export (CSV)](/import-export) and [WP-CLI](/developers/wp-cli).

## Payments

### Which payment gateways are built in?

Seven: Stripe, PayPal, Cash on Delivery, Direct Bank Transfer, Check Payments, Manual, and Net
Terms for company accounts. Stripe and PayPal are the two online gateways; the rest are offline
methods that create an order and wait for payment out of band.

See [Payments overview](/payments) and [Offline payment methods](/payments-offline).

### Does PayPal work out of the box?

No. **PayPal has no sandbox/live switch in the admin UI.** The gateway's `mode` setting defaults to
`sandbox` and no admin field writes it, so PayPal talks to PayPal's sandbox API until the option is
set to `live` in the database directly. Orders complete and customers see a success page, but no
real money moves.

Treat PayPal as not ready for real trading until you have set that option and confirmed a live
payment landed in your PayPal account.

See [PayPal](/payments-paypal).

### Do I need to configure a Stripe webhook?

Yes, and it is the single most common reason card orders sit in Pending. Stripe checkout is a
redirect flow; the order is only marked paid when Stripe's signed webhook reaches
`/wp-json/ambikly/v1/stripe/webhook` and verifies.

Signature verification is mandatory — without a stored signing secret the endpoint returns `503`
and refuses the event, because otherwise anyone could forge a successful payment. The signing
secret has no field on the payments screen; it is read from `webhook_secret` inside the `stripe`
entry of the payments settings group and has to be written there directly.

See [Stripe](/payments-stripe) and [Troubleshooting](/troubleshooting).

### Can I authorize a card now and capture later?

No. **Manual capture has no UI field** — capture is automatic. A successful Stripe payment is
captured at the time it is taken.

See [Stripe](/payments-stripe).

### Does Ambikly charge transaction fees?

No. Ambikly takes no percentage of any sale, in the free core or in Pro. Your payment processor's
own fees still apply.

See [What Pro adds](/pro).

### Can I add my own payment gateway?

Yes. Register it with `add_filter('ambikly_payment_gateways', …)`; the class extends
`Ambikly\Payments\PaymentGateway` and implements `process()`, returning one of the `PaymentResult`
factories — `pending()`, `paid()`, `redirect()` or `failed()`.

See [Payment gateway API](/developers/payment-gateways).

### How do refunds work?

Refunds are issued from the order screen. For Stripe, the refund is sent to the gateway; for
offline methods it is recorded against the order and you move the money yourself.

Three things to know, because none of them is obvious:

- **The customer is never told.** Refunds do not run through the status-change path, so no
  status-change email fires, and no refund email template exists. Tell them yourself.
- **Only a full refund restocks.** A partial refund never returns stock — adjust it by hand.
- **A partial refund leaves download links working.** Only a full refund or a cancellation revokes
  access.

See [Refunds & cancellations](/refunds).

### Why did the gateway I switched on not appear at checkout?

Because the toggle alone saves nothing. On
<span class="screen-path">Ambikly → Settings → Payment Settings</span>, flipping a gateway's on/off
toggle only changes the screen — nothing is written until you open that gateway's **Configure**
panel and click **Save Gateway**. Confirm the result in the system status report's
`available_gateways`, which is what the server actually offers.

See [Payments overview](/payments) and [System status](/system-status).

## Pro and licensing

### What does Ambikly Pro add?

Thirty-five add-ons under a single license — subscriptions, gift cards, license delivery, dynamic
pricing, bundles, order bumps, abandoned cart recovery, wishlists, quick view, advanced shipping
and reports, and more. Each is enabled individually.

See [What Pro adds](/pro) and [All add-ons](/addons/).

### Is it one license for all the add-ons?

Yes. One key unlocks every add-on. Pro covers one site; Agency covers ten. Pricing is $199/year or
$549 once for Pro, and $499/year or $1,349 once for Agency.

See [What Pro adds](/pro) and [Install & activate a license](/pro-install).

### What happens when my license expires?

Enabled add-ons stop working, but nothing is lost. The license is re-checked on every request, and
an add-on whose license is not valid simply does not register its hooks or routes. Its enabled flag,
settings and data are left untouched, and store staff see an admin notice saying how many add-ons
are paused. Renew, and everything resumes on the next page load.

See [Install & activate a license](/pro-install).

### Can I move my license to another domain?

Yes. Deactivate it on the old site to free the slot, then activate the same key on the new one. A
license is activated against the site's own URL, which is why a cloned or migrated site shows its
add-ons paused until you re-activate. Deactivating leaves the stored key in place, so you usually
do not have to re-enter it.

Licenses are revalidated once a day in the background, so a change made at the store's end may take
until the next check to appear — re-activating from
<span class="screen-path">Ambikly → License</span> applies immediately.

See [Install & activate a license](/pro-install).

### Can I enable add-ons without a license?

No. Enabling an add-on is refused with a `license_required` error unless a valid license is
activated, and enabled add-ons are re-checked on every request. Copying a licensed site's database
onto an unlicensed site does not carry the Pro tier across.

See [Managing add-ons](/addons-manage).

### Is there a white-label option?

No. **No white-label option exists** in the current release — the Ambikly name and branding cannot
be replaced from the admin.

See [What Pro adds](/pro).

### Does the Checkout Field Editor change my checkout?

Not yet. The add-on stores a field schema, but **the core checkout does not consume it**, so
configuring fields there does not change what a customer sees. Its own page says the same.

See [/addons/checkout-field-editor](/addons/checkout-field-editor) and
[Cart & checkout](/cart-checkout).

### Do subscription webhook events work without Pro?

The `subscription.*` events can be subscribed to in the free core, but they only ever fire when the
Pro subscriptions add-on is enabled and licensed. Subscribing to them on a free-only site produces
no deliveries.

See [Webhooks](/developers/webhooks) and [/addons/subscriptions](/addons/subscriptions).

## Data and privacy

### Where does Ambikly store my data?

In its own tables, 45 of them, prefixed `{wp_prefix}ambikly_`. Products, orders, customers, coupons,
shipping zones, tax rates, carts, downloads, reviews, webhooks and the job queue each have their
own table. Settings are stored as WordPress options under `ambikly_settings_*`.

See [Database schema](/developers/database).

### Does uninstalling delete my store data?

No, not by default. **Uninstall removes data only if the `ambikly_remove_data_on_uninstall` option
is truthy** — it defaults to false and has no admin UI, so deleting the plugin leaves your tables
and options intact. Deactivating never touches data.

If you genuinely want a clean removal, set that option before deleting the plugin, and take a
backup first.

See [Installation](/installation).

### What data does Ambikly send to third parties?

Only what a feature you enabled requires:

| Service | When | What |
|---|---|---|
| Stripe | The Stripe gateway is enabled and used at checkout | Amount, currency and the billing details entered |
| PayPal | The PayPal gateway is enabled and used at checkout | Order and buyer details needed to create and capture the transaction |
| store.ambikly.com | Ambikly Pro is installed | Your license key and site URL, at activation and once a day thereafter |

Neither payment service is contacted unless its gateway is enabled and used. Nothing is sent for
analytics or telemetry.

See [Payments overview](/payments) and [Install & activate a license](/pro-install).

### Does Ambikly support GDPR data export and erasure requests?

Yes, through WordPress's own privacy tools. Ambikly registers a personal-data exporter and eraser,
so a request made under <span class="screen-path">Tools → Export Personal Data</span> or
<span class="screen-path">Tools → Erase Personal Data</span> includes Ambikly's records.

Erasure anonymizes rather than deletes orders — name, address, contact details and IP address are
stripped, and the de-identified order is retained for accounting, which GDPR Article 17(3)(b)
permits. The response tells the requester exactly that.

See [Customers](/customers).

### Can Support Agents and Store Managers see everything?

No, and that is the point of the two custom roles. Store Manager holds `ambikly_manage_store`;
Support Agent holds `ambikly_view_store` for read-only access. Settings, Payments, Webhooks,
System Status, Import/Export, Email Templates and Setup all stay behind WordPress's own
`manage_options` — so neither role can reach them.

One asymmetry worth knowing: the shipping and tax routes require `ambikly_manage_store` even to
**read**, so a Support Agent cannot view shipping zones or tax rates at all, even though they can
read orders and customers.

See [Roles & permissions](/roles).

### Are payment credentials shown in the admin?

Stored secrets are masked when the settings screen loads them, and saving a form that still shows
the mask restores the real value rather than overwriting it with the mask. The system status report
contains no credentials, keys or customer data at all, which is why it is safe to paste into a
support ticket.

See [System status](/system-status).

## Development

### Is there a REST API?

Yes — over 200 routes. The free core registers 117 route definitions under `ambikly/v1`, which
expand to 123 at runtime; Ambikly Pro registers 94 under `ambikly-pro/v1`, expanding to 99.

Responses use a body-only envelope, `{ "success": true, "data": …, "message": … }`. Errors come
back as WordPress errors: `{ "code": …, "message": …, "data": { "status": 400 } }`.

See [REST API](/developers/rest-api) and [Endpoint reference](/developers/endpoints).

### How do I authenticate against the API?

With WordPress's own REST authentication — the logged-in cookie plus an `X-WP-Nonce` header, or
Application Passwords, which WordPress core provides. Ambikly adds **no custom auth layer and no
JWT**. If you can authenticate against `/wp-json/wp/v2/`, you can authenticate against Ambikly.

See [REST API](/developers/rest-api).

### Why don't list endpoints send pagination headers?

Because there are none. `X-WP-Total` and `X-WP-TotalPages` are never sent. Pagination is in the
body instead: `{ success, total, page, per_page, total_pages, data: [ … ] }`. A client that reads
pagination from headers will see nothing.

See [REST API](/developers/rest-api).

### Can I override storefront templates?

No. **There is no storefront template-override system.** The plugin ships only three template
files, all of them email: the email header, the email footer, and the order notification body.
Shop, product, cart, checkout and account markup is generated inline in PHP.

You can restyle the storefront with CSS, adjust block attributes, and change behavior and output
through the `ambikly_*` filters and actions — but you cannot drop a template into your theme and
have it replace a storefront view.

See [Template overrides](/developers/templates) and [Themes & template overrides](/themes).

### What hooks are available?

47 concrete `ambikly_`-prefixed hooks in the free core — 16 actions and 31 filters — plus two
dynamic patterns, `ambikly_account_tab_{tab}` and `ambikly_job_{hook}`. Use plain `add_action()`
and `add_filter()`.

One trap worth knowing: `ambikly_checkout_completed` fires with `null` as its second argument on
the thank-you page for redirect gateways such as Stripe and PayPal, so handlers must null-check.

See [Hooks & filters](/developers/hooks).

### How do webhooks sign their payloads?

HMAC-SHA256 over the raw request body, using the webhook's secret, sent as
`X-Ambikly-Signature: sha256=<hex>`. Nine events are available. Delivery goes through the job
queue, never inline, with up to 8 attempts on a backoff schedule and a 5-second timeout, and the
last 200 attempts per webhook are kept in the delivery log.

Receivers must be publicly resolvable: deliveries use WordPress's SSRF-hardened request function,
which refuses loopback, private and reserved IP addresses.

See [Webhooks](/developers/webhooks).

### Can I edit Ambikly blocks in the block editor?

Not visually. All 8 blocks are server-rendered through a render callback only — there is no
`block.json`, no editor script and no inspector controls. They work correctly on the front end; in
the editor they appear as generic blocks with no preview and no settings panel.

One block is also not the drop-in it looks like: `ambikly/product-grid` is **not** a replacement for
`[ambikly_shop]`. The shortcode switches to the single-product view when `?ambikly_product=` is
present; the block never does, so swapping one for the other breaks every product URL on the site.

See [Blocks & store pages](/blocks).

### How do I write my own add-on?

Register it through the `ambikly_pro_addons` filter. Dropping a folder into `addons/` loads the
file but does not instantiate the class — only the built-in list is auto-instantiated, so the
filter is required. Implement `activate()`, `deactivate()` and `boot()`; there is no uninstall
callback, because nothing calls one.

See [Addon SDK](/developers/addon-sdk).

### What WP-CLI commands are there?

Three:

```bash
wp ambikly upgrade-db
wp ambikly export <products|orders>
wp ambikly recompute customer-totals
```

See [WP-CLI](/developers/wp-cli).

### Can I generate invoices as PDFs?

Not in the free core. `ambikly_invoice_pdf_renderer` is a filter with no core implementation, so
requesting `format=pdf` falls back to HTML. Supply your own renderer through that filter, or print
the HTML invoice from the browser.

See [Invoices & packing slips](/invoices).

## Still stuck?

- Symptom-first fixes: [Troubleshooting](/troubleshooting)
- Diagnostics to collect first: [System status](/system-status)
- Where to send a report: [Support](/support)
