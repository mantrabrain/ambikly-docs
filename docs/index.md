---
title: Introduction
description: Ambikly is a self-hosted WordPress eCommerce plugin for physical and digital products. Start here for installation, setup, and the full reference.
layout: doc
aside: false
next:
  text: Installation
  link: /installation
---

<div class="ak-hero">
  <span class="ak-hero__eyebrow">Ambikly · WordPress eCommerce</span>
  <h1 class="ak-hero__title">Run a real store on your own WordPress site</h1>
  <p class="ak-hero__lede">Ambikly adds products, a cart, a checkout, orders, coupons, shipping, tax and a customer account area to WordPress. The free core is a complete store. Ambikly Pro adds 35 optional add-ons on one license. Everything runs on your own hosting, and no one takes a cut of your sales.</p>
  <div class="ak-hero__actions">
    <a class="ak-btn ak-btn--primary" href="/installation">Install Ambikly</a>
    <a class="ak-btn ak-btn--ghost" href="/setup-wizard">Setup wizard</a>
  </div>
</div>

This site documents Ambikly 0.0.10 or newer and Ambikly Pro 0.0.1. Every page is written against the plugin source, so where a feature is incomplete or has no admin screen, the page says so.

## What Ambikly is

Ambikly is a standalone eCommerce plugin. It does not extend or require another store plugin. Install it, activate it, and you get:

- Physical products, variable products with per-variant price and stock, and digital products with file delivery.
- A storefront: shop listing, product page, cart, checkout, order-received page, and a customer account area.
- Orders with line items, notes, status workflow, refunds, invoices and packing slips.
- 7 payment gateways in the core: Stripe, PayPal, Cash on Delivery, Direct Bank Transfer, Check Payments, Manual, and Net Terms.
- Shipping zones and methods, tax rates by country and state, and coupons.
- Transactional emails, outgoing webhooks, CSV import and export, and a REST API with over 200 routes.

Two things shape how Ambikly is built:

**Self-hosted.** The store, its database tables, its files and its customer data live on your server. Ambikly talks to a third-party service only when you enable a gateway that needs one — Stripe or PayPal — and the daily license check if you run Pro.

**No transaction fees.** Ambikly never takes a percentage of a sale. Your payment processor charges its own fees; Ambikly adds nothing on top. Pro is a flat license, not a revenue share.

## Find your way around

<div class="ak-cards">
<a class="ak-card" href="/installation"><span class="ak-card__icon">🚀</span><h3>Installation</h3><p>Requirements, the three install routes, and what activation actually does.</p><span class="ak-card__cta">Read more →</span></a>
<a class="ak-card" href="/products"><span class="ak-card__icon">📦</span><h3>Products</h3><p>Every field in the product editor, for physical, variable and digital products.</p><span class="ak-card__cta">Read more →</span></a>
<a class="ak-card" href="/payments"><span class="ak-card__icon">💳</span><h3>Payments</h3><p>The seven gateways, what each one needs, and which are safe to test with.</p><span class="ak-card__cta">Read more →</span></a>
<a class="ak-card" href="/orders"><span class="ak-card__icon">🧾</span><h3>Orders</h3><p>The order list, the order screen, statuses, notes, refunds and invoices.</p><span class="ak-card__cta">Read more →</span></a>
<a class="ak-card" href="/blocks"><span class="ak-card__icon">🧱</span><h3>Blocks & store pages</h3><p>The 8 blocks and 8 shortcodes that render the storefront.</p><span class="ak-card__cta">Read more →</span></a>
<a class="ak-card" href="/settings"><span class="ak-card__icon">⚙️</span><h3>Settings</h3><p>Every settings tab, field by field — including the ones that do nothing yet.</p><span class="ak-card__cta">Read more →</span></a>
<a class="ak-card" href="/addons/"><span class="ak-card__icon">🧩</span><h3>Add-ons catalog</h3><p>All 35 Pro add-ons, what each one does, and how to turn it on.</p><span class="ak-card__cta">Read more →</span></a>
<a class="ak-card" href="/developers/"><span class="ak-card__icon">🛠️</span><h3>Developers</h3><p>REST API, hooks, webhooks, WP-CLI, the database schema and the addon SDK.</p><span class="ak-card__cta">Read more →</span></a>
<a class="ak-card" href="/troubleshooting"><span class="ak-card__icon">🩺</span><h3>Troubleshooting</h3><p>What to check when the storefront, checkout or emails misbehave.</p><span class="ak-card__cta">Read more →</span></a>
</div>

