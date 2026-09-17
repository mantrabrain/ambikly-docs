---
title: Products
description: The Ambikly Products screen and the full product editor — every list column, filter, bulk action, tab and field, plus what each one stores and what it does not.
prev:
  text: A tour of the admin
  link: /admin-tour
next:
  text: Variations
  link: /variations
---

# Products

Everything you sell lives on one screen. This page covers the Products list — columns, search, filters, bulk actions — and every field in the product editor, for both product types that have an admin interface.

Prices in examples use `$`. Your store's currency is set once in <span class="screen-path">Ambikly → Settings → Store</span> and every price field follows it.

## The Products screen

Open <span class="screen-path">Ambikly → Products</span>. The list shows 50 products per page, newest first.

### Toolbar

| Control | What it does |
|---|---|
| Search | Matches `name`, `sku`, `description` and `short_description`. Waits 500 ms after you stop typing, then resets to page 1. |
| All Categories | Filters by the product's single category. |
| All Types | `Physical` or `Digital` only. No other type is offered here. |
| All Status | `Published` or `Draft`. |
| Columns | Toggles optional columns on and off. |
| Export | Downloads a product CSV using the Status and Type filters currently set. See [Import & export (CSV)](/import-export). |
| Add New Product | Opens the "What are you selling?" dialog. |

### Columns

| Column | Shown by default | Sortable | Notes |
|---|---|---|---|
| Product | Yes (always) | Yes | Thumbnail, name, and the short description underneath. |
| SKU | Yes | Yes | `—` when the product has none. |
| Type | Yes | Yes | Badge showing the stored `type` value. |
| Price | Yes | Yes | Strikes the regular price and shows the sale price in red when a sale price is lower. |
| Stock | Yes | Yes | See the badge rules below. |
| Status | No | Yes | Published / Draft pill. |
| Category | No | No | Resolved from the category list. |
| Date | No | No | Created date. |

Your column choices are stored in your own browser under `ambikly_products_visible_columns`. They are per-browser, not per-user-account, and do not sync to another machine.

The Stock badge reads:

| Condition | Badge |
|---|---|
| Stock tracking off, or stock status is `instock` | In Stock |
| Quantity is 0 | Out of Stock |
| Quantity is below 10 | Low (n) |
| Anything else | In Stock (n) |

<div class="ui-warn"><strong>Careful:</strong> the "Low" cut-off in this badge is hard-coded at 10. It ignores both the per-product low-stock threshold and the global one in <span class="screen-path">Ambikly → Settings → Store</span>. Those two values drive the <a href="/inventory">low-stock alert emails</a>, not this badge.</div>

### Row actions

Each row has View, Edit and Delete.

Delete asks for confirmation first. While the dialog opens, Ambikly calls `GET /products/{id}/usage` in the background and upgrades the message once the answer arrives: if the product appears on past orders, the dialog names the number of orders and warns that deleting it will not change those orders' totals but will break the link back to the product from them.

Deleting a product also removes its rows from every child table: pricing plans, downloadable files, attributes, attribute values, variations, grouped-product links, product meta, product relationships, product terms, reviews, bundle rows and license keys. This is not reversible.

### Bulk actions

Select one or more rows and a bar appears under the filters.

| Action | What it does |
|---|---|
| Set to Published | Sets `status = published` on every selected product. |
| Set to Draft | Sets `status = draft`. |
| Export Selected | Exports only the selected product IDs to CSV. |
| Delete Selected | Permanently deletes the selected products and all their child rows. |

Bulk delete asks for confirmation but does not run the order-usage check that a single delete does.

## Creating a product

<ol class="step-list">
  <li>Go to <span class="screen-path">Ambikly → Products</span> and click <strong>Add New Product</strong>.</li>
  <li>Type the product name. The field caps at 200 characters and shows a counter.</li>
  <li>Choose <strong>Physical product</strong> or <strong>Digital product</strong>.</li>
  <li>Click <strong>Continue</strong>. Ambikly creates the product immediately as a draft and opens the editor.</li>
</ol>

The product exists from that moment, as a draft. If you close the tab the draft stays in the list.

## Product types

The `ambikly_products` table stores two separate fields: `type` is the base nature of the product, and `sub_type` is the variant.

