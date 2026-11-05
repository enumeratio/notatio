import { NotatioSlider } from "./slider-box.ts";
import { defineControl } from "./define.ts";

/**
 * `<Animator name="t" min="0" max="6.28" step="0.05">` -- Wolfram's `Animator`:
 * a `<Slider>` that plays. It runs by default (Wolfram's `AnimationRunning -> True`) while on
 * screen, and the play button and the readout are on; the sweep cycles unless told otherwise --
 * an animator's job is to run, not to stop at the end. Pressing the button or dragging the
 * thumb pauses it. Hold the button for the speed and loop.
 */
export class NotatioAnimator extends NotatioSlider {
  constructor() {
    super();
    this.play = true;
    this.autoplay = true;
    this.readout = true;
    this.loop = "cycle";
  }
}

defineControl("animator-box", NotatioAnimator);
