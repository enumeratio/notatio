# GLSL

A **code output form**: GLSL ES 3.00 source (the language of WebGL2), via compute-engine's GLSL
target (the `GLSLForm` form) — the C-like syntax of fragment and vertex shaders.
It translates numeric and function expressions; math maps to GLSL's built-ins.

Shaders are floating-point, so exact rationals become float literals, and only
scalar-math expressions translate cleanly. Each row shows an expression and its
GLSL source.

<SourceOutput language="glsl" />

## GPUShaderForm — the whole shader

`GLSLForm` is the expression alone. **GPUShaderForm** is the complete shader one of this
site's GPU paths would run for it: with one unknown, the domain-colouring fragment shader
`<notatio-complex-plot>` compiles (the unknown is the complex variable, and the special
functions it may call — `Zeta`, `HurwitzZeta`, `PolyLog` — are prepended); with one or two
real unknowns, the fragment shader the plot grid evaluator draws into a float target, one invocation per
grid point. Three or more unknowns, or an expression neither path can emit, has no shader
form and the entry is left off the menu.

<notatio-out value="\zeta(s)" form="gpushader" label="Out" />
