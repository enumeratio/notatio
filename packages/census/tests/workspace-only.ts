// A test that reads the repository's record tree (`packages/*/reference/`) by design has nothing to read
// in the tarball check's app, where census is installed beside the packages' tarballs; `tools/tarball-check`
// sets TARBALL_APP=1 there, and such a test skips by this name.
export const inTarballApp = process.env.TARBALL_APP === "1";
