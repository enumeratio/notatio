// The gallery's mount and release, without a browser: a fake observer is told what enters and
// leaves the view, and the cards must follow it.

import { expect, it } from "vite-plus/test";
import { type LazyCard, lazyMount, MOUNT_MARGIN, type ObserverFactory, releaseCanvases } from "./lazy-mount.ts";

function fakeObserver() {
  let callback: Parameters<ObserverFactory>[0] = () => undefined;
  let options: { rootMargin: string } | undefined;
  const watched: Element[] = [];
  let disconnected = false;
  const factory: ObserverFactory = (cb, o) => {
    callback = cb;
    options = o;
    return { observe: (el) => void watched.push(el), disconnect: () => void (disconnected = true) };
  };
  return {
    factory,
    watched,
    options: () => options,
    disconnected: () => disconnected,
    see: (target: Element, isIntersecting: boolean) => callback([{ target, isIntersecting }]),
  };
}

function cardsOf(n: number) {
  const log: string[] = [];
  const cards: LazyCard[] = Array.from({ length: n }, (_, i) => ({
    element: { id: `card-${i}` } as unknown as Element,
    mount: () => void log.push(`mount ${i}`),
    release: () => void log.push(`release ${i}`),
  }));
  return { cards, log };
}

it("mounts a card on entering the view and releases it on leaving", () => {
  const view = fakeObserver();
  const { cards, log } = cardsOf(3);
  lazyMount(cards, view.factory);
  expect(view.watched).toEqual(cards.map((c) => c.element));
  expect(view.options()?.rootMargin).toBe(MOUNT_MARGIN);
  view.see(cards[0]!.element, true);
  view.see(cards[1]!.element, true);
  view.see(cards[0]!.element, false);
  expect(log).toEqual(["mount 0", "mount 1", "release 0"]);
});

it("mounts a card once while it stays in view, and releases only what is mounted", () => {
  const view = fakeObserver();
  const { cards, log } = cardsOf(1);
  lazyMount(cards, view.factory);
  view.see(cards[0]!.element, false);
  view.see(cards[0]!.element, true);
  view.see(cards[0]!.element, true);
  expect(log).toEqual(["mount 0"]);
});

it("never holds more live cards than the view shows, however many scroll past", () => {
  const view = fakeObserver();
  const { cards } = cardsOf(500);
  let live = 0;
  let peak = 0;
  const counted = cards.map((c) => ({
    ...c,
    mount: () => void (peak = Math.max(peak, ++live)),
    release: () => void live--,
  }));
  lazyMount(counted, view.factory);
  // A window of eight cards scrolls down the whole list.
  for (let i = 0; i < counted.length; i++) {
    view.see(counted[i]!.element, true);
    if (i >= 8) view.see(counted[i - 8]!.element, false);
  }
  expect(peak).toBeLessThanOrEqual(9);
});

it("stops watching and releases what is still mounted", () => {
  const view = fakeObserver();
  const { cards, log } = cardsOf(2);
  const stop = lazyMount(cards, view.factory);
  view.see(cards[1]!.element, true);
  stop();
  expect(view.disconnected()).toBe(true);
  expect(log).toEqual(["mount 1", "release 1"]);
});

it("mounts nothing where there is no observer", () => {
  const { cards, log } = cardsOf(2);
  lazyMount(cards, undefined)();
  expect(log).toEqual([]);
});

it("makes every WebGL context lose itself, and shrinks each canvas, leaving a 2-D canvas alone", () => {
  const lost: string[] = [];
  const canvas = (name: string, drawn?: string) => ({
    dataset: { drawn },
    width: 300,
    height: 150,
    getContext: (kind: string) => {
      if (kind !== "webgl2") throw new Error(`asked for ${kind}`);
      return {
        getExtension: (ext: string) => (ext === "WEBGL_lose_context" ? { loseContext: () => lost.push(name) } : null),
      };
    },
  });
  const gpu = canvas("gpu");
  const cpu = canvas("cpu", "cpu");
  releaseCanvases({ querySelectorAll: () => [gpu, cpu] } as unknown as Element);
  expect(lost).toEqual(["gpu"]);
  expect([gpu.width, gpu.height, cpu.width, cpu.height]).toEqual([0, 0, 0, 0]);
});
