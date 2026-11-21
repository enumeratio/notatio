---
name: Conjugate
domain: Compute engine
signature: "Conjugate(T) -> T where T: number"
summary: Complex conjugate of a number, or the pointwise conjugate of a function.
signatures:
  - call: "Conjugate(T) -> T where T: number"
    description: as compute-engine declares it
  - call: "Conjugate(T) -> T where T: number"
    description: Complex conjugate of a number, or the pointwise conjugate of a function.
    library: enumeratio-hypercomplex
    type: "((T) -> T where T: number) & ((value) -> value)"
    overrides: enumeratio-analytic
  - call: Conjugate(x)
    description: holds when x isn't known to be a number, so `Conjugate(Transpose(m))` stays unevaluated instead of a type error.
    library: enumeratio-analytic
    type: "((T) -> T where T: number) & ((value) -> value)"
    overrides: compute-engine
stub: engine
names:
  wolfram: Conjugate
bindings:
  - origin: mapped
    form: sympy
    template: conjugate($1)
    arity: 1
    threadArg: 1
    checked:
      version: 1.14.0
      on: 2026-10-14
    note: The complex conjugate only.
  - origin: mapped
    form: mpmath
    template: conj($1)
    arity: 1
    threadArgOnly: 1
    checked:
      version: 1.3.0
      on: 2026-10-15
  - origin: mapped
    form: sage
    template: conjugate($1)
    arity: 1
    threadArgOnly: 1
    checked:
      version: "10.9"
      on: 2026-10-16
  - origin: mapped
    form: julia
    template: enumeratio_ball(conj, $1)
    arity: 1
    threadArgOnly: 1
    checked:
      version: Nemo 0.56.1
      on: 2026-10-16
---
