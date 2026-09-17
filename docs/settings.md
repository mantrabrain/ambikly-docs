---
title: Settings reference
description: Every tab and every field on the Ambikly Settings screen, with its storage key, default and effect — including the areas that are present in the UI but not yet wired up.
prev:
  text: Themes & template overrides
  link: /themes
next:
  text: What Pro adds
  link: /pro
---

# Settings reference

This is the complete field-by-field reference for <span class="screen-path">Ambikly → Settings</span>. Every field is listed with the key it is stored under, its default, and what actually reads it.

Some parts of this screen are built but not yet connected to anything. Those are called out in a **Not yet wired up** subsection on each tab rather than left for you to discover. If a field is in that subsection, changing it will still show "Settings saved successfully" — the value is written to the database, but nothing reads it.

## How the screen works

The Settings screen is a single-page app with its own sidebar. Nine entries appear in that sidebar:

| Sidebar entry | Settings group | Editor |
|---|---|---|
| Store Settings | `store` | This screen |
| Payment Settings | `payments` | The Payments panel, with its own save button |
| Invoice & Packing | `invoice` | This screen |
| Tax & Duties | `tax` | This screen, plus the Tax rates table |
| Email Configuration | — | Pointer to <span class="screen-path">Ambikly → Emails</span> |
| Roles and Permissions | `roles` | This screen |
| Storage Settings | `storage` | This screen |
| Shipping | — | The Shipping zones panel (database tables, not options) |
| Features & Addon | `advanced` | This screen |

### One Save button, every group

There is a single **Save Changes** button fixed to the bottom of the screen. It does not save "the tab you are on" — it posts **every** settings group in one request, regardless of which tab is open:

`general`, `store`, `products`, `shipping`, `tax`, `account`, `advanced`, `invoice`, `roles`, `storage`

Two consequences worth knowing:

- A change you made on the Tax tab is saved even if you have since clicked over to Storage. You do not need to save once per tab.
- The **Payment** tab hides the Save Changes button entirely and shows a note in its place. Payment gateways save from each gateway's own **Save Gateway** button, because this screen's save does not know about gateway state at all.

### Where settings live

Each group is one WordPress option, named `ambikly_settings_` plus the group name:

```
ambikly_settings_general
ambikly_settings_store
ambikly_settings_products
ambikly_settings_payments
ambikly_settings_shipping
ambikly_settings_tax
ambikly_settings_account
ambikly_settings_advanced
ambikly_settings_invoice
ambikly_settings_roles
ambikly_settings_storage
ambikly_settings_pages
ambikly_settings_emails
```

Saving a group **replaces** the option rather than merging into it, so the group you post is the group that is stored.

Four groups have no editor on this screen at all. They are still loaded and re-saved by the Save button, so their values survive, but there is no field for them:

| Group | Status |
|---|---|
| `general` | Written once by the setup wizard. Currency, currency position, store country, weight unit, dimension unit. Read only as a fallback when the `store` group is empty. |
| `products` | Defined server-side (products per page, related/upsell/cross-sell counts, gallery and zoom flags) with no UI on this screen. |
| `account` | Defined server-side (registration, email verification, GDPR, data retention) with no UI on this screen. |
| `shipping` | Superseded by real shipping zones. The four legacy fields are not read by anything. |

`ambikly_settings_pages` holds the five store page slugs and is written by the activation seeder, not by this screen. `ambikly_settings_emails` holds sender defaults and is managed from <span class="screen-path">Ambikly → Emails</span>.

### REST routes

The screen talks to four routes. All four require the `manage_options` capability — a Store Manager or Support Agent cannot read or write settings.

| Method | Route | Permission | Notes |
|---|---|---|---|
| GET | `/ambikly/v1/settings` | `manage_options` | Returns all twelve groups, merged over their defaults. |
| POST | `/ambikly/v1/settings` | `manage_options` | Saves every group in the body. Validates all groups before writing any. |
| GET | `/ambikly/v1/settings/{group}` | `manage_options` | One group. |
| POST | `/ambikly/v1/settings/{group}` | `manage_options` | Saves one group. |

