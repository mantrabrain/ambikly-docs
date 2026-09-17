import type { Theme } from 'vitepress'
import DefaultTheme from 'vitepress/theme'
import { nextTick } from 'vue'
import Layout from './Layout.vue'
import './style.css'
import './custom.css'

export default {
  extends: DefaultTheme,
  Layout,
  enhanceApp({ router }) {
    if (typeof window === 'undefined') return // SSR guard

    // Click-to-zoom on every screenshot. Re-attached after each route change
    // because VitePress swaps the DOM in place and drops old zoom instances.
    const setupZoom = async () => {
      const mediumZoom = (await import('medium-zoom')).default
      mediumZoom('.vp-doc :not(a) > img', {
        background: 'rgba(15, 15, 17, 0.92)',
        margin: 24,
      })
    }

    if (router) {
      const previous = router.onAfterRouteChanged
      router.onAfterRouteChanged = (to) => {
        previous?.(to)
        nextTick(setupZoom)
      }
    }
    nextTick(setupZoom)
  },
} satisfies Theme
