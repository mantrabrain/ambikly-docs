# Ambikly Documentation

Source for **https://docs.ambikly.com** — the documentation site for the
[Ambikly](https://ambikly.com) WordPress eCommerce plugin (free core + Ambikly Pro).

Built with [VitePress](https://vitepress.dev). Content is plain Markdown in `docs/`.

## Quick start

```bash
npm install
npm run dev        # http://localhost:5175
```

| Script | What it does |
| --- | --- |
| `npm run dev` | Local dev server with hot reload |
| `npm run build` | Regenerates add-on pages and llms.txt, then builds to `docs/.vitepress/dist` |
| `npm run preview` | Serves the production build locally |
| `npm run addons` | Regenerates the 35 add-on pages from `data/addons.json` |
| `npm run llms` | Regenerates `docs/public/llms.txt` and `llms-full.txt` |
| `npm run check-links` | Validates every internal link **and `#anchor`** across all pages |

## Structure

```
ambikly-docs/
├── data/addons.json           # add-on records exported from the plugin — source for 35 pages
├── scripts/
│   ├── generate-addons.mjs    # data/addons.json → docs/addons/*.md (+ index)
│   ├── generate-llms.mjs      # all pages → public/llms.txt + llms-full.txt
│   └── check-links.mjs        # internal link + anchor validator
├── docs/
│   ├── .vitepress/
│   │   ├── config.ts          # site config, nav, sidebar, SEO — single source of navigation
│   │   ├── addons.data.mjs    # add-on sidebar entries, read from data/addons.json
│   │   └── theme/             # brand tokens and documentation components
│   ├── public/                # favicons, og-image, robots.txt, llms.txt (generated)
│   ├── addons/                # GENERATED — do not edit by hand
│   ├── developers/            # developer reference
│   └── *.md                   # guide pages
└── netlify.toml / .github/workflows/deploy.yml
```

## Writing a page

Every page starts with front matter. `prev`/`next` are chained by hand to match the sidebar order.

```md
---
title: Short page title
description: One sentence, 120–170 characters. Used for SEO and site search.
prev:
  text: Previous page
  link: /previous-page
next:
  text: Next page
  link: /next-page
---

# Page title
```

### Components

These classes are styled in `docs/.vitepress/theme/custom.css` and used inline in Markdown:

```html
<span class="screen-path">Ambikly → Settings → Payments</span>
<span class="pro-pill">PRO</span>  <span class="free-pill">FREE</span>

<ol class="step-list">
  <li>First step.</li>
</ol>

<div class="ui-tip"><strong>Tip:</strong> …</div>
<div class="ui-warn"><strong>Careful:</strong> …</div>

<div class="pro-callout">
  <div class="pro-callout__head"><span class="pro-callout__badge">PRO</span><span class="pro-callout__title">Title</span></div>
  <p class="pro-callout__desc">What Pro adds here.</p>
  <a class="pro-callout__cta" href="https://ambikly.com/pricing/">See pricing →</a>
</div>
```

VitePress containers (`::: tip`, `::: warning`, `::: danger`) are also available.

### Rules

- **Verify against the plugin source.** Every field, setting, hook and route in these docs is checked
  against `wp-content/plugins/ambikly` and `ambikly-pro`. Do not document a feature that is not wired up;
  where a limitation exists, state it in place.
- **Internal links must resolve.** The build runs with `ignoreDeadLinks: false`, so a broken link fails
  CI. `npm run check-links` additionally catches a wrong `#anchor`.
- **No screenshots yet.** Do not reference image files that do not exist.
- American spelling: color, license, fulfillment, canceled, behavior.

## Add-on pages are generated

`docs/addons/*.md` is written by `scripts/generate-addons.mjs` from `data/addons.json`, which is exported
from the plugin's own add-on records. **Editing those files by hand is pointless — the next build
overwrites them.** To change an add-on page, change `data/addons.json` (or the generator) and re-run
`npm run addons`. Adding an entry to that file also adds it to the sidebar automatically.

## LLM readiness

`npm run build` emits two plain-text files alongside the site:

- `/llms.txt` — an index of every page with its description, in the llmstxt.org format
- `/llms-full.txt` — the entire documentation as one plain-text file

`public/robots.txt` allows the answer-engine crawlers by name. Point a model at `/llms-full.txt`
to give it the entire manual in one fetch.

## Deploying

This repository is **private**, so GitHub Pages is not the deploy target (Pages on a private repo
requires a paid plan). Deploy with **Netlify**, which builds private repos on the free tier:

1. In Netlify, *Add new site → Import an existing project* and pick this repository.
2. Netlify reads `netlify.toml`: build `npm run build`, publish `docs/.vitepress/dist`.
3. Under *Domain management*, add `docs.ambikly.com` and follow the DNS instructions.

`.github/workflows/deploy.yml` is kept but only runs the build as a CI check — it will not publish
unless the repository is made public and Pages is enabled.

Because the repo is private, the *Edit this page on GitHub* link and the *Copy page / View as
Markdown* buttons are disabled — both fetch from a public raw URL. Re-enable them in
`docs/.vitepress/config.ts` (`editLink`, `markdownSource`) if the repo is ever made public.

## License

GPL-3.0-or-later, matching the plugin.