### Validation and sanitization

A few behaviors are worth knowing before you fill anything in.

- **Whole-request validation.** The bulk save validates every group up front. If one value is rejected, nothing is written and you get an error — you will never see "Settings saved successfully" for a request that only half applied.
- **Store Name.** Blanking a Store Name that was already set is rejected with "Store name is required." A Store Name that was already empty does not block saving, so an unrelated tab's change still goes through.
- **Email fields.** `storeEmail` and `fromEmail` are rejected with `"x" is not a valid email address.` rather than silently coerced to empty.
- **Postcodes stay text.** `storePostcode` and `companyPostcode` are sanitized as text, so a leading zero survives. `02139` stays `02139`.
- **Rich text fields.** `customCSS`, `customJS`, `accountDetails` and `emailFooter` are run through `wp_kses_post`. Everything else that is a string is run through `sanitize_text_field`.
- **Numbers are coerced.** Any other value that looks numeric is stored as an integer or float.
- **Secrets are masked.** Three fields are masked in every GET response and never overwritten with their own mask on save: `s3SecretKey`, `stripe.secretKey` and `paypal.clientSecret`. The mask keeps the last four characters and replaces the rest with bullets. If you save the form without touching a masked field, the real stored value is restored instead of being clobbered.

---

## Store Settings

<span class="screen-path">Ambikly → Settings → Store Settings</span> · group `store`

The largest tab, and the one with the most fields that genuinely matter.

### Store Information

| Setting | Key | Default | What it does |
|---|---|---|---|
| Store Name | `storeName` | *(empty)* | Your store's name. Appears on invoices and packing slips. Falls back to the setup wizard value, then the site title. Marked required. |
| Store Tagline | `storeTagline` | *(empty)* | Short slogan. |
| Store Description | `storeDescription` | *(empty)* | A paragraph about the store. |
| Store Logo | `storeLogo` | *(empty)* | A logo URL, typed into the text field. |
| Store Icon | `storeIcon` | *(empty)* | A favicon URL, typed into the text field. |

#### Not yet wired up

- The **Upload** buttons next to Store Logo and Store Icon do nothing. They have no click handler and do not open the media library. Paste a URL into the text field instead — the URL is what gets stored.
- **Store Tagline** and **Store Description** are stored but nothing reads them. They do not appear anywhere on the storefront, in emails, or on documents.

### Store Address

| Setting | Key | Default | What it does |
|---|---|---|---|
| Street Address | `storeAddress` | *(empty)* | First address line on invoices and packing slips. |
| Address Line 2 | `storeAddressLine2` | *(empty)* | Second address line on those documents. |
| City | `storeCity` | *(empty)* | Combined with state and postcode into the document address block. |
| State / Province | `storeState` | *(empty)* | Same. |
| Postal / ZIP Code | `storePostcode` | *(empty)* | Same. Stored as text, so leading zeros survive. |
| Country | `storeCountry` | `US` | The store's country. Used as the default country in the checkout address form and by tax and shipping resolution. |
| Currency | `currency` | `USD` | Store currency for prices, cart and orders. Used everywhere money is formatted. |
| Currency Position | `currencyPosition` | `left` | `left` renders `$99.00`, `right` renders `99.00$`. |

<div class="ui-tip"><strong>Tip:</strong> Currency, currency position and store country are read from this tab first, with the setup wizard's one-time values as a fallback. This tab is the only place they are editable after setup.</div>

### Contact Information

| Setting | Key | Default | What it does |
|---|---|---|---|
| Store Email | `storeEmail` | *(empty)* | Store contact address. Used on invoices and packing slips. Validated as an email address. |
| Store Phone | `storePhone` | *(empty)* | Contact phone number. |
| Fax Number | `storeFax` | *(empty)* | Fax number. |

#### Not yet wired up

**Store Phone** and **Fax Number** are stored but nothing reads them.

