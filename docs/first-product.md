---
title: Your first product
description: Create one simple physical product and one digital product in Ambikly, covering only the fields that are actually required to publish each one.
prev:
  text: Store pages
  link: /store-pages
next:
  text: Your first order
  link: /first-order
---

# Your first product

This page walks through creating two products end to end: a simple physical product that ships, and a digital product that delivers a file. It covers only the fields you must fill in to publish. Every other field in the editor is documented in [Products](/products).

Both walkthroughs start the same way, because the choice between physical and digital is made before the editor opens — and it is not switchable afterwards.

## Before you start

| You need | Why |
|---|---|
| Setup finished | The wizard sets your currency; prices are meaningless without it |
| Store pages published | You need somewhere to see the product |
| `ambikly_manage_store` or Administrator | Creating products is a manage-store action |
| For the digital product: a file | Uploaded to the WordPress media library, or ready to upload |

## Physical vs digital: pick once

<div class="ui-warn"><strong>Careful:</strong> The physical/digital choice is made in the "Add New Product" dialog and cannot be changed in the editor afterwards. If you pick wrong, delete the draft and start again. Also note the dialog defaults to <strong>Digital product</strong> — if you are adding a physical item, you must actively select it.</div>

The difference is not cosmetic. It changes which editor you get:

| | Physical | Digital |
|---|---|---|
| Pricing | One **Selling price** field, plus an optional sale price | One or more **pricing plans**, each with its own price |
| Sub-types | Single product, or Product with variants | None |
| Shipping | Weight, dimensions, shipping class | Not applicable |
| Stock | Track stock levels, quantity, backorders | Not applicable |
| Delivery | You ship it | Files attached to the product and/or per plan |
| Recurring billing | Not available | Per plan |

## Create a simple physical product

### 1. Start the product

<ol class="step-list">
  <li>Go to <span class="screen-path">Ambikly → Products</span> and click <strong>Add New Product</strong>.</li>
  <li>A dialog opens titled <strong>What are you selling?</strong>.</li>
  <li>Fill in <strong>Product name</strong>. This is required and there is a 200-character limit. Use the real customer-facing name — "Blue Ceramic Mug", not "mug-v2".</li>
  <li>Under <strong>What kind of product is it?</strong>, click the <strong>Physical product</strong> card. It is described as "Something you ship to customers". Confirm it shows <strong>Selected</strong>.</li>
  <li>Click <strong>Continue →</strong>.</li>
</ol>

<div class="ui-tip"><strong>Tip:</strong> <strong>Continue →</strong> saves the product as a draft immediately and then opens the editor. The product row already exists at this point — if you close the tab now, you will find a draft waiting under <span class="screen-path">Ambikly → Products</span> with the status filter set to Draft.</div>

### 2. Fill in the three required fields

The editor opens with a main column of cards and a right-hand sidebar. Cards that must be completed before publishing carry a **Required** badge.

<ol class="step-list">
  <li><strong>Product name</strong> — already filled from the dialog. The <strong>Name</strong> field is the only field required for <em>any</em> save, draft included. The <strong>Web address (URL slug)</strong> below it is generated from the name; leave it alone unless you want a specific URL.</li>
  <li><strong>Pricing</strong> — enter a <strong>Selling price</strong>. Numbers only, e.g. <code>29.99</code>. Leave <strong>Sale price</strong> blank; it is only for showing a strikethrough discount, and it must be lower than the selling price.</li>
  <li><strong>Description</strong> — write the <strong>Full description</strong>. Anything non-empty passes validation, but this is the text on the product page, so write something real. The <strong>Short tagline</strong> below it is optional and appears on listing cards.</li>
</ol>

That is genuinely all three. Photos, inventory, shipping and SEO are all optional to publish.

### 3. Set the sidebar fields worth setting

None of these block publishing, but two of them change what customers see.

