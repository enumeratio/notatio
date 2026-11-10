---
name: CyclicNakayamaGlobalDimension
domain: Dyck path statistics
signature: CyclicNakayamaGlobalDimension(path)
summary: The global dimension of the cyclic Nakayama algebra got from the path's linear Nakayama algebra by adding the first Kupisch entry to the last.
---

- Defined over `DyckPath` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `DyckPath` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- FindStat's St000969. A cyclic algebra of N simples has global dimension below 2N when it is finite, so a simple still unresolved after that many syzygies makes it infinite.
