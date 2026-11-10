---
name: FaithfulQuotientGlobalDimension
domain: Dyck path statistics
signature: FaithfulQuotientGlobalDimension(path)
summary: The global dimension of the quotient A/AfA of the path's linear Nakayama algebra by the ideal of the idempotent f of its minimal faithful projective-injective left module.
signatures:
  - call: FaithfulQuotientGlobalDimension(path)
    description: The global dimension of the quotient A/AfA of the path's linear Nakayama algebra by the ideal of the idempotent f of its minimal faithful projective-injective left module.
    library: enumeratio-combinatorics
    type: (dyck_path) -> number
---

- Defined over `DyckPath` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `DyckPath` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- FindStat's St001195. A vertex f keeps is an isolated simple projective here, which has projective dimension 0. The left module Af is the one whose socles are the socles of the right projective-injective modules.
