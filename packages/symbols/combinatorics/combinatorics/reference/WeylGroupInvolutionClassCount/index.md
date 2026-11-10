---
name: WeylGroupInvolutionClassCount
domain: Cartan type statistics
signature: WeylGroupInvolutionClassCount(cartanType)
summary: "The conjugacy classes of the Weyl group whose elements are involutions, the identity left out: a class is a set of cycle types with positive and negative one- and two-cycles."
---

- Defined over `CartanType` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `CartanType` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- An involution of B_n has a positive one-cycles, b negative ones and c positive two-cycles with a + b + 2 c = n (a negative two-cycle has order 4), and one of D_n has b even; the class of the one with only two-cycles, none negative, splits in two. The exceptional types are tabulated.
