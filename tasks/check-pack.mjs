#!/usr/bin/env node
/**
 * Checks the npm tarball after `npm run pack` writes it: exactly the files a
 * release ships, a package.json carrying the version from this tree's
 * package.json, and a production bundle with no debug markers. Exits 1 with
 * the reasons when any check fails.
 *
 *   node tasks/check-pack.mjs                 # ./rshaker-context-detect-<version>.tgz
 *   node tasks/check-pack.mjs path/to/x.tgz   # a tarball somewhere else
 */
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { basename, resolve } from "node:path";

const ROOT = resolve(import.meta.dirname, "..");
const version = JSON.parse(readFileSync(resolve(ROOT, "package.json"), "utf8")).version;
const TARBALL = resolve(ROOT, process.argv[2] ?? `rshaker-context-detect-${version}.tgz`);

if (!existsSync(TARBALL)) {
    console.error(`${TARBALL} does not exist; run \`npm run pack\`.`);
    process.exit(1);
}

const tar = (flags, ...rest) => execFileSync("tar", [flags, "-f", TARBALL, ...rest], { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });
const entries = tar("-tz").split("\n").filter(Boolean).sort();
const read = (entry) => tar("-xzO", entry);

// What 0.2.6 shipped, and what every release ships: the bundle, its map and the declarations
// for the public entry points. Declarations for the extension or the test harness mean a
// development build leaked into dist/.
const expected = [
    "package/LICENSE",
    "package/README.md",
    "package/dist/contextDetect.js",
    "package/dist/contextDetect.js.map",
    "package/dist/src/contextDetect.d.ts",
    "package/dist/src/index.d.ts",
    "package/package.json",
].sort();

const problems = [];

const missing = expected.filter((entry) => !entries.includes(entry));
if (missing.length) problems.push(`missing from the tarball: ${missing.join(", ")}`);
const extra = entries.filter((entry) => !expected.includes(entry));
if (extra.length) problems.push(`unexpected files in the tarball: ${extra.join(", ")}`);

const expectedName = `rshaker-context-detect-${version}.tgz`;
if (basename(TARBALL) !== expectedName) problems.push(`the tarball is ${basename(TARBALL)}, not ${expectedName}`);

if (entries.includes("package/package.json")) {
    const packed = JSON.parse(read("package/package.json"));
    if (packed.version !== version) problems.push(`packed package.json version ${packed.version} is not this tree's ${version}`);
    if (packed.name !== "@rshaker/context-detect") problems.push(`packed package name is ${packed.name}`);
}

if (entries.includes("package/dist/contextDetect.js")) {
    const bundle = read("package/dist/contextDetect.js");
    const lines = bundle.split("\n").length;
    if (lines > 10) problems.push(`the bundle has ${lines} lines; a production build is minified`);
    if (bundle.includes("eval(")) problems.push("the bundle contains eval(), a development devtool");
    if (bundle.includes("sourceMappingURL=data:")) problems.push("the bundle carries an inline source map");
    if (/\bconsole\./.test(bundle)) problems.push("the bundle contains console calls; the production build drops them");
    if (!bundle.includes('define("contextDetect"')) problems.push('the bundle is not the "contextDetect" UMD library');
}

if (problems.length) {
    console.error(`${basename(TARBALL)} failed ${problems.length} check${problems.length === 1 ? "" : "s"}:`);
    for (const problem of problems) console.error(`  - ${problem}`);
    process.exit(1);
}
console.log(`${basename(TARBALL)}: ${entries.length} files, version ${version}, production bundle.`);