| Sidebar field | What to do now |
|---|---|
| **Status** | Two radio cards: **Live** ("Visible to customers") and **Draft** ("Hidden from customers"). Leave it on Draft until you have previewed it. |
| **Category** | Only appears once at least one category exists. Set it if you have one; see [Categories, tags & brands](/categories). |
| **Product code (SKU)** | Leave blank to auto-generate. Fill it if you have a real inventory code — the CSV importer matches on SKU. |
| **Visibility** | Leave **Where customers can find it** on "Everywhere (recommended)". **Featured product** pins it to featured sections. |

### 4. Add a photo and a weight

Optional, but a store with neither looks unfinished and ships wrong.

<ol class="step-list">
  <li>In the <strong>Photos</strong> card, click the upload area or the <strong>Add</strong> action and choose images from the media library. Up to 10; the first one is tagged <strong>Main</strong> and becomes the listing image.</li>
  <li>Open the <strong>Shipping</strong> section and enter a packed weight and Length × Width × Height. These feed weight-based shipping rates.</li>
</ol>

<div class="ui-warn"><strong>Careful:</strong> The Shipping fields are labeled <strong>Weight (lbs)</strong> and <strong>Dimensions (inches)</strong>, and those labels are hard-coded. They do not change when your store is set to kg and cm. Enter numbers in the units you chose during setup and ignore the labels — the values are stored as plain numbers and interpreted using your store setting.</div>

### 5. Track stock, if you want to

Open the **Inventory & stock** section and tick **Track stock levels**. Ambikly then counts down as orders arrive and flips the product to out of stock automatically.

| Field | What it does |
|---|---|
| Quantity in stock | Units available right now |
| Low stock alert | Triggers a low-stock notification below this number |
| Stock status | In stock / Out of stock / On backorder |
| When sold out | Block purchase / Allow, warn customer / Allow silently |

<div class="ui-tip"><strong>Tip:</strong> The quantity field shows a required asterisk, but publishing is never actually blocked on it. If you tick "Track stock levels" and leave the quantity empty, the product publishes with no stock and is unbuyable. Always enter a number.</div>

Full detail in [Inventory & stock](/inventory).

### 6. Publish

<ol class="step-list">
  <li>Set <strong>Status</strong> to <strong>Live</strong> in the sidebar.</li>
  <li>Click <strong>Publish</strong> in the page header, or <strong>Publish product</strong> in the sticky bar that appears at the bottom whenever there are unsaved changes.</li>
  <li>If validation fails you get a specific message naming the card — "Set a selling price before publishing — check the Pricing card." Fix it and publish again.</li>
</ol>

### 7. Check it on the storefront

Open your Shop page. The product should appear in the listing. Click it and confirm the URL looks like:

```
https://example.com/shop/?ambikly_product=blue-ceramic-mug
```

That query-string form is expected — see [Store pages](/store-pages).

<div class="ui-warn"><strong>Careful:</strong> The sticky save bar's <strong>Discard</strong> button asks "Discard all unsaved changes?" and then navigates away from the editor. It does not revert the form in place, so anything unsaved is gone.</div>

## Create a digital product

Digital products use a different pricing model. Instead of one price field, a digital product has **pricing plans** — one or more purchasable options, each with its own price, its own optional recurring billing, and either the product's shared files or its own.

A product that sells one thing at one price simply has one plan. That is normal, not a workaround.

### 1. Start the product

<ol class="step-list">
  <li>Go to <span class="screen-path">Ambikly → Products</span> and click <strong>Add New Product</strong>.</li>
  <li>Enter the <strong>Product name</strong>.</li>
  <li>Select the <strong>Digital product</strong> card — "A file or access key delivered by email". This is the default, but confirm it shows <strong>Selected</strong>.</li>
  <li>Click <strong>Continue →</strong>.</li>
</ol>

### 2. Name and describe it

<ol class="step-list">
  <li><strong>Product name</strong> — already filled. Required for every save.</li>
  <li><strong>Description</strong> — write the <strong>Full description</strong>. Required to publish. Say what the customer receives, since there is nothing to hold.</li>
</ol>

### 3. Attach the file

The **Downloadable files** card holds the files every plan shares by default.

