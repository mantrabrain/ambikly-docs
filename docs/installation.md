---
title: Installation
description: Requirements, three ways to install Ambikly, what activation creates, how to add Ambikly Pro, and exactly what deactivating or deleting the plugin removes.
prev:
  text: Introduction
  link: /
next:
  text: Setup wizard
  link: /setup-wizard
---

# Installation

Ambikly installs like any other WordPress plugin. This page covers the requirements, the three install routes, what activation does to your database, how to add Ambikly Pro on top, and what is and is not removed when you deactivate or delete.

## Requirements

Ambikly needs nothing beyond a standard WordPress host. There is no build step, no Composer install, and no external service to register with before you start.

| Requirement | Minimum | Notes |
|---|---|---|
| WordPress | 5.4 | Declared in the plugin header. Tested up to 6.7. |
| PHP | 7.4 | Declared in the plugin header. 8.1 or newer recommended. |
| MySQL | 5.7 | Or MariaDB 10.3. Ambikly uses `dbDelta`, JSON columns are not required. |
| Database tables | 45 free | Prefixed `{wp_prefix}ambikly_`. Check your host's table quota. |
| PHP memory | 128 MB | The React admin is a static bundle; memory is used by imports and exports. |
| HTTPS | Recommended | Stripe and PayPal will not work usefully without it. |

Ambikly does not require another eCommerce plugin, and it does not read another plugin's data. If you already run one, see the note on page slugs in [Store pages](/store-pages) — Ambikly deliberately avoids adopting a `/shop` or `/cart` page that belongs to something else.

## Install the free core

Ambikly is on WordPress.org, so the search route is the shortest. All three routes end at the same place: an inactive plugin waiting to be activated.

### Route 1 — search from the WordPress admin

<ol class="step-list">
  <li>Go to <span class="screen-path">Plugins → Add New</span>.</li>
  <li>Search for <strong>Ambikly</strong>.</li>
  <li>Click <strong>Install Now</strong> on the plugin by <em>ambikly</em>, then <strong>Activate</strong>.</li>
</ol>

### Route 2 — upload a ZIP

Use this when you were sent a build directly, or when your host blocks outbound calls to WordPress.org.

<ol class="step-list">
  <li>Download <code>ambikly.zip</code> from <a href="https://wordpress.org/plugins/ambikly/">wordpress.org/plugins/ambikly</a>.</li>
  <li>Go to <span class="screen-path">Plugins → Add New → Upload Plugin</span>.</li>
  <li>Choose the ZIP, click <strong>Install Now</strong>, then <strong>Activate</strong>.</li>
</ol>

<div class="ui-warn"><strong>Careful:</strong> Do not unzip the archive before uploading, and do not upload a ZIP that contains a second nested <code>ambikly</code> folder. WordPress expects <code>ambikly/ambikly.php</code> at the top level and will report "no valid plugin header" otherwise.</div>

### Route 3 — SFTP or SSH

Use this when the upload limit on your host is too small, or when you deploy plugins from version control.

<ol class="step-list">
  <li>Unzip <code>ambikly.zip</code> locally so you have a folder named <code>ambikly</code>.</li>
  <li>Upload that folder into <code>wp-content/plugins/</code>, so the main file lands at <code>wp-content/plugins/ambikly/ambikly.php</code>.</li>
  <li>Keep the bundled <code>vendor/</code> directory. Ambikly loads its autoloader from <code>vendor/autoload.php</code>; without it, classes will not load.</li>
  <li>Go to <span class="screen-path">Plugins → Installed Plugins</span> and click <strong>Activate</strong> under Ambikly.</li>
</ol>

## What activation does

Activation is where all the setup work happens. It runs once, on the `register_activation_hook` callback in `ambikly.php`, and it is safe to re-run — every step checks before it writes.

| Step | What it does |
|---|---|
| Create tables | Builds the 45 `{wp_prefix}ambikly_` tables. 10 come from `Install` (products, attributes, variations, files, meta), 35 from `Schema` (orders, customers, coupons, shipping, tax, webhooks, jobs, and the Pro-facing tables). |
| Migrate schema | Runs `Schema::migrate()` and records the result in the `ambikly_db_version` option. |
| Seed defaults | Writes `ambikly_settings_general`, `ambikly_settings_emails`, `ambikly_settings_payments` and `ambikly_settings_pages` — but only where the option does not already exist. |
| Create store pages | Publishes Shop, Cart, Checkout, My Account and Order Received, each containing the matching shortcode. See [Store pages](/store-pages). |
| Register roles | Adds the `ambikly_store_manager` (Store Manager) and `ambikly_support_agent` (Support Agent) roles, and grants Administrators the `ambikly_manage_store` and `ambikly_view_store` capabilities. See [Roles & permissions](/roles). |
| Flag the wizard | Sets a 60-second transient that redirects you into the setup wizard on your next admin page load. |

