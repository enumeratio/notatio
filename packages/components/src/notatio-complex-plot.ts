import { emitComplexGLSL } from "@enumeratio/ce-patches/glsl-complex";
import { html, LitElement, type PropertyValues } from "lit";
import { bindWildcards, canonicalOf } from "./plot-kernel.ts";
import { ensureStyles } from "./styles.ts";
import type { ComplexFunction } from "@enumeratio/frontend";
import {
  ComplexPlotRenderer,
  type ComplexPlotView,
  getGpu,
  gradientOf,
  gradientRamp,
  parseNumeric,
  renderPortrait,
  WHEEL_HINT,
  wheelZooms,
  zoomAbout,
} from "@enumeratio/frontend/core";

/**
 * `<ComplexPlot value="PolyLog(2, z)">` -- domain-coloring of a complex-valued
 * expression over the complex plane, one fragment-shader invocation per pixel: color is the
 * argument on a `gradient` (default `phase`, the hue wheel; any cyclic one such as
 * `sinebow` has no seam at the negative real axis; `reverse` turns it round), brightness a
 * compressed log-magnitude, poles white and zeros black.
 *
 * Any expression the complex emitter can lower works, so this replaces a hand-written
 * shader per function. Under `<Manipulate>` every constant becomes an axis:
 *
 * ```html
 * <Manipulate params="{s, 0.5, 6, 0.05}">
 *   <ComplexPlot value="PolyLog(_s, z)" mask="1" />
 * </Manipulate>
 * ```
 *
 * A slider moves a literal, not the expression's shape, so the compiled program is
 * reused and the frame costs one small uniform upload -- which is what lets Manipulate
 * interpolate between slider steps and still hold frame.
 *
 * `mask` dims everything outside that radius, for a series whose disk of convergence
 * is part of the story (the polylog's |z| < 1). Drag to pan; ⌘/Ctrl + scroll to zoom.
 *
 * Framing is manipulable too: `extent="_e"` takes a wildcard directly, and `center`
 * accepts the Epsil list form `[_c, 0]` as well as a bare `re,im`. Written as
 * `ComplexPlot(f, {z, a + b I, c + d I})`, the corners set both: the view is centered on the
 * rectangle and as tall as its longer side, so it shows all of it (more, on a wide canvas).
 * Corners that are not a real rectangle (`a >= c` or `b >= d`, or not numbers) leave the default view.
 *
 * Where WebGL2 or float render targets are missing, or the expression has no GPU lowering, the portrait is
 * drawn on the CPU instead, into a 2-D canvas through the base package's complex evaluator and the shader's
 * own color mapping: coarse first, then refined, at one pixel per CSS pixel. A point the evaluator declines
 * is hatched, as on the GPU. A render that runs past its time budget stops refining and says so.
 * `gpu="false"` forces the CPU.
 */
export class NotatioComplexPlot extends LitElement {
  static properties = {
    /** The complex-valued expression to color, in Epsil. */
    value: { type: String },
    bindings: { attribute: false },
    /** The complex variable; defaults to `z`. */
    var: { type: String },
    /** Centre of the view in the complex plane, as `re,im`. Dragging pans it. */
    center: { type: String },
    /** The height of the view, in the complex plane: its vertical span. Its width is that times the canvas's aspect ratio. Scrolling zooms it. */
    extent: { type: Number },
    /** Dim everything outside this radius; 0 masks nothing. */
    mask: { type: Number },
    /** The gradient the argument is colored with: `phase` (the hue wheel), `sinebow`, `turbo`, `viridis`, …. */
    gradient: { type: String },
    /** Run the gradient from its last color to its first. */
    reverse: { type: Boolean },
    /** Canvas height in pixels. */
    height: { type: Number },
    /** Show a frame-rate readout. */
    fps: { type: Boolean },
    /** `"false"` draws on the CPU even where WebGL2 is available. */
    gpu: { type: String },
    _status: { state: true },
    _note: { state: true },
    _cpu: { state: true },
    _gpuCanvas: { state: true },
    _cpuCanvas: { state: true },
    _fps: { state: true },
  };

  declare value: string;
  /** Wildcard values (`_a` → 2) from a surrounding Manipulate: they fill the literal slots,
   *  so the shader is reused. */
  declare bindings: Record<string, number> | undefined;
  declare var: string;
  declare center: string;
  declare extent: number;
  declare mask: number;
  declare gradient: string;
  declare reverse: boolean;
  declare height: number;
  declare fps: boolean;
  declare gpu: string;
  /** Drop the frame and caption, for a pane that already has its own context. */
  declare bare: boolean;
  declare _status: string;
  /** What the CPU path says about its drawing, beside the portrait: not a failure. */
  declare _note: string;
  /** The CPU canvas is the one showing (the GPU is missing, declined this expression, or switched off). */
  declare _cpu: boolean;
  /** The WebGL2 canvas is in the page: kept for the element's life once the GPU is available. */
  declare _gpuCanvas: boolean;
  /** The 2-D canvas is in the page: added on the first CPU draw, then kept beside the GPU canvas. */
  declare _cpuCanvas: boolean;
  declare _fps: number;

