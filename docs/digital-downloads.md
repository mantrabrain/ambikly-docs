---
title: Digital downloads
description: Sell files with Ambikly — shared files and pricing plans, download limits and expiry, the tokenized download endpoint, the customer Downloads tab and IP logging.
prev:
  text: Variations
  link: /variations
next:
  text: Categories, tags & brands
  link: /categories
---

# Digital downloads

A digital product delivers one or more files after payment. This page covers how files and prices are attached, what the buyer sees, how the download link is authorized, and what is logged.

## Creating a digital product

<ol class="step-list">
  <li>Go to <span class="screen-path">Ambikly → Products</span> and click <strong>Add New Product</strong>.</li>
  <li>Enter a name and choose <strong>Digital product</strong>.</li>
  <li>Click <strong>Continue</strong>. The digital editor opens on a new draft.</li>
  <li>Upload files under <strong>Downloadable files</strong>.</li>
  <li>Add at least one plan under <strong>Pricing plans</strong> and give it a price.</li>
  <li>Write the description, then <strong>Publish</strong>.</li>
</ol>

This sets `type = digital` on the product row. `is_downloadable` defaults to 1 for digital products, and digital products never track stock — the editor sends `manage_stock = 0`, `stock_quantity = null` and `stock_status = instock` on every save.

## Downloadable files

The **Downloadable files** card holds the product's shared file pool. Every pricing plan uses this pool unless it overrides it.

<ol class="step-list">
  <li>Click <strong>Upload</strong> (or the dashed drop area when the pool is empty).</li>
  <li>Pick one or more files from the WordPress media library. Any file type works.</li>
  <li>Each file gets a version of <code>1.0.0</code>. Edit it inline in the small <code>v</code> box.</li>
  <li>Remove a file with the × at the end of its row.</li>
</ol>

Files are stored in `ambikly_product_files`.

| Column | What it holds |
|---|---|
| `product_id` | The owning product. |
| `pricing_plan_id` | `NULL` for a shared file; a plan ID for a plan-specific override. |
| `name` | Display name. |
| `file_url` | The media library URL, run through `esc_url_raw`. |
| `file_name` | The original file name. |
| `version` | Free-text version string, e.g. `2.3.1`. |
| `position` | Ordering within its set. |

On every save Ambikly replaces the whole set for that product and plan pair rather than diffing it. A file row with no `url` is skipped.

<div class="ui-tip"><strong>Tip:</strong> the file URL is stored as-is, so a file hosted on a CDN or an external origin works exactly like one in your uploads folder. Only files inside your own uploads directory can have their size recorded for download analytics.</div>

### Where files are served from

Ambikly stores the URL and redirects to it. It does not proxy the bytes and it does not move your uploads out of `wp-content/uploads`. A file in the media library keeps its normal, publicly guessable URL — the tokenized link controls the link you hand the customer, not access to the raw path. Put files you must protect behind a host that can enforce access on its own.

## Pricing plans

A digital product prices through plans, not through the `price` column. Click **Add plan** (or **Add first plan**) to open the plan drawer.

| Field | Stored as | Notes |
|---|---|---|
| Plan name | `name` | Required. Defaults to `Standard` for the first plan. |
| Price | `price`, decimal(10,2) | May not be negative. |
| Sale price | `sale_price` | Optional. Must be lower than the plan price. |
| Recurring billing | `is_subscription` | Off by default. |
| Bill every | `subscription_cycle` | Recurring only. Default 1. |
| Period | `subscription_period` | `daily`, `weekly`, `monthly` or `yearly`. |
| Trial days | `trial_period` | Recurring only. Default 0. |
| Payments | `subscription_length` | Recurring only. Blank means no end. |
| Signup fee | `signup_fee` | Recurring only. May not be negative. |
| Downloadable files | `ambikly_product_files` rows | Shared by default; **Override for this plan** switches to a plan-specific list. |

The drawer previews the billing line — for example `$9.00 signup · $29.00 / monthly · 14-day trial` — as soon as a price is set.

Plans are stored in `ambikly_product_pricing_plans`, ordered by `position`. Saving replaces the full set: a plan you removed from the form is deleted, along with its file overrides.

New plans carry a temporary client-side ID like `plan-1718…`. Only a numeric ID that already exists in the table is treated as an update target, so a new plan never overwrites an existing one.

### Shared versus per-plan files

Each plan is in one of two states:

- **Uses shared files.** The plan has no override rows. It delivers whatever is in the product's shared pool, including files you add later.
- **Overrides.** The plan has its own list, even if that list is empty. The shared pool is ignored for this plan.

