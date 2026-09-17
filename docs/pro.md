---
title: What Pro adds
description: Ambikly Pro is a second plugin that runs beside the free core with 35 add-ons on one license. The free-versus-Pro boundary, pricing, and exactly what a lapsed license does.
prev:
  text: Settings reference
  link: /settings
next:
  text: Install & activate a license
  link: /pro-install
---

# What Pro adds

Ambikly Pro is a separate plugin, `ambikly-pro`, that installs alongside the free `ambikly` plugin. It does not replace the free core and it is not a different edition of it — it is an add-on platform that runs on top.

## How Pro relates to the free core

Pro hard-depends on the free plugin. On every page load it checks that the free core's main class and version constant exist, and that the version is at least **0.0.10**. If either check fails it shows an admin notice and stops, without touching anything.

Everything else is shared:

| | |
|---|---|
| **Same database** | Pro uses the free core's tables and migrations. Activating Pro runs the free core's schema migration; it does not create a parallel data store. |
| **Same admin** | Pro registers no WordPress menu entries of its own. Its screens live inside the free core's single-page admin — Add-ons at <span class="screen-path">Ambikly → Add-ons</span>, the license at <span class="screen-path">Ambikly → Settings → License</span>. |
| **Same REST API** | Pro adds its own `ambikly-pro/v1` namespace next to the core's `ambikly/v1`. Authentication and the response envelope are identical. |
| **Same storefront** | Add-ons extend the storefront through the core's own `ambikly_*` filters and actions. There is no second storefront. |
| **One license** | All 35 add-ons are covered by one license. There is nothing to buy per add-on. |

Each add-on is a class inside the Pro plugin, not a separate plugin. You enable the ones you want and leave the rest off; disabled add-ons are skipped at load time and register nothing.

## The boundary, as a principle

The line is not drawn at "basics versus advanced". It is drawn like this:

> **The free core is a complete store.** Everything needed to list products, take payment, fulfill orders, refund them, email customers and report on it is in the free plugin, with no upsell inside the checkout path.
>
> **Pro is what you add once the store is working.** Conversion features, merchandising, revenue models the core does not have (subscriptions, gift cards, credit), operational scale (multi-vendor, advanced shipping, CRM sync), and AI.

Put practically: nothing in Pro is required to sell something. If you turn Pro off tomorrow, the store keeps taking orders.

## Capability table

| Capability | Free | Pro |
|---|---|---|
| Products, variations, digital downloads | ✅ | ✅ |
| Categories, tags, brands | ✅ | ✅ |
| Cart and checkout | ✅ | ✅ |
| 7 payment gateways, including Stripe and PayPal | ✅ | ✅ |
| Shipping zones and methods | ✅ | ✅ |
| Tax rates with classes, priority and compounding | ✅ | ✅ |
| Coupons | ✅ | ✅ |
| Orders, refunds, cancellations | ✅ | ✅ |
| Invoices and packing slips | ✅ | ✅ |
| Transactional emails | ✅ | ✅ |
| Customers and B2B companies | ✅ | ✅ |
| Reports | ✅ | ✅ |
| CSV product import and export | ✅ | ✅ |
| REST API, webhooks, WP-CLI | ✅ | ✅ |
| Blocks and shortcodes | ✅ | ✅ |
| Wishlist, compare, quick view, recently viewed | — | ✅ |
| Product badges, size charts, swatches, flash sales | — | ✅ |
| AJAX filters and instant search | — | ✅ |
| Subscriptions and recurring billing | — | ✅ |
| Gift cards, store credit, loyalty points | — | ✅ |
| Dynamic pricing and product bundles | — | ✅ |
| Abandoned cart recovery and popup campaigns | — | ✅ |
| One-page checkout, order bumps, post-purchase upsells | — | ✅ |
| Checkout field editor | — | ✅ |
| Advanced shipping rules and shipment tracking | — | ✅ |
| Multi-vendor marketplace | — | ✅ |
| Affiliate program | — | ✅ |
| Advanced reports and download analytics | — | ✅ |
| PDF stamping and software licensing | — | ✅ |
| Social login | — | ✅ |
| CRM sync | — | ✅ |
| AI descriptions and AI recommendations | — | ✅ |
| Automatic plugin updates | — | ✅ |
| Priority support | — | ✅ |

The full catalog with a page per add-on is at [All add-ons](/addons/).

## A few flagship add-ons

- **[Subscriptions](/addons/subscriptions)** — recurring billing with renewal orders and a customer-facing management tab.
- **[Gift Cards](/addons/gift-cards)** — sell stored-value cards and redeem them at checkout.
- **[Abandoned Cart Recovery](/addons/abandoned-cart)** — a timed email sequence for carts that were never checked out.
- **[Dynamic Pricing](/addons/dynamic-pricing)** — tiered, role-based, cart-quantity and scheduled discount rules.
- **[Multi-Vendor](/addons/multi-vendor)** — turn the store into a marketplace with vendor accounts and commission.
- **[One-Page Checkout](/addons/one-page-checkout)** — collapse checkout into a single step.
- **[Advanced Shipping](/addons/advanced-shipping)** — conditional rate rules beyond flat rate and free shipping.
- **[Wishlist](/addons/wishlist)** — guest-capable saved lists that merge into the account on login.

## Pricing

One license, all 35 add-ons, no transaction fees on any plan.

| Plan | Sites | Annual | One-time |
|---|---|---|---|
| **Pro** | 1 | $199 / year | $549 |
| **Agency** | 10 | $499 / year | $1,349 |

