---
title: B2B companies & Net Terms
description: Company accounts, credit limits, buyers and the "Bill my company" checkout option — how credit is reserved atomically, how terms set due dates, and how to record an invoice payment.
prev:
  text: "Roles & permissions"
  link: /roles
next:
  text: "Reports"
  link: /reports
---

# B2B companies & Net Terms

A company account is a credit-limited billing entity that one or more customer logins buy against. Buyers on an active company account can check out with **Bill my company** instead of a card, which invoices the order against the company's credit line and sets a due date from its agreed payment terms.

::: tip Every operation here is also a REST endpoint
The `/ambikly/v1/companies*` routes are the complete, canonical surface for company management — bulk imports, ERP syncs and scripted onboarding all go through them, and every example on this page is a real, working call. Nothing on the admin screen does anything the API cannot.
:::

## What a company account holds

| Field | Type | Notes |
|---|---|---|
| `name` | Text | Required. The only mandatory field. |
| `status` | `active` / `suspended` | Defaults to `active`. Only an active company can reserve credit. |
| `billing_email` | Email | Accounts-payable contact. Also searchable. |
| `tax_id` | Text | EIN, VAT number, whatever applies. |
| `net_terms_enabled` | Boolean | Whether "Bill my company" is offered to this account's buyers at all. |
| `payment_terms` | Terms code | One of the six codes below. Defaults to `net_30`. |
| `credit_limit` | Decimal | The total outstanding invoice value this account may carry at once. Clamped to a minimum of 0. |
| `credit_used` | Decimal | Read-only. Managed exclusively by the credit reserve/release path. |
| `price_tier_discount` | Decimal | A flat percent off, 0–100, applied automatically to this account's buyers. |
| `notes` | Textarea | Internal only. |

`available_credit` is computed as `credit_limit` minus `credit_used`, floored at zero, and returned alongside the record.

### `credit_used` is never directly writable

The update endpoint uses a strict field whitelist that does not include `credit_used`. It moves only through the atomic reserve and release operations described below. A bulk-import script that tries to set it will find the key silently dropped, which is deliberate — a read-modify-write on that column is exactly the race the design avoids.

## Payment terms

| Code | Label | Days until due |
|---|---|---|
| `due_on_receipt` | Due on receipt | 0 |
| `net_7` | Net 7 | 7 |
| `net_15` | Net 15 | 15 |
| `net_30` | Net 30 | 30 |
| `net_60` | Net 60 | 60 |
| `net_90` | Net 90 | 90 |

An unrecognized terms code falls back to 30 days. The due date is stamped at checkout using the site's own timezone, so it stays consistent with the order's other timestamps.

## The admin screen

Companies live at <span class="screen-path">Ambikly → Companies</span>, in the Sell group of the sidebar.

The list shows name, status, billing email, whether net terms are on, payment terms, credit limit, credit used and available credit, with search across name and billing email and a status filter. Opening a company gives you three panels:

- **Account details** — every field in the table above, plus live Credit used and Available credit tiles.
- **Buyers** — the people who can order on this account, with an **Invite buyer** dialog taking an email and a role.
- **Orders** — invoices billed to this company, with payment status, total and due date, each linking through to the order.

Creating and editing require `ambikly_manage_store`; viewing requires `ambikly_view_store`. See [Roles & permissions](/roles).

## Managing companies through the API

All examples assume a WordPress REST nonce. Authentication is stock WordPress — a logged-in cookie plus `X-WP-Nonce`, or an Application Password. See [REST API](/developers/rest-api).

### Create a company

```bash
curl -X POST 'https://example.com/wp-json/ambikly/v1/companies' \
  -H 'Content-Type: application/json' \
  -H 'X-WP-Nonce: <nonce>' \
  --cookie-jar /dev/null --cookie 'wordpress_logged_in_...=...' \
  -d '{
    "name": "Acme Corp",
    "billing_email": "ap@acme.com",
    "tax_id": "EIN 12-3456789",
    "status": "active",
    "net_terms_enabled": true,
    "payment_terms": "net_30",
    "credit_limit": 25000,
    "price_tier_discount": 10,
    "notes": "Quarterly PO process. Contact Dana in AP."
  }'
```

