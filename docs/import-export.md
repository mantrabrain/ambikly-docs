---
title: Import & export (CSV)
description: The Ambikly Tools screen — product and order CSV exports, the product importer, the full column reference, error reporting and the WP-CLI equivalents.
prev:
  text: Inventory & stock
  link: /inventory
next:
  text: Reviews
  link: /reviews
---

# Import & export (CSV)

Ambikly moves products and orders in and out as CSV. Exports stream row by row, so a catalog with tens of thousands of products does not exhaust memory on a shared host. Imports read one row at a time and report the outcome of each.

## Finding the Tools screen

<div class="ui-warn"><strong>Careful:</strong> Tools is not in the sidebar. Open it with the wrench icon in the top header of any Ambikly admin screen, next to the theme toggle.</div>

<span class="screen-path">Ambikly → Tools</span> holds four cards:

| Card | What it does |
|---|---|
| Export products | Downloads a product CSV, optionally filtered. |
| Export orders | Downloads an order CSV for a date range. |
| Import products | Uploads a product CSV and reports per-row results. |
| System status | Diagnostic JSON you can copy into a support ticket. See [System status](/system-status). |

All four import and export routes require full WordPress administrator access (`manage_options`). A Store Manager cannot reach them. See [Roles & permissions](/roles).

## Exporting products

<ol class="step-list">
  <li>Open <span class="screen-path">Ambikly → Tools</span> with the wrench icon.</li>
  <li>On the <strong>Export products</strong> card, pick a <strong>Status</strong> and a <strong>Type</strong>, or leave both at All.</li>
  <li>Click <strong>Download products CSV</strong>.</li>
</ol>

The file is named `ambikly-products-YYYY-MM-DD.csv`, starts with a UTF-8 byte-order mark so Excel reads it correctly, and is streamed in batches of 500 rows ordered by ID.

| Filter | Values | Matches on |
|---|---|---|
| Status | All, Published, Draft | The `status` column |
| Type | Any, Physical, Digital, Variable, External, Bundle, Subscription | The `type` column — except **Variable**, which matches `sub_type = variable` |

**Variable** is handled separately because `variable` is not a value of the `type` column: a product with variants is stored as `type = physical`, `sub_type = variable`.

**External**, **Bundle** and **Subscription** match the `type` column directly. Those rows only exist if they were created by import or through the API — see [Products](/products).

### Exporting a selection

The Products screen exports too. Set your filters there and click **Export** to export what matches, or tick specific rows and click **Export Selected** to export exactly those IDs. Both open the same endpoint with an `ids` parameter.

## Exporting orders

<ol class="step-list">
  <li>On the <strong>Export orders</strong> card, set <strong>From</strong> and <strong>To</strong>, or leave them blank for everything.</li>
  <li>Click <strong>Download orders CSV</strong>.</li>
</ol>

The file is `ambikly-orders-YYYY-MM-DD.csv`, streamed in batches of 200. The From date is sent as `00:00:00` and the To date as `23:59:59`, so both ends are inclusive.

The order export carries 30 columns:

`order_number`, `created_at`, `status`, `payment_status`, `customer_email`, `customer_phone`, `subtotal`, `discount_total`, `shipping_total`, `tax_total`, `total`, `currency`, `payment_method`, then the billing block (`billing_first_name`, `billing_last_name`, `billing_company`, `billing_address_1`, `billing_address_2`, `billing_city`, `billing_state`, `billing_postcode`, `billing_country`), a shorter shipping block (`shipping_first_name`, `shipping_last_name`, `shipping_address_1`, `shipping_city`, `shipping_state`, `shipping_postcode`, `shipping_country`) and `items`.

`items` is a flattened summary, one entry per line item joined with ` | `:

```
2x Blue Hoodie @ 49.00 | 1x Sticker Pack @ 6.00
```

Every field that traces back to a public checkout form — names, company, addresses, email, phone and item names — is protected against CSV formula injection: a value starting with `=`, `+`, `-`, `@`, a tab or a carriage return is prefixed with a single quote so a spreadsheet treats it as text. Server-generated fields such as totals and order numbers are written as-is.

There is no order import.

## Importing products

<ol class="step-list">
  <li>On the <strong>Import products</strong> card, click <strong>Download template</strong> to get a header-only CSV with every supported column in the right order.</li>
  <li>Fill it in, or start from an export of your existing catalog.</li>
  <li>Choose the file and click <strong>Import</strong>.</li>
  <li>Read the result line: rows processed, created, updated, and errors.</li>
</ol>

The file must be UTF-8 CSV. The first row is the header. Upload happens as multipart form data with the field name `file`.

### The update rule

For each row, Ambikly decides between create and update like this:

1. If the row's `sku` cell is not empty, look for an existing product with that exact SKU. A match is an **update**.
2. Otherwise, look for an existing product whose `slug` matches the row's `slug` — or, when `slug` is empty, the slugified `name`. A match is an **update**.
3. No match is a **create**. The slug is made unique by appending `-1`, `-2`, and `created_at` / `updated_at` are stamped.

