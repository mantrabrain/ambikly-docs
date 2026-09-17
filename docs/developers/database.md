---
title: Database schema
description: Ambikly's custom tables across its two schema owners, the migration mechanism and the shared version option, teardown on uninstall, and how to query store data safely with $wpdb.
prev:
  text: WP-CLI
  link: /developers/wp-cli
next:
  text: Template overrides
  link: /developers/templates
---

# Database schema

Ambikly stores nothing in `wp_posts` or `wp_postmeta`. Products, orders, customers, carts and everything else live in dedicated tables prefixed `{wp_prefix}ambikly_` — on a default install, `wp_ambikly_orders` and so on.

That means `WP_Query`, `get_posts()` and `get_post_meta()` will never see Ambikly data. Read it through the [REST API](/developers/endpoints), through the model and repository classes, or with `$wpdb`.

## Two schema owners

The tables are created by two classes with separate responsibilities and separate version numbers.

| Owner | File | Version constant | Owns |
|---|---|---|---|
| `Ambikly\Database\Install` | `src/Database/Install.php` | `Install::DB_VERSION = '1.2.1'` | The 10 product and category tables — the original schema |
| `Ambikly\Database\Schema` | `src/Database/Schema.php` | `Schema::DB_VERSION = '2.11.0'` | The 37 tables added since — orders, customers, carts, jobs and the rest |

That is **47 tables** in total. `Install` is the older of the two and keeps the product-side tables it has always owned; everything added after the first release went into `Schema`.

## Tables owned by `Install`

The product catalog and its supporting structures.

| Table | Purpose | Key columns |
|---|---|---|
| `ambikly_products` | The product catalog | `id`, `name`, `slug` (UNIQUE), `sku` (UNIQUE), `type`, `sub_type`, `price`, `sale_price`, `stock_quantity`, `stock_status`, `manage_stock`, `category_id`, `status`, `featured`, `weight`, `length`, `width`, `height`, `external_url`, `billing_period` |
| `ambikly_categories` | Product categories, self-nesting | `id`, `name`, `slug` (UNIQUE), `parent_id`, `image`, `sort_order`, `status`, `meta_title`, `meta_description`, `meta_keywords` |
| `ambikly_product_attributes` | Per-product attribute definitions | `id`, `product_id`, `name`, `slug`, `type`, `position`, `visible`, `variation` |
| `ambikly_product_attribute_values` | The terms of each attribute | `id`, `attribute_id`, `name`, `slug`, `position` |
| `ambikly_product_variations` | Variable product variations | `id`, `product_id`, `sku` (UNIQUE), `price`, `sale_price`, `stock_quantity`, `stock_status`, `attributes`, `status` |
| `ambikly_product_grouped` | Membership of a grouped product | `id`, `group_id`, `product_id`, `quantity`, `position` |
| `ambikly_product_pricing_plans` | Digital product pricing tiers | `id`, `product_id`, `name`, `price`, `sale_price`, `is_subscription`, `subscription_period`, `trial_period`, `signup_fee`, `status` |
| `ambikly_product_files` | Downloadable files | `id`, `product_id`, `pricing_plan_id`, `name`, `file_url`, `file_size`, `mime_type`, `version`, `download_limit`, `download_expiry` |
| `ambikly_product_relationships` | Cross-sells, upsells and related products | `id`, `product_id`, `related_product_id`, `relationship_type`, `pricing_plan_id`, `quantity`, `position` |
| `ambikly_product_meta` | Arbitrary per-product key/value pairs | `id`, `product_id`, `meta_key`, `meta_value` |

## Tables owned by `Schema`

### Orders

| Table | Purpose | Key columns |
|---|---|---|
| `ambikly_orders` | The order header | `id`, `order_number`, `customer_id`, `user_id`, `customer_email`, `status`, `payment_status`, `fulfillment_status`, `currency`, `subtotal`, `discount_total`, `shipping_total`, `tax_total`, `total`, `total_paid`, `total_refunded`, `payment_method`, `shipping_method`, `coupon_codes`, `created_via`, `completed_at`, `cancelled_at` |
| `ambikly_order_items` | Line items | `id`, `order_id`, `product_id`, `variation_id`, `pricing_plan_id`, `product_type`, `name`, `sku`, `quantity`, `price`, `line_subtotal`, `line_discount`, `line_tax`, `line_total`, `requires_shipping`, `is_downloadable`, `attributes` |
| `ambikly_order_addresses` | Billing and shipping snapshots | `id`, `order_id`, `type`, `first_name`, `last_name`, `company`, `address_1`, `address_2`, `city`, `state`, `postcode`, `country`, `phone`, `email` |
| `ambikly_order_notes` | Internal and customer-visible notes | `id`, `order_id`, `author`, `author_id`, `content`, `type`, `is_customer_visible` |
| `ambikly_order_transactions` | Gateway payment attempts | `id`, `order_id`, `transaction_type`, `payment_method`, `gateway_transaction_id`, `status`, `amount`, `currency`, `response`, `processed_at` |
| `ambikly_refunds` | Refund records | `id`, `order_id`, `transaction_id`, `amount`, `reason`, `refunded_by`, `status`, `gateway_refund_id` |

