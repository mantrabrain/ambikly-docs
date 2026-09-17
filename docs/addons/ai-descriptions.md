---
title: "AI Product Descriptions"
description: "Generates a draft tagline and long description from a product name and a few feature bullets. One admin action builds a prompt from the product name, optional bullets and a…"
prev:
  text: "Affiliate System"
  link: /addons/affiliate
next:
  text: "AJAX Filters"
  link: /addons/ajax-filters
---

# AI Product Descriptions <span class="pro-pill">PRO</span>

> Generates a draft tagline and long description from a product name and a few feature bullets.

<p><strong>Category:</strong> AI · <strong>Enable at:</strong> <span class="screen-path">Ambikly → Add-ons → AI Product Descriptions</span></p>

## What it does

One admin action builds a prompt from the product name, optional bullets and a tone, then calls the Anthropic or OpenAI API with your own key. The result comes back as a short tagline and a long description for you to review — nothing is published automatically.

## Capabilities

- Two providers: Anthropic (default model claude-sonnet-5) and OpenAI (default gpt-4o-mini)
- Leave the model blank to use the provider default — switching providers just works
- API key stored as a secret and masked in every settings response
- Per-user rate limit of 20 generations per 10 minutes
- Configurable default tone and long-description word cap
- Provider errors surfaced with the provider’s own message

## Turn it on

<ol class="step-list">
  <li>Make sure <strong>Ambikly Pro</strong> is active and your license is activated under <span class="screen-path">Ambikly → Settings → License</span>.</li>
  <li>Go to <span class="screen-path">Ambikly → Add-ons</span>, find <strong>AI Product Descriptions</strong> and switch it on. There is nothing else to install.</li>
  <li>Open its settings panel and set the options listed below.</li>
</ol>

## Settings

Open the add-on's settings panel from <span class="screen-path">Ambikly → Add-ons → AI Product Descriptions</span>.

- **Provider (Anthropic / OpenAI)**
- **API key**
- **Model**
- **Default tone**
- **Long description max words**

## Where it appears

**In the admin**

- “Generate with AI” action in the product editor

## Third-party services

This add-on talks to:

- Anthropic Messages API
- OpenAI Chat Completions API

You supply your own credentials; they are stored on your server and masked in the admin. Nothing is proxied through Ambikly.

## For developers

**REST routes**

- `POST /ambikly-pro/v1/ai/describe`

Every route enforces the same capability checks as the rest of the API — see the [REST API guide](/developers/rest-api).

**Core hooks it listens to**

- `rest_api_init`

The full list is in the [hooks reference](/developers/hooks).

## Questions

### Whose API key is used?

Yours. The key is entered in add-on settings as a secret field and is masked whenever settings are read back.

### Does it publish copy automatically?

No. It returns a tagline and a long description as a draft for you to review and accept.

### Is there a spend guard?

Yes — each store manager is limited to 20 requests per 10 minutes; beyond that the request is refused without calling the provider.

## Works well with

[Frequently Bought Together](/addons/ai-recommendations)

## Turning it off

Switch the add-on off from <span class="screen-path">Ambikly → Add-ons</span>. Its settings and data stay in the database, so turning it back on restores exactly what you had. A lapsed license pauses it the same way — the store keeps selling on the free core, and nothing is deleted.

<div class="pro-callout">
  <div class="pro-callout__head"><span class="pro-callout__badge">PRO</span><span class="pro-callout__title">AI Product Descriptions is part of Ambikly Pro</span></div>
  <p class="pro-callout__desc">One license covers all 35 add-ons — $199 a year or $549 once for a single site. Nothing here is sold separately.</p>
  <a class="pro-callout__cta" href="https://ambikly.com/pricing/">See pricing →</a>
</div>
