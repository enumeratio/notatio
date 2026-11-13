import { cpSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { siteConfig } from "@enumeratio/site-theme/config";
import { docRoute, docsSidebar, workspacePackages } from "@enumeratio/site-theme/data/repo-docs";
import { writeRedirects } from "./redirects.ts";

// The enumeratio.dev app: its title, navigation and sidebars, and the build steps only it has.
// Everything else (markdown plugins, loaders, kernel workers, the Vue theme) is @enumeratio/site-theme's.

const schemas = fileURLToPath(new URL("../../packages/entry/schema", import.meta.url));

type SidebarItem = { text: string; link?: string; items?: SidebarItem[]; collapsed?: boolean };

/** The components' demos, one page each, in the order their docs give. */
function componentsSidebar(): SidebarItem {
  const pages = workspacePackages().find((p) => p.slug === "components")?.pages ?? [];
  return {
    text: "The components",
    items: pages.map((d) => ({ text: d.title, link: docRoute("components", d.page) })),
  };
}

function learnSidebar(): SidebarItem[] {
  return [
    {
      text: "Guides",
      items: [
        { text: "Guides overview", link: "/guide/" },
        { text: "Ranking and unranking", link: "/docs/combinatorics/ranking-and-unranking" },
        {
          text: "Numeral systems",
          link: "/docs/numerals/numeral-systems",
          items: [{ text: "b-adic numbers", link: "/docs/numerals/adic" }],
        },
        { text: "Adèles and idèles", link: "/docs/adeles/adeles-and-ideles" },
        {
          text: "Hypercomplex algebras",
          link: "/docs/hypercomplex/hypercomplex-algebras",
          items: [{ text: "Finite: ℤ/m and the places", link: "/docs/hypercomplex/finite" }],
        },
        { text: "Diagram algebras", link: "/docs/diagram/diagram-algebras" },
        { text: "Hecke algebras", link: "/docs/hecke/hecke-algebras" },
        { text: "Incidence algebras", link: "/docs/incidence/incidence-algebras" },
        { text: "Path algebras", link: "/docs/quiver/path-algebras" },
        { text: "Hopf algebras", link: "/docs/hopf/hopf-algebras" },
        { text: "Group algebras", link: "/docs/groupalgebra/group-algebras" },
        { text: "The modular group", link: "/docs/modular/modular-group" },
        {
          text: "Knots and braids",
          link: "/docs/braid/knots-and-braids",
          items: [
            { text: "Torus knots", link: "/docs/braid/torus-knots" },
            { text: "The Lorenz flow", link: "/docs/braid/lorenz" },
          ],
        },
      ],
    },
    componentsSidebar(),
    ...inspirationsSidebar().map((group) => ({ ...group, collapsed: true })),
    {
      text: "Packages",
      collapsed: true,
      items: [
        { text: "Packages overview", link: "/docs/" },
        {
          text: "Command line",
          link: "/docs/cli/",
          items: [
            { text: "REPL (live)", link: "/docs/cli/repl" },
            { text: "One-shot (live)", link: "/docs/cli/command-line" },
          ],
        },
        ...docsSidebar(),
      ],
    },
  ];
}

function referenceSidebar(): SidebarItem[] {
  return [
    {
      // Formats and components are catalogues -- their own index pages enumerate
      // them, so the sidebar links the entry point and stops there.
      text: "Reference",
      items: [
        { text: "Overview", link: "/reference/" },
        { text: "Symbols", link: "/reference/symbol/" },
        { text: "Statistics", link: "/reference/statistics/" },
        { text: "Maps", link: "/reference/maps/" },
        { text: "Collections", link: "/reference/collections/" },
        { text: "Domains", link: "/reference/domains/" },
        { text: "Formats", link: "/reference/formats/" },
        { text: "Components", link: "/reference/component/" },
      ],
    },
    {
      text: "Components, drawn",
      collapsed: true,
      items: [
        { text: "Plot", link: "/reference/component/Plot" },
        { text: "Plot 3D", link: "/reference/component/Plot3D" },
        { text: "Contour Plot", link: "/reference/component/ContourPlot" },
        { text: "Density Plot", link: "/reference/component/DensityPlot" },
        { text: "Vector & Stream Plot", link: "/reference/component/VectorPlot" },
        { text: "Polar Plot", link: "/reference/component/PolarPlot" },
        { text: "List Plot 3D", link: "/reference/component/ListPlot3D" },
        { text: "Bar Chart 3D", link: "/reference/component/BarChart3D" },
        { text: "Chart", link: "/reference/component/Chart" },
        { text: "GraphPlot", link: "/reference/component/GraphPlot" },
        { text: "Torus Square", link: "/reference/component/TorusSquare" },
        { text: "Complex Plot", link: "/reference/component/ComplexPlot" },
        { text: "Complex Plot 3D", link: "/reference/component/ComplexPlot3D" },
        { text: "Collection table", link: "/reference/component/CollectionTable" },
      ],
    },
  ];
}

function exploreSidebar(): SidebarItem[] {
  return [
    {
      text: "Explore",
      items: [
        { text: "Overview", link: "/explore/" },
        {
          text: "The two-argument zeta",
          link: "/explore/zeta/",
          items: [{ text: "ζ on the GPU: a phase portrait", link: "/explore/zeta/phase-portrait" }],
        },
        { text: "The Lerch transcendent", link: "/explore/lerchphi/" },
        { text: "The polylog and the polygamma", link: "/explore/polylog/" },
        { text: "Fractals", link: "/explore/fractals/" },
        { text: "Quadratic primes", link: "/explore/quadratic-primes/" },
        { text: "Complex bases", link: "/explore/complex-bases/" },
        { text: "Multiplication mod n", link: "/explore/multiplication-mod-n/" },
        { text: "Addition mod n", link: "/explore/addition-mod-n/" },
        { text: "Lifts mod pᵏ", link: "/explore/lifts-mod-pk/" },
      ],
    },
  ];
}

function inspirationsSidebar(): SidebarItem[] {
  return [
    {
      text: "Inspirations",
      link: "/playground/inspirations/",
      items: [
        { text: "Compute Engine", link: "/playground/inspirations/compute-engine" },
        { text: "Wolfram Language", link: "/playground/inspirations/wolfram" },
        { text: "SageMath", link: "/playground/inspirations/sage" },
        { text: "Mathlib", link: "/playground/inspirations/mathlib" },
        { text: "Tangle", link: "/playground/inspirations/tangle" },
        { text: "ganja.js", link: "/playground/inspirations/ganja" },
      ],
    },
  ];
}

export default siteConfig({
  title: "notatio",
  description:
    "Mathematics you can compute, draw and check — every object with a home, every claim with a test, all live in your browser.",
  buildEnd: (outDir) => {
    writeRedirects(outDir);
    // The record schemas name `https://enumeratio.dev/schema/<file>` as their `$id`, so they are served there.
    if (existsSync(schemas)) cpSync(schemas, resolve(outDir, "schema"), { recursive: true });
  },
  themeConfig: {
    // One sidebar per section (matched by path prefix), not one list of everything:
    // Learn (guides, package docs and the inspirations), Reference (lookup), Explore (dials)
    // and Sheets (the tools).
    nav: [
      { text: "Learn", link: "/docs/", activeMatch: "^/(docs|guide)/" },
      { text: "Reference", link: "/reference/", activeMatch: "^/reference/" },
      { text: "Explore", link: "/explore/", activeMatch: "^/explore/" },
      {
        text: "Sheets",
        activeMatch: "^/(worksheet|notebook)/",
        items: [
          { text: "Worksheet", link: "/worksheet/" },
          { text: "Notebook", link: "/notebook/" },
          { text: "Command line", link: "/docs/cli/" },
        ],
      },
    ],
    sidebar: {
      "/guide/": learnSidebar(),
      "/docs/": learnSidebar(),
      "/reference/": referenceSidebar(),
      "/explore/": exploreSidebar(),
      "/playground/": learnSidebar(),
    },
    socialLinks: [{ icon: "github", link: "https://github.com/enumeratio/notatio" }],
  },
});
