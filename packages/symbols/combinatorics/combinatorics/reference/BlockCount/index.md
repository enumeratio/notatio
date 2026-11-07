---
name: BlockCount
domain: Graph statistics
signature: BlockCount(graph)
summary: "The blocks: the maximal connected subgraphs with no cut vertex; an isolated vertex is a block."
catalog:
  - system: findstat
    identity: St000553
    url: https://www.findstat.org/St000553
    on: LabeledGraph
statOn:
  - LabeledGraph
signatures:
  - call: BlockCount(graph)
    description: "The blocks: the maximal connected subgraphs with no cut vertex; an isolated vertex is a block."
    library: enumeratio-combinatorics
    type: (labeled_graph) -> number
---

- Defined over `LabeledGraph` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `LabeledGraph` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- FindStat's St000553. The blocks of a component are one, plus for each cut vertex the components it leaves, less one; each vertex with an edge adds the components its deletion leaves in its own component, less one. The deleted vertex stays as an isolated one, a component of its own. The graph with no vertices gives 0.