- **No transaction fees.** Ambikly never takes a cut of a sale, on any plan.
- **14-day refund** on a first purchase.
- Annual plans include updates and support for as long as the license is active. One-time plans are a perpetual license for the site count purchased.

Buy at [ambikly.com/pricing](https://ambikly.com/pricing/). Licenses are managed from your account at [store.ambikly.com](https://store.ambikly.com/account/).

<div class="pro-callout">
  <div class="pro-callout__head"><span class="pro-callout__badge">PRO</span><span class="pro-callout__title">Every add-on, one license</span></div>
  <p class="pro-callout__desc">There is no per-add-on pricing and no feature tier inside Pro. A Pro license unlocks all 35 add-ons; the Agency license is the same thing across ten sites.</p>
  <a class="pro-callout__cta" href="https://ambikly.com/pricing/">See pricing →</a>
</div>

## What happens when a license lapses

This is worth being exact about, because the behavior is deliberately conservative: **nothing is deleted and the store keeps selling.**

The license status is checked on every request. It is a cached option read, not a network call — the actual revalidation against the license server happens once a day on a scheduled event. When that check says the license is not valid:

| | |
|---|---|
| **Add-ons stop booting** | Every enabled add-on is skipped. Its hooks are not registered for that request, so its storefront surfaces, admin screens and background behavior do not run. |
| **Their REST routes disappear** | Add-on routes are registered during boot. Since boot is skipped, those routes are simply not registered for that request and return 404. |
| **Enabled flags are untouched** | The `enabled` flag on every add-on stays exactly as it was. Nothing is switched off in the database. |
| **Settings are untouched** | Every add-on's saved settings stay in place, including secrets. |
| **Add-on data is untouched** | Tables and rows an add-on created are left alone. Wishlists, gift card balances, loyalty ledgers, subscriptions — all still there. |
| **The free core keeps working** | Products, cart, checkout, payments, orders, emails, reports: all unaffected. The store keeps selling. |
| **Everything resumes** | The moment the license is valid again, the next request boots every enabled add-on exactly as before. There is no re-enable step and no reconfiguration. |

Only whether an add-on's hooks and routes register **for that request** is affected.

### You will be told

When add-ons are being suppressed, an admin notice appears in wp-admin for store staff:

> **Ambikly Pro:** your license isn't active, so 6 enabled add-ons are currently paused (their settings are untouched and they resume instantly once the license is valid). [Manage license]

The notice is shown only to users who can manage the store, only inside wp-admin, and only when add-ons really are paused. It counts the exact number.

### Enabling is gated too

Separately from booting, the enable action itself requires a valid license. Attempting to switch an add-on on without one returns a `license_required` error rather than flipping the flag:

> A valid Ambikly Pro license is required to enable add-ons. Activate your license under Ambikly Pro → License.

<div class="ui-tip"><strong>Tip:</strong> Because the check runs on every request against a cached value, a license that is renewed comes back without any action from you — at the latest after the next daily revalidation, or immediately if you hit <strong>Refresh status</strong> on the License screen.</div>

## What Pro does not do

Worth knowing before you buy, because these come up often.

| | |
|---|---|
| **No white-labeling** | There is no option to rebrand the plugin, hide the Ambikly name, or relabel the admin. Not in the free core and not in Pro. |
| **No migration of orders, customers or subscriptions** | Ambikly does not import orders, customers or active subscriptions from another eCommerce plugin. Products import by CSV only — see [Import & export (CSV)](/import-export). Plan a cutover, not a migration. |
| **No payment gateways beyond the seven in the core** | Pro does not add gateways. The core ships Stripe, PayPal, cash on delivery, bank transfer, cheque, manual and net terms. A new gateway is a small integration against the payment gateway API, not a purchase. |
| **No second storefront** | Add-ons extend the existing storefront through filters. Pro does not replace the shop, cart, checkout or account pages with different templates. |
| **No pretty product permalinks** | Product URLs stay query-string based in both editions. |

One add-on is partly built and its own page says so: the [Checkout Field Editor](/addons/checkout-field-editor) stores a field schema, but the core checkout does not consume it yet. Do not buy Pro for that specific feature today.

## How add-ons reach into the core

Add-ons are not patches. Each one registers against the free core's own public extension points, which is why they compose cleanly and why disabling one leaves no trace:

- Storefront filters and actions — product card badges and buttons, product detail content, account tabs, the login form. See [Themes & template overrides](/themes).
- The payment gateway registry, for add-ons that add a payment path.
- The REST API, under the `ambikly-pro/v1` namespace.
- The core's job queue and webhook dispatcher, for anything that runs in the background.

Everything an add-on can do, your own code can do. See [Hooks & filters](/developers/hooks) and the [Addon SDK](/developers/addon-sdk).

## Versions and requirements

| | |
|---|---|
| Free core | 0.0.10 or newer |
| Ambikly Pro | 0.0.1 |
| WordPress | 5.4 or newer |
| PHP | 7.4 or newer |
| Pro's minimum free-core version | 0.0.10, hard-checked on every load |

## Where to go next

<ol class="step-list">
  <li>Read <a href="/pro-install">Install &amp; activate a license</a> to get Pro running.</li>
  <li>Read <a href="/addons-manage">Managing add-ons</a> to understand what enabling and disabling actually does.</li>
  <li>Browse <a href="/addons/">All add-ons</a> and switch on the ones you need.</li>
</ol>
