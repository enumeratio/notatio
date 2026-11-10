---
name: WeylGroupMinimalFaithfulPermutationDegree
domain: Cartan type statistics
signature: WeylGroupMinimalFaithfulPermutationDegree(cartanType)
summary: "The least number of points a permutation action of the Weyl group can have and stay faithful: the orbit of a fundamental weight of least size, n + 1 for A_n, 2 n for B_n, C_n and D_n."
---

- Defined over `CartanType` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `CartanType` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- The degrees are tabulated by type (Stembridge, Computational aspects of root systems, Coxeter groups, and Weyl characters, Table 1).
