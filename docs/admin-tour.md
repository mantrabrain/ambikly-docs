---
title: A tour of the admin
description: A map of every screen in the Ambikly admin — the sidebar groups, the header toolbar, each Settings tab, and where the Tools screen hides.
prev:
  text: Go-live checklist
  link: /go-live
next:
  text: Products
  link: /products
---

# A tour of the admin

Ambikly adds exactly one item to the WordPress admin menu. Click it and the plugin takes over the whole screen: a React app with its own dark sidebar, its own header, and its own navigation. The WordPress admin bar, sidebar menu and footer are hidden while you are inside it.

This page maps every screen, where it lives, and what it is for, so you can find things without clicking through everything.

## Getting in and out

| Action | How |
|---|---|
| Open Ambikly | Click **Ambikly** in the WordPress admin sidebar — the cart icon, near the top |
| Move between screens | Use Ambikly's own dark sidebar on the left. There are no WordPress submenus |
| Leave | Click **WP Admin** at the top right |
| Collapse the sidebar | Click the arrow next to the logo. It shrinks to an icon-only rail and remembers your choice |
| On a phone | Tap the hamburger at the top left to open the sidebar as a drawer |

The direct URL is `wp-admin/admin.php?page=ambikly`. Each screen adds a `sub` parameter — `?page=ambikly&sub=orders`. Old-style links like `?page=ambikly-orders` still work; they are redirected to the new form, carrying any extra query arguments with them, so bookmarks survive.

You need the `ambikly_view_store` capability to see the menu item at all. Administrators, Store Managers and Support Agents all have it. Without it the menu is absent and the URL renders nothing. See [Roles & permissions](/roles).

## The header toolbar

The bar across the top shows the current screen's title on the left, with a breadcrumb back to the list when you are editing something. On the right, four controls:

| Control | What it does |
|---|---|
| Sun / moon icon | Toggles dark mode. Stored per browser and applied before the page paints |
| Wrench icon | Opens **Tools**. This is the only way to reach it — read the next section |
| Your name | The logged-in user. Display only |
| **WP Admin** | Returns to the WordPress dashboard |

## Where Tools is hiding

::: warning Tools is not in the sidebar
The **Tools** screen — CSV import, CSV export and System status — has no entry in the Ambikly sidebar. The only way to reach it from the UI is the **wrench icon in the top-right header**. If you are looking for import, export or diagnostics and cannot find them, that is why.

The direct URL is `wp-admin/admin.php?page=ambikly&sub=tools`.
:::

## Overview

| Screen | Path | What it is for |
|---|---|---|
| Dashboard | <span class="screen-path">Ambikly</span> | Your store's performance at a glance — the landing screen |
| Reports | <span class="screen-path">Ambikly → Reports</span> | Sales over a chosen period, top products, customer figures. See [Reports](/reports) |

## Catalog

| Screen | Path | What it is for |
|---|---|---|
| Products | <span class="screen-path">Ambikly → Products</span> | The product list, with search, category/type/status filters, configurable columns and bulk actions. **Add New Product** starts here. See [Products](/products) |
| Categories | <span class="screen-path">Ambikly → Categories</span> | Organize products into a browsable hierarchy. See [Categories, tags & brands](/categories) |
| Reviews | <span class="screen-path">Ambikly → Reviews</span> | Moderate customer reviews. Pending submissions are admin-only until approved. See [Reviews](/reviews) |

## Sell

| Screen | Path | What it is for |
|---|---|---|
| Orders | <span class="screen-path">Ambikly → Orders</span> | Every purchase. Open an order to see line items, change status, refund, add notes or print the invoice. See [Orders](/orders) |
| Abandoned Carts <span class="pro-pill">PRO</span> | <span class="screen-path">Ambikly → Abandoned Carts</span> | Carts that were never checked out, and the recovery emails sent for them. See [Abandoned Cart Recovery](/addons/abandoned-cart) |
| Customers | <span class="screen-path">Ambikly → Customers</span> | People who have bought from you, plus manually added customers for offline and wholesale orders. See [Customers](/customers) |
| Companies | <span class="screen-path">Ambikly → Companies</span> | B2B accounts with net-terms billing and multiple buyer logins. See [B2B companies & Net Terms](/b2b-companies) |
| Coupons | <span class="screen-path">Ambikly → Coupons</span> | Percentage, fixed-cart and per-product discount codes. See [Coupons](/coupons) |

