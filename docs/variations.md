---
title: Variations
description: Build a variable product in Ambikly — attributes and values, generating combinations, per-variant price, SKU and stock, and how the storefront resolves a choice.
prev:
  text: Products
  link: /products
next:
  text: Digital downloads
  link: /digital-downloads
---

# Variations

A variable product is one product sold in several options — sizes, colors, materials. Each combination gets its own price, SKU and stock count. This page covers attributes, generating variations, editing them in bulk, and what the storefront does with them.

Variations are a physical-product feature. A digital product sells through [pricing plans](/digital-downloads) instead.

## Turning a product variable

<ol class="step-list">
  <li>Open a physical product in <span class="screen-path">Ambikly → Products</span>.</li>
  <li>In the <strong>Product type</strong> row, switch the dropdown to <strong>Product with variants</strong>.</li>
  <li>A <strong>Variants</strong> row appears in the main column. Click it to open the drawer.</li>
  <li>Add your options under <strong>Options</strong>, then build combinations under <strong>Variant combinations</strong>.</li>
  <li>Click <strong>Done</strong>, then <strong>Save changes</strong> on the product itself.</li>
</ol>

Switching the type sets `sub_type = variable` on the product row. The base `type` stays `physical`. Nothing is deleted when you switch back and forth — variation rows only go away when you delete them explicitly.

<div class="ui-tip"><strong>Tip:</strong> the Pricing card's base price becomes optional once the product is variable, and the card says so. Leave it at 0 and the storefront shows a "From $X" range built from the variations.</div>

## Attributes

An attribute is one axis of choice: Size, Color, Material. It belongs to a single product — there are no global, store-wide attributes in the free core, so each product carries its own copies.

### Fields

| Field | Stored as | Default | Notes |
|---|---|---|---|
| Name | `name` | — | Required. Shown as the label on the product page. |
| Slug | `slug` | Derived from the name | Made unique per product by appending `-1`, `-2`. Used as the key inside a variation's attribute map. |
| Type | `type` | `select` | `select` (dropdown) or `text`. |
| Visible on product page | `visible` | On | |
| Used for variants | `variation` | On | Only attributes with this on are used when generating combinations. |

Editing the name in the drawer re-derives the slug. Because variations key their combinations on the slug, renaming an attribute after you have generated variations will break the match — rename before you generate, or re-generate afterwards.

### Attribute values

Each attribute holds a list of values, each with a `name` and a `slug`. Add them one at a time in the drawer; press Enter or click **Add**. Duplicate slugs inside one attribute are rejected silently by the editor, and the server appends a counter if one still collides.

An attribute with no values shows an amber warning in the drawer and is skipped when generating combinations.

Attributes live in `ambikly_product_attributes` and their values in `ambikly_product_attribute_values`. Deleting an attribute deletes its values.

## Generating variations

Inside the Variants drawer, **Generate all** builds the cartesian product of every attribute that has both "Used for variants" ticked and at least one value, then appends one row per combination.

Three attributes with 3, 4 and 2 values produce 24 variations. The generator does not deduplicate against rows already in the table, so clicking **Generate all** twice gives you two sets. Delete the extras before saving.

Each generated row starts with an empty SKU, no price, quantity 0, status In stock, and stock tracking on.

You can also click **Add variation** to add a single blank row and pick its option values from the per-attribute dropdowns in the row itself.

## The variations table

| Column | Stored as | Editable in the admin |
|---|---|---|
| Variation | `attributes` (JSON map of attribute slug → value slug) | Yes, via dropdowns, while the row has no combination yet |
| SKU | `sku` | Yes |
| Price | `price`, decimal(10,2) | Yes |
| Stock | `stock_quantity` | Yes |
| Status | `stock_status` | Yes — In stock / Out of stock / Backorder |

Four more columns exist on `ambikly_product_variations` and are accepted by the API, but have no field in this table: `sale_price`, `image`, `manage_stock` (new rows default to on) and `position` (set from the row order on save). Set them through the REST API if you need them.

