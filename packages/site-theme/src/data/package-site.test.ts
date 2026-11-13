import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vite-plus/test";
import { repoRoot, workspacePackages } from "./repo-docs.ts";

// https://github.com/enumeratio/notatio/wiki/Sites §1: a package's docs belong to notatio when it
// is in the presentation layer, or is `boxes` (base layer, but notatio's); every other package's to enumeratio.
// The one other value is `shared`: a private tooling package both sites are built from (the site
// theme), which has no docs of its own.
describe("a package's site", () => {
  const packages = workspacePackages({ shared: true }).filter((p) => !p.dir.includes("node_modules"));
  const manifest = (dir: string) =>
    JSON.parse(readFileSync(join(repoRoot, dir, "package.json"), "utf8")) as {
      private?: boolean;
      enumeratio?: { layer?: string };
    };
  it("is stated by every package in the tree", () => {
    expect(
      packages.filter((p) => !["enumeratio", "notatio", "shared"].includes(p.site ?? "")).map((p) => p.name),
    ).toEqual([]);
  });
  it("follows the layer, with boxes the one exception", () => {
    for (const p of packages.filter((p) => p.site !== "shared")) {
      const layer = manifest(p.dir).enumeratio?.layer;
      expect(p.site, p.name).toBe(layer === "presentation" || p.slug === "boxes" ? "notatio" : "enumeratio");
    }
  });
  it("is shared only by a private tooling package", () => {
    for (const p of packages.filter((p) => p.site === "shared")) {
      expect(manifest(p.dir), p.name).toMatchObject({ private: true, enumeratio: { layer: "tooling" } });
    }
  });
  it("leaves a shared package out of the docs", () => {
    expect(workspacePackages().filter((p) => p.site === "shared")).toEqual([]);
  });
});
