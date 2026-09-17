---
title: Categories, tags & brands
description: How Ambikly organizes a catalog — hierarchical categories in their own table, the tag and brand taxonomies, assigning terms, and how each surfaces on the storefront.
prev:
  text: Digital downloads
  link: /digital-downloads
next:
  text: Inventory & stock
  link: /inventory
---

# Categories, tags & brands

Ambikly organizes a catalog three ways: one hierarchical category per product, plus two flat taxonomies — tags and brands. All three live in Ambikly's own tables, not in WordPress terms, so they do not appear under Posts or Pages.

## How the three differ

| | Categories | Tags | Brands |
|---|---|---|---|
| Table | `ambikly_categories` | `ambikly_tags` | `ambikly_brands` |
| Hierarchical | Yes, via `parent_id` | No | No |
| Per product | Exactly one, or none | Many | Many |
| Link to product | `ambikly_products.category_id` | `ambikly_product_terms` | `ambikly_product_terms` |
| Admin screen | Yes | **No** | **No** |
| Extra fields | image, sort order, status, SEO meta | description | description, logo, website, position |

<div class="ui-warn"><strong>Careful:</strong> tags and brands have no admin screen and no field on the product editor. The REST routes are complete and the storefront renders them, but assigning a tag or a brand to a product is an API-only operation in the free core. See <a href="#tags-and-brands">Tags and brands</a> below.</div>

## Categories

### The Categories screen

Open <span class="screen-path">Ambikly → Categories</span>.

The toolbar carries a search box (matching name, slug and description), a column picker, and a **List / Tree** toggle.

| Column | Sortable | Notes |
|---|---|---|
| Category | Yes | Name and thumbnail. |
| Slug | Yes | |
| Parent | Yes | Resolved to the parent's name, even when the parent is on another page of the list. |
| Products | Yes | Live count of products whose `category_id` is this category. |
| Status | Yes | Published / Draft / Archived. |
| Date | No | |
| Description | No | |
| Image | No | |
| Sort Order | No | |

Sorting by **Products** sorts by the real count, not by ID.

Tree view rebuilds the hierarchy from a single fetch rather than the current page, so parents and children always resolve. Very large catalogs are capped, and the view prints a notice when the tree had to be truncated.

### Category fields

| Field | Stored as | Notes |
|---|---|---|
| Category Name | `name` | Required. |
| Slug | `slug` | Unique across all categories. Auto-generated from the name when blank; a collision appends `-1`, `-2`. Renaming a category does **not** change an existing slug unless you edit the slug yourself. |
| Parent Category | `parent_id` | Optional. A category cannot be its own parent, and cannot be moved under one of its own descendants. |
| Description | `description` | Sanitized with `wp_kses_post`. |
| Category Image | `image` | A media library URL. |
| Display Order | `sort_order` | Integer, default 0. The Categories list defaults to sorting by this. |
| Meta Title | `meta_title` | |
| Meta Description | `meta_description` | |
| Meta Keywords | `meta_keywords` | |
| Status | `status` | `published`, `draft` or `archived`. Anything else is rejected with `invalid_status`. |

<div class="ui-warn"><strong>Careful:</strong> a category's image, description and three SEO fields are stored and shown in the admin, but the free-core storefront never renders them. Only the category <em>name</em> reaches the front end — in the product breadcrumb and in the shop header's active-filter line. There is no category landing page with its own heading, image or copy.</div>

### Circular parents

Assigning a category's own child, grandchild or any deeper descendant as its parent is rejected with `circular_parent` and the message *This would create a circular category reference*. The check walks the ancestor chain and is bounded by the total category count, so pre-existing bad data cannot hang the request.

### Deleting categories

Delete is blocked while a category still has children: `Cannot delete category with child categories. Please delete or reassign child categories first.`

When a delete does go through, every product pointing at that category has its `category_id` set to `NULL`. Products are never deleted with a category.

### Bulk actions

Select rows to reveal the bulk bar.