| `type` | `sub_type` | Admin UI | How to create it |
|---|---|---|---|
| `physical` | `simple` | Yes | Add New Product → Physical product |
| `physical` | `variable` | Yes | Physical product, then switch Product type to "Product with variants" |
| `digital` | `simple` | Yes | Add New Product → Digital product |
| `external` | — | **No** | CSV import or the REST API only |
| `grouped` | — | **No** | CSV import or the REST API only |
| `bundle` | — | No | CSV import or the REST API only (the Bundles Pro add-on manages these) |
| `subscription` | — | Partial | Existing rows load and re-save; there is no way to create one from the editor |

<div class="ui-warn"><strong>Careful:</strong> Grouped and External products have no admin interface. Tab components for both exist in the plugin's source (<code>GroupedProductsTab</code>, <code>ExternalSettingsTab</code>) but nothing imports or renders them, and the Product type selector offers only "Single product" and "Product with variants". You can still create <code>type=external</code> and <code>type=grouped</code> rows by CSV import or through <code>POST /ambikly/v1/products</code>, and the storefront handles them: an external product renders its <code>button_text</code> as a link to its <code>external_url</code> instead of an Add to Cart button. Editing one in the admin will not show you those fields.</div>

Switching an existing physical product between "Single product" and "Product with variants" only changes `sub_type`. No pricing or stock data is discarded when you switch.

## The physical product editor

The editor is one page. The main column holds cards; four of them open as side drawers.

### Product name

| Field | Type | Required | Notes |
|---|---|---|---|
| Name | Text | Yes | Saved to `name`. |
| Web address (URL slug) | Text | No | Auto-generated from the name. Made unique on save by appending `-1`, `-2` and so on. |

Product URLs are query-string based: `{your shop page}?ambikly_product={slug}`. There is no pretty-permalink rewrite in the free core, so changing the slug changes that query value and nothing else.

### Photos

Up to 10 images. The first becomes the main listing image (`image`); the rest go to `gallery`, stored as a JSON array of URLs. Images come from the WordPress media library. Remove one with the × that appears on hover.

If no main image is set when you pick several at once, the first selection becomes the main image and the rest go to the gallery.

### Pricing

| Field | Type | Required | Notes |
|---|---|---|---|
| Selling price | Decimal(10,2) | Yes for simple products | Saved to `price`. Negative values are rejected with `invalid_price`. |
| Sale price | Decimal(10,2) | No | Saved to `sale_price`. Must be strictly lower than the selling price or the save fails with `Sale price must be lower than the regular price.` |

The editor shows the discount percentage live under the sale price field, and turns it into a red warning when the sale price is not lower.

A sale price is active as soon as it is set — there are no start and end dates in the free core. `Product::isOnSale()` passes through the `ambikly_product_on_sale` filter, which is how the Flash Sales Pro add-on gates a sale to a schedule.

For a variable product, the base price is optional. Each variation carries its own price. See [Variations](/variations).

### Description

| Field | Type | Required | Notes |
|---|---|---|---|
| Full description | Rich text | Yes to publish | Saved to `description`, sanitized with `wp_kses_post`. |
| Short tagline | Text | No | Saved to `short_description`. Shown on listing cards and used as the meta description fallback. A counter warns past 160 characters but does not block you. |

With Ambikly Pro and the [AI Descriptions](/addons/ai-descriptions) add-on active, a generate card appears above the description fields.

### Inventory & stock (drawer)

| Field | Stored as | Notes |
|---|---|---|
| Track stock levels | `manage_stock` | On by default. Off means the Stock status field alone decides availability. |
| Quantity in stock | `stock_quantity` | Only shown when tracking is on. |
| Low stock alert | Product meta `low_stock_threshold` | Per-product override of the global threshold. Clearing it deletes the meta row and falls back to the global value. |
| Stock status | `stock_status` | `instock`, `outofstock` or `onbackorder`. |
| When sold out | **Not stored** | See the warning below. |