Switching a plan to **Use shared files** deletes its override rows on the next save.

<div class="ui-warn"><strong>Careful:</strong> when a product has <code>license_enabled</code> on, each plan drawer shows an "Activations per key" field. That value is sent on save but is not persisted — <code>save_pricing_plans()</code> does not write it and the API always reads it back as <code>null</code>. Per-plan activation limits do not work in the free core. The product-level <code>license_activation_limit</code> column is the value that is stored.</div>

## Download limits and expiry

Two product-level columns control how long and how often a granted file can be fetched.

| Column | Meaning | Empty means |
|---|---|---|
| `download_limit` | Maximum number of successful downloads per grant. | Unlimited |
| `download_expiry_days` | Days from the moment the grant is created until it stops working. | Never expires |

<div class="ui-warn"><strong>Careful:</strong> the digital product editor has no field for either value. The form carries them in its state and sends them on save, but no control is ever rendered, so they can only be set through the REST API (<code>download_limit</code> and <code>download_expiry</code> or <code>download_expiry_days</code> on <code>POST</code>/<code>PUT /products</code>) or through the <a href="/import-export">CSV importer</a> (<code>download_limit</code> and <code>download_expiry_days</code> columns). Saving the product from the admin editor does not clear values set elsewhere — the form sends <code>null</code> and the update path skips null keys.</div>

Both values are copied onto each grant at the moment the grant is created. Changing them on the product afterwards does not alter grants that already exist.

## What happens when an order is paid

On the `ambikly_order_paid` event, Ambikly walks the order's items and, for each item that is downloadable or whose product type is `digital`:

<ol class="step-list">
  <li>Loads the product's files. When the line item carries a <code>pricing_plan_id</code>, it takes the shared files plus that plan's overrides.</li>
  <li>Skips the item entirely if no files are attached — no phantom grant is created.</li>
  <li>Reads <code>download_limit</code> and <code>download_expiry_days</code> from the product and turns the expiry into an absolute timestamp.</li>
  <li>Inserts one row in <code>ambikly_downloads</code> per file, each with its own opaque token.</li>
</ol>

The step is idempotent: a grant for an existing order, order item and file triple is left alone, so a replayed payment webhook does not double-issue.

An order note records how many grants were issued.

Tokens are 48 hexadecimal characters from `random_bytes(24)`. On a host without `random_bytes` the fallback is an MD5 of a unique ID plus a generated password.

### Digital-only orders auto-complete

If every item on the order is digital or downloadable, Ambikly immediately moves the order to **Completed** and logs `Digital-only order auto-completed.` A mixed cart stays in **Processing** so you still fulfill the physical part. See [Orders](/orders).

### License keys

Ticking **Generate license keys** on a digital product sets `license_enabled`. Keys are minted on the same `ambikly_order_paid` event and an order note records how many were issued. A full refund revokes them and logs that too. See [Refunds & cancellations](/refunds).

## The download endpoint

```
GET /wp-json/ambikly/v1/downloads/{token}
```

The route is public. The token pattern is `[a-f0-9]{32,64}`. There is no login check and no nonce — knowing the token is the permission. That is deliberate: the link is emailed to the buyer and shown in their account, and it has to work from a mail client.

Every request runs these checks in order, and any failure returns HTTP 403 with code `download_denied` and a plain message.

| Check | Message on failure |
|---|---|
| The token matches a grant | Invalid download token. |
| The grant has not passed `access_expires_at` | Download link has expired. |
| `download_count` is below `download_limit` | Download limit reached. |
| The order still exists | Order no longer exists. |
| The order is not cancelled or refunded | This order has been cancelled. |
| Payment is `paid` or `partially-paid`, **or** the order status is `processing` or `completed` | Payment is not yet confirmed for this order. |

Cancelling a paid order is enough to kill its download links on its own. A plain cancellation leaves `payment_status` at `paid`, so the status check is what stops access.

On success, Ambikly:

1. Increments `download_count`.
2. Sets `last_downloaded_at`.
3. Appends `{ip, at}` to the grant's IP log.
4. Fires the `ambikly_download_served` action.
5. Issues a `302` redirect to the file URL.

The URL passes through the `ambikly_download_file_url` filter before the redirect, so an add-on can swap in a signed or stamped copy.

If the grant somehow has no valid URL the endpoint returns 500 with `no_file_url`.

## IP logging

