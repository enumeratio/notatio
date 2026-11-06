import { NotatioSlider } from "./slider-box.ts";
import type { PropertyValues } from "lit";
import { defineControl } from "./define.ts";

/**
 * `<Animator name="t" min="0" max="6.28" step="0.05">` -- Wolfram's `Animator`:
 * a `<Slider>` that plays. It runs by default (Wolfram's `AnimationRunning -> True`) while on
 * screen, and the play button and the readout are on; the sweep cycles unless told otherwise --
 * an animator's job is to run, not to stop at the end. Pressing the button or dragging the
 * thumb pauses it. `animation-running="false"` (`AnimationRunning -> False`) holds it still until
 * played. Hold the button for the speed and loop.
 */
export class NotatioAnimator extends NotatioSlider {
  static override properties = {
    ...NotatioSlider.properties,
    animationRunning: {
      attribute: "animation-running",
      converter: (value: string | null) => value !== "false",
    },
  };

  declare animationRunning: boolean;

  constructor() {
    super();
    this.play = true;
    this.animationRunning = true;
    this.autoplay = true;
    this.readout = true;
    this.loop = "cycle";
  }

  protected override willUpdate(changed: PropertyValues): void {
    if (changed.has("animationRunning")) this.autoplay = this.animationRunning;
    super.willUpdate(changed);
  }
}

defineControl("animator-box", NotatioAnimator);
