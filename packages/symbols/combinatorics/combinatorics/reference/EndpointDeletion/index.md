---
name: EndpointDeletion
domain: Combinatorial maps
signature: EndpointDeletion(LabeledGraph)
summary: The graph left after deleting vertices of degree below 2 until none remain, with an isolated vertex for each component that vanished.
catalog:
  - system: findstat
    identity: Mp00264
    url: https://www.findstat.org/Mp00264
    on: LabeledGraph
mapOn:
  - LabeledGraph
signatures:
  - call: EndpointDeletion(LabeledGraph)
    description: The graph left after deleting vertices of degree below 2 until none remain, with an isolated vertex for each component that vanished.
    library: enumeratio-combinatorics
    type: (labeled_graph) -> labeled_graph
---

- Takes a `LabeledGraph` and returns a `LabeledGraph` — a typed map, so a wrong carrier is a type error rather than a wrong answer.
- FindStat's Mp00264. The survivors keep their order and are renumbered from 1, and the isolated vertices come after them.