<div class="ui-warn"><strong>Careful:</strong> nothing in the variations table is written to the database until you save the product itself. The table footer says so. Closing the drawer with <strong>Done</strong> keeps your edits in the form; leaving the page without saving discards them.</div>

### Selecting rows

Tick rows to reveal a small action bar above the table.

| Action | Effect |
|---|---|
| Bulk edit | Opens a dialog with Price, Stock quantity and Stock status. Leave a field blank to skip it. Applies to every selected row in the form. |
| Delete | Removes the selected rows from the form. |
| Clear | Deselects everything. |

Bulk edit and Delete here are form-level operations. They become real database writes when you save the product.

## What happens on save

Saving a variable product runs two passes, in order, after the product row itself is written.

**Attributes first.** The form fetches the product's current attributes, then:

- creates any attribute whose slug is not on the server,
- updates any attribute whose slug matches,
- creates or updates each attribute value by slug,
- deletes any attribute on the server whose slug is no longer in the form.

**Variations second.** The form fetches the product's current variations, matches each form row to a server row by database ID first and by attribute combination second, then:

- `PUT`s the matched rows,
- `POST`s the unmatched ones,
- `DELETE`s any server row that no longer matches anything in the form.

Attribute keys are sorted before comparison, so the order in which the JSON came back does not affect matching.

If the attribute or variation pass fails, the product itself has already saved. You get a toast naming what failed, and the product stays saved.

## Variation SKUs

`ambikly_product_variations` carries a `UNIQUE KEY sku_product (sku, product_id)`. A SKU must be unique **within one product**, not across the whole catalog — two different variable products may each have a variation with SKU `RED-M`.

The constraint is enforced twice: the controller checks for a duplicate before inserting, and the unique key catches anything that slips through a race between two concurrent saves. Either way you get a `duplicate_sku` error with `SKU already exists for this product.`

Installs created before this key existed are migrated automatically. The migration drops the old non-unique `sku` index and, if two variations of the same product already shared a SKU, clears the SKU on every row except the oldest so the constraint can be added. If a variation SKU has gone blank unexpectedly on an older store, that is why.

Leaving a variation SKU blank is allowed — it stays `NULL`. Blank SKUs do not collide with each other.

## Price rules

| Rule | Error |
|---|---|
| A variation price may not be negative | `invalid_price` |
| A variation sale price may not be negative | `invalid_sale_price` |
| A sale price must be lower than the price it discounts | `invalid_sale_price` |

A variation with no price of its own inherits the parent product's price at checkout. When you set a sale price on such a variation, it is validated against that inherited parent price rather than skipped.

## Variation REST routes

| Method | Route | Permission |
|---|---|---|
| `GET` | `/ambikly/v1/products/{product_id}/variations` | View store |
| `POST` | `/ambikly/v1/products/{product_id}/variations` | Manage store |
| `GET` | `/ambikly/v1/products/{product_id}/variations/{id}` | View store |
| `PUT` | `/ambikly/v1/products/{product_id}/variations/{id}` | Manage store |
| `DELETE` | `/ambikly/v1/products/{product_id}/variations/{id}` | Manage store |
| `POST` | `/ambikly/v1/products/{product_id}/variations/generate` | Manage store |
| `POST` | `/ambikly/v1/products/{product_id}/variations/bulk-update` | Manage store |
| `POST` | `/ambikly/v1/products/{product_id}/variations/bulk-delete` | Manage store |

Attributes have their own set:

| Method | Route | Permission |
|---|---|---|
| `GET` / `POST` | `/ambikly/v1/products/{product_id}/attributes` | View store / Manage store |
| `GET` / `PUT` / `DELETE` | `/ambikly/v1/products/{product_id}/attributes/{id}` | View store / Manage store |
| `GET` / `POST` | `/ambikly/v1/products/{product_id}/attributes/{attribute_id}/values` | View store / Manage store |
| `PUT` / `DELETE` | `/ambikly/v1/products/{product_id}/attributes/{attribute_id}/values/{id}` | Manage store |

### Server-side generation