  #canvas: HTMLCanvasElement | undefined;
  /** Settles once the renderer is taken or known to be missing. */
  #backend: Promise<void> = Promise.resolve();
  /** The canvas now showing is the 2-D one. */
  #onCpu = false;
  #renderer: ComplexPlotRenderer | undefined;
  #compiling = 0;
  #view: ComplexPlotView = { center: [0, 0], extent: 2.4, mask: 0 };
  #home: ComplexPlotView = { center: [0, 0], extent: 2.4, mask: 0 };
  #w = 2;
  #h = 2;
  #frames = 0;
  #last = 0;
  #queued = false;
  #f: ComplexFunction | undefined;
  #ramp = gradientRamp(gradientOf({}, "phase"));
  /** A newer CPU render replaces the one running: it ends at its next yield. */
  #cpuRender = 0;
  #image: ImageData | undefined;
  #ro: ResizeObserver | undefined;

  constructor() {
    super();
    this.value = "";
    this.var = "z";
    this.center = "0,0";
    this.extent = 2.4;
    this.mask = 0;
    this.gradient = "phase";
    this.reverse = false;
    this.height = 460;
    this.fps = false;
    this.gpu = "";
    this.bare = false;
    this._status = "";
    this._note = "";
    this._cpu = false;
    this._gpuCanvas = true;
    this._cpuCanvas = false;
    this._fps = 0;
    ensureStyles();
  }

  protected override createRenderRoot(): HTMLElement {
    return this;
  }

  protected override firstUpdated(): void {
    this.#canvas = this.querySelector("canvas") ?? undefined;
    if (this.#canvas) this.#backend = this.#pickBackend(this.#canvas);
    void this.#init();
  }

  async #init(): Promise<void> {
    if (!this.#canvas) return;
    this.#readView();
    this.#home = {
      center: [...this.#view.center],
      extent: this.#view.extent,
      mask: this.#view.mask,
    };
    this.#ro = new ResizeObserver(() => this.#resize());
    await this.#backend;
    if (!this.#renderer) await this.#show(true);
    this.#ro.observe(this.#canvas);
    this.#resize();
    await this.#compile();
  }

  /** Take the WebGL2 renderer from the first canvas, unless `gpu="false"`; nothing draws or compiles before this settles,
   * so a 2-D context is never taken from the canvas the GPU is about to use. */
  async #pickBackend(canvas: HTMLCanvasElement): Promise<void> {
    if (this.gpu === "false") return;
    const gpu = await getGpu();
    this.#renderer = (gpu && ComplexPlotRenderer.create(gpu, canvas)) || undefined;
    this.#renderer?.setGradient(gradientOf(this, "phase"));
  }

  /**
   * Show the CPU canvas or the GPU canvas, and only that one. A canvas that has given out a WebGL2 context
   * never gives a 2-D one, so the two are separate elements; the GPU's stays attached (hidden) while the CPU
   * draws, so a later expression it can lower goes back to it. With no WebGL2 the GPU canvas is dropped.
   */
  async #show(cpu: boolean): Promise<void> {
    if (cpu) {
      this._cpuCanvas = true;
      if (!this.#renderer) this._gpuCanvas = false;
    }
    this._cpu = cpu;
    await this.updateComplete;
    const next = this.querySelector<HTMLCanvasElement>(cpu ? 'canvas[data-drawn="cpu"]' : "canvas:not([data-drawn])");
    if (!next) return;
    this.#onCpu = cpu;
    this.#canvas = next;
    this.#ro?.disconnect();
    this.#ro?.observe(next);
    this.#resize();
  }

  /**
   * Re-read the framing attributes into the live view. `center` takes either a bare
   * `re,im` pair or an Epsil list `[re, im]` — the latter so a Manipulate wildcard can
   * drive it, since a bare `_c, 0` is not a parseable expression and would be skipped.
   */
  #readView(): void {
    const [cx, cy] = this.center
      .replace(/^\s*[[({]|[\])}]\s*$/g, "")
      .split(",")
      .map(parseNumeric);
    this.#view.center = [Number.isFinite(cx) ? cx : 0, Number.isFinite(cy) ? cy : 0];
    this.#view.extent = Number.isFinite(this.extent) && this.extent > 0 ? this.extent : 2.4;
    this.#view.mask = Number.isFinite(this.mask) && this.mask > 0 ? this.mask : 0;
  }

