#!/usr/bin/env node
/**
 * Validates every internal link and #anchor across docs/.
 *
 * VitePress already fails the build on a link to a missing page
 * (ignoreDeadLinks: false), but it does not verify that an anchor exists
 * on the target page. A wrong #anchor silently lands the reader at the top
 * of a long reference page, which is the failure mode this catches.
 *
 * Usage: npm run check-links
 */
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve, join, relative } from 'node:path'

const here = dirname(fileURLToPath(import.meta.url))
const docsDir = resolve(here, '../docs')

/** Every .md file under docs/, excluding .vitepress. */
function walk(dir, out = []) {
  for (const entry of readdirSync(dir)) {
    if (entry === '.vitepress' || entry === 'public' || entry.startsWith('.')) continue
    const full = join(dir, entry)
    if (statSync(full).isDirectory()) walk(full, out)
    else if (entry.endsWith('.md')) out.push(full)
  }
  return out
}

/** VitePress/GitHub slugger: lowercase, strip punctuation, spaces to dashes. */
function slugify(text) {
  return text
    .trim()
    .toLowerCase()
    .replace(/<[^>]*>/g, '')
    .replace(/[^\p{L}\p{N}\s-]/gu, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

const files = walk(docsDir)

// Map route -> Set of anchors defined on that page.
const anchors = new Map()
const routes = new Set()

for (const file of files) {
  const rel = relative(docsDir, file).replace(/\\/g, '/')
  const route = '/' + rel.replace(/\.md$/, '').replace(/(^|\/)index$/, '$1')
  routes.add(route.replace(/\/$/, '') || '/')
  routes.add(route)

  const body = readFileSync(file, 'utf8')
  const set = new Set()
  const seen = new Map()
  for (const m of body.matchAll(/^#{1,6}\s+(.+?)\s*$/gm)) {
    let slug = slugify(m[1])
    if (!slug) continue
    // Duplicate headings get -1, -2 … exactly as the slugger does.
    const n = seen.get(slug) ?? 0
    seen.set(slug, n + 1)
    if (n > 0) slug = `${slug}-${n}`
    set.add(slug)
  }
  // Explicit anchors: <a id="x"> or {#x}
  for (const m of body.matchAll(/<a\s+id="([^"]+)"|\{#([^}]+)\}/g)) set.add(m[1] || m[2])
  anchors.set(route, set)
  anchors.set(route.replace(/\/$/, '') || '/', set)
}

const problems = []

for (const file of files) {
  const rel = relative(docsDir, file).replace(/\\/g, '/')
  const body = readFileSync(file, 'utf8')
  // Strip fenced code so example links are not checked.
  const clean = body.replace(/```[\s\S]*?```/g, '')

  for (const m of clean.matchAll(/\[[^\]]*\]\((\/[^)\s]*)\)/g)) {
    const target = m[1]
    const [path, hash] = target.split('#')
    const route = (path || '').replace(/\/$/, '') || '/'

    if (path && !routes.has(route) && !routes.has(path)) {
      problems.push(`${rel}: link to missing page → ${target}`)
      continue
    }
    if (hash) {
      const set = anchors.get(route) || anchors.get(path)
      if (set && !set.has(hash)) {
        problems.push(`${rel}: missing anchor → ${target}`)
      }
    }
  }
}

if (problems.length) {
  console.error(`check-links: ${problems.length} problem(s)\n`)
  problems.forEach((p) => console.error('  ' + p))
  process.exit(1)
}
console.log(`check-links: ${files.length} pages, all internal links and anchors resolve.`)
