---
name: TuranEdgeExcess
domain: Graph statistics
signature: TuranEdgeExcess(graph)
summary: "The edges less those of the complement of the Turán graph with as many parts as the independence number: disjoint cliques as equal in size as possible."
catalog:
  - system: findstat
    identity: St001798
    url: https://www.findstat.org/St001798
    on: LabeledGraph
statOn:
  - LabeledGraph
signatures:
  - call: TuranEdgeExcess(graph)
    description: "The edges less those of the complement of the Turán graph with as many parts as the independence number: disjoint cliques as equal in size as possible."
    library: enumeratio-combinatorics
    type: (labeled_graph) -> number
---

- Defined over `LabeledGraph` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `LabeledGraph` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- FindStat's St001798, nonnegative by Turán's theorem. The independence number is the number of cliques; n mod it of them have one more vertex than the rest. The graph with no vertices gives 0.