## Recurring & Digital

Every screen in this group belongs to a Pro add-on. They appear in the sidebar whether or not Pro is installed, marked with a **PRO** chip; without an active license and the add-on enabled, they are not usable.

| Screen | Path | What it is for |
|---|---|---|
| Subscriptions <span class="pro-pill">PRO</span> | <span class="screen-path">Ambikly → Subscriptions</span> | Recurring plans, their billing schedules and renewals. See [Subscriptions](/addons/subscriptions) |
| Gift Cards <span class="pro-pill">PRO</span> | <span class="screen-path">Ambikly → Gift Cards</span> | Issued cards, remaining balances and the per-card ledger. See [Gift Cards](/addons/gift-cards) |
| Licenses <span class="pro-pill">PRO</span> | <span class="screen-path">Ambikly → Licenses</span> | License keys issued to *your* customers for digital products, with per-site activations. See [Software Licensing Pro](/addons/license-pro) |
| Pricing Rules <span class="pro-pill">PRO</span> | <span class="screen-path">Ambikly → Pricing Rules</span> | Quantity breaks, role-based pricing and scheduled discounts. See [Dynamic Pricing](/addons/dynamic-pricing) |
| Bundles <span class="pro-pill">PRO</span> | <span class="screen-path">Ambikly → Bundles</span> | Multi-product bundles sold as one item. See [Product Bundles](/addons/bundles) |
| Order Bumps <span class="pro-pill">PRO</span> | <span class="screen-path">Ambikly → Order Bumps</span> | One-click add-on offers shown at checkout. See [Order Bumps](/addons/order-bumps) |

<div class="ui-warn"><strong>Careful:</strong> Do not confuse <strong>Licenses</strong> with <strong>License</strong>. Licenses (plural, in this group) manages keys you sell to your customers. License (singular, under Configure) is where you activate your own Ambikly Pro purchase.</div>

## Configure

| Screen | Path | What it is for |
|---|---|---|
| Emails | <span class="screen-path">Ambikly → Emails</span> | Who receives transactional email, and the subject and body of each template, with a preview. Smart tags like `{{order_number}}` expand at send time. See [Emails](/emails) |
| Webhooks | <span class="screen-path">Ambikly → Webhooks</span> | Notify other apps when something happens in your store. 9 events, HMAC-signed, with a delivery log. See [Webhooks](/developers/webhooks) |
| Addons | <span class="screen-path">Ambikly → Addons</span> | Switch the 35 Pro add-ons on and off. Disabled add-ons are skipped at load time. See [Managing add-ons](/addons-manage) |
| Settings | <span class="screen-path">Ambikly → Settings</span> | Nine tabs covering the whole store. Mapped below. See [Settings reference](/settings) |
| License | <span class="screen-path">Ambikly → License</span> | Activate or deactivate your Ambikly Pro license. Revalidated daily. See [Install & activate a license](/pro-install) |

## Settings, tab by tab

Settings has its own menu down the left side of the screen. Only Email Configuration has sub-items.

| Tab | What it configures | Notes |
|---|---|---|
| Store Settings | Store name, tagline, description, address, currency and position, contact details, social links, company details and tax ID, business hours, store policies, and feature toggles like guest checkout and reviews | See the caveats below |
| Payment Settings | All seven gateways: enable, title, description, instructions and credentials. See [Payments overview](/payments) | |
| Invoice & Packing | Invoice prefix, next number, footer text, and packing slip options. See [Invoices & packing slips](/invoices) | |
| Tax & Duties | Taxes on/off, calculation basis, tax-inclusive pricing, and the rate table. See [Tax](/tax) | |
| Email Configuration → Notifications | Which emails send, to whom, and the From name and address. See [Emails](/emails) | |
| Email Configuration → Email Templates | The four editable templates | Only four exist |
| Roles and Permissions | Default customer role, role-based pricing, role-based access | **Inert** — nothing reads these |
| Storage Settings | File storage options | **Inert** — nothing reads these |
| Shipping | Zones, the regions each covers, and the methods inside them. See [Shipping](/shipping) | |
| Features & Addon | Feature and add-on toggles | **Inert** — the code says so itself |

