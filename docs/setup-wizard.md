---
title: Setup wizard
description: Every step of the Ambikly setup wizard, the exact fields on each, what each one writes to the database, and how to configure the same things later from Settings.
prev:
  text: Installation
  link: /installation
next:
  text: Store pages
  link: /store-pages
---

# Setup wizard

The setup wizard runs once, right after you activate Ambikly. It has six steps and takes about two minutes. It sets your currency and units, turns on an offline payment method, creates a shipping rate, switches tax on or off, and publishes the five storefront pages.

Nothing in the wizard is permanent. Every value it writes is editable afterwards, and the last section of this page maps each step to the screen where you change it later.

## How the wizard opens

Activation sets a 60-second transient. On your next admin page load, `SetupWizard::maybeRedirect()` consumes it and sends you to `wp-admin/admin.php?page=ambikly-setup`.

The redirect is skipped in three cases:

- You bulk-activated plugins (`activate-multi` is present in the URL).
- The request is an AJAX request.
- Your user cannot `manage_options`. The wizard is Administrator-only, and so is every one of its REST routes.

If the redirect does not fire, an admin notice appears on every admin screen: *"Ambikly: Finish the setup wizard to start selling"*, with a **Skip** link on the right. Clicking the wizard link takes you to the same URL. Clicking **Skip** sets `ambikly_setup_complete` to 1 and the notice never returns — it does not configure anything, it just stops asking.

The wizard takes over the whole screen: the WordPress admin menu, admin bar and footer are hidden while you are on it. A **Not now** link in the footer drops you back at the WordPress dashboard without marking setup complete, so the notice will still be waiting.

## Step 1 — Store

Sets the basics that every price and weight in the store depends on.

| Field | Control | Default | Notes |
|---|---|---|---|
| Country | Dropdown | `US` | 18 countries only: US, CA, GB, AU, DE, FR, ES, IT, NL, IN, BR, NP, PK, BD, JP, SG, AE, ZA |
| Currency | Dropdown | `USD` | 9 currencies: USD, EUR, GBP, AUD, CAD, JPY, INR, NPR, BRL |
| Store name | Text | Your site title | Used in emails and on invoices |
| Weight unit | Dropdown | `kg` | kg, g, lbs, oz |
| Dimension unit | Dropdown | `cm` | cm, m, in |

**Writes to:** `ambikly_settings_general`, merging the keys `store_country`, `currency`, `store_name`, `weight_unit` and `dimension_unit` into whatever is already there.

::: warning The country and currency lists here are short
The wizard ships a compact 18-country, 9-currency list. If yours is not on it, pick the closest, finish the wizard, then set the real value under <span class="screen-path">Ambikly → Settings → Store Settings</span>, which carries a longer list — 36 countries and 11 currencies. The Store Settings tab saves to a different option group (`ambikly_settings_store`), and Ambikly reads that one first — so the Settings value always wins.
:::

<div class="ui-warn"><strong>Careful:</strong> The weight and dimension units you pick here are stored and used for shipping calculations, but the product editor's own labels are hard-coded to <strong>lbs</strong> and <strong>inches</strong> and ignore this setting. If you choose kg and cm, the editor will still say "Weight (lbs)". Enter your numbers in the units you selected here and treat the editor labels as cosmetic. See <a href="/products">Products</a>.</div>

## Step 2 — Payments

Turns on the offline payment methods. Four checkboxes, all unchecked unless the gateway is already enabled.

| Field | Gateway id | What it means |
|---|---|---|
| Cash on Delivery | `cod` | Customers pay in cash when their order arrives |
| Direct bank transfer | `bank_transfer` | You send wiring instructions on the order receipt |
| Check payments | `cheque` | Buyers mail you a check |
| Manual / staff orders | `manual` | You mark orders paid yourself, offline or by phone |

**Writes to:** `ambikly_settings_payments`. For each of the four ids it sets `enabled` to 1 or 0, creating an empty `title` / `description` pair for any gateway that does not have an entry yet. It never touches Stripe, PayPal or Net Terms.

Stripe and PayPal are not offered here — they need API keys, so the wizard tells you they are configured later from <span class="screen-path">Ambikly → Settings → Payment Settings</span>. Net Terms is not offered either; it is the B2B gateway and is configured per company.