### Customers

| Table | Purpose | Key columns |
|---|---|---|
| `ambikly_customers` | Store customers, optionally linked to a WP user | `id`, `user_id`, `email` (UNIQUE), `first_name`, `last_name`, `phone`, `status`, `total_orders`, `total_spent`, `last_order_at` |
| `ambikly_customer_addresses` | Saved address book entries | `id`, `customer_id`, `type`, `is_default`, `address_1`, `city`, `state`, `postcode`, `country` |

::: warning `customer_id` is not a WP user id
`ambikly_orders.customer_id` references `ambikly_customers.id`. The WordPress user id, when there is one, is `ambikly_customers.user_id` (and `ambikly_orders.user_id`). Comparing `customer_id` against `get_current_user_id()` compares two unrelated id spaces — it both denies real owners and can admit strangers whose ids happen to collide. Always resolve the WP user to their `ambikly_customers.id` first.
:::

### Cart, checkout and sessions

| Table | Purpose | Key columns |
|---|---|---|
| `ambikly_carts` | Persisted carts, including abandoned ones | `id`, `cart_key`, `user_id`, `customer_email`, `contents`, `totals`, `coupons`, `shipping`, `billing`, `currency`, `expires_at`, `meta` |
| `ambikly_sessions` | Storefront session payloads | `id`, `session_key`, `user_id`, `ip_address`, `payload`, `expires_at` |
| `ambikly_events` | Generic storefront event log | `id`, `event_name`, `user_id`, `session_key`, `object_type`, `object_id`, `value`, `meta` |

### Discounts and pricing

| Table | Purpose | Key columns |
|---|---|---|
| `ambikly_coupons` | Coupon definitions | `id`, `code`, `discount_type`, `amount`, `minimum_amount`, `maximum_amount`, `usage_limit`, `usage_limit_per_user`, `usage_count`, `individual_use`, `exclude_sale_items`, `free_shipping`, `applies_to`, `excluded`, `email_restrictions`, `starts_at`, `expires_at`, `status` |
| `ambikly_coupon_usage` | One row per redemption | `id`, `coupon_id`, `order_id`, `customer_id`, `customer_email`, `discount_amount` |
| `ambikly_pricing_rules` | Dynamic pricing rules <span class="pro-pill">PRO</span> | `id`, `name`, `status`, `priority`, `discount_type`, `amount`, `conditions`, `applies_to`, `excluded`, `combinable`, `usage_count`, `usage_limit` |
| `ambikly_order_bumps` | Checkout order bumps <span class="pro-pill">PRO</span> | `id`, `name`, `headline`, `product_id`, `variation_id`, `status`, `priority`, `discount_type`, `discount_amount`, `conditions` |
| `ambikly_product_bundles` | Bundle contents <span class="pro-pill">PRO</span> | `id`, `bundle_id`, `product_id`, `variation_id`, `quantity`, `optional`, `price_override`, `sort_order` |

### Shipping and tax

| Table | Purpose | Key columns |
|---|---|---|
| `ambikly_shipping_zones` | Zones and their regions | `id`, `name`, `regions`, `position` |
| `ambikly_shipping_methods` | Methods within a zone | `id`, `zone_id`, `method_id`, `title`, `cost`, `tax_status`, `settings`, `enabled`, `position` |
| `ambikly_tax_rates` | Tax rate table | `id`, `name`, `rate`, `country`, `state`, `postcode`, `city`, `priority`, `compound`, `shipping`, `tax_class`, `position` |

`ambikly_tax_rates.city` has no column in the admin table and is not editable there. Matching on `country`, `state` and `postcode` is exact equality plus the `*` wildcard.

### Digital delivery

| Table | Purpose | Key columns |
|---|---|---|
| `ambikly_downloads` | Granted download entitlements | `id`, `order_id`, `order_item_id`, `customer_id`, `product_id`, `file_id`, `file_url`, `download_token`, `download_limit`, `download_count`, `access_expires_at`, `last_downloaded_at`, `ip_log` |
| `ambikly_license_keys` | Software license keys issued with an order | `id`, `order_id`, `order_item_id`, `product_id`, `customer_id`, `license_key`, `activation_limit`, `activation_count`, `status`, `expires_at` |

