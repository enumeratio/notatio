import type { VNode } from "vue";
import { h } from "vue";

/**
 * A vdom element's attributes for Vue's `h`. Vue sets a key an element already has as a property,
 * and an element that is defined by then (a remount after the page's elements loaded) takes `"0"`
 * as the string it is, where its `min` wants a number: the `^` prefix keeps them attributes,
 * which the element reads with its own converters. `innerHTML` is the one property.
 */
export const asAttributes = (attrs: Readonly<Record<string, unknown>> | undefined): Record<string, unknown> =>
  Object.fromEntries(
    Object.entries(attrs ?? {}).map(([name, value]) => [name === "innerHTML" ? name : `^${name}`, value]),
  );

/** `toVNode`'s factory: Vue's `h` with attributes kept as attributes. */
export const vueFactory = (
  tag: string,
  attrs: Readonly<Record<string, unknown>> | undefined,
  children: readonly (VNode | string)[],
): VNode => h(tag, asAttributes(attrs), [...children]);
