---
title: Customers
description: The Customers screen and customer record, saved addresses and the default-address rule, the storefront account area tab by tab, and how records link to WordPress users.
prev:
  text: "Emails"
  link: /emails
next:
  text: "Roles & permissions"
  link: /roles
---

# Customers

A customer record is Ambikly's own row for a buyer, stored in `ambikly_customers` and keyed by email. It exists whether or not the buyer has a WordPress account. This page covers the admin screen, the record's fields, and what the customer sees on the storefront.

## The Customers screen

Open <span class="screen-path">Ambikly → Customers</span>. 25 per page, newest first.

| Column | What it shows |
|---|---|
| Name | First and last name joined, or an em dash when both are blank. |
| Email | The customer's email — the record's unique key. |
| Phone | The stored phone number. |
| Orders | Lifetime order count, computed live. |
| Total spent | Lifetime net spend, computed live. |
| Status | Active or Inactive. |
| Actions | Edit and Delete. |

Name, Orders and Total spent are sortable. The accepted sort columns are `id`, `email`, `first_name`, `last_name`, `total_spent`, `total_orders` and `created_at`; anything else falls back to `created_at`.

### Search and filters

Search matches email, first name, last name or phone. The status filter offers All, Active and Inactive.

### Live totals

The Orders and Total spent columns are **computed at query time**, not read from the stored `total_orders` and `total_spent` columns. Both counts exclude orders in `cancelled` and `failed` status, and spend is the sum of `total` minus `total_refunded`. A refund therefore lowers a customer's total spend the moment it is issued.

