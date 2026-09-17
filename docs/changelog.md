---
title: Changelog
description: Current Ambikly and Ambikly Pro versions, requirements, the versioning policy, how updates reach a site, how the database migrates, and a safe update order.
prev:
  text: FAQ
  link: /faq
next:
  text: Support
  link: /support
---

# Changelog

What is currently released, what each plugin requires, how versions are numbered, how updates
reach your site, and the order to apply them in without breaking a live store.

## Current versions

| Plugin | Version | Requires WordPress | Requires PHP | Also requires |
|---|---|---|---|---|
| Ambikly (free core) | **0.0.10 or newer** | 5.4+ | 7.4+ | — |
| Ambikly Pro | **0.0.1** | 5.4+ | 7.4+ in practice | Ambikly free core `0.0.10` or newer |

The free core's plugin header reads `0.0.10`. The WordPress.org listing may show a slightly newer
patch release — install whatever WordPress.org offers you and treat `0.0.10` as the floor.

Ambikly Pro's own readme declares a PHP floor of 5.6, but it cannot run without the free core,
which requires 7.4. The effective requirement for a site running Pro is therefore PHP 7.4 or newer.

<div class="ui-tip"><strong>Tip:</strong> The version actually running on your site is in the system status report, along with the database version it expects. See <a href="/system-status">System status</a>.</div>

### Version compatibility between the two plugins

Ambikly Pro hard-checks the free core's version at load time and requires `0.0.10` or newer. Below
that, Pro does not boot at all — no add-ons, no Pro routes, no License screen behavior. The system
status report shows `pro_active: false` in that case even though the plugin is activated in
WordPress.

Pro also declares the free plugin as a required plugin in its header, so WordPress itself will
warn you if you try to activate Pro without the core installed.

## Release history

### Ambikly (free core)

| Version | Contents |
|---|---|
| 0.0.10 | Ongoing pre-release development |

That is the entire changelog the plugin's readme records. Both plugins are pre-1.0, and neither
readme carries dated per-release notes yet.

**What 0.0.10 contains**, from the plugin's own feature list:

- Physical and digital products, including variable products with per-variant pricing and stock
- Cart, checkout, and a customer account area covering orders, downloads, addresses and profile
- Orders with line items, notes, refunds, a status workflow and printable invoices
- Coupons with usage limits, per-product restrictions and free-shipping rules
- Shipping zones and methods: flat rate, free shipping, local pickup
- Tax rates by country, state and postcode, with tax-inclusive or tax-exclusive pricing
- Seven payment gateways: Stripe, PayPal, Cash on Delivery, Direct Bank Transfer, Check Payments,
  Manual and Net Terms
- Business accounts: companies with net-terms billing and multiple buyers per account
- Product reviews with admin moderation
- Transactional emails with editable templates, smart tags and a live preview
- Outgoing webhooks with HMAC-signed deliveries, retries and a delivery log
- A REST API under `/wp-json/ambikly/v1/`
- Dark mode and a mobile-responsive admin

Two items in that list deserve a caveat, because the plugin ships them in a narrower form than the
summary implies:

- **Coupons have no category restriction.** Product include and exclude lists and email
  restrictions work; category restriction does not exist. See [Coupons](/coupons).
- **Only four transactional emails are editable** — order notification and order status change,
  each in a customer and an admin version. See [Emails](/emails).

### Ambikly Pro

Ambikly Pro's readme carries **no changelog entries**. The released version is `0.0.1`, which is
the initial release of the 35 add-ons under a single license.

Per-add-on behavior and its own limitations are documented on each add-on's page. See
[All add-ons](/addons/).

Two Pro caveats to carry into any upgrade planning:

- **The Checkout Field Editor stores a schema that the core checkout does not consume**, so its
  configuration does not yet change what a customer sees. See
  [/addons/checkout-field-editor](/addons/checkout-field-editor).
- **`subscription.*` webhook events only fire when the subscriptions add-on is enabled and
  licensed**, even though they can be subscribed to from the free core. See
  [Webhooks](/developers/webhooks).

## Versioning policy

Both plugins use `major.minor.patch`.

| Level | What may change | What you should do |
|---|---|---|
| **Major** | Breaking changes: removed or renamed hooks, changed REST response shapes, changed database columns that integrations read, changed storefront markup | Read the release notes fully, test on staging, update integrations first |
| **Minor** | New features, new settings, new REST routes, new hooks, new database tables or columns. Existing behavior is preserved | Test on staging if you have custom code; otherwise update normally |
| **Patch** | Bug fixes and security fixes only. No new settings, no schema changes that require your attention | Apply promptly, especially security fixes |

Two consequences worth spelling out:

- **A patch release never removes a hook or changes a REST response shape.** If custom code breaks
  on a patch update, that is a bug — report it.
- **A minor release may add database tables or columns.** That is why the schema migrates itself
  on update, and why the system status report compares expected and actual database versions.

While both plugins are below `1.0`, treat every update as capable of changing behavior, and test
on staging before applying to a store that is taking orders.

## How updates reach your site

### The free core

Ambikly is distributed through WordPress.org, so it updates the way any WordPress.org plugin does:

<ol class="step-list">
  <li>WordPress checks for updates on its own schedule and shows one under <span class="screen-path">Dashboard → Updates</span> and on <span class="screen-path">Plugins → Installed Plugins</span>.</li>
  <li>Click <strong>Update now</strong>, or let auto-updates apply it if you have enabled them for this plugin.</li>
  <li>WordPress replaces the plugin files. Your data is untouched — everything lives in Ambikly's own tables and options.</li>
</ol>

You can also update by uploading a fresh copy of the plugin folder over the old one. Deactivating
first is not necessary and does not affect data.

