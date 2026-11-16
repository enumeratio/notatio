---
name: CanonicalGraph
domain: Combinatorial maps
signature: CanonicalGraph(LabeledGraph)
summary: The graph relabeled so that its rank in LabeledGraphs(n) is least.
catalog:
  - system: wolfram
    identity: CanonicalGraph
    url: https://reference.wolfram.com/language/ref/CanonicalGraph.html
names:
  wolframIdentity: true
mapOn:
  - LabeledGraph
signatures:
  - call: CanonicalGraph(LabeledGraph)
    description: The graph relabeled so that its rank in LabeledGraphs(n) is least.
    library: enumeratio-combinatorics
    type: (labeled_graph) -> labeled_graph
---

- Takes a `LabeledGraph` and returns a `LabeledGraph` — a typed map, so a wrong carrier is a type error rather than a wrong answer.
- Two graphs are isomorphic exactly when their canonical graphs are equal, and the members of UnlabeledGraphs are the graphs equal to their own. The definition is the least rank over every relabeling, so it reaches few vertices: compiled, a tenth of a second at 8 vertices, interpreted a second and a half at 4; a kernel in plain numbers chooses the vertex of label n, then n - 1, and so on, keeping the candidates whose block of pairs is least and taking one of each set of twins, and answers up to 30 vertices, declining a graph whose search passes two million branches (a path or cycle past about 17 vertices, a grid past 4 x 4). Wolfram's CanonicalGraph labels by its own rule, so the two agree only up to isomorphism: the oracle compares IsomorphicGraphQ of the two answers, never their values.
