// The plot gallery's data: every drawing example in the records, by family (plot-gallery.ts).
// The page's frame and captions render from it at build; the pictures are drawn in the browser.

import { defineLoader } from "vitepress";
import { type GalleryFamily, galleryOf } from "./plot-gallery.ts";
import { entries } from "./reference-node.ts";

export type { GalleryCard, GalleryFamily } from "./plot-gallery.ts";

declare const data: readonly GalleryFamily[];
export { data };

export default defineLoader({
  load: (): readonly GalleryFamily[] => galleryOf(entries),
});