| Action | Effect |
|---|---|
| Publish | Sets `status = published`. |
| Move to draft | Sets `status = draft`. |
| Delete selected | Deletes the selected categories and clears `category_id` on their products. |

Bulk delete refuses if any selected category has a child that is **not** also in the selection. Selecting a parent together with all of its children is allowed, because that leaves no orphan.

### Category REST routes

| Method | Route | Permission |
|---|---|---|
| `GET` | `/ambikly/v1/categories` | View store |
| `GET` | `/ambikly/v1/categories/{id}` | View store |
| `POST` | `/ambikly/v1/categories` | Manage store |
| `PUT` | `/ambikly/v1/categories/{id}` | Manage store |
| `DELETE` | `/ambikly/v1/categories/{id}` | Manage store |
| `POST` | `/ambikly/v1/categories/bulk-delete` | Manage store |
| `POST` | `/ambikly/v1/categories/bulk-status` | Manage store |

The list route accepts `search`, `parent_id` (pass `0` or an empty string for top-level only), `status`, `per_page` (default 100), `page`, `orderby` (`id`, `name`, `slug`, `parent_id`, `sort_order`, `status`, `created_at`, `updated_at`, `products`) and `order`. Each row comes back with `parent_name` and `product_count` resolved.

Category reads require store-view access. They are not public, so a headless storefront needs an authenticated request for the category list.

<div class="ui-warn"><strong>Careful:</strong> if the <code>ambikly_categories</code> table is ever found missing one of its expected columns, Ambikly drops and recreates it. That is a destructive repair path — take a database backup before hand-editing this table.</div>

## Assigning a category to a product

<ol class="step-list">
  <li>Open a product in <span class="screen-path">Ambikly → Products</span>.</li>
  <li>In the right-hand column, pick one from the <strong>Category</strong> dropdown.</li>
  <li>Save the product.</li>
</ol>

The dropdown only appears when at least one category exists, and it loads the first 100 categories. Choosing "No category" stores `NULL`.

The server validates the ID and rejects an unknown one with `invalid_category`. There is no way to assign more than one category to a product.

You can also set `category_id` on a CSV import. See [Import & export (CSV)](/import-export).

## Tags and brands

Both taxonomies share one controller because they share a shape: a name, a slug and a description, plus a pivot row in `ambikly_product_terms`.

### Tables

`ambikly_tags` holds `id`, `name`, `slug` (unique), `description` and `created_at`.

`ambikly_brands` holds the same plus `logo`, `website`, `position` and `updated_at`.

`ambikly_product_terms` holds `product_id`, `taxonomy` (`tag` or `brand`) and `term_id`, with a unique key on all three, so the same term cannot be attached to a product twice.

### Routes

| Method | Route | Permission |
|---|---|---|
| `GET` | `/ambikly/v1/tags` | **Public** |
| `POST` | `/ambikly/v1/tags` | Manage store |
| `PUT` | `/ambikly/v1/tags/{id}` | Manage store |
| `DELETE` | `/ambikly/v1/tags/{id}` | Manage store |
| `GET` | `/ambikly/v1/brands` | **Public** |
| `POST` | `/ambikly/v1/brands` | Manage store |
| `PUT` | `/ambikly/v1/brands/{id}` | Manage store |
| `DELETE` | `/ambikly/v1/brands/{id}` | Manage store |
| `GET` | `/ambikly/v1/products/{id}/terms` | **Public** |
| `POST` | `/ambikly/v1/products/{id}/terms` | Manage store |

Reads are public because tags and brands are storefront filter data. Writes need the manage-store capability.

`GET /tags` and `GET /brands` return every row ordered by name, with no pagination.

### Creating a term

```
POST /wp-json/ambikly/v1/tags
{ "name": "Summer", "slug": "summer", "description": "Warm-weather picks" }
```

The slug is derived from the name when omitted. For brands you may also send `logo`, `website` and `position`.

