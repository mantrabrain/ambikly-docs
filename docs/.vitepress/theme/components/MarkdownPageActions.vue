<script setup lang="ts">
/**
 * "Copy page" / "View as Markdown" — lets a reader hand a whole page to an
 * LLM, or read the raw source, without scraping rendered HTML. The raw URL
 * comes from themeConfig.markdownSource.pattern.
 *
 * Opt a page out with `markdownActions: false` in its front matter.
 */
import { computed, ref } from 'vue'
import { useData } from 'vitepress'

const { page, theme, frontmatter } = useData()
const copied = ref(false)
const failed = ref(false)

const rawUrl = computed(() => {
  const pattern = (theme.value as any)?.markdownSource?.pattern
  if (!pattern || !page.value.relativePath) return ''
  return pattern.replace(/:path/g, page.value.relativePath)
})

const enabled = computed(() => frontmatter.value.markdownActions !== false && !!rawUrl.value)

async function copyPage() {
  failed.value = false
  try {
    const res = await fetch(rawUrl.value)
    if (!res.ok) throw new Error(String(res.status))
    await navigator.clipboard.writeText(await res.text())
    copied.value = true
    setTimeout(() => (copied.value = false), 2000)
  } catch {
    // Clipboard blocked, offline, or the raw file is not published yet:
    // open the source so the reader can still copy it by hand.
    failed.value = true
    window.open(rawUrl.value, '_blank', 'noopener')
  }
}
</script>

<template>
  <div v-if="enabled" class="vp-markdown-actions">
    <button type="button" class="vp-markdown-actions__btn" @click="copyPage">
      {{ copied ? 'Copied' : failed ? 'Opened source' : 'Copy page' }}
    </button>
    <a class="vp-markdown-actions__btn" :href="rawUrl" target="_blank" rel="noopener">
      View as Markdown
    </a>
  </div>
</template>

<style scoped>
.vp-markdown-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin: 0 0 1rem;
}
.vp-markdown-actions__btn {
  display: inline-flex;
  align-items: center;
  padding: 0.3rem 0.7rem;
  font-size: 0.78rem;
  font-weight: 600;
  color: var(--vp-c-text-2);
  background: var(--vp-c-bg-soft);
  border: 1px solid var(--vp-c-divider);
  border-radius: 999px;
  cursor: pointer;
  text-decoration: none !important;
  transition: color 0.15s ease, border-color 0.15s ease;
}
.vp-markdown-actions__btn:hover {
  color: var(--vp-c-brand-1);
  border-color: var(--vp-c-brand-1);
}
@media (max-width: 480px) {
  .vp-markdown-actions__btn {
    flex: 1 1 auto;
    justify-content: center;
  }
}
</style>