  /** `value` in canonical form (from the page's kernel): lowered to complex GLSL for the renderer, or evaluated on the CPU. */
  async #compile(): Promise<void> {
    const value = this.value;
    if (!value.trim() || !this.#canvas) return;
    // Compiles overlap (the init's, then each `bindings` or `value` change, while the kernel is still
    // answering); only the newest goes on, so a stale one never rebuilds the program or paints a second frame.
    const mine = ++this.#compiling;
    let canonical: unknown;
    try {
      canonical = bindWildcards(await canonicalOf(value), this.bindings);
    } catch {
      if (mine === this.#compiling) this._status = `Could not parse: ${value}`;
      return;
    }
    if (mine !== this.#compiling) return;
    await this.#backend;
    if (mine !== this.#compiling) return;
    if (!this.#renderer) {
      await this.#show(true);
      if (mine !== this.#compiling) return;
    }
    if (this.#renderer) {
      const emitted = emitComplexGLSL(canonical as never, this.var);
      if (emitted && this.#renderer.setExpression(emitted) !== "failed") {
        this._status = "";
        this._note = "";
        if (this.#onCpu) {
          this.#cpuRender++;
          await this.#show(false);
          if (mine !== this.#compiling) return;
        }
        this.#draw();
        return;
      }
    }
    // No GPU lowering (or no GPU): the CPU takes this expression, and the GPU canvas stays for the next.
    const { complexFunction } = await import("@enumeratio/frontend");
    if (mine !== this.#compiling) return;
    const f = complexFunction(canonical, this.var);
    if (!f) {
      // Neither path draws it: a status line, and no swap.
      this._status = `No complex lowering for: ${value}`;
      this._note = "";
      this.#clearCpu();
      return;
    }
    this.#f = f;
    this._status = "";
    if (!this.#onCpu) {
      await this.#show(true);
      if (mine !== this.#compiling) return;
    }
    this.#draw();
  }

  #resize(): void {
    const canvas = this.#canvas;
    if (!canvas) return;
    // The CPU draws one pixel per CSS pixel: a point costs microseconds to milliseconds there.
    const dpr = !this.#onCpu && this.#renderer ? Math.min(window.devicePixelRatio || 1, 2) : 1;
    this.#w = Math.max(2, Math.round(canvas.clientWidth * dpr));
    this.#h = Math.max(2, Math.round(canvas.clientHeight * dpr));
    canvas.width = this.#w;
    canvas.height = this.#h;
    this.#draw();
  }

  /** Render now. Direct interaction takes this path: deferring a drag or a zoom to the
   * next frame is latency the user feels as drag, and the events are already paced by
   * the pointer, so there is nothing to coalesce. */
  #drawNow = (): void => {
    this.#queued = false;
    if (this.#onCpu || !this.#renderer) {
      void this.#renderCpu();
      return;
    }
    this.#renderer.render(this.#view, this.#w, this.#h);
    if (!this.fps) return;
    this.#frames++;
    const now = performance.now();
    if (now - this.#last > 400) {
      this._fps = Math.round((this.#frames * 1000) / (now - this.#last));
      this.#frames = 0;
      this.#last = now;
    }
  };

  /** Draw at most once per animation frame — for changes that can arrive faster than
   * frames (an attribute driven by an animating Manipulate), where coalescing saves
   * real work rather than adding lag. */
  #draw = (): void => {
    if (this.#queued) return;
    this.#queued = true;
    requestAnimationFrame(() => {
      if (this.#queued) this.#drawNow();
    });
  };

  #clearCpu(): void {
    this.#cpuRender++;
    const canvas = this.#canvas;
    if (canvas && this.#onCpu) canvas.getContext("2d")?.clearRect(0, 0, canvas.width, canvas.height);
  }

  /** Draw the portrait on the CPU, coarse to fine; the next view (or a resize) ends this render at its next yield. */
  async #renderCpu(): Promise<void> {
    const canvas = this.#canvas;
    const f = this.#f;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !f || !ctx) return;
    const mine = ++this.#cpuRender;
    const [width, height] = [this.#w, this.#h];
    if (this.#image?.width !== width || this.#image.height !== height) this.#image = new ImageData(width, height);
    const image = this.#image;
    const { step, complete } = await renderPortrait(
      {
        f,
        view: { center: [...this.#view.center], extent: this.#view.extent, mask: this.#view.mask },
        width,
        height,
        ramp: this.#ramp,
      },
      image.data,
      {
        paint: () => ctx.putImageData(image, 0, 0),
        yieldToEventLoop: () => new Promise((resolve) => setTimeout(resolve, 0)),
        cancelled: () => mine !== this.#cpuRender,
        now: () => performance.now(),
      },
    );
    if (mine !== this.#cpuRender) return;
    this._note = complete
      ? "Drawn on the CPU."
      : `Drawn on the CPU; stopped refining at ${step ? `${step}-pixel detail` : "a blank first pass"}: this expression is slow.`;
  }

  protected override updated(changed: PropertyValues): void {
    if (changed.has("value") || changed.has("var") || changed.has("bindings")) void this.#compile();
    if (changed.has("gradient") || changed.has("reverse")) {
      this.#renderer?.setGradient(gradientOf(this, "phase"));
      this.#ramp = gradientRamp(gradientOf(this, "phase"));
      this.#draw();
    }
    if (changed.has("center") || changed.has("extent") || changed.has("mask")) {
      this.#readView();
      this.#draw();
    }
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this.#ro?.disconnect();
    this.#ro = undefined;
    this.#cpuRender++;
  }

  /** Public so a container (a worksheet's toolbar) can put the view back. */
  resetView = (): void => {
    this.#view = {
      center: [...this.#home.center] as [number, number],
      extent: this.#home.extent,
      mask: this.#home.mask,
    };
    this.#drawNow();
  };

  #onPointerDown = (e: PointerEvent): void => {
    const canvas = this.#canvas;
    if (!canvas) return;
    let px = e.clientX;
    let py = e.clientY;
    canvas.setPointerCapture(e.pointerId);
    const move = (m: PointerEvent) => {
      const r = canvas.getBoundingClientRect();
      this.#view.center[0] -= ((m.clientX - px) / r.width) * this.#view.extent * (this.#w / this.#h);
      this.#view.center[1] += ((m.clientY - py) / r.height) * this.#view.extent;
      px = m.clientX;
      py = m.clientY;
      this.#drawNow();
    };
    const up = () => {
      canvas.removeEventListener("pointermove", move);
      canvas.removeEventListener("pointerup", up);
    };
    canvas.addEventListener("pointermove", move);
    canvas.addEventListener("pointerup", up);
  };

  /**
   * Zoom about the pointer, not the centre: the point under the cursor has to stay
   * under it, which means shifting the centre by how far that point moves as the
   * extent changes. Zooming about the centre makes you chase whatever you were
   * aiming at.
   */
  #onWheel = (e: WheelEvent): void => {
    const canvas = this.#canvas;
    if (!canvas || !wheelZooms(e, canvas)) return;
    e.preventDefault();
    if (!canvas) return;
    const r = canvas.getBoundingClientRect();
    // Pointer position in [-0.5, 0.5] of the viewport, y up.
    const ux = (e.clientX - r.left) / r.width - 0.5;
    const uy = 0.5 - (e.clientY - r.top) / r.height;
    const next = zoomAbout(this.#view, ux, uy, this.#w / this.#h, Math.exp(e.deltaY * 0.0012));
    if (next.extent === this.#view.extent) return;
    this.#view = next;
    this.#drawNow();
  };

  protected override render(): unknown {
    // `bare` is for a pane inside something that already says what this is -- a sheet's
    // screen, say. The legend explains a portrait to someone meeting one cold; repeated
    // under every pane it is just noise.
    return html`<div class="notatio-complex-plot ${this.bare ? "notatio-complex-plot-bare" : ""}">
      <div class="notatio-complex-plot-stage" style=${`height:${this.height}px`}>
        ${
          this.gpu !== "false" && this._gpuCanvas
            ? html`<canvas
                style=${this._cpu ? "display:none" : ""}
                tabindex="0"
                @pointerdown=${this.#onPointerDown}
                @wheel=${this.#onWheel}
              ></canvas>`
            : null
        }
        ${
          this._cpuCanvas || this.gpu === "false"
            ? html`<canvas
                data-drawn="cpu"
                style=${this._cpu || this.gpu === "false" ? "" : "display:none"}
                tabindex="0"
                @pointerdown=${this.#onPointerDown}
                @wheel=${this.#onWheel}
              ></canvas>`
            : null
        }
        ${this._status ? html`<p class="notatio-complex-plot-status">${this._status}</p>` : null}
        ${this._note && !this._status ? html`<p class="notatio-complex-plot-note">${this._note}</p>` : null}
      </div>
      ${
        // `bare` drops the whole footer, not just the legend: inside a worksheet's
        // screen a per-layer reset is the wrong scope, and the toolbar owns it.
        this.bare
          ? ""
          : html`<div class="notatio-complex-plot-foot">
              <span>color = arg · brightness = |value| · poles white, zeros black · drag to pan · ${WHEEL_HINT}</span>
              <button type="button" @click=${this.resetView}>⟲ reset</button>
              ${this.fps && this._fps ? html`<span class="notatio-complex-plot-fps">${this._fps} fps</span>` : null}
            </div>`
      }
    </div>`;
  }
}

if (!customElements.get("notatio-complex-plot")) {
  customElements.define("notatio-complex-plot", NotatioComplexPlot);
}
