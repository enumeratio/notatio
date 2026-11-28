<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, reactive } from "vue";
import { data as families } from "../../data/plots.data.ts";
import type { GalleryCard } from "../../data/plots.data.ts";
import { renderInline } from "../../prose.ts";
import { type LazyCard, lazyMount, releaseCanvases } from "../composables/lazy-mount.ts";

// Every drawing example the records hold, as a grid of plots. The frame, the captions and the
// links are the build's; a card draws its plot when it comes near the view and gives it up when it
// leaves (composables/lazy-mount.ts), so a page of hundreds holds only the screen's worth of live
// elements. The plot is the head's own element (data/plot-markup.ts), the one its reference page
// draws, never a second renderer.

const keyOf = (card: GalleryCard): string => `${card.head}/${card.id}`;
const total = families.reduce((n, family) => n + family.cards.length, 0);

/** The markup of each card that is drawn now. */
const drawn = reactive<Record<string, string>>({});
const stages = new Map<string, HTMLElement>();
const setStage = (key: string, element: unknown): void => {
  if (element instanceof HTMLElement) stages.set(key, element);
  else stages.delete(key);
};

// A card's markup is lowered once; coming back into view reuses it.
const lowered = new Map<string, Promise<string | undefined>>();
const lowerOnce = (card: GalleryCard): Promise<string | undefined> => {
  const key = keyOf(card);
  let pending = lowered.get(key);
  if (pending === undefined) {
    pending = import("../../data/plot-markup.ts").then(({ plotMarkupOfJson }) =>
      plotMarkupOfJson(card.expr).catch(() => undefined),
    );
    lowered.set(key, pending);
  }
  return pending;
};

let stop: (() => void) | undefined;
onMounted(() => {
  const cards: LazyCard[] = [];
  const wanted = new Set<string>();
  for (const family of families) {
    for (const card of family.cards) {
      const key = keyOf(card);
      const stage = stages.get(key);
      if (stage === undefined) continue;
      cards.push({
        element: stage,
        mount: () => {
          wanted.add(key);
          void lowerOnce(card).then((markup) => {
            // A card that left the view while it was lowering draws nothing.
            if (markup !== undefined && wanted.has(key)) drawn[key] = markup;
          });
        },
        release: () => {
          wanted.delete(key);
          // Before Vue removes the element: its canvases give up their contexts.
          releaseCanvases(stage);
          delete drawn[key];
        },
      });
    }
  }
  stop = lazyMount(cards);
  // A link to a family lands on it once the frame is in place.
  void nextTick(() => {
    if (location.hash) document.getElementById(decodeURIComponent(location.hash.slice(1)))?.scrollIntoView();
  });
});
onBeforeUnmount(() => stop?.());
</script>

<template>
  <div class="plot-gallery">
    <p class="plot-gallery-lede">
      {{ total }} plots, each an example from the <a href="/reference/">reference</a>, drawn by the element its page
      uses. Select a caption to go to the example.
    </p>
    <nav class="plot-gallery-families" aria-label="Families">
      <a v-for="family in families" :key="family.id" :href="`#${family.id}`">
        {{ family.title }} <span>{{ family.cards.length }}</span>
      </a>
    </nav>
    <section v-for="family in families" :id="family.id" :key="family.id" class="plot-family">
      <h2>{{ family.title }}</h2>
      <div class="plot-grid">
        <article v-for="card in family.cards" :key="keyOf(card)" class="plot-card" :data-card="keyOf(card)">
          <div
            :ref="(el) => setStage(keyOf(card), el)"
            class="plot-card-stage"
            :class="{ 'is-drawn': keyOf(card) in drawn }"
          >
            <!-- eslint-disable-next-line vue/no-v-html -- the element's own markup, lowered from a record -->
            <div v-if="keyOf(card) in drawn" class="plot-card-plot" v-html="drawn[keyOf(card)]"></div>
          </div>
          <a class="plot-card-link" :href="card.href">
            <code>{{ card.head }}</code>
            <!-- eslint-disable-next-line vue/no-v-html -- prose is trusted local data -->
            <span v-if="card.caption" class="plot-card-caption" v-html="renderInline(card.caption)"></span>
            <span v-else class="plot-card-caption">{{ card.id }}</span>
          </a>
        </article>
      </div>
    </section>
  </div>
</template>

<style scoped>
.plot-gallery-lede {
  color: var(--ink-2);
}
.plot-gallery-families {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem 1.25rem;
  margin: 1rem 0 2rem;
  font-family: var(--font-ui);
  font-size: var(--text-sm);
}
.plot-gallery-families span {
  color: var(--ink-3);
}
.plot-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(15rem, 1fr));
  gap: 1rem;
}
.plot-card {
  display: flex;
  flex-direction: column;
  min-width: 0;
  border: 1px solid var(--rule, var(--vp-c-divider));
  border-radius: var(--radius-2);
  overflow: hidden;
}
/* The stage holds its shape before and after its plot draws, so nothing moves when it does. */
.plot-card-stage {
  aspect-ratio: 4 / 3;
  overflow: hidden;
  background: var(--vp-c-bg-soft);
}
.plot-card-stage.is-drawn {
  background: none;
}
.plot-card-plot {
  width: 100%;
  height: 100%;
}
.plot-card-plot :deep(:is(graphics-box, graphics-3d-box, notatio-complex-plot, notatio-complex-plot-3d)) {
  display: block;
  width: 100%;
  height: 100%;
}
.plot-card-plot :deep(svg) {
  display: block;
  max-width: 100%;
  max-height: 100%;
  margin: 0 auto;
}
.plot-card-link {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
  padding: 0.5rem 0.75rem;
  border-top: 1px solid var(--rule, var(--vp-c-divider));
  font-size: var(--text-sm);
  text-decoration: none;
  color: var(--ink);
}
.plot-card-link:hover .plot-card-caption {
  text-decoration: underline;
}
.plot-card-caption {
  color: var(--ink-2);
}
</style>