The stored columns exist but are only written by a CLI command — see [Recomputing stored totals](#recomputing-stored-totals).

## The customer record

Click Edit, or **Add Customer** for a new one. An existing customer shows three tabs; a new one shows only the profile fields until it is saved.

### Fields

| Field | Type | Required | Notes |
|---|---|---|---|
| `email` | Email | Yes | Unique across the store. Used for order confirmations, invoices and account login. |
| `first_name` | Text | No | |
| `last_name` | Text | No | |
| `phone` | Text | No | |
| `status` | `active` / `inactive` | No | Defaults to `active`. Inactive customers are hidden from the default list but can still be looked up by email. |
| `notes` | Textarea | No | Internal only. Never shown to the customer. |
| `user_id` | Integer | — | The linked WordPress user, when there is one. Not editable on this screen. |
| `total_orders` | Integer | — | Stored column. See below. |
| `total_spent` | Decimal | — | Stored column. See below. |
| `last_order_at` | Datetime | — | Stored column. See below. |
| `meta` | JSON | — | Free-form storage for add-ons. |

Email validation is strict on both create and update: a value that cannot be sanitized into a valid address is rejected with an error rather than silently blanked, and a duplicate is rejected too.

### Profile tab

The profile fields above, plus Status and Notes.

### Addresses tab

Saved addresses for this customer, from `ambikly_customer_addresses`. The tab label carries the count.

Each address has: type (`billing` or `shipping`), first and last name, company, address lines 1 and 2, city, state, postcode, country, phone and email, plus a **Set as default** checkbox.

**First name, address line 1, city and country are required.** Saving without all four is refused — an address with no name or street is worse than no address at all.

#### The default-address rule

Defaults are scoped **per type**. A customer can have one default billing address and one default shipping address at the same time.

Ticking **Set as default** on an address clears the default flag on every other address of that same type belonging to that customer. There is no database constraint enforcing this — the rule is applied on save and on update, so a default set through the admin is always exclusive within its type.

Unticking the box on an address simply clears that one flag; it does not promote another address.

### Orders tab

Every order placed by this customer, newest first, with the order number, date, status pill and total. The tab label shows the customer's real total order count, and a line above the table tells you when you are seeing only the most recent page of a longer history. Click an order number to open it. See [Orders](/orders).

## How a customer record is created

There are three routes in:

1. **Checkout.** The checkout resolves the buyer by email. An existing record with that email is reused as-is; otherwise a new record is created with whatever name and phone the checkout collected, and with the logged-in user id when there is one. Guest checkout still creates a record.
2. **Manually.** **Add Customer** on <span class="screen-path">Ambikly → Customers</span>, or the manual order screen, which resolves the buyer by billing email the same way checkout does. Useful for offline and wholesale orders.
3. **A B2B buyer invitation.** Inviting someone onto a company account creates their customer record up front, before they have ever registered. See [B2B companies & Net Terms](/b2b-companies).

Email is the key throughout. Two different orders with the same email always land on the same customer record.

## Linking to a WordPress user

A customer record carries an optional `user_id` pointing at a WordPress user. The link is what lets a logged-in shopper see their own orders and downloads on the storefront.

The link is established or backfilled at three moments:

| When | What happens |
|---|---|
| Checkout while logged in | The new record is created with the current user id. |
| A WordPress account is registered | If a customer record already exists with that email and has no `user_id`, it is linked to the new account. |
| Any login | The same backfill runs again. This covers the common case of an existing account holder who checked out while logged out. |

A record is only ever linked if its `user_id` is still empty — an existing link is never reassigned.

<div class="ui-tip"><strong>Tip:</strong> If a customer says they cannot see their past orders in their account, check that their customer record's email exactly matches their WordPress account email. Logging out and back in triggers the backfill.</div>

## Deleting a customer

The Delete action removes the customer row and cascades to their saved addresses and their company-account membership. Gift cards purchased by them are detached rather than destroyed, because a gifted card belongs to its recipient.

**Order history survives.** Orders store `customer_email` and `customer_phone` as their own snapshot and are never joined live against the customer table, so the Orders screen is unaffected.

<div class="ui-warn"><strong>Careful:</strong> Deleting a customer who has a linked WordPress account and real order history breaks their self-service view. The storefront account page resolves the customer record on every load, so their Orders and Downloads tabs go blank even though nothing in the Orders screen changed. The delete dialog warns you when this applies.</div>

Deleting also fires `ambikly_customer_deleted` with the record, before the row is removed, so add-ons can still resolve it — the Subscriptions add-on uses this to cancel active subscriptions rather than leave cron renewing a card for someone who no longer exists.

## The storefront account area

The account page is rendered by the account block or shortcode on whichever page you nominated during setup. See [Store pages](/store-pages).

A logged-out visitor gets a branded sign-in card with a lost-password link. A logged-in visitor gets a sidebar of tabs and a main panel. Tabs are switched with the `ambikly_tab` query parameter.

### Dashboard

"Hello, {name}" plus two live figures — total orders and total spent — computed the same way the admin list computes them, excluding cancelled and failed orders and netting refunds.

### Orders

A paginated table of the customer's own orders, 50 per page: order number, date, status (using the same labels as the admin), total, and an **Invoice** link that carries the order's token so it opens without a second login. See [Invoices & packing slips](/invoices).

Add-ons can append a per-order block below any row through the `ambikly_account_order_extras` filter — this is where shipment tracking numbers appear when that add-on is running.

### Downloads

A paginated table of granted files, 50 per page: file name, uses against any limit, expiry date, and a download button. Empty until a digital order is paid. See [Digital downloads](/digital-downloads).

### Addresses

The customer's saved addresses, grouped by type, with the default one flagged and listed first.

::: warning The Addresses tab is display-only
There is **no storefront address editor**. The tab lists saved addresses as read-only cards — there is no add, edit or delete control, and no form behind it.

Addresses are created at checkout and edited only from the admin, under <span class="screen-path">Ambikly → Customers</span>. If a customer needs an address changed, they have to ask you, or supply a new one at their next checkout.
:::

### Profile

Display name, email, and the phone number from the customer record. The **Edit profile** button links to WordPress's own `profile.php`, which handles name, email and password.

WordPress knows nothing about Ambikly's own phone column, so the phone number shown here cannot be changed from that button. The page says so explicitly rather than implying otherwise.

### Adding tabs

The tab list runs through the `ambikly_account_tabs` filter, and each tab fires `ambikly_account_tab_{tab}` with the customer record after the core content renders. Several Pro add-ons register their own tab this way — [Subscriptions](/addons/subscriptions), [Gift Cards](/addons/gift-cards), [Wishlist](/addons/wishlist) and [Licenses](/addons/license-pro) among them.

## Recomputing stored totals

`total_orders`, `total_spent` and `last_order_at` are real columns on the customer table, but no part of the normal order flow writes to them — everything the admin and the storefront display is computed live. The columns exist for reporting and for add-ons that want a cheap denormalized read.

Populate or refresh them with WP-CLI:

```bash
wp ambikly recompute customer-totals
wp ambikly recompute customer-totals --id=42
```

Without `--id` the command zeroes every customer first, so customers with no qualifying orders end up at zero rather than keeping a stale figure. With `--id` it zeroes and recomputes just that one.

The command counts orders that are not `cancelled`, `refunded` or `failed`, sums `total` minus `total_refunded`, and records the most recent order date. Note that this excludes `refunded` orders entirely, which is a stricter rule than the live computation used by the admin list — the two figures can legitimately differ for a store with refunded orders.

See [WP-CLI](/developers/wp-cli).

## Permissions

Viewing customers requires `ambikly_view_store`. Creating, editing and deleting require `ambikly_manage_store`. A Support Agent can look a customer up but cannot change or delete anything. See [Roles & permissions](/roles).

## For developers

| Method | Route | Permission |
|---|---|---|
| GET | `/ambikly/v1/customers` | `ambikly_view_store` |
| POST | `/ambikly/v1/customers` | `ambikly_manage_store` |
| GET | `/ambikly/v1/customers/{id}` | `ambikly_view_store` |
| PUT | `/ambikly/v1/customers/{id}` | `ambikly_manage_store` |
| DELETE | `/ambikly/v1/customers/{id}` | `ambikly_manage_store` |
| GET | `/ambikly/v1/customers/{id}/orders` | `ambikly_view_store` |
| GET | `/ambikly/v1/customers/{id}/addresses` | `ambikly_view_store` |
| POST | `/ambikly/v1/customers/{id}/addresses` | `ambikly_manage_store` |
| PUT | `/ambikly/v1/customers/{id}/addresses/{address_id}` | `ambikly_manage_store` |
| DELETE | `/ambikly/v1/customers/{id}/addresses/{address_id}` | `ambikly_manage_store` |

`GET /customers/{id}` returns the record with live `total_orders` and `total_spent` merged over the stored columns, plus an `addresses` array. `GET /customers/{id}/orders` is paginated in the body with `total`, `page`, `per_page` and `total_pages`. See [Endpoint reference](/developers/endpoints).

## Where to go next

- [Roles & permissions](/roles) — who can see and change customer data.
- [Orders](/orders) — the order history behind these totals.
- [B2B companies & Net Terms](/b2b-companies) — customers who buy on a company account.
- [WP-CLI](/developers/wp-cli) — the recompute command in full.
