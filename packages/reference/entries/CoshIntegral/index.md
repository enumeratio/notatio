---
name: CoshIntegral
domain: Compute engine
signature: CoshIntegral(complex | infinity) -> number
summary: "Hyperbolic cosine integral: γ + ln(x) + ∫₀ˣ (cosh(t)−1)/t dt."
signatures:
  - call: CoshIntegral(complex | infinity) -> number
    description: as compute-engine declares it
  - call: CoshIntegral(complex | infinity) -> number
    description: "Hyperbolic cosine integral: γ + ln(x) + ∫₀ˣ (cosh(t)−1)/t dt."
    library: enumeratio-analytic
    type: (complex | infinity) -> number
    overrides: compute-engine
stub: engine
names:
  wolframIdentity: true
---
