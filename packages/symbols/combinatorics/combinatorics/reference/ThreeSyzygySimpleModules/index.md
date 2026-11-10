---
name: ThreeSyzygySimpleModules
domain: Dyck path statistics
signature: ThreeSyzygySimpleModules(path)
summary: "The simple modules that are 3-syzygy modules: kernels of a chain of three maps between projectives."
---

- Defined over `DyckPath` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `DyckPath` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- FindStat's St001064. A projective module is a syzygy of every order.