### Social Media

| Setting | Key | Default |
|---|---|---|
| Facebook URL | `facebookUrl` | *(empty)* |
| Twitter URL | `twitterUrl` | *(empty)* |
| Instagram URL | `instagramUrl` | *(empty)* |
| LinkedIn URL | `linkedinUrl` | *(empty)* |
| YouTube URL | `youtubeUrl` | *(empty)* |

#### Not yet wired up

All five social URLs are stored but nothing reads them. They do not render in the storefront or in emails. If you want social links in your footer, add them through your theme.

### Company Information

| Setting | Key | Default |
|---|---|---|
| Company Name | `companyName` | *(empty)* |
| Company Address | `companyAddress` | *(empty)* |
| City | `companyCity` | *(empty)* |
| State / Province | `companyState` | *(empty)* |
| Postal Code | `companyPostcode` | *(empty)* |
| Country | `companyCountry` | `US` |
| Tax ID / VAT Number | `companyTaxId` | *(empty)* |

#### Not yet wired up

The help text says these appear on invoices and packing slips. They do not — documents read the **Store Information** and **Store Address** fields above instead. Put your legal entity details in the Store Name and Store Address fields if you need them on documents, or use the Invoice Footer.

### Business Hours

| Setting | Key | Default |
|---|---|---|
| Business Hours | `businessHours` | *(empty)* |
| Timezone | `timezone` | `America/New_York` |

#### Not yet wired up

Neither field is read. Order timestamps follow WordPress's own timezone setting under <span class="screen-path">Settings → General</span>, not this one.

### Store Policies

| Setting | Key | Default |
|---|---|---|
| Terms & Conditions Page | `termsPage` | *(empty)* |
| Privacy Policy Page | `privacyPage` | *(empty)* |
| Refund Policy Page | `refundPolicyPage` | *(empty)* |
| Shipping Policy Page | `shippingPolicyPage` | *(empty)* |

#### Not yet wired up

These are the most misleading fields on the screen, so read this before you spend time on them.

- **The dropdowns do not list your pages.** Each one has a single hard-coded option — "Terms & Conditions", "Privacy Policy", "Refund Policy", "Shipping Policy" — next to "Select a page...". There is no page picker.
- **Nothing reads the saved value.** The help text says the links appear in the footer and at checkout. They do not appear anywhere.

Link your policy pages from your theme's footer menu instead.

### Checkout Options

| Setting | Key | Default | What it does |
|---|---|---|---|
| Enable Guest Checkout | `enableGuestCheckout` | On | **Works.** When off, checkout rejects an order from a logged-out visitor, and the checkout bootstrap reports guest checkout as unavailable. |
| Enable Account Creation | `enableAccountCreation` | On | Intended to allow account creation during checkout. |

#### Not yet wired up

**Enable Account Creation** is stored but nothing reads it.

### Product Features

| Setting | Key | Default | What it does |
|---|---|---|---|
| Enable Product Reviews | `enableReviews` | On | **Works.** When off, the Reviews section is removed from the product detail page and the review submission route rejects new reviews. |
| Enable Wishlist | `enableWishlist` | Off | Intended to enable a wishlist. |
| Enable Product Comparison | `enableCompare` | Off | Intended to enable product comparison. |
| Catalog Mode | `catalogMode` | Off | Intended to hide prices and disable purchasing. |
| Enable Coupons | `enableCoupons` | On | **Works.** When off, coupon validation refuses every code and the cart reports coupons as unavailable. |

#### Not yet wired up

- **Enable Wishlist** and **Enable Product Comparison** are stored but nothing reads them. Wishlist and compare are Pro add-ons with their own settings — see [Wishlist](/addons/wishlist) and [Product Compare](/addons/compare). Turning these toggles on does not enable anything.
- **Catalog Mode** is stored but nothing reads it. Prices are still shown and products can still be purchased. To run a catalog-only store today, remove the Cart and Checkout pages from your navigation.

### Inventory Management