Only `name` is required. Omitting `status` defaults it to `active`; omitting `payment_terms` defaults it to `net_30`.

### List companies

```bash
curl 'https://example.com/wp-json/ambikly/v1/companies?status=active&search=acme&page=1&per_page=25' \
  -H 'X-WP-Nonce: <nonce>'
```

Accepts `page`, `per_page`, `search` (matches name or billing email), `status`, `orderby` and `order`. Sortable columns are `id`, `name`, `status`, `credit_limit`, `credit_used` and `created_at`.

Pagination is in the body, not in headers:

```json
{ "success": true, "total": 42, "page": 1, "per_page": 25, "total_pages": 2, "data": [ … ] }
```

### Read one company

```bash
curl 'https://example.com/wp-json/ambikly/v1/companies/7' -H 'X-WP-Nonce: <nonce>'
```

Returns the record plus `available_credit` and `payment_terms_options`.

### Update a company

```bash
curl -X PUT 'https://example.com/wp-json/ambikly/v1/companies/7' \
  -H 'Content-Type: application/json' -H 'X-WP-Nonce: <nonce>' \
  -d '{ "credit_limit": 50000, "payment_terms": "net_60" }'
```

Partial updates are supported — send only the keys you want changed.

### Suspend a company

```bash
curl -X PUT 'https://example.com/wp-json/ambikly/v1/companies/7' \
  -H 'Content-Type: application/json' -H 'X-WP-Nonce: <nonce>' \
  -d '{ "status": "suspended" }'
```

Suspension stops new credit reservations immediately — the reserve is conditional on the company being active. Existing invoiced orders are untouched and still need paying.

### List a company's orders

```bash
curl 'https://example.com/wp-json/ambikly/v1/companies/7/orders?outstanding=true' \
  -H 'X-WP-Nonce: <nonce>'
```

With `outstanding=true` the list is limited to orders still at `payment_status: invoiced`. Results are ordered by `due_date` ascending, which makes this a usable accounts-receivable view.

### Invite a buyer

```bash
curl -X POST 'https://example.com/wp-json/ambikly/v1/companies/7/buyers' \
  -H 'Content-Type: application/json' -H 'X-WP-Nonce: <nonce>' \
  -d '{ "email": "buyer@acme.com", "role": "buyer" }'
```

`role` is `buyer` or `owner`; anything else is coerced to `buyer`.

### List and remove buyers

```bash
curl 'https://example.com/wp-json/ambikly/v1/companies/7/buyers' -H 'X-WP-Nonce: <nonce>'

curl -X DELETE 'https://example.com/wp-json/ambikly/v1/companies/7/buyers/31' \
  -H 'X-WP-Nonce: <nonce>'
```

Removal is a soft delete — the membership row's status becomes `removed`, so the person can be re-invited later onto the same company without a unique-key collision. The buyer id must belong to the company in the URL or the call 404s.

### Delete a company

```bash
curl -X DELETE 'https://example.com/wp-json/ambikly/v1/companies/7' -H 'X-WP-Nonce: <nonce>'
```

A company with `credit_used` above zero is refused with a **409** and the message "This company has an outstanding net-terms balance." Deleting the record would remove your only view of money still owed, while the invoiced orders themselves would live on. Record the payments or resolve the orders first.

Deletion cascades to the company's buyer memberships.

## Buyers

A buyer is a link between one customer record and one company, stored in `ambikly_company_users`.

| Field | Values |
|---|---|
| `role` | `owner` or `buyer` |
| `status` | `invited`, `active`, `removed` |
| `invited_email` | The address the invitation was sent to |

An **owner** can invite and remove other buyers on their own company through the self-service routes. A plain **buyer** can only place orders.

### What inviting does

