---
name: BreakpointGraphCycles
domain: Permutation statistics
signature: BreakpointGraphCycles(p)
summary: "The alternating cycles of the breakpoint graph on 0, ..., n: a black edge from p(i) to p(i-1) and a grey edge from i to i+1, indices cyclic."
catalog:
  - system: findstat
    identity: St000696
    url: https://www.findstat.org/St000696
    on: Permutation
statOn:
  - Permutation
signatures:
  - call: BreakpointGraphCycles(p)
    description: "The alternating cycles of the breakpoint graph on 0, ..., n: a black edge from p(i) to p(i-1) and a grey edge from i to i+1, indices cyclic."
    library: enumeratio-combinatorics
    type: (permutation) -> number
---

- Defined over `Permutation` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `Permutation` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- Each cycle of the black-then-grey successor is one alternating cycle.