| Setting | Key | Default | What it does |
|---|---|---|---|
| Enable Stock Management | `enableStockManagement` | On | Reveals the four fields below in the UI. |
| Low Stock Threshold | `lowStockThreshold` | `5` | **Works.** The store-wide fallback threshold for low-stock alert emails, used when a product has no threshold of its own. |
| Out of Stock Threshold | `outOfStockThreshold` | `0` | Intended to mark a product out of stock at or below this number. |
| Hold Stock (Minutes) | `holdStockMinutes` | `60` | Intended to release held stock on unpaid orders. |
| Enable Backorders | `enableBackorders` | Off | Intended to allow purchasing out-of-stock products. |

#### Not yet wired up

**Enable Stock Management**, **Out of Stock Threshold**, **Hold Stock (Minutes)** and **Enable Backorders** are stored but nothing reads them. Stock behavior is driven per product — see [Inventory & stock](/inventory). Only Low Stock Threshold has a reader.

---

## Payment Settings

<span class="screen-path">Ambikly → Settings → Payment Settings</span> · group `payments`

This tab is the Payments panel, and it is the **only** working payment gateway editor. It reads and writes `ambikly_settings_payments` through the payments REST routes, which is what the gateway classes read at checkout.

Every registered gateway appears as a card. Ambikly ships seven: `stripe`, `paypal`, `cod`, `bank_transfer`, `cheque`, `manual` and `net_terms`. A gateway added by a plugin through the `ambikly_payment_gateways` filter appears here too.

### Per-gateway fields

| Field | Stored as | What it does |
|---|---|---|
| Enabled toggle | `enabled` | Whether the gateway is offered at checkout. |
| Title shown at checkout | `title` | The customer-facing name. |
| Description | `description` | One line under the title at checkout. |
| Instructions | `instructions` | Shown on the thank-you page and in the order email. Use it for bank details or payment reference notes. |

### Credentials

Only two gateways take API credentials.

| Gateway | Fields | Stored under |
|---|---|---|
| Stripe | Publishable key, Secret key | `credentials.publishable_key`, `credentials.secret_key` |
| PayPal | Client ID, Client secret | `credentials.client_id`, `credentials.client_secret` |

Secret fields render as password inputs and are masked in API responses. Bank transfer, cash on delivery, cheque, manual and net terms take no credentials.

### Saving

Each gateway card has its own **Save Gateway** button inside its Configure panel. Changes take effect only after that button. The page-level Save Changes button is hidden on this tab precisely because it would report success without saving gateway state.

Defaults seeded on activation: **Cash on Delivery** enabled, **Direct Bank Transfer** present but disabled.

#### Not yet wired up

- **PayPal has no sandbox/live switch in the admin UI.** The gateway's `mode` setting defaults to `sandbox` and there is no field for it. Until the option is set directly in the database, PayPal runs against the sandbox. See [PayPal](/payments-paypal).
- **Stripe has no manual-capture field.** `capture_manual` exists in the gateway but has no UI, so capture is always automatic. See [Stripe](/payments-stripe).

---

## Invoice & Packing

<span class="screen-path">Ambikly → Settings → Invoice & Packing</span> · group `invoice`

Every field on this tab is read by the invoice and packing slip services. Nothing here is inert.

### Invoice Settings

| Setting | Key | Default | What it does |
|---|---|---|---|
| Enable Invoices | `enableInvoices` | On | When off, invoices are not generated. Hides the fields below in the UI. |
| Invoice Prefix | `invoicePrefix` | `INV-` | Prepended to the invoice number. `INV-1042`. |
| Starting Invoice Number | `invoiceNumber` | `1` | The number the sequence starts from. Floored at 1. |
| Invoice Footer | `invoiceFooter` | *(empty)* | Text at the bottom of every invoice. Payment terms, thank-you note, legal line. |

### Packing Slip Settings

