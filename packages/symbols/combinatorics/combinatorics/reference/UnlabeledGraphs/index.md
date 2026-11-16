---
name: UnlabeledGraphs
domain: Collections
signature: UnlabeledGraphs(n)
summary: The simple graphs on $n$ vertices up to isomorphism, one per class, each in its canonical labeling.
maxSize: 8
signatures:
  - call: UnlabeledGraphs(n)
    library: enumeratio-combinatorics
    description: one graph on the vertices 1 to $n$ for each isomorphism class, the one of least rank in LabeledGraphs(n); listed in the order of LabeledGraphs(n) restricted to those graphs.
    type: (integer<0..>) -> indexed_collection<labeled_graph>
enumerate:
  expr: UnlabeledGraphs(4)
seeAlso:
  - LabeledGraphs
  - CanonicalGraph
  - IsIsomorphicGraph
  - Count
  - At
catalog:
  - system: oeis
    identity: A000088
    url: https://oeis.org/A000088
grades:
  - name: n
    role: axis
carrier: LabeledGraph
---

- A lazy indexed collection of `LabeledGraph` values; the count is $A000088(n)$: 1, 1, 2, 4, 11, 34, 156, 1044, 12346 for $n = 0$ to $8$.
- The members are the graphs equal to their own [[CanonicalGraph]]: of all the labelings of a graph, the one whose rank in [[LabeledGraphs]] is least. The order is the induced order of `LabeledGraphs(n)`, ascending by that rank: first the graph without edges, then the single edge `[1, 2]`, then the path `[1, 2], [1, 3]`, last the complete graph, and before it the complete graph without the edge `[n - 1, n]`.
- Two graphs are isomorphic exactly when their canonical graphs are equal, so `Rank` of a graph that is not canonical says it is not a member; use [[CanonicalGraph]] first.
- The definition tries every relabeling of every graph, so it reaches few vertices: compiled, a third of a second at 5 vertices and about a minute and a half at 6; interpreted, a few seconds at 3. A kernel in plain numbers answers through 8 vertices, from a list that grows from the list for one vertex fewer (a canonical graph minus its first vertex is canonical); past 8 vertices the collection stays unevaluated.