<ol class="step-list">
  <li>Click <strong>Upload</strong> in the card header, or the upload area if the card is empty.</li>
  <li>The WordPress media library opens. Select one or more files and confirm. Any file type works.</li>
  <li>Each file gets a version number, prefilled as <code>1.0.0</code>. Edit it inline in the small <code>v</code> field if you version your releases.</li>
</ol>

Files come from the media library only — there is no field for pasting a plain URL.

<div class="ui-warn"><strong>Careful:</strong> A digital product with no files publishes without complaint, and customers can buy it. They will simply never receive a download. Ambikly creates a download grant only when the product has files attached, and it fails silently when it does not. Attach the file before you go live.</div>

### 4. Add at least one pricing plan

This card carries the **Required** badge. Without a plan priced above 0, the product will not publish.

<ol class="step-list">
  <li>Click <strong>Add first plan</strong> (or <strong>Add plan</strong> once you have one). A drawer opens.</li>
  <li><strong>Plan name</strong> — what the customer sees when choosing. For a single-plan product, "Standard" is fine.</li>
  <li><strong>Regular price</strong> — the price. This must be above 0 or publishing is blocked. Leave <strong>Sale price</strong> blank for now.</li>
  <li>Leave <strong>Recurring billing</strong> unchecked. Recurring plans need the Pro subscriptions add-on to actually bill.</li>
  <li>Under <strong>Downloadable files</strong>, leave the plan on <strong>Use shared files</strong> so it inherits the file you attached in step 3. Only click <strong>Override for this plan</strong> if this plan ships different files.</li>
  <li>Click <strong>Add plan</strong>.</li>
</ol>

The plan now appears in the list showing its name, price, and how many files it uses.

### 5. Publish

<ol class="step-list">
  <li>Set <strong>Status</strong> to <strong>Live</strong> in the sidebar.</li>
  <li>Click <strong>Publish</strong>.</li>
  <li>If it refuses, the message names the problem — "Add at least one pricing plan with a price before publishing — check the Pricing plans card."</li>
</ol>

## What publishing actually requires

The complete validation, for both product types:

| Product type | Required to save a draft | Additionally required to publish |
|---|---|---|
| Physical, single product | Name | Selling price above 0, Full description |
| Physical, with variants | Name | At least one option with values, at least one variant, Full description |
| Digital | Name | At least one pricing plan priced above 0, Full description |

Everything else — photos, SKU, category, stock, weight, dimensions, SEO fields, tagline, sale price — is optional in every case.

## What you will not find in the editor

Worth knowing now so you do not go hunting:

- **No download limit or expiry fields.** The product model stores `download_limit` and `download_expiry_days`, and the download system enforces both, but no input renders for them. Downloads are unlimited and never expire unless you set those columns another way. See [Digital downloads](/digital-downloads).
- **No tags or brand fields.** The sidebar has Status, Category, SKU and Visibility only. See [Categories, tags & brands](/categories).
- **No grouped or external product types.** The tab components exist in the codebase but nothing renders them. Those types can only be created by CSV import or through the REST API. See [Import & export (CSV)](/import-export).
- **Meta keywords go nowhere.** The SEO section accepts them and stores them, but nothing outputs them on the front end.

## Next steps

| To do this | Go to |
|---|---|
| See every field in the editor | [Products](/products) |
| Sell the same item in sizes or colors | [Variations](/variations) |
| Control download limits, expiry and delivery | [Digital downloads](/digital-downloads) |
| Organize the catalog | [Categories, tags & brands](/categories) |
| Manage stock properly | [Inventory & stock](/inventory) |
| Load a whole catalog at once | [Import & export (CSV)](/import-export) |

<div class="pro-callout">
  <div class="pro-callout__head"><span class="pro-callout__badge">PRO</span><span class="pro-callout__title">More ways to build a product</span></div>
  <p class="pro-callout__desc">Pro adds product bundles, advanced variation controls, product badges, size charts, and AI-written descriptions generated from the product name and attributes.</p>
  <a class="pro-callout__cta" href="https://ambikly.com/pricing/">See pricing →</a>
</div>

You have something to sell. [Your first order](/first-order) walks through buying it — without any real money changing hands.