| Setting | Key | Default | What it does |
|---|---|---|---|
| Enable Packing Slips | `enablePackingSlips` | On | When off, packing slips are not generated. Hides the fields below in the UI. |
| Packing Slip Prefix | `packingSlipPrefix` | `PS-` | Prepended to the packing slip number. |
| Packing Slip Footer | `packingSlipFooter` | *(empty)* | Text at the bottom of every packing slip. |

<div class="ui-tip"><strong>Tip:</strong> The invoice footer is one of the few rich-text fields on this screen — it is sanitized with <code>wp_kses_post</code>, so basic HTML survives.</div>

See [Invoices & packing slips](/invoices) for how documents are generated and who can view them.

---

## Tax & Duties

<span class="screen-path">Ambikly → Settings → Tax & Duties</span> · group `tax`, plus the tax rates table

### Tax Configuration

| Setting | Key | Default | What it does |
|---|---|---|---|
| Enable Taxes | `enableTaxes` | On | **Works.** The master switch. When off, no tax is calculated at checkout. Hides the fields below in the UI. |
| Prices Include Tax | `pricesIncludeTax` | Off | **Works.** When on, product prices are treated as tax-inclusive and tax is calculated backwards out of the price. |
| Calculate Tax Based On | `calculateTaxBasedOn` | `billing` | **Works for two of its three options.** `billing` uses the customer's billing address, `shipping` uses the shipping address. |
| Default Tax Class | `defaultTaxClass` | `standard` | Intended as the fallback class for products without one. Options: Standard, Reduced, Zero. |
| Display Tax in Cart | `displayTaxInCart` | On | Intended to show the tax line in the cart. |
| Display Tax in Checkout | `displayTaxInCheckout` | On | Intended to show the tax line at checkout. |

#### Not yet wired up

- **"Store Address" is a third option in the Calculate Tax Based On dropdown with no backend branch.** Tax is calculated by shipping or billing address only. Selecting Store Address saves the value but falls through to the normal address-based path.
- **Default Tax Class**, **Display Tax in Cart** and **Display Tax in Checkout** are stored but nothing reads them. The tax line renders based on whether tax was actually calculated.

### Tax rates

Below the configuration block sits the tax rates table. This is a real editor writing to the tax rates table in the database, not an option.

| Column | What it does |
|---|---|
| Name | Label for the rate, shown in totals. |
| Rate % | The percentage. Accepts three decimal places. |
| Country | Two-letter country code, or `*` for any. |
| State | State or province code, or `*` for any. |
| Postcode | Postcode, or `*` for any. |
| Class | Standard, Reduced or Zero. |
| Priority | Lower numbers are evaluated first. |
| Compound | Whether this rate stacks on top of other rates. |
| Shipping | Whether this rate also applies to the shipping cost. |

Rows save on blur — click out of a field and it is written. Checkboxes save immediately. A new row starts from `Standard`, `0`, `*`, `*`, `*`, standard class, priority 1, shipping on.

#### Not yet wired up

- **Postcode ranges and comma-separated lists do not work.** The help text under the table says postcodes support comma-separated values and ranges like `SW1A...SW1Z`. Rate matching is a plain equality check plus the `*` wildcard. Only an exact postcode or `*` will match. Create one row per postcode if you need postcode-level rates.
- **The `city` column exists in the data model but has no column in this table.** It defaults to `*` on new rows and is not editable from the admin.

See [Tax](/tax) for worked examples.

---

## Email Configuration

<span class="screen-path">Ambikly → Settings → Email Configuration</span>

This entry expands into two sub-items, **Notifications** and **Email Templates**. Both land on the same panel, which is a pointer rather than a form.

Email sender details and per-email enable toggles used to live here under a settings group nothing read — filling them in reported success with no effect on outgoing mail. That form is gone. The real configuration is at <span class="screen-path">Ambikly → Emails</span>, where the sender details sit alongside the message content they are used with.

<div class="ui-warn"><strong>Careful:</strong> Only four transactional emails are editable in the free core: order notification to the customer and to the admin, and order status change to the customer and to the admin. There are no shipping-notification, cancelled-order or refund-notification emails. Low-stock alerts and company buyer invitations are hard-coded and not editable.</div>