## How the pieces fit together

Ambikly is not a custom post type layered onto WordPress. Knowing where things actually live saves a lot of hunting:

| Piece | Where it lives |
|---|---|
| Products, orders, customers, coupons | Ambikly's own database tables, not `wp_posts` |
| The admin | One menu item that opens a full-screen React app with its own sidebar |
| The storefront | Five ordinary WordPress pages, each holding one shortcode |
| Product pages | The shop page plus `?ambikly_product={slug}` — no rewrite rules are registered |
| Settings | Options named `ambikly_settings_*` |
| Background work | A database-backed job queue that ticks every minute |

Two consequences worth internalizing early. Products do not appear under <span class="screen-path">Posts</span> or in the block editor's post lists, because they are not posts. And the storefront markup is generated inline rather than from template files, so you customize it with CSS, block attributes and filters — not by copying templates into your theme.

## Free vs Pro at a glance

The free core is the store. Pro is a second plugin that installs add-ons on top of it. You never lose the free features by adding Pro.

| Area | Free core | Ambikly Pro |
|---|---|---|
| Products | Physical, variable, digital | Bundles, advanced variations, badges, size charts |
| Checkout | Standard multi-field checkout | One-page checkout, order bumps, field editor, post-purchase upsells |
| Recurring | — | Subscriptions, license keys, store credit |
| Marketing | Coupons | Gift cards, loyalty points, flash sales, dynamic pricing, abandoned cart, affiliates, popups |
| Merchandising | Category and tag browsing | AJAX filters, smart search, quick view, compare, wishlist, recently viewed |
| Reporting | Sales, products, customers | Advanced reports, download analytics |
| Fulfillment | Shipping zones and methods | Shipment tracking, advanced shipping, PDF stamping, multi-vendor |
| Add-ons | — | 35, all included on one license |
| Price | Free on WordPress.org | From $199/yr or $549 once, 1 site |

Pricing, including the 10-site Agency tier and the 14-day refund on a first purchase, is on [ambikly.com/pricing](https://ambikly.com/pricing/). See [What Pro adds](/pro) for the feature-by-feature breakdown.

## Requirements

Ambikly runs on a standard WordPress host. There is nothing to compile and no extra service to sign up for.

| Requirement | Minimum | Notes |
|---|---|---|
| WordPress | 5.4 | Tested up to 6.7 |
| PHP | 7.4 | 8.1 or newer recommended |
| MySQL | 5.7 | Or MariaDB 10.3 |
| HTTPS | Strongly recommended | Required in practice by Stripe and PayPal |
| Permalinks | Any setting works | Use anything but Plain for readable store URLs |

Activation creates 45 database tables prefixed `{wp_prefix}ambikly_`. On shared hosting with a low table quota, check that before installing. See [Installation](/installation) for the full picture.

## How these docs are written

Every claim on this site is checked against the plugin source before it is published. That has one visible consequence: where a screen, field or setting exists but does not yet do anything, the page says so in plain words rather than leaving it out.

You will see warnings like *"this tab saves values that nothing reads"* or *"there is no admin field for this"*. They are not complaints — they are the fastest way to stop you debugging something that was never wired up. The [Go-live checklist](/go-live) collects the ones that matter most before launch into a single table.

Admin screens are named with a chip like <span class="screen-path">Ambikly → Settings → Payment Settings</span> so you can find them without a screenshot. Pro-only features carry a <span class="pro-pill">PRO</span> marker.

## Where to go next

| If you are | Start at |
|---|---|
| Installing for the first time | [Installation](/installation), then [Setup wizard](/setup-wizard) |
| Setting up the storefront | [Store pages](/store-pages) and [Blocks & store pages](/blocks) |
| Adding your catalog | [Your first product](/first-product), then [Products](/products) |
| Testing before launch | [Your first order](/first-order), then [Go-live checklist](/go-live) |
| New to the admin | [A tour of the admin](/admin-tour) |
| Migrating a catalog | [Import & export (CSV)](/import-export) |
| Building on Ambikly | [Developer overview](/developers/) |
| Stuck | [Troubleshooting](/troubleshooting), [FAQ](/faq), [Support](/support) |