### Taxonomies

| Table | Purpose | Key columns |
|---|---|---|
| `ambikly_tags` | Product tags | `id`, `name`, `slug`, `description` |
| `ambikly_brands` | Product brands | `id`, `name`, `slug`, `description`, `logo`, `website`, `position` |
| `ambikly_product_terms` | Product-to-term join for both taxonomies | `id`, `product_id`, `taxonomy`, `term_id` |

### Reviews and wishlists

| Table | Purpose | Key columns |
|---|---|---|
| `ambikly_reviews` | Product reviews | `id`, `product_id`, `user_id`, `customer_id`, `author_name`, `author_email`, `rating`, `title`, `content`, `verified_purchase`, `status`, `helpful_count`, `ip_address` |
| `ambikly_wishlists` | Wishlist containers <span class="pro-pill">PRO</span> | `id`, `user_id`, `session_key`, `customer_id`, `name`, `is_public`, `share_token` |
| `ambikly_wishlist_items` | Wishlist contents <span class="pro-pill">PRO</span> | `id`, `wishlist_id`, `product_id`, `variation_id`, `added_at` |

### Subscriptions and gift cards

| Table | Purpose | Key columns |
|---|---|---|
| `ambikly_subscriptions` | Subscription records <span class="pro-pill">PRO</span> | `id`, `order_id`, `customer_id`, `user_id`, `product_id`, `status`, `billing_period`, `billing_interval`, `billing_cycle_count`, `amount`, `signup_fee`, `payment_method`, `gateway_subscription_id`, `gateway_payment_method_id`, `trial_end`, `next_payment`, `failure_count` |
| `ambikly_subscription_renewals` | One row per renewal attempt <span class="pro-pill">PRO</span> | `id`, `subscription_id`, `parent_order_id`, `renewal_order_id`, `amount`, `status`, `attempt`, `gateway_transaction_id`, `error_code`, `error_message`, `scheduled_at`, `processed_at` |
| `ambikly_gift_cards` | Gift card balances <span class="pro-pill">PRO</span> | `id`, `code`, `initial_balance`, `current_balance`, `currency`, `status`, `expires_at`, `purchased_by_order_id`, `recipient_email`, `pin_hash` |
| `ambikly_gift_card_activities` | Balance movements <span class="pro-pill">PRO</span> | `id`, `gift_card_id`, `order_id`, `type`, `amount`, `balance_after`, `note`, `actor_user_id` |

### B2B

| Table | Purpose | Key columns |
|---|---|---|
| `ambikly_companies` | Company accounts with a credit line | `id`, `name`, `status`, `billing_email`, `tax_id`, `net_terms_enabled`, `payment_terms`, `credit_limit`, `credit_used`, `price_tier_discount` |
| `ambikly_company_users` | Buyer logins for a company | `id`, `company_id`, `customer_id` (UNIQUE), `role`, `status`, `invited_email` |

The UNIQUE key on `customer_id` means one customer belongs to at most one company.

### Infrastructure

| Table | Purpose | Key columns |
|---|---|---|
| `ambikly_jobs` | The durable job queue | `id`, `hook`, `args`, `group_slug`, `unique_key`, `status`, `attempts`, `max_attempts`, `run_at`, `locked_by`, `locked_at`, `last_error` |
| `ambikly_webhooks` | Outbound webhook subscriptions | `id`, `name`, `url`, `secret`, `events`, `active`, `last_fired_at`, `last_status`, `failure_count` |
| `ambikly_webhook_deliveries` | Delivery attempt log | `id`, `webhook_id`, `event`, `status_code`, `duration_ms`, `succeeded`, `attempt`, `request_summary`, `response_summary`, `error`, `processed_at` |
| `ambikly_addons` | Pro add-on state and settings | `id`, `slug`, `version`, `enabled`, `settings`, `installed_at`, `updated_at` |