Deleting a term also deletes its rows in `ambikly_product_terms`, so no orphaned pivot rows are left behind.

### Attaching terms to a product

`GET /products/{id}/terms` returns the product's terms already grouped:

```json
{ "success": true, "data": { "tags": [ { "id": 3, "name": "Summer", "slug": "summer" } ], "brands": [] } }
```

`POST /products/{id}/terms` **replaces** the whole set for that product in one call:

```
POST /wp-json/ambikly/v1/products/42/terms
{ "tags": [3, 7], "brands": [2] }
```

Every existing pivot row for that product is deleted first, then the supplied IDs are inserted. Sending `{"tags": []}` therefore removes the product's brands too — always send both keys.

The IDs are not validated against the tag and brand tables, so a wrong ID produces a pivot row that resolves to a blank name on the storefront. Read the term lists first.

## How each one surfaces on the storefront

### Categories

- **Breadcrumb.** A product page prints `Home / Shop / {Category} / {Product}`, where the category links to the shop page with `?category={id}`.
- **Shop filter.** `?category={id}` on the shop page filters the grid, and the header prints `Category: {name}`.
- **Active filter is preserved.** The sort and search form carries the current category as a hidden field, so re-sorting does not silently drop the filter.
- **Status is enforced.** A category whose status is Draft or Archived returns **no products** on the storefront, even though its products are published. This is how you take a whole section of the catalog offline without touching each product.
- **Related products.** The "You may also like" row prefers products in the same category, falling back to the newest published products when there are not enough.

### Tags and brands

- **Chips on the product page.** Every tag and brand attached to a product renders as a chip under the buy button, linking to the shop page with `?tag={slug}` or `?brand={slug}`.
- **Shop filter.** Those query args filter the grid, and the header prints `Tag: {name}` or `Brand: {name}`.
- **Hidden fields.** Both are carried through the sort and search form, so changing the sort keeps you inside the tag or brand.
- **Unknown slugs return nothing.** A slug with no matching term forces an empty result rather than quietly showing the whole catalog.
- **Brand logo and website are not rendered** by the free-core storefront. They are stored for add-ons to use.

### The archive shortcode

`[ambikly_archive]` renders the same grid as `[ambikly_shop]` and reads `category`, `tag` or `brand` from the query string. Use it when you want a dedicated page for taxonomy listings rather than reusing the shop page. Attributes: `per_page` (default 12) and `columns` (default 3). See [Shortcodes](/shortcodes).

## Limits worth knowing

- One category per product. There is no many-to-many category relationship and no join table for categories — `ambikly_product_categories` does not exist.
- No admin screen for tags or brands, and no product-editor field for either.
- No category, tag or brand landing page template. Filtering happens on the shop page via query args.
- Category images, descriptions and SEO fields are admin-only.
- Categories are not importable or exportable by CSV. The product CSV carries `category_id`, so the category must already exist and you must know its numeric ID.
- Coupons cannot be restricted to a category. Product include and exclude lists do work. See [Coupons](/coupons).

## Troubleshooting

| Symptom | Cause |
|---|---|
| "Cannot delete category with child categories." | Reassign or delete the children first, or select the whole branch and bulk-delete it. |
| A whole section of the shop went empty | Its category status is Draft or Archived. |
| Products lost their category | The category was deleted. `category_id` is set to `NULL` on delete, by design. |
| A tag chip shows a blank name | The pivot row points at a term ID that does not exist. `POST /products/{id}/terms` does not validate IDs. |
| A brand disappeared from a product after adding tags | `POST /products/{id}/terms` replaces everything. Send `tags` and `brands` together. |
| The slug did not change after renaming a category | Slugs are only rewritten when you edit the slug field itself. |

## Next

- [Inventory & stock](/inventory) — stock tracking, thresholds and alerts.
- [Blocks & store pages](/blocks) — the product grid block and its attributes.
- [Shortcodes](/shortcodes) — `[ambikly_shop]` and `[ambikly_archive]`.
