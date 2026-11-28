// A grid of heavy elements that keeps only the ones in view alive. Each card mounts when it
// scrolls near the view and releases when it leaves, so the number of live plots is the number
// the screen holds, whatever the page lists. A plot that draws on a WebGL canvas holds one of the
// browser's context slots (about sixteen) until the context is collected; releasing gives it up.

export interface LazyCard {
  /** The card's box in the page, the one the observer watches. */
  element: Element;
  /** Draws the card; called when it comes near the view. */
  mount: () => void;
  /** Takes the card's drawing away; called when it has left. */
  release: () => void;
}

/** What `lazyMount` needs of the observer: the part of `IntersectionObserver` it calls. */
export interface ViewObserver {
  observe: (element: Element) => void;
  disconnect: () => void;
}
export type ObserverFactory = (
  callback: (entries: readonly { target: Element; isIntersecting: boolean }[]) => void,
  options: { rootMargin: string },
) => ViewObserver;

/** How far outside the view a card draws, so a plot is ready by the time it scrolls in. */
export const MOUNT_MARGIN = "240px 0px";

/**
 * Watches `cards` and mounts or releases each as it enters or leaves the view. Returns a function
 * that stops watching and releases every card still mounted. Without an observer nothing mounts:
 * the frame and links are the page.
 */
export function lazyMount(
  cards: readonly LazyCard[],
  makeObserver: ObserverFactory | undefined = defaultObserver(),
): () => void {
  if (makeObserver === undefined) return () => undefined;
  const byElement = new Map(cards.map((card) => [card.element, card]));
  const live = new Set<LazyCard>();
  const observer = makeObserver(
    (changes) => {
      for (const { target, isIntersecting } of changes) {
        const card = byElement.get(target);
        if (card === undefined) continue;
        if (isIntersecting && !live.has(card)) {
          live.add(card);
          card.mount();
        } else if (!isIntersecting && live.has(card)) {
          live.delete(card);
          card.release();
        }
      }
    },
    { rootMargin: MOUNT_MARGIN },
  );
  for (const card of cards) observer.observe(card.element);
  return () => {
    observer.disconnect();
    for (const card of live) card.release();
    live.clear();
  };
}

function defaultObserver(): ObserverFactory | undefined {
  if (typeof IntersectionObserver !== "function") return undefined;
  return (callback, options) => new IntersectionObserver((entries) => callback(entries), options);
}

/**
 * Gives up what a card's drawing holds before it is removed: each WebGL context is told to lose
 * itself (the slot is free at once, not when the canvas is collected), and each canvas shrinks
 * to nothing so its backing store goes too.
 */
export function releaseCanvases(root: Element): void {
  for (const canvas of root.querySelectorAll("canvas")) {
    // A canvas hands back the WebGL2 context it already has. The 2-D one (`data-drawn="cpu"`) has
    // none and is not asked, which would make one.
    if (canvas.dataset.drawn !== "cpu") {
      const gl = canvas.getContext("webgl2") as WebGL2RenderingContext | null;
      gl?.getExtension("WEBGL_lose_context")?.loseContext();
    }
    canvas.width = 0;
    canvas.height = 0;
  }
}
