---
title: Tax
description: Enable taxes in Ambikly, configure rate rows, and understand exactly how country, state, postcode, priority and compound rates are matched and applied.
prev:
  text: Shipping
  link: /shipping
next:
  text: Coupons
  link: /coupons
---

# Tax

Ambikly calculates tax from a table of rate rows. Each row names a rate and the destination it applies to, and every row that matches the customer's address is applied, in priority order. This page covers the settings, every column of the rate table, the exact matching rules, and the things on this screen that do not do what their labels suggest.

Everything lives in <span class="screen-path">Ambikly → Settings → Tax &amp; Duties</span>.

## Enabling taxes

Taxes are **off** on a fresh install. Turn on **Enable Taxes** at the top of the tab and save. Until you do, the tax total on every cart is zero no matter how many rate rows exist.

The rest of the tax options only appear once the toggle is on.

## The tax settings

| Setting | What it does | Default |
|---|---|---|
| Enable Taxes | Master switch. With it off, tax is never calculated | Off |
| Prices Include Tax | Intended to mean product prices are tax-inclusive, with tax worked backwards out of them | Off |
| Calculate Tax Based On | Which address the rate lookup uses | Customer Billing Address |
| Default Tax Class | Intended fallback class for products with none set | Standard Rate |
| Display Tax in Cart | Intended to show or hide the tax line in the cart | On |
| Display Tax in Checkout | Intended to show or hide the tax line at checkout | On |

Only **Enable Taxes** and **Calculate Tax Based On** change anything.

::: warning Prices Include Tax has no effect
The setting saves, and an accessor exists to read it, but nothing in the free core calls that accessor. Tax is always calculated **on top of** your entered prices and added to the total. If you sell in a market where displayed prices must include tax, enter your prices tax-inclusive and leave tax disabled, or run the numbers yourself — turning this toggle on will not make Ambikly back the tax out of the price.
:::