1. Finds or creates a customer record for the email — the record exists before the person has ever registered.
2. Refuses if that customer already belongs to a **different** company, or is already an active buyer on this one.
3. Reactivates a previously removed membership rather than inserting a duplicate.
4. Inserts or updates the membership at status `invited`.
5. Sends the buyer-invitation email: "You've been added to {company} on {site}", telling them to sign in or register with that address. This email is hard-coded and has no toggle. See [Emails](/emails).

### One company per customer

`ambikly_company_users.customer_id` carries a unique key: **a customer belongs to at most one company**. Net-terms credit is scoped per company, so a buyer with two memberships would raise an unanswerable question about whose credit line an order draws against. The constraint removes the ambiguity by construction.

Inviting someone already on another company returns a 400 with "This person already belongs to a different company account." To move them, remove them from the first company, then invite them to the second.

### How a buyer becomes linked

A buyer is resolved to their company through the customer record's `user_id`. That link is backfilled on registration and on every login, so an invited buyer who registers later — or an existing account holder who checked out logged out — ends up correctly linked. See [Customers](/customers).

### Customer self-service routes

A logged-in company **owner** manages their own team without staff access:

| Method | Route | Who |
|---|---|---|
| GET | `/ambikly/v1/companies/me` | Any logged-in buyer on a company |
| GET | `/ambikly/v1/companies/me/buyers` | Owner only |
| POST | `/ambikly/v1/companies/me/buyers` | Owner only |
| DELETE | `/ambikly/v1/companies/me/buyers/{buyer_id}` | Owner only |

"Me" resolves through the logged-in user, never through a company id the client supplies, and a buyer id that belongs to another company is rejected. A non-owner gets a 403; someone with no company membership gets a 404.

## The "Bill my company" checkout option

The gateway id is `net_terms` and its title is "Bill my company".

### Eligibility versus enforcement

These are deliberately two separate checks against the same rule.

**Eligibility** decides whether the option is *offered*. The checkout resolves the logged-in user's company context and shows the gateway only when the company is active, has `net_terms_enabled`, and has available credit above zero. This is advisory — a concurrent order could claim that credit between the moment the option is shown and the moment checkout is submitted.

**Enforcement** is the credit reservation itself, and it is the real gate. It runs when the order is processed, and it is atomic.

This is why a buyer can see "Bill my company" and still be told at submission that the order exceeds their available credit. That is the system working correctly, not a bug.

### Atomic credit reservation

Reservation is a single conditional database update:

```sql
UPDATE ambikly_companies
   SET credit_used = credit_used + :amount
 WHERE id = :id AND status = 'active' AND credit_used + :amount <= credit_limit
```

Because the condition lives inside the same statement as the write, MySQL's row lock picks exactly one winner. Two concurrent net-terms orders for the same company can never both succeed past the credit limit, even if both passed an earlier "is there enough credit" check. The same pattern is used for stock decrements and coupon usage limits.

If the update affects no rows there was not enough credit, and the gateway fails the order with a message naming the remaining balance. No partial state is written.

### What a successful net-terms checkout does

| Field | Value |
|---|---|
| `status` | `processing` |
| `payment_status` | `invoiced` |
| `payment_method` | `net_terms` |
| `payment_method_title` | Bill my company |
| `company_id` | The buyer's company |
| `payment_terms` | The company's terms code |
| `due_date` | Now plus the terms' days, in the site's timezone |

The order's `total` is added to the company's `credit_used`. No money has moved.

### The price tier discount

A company's `price_tier_discount` is applied automatically to any logged-in buyer's cart — it is an entitlement of the account, not something the customer opts into. It runs after coupons, shipping and tax have been computed, takes the given percent off the subtotal, and is capped at the cart total.

The discount updates both `discount_total` and `total`, so the invoice, the discount reporting and any commission calculation all reconcile. It appears in the cart's adjustments as "Acme Corp account discount (10%)". The company must be active for it to apply.

## Recording an invoice payment

When the wire, check or ACH actually lands, record it against the order — never through the refund path.

From the admin: open the order and click **Record Payment**. The button appears only for a `net_terms` order still at `payment_status: invoiced`.

From the API:

```bash
curl -X POST 'https://example.com/wp-json/ambikly/v1/orders/44/record-payment' \
  -H 'Content-Type: application/json' -H 'X-WP-Nonce: <nonce>' \
  -d '{ "reference": "WIRE-2026-0417" }'
```

`reference` is optional; when omitted a reference of `net_terms_{order id}` is generated.

The endpoint:

1. Refuses anything that is not a net-terms invoice with a linked company.
2. Claims the pending-to-paid transition atomically.
3. Releases the order total back onto the company's credit line — tied to that same atomic claim, so a double-submitted request cannot release credit twice and manufacture free credit.
4. Marks the order paid, sets `total_paid`, writes a system note, and fires `ambikly_order_paid`.

<div class="ui-warn"><strong>Careful:</strong> Do not use the refund path to close out a paid invoice. Both release credit, but a refund records the order as <em>refunded</em> — cancelling the sale in your reports and in the customer's lifetime spend. See <a href="/refunds">Refunds &amp; cancellations</a>.</div>

## When credit is released

| Event | Credit released |
|---|---|
| Invoice payment recorded | Yes, the full order total |
| Order refunded | Yes, the refunded amount |
| Unpaid order cancelled or failed | Yes, the full order total |
| Paid order cancelled after the fact | No — that is a refund scenario, handled by the refund path |
| Unpaid order hard-deleted | Yes, the full order total |

Releases are floored at zero, so a duplicate release can never push `credit_used` negative.

## Where company data surfaces

- **The order detail screen** shows "Billed to company #N" with the terms and the due date, linking to the company.
- **The Orders list** filters on the `invoiced` payment status, isolating every unpaid B2B invoice.
- **The company's own screen** lists its orders ordered by due date.
- **The company's orders endpoint** with `outstanding=true` is the scriptable version of the same view.

## Limitations worth knowing

- There is no automated dunning: nothing emails a buyer when an invoice passes its due date.
- Partial invoice payments are not modelled. Record Payment settles the whole order.
- `credit_used` is a single figure per company, not a per-invoice ledger. Reconstruct the detail from the company's orders.
- A buyer's company membership is resolved through their linked WordPress account, so a guest checkout can never use net terms.

## For developers

| Method | Route | Permission |
|---|---|---|
| GET | `/ambikly/v1/companies` | `ambikly_view_store` |
| POST | `/ambikly/v1/companies` | `ambikly_manage_store` |
| GET | `/ambikly/v1/companies/{id}` | `ambikly_view_store` |
| PUT | `/ambikly/v1/companies/{id}` | `ambikly_manage_store` |
| DELETE | `/ambikly/v1/companies/{id}` | `ambikly_manage_store` |
| GET | `/ambikly/v1/companies/{id}/orders` | `ambikly_view_store` |
| GET | `/ambikly/v1/companies/{id}/buyers` | `ambikly_view_store` |
| POST | `/ambikly/v1/companies/{id}/buyers` | `ambikly_manage_store` |
| DELETE | `/ambikly/v1/companies/{id}/buyers/{buyer_id}` | `ambikly_manage_store` |
| GET | `/ambikly/v1/companies/me` | Logged in |
| GET | `/ambikly/v1/companies/me/buyers` | Logged in, owner |
| POST | `/ambikly/v1/companies/me/buyers` | Logged in, owner |
| DELETE | `/ambikly/v1/companies/me/buyers/{buyer_id}` | Logged in, owner |
| POST | `/ambikly/v1/orders/{id}/record-payment` | `ambikly_manage_store` |

Every response follows the standard envelope — `{ "success": true, "data": …, "message": … }` — and errors come back as `WP_Error` JSON with the status in `data.status`. See [Endpoint reference](/developers/endpoints).

## Where to go next

- [Reports](/reports) — how invoiced orders count toward revenue.
- [Orders](/orders) — the `invoiced` payment status and the Record Payment control.
- [Refunds & cancellations](/refunds) — why refund and record-payment must not be confused.
- [Endpoint reference](/developers/endpoints) — the full route list.