<div class="ui-warn"><strong>Careful:</strong> Three tabs — <strong>Roles and Permissions</strong>, <strong>Storage Settings</strong> and <strong>Features &amp; Addon</strong> — accept values and save them successfully, but nothing in the plugin ever reads them back. Changing them has no effect. To manage real permissions, assign the Store Manager or Support Agent role to a WordPress user instead; see <a href="/roles">Roles &amp; permissions</a>. To enable or disable an add-on, use <span class="screen-path">Ambikly → Addons</span>.</div>

Two more things on the Store Settings tab that look functional and are not: the **Store Logo** and **Store Icon** upload buttons have no click handler and do nothing, and each of the four **Store Policies** dropdowns offers a single hard-coded option rather than listing your pages. Full detail in [Settings reference](/settings).

## Tools

Reached only by the wrench icon in the header. Four cards:

| Card | What it does |
|---|---|
| Export products | Downloads a CSV of every product, optionally filtered by status (Published, Draft) and type (Physical, Digital, Variable, External, Bundle, Subscription) |
| Export orders | Downloads a CSV of orders in a date range, with addresses and a flattened items column |
| Import products | Uploads a CSV. Existing SKUs or slugs are updated, new rows created. **Download template** gives you the correct headers. Results report rows processed, created, updated and any per-row errors |
| System status | Versions, database state, environment and active add-ons as JSON. **Copy** puts the lot on your clipboard for a support ticket |

See [Import & export (CSV)](/import-export) and [System status](/system-status).

<div class="ui-warn"><strong>Careful:</strong> Only products import. Orders, customers and active subscriptions cannot be imported from another plugin at all.</div>

## The setup wizard

`wp-admin/admin.php?page=ambikly-setup` still exists, but it is an orphan page: it is not in the WordPress menu, not in the Ambikly sidebar, and nothing links to it once setup is marked complete. Change settings from the Settings screens instead. See [Setup wizard](/setup-wizard).

## What is not in the admin

Worth knowing so you stop looking:

| You might expect | Reality |
|---|---|
| A store-pages setting | The page mapping is an option with no UI. See [Store pages](/store-pages) |
| Product editing in the WordPress post editor | Products are not a custom post type. They live in Ambikly's own tables and its own editor |
| Grouped or External product types | No admin UI. Creatable by CSV import or REST API only |
| A PayPal sandbox/live switch | Database only. See [Go-live checklist](/go-live) |
| Block editor controls for Ambikly blocks | All 8 blocks are server-rendered with no editor UI. They work on the front end and appear as generic blocks in the editor. See [Blocks & store pages](/blocks) |
| Shipping, cancellation or refund emails | Only four templates exist |

## Who can see what

| Role | Sees the Ambikly menu | Can edit store data | Settings, Payments, Webhooks, System Status, Import/Export, Email Templates |
|---|---|---|---|
| Administrator | Yes | Yes | Yes |
| Store Manager (`ambikly_store_manager`) | Yes | Yes | **No** |
| Support Agent (`ambikly_support_agent`) | Yes | Read-only | **No** |
| Everyone else | No | No | No |

Store Managers and Support Agents can see the Settings screen in the sidebar, but its data loads only for users who can `manage_options` — the sensitive screens hold gateway secrets and webhook secrets in plain text. See [Roles & permissions](/roles).

## Next

You know where everything is. [Products](/products) is the full field-by-field reference for the product editor, and the natural next stop.
