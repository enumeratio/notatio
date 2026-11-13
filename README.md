# notatio

Two projects in one repository. **enumeratio** is the catalogue of mathematical objects, combinatorial
ones first: a record and a permanent address for each, and the checking that keeps the records true, so
each can be explored now and cited for good ([enumeratio.dev](https://enumeratio.dev)). **notatio** is how
an expression is written and shown: boxes, graphics, controls, the vdom and its markup, and the notebook,
worksheet, CLI and REPL built from them. Both sit on the
[Cortex compute-engine](https://cortexjs.io/compute-engine/), which computes, and on
[Epsil](https://epsil.dev), its language and the only text syntax we read or write. Design notes, the
roadmap and contributor notes live on the [wiki](https://github.com/enumeratio/notatio/wiki); its
[Names](https://github.com/enumeratio/notatio/wiki/Names) page says what each name governs.

The catalogue's base is enumerative combinatorics: collections (permutations, partitions, Dyck paths,
tableaux and a few hundred more) as lazy indexed families with closed-form counts, ranking
and unranking, plus the statistics and maps over them. Around that sit number theory, the
special functions and a range of algebras. The enumeratio libraries (`packages/symbols/`) hold the
definitions compute-engine does not, written in Epsil.

What holds it together is structure. A head says what structure it needs (`Min` a linear
order or a lattice, `Floor` ticks, `Basis` a finite-dimensional algebra), and a type
provides that structure by conforming to the engine's protocols. So a head is written once
and works on every type with enough structure, including one a user declares
([Structures](https://github.com/enumeratio/notatio/wiki/Structures), after Mathlib's
hierarchy).

Every symbol has a reference entry whose examples are tested, and are cross-checked against
external systems (Wolfram, SageMath, SymPy, mpmath, the OEIS, FindStat, Fungrim, …) wherever
a claim can be computed ([Examples as Data](https://github.com/enumeratio/notatio/wiki/Examples-as-Data)).

## Layout

| path                   | what's there                                                                                                                                                                                                                                                                                          |
| ---------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `packages/symbols/*/`  | the symbol libraries, grouped by area: `combinatorics`, `arithmetic`, `analysis`, `algebras`, `groups`, `evaluation`                                                                                                                                                                                  |
| `packages/`            | shared machinery: reference data (`entry`, `reference`, `catalog`, `manifest`), cross-checking (`oracle`, `census`, `plausible`, `bench`), structure (`structures`), output (`formats`, `boxes`, `wolfram`, `raster`), presentation (`frontend`, `components`, `cli`) and helpers (`engine`, `utils`) |
| `packages/ce-patches/` | fixes and heads offered to compute-engine, applied as patches until they land ([README](packages/ce-patches/README.md))                                                                                                                                                                               |
| `web/`                 | the [enumeratio.dev](https://enumeratio.dev) site: the catalogue's reference pages and guides, and for now notatio's component stories, worksheet and notebook                                                                                                                                        |
| `tools/`               | CI tooling (`perf`)                                                                                                                                                                                                                                                                                   |

Each package's `package.json` `description` says what it holds;
[Packages](https://github.com/enumeratio/notatio/wiki/Packages) and
[Namespaces](https://github.com/enumeratio/notatio/wiki/Namespaces) describe how they
and the symbol family are organised.

## Development

This is a [Vite+](https://viteplus.dev/) workspace; `vp` is the one CLI.

```sh
vp install      # install dependencies
vp run dev      # serve the site
vp check        # format, lint and type-check
vp test         # run tests
vp run ready    # check, test and build everything
```

Build the library packages before `vp check` or the tests, since both resolve sibling
packages through their `dist/`:

```sh
pnpm -r --filter "./packages/**" run build
```

## More on the wiki

- [Roadmap](https://github.com/enumeratio/notatio/wiki/Roadmap): what's next, by area,
  and where to look for work.
- [Contributing](https://github.com/enumeratio/notatio/wiki/Contributing): names, where a
  change goes, reference entries, tests, git and CI.
- [Lanes](https://github.com/enumeratio/notatio/wiki/Lanes): how parallel work is
  coordinated and landed.
- Design and speculative design: the rest of the wiki's sidebar.

[AGENTS.md](AGENTS.md) holds the same working conventions, written for coding agents.

## License

[WTFPL](LICENSE).
