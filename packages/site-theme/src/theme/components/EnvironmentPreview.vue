<script setup lang="ts">
// One expression, reduced for an environment and rendered by the ordinary components:
// pick print and the controls become small multiples; pick a pipe and they pin. The
// page's own print is the same thing done for real -- `matchMedia("print")` flips the
// environment when the browser prints, so what comes out of the printer is the
// reduction, not a picture of a slider. A text-only environment (tty, pipe) is shown
// in a terminal, printed the way the CLI prints it and, for a tty, driven from its keys.
// `#<card>=<env>` links to a card opened on an environment; picking one writes it.
import {
  browserEnvironment,
  can,
  ENVIRONMENTS,
  type Environment,
  evaluateReadouts,
  loadEngine,
  mediaSignals,
  pageEnvironment,
  reduce,
  scopeOf,
  watchPageEnvironment,
} from "@enumeratio/frontend";
import { type StructuralNode, structuralOf, toVNode } from "@enumeratio/frontend/vdom";
import { parseExpression, serializeExpression } from "@enumeratio/formats/expression";
import { computed, onMounted, onUnmounted, ref, shallowRef, watch } from "vue";
import { fragment, setFragment } from "../fragment.ts";
import { vueFactory } from "../vdom-props.ts";

const props = defineProps<{ expr: string; env?: string }>();

const source = ref(props.expr);
const chosen = ref(props.env ?? "print");
const printing = ref(false);

const environment = computed<Environment>(() => {
  if (printing.value) return browserEnvironment({ print: true });
  return ENVIRONMENTS.find((e) => e.name === chosen.value) ?? ENVIRONMENTS[0]!;
});

const engine = shallowRef<Awaited<ReturnType<typeof loadEngine>>>();
const parsed = computed(() => parseExpression(source.value));
// With no engine at view time a readout is the value it had when the page was made.
const reduced = computed(() => {
  if (parsed.value.errors.length > 0) return undefined;
  const out = reduce(parsed.value.json, environment.value);
  const ce = engine.value;
  return ce === undefined || can.drive(environment.value)
    ? out
    : evaluateReadouts(out, (e) => ce.box(e).evaluate().json);
});
const epsil = computed(() => (reduced.value === undefined ? "" : serializeExpression(reduced.value)));
const json = computed(() => (reduced.value === undefined ? "" : JSON.stringify(reduced.value)));
// The reduction as the vdom it is, reduced again for the page it sits on (a narrow window
// stacks its rows): every head a tag, the elements lowering their own children, and the
// controls' scope a `DynamicModule`, so a readout follows the control it reads.
const page = shallowRef<Environment>(pageEnvironment());
const tree = computed(() => {
  const expr = reduced.value;
  return expr === undefined ? undefined : structuralOf(scopeOf(reduce(expr, page.value)));
});
// One component for every tree, so the engine arriving (a new `reduced`, the same `json`) patches
// the elements in place instead of mounting new ones.
const Tree = Object.assign((p: { node: StructuralNode }) => toVNode(p.node, vueFactory), { props: ["node"] });
const textOnly = computed(() => environment.value.surface.every((s) => s === "text"));

const card = ref<HTMLElement>();
const story = (): HTMLElement | null | undefined => card.value?.closest<HTMLElement>(".story[id]");

/** Open on the environment the fragment names for this card (fragment.ts scrolls to it). */
const follow = (): void => {
  const id = story()?.id;
  const { target, sub } = fragment.value;
  if (id === undefined || target !== id || !ENVIRONMENTS.some((e) => e.name === sub)) return;
  chosen.value = sub!;
};
const pick = (): void => {
  const id = story()?.id;
  // Only a card the URL already names records its environment there.
  if (id !== undefined && fragment.value.target === id) setFragment(id, chosen.value);
};
// The card mounts inside ClientOnly, after this component does.
watch(card, (el) => el && follow());
watch(fragment, follow);

let media: MediaQueryList | undefined;
let unwatchPage = (): void => {};
const onMedia = (e: MediaQueryListEvent): void => {
  printing.value = e.matches;
};
onMounted(() => {
  void loadEngine().then((ce) => (engine.value = ce));
  media = window.matchMedia("print");
  printing.value = mediaSignals((q) => window.matchMedia(q)).print === true;
  media.addEventListener("change", onMedia);
  page.value = pageEnvironment();
  unwatchPage = watchPageEnvironment((env) => (page.value = env));
});
onUnmounted(() => {
  unwatchPage();
  media?.removeEventListener("change", onMedia);
});
</script>

<template>
  <ClientOnly>
    <div ref="card" class="env">
      <div class="env-bar">
        <label v-for="e in ENVIRONMENTS" :key="e.name" class="env-pick">
          <input v-model="chosen" type="radio" :value="e.name" @change="pick" />
          {{ e.name }}
        </label>
        <span v-if="printing" class="env-note">printing</span>
      </div>
      <textarea v-model="source" class="env-source" rows="2" spellcheck="false" />
      <notatio-code language="epsil" :value="epsil" hide-lang />
      <div class="env-out" :env="environment.name">
        <notatio-terminal v-if="textOnly" mode="show" :env="environment.name" :value="source" />
        <Tree v-else-if="tree" :key="json" :node="tree" />
      </div>
    </div>
  </ClientOnly>
</template>

<style scoped>
.env {
  display: grid;
  gap: 0.6rem;
}
.env-bar {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
  font-size: 0.9rem;
}
.env-pick {
  display: inline-flex;
  gap: 0.3rem;
  align-items: center;
  cursor: pointer;
}
.env-note {
  color: var(--vp-c-text-3);
}
.env-source {
  width: 100%;
  font: 0.9rem/1.4 var(--vp-font-family-mono);
  padding: 0.4rem 0.6rem;
  border: 1px solid var(--vp-c-divider);
  border-radius: var(--radius-2);
  background: var(--vp-c-bg-soft);
  color: inherit;
  resize: vertical;
}
.env-out {
  padding: 0.6rem;
  border: 1px dashed var(--vp-c-divider);
  border-radius: var(--radius-2);
}
@media print {
  .env-bar,
  .env-source {
    display: none;
  }
}
</style>
