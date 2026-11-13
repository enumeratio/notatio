---
layout: page
title: notatio
titleTemplate: Write mathematics, see it work
pageClass: home-page
---

<div class="home vp-doc">

<header class="home-hero">
<div class="home-hero-text">
<p class="eyebrow">A notebook for mathematics</p>
<h1>Write mathematics, <em>see it work.</em></h1>
<p class="lede">notatio writes and shows mathematics you can compute, draw and check, live in your browser. <em>enumeratio</em> is the catalogue behind it: every object has a home and every claim a test.</p>
<p class="home-actions">
<a class="home-action is-primary" href="/worksheet/">Open a worksheet</a>
<a class="home-action" href="/docs/">Read the docs</a>
<a class="home-action" href="/reference/">Look something up</a>
</p>
</div>
<figure class="plate home-hero-plate">
<notatio-manipulate v-pre params="{ {A, 1}, 0.2, 2}; { {w, 2}, 0.5, 6}">
<graphics-box value="Plot(_A * Sin(_w * x) / x, (x, -9.42, 9.42), PlotRange -> (-2.5, 4.5), GridLines -> True)" />
</notatio-manipulate>
<figcaption><span class="plate-no">Fig. 1</span> <code>Plot(A * Sin(w * x) / x, (x, -3π, 3π))</code>, with its two constants on sliders. Drag one.</figcaption>
</figure>
</header>

<section class="home-plates" aria-label="What it does">

<figure class="plate">
<div class="plate-body">
<notatio-cell value="Zeta(2)" />
<notatio-cell value="Binomial(52, 5)" />
<notatio-cell value="HurwitzZeta(0, a)" />
</div>
<figcaption><span class="plate-no">Compute</span> Exact where it can be, to any precision where it cannot. Each cell is live: change the input and the output follows. <a href="/reference/symbol/">Every symbol</a> has a page of examples like these, each held to a test.</figcaption>
</figure>

<figure class="plate">
<div class="plate-body">
<graphics-3d-box value="Plot3D(Sin(x) * Cos(y), (x, -3.14, 3.14), (y, -3.14, 3.14))" />
</div>
<figcaption><span class="plate-no">Draw</span> Curves, surfaces, phase portraits and diagrams are expressions too, drawn by <a href="/reference/component/">elements</a> you can put in any page. Turn this one over, or <a href="/explore/">explore</a> a function with its constants on dials.</figcaption>
</figure>

<figure class="plate is-wide">
<div class="plate-body">
<ClientOnly>
<notatio-collection-table expr="Subsets(4)" columns="Length, Sum" glyph="subset" page-size="6" readonly="true"></notatio-collection-table>
</ClientOnly>
</div>
<figcaption><span class="plate-no">Enumerate</span> Subsets, permutations, partitions, Dyck paths, tableaux, trees: families with a count and an order, so the millionth member is as near as the first. Browse the <a href="/reference/collections/">collections</a> and the <a href="/reference/statistics/">statistics</a> on them, checked against FindStat.</figcaption>
</figure>

</section>

<nav class="home-contents" aria-label="Contents">
<h2>Contents</h2>
<ol>
<li><a href="/docs/"><span class="home-contents-title">Learn</span><span class="home-contents-desc">Guides that follow one family of objects far enough to see how it is built, and each package's own docs.</span></a></li>
<li><a href="/reference/"><span class="home-contents-title">Reference</span><span class="home-contents-desc">Every symbol, format and element: signatures, live examples, and a crosswalk to the DLMF, the OEIS, Wolfram, Sage and more.</span></a></li>
<li><a href="/explore/"><span class="home-contents-title">Explore</span><span class="home-contents-desc">One function per page with every constant on a dial: zeta, the Lerch transcendent, fractals, quadratic primes.</span></a></li>
<li><a href="/worksheet/"><span class="home-contents-title">Worksheet</span><span class="home-contents-desc">Named expressions and a shared view of what they draw. Bind a number and it gets a slider.</span></a></li>
<li><a href="/notebook/"><span class="home-contents-title">Notebook</span><span class="home-contents-desc">A column of cells that refer to each other by name; change one and its readers follow. Kept in your browser.</span></a></li>
<li><a href="/docs/cli/"><span class="home-contents-title">Command line</span><span class="home-contents-desc">The same evaluation in a terminal, with a REPL.</span></a></li>
</ol>
</nav>

<SiteFooter />

</div>