::: warning Default Tax Class and the two display toggles have no readers
`Default Tax Class`, `Display Tax in Cart` and `Display Tax in Checkout` are saved but never read. The tax line is always shown where the storefront renders totals, and the rate lookup always uses the standard class — see [Tax classes](#tax-classes) below.
:::

## Calculate Tax Based On

The dropdown offers three choices. Two of them work:

| Option | Behavior |
|---|---|
| Customer Billing Address | Rates are matched against the billing address for every cart |
| Customer Shipping Address | Rates are matched against the shipping address — but only for a cart that actually requires shipping. A fully digital cart falls back to billing |
| Store Address | **No backend branch exists for this value.** Selecting it behaves the same as billing |

There is no store-address tax calculation in the free core. If you need origin-based tax, model it by creating rate rows for your own country and state and leaving the option on billing.

The practical rule: a digital-only cart is always taxed against the billing address, whatever this is set to.

## The tax rate table

Rate rows sit below the settings on the same tab. Click **Add rate** for a new row; edit an existing row in place. Text and number fields save when you leave the field, and the two checkboxes save immediately.

| Column | Type | Default on a new row | What it does |
|---|---|---|---|
| Name | Text | `Standard` | Label for the rate. Not shown to customers |
| Rate % | Number | `0` | The percentage. Three decimal places accepted. Cannot be negative |
| Country | Text | `*` | Two-letter country code, or `*` for any. Uppercased on save |
| State | Text | `*` | State or province code, or `*` for any |
| Postcode | Text | `*` | An exact postcode, or `*` for any |
| Class | Select | Standard | Standard, Reduced or Zero |
| Priority | Number | `1` | Sort order for applying rates. Cannot be negative |
| Compound | Checkbox | Off | When on, later rates are charged on the running total including this rate |
| Shipping | Checkbox | On | Stored, but not read by the tax engine — see below |

A `city` column exists in the data model and in the REST API, and it participates in matching, **but it has no column in the admin table.** You cannot set or see it from the Settings screen. Every row created through the admin gets `*` for city, which matches any address, so in practice city matching is inert unless you create rows through the API.

### The Shipping checkbox

The checkbox is stored on the row but the tax calculation never reads it. Whether shipping is taxed is decided entirely by the **shipping method's own tax status** — see [Shipping](/shipping). Ticking or clearing this box changes nothing.

### Tax classes

The Class dropdown offers Standard, Reduced and Zero, and products carry a tax class of their own. The checkout rate lookup, however, always queries the **standard** class. Rows saved as Reduced or Zero are stored correctly but never match at checkout, and a product's own tax class is copied onto its cart line without being used in the lookup.

Put every rate you want charged on the **Standard** class.

## How rates are matched

For a given destination address, Ambikly selects rate rows where **all five** of these hold:

<ol class="step-list">
  <li>The row's tax class is <code>standard</code>.</li>
  <li>The row's country equals the address country, or the row's country is <code>*</code>.</li>
  <li>The row's state equals the address state, or the row's state is <code>*</code>.</li>
  <li>The row's postcode equals the address postcode, or the row's postcode is <code>*</code>.</li>
  <li>The row's city equals the address city, or the row's city is <code>*</code>.</li>
</ol>

The result is sorted by **priority ascending**, then position, then ID. Every matching row is then applied in that order.

::: danger Postcode ranges and comma-separated lists do not work
The help text under the rate table says the postcode column "supports comma-separated values and ranges like `SW1A...SW1Z` (server-side matching)". **It does not.** The lookup is a plain equality comparison plus the `*` wildcard, and nothing else.

A postcode of `SW1A...SW1Z` matches only an address whose postcode is literally the string `SW1A...SW1Z`. A postcode of `10001,10002,10003` matches only an address whose postcode is that exact comma-separated string. Both will silently match nothing and charge no tax.

The only values that work in the Postcode column are **one exact postcode** or **`*`**. To cover several postcodes, create one row per postcode. To cover a whole country or state, use `*` and let country and state do the narrowing.
:::

The same equality-or-`*` rule applies to country, state and city. Country is compared uppercased; state, postcode and city are compared exactly as stored.

### Every match applies, not one per priority

This is the behavior most likely to surprise anyone coming from another platform. Priority sorts the matching rows; it does not pick one row per priority level. **All matching rows are applied, and their tax amounts are summed.**

If you have a row for `US / *` at 5% and a row for `US / CA` at 2.5%, a California address matches both and is charged 7.5% in total — two lines in the calculation, one combined tax total in the cart. That is often exactly what you want for state plus local tax. It is not what you want if you meant the more specific row to override the general one; in that case do not create the general row, or make it specific enough that the two cannot both match.

## How tax is applied

Tax is calculated once, on a single base amount, not per line.

<ol class="step-list">
  <li>The base starts as the cart subtotal minus every valid coupon discount.</li>
  <li>If the chosen shipping method is taxable, the shipping cost is added to that base.</li>
  <li>Each matching rate, in priority order, charges its percentage against a running amount that starts at the base.</li>
  <li>A rate with <strong>Compound</strong> off leaves the running amount alone.</li>
  <li>A rate with <strong>Compound</strong> on adds its own tax into the running amount, so every rate after it is charged on the larger figure.</li>
  <li>The tax amounts are summed and rounded to two decimals to give the order's tax total.</li>
</ol>

Tax is added to the total: `subtotal − discount + shipping + tax`.

### Worked example: priority and compound

A store with three rate rows, all on the standard class, matching one Canadian address in Quebec:

| Priority | Name | Country | State | Rate | Compound |
|---|---|---|---|---|---|
| 1 | GST | `CA` | `*` | 5.000% | No |
| 2 | QST | `CA` | `QC` | 9.975% | Yes |
| 3 | Levy | `CA` | `QC` | 1.000% | No |

Cart: subtotal $200.00, no discount, taxable shipping of $20.00.

```
Base = 200.00 + 20.00            = 220.00
Running = 220.00

GST   priority 1, not compound:
  220.00 × 5%                    =  11.00   tax so far 11.00
  running stays                    220.00

QST   priority 2, compound:
  220.00 × 9.975%                =  21.945  tax so far 32.945
  running becomes 220.00 + 21.945 = 241.945

Levy  priority 3, not compound:
  241.945 × 1%                   =   2.419  tax so far 35.364
  running stays                    241.945

Tax total (rounded)              =  35.36
Order total = 200.00 + 20.00 + 35.36 = 255.36
```

Note what compound did: because QST was marked compound, the Levy was charged on $241.945 rather than on $220.00. Had QST not been compound, the Levy would have been $2.20 and the tax total $35.14.

### Worked example: one flat rate

A store charging a single 20% rate everywhere needs exactly one row:

| Priority | Name | Country | State | Postcode | Rate | Compound |
|---|---|---|---|---|---|---|
| 1 | VAT | `*` | `*` | `*` | 20.000% | No |

Cart: subtotal $50.00, a $10.00 coupon discount, shipping $5.00 on a taxable method.

```
Base = (50.00 − 10.00) + 5.00 = 45.00
45.00 × 20%                   =  9.00
Order total = 45.00 + 9.00    = 54.00
```

If the shipping method's tax status were `none`, the base would be $40.00 and the tax $8.00.

## Setting up common cases

### Single-country store with one rate

One row: country `*` or your country code, state `*`, postcode `*`, your percentage, priority 1, compound off.

### State-level rates

One row per state, each with your country code and the state code. Do not also create a country-wide row unless you want it stacked on top of every state row.

### A specific city or postcode

Postcode matching needs an exact value, one row per postcode. Because the city column has no admin field, city-level rates have to be created through the REST API.

### Zero-rated products

The Zero tax class does not work at checkout. To exempt a product from tax, either leave your rate rows narrow enough that the product's destination does not match, or use a separate store configuration — there is no per-product exemption that the current tax engine honors.

## Tax REST endpoints

All of these require store-manage permission.

| Method | Route | Notes |
|---|---|---|
| GET | `/tax/rates` | Every rate, ordered by priority, position, ID |
| POST | `/tax/rates` | `name`, `rate`, `country`, `state`, `postcode`, `city`, `priority`, `compound`, `shipping`, `tax_class`, `position` |
| PUT | `/tax/rates/{id}` | Full update of the same fields |
| DELETE | `/tax/rates/{id}` | Remove a rate |

The API is the only way to set the `city` value, since the admin table has no column for it. A negative rate or a negative priority is rejected with `Tax rate cannot be negative.` or `Priority cannot be negative.`

## Checking your configuration

<ol class="step-list">
  <li>Confirm <strong>Enable Taxes</strong> is on and saved. <span class="screen-path">Ambikly → System Status</span> reports whether taxes are enabled.</li>
  <li>Add one item to a cart and enter a destination address you expect to be taxed.</li>
  <li>Compare the tax line against the rows you expect to match. A tax of zero with rows configured almost always means the address did not match — check for a postcode range, a comma list, or a non-standard tax class.</li>
  <li>Change the address to a country you have no row for and confirm the tax drops to zero.</li>
</ol>

::: tip Tax is calculated on the cart, not stored on it
Totals are computed on every request and never written to the cart row. Changing a rate takes effect on the next page load for every open cart, including carts a customer left days ago.
:::

## Next

[Coupons](/coupons) — discount codes, restrictions and usage limits.