Activation has already enabled Cash on Delivery by default, so a store that skips this step still has one working payment method.

<div class="ui-tip"><strong>Tip:</strong> Enable <strong>Manual / staff orders</strong> even if you do not plan to use it. It is the gateway that makes a full end-to-end test order possible without moving real money, and it is only ever offered to logged-in users who can manage the store — never to a public customer. See <a href="/first-order">Your first order</a>.</div>

## Step 3 — Shipping

Creates a starter shipping zone and two methods inside it.

| Field | Control | Default | Notes |
|---|---|---|---|
| I sell physical products | Checkbox | Checked | Unchecking it skips the whole step |
| Flat rate | Number, 2 decimals | `10` | The cost of the flat-rate method |
| Free shipping over | Number, 2 decimals | `100` | Leave blank or 0 to skip creating the free-shipping method |

**Writes to:** the `ambikly_shipping_zones` and `ambikly_shipping_methods` tables — not an option.

What actually happens:

- If no zone exists, one named **Rest of World** is created, matching country `*` and state `*`, at position 100.
- If that zone has **no methods at all**, a `flat_rate` method titled "Flat rate" is inserted at your cost, taxable, with `per_item` set to 0. If "Free shipping over" is non-empty, a `free_shipping` method titled "Free shipping (over N)" is inserted too, with `min_amount` set to your value and tax status `none`.
- If the zone already has methods, nothing is inserted. The wizard tells you this on screen: *"You already have shipping methods configured — this step will only add the defaults if you don't."*

Unchecking **I sell physical products** returns `{ "skipped": true }` and writes nothing. That is the right choice for a digital-only store.

Because activation already seeded the same Rest of World zone with a $10 flat rate and free shipping over $100, a fresh install usually hits the "already has methods" branch — your numbers here are ignored in that case. Set the real rates under <span class="screen-path">Ambikly → Settings → Shipping</span>.

<div class="ui-warn"><strong>Careful:</strong> The <code>per_item</code> cost written here is always 0 and there is no admin field for it anywhere. Only Title, Cost and Enabled are editable on a shipping method. See <a href="/shipping">Shipping</a>.</div>

## Step 4 — Tax

Switches tax calculation on or off and optionally creates one catch-all rate.

| Field | Control | Default | Notes |
|---|---|---|---|
| Calculate taxes on orders | Checkbox | Off | Unchecked means no tax is calculated anywhere |
| Standard rate (%) | Number, 3 decimals | `0` | Only written if taxes are enabled and the value is above 0 |
| Calculate based on | Dropdown | `shipping` | "Shipping address (physical goods)" or "Billing address" |

**Writes to:** `ambikly_settings_tax` — the keys `enable_taxes` (1 or 0) and `calc_based_on` (validated against `shipping` and `billing`; anything else falls back to `shipping`).

If taxes are enabled **and** the standard rate is greater than 0, the wizard also writes a row into `ambikly_tax_rates`:

| Column | Value |
|---|---|
| `name` | `Standard` |
| `rate` | Your percentage |
| `country`, `state`, `postcode`, `city` | `*` — matches everywhere |
| `priority` | 1 |
| `compound` | 0 |
| `shipping` | 1 — shipping is taxed |
| `tax_class` | `standard` |

Re-running the step updates that same row rather than creating a second one: it looks for an existing `standard` rate with country `*` first.

::: warning Only two calculation bases work
The wizard offers shipping and billing, and those are the only two the tax engine implements. A "Store Address" option appears on the Settings screen but has no backend branch behind it — choosing it does not change how tax is calculated. See [Tax](/tax).
:::

## Step 5 — Pages

Creates the five storefront pages. One checkbox per page, all checked by default.

| Field | Page title | Shortcode |
|---|---|---|
| Shop | Shop | `[ambikly_shop]` |
| Cart | Cart | `[ambikly_cart]` |
| Checkout | Checkout | `[ambikly_checkout]` |
| My Account | My Account | `[ambikly_account]` |
| Order Received | Order Received | `[ambikly_thank_you]` |

Under each checkbox the wizard tells you what it will do: *"Already created — will be reused"* or *"Will be created now"*.