`ambikly_jobs` has no `completed` status. A job that succeeds is deleted; only failed and in-flight rows persist. See [Addon SDK](/developers/addon-sdk#the-job-queue).

### Add-on tables

Pro add-ons may create tables of their own in `activate()` using `dbDelta()`. Those are outside the 47 counted here — for example, Shipment Tracking creates `ambikly_shipments` and CRM Sync creates `ambikly_crm_sync_log`.

## Migrations

### How `Schema::migrate()` works

`Schema::migrate()` does three things in order:

1. Runs every `CREATE TABLE` statement through `dbDelta()`. `dbDelta` creates a missing table and adds missing columns to an existing one, so the statements are also the migration.
2. Runs explicit `ALTER TABLE` passes for changes `dbDelta` cannot make — `extendProductsTable()`, `extendOrderItemsTable()`, `extendOrdersTable()` and `extendCartsTable()` add columns and indexes, and one of them drops the obsolete `order_code` column, which `dbDelta` would never remove on its own.
3. Writes `Schema::DB_VERSION` into the `ambikly_db_version` option.

`Schema::maybe_migrate()` compares the stored option against `Schema::DB_VERSION` with `version_compare()` and only runs when the stored version is lower. The whole thing is idempotent.

### When migrations run

| Trigger | Runs |
|---|---|
| Plugin activation | Both owners |
| `admin_init` | `Install::maybe_create_tables()` |
| `plugins_loaded` (priority 20) | `Install::maybe_create_tables()` |
| `wp ambikly upgrade-db` | `Schema::migrate()` |

### The shared version option

Both owners read and write the **same** option, `ambikly_db_version`, from different version numbers — `Install` writes `1.2.1`, `Schema` writes `2.11.0`.

Because `Schema`'s number is the higher of the two and runs after activation, the option normally holds `2.11.0`, which is greater than `1.2.1`. `Install::maybe_create_tables()` therefore sees a version that is already ahead of its own and **never fires again** on a site that has run `Schema::migrate()` even once.

The consequences you need to know:

- A change to an `Install`-owned table cannot be shipped by bumping `Install::DB_VERSION` alone. `Install`'s gate will not open.
- The plugin works around this for at least one index. `ensure_variation_sku_unique_key()` is public and idempotent — it short-circuits on its own `SHOW INDEX` check — and `ProductVariationsController` calls it directly on route registration rather than relying on `create_tables()`, precisely because `create_tables()` never fires again.
- `wp ambikly upgrade-db` only calls `Schema::migrate()`. It does not run `Install::create_tables()`.

::: danger `Install::create_tables()` can DROP and recreate `ambikly_categories`
When it does run, `create_tables()` inspects `ambikly_categories` with `DESCRIBE`. If the table exists but is missing any of its 13 expected columns, it runs `DROP TABLE IF EXISTS` and recreates it empty. **Every category row is lost, with no backup and no warning** beyond a line in the PHP error log.

The products table is handled differently — missing columns there are added with `ALTER TABLE`. Only `ambikly_categories` takes the drop-and-recreate path.

In normal operation this never triggers, because the version gate keeps `create_tables()` from running. It becomes reachable if someone resets or deletes the `ambikly_db_version` option, restores a partial database, or hand-edits the categories table. Back up before doing any of those on a live store.
:::

### Running a migration manually

```bash
wp ambikly upgrade-db
```

Or from PHP, on a site where you need `Install` to run too:

```php
\Ambikly\Database\Install::create_tables();  // see the warning above
\Ambikly\Database\Schema::migrate();
```

## Teardown

### Deactivation

Deactivating Ambikly removes nothing. Tables, options, roles and customer data are all left intact. The job queue's cron event is unscheduled; that is the only change.

### Uninstall

Deleting the plugin through <span class="screen-path">Plugins → Delete</span> runs `uninstall.php`, which checks one option first:

```php
$removeData = get_option('ambikly_remove_data_on_uninstall', false);
if (!$removeData) {
    return;
}
```

**That option defaults to false and has no admin control.** An ordinary plugin delete therefore leaves every table and every row in place. To actually remove data you must set the option yourself before deleting:

```bash
wp option update ambikly_remove_data_on_uninstall 1
wp plugin uninstall ambikly
```

When the option is truthy, uninstall removes:

| Removed | How |
|---|---|
| All 47 tables | `Install::drop_tables()` and `Schema::drop_all()`, the two authoritative lists |
| The Store Manager and Support Agent roles | `Capabilities::removeRoles()` |
| Every `ambikly_%` option | Direct query against `wp_options`, then `delete_option()` on each |
| Every `_transient_ambikly_%` transient | Same approach |
| The `ambikly_customer_id` user meta | `delete_metadata()` across all users |

Roles are removed on uninstall rather than on deactivation, so a temporary deactivation does not strip Store Manager assignments from your staff accounts.

::: warning Pro add-on tables are not dropped
`Addon::uninstall()` is never called by `AddonManager`, so a table an add-on created in `activate()` survives an uninstall. Drop those by hand if you need a clean database.
:::

## Querying Ambikly data

### Prefer the models

`Ambikly\Models\*` classes wrap most tables with `find()`, `create()`, `save()` and `delete()`, and cache reads through the WP object cache.

```php
use Ambikly\Models\Order;

$order = Order::find(1044);
if ($order) {
    echo $order->order_number;
    foreach ($order->items() as $item) {
        echo $item['name'] . ' × ' . $item['quantity'];
    }
}
```

### Raw `$wpdb`

For reporting and bulk work, query directly. Always `prepare()`.

```php
global $wpdb;

// Revenue by month for the last year, excluding non-counting statuses.
$rows = $wpdb->get_results($wpdb->prepare(
    "SELECT DATE_FORMAT(created_at, '%%Y-%%m') AS month,
            COUNT(*)                          AS orders,
            SUM(total - total_refunded)       AS revenue
       FROM {$wpdb->prefix}ambikly_orders
      WHERE status NOT IN ('cancelled', 'refunded', 'failed')
        AND created_at >= %s
   GROUP BY month
   ORDER BY month DESC",
    gmdate('Y-m-d H:i:s', strtotime('-1 year'))
), ARRAY_A);
```

Note the doubled `%%` — `$wpdb->prepare()` treats a single `%` as a placeholder, so any literal percent in your SQL (including inside `DATE_FORMAT` and `LIKE`) must be escaped.

```php
// Best-selling products in a date range.
$top = $wpdb->get_results($wpdb->prepare(
    "SELECT oi.product_id, oi.name, SUM(oi.quantity) AS units
       FROM {$wpdb->prefix}ambikly_order_items oi
       JOIN {$wpdb->prefix}ambikly_orders o ON o.id = oi.order_id
      WHERE o.status NOT IN ('cancelled', 'refunded', 'failed')
        AND o.created_at BETWEEN %s AND %s
   GROUP BY oi.product_id, oi.name
   ORDER BY units DESC
      LIMIT 10",
    '2026-01-01 00:00:00',
    '2026-03-31 23:59:59'
), ARRAY_A);
```

```php
// Search safely with esc_like().
$term = '%' . $wpdb->esc_like($input) . '%';
$products = $wpdb->get_results($wpdb->prepare(
    "SELECT id, name, sku, price
       FROM {$wpdb->prefix}ambikly_products
      WHERE status = 'published'
        AND (name LIKE %s OR sku LIKE %s OR short_description LIKE %s)
      LIMIT 50",
    $term, $term, $term
), ARRAY_A);
```

### Always call `forgetCached()` after a raw write

`Model::find()` caches its reads through the WP object cache. Only `save()` and `delete()` invalidate that cache. A raw `$wpdb->update()` or `$wpdb->query()` that bypasses the model leaves a stale row in the cache, and the next `find()` returns the pre-write values — silently, and for the lifetime of the cache entry. On a site with persistent object caching (Redis, Memcached) that can be a long time.

```php
global $wpdb;

// A conditional UPDATE, done raw for atomicity.
$wpdb->query($wpdb->prepare(
    "UPDATE {$wpdb->prefix}ambikly_products
        SET stock_quantity = stock_quantity - %d
      WHERE id = %d AND stock_quantity >= %d",
    $qty, $productId, $qty
));

// Required. Without this, Product::find($productId) serves the old row.
\Ambikly\Models\Product::forgetCached($productId);
```

The plugin follows the same rule everywhere it writes raw for atomicity — stock reservation, coupon usage, gift card balances, company credit and the job queue's `claim()`. Follow it in your own code.

### Atomic updates, not read-then-write

Anywhere a shared counter is decremented — stock, coupon usage, gift card balance, company credit — Ambikly uses a single conditional `UPDATE ... WHERE remaining >= %d` rather than reading a value, checking it in PHP, and writing it back. Two concurrent requests can both pass a PHP-side check and both write; only one can win a conditional `UPDATE`.

Use the same pattern in your own code, and check the affected-row count:

```php
$claimed = $wpdb->query($wpdb->prepare(
    "UPDATE {$wpdb->prefix}ambikly_gift_cards
        SET current_balance = current_balance - %f
      WHERE id = %d AND current_balance >= %f",
    $amount, $cardId, $amount
));

if ($claimed < 1) {
    // Somebody else spent it first. Do not proceed.
}
```

### Character set and collation

Every table is created with `$wpdb->get_charset_collate()`, so it matches the site's own configuration — normally `utf8mb4_unicode_520_ci` on a modern install. Long `varchar` columns that carry an index use a prefix length (`KEY name (name(191))`) to stay under InnoDB's index size limit.

## Next

[Template overrides](/developers/templates) covers what you can and cannot change from a theme.