### Ambikly Pro

Pro is not on WordPress.org. It updates through its own licensed updater, which checks
`store.ambikly.com` using the license key activated on the site. The update then appears in the
normal WordPress updates list, exactly like a WordPress.org plugin.

This means:

- **A valid license is required to receive Pro updates.** With no valid license, no update
  notification appears.
- **The license is tied to the site URL** it was activated against. After moving a site, re-activate
  the license before expecting updates. See [Install & activate a license](/pro-install).
- The license is revalidated in the background once a day, so a renewal completed at the store may
  take until the next check to be reflected locally. Re-activating from
  <span class="screen-path">Ambikly → License</span> applies immediately.

<div class="ui-warn"><strong>Careful:</strong> Deactivating a license leaves the stored key in place and clears only the cached details. That is convenient for moving a site, but it also means "the key is still in the field" is not evidence that the license is currently valid. Check the status shown on the License screen.</div>

## How the database migrates

Ambikly migrates its own schema. There is no migration screen and nothing to run by hand in normal
use.

### What happens on update

<ol class="step-list">
  <li>New plugin files land on the site.</li>
  <li>On the next request, the migration check runs — it is wired to both <code>admin_init</code> and <code>plugins_loaded</code>, so loading any admin page is enough.</li>
  <li>The stored database version is compared against the version the code expects. If the stored one is lower, migrations run.</li>
  <li>Tables are created or altered with WordPress's own <code>dbDelta</code>, which adds what is missing without dropping data. Migrations are idempotent — running them twice is harmless.</li>
  <li>The stored database version is updated to match.</li>
</ol>

### The two version numbers

Ambikly's tables are owned by two classes, each with its own expected version, and both record
their state in the same `ambikly_db_version` option:

| Owner | Tables | Expected version |
|---|---|---|
| `Schema` | 35 | `2.11.0` |
| `Install` | 10 | `1.2.1` |

All 45 tables are prefixed `{wp_prefix}ambikly_`. The system status report shows the stored
`db_version` next to `expected_db_version` — that comparison is the one to act on.

See [Database schema](/developers/database).

### When migration does not complete

If the report still shows a mismatch after loading an admin page, run the migration explicitly:

```bash
wp ambikly upgrade-db
```

It reports either `Database already at version X` or `Migrated database: X → Y`. If it fails, the
database user most likely lacks `CREATE TABLE` or `ALTER` — ask your host.

<div class="ui-warn"><strong>Careful:</strong> Table creation will drop and recreate the <code>ambikly_categories</code> table if it exists with missing columns. That is a real data-loss path on a site whose schema was left half-migrated or partially restored from a backup. Take a database backup before any update, and especially before re-running table creation on a site you suspect is in an inconsistent state.</div>

## Recommended update order

For a store that is taking real orders, apply updates in this order.

<ol class="step-list">
  <li><strong>Back up first.</strong> Database and files, and confirm you can actually restore the backup.</li>
  <li><strong>Update the free core.</strong> Pro depends on it and checks its version at load time, so the core has to be new enough before Pro arrives. Updating Pro first can leave Pro refusing to boot.</li>
  <li><strong>Load an admin page and let the migration run.</strong> Any Ambikly screen will do.</li>
  <li><strong>Update Ambikly Pro.</strong> Then reload the admin.</li>
  <li><strong>Check System status.</strong> Confirm the plugin version is what you expect, <code>db_version</code> matches <code>expected_db_version</code>, <code>missing_tables</code> is empty, <code>pro_active</code> is <code>true</code>, and your gateways are still listed in <code>available_gateways</code>. See <a href="/system-status">System status</a>.</li>
  <li><strong>Check the add-on list.</strong> Every add-on you rely on should still show <code>enabled: true</code>, and there should be no "add-ons paused" notice in the admin.</li>
  <li><strong>Place a test order.</strong> End to end, through the gateway you actually use, and confirm the order reaches its paid status and the confirmation email arrives.</li>
</ol>

<div class="ui-tip"><strong>Tip:</strong> Do this on a staging copy first if you have one. If you only have production, update during your quietest hour, not at the end of the day — you want to be present for the test order.</div>

### What to check after the test order

| Check | Where |
|---|---|
| Order reached its paid status | <span class="screen-path">Ambikly → Orders</span> |
| Confirmation email arrived | Customer inbox, and the admin recipient list |
| Download links work, for a digital product | The customer account area |
| Webhooks delivered | The delivery log under <span class="screen-path">Ambikly → Webhooks</span> |
| No failed background jobs | `GET /wp-json/ambikly/v1/jobs/failed` |

If anything in that list is wrong, [Troubleshooting](/troubleshooting) covers each symptom.

### If an update breaks something

<ol class="step-list">
  <li>Capture the system status report before changing anything else — it is far more useful before a rollback than after.</li>
  <li>Note the exact error text and the last action that worked.</li>
  <li>Restore your backup if the store cannot take orders.</li>
  <li>Report it with the details above. See <a href="/support">Support</a>.</li>
</ol>

Rolling back plugin files does **not** roll back the database. Once migrations have run, the schema
is at the newer version; older plugin files may then be reading a schema they were not written
against. Restore the database from the same backup as the files, not just the files.

## Staying informed

- Free core downloads and release notes: [wordpress.org/plugins/ambikly](https://wordpress.org/plugins/ambikly/)
- Pro licensing and downloads: [store.ambikly.com](https://store.ambikly.com)
- Product announcements: [ambikly.com](https://ambikly.com)

## Next

- Getting help, and what to include: [Support](/support)
- Diagnostics to collect first: [System status](/system-status)
