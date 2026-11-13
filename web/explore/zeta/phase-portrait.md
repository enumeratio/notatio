# ζ on the GPU: a phase portrait

[The two-argument zeta](/explore/zeta/) is a sheet when you plot its height. But its real
character shows when you fix $s$ and sweep the **second argument** $a$ across the whole
complex plane and colour each point by the value there — a _domain colouring_:

- **hue** is the phase $\arg \zeta(s, a)$, so a full turn of colour circles a zero or a
  pole;
- **brightness** rises with $|\zeta(s, a)|$ — dark at zeros, blazing at poles;
- faint **bands** mark each doubling of magnitude.

Every pixel below runs the same Euler–Maclaurin kernel as the CPU path —
`@notatio/analytic`'s exported `zetaGLSL`, evaluated per pixel, per frame, on the GPU,
through the general [`<notatio-complex-plot>`](/reference/component/ComplexPlot) element. Both conventions
are drawn at once from the same $s$, so the difference between them is a glance rather
than a toggle. Drag to pan, ⌘/Ctrl + scroll to zoom; hit ▶ to sweep $\operatorname{Im}(s)$ up the
critical strip.

<Story
  title="Both conventions, swept together">
<template #description>
One pair of sliders drives both portraits, so the only difference on screen is the
convention.
</template>
<notatio-manipulate params="{ {sr, 1.5}, -2, 6, 0.05}; { {si, 4}, 0, 40, 0.25}" fps>
  <p><strong>HurwitzZeta(s, a)</strong> — poles at every nonpositive integer</p>
  <notatio-complex-plot value="HurwitzZeta(_sr + _si * i, z)" extent="8" height="380" />
  <p><strong>Zeta(s, a)</strong> — the generalized convention, no poles</p>
  <notatio-complex-plot value="Zeta(_sr + _si * i, z)" extent="8" height="380" />
</notatio-manipulate>
</Story>

## What to look for

**HurwitzZeta.** Along the negative real axis the poles at $a = 0, -1, -2, \ldots$ flare
white, each wrapped in a full pinwheel of phase. Between them the colour wheels turn the
other way around the zeros.

**Zeta.** In the lower portrait the poles are simply gone. The generalized zeta drops the
singular $(n + a) = 0$ term, so it is finite at the nonpositive integers — the left
half-plane reorganizes into a clean periodic lattice. That is the one real difference
between the two conventions, and with both drawn from the same $s$ it is the only thing
that differs between the two pictures.

**Hatched.** Below the real axis $\zeta(s, a)$ is far smaller than the terms it sums: for
$\operatorname{Im}(s) = t$ the value is about $e^{-t|\arg a|}$ times its largest term (across the cut along
$a \le 0$ the two sides differ by that factor). The GPU's `f32` sum cancels away its digits there, so where the terms
are more than 100 times the sum it sums again in double-float arithmetic (`df64`, a pair of `f32`),
which keeps the digits down to a ratio of $10^9$. Where even that cannot vouch for the value the portrait
declines: it draws a grey hatch rather than a hue. At the default window nothing is hatched at $t = 4$
or $t = 12$ (`f32` alone hatched about a third and two fifths of the half plane below the axis); zoomed out to
its widest, a third of the lower half is hatched at $t = 12$, where $e^{-12|\arg a|}$ is below $10^{-9}$, and
so is everything left of $\operatorname{Re}(a) = -82$, past the 96 direct terms the kernel sums. The test against
the `f64` kernel holds the drawn pixels to a relative error under 0.05 (a phase error under 0.05 rad), and
those that needed `df64` to under $10^{-3}$. The CPU kernel, and the mpmath oracle it matches, are the way to read
the hatched region.

**s up the critical strip.** Play the $si$ slider: at large imaginary part the
portrait develops the fine oscillatory texture that makes zeta on the critical line so
delicate. (The GPU works in `f32`, so this is a portrait, not a proof — the CPU kernel and
the mpmath/Wolfram oracles remain the source of truth for accuracy.)

## Why it's fast

Two compilers are at work. `ce.compile(expr, { to: "glsl" })` normally can't emit these
heads — compute-engine doesn't know `HurwitzZeta` — so `@notatio/analytic` registers a
`compile` handler that emits a call into `zetaGLSL`. That path is real-scalar, which suits
a surface plot and not a portrait, where the phase _is_ the picture; so a second, complex
lowering emits the same kernels as `vec2`, and that is what colours the plane above.

What keeps it interactive is that the sliders move a _literal_, not the expression's
shape. Numeric literals compile to uniform slots, and the program is cached on the shape,
so dragging $\operatorname{Im}(s)$ re-uploads a few bytes rather than relinking a program —
about 0.1 ms of work per frame outside the GPU. That headroom is why the value can be
_interpolated_ between slider steps instead of jumping: the slider is quantised and fires
below the refresh rate, and the frames in between are free.
