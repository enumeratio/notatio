---
name: ScaledReciprocalPositionValueSum
domain: Permutation statistics
signature: ScaledReciprocalPositionValueSum(p)
summary: The sum of 1/(i + p(i)) times the least common multiple of 1 .. 2n, an integer.
catalog:
  - system: findstat
    identity: St001293
    url: https://www.findstat.org/St001293
    on: Permutation
statOn:
  - Permutation
signatures:
  - call: ScaledReciprocalPositionValueSum(p)
    description: The sum of 1/(i + p(i)) times the least common multiple of 1 .. 2n, an integer.
    library: enumeratio-combinatorics
    type: (permutation) -> number
---

- Defined over `Permutation` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `Permutation` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- Each term is an integer, since i + p(i) is at most 2n and divides the scale (St001293).
