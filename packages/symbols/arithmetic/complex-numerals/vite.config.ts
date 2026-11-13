import { defineConfig } from "vite-plus";
import { fmt, lint } from "@notatio/config";

export default defineConfig({
  pack: {
    entry: { index: "src/index.ts", lattice: "src/lattice.ts" },
    deps: { resolveDepSubpath: true },
    dts: { generator: "tsgo", tsconfig: "tsconfig.dts.json" },
  },
  lint,
  fmt,
});