`POST /variations/generate` builds every combination from the product's variation attributes and inserts them. Pass `{"replace_existing": true}` to delete the product's existing variations first. It returns `created` and the full list of new variations.

The admin drawer does **not** call this route — its "Generate all" button builds the combinations in the browser. The endpoint exists for scripts and integrations.

It fails with `no_attributes` when the product has no attribute with `variation = 1`, and with `no_attribute_values` when those attributes have no values.

### Bulk delete

`POST /variations/bulk-delete` takes `{"ids": [1,2,3]}` and deletes those variations from that product. It returns `deleted` with the row count.

### Bulk update

<div class="ui-warn"><strong>Careful:</strong> <code>POST /variations/bulk-update</code> does not work. Its SQL builds the <code>SET</code> clause with <code>?</code> placeholders, which neither <code>$wpdb->prepare()</code> nor MySQL accepts, so the statement is rejected and the endpoint returns a 500 <code>database_error</code>. Nothing in the admin calls it. To update several variations at once, send one <code>PUT</code> per variation.</div>

## On the storefront

A variable product page renders one `<select>` per attribute, plus a hidden field for the resolved variation ID. Only variations with `status = published` are sent to the page.

Each variation is serialized into the add-to-cart form as `id`, `attributes`, `price`, `sale_price`, `stock_status`, `sku`, `image` and `stock_quantity` (null when that variation does not track stock). The storefront script matches the chosen attribute values against that list and, once a single variation resolves, updates the displayed price, the SKU line, the gallery image and the quantity cap.

### Price display

| Situation | What the page shows |
|---|---|
| Parent price is 0 and variations exist | `From $X`, where X is the lowest effective variation price; just `$X` when every variation costs the same |
| Parent has a price and a lower sale price | Struck-through regular price plus the sale price |
| Otherwise | The parent price |

"Effective" means the variation's sale price when it is set, above 0 and lower than its price; otherwise the variation's price.

The same rule drives the product card in the shop grid, on search results and in the "You may also like" row, so a variable product no longer shows `$0.00` anywhere.

Sorting the shop by price also uses the effective price: for a variable product with no price of its own, that is the lowest published variation price.

### Stock and the buy button

The Add to Cart button is disabled and relabelled **Out of stock** when the parent product is out of stock. Per-variation stock is enforced at checkout, and both the variation row and the parent product row are decremented when an order is created. See [Inventory & stock](/inventory).

### SKU line

The SKU paragraph on the product page renders when either the parent has a SKU or at least one variation does. When only variations carry SKUs, the line starts hidden and appears as soon as a variation resolves.

<div class="pro-callout">
  <div class="pro-callout__head"><span class="pro-callout__badge">PRO</span><span class="pro-callout__title">Swatches instead of dropdowns</span></div>
  <p class="pro-callout__desc">The Advanced Variations add-on replaces attribute dropdowns with color chips, image tiles or text buttons, configured per attribute term. The original select stays in the DOM for accessibility and the core variation logic is unchanged.</p>
  <a class="pro-callout__cta" href="https://ambikly.com/pricing/">See pricing →</a>
</div>

Details: [Advanced Variations](/addons/advanced-variations).

## Troubleshooting

| Symptom | Cause |
|---|---|
| Publish is blocked with "Add at least one attribute and variation" | A variable product must have both before it can go live. |
| A variation lost its option values after an edit | An attribute's slug changed. The combination map keys on the slug, so the old key no longer resolves. Re-pick the values and save. |
| A variation's SKU went blank on an older store | The unique-key migration cleared duplicate SKUs on all but the oldest matching row. |
| Duplicate rows after clicking Generate all | The generator appends; it does not replace. Delete the extras before saving. |
| Variations saved but the product shows `$0.00` | The product's `sub_type` is not `variable`. The "From" range only applies to variable products. |

## Next

- [Digital downloads](/digital-downloads) — files, plans and delivery.
- [Inventory & stock](/inventory) — how per-variation stock is decremented.
- [Import & export (CSV)](/import-export) — note that variations do not import.