**Writes to:** the `ambikly_settings_pages` option, mapping each key (`shop`, `cart`, `checkout`, `account`, `thank_you`) to the **slug** of the page. It also sets `ambikly_setup_complete` to 1 — this is the step that marks setup finished, so if you leave before it, the wizard notice comes back.

The creation logic is deliberately cautious, because `/shop`, `/cart`, `/checkout` and `/account` are slugs that other eCommerce plugins claim too:

1. If this step already recorded a page for this key, and that page still exists, is not trashed, and still contains the matching shortcode, it is left alone.
2. Otherwise, if a page exists at the bare slug **and** contains the matching shortcode, that page is adopted.
3. Otherwise a new page is published, with no explicit slug — WordPress assigns a free one, typically `shop-2`.

A page that merely sits at `/shop` is never adopted. Ambikly will not point your storefront at someone else's content. [Store pages](/store-pages) covers what to do when you end up with a `shop-2`.

## Step 6 — Done

No fields. Rendering this step sets `ambikly_setup_complete` to 1 and offers two buttons: **Go to dashboard** and **Add a product**.

## What the wizard does not do

The wizard is deliberately short. It does not:

- Configure Stripe or PayPal — see [Stripe](/payments-stripe) and [PayPal](/payments-paypal).
- Set your store address, email, phone, logo or policy pages.
- Create categories or products.
- Set up emails beyond the defaults activation seeded.
- Configure invoices, roles or webhooks.

## The wizard cannot be relaunched from the admin

There is **no link, button or menu item anywhere in the Ambikly admin that reopens the setup wizard**. The wizard page registers itself as an orphan submenu with an empty parent slug, so it never appears in the sidebar, and the React admin does not link to it either. Once `ambikly_setup_complete` is set, the admin notice that used to link to it is gone too.

::: tip Change the settings directly instead
Everything the wizard writes has a permanent home in the admin. Go there rather than trying to re-run onboarding — the Settings screens offer a longer country list, all seven gateways, per-zone shipping and per-region tax rates, none of which the wizard had.
:::

| Wizard step | Where to change it afterwards |
|---|---|
| Store — country, currency, store name | <span class="screen-path">Ambikly → Settings → Store Settings</span> |
| Store — weight and dimension units | <span class="screen-path">Ambikly → Settings → Store Settings</span> |
| Payments — the four offline methods | <span class="screen-path">Ambikly → Settings → Payment Settings</span> · [Offline payment methods](/payments-offline) |
| Shipping — zone, flat rate, free shipping | <span class="screen-path">Ambikly → Settings → Shipping</span> · [Shipping](/shipping) |
| Tax — on/off, basis, standard rate | <span class="screen-path">Ambikly → Settings → Tax & Duties</span> · [Tax](/tax) |
| Pages — which page is which | No admin screen. See [Store pages](/store-pages) |

The one thing with no Settings equivalent is the page mapping. `ambikly_settings_pages` is written only by activation and by the wizard's Pages step; nothing in the admin reads or edits it. [Store pages](/store-pages) explains how to change it.

### Reaching the wizard screen directly

The screen itself still exists. An Administrator can open it at:

```
/wp-admin/admin.php?page=ambikly-setup
```

Every step is idempotent, so re-walking it is safe — but be aware of what re-running actually does:

- **Store** overwrites five keys in `ambikly_settings_general`. Because the Settings screen saves to `ambikly_settings_store` and that group is read first, your real currency and country are unaffected.
- **Payments** flips `enabled` on the four offline gateways to match the checkboxes as shown. Anything you unchecked gets disabled.
- **Shipping** adds nothing if the first zone already has methods.
- **Tax** overwrites `enable_taxes` and `calc_based_on`, and updates the catch-all standard rate if you enter one.
- **Pages** is the risky one. It re-checks each page and republishes any it cannot match, which is how duplicate `shop-2` and `shop-3` pages appear. Uncheck every page you already have before submitting that step.

<div class="ui-warn"><strong>Careful:</strong> This URL is not a supported feature — it is simply a screen that was never removed. On a live store, change settings from the Settings screens instead.</div>

## Next

The wizard has published your storefront. [Store pages](/store-pages) explains what each of those five pages does, how Ambikly finds them, and how to move or rename one.