<div class="ui-warn"><strong>Careful:</strong> an update writes every one of the 32 mapped columns, not just the ones you changed. An empty cell is written as empty or null, so a hand-built CSV with a few columns filled in will clear the rest. Always start from an export or the downloaded template, and keep every column.</div>

<div class="ui-warn"><strong>Careful:</strong> the importer reads several columns without first checking that they exist in your header row. A CSV that leaves out <code>category_id</code>, <code>weight</code>, <code>length</code>, <code>width</code>, <code>height</code>, <code>download_limit</code>, <code>download_expiry_days</code>, <code>button_text</code> or <code>billing_cycle</code> can write <code>0</code> into those columns rather than leaving them alone. Use the full template.</div>

Unlike the REST API, the importer does not auto-generate a SKU for a new product with a blank `sku` cell, and it does not reject a negative price or a sale price that is not lower than the regular price. Validate your spreadsheet before uploading.

### The product CSV columns

These are the 32 columns of `productHeaders()`, in the exact order the export and the template emit them.

| # | Column | Expects | Notes |
|---|---|---|---|
| 1 | `sku` | Text | The match key for updates. Must be unique across products. Blank on a new row stays blank. |
| 2 | `name` | Text | **Required.** A row with an empty name is skipped with an error. |
| 3 | `slug` | Text | Falls back to a slugified `name`. Made unique on create only. |
| 4 | `type` | One of `physical`, `digital`, `external`, `grouped`, `bundle`, `subscription` | Anything else silently becomes `physical`. |
| 5 | `sub_type` | Text | Empty becomes `simple`. In practice `simple` or `variable`. Not validated. |
| 6 | `status` | One of `published`, `draft`, `trash` | Anything else silently becomes `published`. |
| 7 | `category_id` | Integer | The numeric ID of an existing category. Not validated — a wrong ID is stored as-is. |
| 8 | `price` | Decimal | Empty becomes `0`. Negative values are not rejected here. |
| 9 | `sale_price` | Decimal | Empty becomes `null`. Not validated against `price`. |
| 10 | `stock_quantity` | Integer | Empty becomes `0`. |
| 11 | `stock_status` | `instock`, `outofstock` or `onbackorder` | Empty becomes `instock`. Not validated. |
| 12 | `manage_stock` | `1` / `0` | Empty becomes `1`. Any truthy value becomes `1`. |
| 13 | `weight` | Decimal | Empty becomes `null`. Units are whatever you decide — see [Products](/products). |
| 14 | `length` | Decimal | Empty becomes `null`. |
| 15 | `width` | Decimal | Empty becomes `null`. |
| 16 | `height` | Decimal | Empty becomes `null`. |
| 17 | `short_description` | Plain text | Sanitized as a textarea — HTML is stripped. |
| 18 | `description` | HTML | Sanitized with `wp_kses_post`, so post-safe HTML survives. |
| 19 | `image` | URL | The main product image. Run through `esc_url_raw`. |
| 20 | `gallery` | JSON array of URLs, or a comma-separated list | Each entry is URL-sanitized; anything that is not a URL is dropped. Stored as a JSON array. |
| 21 | `featured` | `1` / `0` | Empty becomes `0`. |
| 22 | `is_downloadable` | `1` / `0` | Empty becomes `0` — note this differs from the API, which defaults digital products to `1`. |
| 23 | `download_limit` | Integer | Empty becomes `null`, meaning unlimited. |
| 24 | `download_expiry_days` | Integer | Empty becomes `null`, meaning no expiry. |
| 25 | `tax_class` | Text | Empty becomes `standard`. |
| 26 | `tax_status` | `taxable` or `none` | Empty becomes `taxable`. |
| 27 | `external_url` | URL | Only meaningful for `type = external`. |
| 28 | `button_text` | Text | The buy-button label on an external product. Sanitized. |
| 29 | `billing_period` | `daily`, `weekly`, `monthly`, `yearly` | Legacy product-level subscription field. Empty becomes `null`. |
| 30 | `billing_cycle` | Integer | Empty becomes `1`. |
| 31 | `meta_title` | Text | Used as the product page `<title>`. |
| 32 | `meta_description` | Text | Printed as the page meta description. |

Note what is **not** in that list: `meta_keywords`, `license_enabled`, `license_activation_limit`, `trial_period` and `subscription_length` are all real columns but are neither exported nor imported.

### What does not import

The product CSV covers the `ambikly_products` row and nothing else. None of the following are created, updated or removed by an import:

- Variations and attributes, and their values.
- Digital pricing plans and downloadable files.
- Product meta, including the per-product low-stock threshold.
- Tag and brand assignments. Only `category_id` on the product row is set.
- Images beyond storing the URL strings you supply — nothing is side-loaded into the media library.
- Reviews.

<div class="ui-warn"><strong>Careful:</strong> orders, customers and active subscriptions do not import at all — not from a CSV and not from another plugin. Products import by CSV only. Plan a migration around that: move the catalog, then take orders forward from the switchover date.</div>