The seeded defaults are deliberately conservative: USD with the symbol on the left, a US store country, kg and cm units, Cash on Delivery enabled, Direct Bank Transfer present but disabled, and a "Rest of World" shipping zone carrying a $10 flat rate plus free shipping over $100. All of it is editable afterwards, and the currency is a store setting — the rest of these docs use `$` for examples.

::: tip The wizard opens by itself — once
The activation redirect is a one-shot transient. If you land somewhere else — because you bulk-activated several plugins, or because another plugin redirected first — the wizard does not open. An admin notice offering the wizard stays on screen until you finish it or click **Skip**. See [Setup wizard](/setup-wizard).
:::

## Install Ambikly Pro

Ambikly Pro is a **separate plugin**, not an upgrade of the free one. Both stay installed and both stay active. Pro is not distributed on WordPress.org — you download it from your account at [store.ambikly.com](https://store.ambikly.com/account/) after purchase.

<ol class="step-list">
  <li>Install and activate the free Ambikly plugin first. Pro is a hard dependency, not a suggestion.</li>
  <li>Download <code>ambikly-pro.zip</code> from <a href="https://store.ambikly.com/account/">your account</a>.</li>
  <li>Go to <span class="screen-path">Plugins → Add New → Upload Plugin</span>, upload the ZIP, and click <strong>Activate</strong>.</li>
  <li>Open <span class="screen-path">Ambikly → License</span> and activate your license key.</li>
  <li>Open <span class="screen-path">Ambikly → Addons</span> and switch on the add-ons you want. Disabled add-ons are skipped at load time.</li>
</ol>

Pro enforces the dependency in two places:

- **On activation.** If the free plugin's `Ambikly\Database\Schema` class is missing, Pro deactivates itself and shows a "Plugin dependency missing" page rather than half-installing.
- **On every page load.** Pro checks `AMBIKLY_VERSION` against a hard-coded minimum of **0.0.10**. If the free core is older, Pro prints an admin notice — *"Ambikly Pro requires Ambikly 0.0.10 or higher"* — and does not boot. No add-on runs, and no Pro screen appears.

So the order matters: update the free core first, then Pro. Never the other way around.

Pro activation also runs `Schema::migrate()` again, which is how the Pro-facing tables reach the current version if you installed the free core some time ago.

See [Install & activate a license](/pro-install) for the license flow and [Managing add-ons](/addons-manage) for enabling individual add-ons.

<div class="pro-callout">
  <div class="pro-callout__head"><span class="pro-callout__badge">PRO</span><span class="pro-callout__title">One license, 35 add-ons</span></div>
  <p class="pro-callout__desc">Ambikly Pro is a single purchase that unlocks every add-on — subscriptions, gift cards, bundles, abandoned cart, one-page checkout and the rest. There is no per-add-on pricing and no transaction fee.</p>
  <a class="pro-callout__cta" href="https://ambikly.com/pricing/">See pricing →</a>
</div>

## Post-install health check

Run these five checks before you add real products. Each one catches a different class of install problem.

| Check | Where | What you want to see |
|---|---|---|
| Plugin active | <span class="screen-path">Plugins → Installed Plugins</span> | Ambikly listed as active, version 0.0.10 or newer |
| Admin loads | <span class="screen-path">Ambikly</span> | The full-screen dashboard, not a blank white page |
| Tables present | <span class="screen-path">Ambikly → Tools → System status</span> | `missing_tables` is an empty list |
| DB version current | <span class="screen-path">Ambikly → Tools → System status</span> | `db_version` matches `expected_db_version` |
| Store pages exist | <span class="screen-path">Pages</span> | Shop, Cart, Checkout, My Account and Order Received, all published |

To read System status, click the **wrench icon in the top-right header** of the Ambikly admin, then **Show status** on the System status card. The result is JSON covering plugin and DB versions, PHP, WordPress and MySQL versions, memory limit, whether the site is on SSL, the expected and missing tables, row counts, your currency and store country, the gateways currently available, and every registered add-on with its enabled state. **Copy** puts the whole blob on your clipboard for a support ticket.

<div class="ui-tip"><strong>Tip:</strong> If <code>db_version</code> is behind <code>expected_db_version</code> — usually after a manual file-level update that skipped activation — run <code>wp ambikly upgrade-db</code>, or deactivate and reactivate the plugin. See <a href="/developers/wp-cli">WP-CLI</a>.</div>

### If the Ambikly screen is blank

The admin is a React single-page app mounted into `#ambikly-new-root`, and it hides the WordPress admin chrome while it is on screen. A blank page almost always means the bundle did not load:

- Open your browser console and look for `[Ambikly] React or ReactDOM not loaded!` — that points at a blocked script or an aggressive optimization plugin.
- Check that the `vendor/` and `assets/` directories survived your upload.
- Temporarily disable JS concatenation or minification plugins and reload.
- Confirm your user has one of `ambikly_view_store` or `manage_options`. Without either, the page renders nothing at all.

More in [Troubleshooting](/troubleshooting).

## Updating

| You are updating | How |
|---|---|
| Free core, from WordPress.org | <span class="screen-path">Dashboard → Updates</span>, or the **Update now** link on <span class="screen-path">Plugins</span> |
| Free core, by file | Replace the `ambikly` folder, then run `wp ambikly upgrade-db` or reactivate |
| Pro | <span class="screen-path">Dashboard → Updates</span> once the license is active — Pro registers itself with the WordPress updater |

Pro's update check runs against your license. If the license lapses, updates stop being offered but the add-ons you already have keep running.

Before any update on a live store: take a database backup, and update the free core before Pro. If the two ever end up mismatched, Pro simply refuses to boot with a notice — the store keeps selling on the free core in the meantime.

## Deactivating vs deleting

These two are very different, and the difference is deliberate.

### Deactivating

Deactivation runs exactly one thing: it unschedules Ambikly's cron events — the job-queue tick and the cart-prune job. That is all.

| Kept | Removed |
|---|---|
| All 45 database tables and every row in them | Scheduled cron events |
| Every `ambikly_*` option, including settings and gateway credentials | — |
| The Store Manager and Support Agent roles, and users' assignments to them | — |
| The Shop, Cart, Checkout, My Account and Order Received pages | — |
| Products, orders, customers, coupons, invoices, webhook secrets | — |

Reactivating brings everything back, reschedules the cron, and re-runs the idempotent seed (which finds the existing options and leaves them alone). Deactivating is a safe way to take the store offline while you diagnose a conflict.

While deactivated, the storefront pages still exist but the shortcodes are no longer registered, so those pages render their raw shortcode text to visitors. Set them to draft if the site stays public.

### Deleting

Deleting the plugin from <span class="screen-path">Plugins</span> runs `uninstall.php`. The first thing that file does is read the `ambikly_remove_data_on_uninstall` option:

::: warning Your data survives a delete by default
`ambikly_remove_data_on_uninstall` **defaults to false**, and there is **no admin UI anywhere in Ambikly to change it**. With the default in place, deleting the plugin removes the plugin files and nothing else — every table, option, role and store page stays exactly where it was. This is intentional: an accidental delete should not destroy a store.
:::

If you genuinely want a clean removal — you are decommissioning a test site, or handing over a server — set the option to a truthy value before you delete:

```bash
wp option update ambikly_remove_data_on_uninstall 1
```

Or in code, from a mu-plugin or a one-off snippet:

```php
update_option( 'ambikly_remove_data_on_uninstall', 1 );
```

With the flag truthy, deletion then:

- Drops every table owned by `Install` and by `Schema` — all 45.
- Removes the Store Manager and Support Agent roles, and strips `ambikly_manage_store` / `ambikly_view_store` from Administrators.
- Deletes every option whose name begins `ambikly_`, and every `_transient_ambikly_*`.
- Deletes the `ambikly_customer_id` user meta from all users.

<div class="ui-warn"><strong>Careful:</strong> This is not reversible and there is no confirmation prompt beyond WordPress's own "are you sure" on the delete. Orders, customer records, invoices and stored gateway credentials all go. Take a database backup first.</div>

Two things deletion does **not** touch, in either mode: the Shop, Cart, Checkout, My Account and Order Received pages — they are ordinary WordPress pages, so delete them yourself — and any files customers uploaded or you attached to digital products in the media library.

## Next

The plugin is installed and the tables are in place. Next, walk the [Setup wizard](/setup-wizard) to set your currency, pick a payment method and confirm your store pages.
