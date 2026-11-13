import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vite-plus/test";
import { repoRoot, workspacePackages } from "./repo-docs.ts";

// https://github.com/enumeratio/notatio/wiki/Sites §1: a package's docs belong to notatio when it
// is in the presentation layer, or is `boxes` (base layer, but notatio's); every other package's to enumeratio.
describe("a package's site", () => {
  const packages = workspacePackages().filter((p) => !p.dir.includes("node_modules"));
  it("is stated by every package in the tree", () => {
    expect(packages.filter((p) => p.site !== "enumeratio" && p.site !== "notatio").map((p) => p.name)).toEqual([]);
  });
  it("follows the layer, with boxes the one exception", () => {
    for (const p of packages) {
      const layer = (
        JSON.parse(readFileSync(join(repoRoot, p.dir, "package.json"), "utf8")) as { enumeratio?: { layer?: string } }
      ).enumeratio?.layer;
      expect(p.site, p.name).toBe(layer === "presentation" || p.slug === "boxes" ? "notatio" : "enumeratio");
    }
  });
});