See [Emails](/emails).

---

## Roles and Permissions

<span class="screen-path">Ambikly → Settings → Roles and Permissions</span> · group `roles`

::: danger This entire tab is inert
Every field on this tab is stored and nothing reads any of them. The tab is built but not connected. Changing anything here has no effect on who can do what.
:::

| Setting | Key | Default | Intended behavior |
|---|---|---|---|
| Default Customer Role | `defaultCustomerRole` | `customer` | The role assigned to newly registered customers. Options: Customer, Subscriber, Wholesale Customer. |
| Enable Role-Based Pricing | `enableRoleBasedPricing` | Off | Different prices per user role. |
| Enable Role-Based Access | `enableRoleBasedAccess` | Off | Restrict products or categories by role. |

The group also defines `customerRole` (`customer`) and `allowCustomerRoleChange` (off) server-side, with no field on the screen at all.

### What actually controls permissions

Ambikly's real roles and capabilities are created at activation and are not configured from this tab:

- Two custom roles: **Store Manager** (`ambikly_store_manager`) and **Support Agent** (`ambikly_support_agent`).
- Two capabilities: `ambikly_manage_store` and `ambikly_view_store`.
- Settings, Payments, Webhooks, System Status, Import/Export, Email Templates and Setup remain `manage_options` only.

For role-based pricing, use the [Dynamic Pricing](/addons/dynamic-pricing) add-on, which has a working role-based rule type. See [Roles & permissions](/roles) for the real model.

---

## Storage Settings

<span class="screen-path">Ambikly → Settings → Storage Settings</span> · group `storage`

::: danger This entire tab is inert
Nothing reads `ambikly_settings_storage`. Uploads always go to the WordPress media library on local disk. S3 and CDN offloading are not implemented. Entering AWS credentials here configures nothing.
:::

| Setting | Key | Default | Intended behavior |
|---|---|---|---|
| Storage Type | `storageType` | `local` | Where uploaded files are stored. Options: Local Storage, Amazon S3, CDN. |
| S3 Bucket Name | `s3Bucket` | *(empty)* | Target bucket. Shown only when Storage Type is S3. |
| S3 Region | `s3Region` | *(empty)* | AWS region. |
| Access Key ID | `s3AccessKey` | *(empty)* | AWS access key. |
| Secret Access Key | `s3SecretKey` | *(empty)* | AWS secret. Masked in API responses. |
| Enable CDN | `enableCdn` | Off | Serve media through a CDN. Shown only when Storage Type is CDN. |
| CDN URL | `cdnUrl` | *(empty)* | CDN base URL. |
| Max Upload Size (MB) | `maxUploadSize` | `10` | Maximum upload size. |
| Allowed File Types | `allowedFileTypes` | `jpg,jpeg,png,gif,pdf,zip` | Comma-separated extension allow-list. |

<div class="ui-warn"><strong>Careful:</strong> Because nothing reads Max Upload Size or Allowed File Types either, they provide no protection. Real upload limits come from PHP and WordPress. If you need S3 offloading or a CDN today, use a dedicated offload plugin.</div>

The Secret Access Key is the one field here that behaves carefully: it is masked in every GET response, and saving the form without touching it restores the real stored value instead of writing the mask.

---

## Shipping

<span class="screen-path">Ambikly → Settings → Shipping</span>

This tab is the shipping zones panel. It is a real editor writing to the shipping zones and methods tables, not to an option. The four legacy fields that used to live here — Enable Shipping, Shipping Calculation Method, Default Shipping Zone, Free Shipping Threshold — were removed because nothing ever read them.

### Zones

A zone is a name plus a list of regions. Each region is a country code and an optional state; `*` means "any".

| Action | What happens |
|---|---|
| Add zone | Creates a zone covering `*` / `*`. Rename it and edit its regions. |
| Edit | Rename the zone and add or remove regions. Country codes are upper-cased; an empty state becomes `*`. |
| Delete | Removes the zone and all of its methods. Orders in progress are unaffected. |

