---
name: AGM
domain: Compute engine
signature: AGM(complex | infinity, (complex | infinity)?) -> number
summary: Arithmetic-geometric mean. AGM(z) is shorthand for AGM(1, z) (Fungrim convention).
signatures:
  - call: AGM(complex | infinity, (complex | infinity)?) -> number
    description: as compute-engine declares it
  - call: AGM(complex | infinity, (complex | infinity)?) -> number
    description: As native, and keeps its digits past a double's off the positive reals (N(AGM(1, -10), 20)).
    library: enumeratio-evaluation
    type: (complex | infinity, (complex | infinity)?) -> number
    overrides: compute-engine
references:
  - system: wikipedia
    identity: Arithmetic–geometric mean
  - system: mathworld
    identity: Arithmetic-GeometricMean
  - system: dlmf
    identity: "19.8"
names:
  dlmf: arithmetic-geometric mean
bindings:
  - origin: mapped
    form: wolfram
    template: ArithmeticGeometricMean[$1, $2]
    arity: 2
  - origin: mapped
    form: mpmath
    template: agm($1, $2)
    arity: 2
    threadArgOnly:
      - 1
      - 2
    checked:
      version: 1.3.0
      on: 2026-10-15
  - origin: mapped
    form: julia
    template: enumeratio_ball(agm, $1, $2)
    arity: 2
    threadArgOnly:
      - 1
      - 2
    checked:
      version: Nemo 0.56.1
      on: 2026-10-16
stub: engine
---
