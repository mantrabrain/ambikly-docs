---
title: "Social Login"
description: "Single sign-on with Google and Facebook using the store’s own OAuth credentials. Continue-with buttons on the WordPress login form, the store login form and via shortcode."
prev:
  text: "Smart Search"
  link: /addons/smart-search
next:
  text: "Software Licensing Pro"
  link: /addons/license-pro
---

# Social Login <span class="pro-pill">PRO</span>

> Single sign-on with Google and Facebook using the store’s own OAuth credentials.

<p><strong>Category:</strong> Customer · <strong>Enable at:</strong> <span class="screen-path">Ambikly → Add-ons → Social Login</span></p>

## What it does

Continue-with buttons on the WordPress login form, the store login form and via shortcode. The callback validates a browser-bound CSRF state, confirms the provider is enabled, exchanges the code server-to-server and requires a verified email from Google. It never attaches to an existing account — that email is sent to password login with a notice.

## Capabilities

- Google OpenID Connect and Facebook flows
- CSRF state bound to a per-browser cookie
- Disabled providers rejected at callback, not just hidden
- Google logins require a verified email
- Never auto-attaches to a pre-existing account
- Return-to-page honored after sign-in
- Client secrets masked in every settings response

## Turn it on

<ol class="step-list">
  <li>Make sure <strong>Ambikly Pro</strong> is active and your license is activated under <span class="screen-path">Ambikly → Settings → License</span>.</li>
  <li>Go to <span class="screen-path">Ambikly → Add-ons</span>, find <strong>Social Login</strong> and switch it on. There is nothing else to install.</li>
  <li>Open its settings panel and set the options listed below.</li>
  <li>Visit your storefront to confirm the new surface appears: continue with google / facebook buttons.</li>
</ol>

## Settings

Open the add-on's settings panel from <span class="screen-path">Ambikly → Add-ons → Social Login</span>.

- **Enable Google**
- **Google client ID**
- **Google client secret**
- **Enable Facebook**
- **Facebook app ID**
- **Facebook app secret**

## Where it appears

**On the storefront**

- Continue with Google / Facebook buttons
- [ambikly_social_login_buttons] shortcode

## Third-party services

This add-on talks to:

- Google OAuth 2.0 / OpenID Connect
- Facebook Graph API

You supply your own credentials; they are stored on your server and masked in the admin. Nothing is proxied through Ambikly.

## For developers

**Core hooks it listens to**

- `login_form`
- `ambikly_login_form_after`
- `init`

The full list is in the [hooks reference](/developers/hooks).

## Questions

### What if I already have an account with that email?

Social sign-in never attaches to an existing account; you are sent to the normal login with a notice to use your password.

### Is Apple Sign In supported?

No — it needs a signed client-secret JWT and its own review, so it was left out rather than shipped as a toggle that does nothing.

## Works well with

[Wishlist](/addons/wishlist)

## Turning it off

Switch the add-on off from <span class="screen-path">Ambikly → Add-ons</span>. Its settings and data stay in the database, so turning it back on restores exactly what you had. A lapsed license pauses it the same way — the store keeps selling on the free core, and nothing is deleted.

<div class="pro-callout">
  <div class="pro-callout__head"><span class="pro-callout__badge">PRO</span><span class="pro-callout__title">Social Login is part of Ambikly Pro</span></div>
  <p class="pro-callout__desc">One license covers all 35 add-ons — $199 a year or $549 once for a single site. Nothing here is sold separately.</p>
  <a class="pro-callout__cta" href="https://ambikly.com/pricing/">See pricing →</a>
</div>