Activation seeds one zone, **Rest of World**, covering every country.

### Methods

Each zone holds a list of shipping methods. Three types are available.

| Method | `method_id` | Default cost when added | Notes |
|---|---|---|---|
| Flat rate | `flat_rate` | `10` | A fixed cost for the zone. |
| Free shipping | `free_shipping` | `0` | Created with a `min_amount` of 0. |
| Local pickup | `local_pickup` | `10` | No extra settings. |

Editable columns are **Title**, **Cost** and **Enabled**, plus Remove. Changes save as you edit.

The seeded Rest of World zone ships with two methods: **Flat rate** at 10, and **Free shipping (over 100)** with a minimum amount of 100.

#### Not yet wired up

**Per-item cost has no admin field.** Flat rate methods are created with a `per_item` value of 0 and there is no column for it, so a flat rate is a flat rate. Only Title, Cost and Enabled can be edited.

Shipping classes on products are also cosmetic — the list is hard-coded and the shipping service never reads it. See [Shipping](/shipping).

---

## Features & Addon

<span class="screen-path">Ambikly → Settings → Features & Addon</span> · group `advanced`

::: danger All three toggles are inert
Nothing reads these values. The tab is present for future use.
:::

| Setting | Key | Default | Intended behavior |
|---|---|---|---|
| Enable Debug Mode | `enableDebugMode` | Off | Show detailed error and debug information. |
| Enable Logging | `enableLogging` | Off | Log system events and errors. |
| Enable Caching | `cacheEnabled` | On | Cache pages and data. |

An "Enable REST API" toggle used to sit here. It was removed rather than left in place: every controller registers its routes unconditionally, so switching it off did nothing while implying a security control that never existed. **You cannot disable the REST API from settings.**

The group also defines `debugMode`, `enableRestAPI`, `enableWebhooks`, `customCSS` and `customJS` server-side with no fields on the screen. There is no working Custom CSS or Custom JS field — add CSS through your theme, as described in [Themes & template overrides](/themes).

For real diagnostics, use [System status](/system-status) and [Troubleshooting](/troubleshooting).

---

## Settings that are managed elsewhere

Several things people look for on this screen are configured somewhere else entirely.

| What you want | Where it is |
|---|---|
| Email sender name and address, per-email toggles, message content | <span class="screen-path">Ambikly → Emails</span> — see [Emails](/emails) |
| Product categories, tags and brands | <span class="screen-path">Ambikly → Categories</span> — see [Categories, tags & brands](/categories) |
| Coupons | <span class="screen-path">Ambikly → Coupons</span> — see [Coupons](/coupons) |
| Webhooks | See [Webhooks](/developers/webhooks) |
| Import and export | See [Import & export (CSV)](/import-export) |
| The Pro license | <span class="screen-path">Ambikly → Settings → License</span> — see [Install & activate a license](/pro-install) |
| Store page assignment | The `ambikly_settings_pages` option, seeded at activation — see [Store pages](/store-pages) |
| Data removal on uninstall | The `ambikly_remove_data_on_uninstall` option. It defaults to false and has no admin UI. Deactivation leaves everything intact. |

<div class="pro-callout">
  <div class="pro-callout__head"><span class="pro-callout__badge">PRO</span><span class="pro-callout__title">Add-ons bring their own settings</span></div>
  <p class="pro-callout__desc">Pro add-ons do not add tabs to this screen. Each one has its own settings panel on the Add-ons screen, rendered from the schema the add-on declares.</p>
  <a class="pro-callout__cta" href="https://ambikly.com/pricing/">See pricing →</a>
</div>

## Where to go next

- [What Pro adds](/pro) — the free-versus-Pro boundary.
- [System status](/system-status) — what your server and database actually report.
- [Troubleshooting](/troubleshooting) — when a saved setting does not seem to apply.