<div class="ui-warn"><strong>Careful:</strong> the "When sold out" dropdown (Block purchase / Allow, warn customer / Allow silently) is sent on save as <code>backorders</code>, but there is no <code>backorders</code> column and nothing on the server reads the value. Backorders are not implemented in the free core. The <code>onbackorder</code> stock status value saves and round-trips, but it does not make an out-of-stock product purchasable.</div>

Full behavior is on [Inventory & stock](/inventory).

### Shipping (drawer)

| Field | Stored as | Notes |
|---|---|---|
| Weight | `weight`, decimal(8,2) | Label reads **lbs**. |
| Length / Width / Height | `length` / `width` / `height`, decimal(8,2) | Label reads **inches**. |
| Shipping class | **Not stored** | See the warning below. |

<div class="ui-warn"><strong>Careful:</strong> two things in this drawer do not behave the way the labels suggest.
<br><br>
The unit labels are hard-coded to lbs and inches. The store's own <code>weight_unit</code> and <code>dimension_unit</code> (set in the setup wizard, defaults <code>kg</code> and <code>cm</code>) are ignored here. The numbers you type are stored raw, so decide on one unit and use it consistently.
<br><br>
The Shipping class dropdown is a fixed list of five options (No class, Standard, Express, Fragile, Oversized). It is sent as <code>shipping_class</code> on save, but there is no column for it and <code>ShippingService</code> never reads it. Choosing a class changes nothing about the rate a customer pays. See <a href="/shipping">Shipping</a> for what does affect rates.</div>

### Search engine optimisation (drawer)

| Field | Stored as | Front-end effect |
|---|---|---|
| Meta Title | `meta_title`, varchar(255) | Replaces the page `<title>` on the product page. The field caps typing at 60 characters. |
| Meta Description | `meta_description`, text | Printed as `<meta name="description">`, stripped of tags and trimmed to 30 words. Falls back to the short tagline when empty. The field caps typing at 160 characters. |
| Meta Keywords | `meta_keywords`, varchar(500) | **None.** |

<div class="ui-warn"><strong>Careful:</strong> <code>meta_keywords</code> is captured, sanitized and saved, but nothing on the front end ever outputs it. It appears only in the admin product view. Treat the field as an internal note.</div>

Ambikly also prints a `<link rel="canonical">` pointing at the product's own `?ambikly_product=` URL, so products are not reported to search engines as duplicates of the shop page.

### Right-hand column

| Card | Field | Stored as | Notes |
|---|---|---|---|
| Status | Live / Draft | `status` | `published` or `draft`. Draft products 404 on the storefront. |
| Category | Dropdown | `category_id` | Exactly one category per product, or none. Only appears when at least one category exists. See [Categories, tags & brands](/categories). |
| Product code (SKU) | Text | `sku` | Leave blank and Ambikly generates `SKU-000123` from the new row's ID after insert. Unique across all products. |
| Visibility | Featured product | `featured` | Pins the product to featured sections. Read by the shop grid and the `featured` filter. |
| Visibility | Where customers can find it | **Not stored** | See the warning below. |

<div class="ui-warn"><strong>Careful:</strong> the "Where customers can find it" dropdown (Everywhere / Shop listings only / Search results only / Hidden) is sent as <code>catalog_visibility</code>, but there is no column and nothing reads it. Every published product appears everywhere. To hide a product, set it to Draft.</div>

## The digital product editor

A digital product uses a different layout. It has no Pricing card, no Inventory drawer and no Shipping drawer, because price and delivery both live on pricing plans.

| Card | Purpose |
|---|---|
| Product name | Same as physical: name and slug. |
| Photos | Cover art or a thumbnail for the shop listing. |
| Description | Full description and short tagline, both required to publish. |
| Downloadable files | The shared file pool, each file with its own version string. |
| Pricing plans | One or more plans, each with a price and optional recurring billing. |
| Search engine optimisation | Same three fields as the physical editor. |

The right-hand column carries Status, Category, Product code (SKU), License keys and Visibility.

Digital products never track stock: the editor sends `manage_stock = 0`, `stock_quantity = null` and `stock_status = instock` on every save regardless of what is in the database.

Full coverage of files, plans, limits and delivery is on [Digital downloads](/digital-downloads).

## Saving and publishing

Two buttons sit at the top of the editor, and a save bar slides in as soon as the form is dirty.