Each grant carries an `ip_log` column holding a JSON array of `{"ip": "…", "at": "…"}` entries, one per successful download, trimmed to the **last 20**. The IP is taken from the first of `HTTP_CF_CONNECTING_IP`, `HTTP_X_FORWARDED_FOR` or `REMOTE_ADDR` that is set, splitting on the first comma.

There is no admin screen that renders this log in the free core. Read it directly from `ambikly_downloads`, or use the [Download Analytics](/addons/download-analytics) add-on, which listens on `ambikly_download_served`.

## What the buyer sees

### The product page

A digital product page shows a **Choose a plan** radio group when the product has pricing plans, with each plan's name, effective price and billing period. The product's own price is deliberately not printed above the plans, because it stays at 0 for a plan-priced product.

The buy button reads **Buy now** rather than **Add to Cart**, and the form carries an immediate-checkout flag so the customer goes straight to checkout instead of the cart page. The quantity field is hidden and fixed at 1.

### The Downloads tab

After payment, files appear under <span class="screen-path">My account → Downloads</span> on your storefront account page — the `?ambikly_tab=downloads` view of the account page.

| Column | Contents |
|---|---|
| File | The grant's file name, or "Download" when it has none. |
| Uses | `count` when unlimited, `count / limit` when a limit is set. |
| Expires | The expiry timestamp, or "No expiry". |
| — | A **Download** button pointing at the tokenized URL. |

The table shows 50 rows per page and pages with `?ap=`. One row appears per order item and file pair, so a plan with four files produces four rows for one purchase.

Before any digital order is paid, the tab reads: *No downloadable files yet. Once a digital order is paid your files will appear here.*

## Reading grants through the API

| Method | Route | Permission |
|---|---|---|
| `GET` | `/ambikly/v1/downloads/{token}` | Public — the token is the credential |
| `GET` | `/ambikly/v1/orders/{id}/downloads` | View store |
| `GET` | `/ambikly/v1/customers/{id}/downloads` | View store |
| `GET` | `/ambikly/v1/account/downloads` | Any logged-in user, scoped to their own customer record |

The three list routes return `token`, `file_name`, `count`, `limit`, `expires_at` and a ready-made `url`. The customer and account routes also include `order_id` and `product_id`.

`/account/downloads` returns an empty list, not an error, when the logged-in user has no customer record yet.

## Limits worth knowing

- Grants are created from **files**. A digital product with no files attached produces no grants and the customer's Downloads tab stays empty, even though the order completed.
- A file's `version` is stored and displayed in the admin, but the download endpoint always serves the current `file_url`. There is no version history and no "download an older build" flow in the free core.
- `helpful_count`, `restrictDownloads`, `allowedRoles` and `hideDownloadLinks` appear in the product form's internal state but have no control and no server-side reader. Role-restricted downloads are not implemented.
- There is no bulk "regenerate all download links" action.

## Pro add-ons

<div class="pro-callout">
  <div class="pro-callout__head"><span class="pro-callout__badge">PRO</span><span class="pro-callout__title">More from your digital catalog</span></div>
  <p class="pro-callout__desc">Stamp buyer details into delivered PDFs, report on who downloaded what, and turn license keys into a full activation API with remote checks and site limits.</p>
  <a class="pro-callout__cta" href="https://ambikly.com/pricing/">See pricing →</a>
</div>

- [PDF Stamping](/addons/pdf-stamping) — watermark each delivered PDF with the buyer's details.
- [Download Analytics](/addons/download-analytics) — per-product and per-customer download reporting, driven by `ambikly_download_served`.
- [License Pro](/addons/license-pro) — activation limits, remote validation and a license management screen.

## Troubleshooting

| Symptom | Cause |
|---|---|
| Order completed but the Downloads tab is empty | No files are attached to the product, or the plan overrides files with an empty list. |
| "Payment is not yet confirmed for this order." | The order is not `paid` or `partially-paid`, and its status is not `processing` or `completed`. |
| "This order has been cancelled." | The order was cancelled or refunded. Cancelling alone is enough — the payment status is not checked. |
| "Download limit reached." | `download_count` has hit the grant's `download_limit`. Limits are fixed on the grant at creation; changing the product does not raise them. |
| A download limit set through the API vanished | It did not. The admin editor has no field for it, so it is invisible there — read it back with `GET /products/{id}`. |
| The order stayed in Processing | At least one item on the order is physical. Only fully digital orders auto-complete. |

## Next

- [Categories, tags & brands](/categories) — organizing the catalog.
- [Orders](/orders) — order statuses and what each one means.
- [Emails](/emails) — which transactional emails exist.
