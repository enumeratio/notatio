<script setup lang="ts">
// Wraps VitePress's DefaultTheme.Layout to mount the review sidebar on every docs
// page when review mode is on (see theme/components/ReviewPanel.vue
// and review/mode.ts). Gating on a reactive flag rather than a build-time constant
// like the old `import.meta.env.DEV` still keeps ReviewPanel's chunk (and everything
// it pulls in -- store.ts, the backlog sources) out of what a normal prod visitor's
// browser fetches: `v-if="reviewModeOn"` starts `false` for every page load (see
// mode.ts), so `defineAsyncComponent`'s loader is never invoked unless the flag flips
// true, which only happens from `?review`. Rollup still
// emits the chunk into `dist/` -- that's fine, it's just never requested by default.
import DefaultTheme from "vitepress/theme";
import { useRouter } from "vitepress";
import { defineAsyncComponent, onMounted } from "vue";
import { installFragment } from "./fragment.ts";
import { initReviewMode, reviewModeOn } from "./review/mode.ts";
import SiteFooter from "./components/SiteFooter.vue";

const { Layout: Base } = DefaultTheme;

const ReviewPanel = defineAsyncComponent(() => import("./components/ReviewPanel.vue"));

// Runs after hydration, not before -- so the SSR/prerendered markup (which always
// sees `reviewModeOn === false`, since `initReviewMode` reads `location`) never
// mismatches the client's first render.
const router = useRouter();
onMounted(() => {
  initReviewMode();
  installFragment(router);
});
</script>

<template>
  <Base>
    <template #layout-top>
      <component :is="ReviewPanel" v-if="reviewModeOn" />
    </template>
    <template #doc-after><SiteFooter /></template>
  </Base>
</template>

<style>
/* The element the URL's fragment names (fragment.ts): outlined for as long as it's named. */
.fragment-target {
  outline: 1.5px solid var(--rubric);
  outline-offset: 4px;
  border-radius: var(--radius-2);
  transition: outline-color 0.2s;
}
</style>
