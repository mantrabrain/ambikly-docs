<script setup lang="ts">
import DefaultTheme from 'vitepress/theme'
import MarkdownPageActions from './components/MarkdownPageActions.vue'
</script>

<template>
  <DefaultTheme.Layout>
    <template #doc-before>
      <MarkdownPageActions />
    </template>
  </DefaultTheme.Layout>
</template>
