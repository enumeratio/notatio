---
name: DihedralOrbitSize
domain: Perfect matching statistics
signature: DihedralOrbitSize(matching)
summary: The matchings the rotations and reflections of the 2n points take this one to.
catalog:
  - system: findstat
    identity: St000945
    url: https://www.findstat.org/St000945
    on: PerfectMatching
statOn:
  - PerfectMatching
signatures:
  - call: DihedralOrbitSize(matching)
    description: The matchings the rotations and reflections of the 2n points take this one to.
    library: enumeratio-combinatorics
    type: (perfect_matching) -> number
---

- Defined over `PerfectMatching` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `PerfectMatching` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- FindStat's St000945. By the orbit-stabilizer theorem the orbit has the 4n symmetries divided by those that keep the matching. The empty matching is its own orbit.