### Error reporting

The result object is `{ processed, created, updated, errors }`. The Tools card prints, for example:

> **12** rows processed — 9 created, 2 updated, *1 error*

with a **Show errors** disclosure listing each failure as `Row {n}: {message}`. Row numbers count the header as row 1, so the first data row is row 2.

| Message | Cause |
|---|---|
| `Empty file.` (row 0) | No header row could be read. |
| `Column count mismatch.` | The row has a different number of cells than the header. Usually an unescaped comma or a stray line break inside a cell. |
| `Missing name.` | The `name` cell is empty. |
| A raw database error | The write failed — a value too long for its column under strict SQL mode, a lock-wait timeout, or a duplicate SKU hitting the unique key. |
| Any other message | An exception thrown while processing that row. |

A row that fails is counted in `processed` but not in `created` or `updated`. The import continues to the next row; it is not transactional and does not roll back.

## The routes

| Method | Route | Permission |
|---|---|---|
| `GET` | `/ambikly/v1/export/products` | `manage_options` |
| `GET` | `/ambikly/v1/export/orders` | `manage_options` |
| `POST` | `/ambikly/v1/import/products` | `manage_options` |
| `GET` | `/ambikly/v1/import/products/template` | `manage_options` |

`export/products` accepts `status`, `type` and `ids` (a comma-separated list). `export/orders` accepts `status`, `date_from` and `date_to`. `import/products` takes a multipart upload with the field name `file`.

Both export routes stream directly to the response with `Content-Type: text/csv` and a `Content-Disposition` attachment header, then exit — they do not return the usual JSON envelope.

## WP-CLI

Exports are also available on the command line, which is the better option for very large catalogs and for scheduled backups.

```bash
wp ambikly export products --status=published > products.csv
wp ambikly export orders --file=orders.csv
```

| Command | Options |
|---|---|
| `wp ambikly export products` | `--status=`, `--type=`, `--file=` |
| `wp ambikly export orders` | `--status=`, `--from=`, `--to=`, `--file=` |
| `wp ambikly upgrade-db` | — |
| `wp ambikly recompute customer-totals` | `--id=` |

Without `--file`, output goes to stdout so you can redirect or pipe it.

<div class="ui-warn"><strong>Careful:</strong> <code>--from</code> and <code>--to</code> on <code>wp ambikly export orders</code> have no effect. They are passed through under those names, but the export service reads <code>date_from</code> and <code>date_to</code>, so the date range is silently ignored and the whole order table is exported. Use the Tools screen when you need a date range; <code>--status</code> works normally.</div>

There is no `wp ambikly import` command. Imports go through the Tools screen or `POST /import/products`.

Full reference: [WP-CLI](/developers/wp-cli).

## A safe round-trip for bulk edits

<ol class="step-list">
  <li>Take a database backup. An import cannot be undone.</li>
  <li>Export the products you want to change, using the Status and Type filters or an explicit selection.</li>
  <li>Open the file in a spreadsheet. Keep every column and keep the header row exactly as exported.</li>
  <li>Edit only the cells you mean to change. Leave <code>sku</code> untouched — it is the match key.</li>
  <li>Save as UTF-8 CSV.</li>
  <li>Import, then read the created / updated / errors counts before assuming it worked.</li>
  <li>Spot-check a few products in <span class="screen-path">Ambikly → Products</span>.</li>
</ol>

<div class="ui-tip"><strong>Tip:</strong> run bulk stock imports when the store is quiet. An import writes <code>stock_quantity</code> directly and does not go through the oversell-safe adjust path, so an import landing at the same moment as a checkout can overwrite that order's decrement. See <a href="/inventory">Inventory &amp; stock</a>.</div>

## Troubleshooting

| Symptom | Cause |
|---|---|
| The Tools screen is nowhere in the sidebar | It is only reachable from the wrench icon in the top header. |
| "Export products" with Type = Variable produced a header-only file | You have no products with `sub_type = variable`. |
| Type = Bundle or Subscription returned nothing | Those `type` values can only be created by import or the API. |
| Every row came back `Column count mismatch.` | A cell contains an unescaped comma, quote or line break. Re-export from a spreadsheet that quotes fields properly. |
| Products imported but fields you did not touch went blank | An update writes all 32 mapped columns. Import a full-width file, not a partial one. |
| A variable product imported but has no variants | Variations do not import. Re-create them in the product editor or through the API. |
| Prices imported as negative numbers | The importer does not validate prices. Only the REST API does. |
| Excel shows mangled accented characters | Open the file as UTF-8. Ambikly writes a BOM, which most spreadsheet apps honor. |
| The CLI order export ignored `--from` | Known limitation — the flag is not read. Use the Tools screen. |

## Next

- [Reviews](/reviews) — moderation and the public review form.
- [Products](/products) — what each column on a product actually does.
- [WP-CLI](/developers/wp-cli) — the full command reference.
