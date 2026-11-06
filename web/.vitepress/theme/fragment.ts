// The page's fragment as shared, persistent state. `#<target>` names an element by id;
// `#<target>=<sub>` also names a subselection inside it (a grouped example's case, a tab, a
// rendering environment). The target stays outlined for as long as the fragment names it,
// and a component that changes its own subselection writes it back here.
//
// History: the first fragment chosen on a page is a new entry, so Back returns to the bare
// page; every later change on that page replaces it, so cycling cases or tabs never floods
// history.

import type { Router } from "vitepress";
import { ref } from "vue";

export interface Fragment {
  readonly target: string;
  readonly sub?: string;
}

export function parseFragment(hash: string): Fragment {
  const raw = decodeURIComponent(hash.replace(/^#/, ""));
  const at = raw.indexOf("=");
  return at === -1 ? { target: raw } : { target: raw.slice(0, at), sub: raw.slice(at + 1) };
}

export const formatFragment = (f: Fragment): string =>
  f.target === "" ? "" : `#${f.target}${f.sub === undefined ? "" : `=${f.sub}`}`;

/** What the URL names now. Components watch this rather than `location.hash`. */
export const fragment = ref<Fragment>({ target: "" });

const TARGET_CLASS = "fragment-target";
/** How long to wait for a target that renders late (client-only sections, async cards). */
const WAIT_MS = 30_000;
/** How long a target is kept in view as the page grows: measured gaps of 5 s between layout steps at 6x CPU throttle. */
const SETTLE_MS = 60_000;
/** Input that means the reader is scrolling on their own. */
const READER_EVENTS = ["wheel", "touchstart", "keydown", "pointerdown"] as const;
let marked: Element | null = null;
// Watches the document for a target that is not there yet.
let waiting: MutationObserver | undefined;
let giveUp = 0;
// Vue rewrites `className` when a component's class binding patches, which drops ours.
let guard: MutationObserver | undefined;
// Keeps the target in view while content above it loads; stops when the reader takes over.
let settling: (() => void) | undefined;

function unmark(): void {
  waiting?.disconnect();
  waiting = undefined;
  clearTimeout(giveUp);
  guard?.disconnect();
  settling?.();
  marked?.classList.remove(TARGET_CLASS);
  marked = null;
}

function mark(target: string, scroll: boolean): void {
  const el = document.getElementById(target);
  if (el === null) {
    // A mutation observer, not frames: a hidden tab runs none, and a slow page may spend
    // any number of them before the card renders. A grouped card takes the target's id only
    // once it shows that case.
    waiting?.disconnect();
    waiting = new MutationObserver(() => {
      if (document.getElementById(target) === null) return;
      waiting?.disconnect();
      waiting = undefined;
      mark(target, scroll);
    });
    waiting.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ["id"] });
    clearTimeout(giveUp);
    giveUp = window.setTimeout(() => waiting?.disconnect(), WAIT_MS);
    return;
  }
  el.classList.add(TARGET_CLASS);
  marked = el;
  guard ??= new MutationObserver(() => {
    if (marked !== null && !marked.classList.contains(TARGET_CLASS)) marked.classList.add(TARGET_CLASS);
  });
  guard.observe(el, { attributes: true, attributeFilter: ["class"] });
  // A frame later, so a section the target sits in has opened first.
  if (scroll) {
    requestAnimationFrame(() => keepInView(el));
  }
}

/**
 * Scroll `el` to the middle, and again whenever the page resizes (examples hydrating and
 * plots laying out above it push it down; on a slow machine that is long after the first
 * scroll) until SETTLE_MS pass, the reader scrolls, or the target changes.
 */
function keepInView(el: Element): void {
  const reveal = (): void => el.scrollIntoView({ block: "center" });
  reveal();
  const giveUp = window.setTimeout(stop, SETTLE_MS);
  const resizes = new ResizeObserver(() => {
    if (!el.isConnected) return stop();
    reveal();
  });
  resizes.observe(document.documentElement);
  for (const type of READER_EVENTS) window.addEventListener(type, stop, { passive: true });
  function stop(): void {
    clearTimeout(giveUp);
    resizes.disconnect();
    for (const type of READER_EVENTS) window.removeEventListener(type, stop);
    if (settling === stop) settling = undefined;
  }
  settling?.();
  settling = stop;
}

/** Re-read the URL: after navigation (scroll to the target) or history moves. */
function sync(scroll: boolean): void {
  const next = parseFragment(location.hash);
  fragment.value = next;
  unmark();
  if (next.target !== "") mark(next.target, scroll);
}

/**
 * Select `target` (and optionally its `sub`) from inside the page: a case cycled, a tab
 * picked. Pushes the first fragment on a page, replaces after that, and never scrolls.
 */
export function setFragment(target: string, sub?: string): void {
  const hash = formatFragment({ target, sub });
  if (decodeURIComponent(location.hash) === hash) return;
  const url = `${location.pathname}${location.search}${hash}`;
  if (location.hash === "") history.pushState(history.state, "", url);
  else history.replaceState(history.state, "", url);
  fragment.value = { target, sub };
  if (marked?.id !== target) {
    unmark();
    mark(target, false);
  }
}

/** Re-find the target after a component replaced the element (a card re-keyed, say). */
export function remark(): void {
  if (fragment.value.target !== "" && !marked?.isConnected) {
    unmark();
    mark(fragment.value.target, false);
  }
}

let installed = false;

/** Once per app, client-side: follow hash changes, history moves and router navigation. */
export function installFragment(router: Router): void {
  if (installed || typeof window === "undefined") return;
  installed = true;
  window.addEventListener("hashchange", () => sync(true));
  window.addEventListener("popstate", () => sync(true));
  // `router.go` to the same page with a new hash fires no hashchange; chain, don't replace.
  const after = router.onAfterRouteChange;
  router.onAfterRouteChange = async (href: string) => {
    await after?.(href);
    sync(true);
  };
  sync(true);
}
