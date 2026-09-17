---
title: Managing add-ons
description: The Add-ons screen — enabling and disabling add-ons, what each action actually does, per-add-on settings, how secrets are masked, and the license gate.
prev:
  text: Install & activate a license
  link: /pro-install
next:
  text: All add-ons
  link: /addons/
---

# Managing add-ons

All 35 Ambikly Pro add-ons are managed from one screen: <span class="screen-path">Ambikly → Add-ons</span>. They are not separate plugins — enabling one does not install anything, and disabling one does not delete anything.

## The Add-ons screen

Add-ons are shown as cards, grouped by category. Nine categories are used, in this order:

| Category | Label on screen |
|---|---|
| `store` | Store experience |
| `marketing` | Marketing |
| `merchandising` | Merchandising |
| `checkout` | Checkout & sales |
| `digital` | Digital products |
| `physical` | Physical products |
| `customer` | Customer features |
| `admin` | Admin & analytics |
| `ai` | AI |

A toolbar across the top gives you a search box and four filters, each showing a live count:

| Filter | Shows |
|---|---|
| All | Every add-on. |
| Enabled | Only add-ons currently switched on. |
| Available | Everything except coming-soon entries. |
| Coming soon | Roadmap entries that cannot be enabled yet. |

Search matches on the add-on name and its description.

Each card carries the add-on's name, description, version and an on/off toggle. Add-ons with configurable options also get a settings action that opens a drawer.

<div class="ui-tip"><strong>Tip:</strong> Without the Pro plugin installed, this screen still shows the full catalog — name, description and category for all 35 — as locked preview cards, so you can see what a license covers before buying. Nothing on that preview is clickable.</div>

## Enabling an add-on

<ol class="step-list">
  <li>Go to <span class="screen-path">Ambikly → Add-ons</span>.</li>
  <li>Find the add-on, using the search box or the category groups.</li>
  <li>Click its toggle. A toast confirms: "<em>Name</em> enabled — refresh to see new menu items."</li>
  <li>Reload the admin. Some add-ons add their own screen to the Ambikly sidebar, and that only appears after a reload.</li>
  <li>Open the add-on's settings and configure it. Most add-ons need at least one setting before they do anything visible.</li>
</ol>

### What enabling actually does

Four things happen, in this order:

<ol class="step-list">
  <li><strong>The license is checked.</strong> Without a valid license the request is refused before anything is written.</li>
  <li><strong>The database row is updated.</strong> The add-on's row in the add-ons table gets <code>enabled = 1</code> and its current version, with a site-local timestamp. If no row exists yet, one is inserted.</li>
  <li><strong><code>activate()</code> runs — once.</strong> This is the add-on's one-time setup: creating its own tables, seeding default rows, scheduling its cron events. It runs on enable and only on enable.</li>
  <li><strong><code>boot()</code> runs immediately.</strong> The add-on registers its hooks and REST routes right away, so you do not have to reload the front end for it to start working.</li>
</ol>

The action `ambikly_addon_activated` fires afterwards with the add-on slug, so other code can react.

### Coming-soon add-ons

Entries marked coming soon cannot be enabled. The toggle is inert and the REST route returns:

> This addon is not available yet.

They appear in the catalog so you can see the roadmap.

## Disabling an add-on

Click the toggle again. A toast confirms "<em>Name</em> disabled."

### What disabling actually does

| | |
|---|---|
| The `enabled` flag | Set to `0` in the add-ons table. |
| `deactivate()` | Called once. Add-ons use it to unschedule cron events and similar cleanup. |
| `ambikly_addon_deactivated` | Fires with the add-on slug. |
| **Settings** | **Kept.** Every value you configured stays in the database, including secrets. |
| **Data** | **Kept.** Tables and rows the add-on created are left alone — wishlists, gift card balances, loyalty ledgers, subscriptions, tracking numbers. |
| Hooks and routes | Not registered on the next request. The add-on's storefront surfaces and REST routes disappear. |

Re-enabling later restores everything exactly as it was. `activate()` runs again on re-enable, but add-on activation routines are written to be idempotent — a table that already exists is not recreated.

<div class="ui-warn"><strong>Careful:</strong> Disabling is not uninstalling. Nothing on this screen removes an add-on's data. If an add-on has created tables you no longer want, you have to remove them yourself.</div>

## The license gate

Enabling is gated on a valid Ambikly Pro license. Without one, the request is refused with a `403` and this message:

> A valid Ambikly Pro license is required to enable add-ons. Activate your license under Ambikly Pro → License.

Booting is gated separately, and checked fresh on **every** request. That check is a cached option read, not a network call, so it costs nothing.

### The suppressed-add-ons notice

If the license stops being valid while add-ons are enabled, they stop booting — and you are told, rather than left to wonder why something quietly stopped working. An admin notice appears:

> **Ambikly Pro:** your license isn't active, so 6 enabled add-ons are currently paused (their settings are untouched and they resume instantly once the license is valid). [Manage license]

The notice:

- counts the exact number of add-ons that were skipped,
- only shows inside wp-admin,
- only shows to users who can manage the store (`ambikly_manage_store` or `manage_options`),
- only shows when add-ons really are being suppressed.

Nothing is switched off in the database. The `enabled` flag, the settings and the data are all untouched, and the next request after the license becomes valid again boots everything as before. See [Install & activate a license](/pro-install) for how to fix the license itself.

## Per-add-on settings

Add-ons do not add tabs to the Settings screen. Each one declares a settings schema, and the Add-ons screen renders a drawer from it.

Open the drawer from the add-on's card. If an add-on declares no schema you will see:

> This addon has no configurable settings.

### Field types

| Type | Rendered as | Handling on save |
|---|---|---|
| `bool` | Toggle | Cast to a boolean. |
| `int` | Number input | Cast to an integer, then clamped to the schema's `min` (default `0`) and `max` if declared. |
| `enum` | Select | Must be one of the declared options. An invalid choice is discarded and the previously stored value is kept. |
| `string` | Text input | Stored as-is. Many are free text — labels, coupon codes — so they are deliberately not generically sanitized. |
| `secret` / `password` | Password input | Masked on the way out, unmasked on the way in. See below. |
| `json` | Textarea | Pretty-printed when the drawer opens, validated and re-compacted on save. |

### Saving

Click **Save settings**. The drawer closes and a toast confirms.

Three behaviors are worth knowing:

- **Out-of-range numbers are clamped, and you are told.** If you type `-15` into a field whose minimum is `0`, the value is stored as `0` and the toast says so: `Settings saved — "New for N days" adjusted from -15 to 0`. It is never silently corrected behind a generic "saved".
- **Unknown keys are dropped.** Anything not declared in the schema is discarded rather than persisted into the stored settings forever.
- **Invalid JSON is caught before the request leaves the browser.** A `json` field that does not parse is highlighted with the parser's own error and the save is blocked: "Fix the highlighted field before saving."

### How settings are stored

All add-on settings live in one table, `{prefix}ambikly_addons`, one row per add-on:

| Column | Contents |
|---|---|
| `slug` | The add-on's kebab-case slug. The key everything else uses. |
| `version` | The add-on's declared version. Updated when the code's version changes. |
| `enabled` | `0` or `1`. |
| `settings` | A JSON object of the saved values. |
| `installed_at` / `updated_at` | Site-local timestamps. |

When an add-on reads its settings, the saved JSON is merged **over** the defaults declared in its schema, so a setting you have never touched returns its default rather than null. The merged result is cached for the rest of the request.

The first time Pro boots on a site, every discovered add-on gets a row inserted with `enabled = 0`. That is why the add-ons table fills up before you have enabled anything.

### How secrets are masked

Several add-ons take API credentials — OAuth client secrets, CRM API keys, signing secrets. These are never sent to the browser in plaintext.

| Direction | Behavior |
|---|---|
| Reading | Any field typed `secret` or `password` that has a value is replaced with `••••••••` before the settings leave the server. This applies to the add-on list, the single add-on route, and the response to a settings save. |
| A field with no value | Left as an empty string rather than masked, so the UI can tell "nothing configured" apart from "something is set". |
| Saving, untouched field | The form resubmits every field, so an untouched secret arrives as the mask string. The mask is stripped out and the real stored value is kept. |
| Saving, cleared field | An empty string is taken at face value — that is you deliberately removing the secret. |

So saving an unrelated checkbox will never overwrite your API key with a row of bullets.

## Permissions

The Add-ons screen lives inside the same admin app a Store Manager or Support Agent can reach, so its routes use the store capabilities rather than `manage_options` alone.

| Method | Route | Permission | Notes |
|---|---|---|---|
| GET | `/ambikly-pro/v1/addons` | `ambikly_view_store`, `ambikly_manage_store` or `manage_options` | Full list, plus a copy grouped by category. Secrets masked. |
| GET | `/ambikly-pro/v1/addons/{slug}` | Same as above | One add-on, with its settings and schema. Secrets masked. |
| POST | `/ambikly-pro/v1/addons/{slug}/enable` | `ambikly_manage_store` or `manage_options` | `403` without a valid license, `400` for a coming-soon add-on. |
| POST | `/ambikly-pro/v1/addons/{slug}/disable` | `ambikly_manage_store` or `manage_options` | `404` if the slug is unknown. |
| POST | `/ambikly-pro/v1/addons/{slug}/settings` | `ambikly_manage_store` or `manage_options` | Returns the merged settings with secrets masked, plus an `adjusted` object listing any clamped values. |

Note the split: viewing the catalog is enough for a Support Agent, but enabling, disabling and configuring require manage rights. The license screen itself stays `manage_options` only.

## Performance

Disabled add-ons are skipped at load time. Their classes are discovered so the catalog can list them, but their `boot()` is never called, so they register no hooks, no REST routes and no assets. There is no measurable cost to leaving 30 add-ons off.

Booting is also re-entry guarded: if something else on the site calls the add-on registry a second time in the same request, add-ons are not booted twice. That matters because a double boot would register each add-on's hooks twice and fire its side effects — a cart discount, an email, a webhook — twice per request.

If an individual add-on throws during boot, the error is logged and the remaining add-ons still boot. One broken add-on does not take the store down.

## Building your own add-on

Add-ons are classes extending the Pro add-on base class, with `boot()`, optional `activate()` and `deactivate()`, and an optional settings schema.

<div class="ui-warn"><strong>Careful:</strong> Dropping a folder into the Pro plugin's <code>addons/</code> directory loads the file but does <strong>not</strong> register your add-on. Only the built-in first-party list is instantiated automatically. A third-party add-on must register itself by pushing its instance onto the <code>ambikly_pro_addons</code> filter.</div>

The full authoring contract — slug, name, description, category, version, the settings schema format, and the lifecycle — is in the [Addon SDK](/developers/addon-sdk).

## Where to go next

- [All add-ons](/addons/) — the catalog, with a page for each of the 35.
- [Addon SDK](/developers/addon-sdk) — building your own.
- [Install & activate a license](/pro-install) — if add-ons are paused or will not enable.
