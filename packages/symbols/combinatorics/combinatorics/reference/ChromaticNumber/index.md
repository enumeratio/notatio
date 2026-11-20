---
name: ChromaticNumber
domain: Graph statistics
signature: ChromaticNumber(graph)
summary: The fewest colors for the vertices so that adjacent vertices differ.
signatures:
  - call: ChromaticNumber(graph)
    description: The fewest colors for the vertices so that adjacent vertices differ.
    library: enumeratio-combinatorics
    type: (labeled_graph) -> number
catalog:
  - system: findstat
    identity: St000098
    url: https://www.findstat.org/St000098
    on: LabeledGraph
statOn:
  - LabeledGraph
---

- Defined over `LabeledGraph` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `LabeledGraph` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- Defined where `_x[1] <= 16` holds; elsewhere the call stays unevaluated.
- FindStat's St000098. The colorings in k colors are counted as the covers of the vertices by k independent sets, Σ over the subsets S of (-1)^(n - |S|) i(S)^k with i(S) the independent sets inside S, and the number is the least k with one. The count passes 2^53, so it is read modulo as many primes as its bound i(V)^k needs, and is zero when every residue is. The graph with no vertices gives 0.
