import { docRoutes } from "@enumeratio/site-theme/data/repo-docs";

// Each workspace package's README at /docs/<slug>/ and its docs/**/*.md below it. Links to the
// site's own address are made relative.
export default {
  paths: () => docRoutes("https://enumeratio.dev"),
};