| Button | Effect |
|---|---|
| Save draft | Saves with `status = draft`. Skips every content check except the name. |
| Publish / Save changes | Saves with `status = published` after running the checks below. |

Publishing is blocked, with a message naming the card to fix, when:

- The name is empty.
- A simple physical product has no price, or a price of 0 or less.
- A digital product has no pricing plan with a price above 0.
- A variable product has no attributes or no variations.
- The full description is empty.

A variable product's own base price is deliberately **not** required.

Drafts are exempt from all of these except the name, so you can park incomplete work.

After the first publish of a new product the URL switches to edit mode and the product ID appears in the address bar. Leaving the page with unsaved changes prompts for confirmation.

## Fields the editor does not expose

These columns exist on `ambikly_products` and are accepted by the REST API and the CSV importer, but have no field in the admin editor.

| Column | Default | What it is for |
|---|---|---|
| `tax_class` | `standard` | Which tax-rate class applies. See [Tax](/tax). |
| `tax_status` | `taxable` | Whether tax applies at all. |
| `external_url` | `null` | Destination for an external product's buy button. |
| `button_text` | `Buy Product` | Label on that button. |
| `billing_period`, `billing_cycle`, `trial_period`, `subscription_length` | `null` / `1` / `0` / `null` | Legacy product-level subscription terms. Digital products use per-plan subscription settings instead. |
| `download_limit`, `download_expiry_days` | `null` | Per-product download caps. See [Digital downloads](/digital-downloads). |

Saving a product from the admin editor does not clear these. The form sends `null` for values it has no field for, and the update path skips any key whose value is null, so existing values survive an admin save.

## Product meta

Arbitrary key/value data can be attached to a product through three routes.

| Method | Route | Permission |
|---|---|---|
| `GET` | `/ambikly/v1/products/{id}/meta/{key}` | Manage store |
| `POST` | `/ambikly/v1/products/{id}/meta/{key}` | Manage store |
| `DELETE` | `/ambikly/v1/products/{id}/meta/{key}` | Manage store |

Keys must match `[a-z0-9_-]+`. Values are stored as strings in `ambikly_product_meta`. All three verbs require the manage-store capability — there is no public read.

The free core itself stores `low_stock_threshold` here. Pro add-ons use it for their own per-product flags.

## REST routes for products

| Method | Route | Permission |
|---|---|---|
| `GET` | `/ambikly/v1/products` | View store |
| `GET` | `/ambikly/v1/products/{id}` | View store |
| `POST` | `/ambikly/v1/products` | Manage store |
| `PUT` | `/ambikly/v1/products/{id}` | Manage store |
| `DELETE` | `/ambikly/v1/products/{id}` | Manage store |
| `GET` | `/ambikly/v1/products/{id}/usage` | Manage store |
| `POST` | `/ambikly/v1/products/bulk-delete` | Manage store |
| `POST` | `/ambikly/v1/products/bulk-status` | Manage store |

The list endpoint accepts `search`, `category_id`, `type`, `status`, `per_page` (default 50), `page`, `orderby` (`id`, `name`, `sku`, `price`, `stock_quantity`, `status`, `type`, `created_at`, `updated_at`) and `order`. Pagination comes back in the body as `total`, `page`, `per_page` and `total_pages` — there are no `X-WP-Total` headers.

Full details are in the [Endpoint reference](/developers/endpoints).

## Common errors

| Code | HTTP | Cause |
|---|---|---|
| `missing_name` | 400 | No product name. |
| `invalid_price` | 400 | Negative price. |
| `invalid_sale_price` | 400 | Negative sale price, or a sale price that is not lower than the regular price. |
| `duplicate_sku` | 400 | Another product already has that SKU. |
| `invalid_category` | 400 | `category_id` does not match an existing category. |
| `product_not_found` | 404 | No product with that ID. |

## Next

- [Variations](/variations) — attributes, generated combinations, per-variant price and stock.
- [Digital downloads](/digital-downloads) — files, plans, limits and the tokenized download link.
- [Inventory & stock](/inventory) — what decrements stock and when.
- [Import & export (CSV)](/import-export) — bulk-create and bulk-edit products in a spreadsheet.
