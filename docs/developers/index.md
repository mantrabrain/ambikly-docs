---
title: Developer overview
description: How to extend Ambikly — the REST API, hooks and filters, webhooks, WP-CLI, the Pro Addon SDK, custom payment gateways and the durable job queue.
prev:
  text: All add-ons
  link: /addons/
next:
  text: REST API
  link: /developers/rest-api
---

# Developer overview

Ambikly is built to be extended from PHP and from JavaScript. Every store screen in the admin is a React app talking to a documented REST API, every meaningful store event fires a WordPress action, and the paid tier is itself built on the same public Addon SDK you can write against.

This section is the reference for that surface. It assumes you write PHP for WordPress and are comfortable with `add_action`, `add_filter` and `$wpdb`.

## What is extensible

| Surface | Use it for | Reference |
|---|---|---|
| REST API | Reading and writing products, orders, customers, coupons, carts from anywhere | [REST API](/developers/rest-api), [Endpoint reference](/developers/endpoints) |
| Actions and filters | Reacting to store events, changing values in flight | [Hooks & filters](/developers/hooks) |
| Outbound webhooks | Pushing store events to an external service over HTTP | [Webhooks](/developers/webhooks) |
| WP-CLI | Migrations, CSV export, recomputing denormalized totals | [WP-CLI](/developers/wp-cli) |
| Payment gateway API | Adding a payment method to checkout | [Payment gateway API](/developers/payment-gateways) |
| Addon SDK <span class="pro-pill">PRO</span> | Packaging a feature with settings, lifecycle and a license gate | [Addon SDK](/developers/addon-sdk) |
| Job queue | Background work that must survive a failed attempt | [Addon SDK](/developers/addon-sdk#the-job-queue) |
| Email templates | Changing transactional email markup | [Template overrides](/developers/templates) |

<div class="ak-cards">
<a class="ak-card" href="/developers/rest-api"><span class="ak-card__icon">🔌</span><h3>REST API</h3><p>Authentication, the response envelope, pagination and error codes.</p><span class="ak-card__cta">Read more →</span></a>
<a class="ak-card" href="/developers/endpoints"><span class="ak-card__icon">📋</span><h3>Endpoint reference</h3><p>Every route in both namespaces, with its permission callback.</p><span class="ak-card__cta">Read more →</span></a>
<a class="ak-card" href="/developers/hooks"><span class="ak-card__icon">🪝</span><h3>Hooks &amp; filters</h3><p>All 47 <code>ambikly_</code> hooks in the free core, with arguments.</p><span class="ak-card__cta">Read more →</span></a>
<a class="ak-card" href="/developers/webhooks"><span class="ak-card__icon">📡</span><h3>Webhooks</h3><p>Nine events, the signed JSON envelope and the retry schedule.</p><span class="ak-card__cta">Read more →</span></a>
<a class="ak-card" href="/developers/wp-cli"><span class="ak-card__icon">⌨️</span><h3>WP-CLI</h3><p>Three commands for migrations, CSV export and recomputation.</p><span class="ak-card__cta">Read more →</span></a>
<a class="ak-card" href="/developers/database"><span class="ak-card__icon">🗄️</span><h3>Database schema</h3><p>Every table, the migration mechanism and safe querying.</p><span class="ak-card__cta">Read more →</span></a>
<a class="ak-card" href="/developers/templates"><span class="ak-card__icon">📄</span><h3>Template overrides</h3><p>What you can override from a theme, and what you cannot.</p><span class="ak-card__cta">Read more →</span></a>
<a class="ak-card" href="/developers/payment-gateways"><span class="ak-card__icon">💳</span><h3>Payment gateway API</h3><p>The abstract class, PaymentResult and a working example.</p><span class="ak-card__cta">Read more →</span></a>
<a class="ak-card" href="/developers/addon-sdk"><span class="ak-card__icon">🧩</span><h3>Addon SDK</h3><p>The Pro add-on base class, settings schema and lifecycle.</p><span class="ak-card__cta">Read more →</span></a>
</div>

## Architecture in brief

Ambikly ships as two plugins. The free core (`ambikly`) is a complete store on its own. Ambikly Pro (`ambikly-pro`) is a container for 35 optional add-ons behind one license; it requires the free core and hard-checks for version `0.0.10`.

Four architectural decisions shape everything else:

**Own tables, not custom post types.** Products, orders, customers, carts and everything else live in dedicated `{wp_prefix}ambikly_*` tables. There is no `WP_Query`, no `get_post_meta`, no post type registration. Read store data through the REST API, through the model and repository classes, or with `$wpdb`. See [Database schema](/developers/database).

**The storefront is server-rendered PHP.** Shop, product, cart, checkout and account markup is generated inline in `src/Frontend/Storefront.php` and emitted by blocks and shortcodes. It is styled with CSS and adjusted through `ambikly_*` filters and actions. It is not a template hierarchy — see [Template overrides](/developers/templates) for what is and is not overridable.

**The admin is React over REST.** Everything under <span class="screen-path">Ambikly</span> in wp-admin is a single-page React app that calls the same REST endpoints you can call. Nothing the admin does is private to it, which is why the endpoint reference doubles as the admin's own API contract.

**Background work goes through a durable queue.** Outbound webhook delivery — and anything an add-on chooses to enqueue — runs through `ambikly_jobs`, with retries, exponential backoff and operator-visible failures, rather than an inline HTTP call or a bare `wp_schedule_event`.

### Versions

| Component | Version | Requires |
|---|---|---|
| Ambikly (free core) | 0.0.10 or newer | WordPress 5.4+, PHP 7.4+ |
| Ambikly Pro | 0.0.1 | Free core 0.0.10, a valid license |

Neither plugin has a PHP build step. Both load a committed `vendor/autoload.php` that contains only the Composer runtime — there are no runtime Composer packages to install.

### Roles and capabilities

Ambikly adds two roles and two capabilities. Everything on the following pages that says "Store Manager" or "Support Agent" means these.

| Capability | Held by | Grants |
|---|---|---|
| `ambikly_manage_store` | Administrator, Store Manager (`ambikly_store_manager`) | Full read and write on store operations |
| `ambikly_view_store` | Administrator, Store Manager, Support Agent (`ambikly_support_agent`) | Read-only store access |

Settings, payments, webhooks, system status, import/export, email templates and the setup wizard stay on `manage_options`. Roles are removed on uninstall, not on deactivation, so a temporary deactivation does not strip role assignments from your staff accounts.

### Numbers worth knowing

| Thing | Count |
|---|---|
| REST routes | Over 200 — `ambikly/v1` 117 registrations (123 at runtime), `ambikly-pro/v1` 94 (99 at runtime) |
| `ambikly_` hooks in the free core | 47 concrete — 16 actions, 31 filters — plus 2 dynamic patterns |
| Database tables | 47, across two schema owners |
| Payment gateways shipped | 7 |
| Webhook events | 9 |
| Gutenberg blocks / shortcodes | 8 / 8 |
| Pro add-ons | 35, on one license |

## Conventions

**Namespaces.** The free core is PSR-4 under `Ambikly\` mapped to `src/`. Pro is `AmbiklyPro\` mapped to its own `src/`, with add-ons at `AmbiklyPro\Addons\{PascalCase}\Addon`. There is no build step for PHP: both plugins load a committed `vendor/autoload.php` with no runtime Composer packages.

**The `ambikly_` prefix.** Every hook name, option name, database table, REST namespace, block name and capability starts with `ambikly_` (or `ambikly/` for blocks and routes, `ambikly-pro/` for Pro routes). Use your own prefix for your own hooks; do not add new `ambikly_`-prefixed hooks from third-party code.

**Capabilities, not `manage_options`.** Store operations are gated on `ambikly_manage_store` and `ambikly_view_store` so the Store Manager and Support Agent roles work. Reserve `manage_options` for genuinely administrative surfaces — settings, payments, webhooks, import/export.

**Prepared statements.** Every query against an Ambikly table uses `$wpdb->prepare()`. Never interpolate a variable into SQL.

### Where to put your code

Put custom code in a small plugin of your own, not in your theme's `functions.php`. A theme switch should not take your store integration with it, and a theme update should not overwrite it.

```php
<?php
/**
 * Plugin Name: Acme Store Customizations
 * Description: Site-specific Ambikly customizations.
 */

if (!defined('ABSPATH')) {
    exit;
}

add_action('ambikly_order_paid', function ($order) {
    // $order is an \Ambikly\Models\Order
    error_log('Order ' . $order->order_number . ' was paid: ' . $order->total);
});
```

Load it after Ambikly. Ambikly's own classes are available from `plugins_loaded` onward; hook registration at the top level of your plugin file is fine because `add_action` only records a callback.

::: warning Do not edit the plugin directly
Changes to files inside `wp-content/plugins/ambikly` or `wp-content/plugins/ambikly-pro` are lost on the next update. Everything on the following pages exists so you do not have to.
:::

### Picking the right extension point

| You want to | Reach for |
|---|---|
| React to something happening in the store, in PHP | An action — [Hooks & filters](/developers/hooks) |
| Change a value before it is used | A filter — [Hooks & filters](/developers/hooks) |
| Tell an external system about store events | A [webhook](/developers/webhooks). It already signs and retries |
| Read or write store data from outside WordPress | The [REST API](/developers/endpoints) with an Application Password |
| Add a payment method | A [payment gateway](/developers/payment-gateways) |
| Add markup to the storefront | A filter, a block attribute, or CSS — the storefront is [not template-overridable](/developers/templates) |
| Change a transactional email | An [email filter or a theme template override](/developers/templates) |
| Do background work that must not be lost | The [job queue](/developers/addon-sdk#the-job-queue) |
| Package all of the above with settings and a UI | The [Addon SDK](/developers/addon-sdk) |

Prefer a hook to a template copy. A hook keeps working across updates; a copied template silently freezes at the version you copied it from.

<div class="pro-callout">
  <div class="pro-callout__head"><span class="pro-callout__badge">PRO</span><span class="pro-callout__title">The Addon SDK</span></div>
  <p class="pro-callout__desc">Ambikly Pro's 35 add-ons are all written against the same public <code>Addon</code> base class you can extend — settings schema, enable/disable lifecycle, per-add-on storage and REST routes included.</p>
  <a class="pro-callout__cta" href="https://ambikly.com/pricing/">See pricing →</a>
</div>

## Next

Start with the [REST API](/developers/rest-api) for authentication and the response envelope, then the [Endpoint reference](/developers/endpoints) for the routes themselves.
