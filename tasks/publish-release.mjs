#!/usr/bin/env node
/**
 * Publishes a release to npm from the tarball its GitHub Release carries,
 * so the registry and the release hold the same archive. The version is
 * package.json's unless given; its `vX.Y.Z` tag must exist on origin and the
 * GitHub Release must have been made by the release workflow. The tarball
 * is downloaded to work/release/<version>/, checked, and published.
 *
 *   node tasks/publish-release.mjs           # package.json's version
 *   node tasks/publish-release.mjs 0.2.7
 */
import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, readdirSync, rmSync } from "node:fs";
import { resolve } from "node:path";

const ROOT = resolve(import.meta.dirname, "..");
const pkg = JSON.parse(readFileSync(resolve(ROOT, "package.json"), "utf8"));
const version = process.argv[2] ?? pkg.version;
const tag = `v${version}`;
const DIR = resolve(ROOT, "work", "release", version);

const out = (command, args, options = {}) => execFileSync(command, args, { cwd: ROOT, encoding: "utf8", ...options }).trim();
const run = (command, args, cwd = ROOT) => execFileSync(command, args, { cwd, stdio: "inherit" });
const fail = (message) => {
    console.error(message);
    process.exit(1);
};

if (!/^\d+\.\d+\.\d+$/.test(version)) fail(`"${version}" is not a plain X.Y.Z version.`);

// An expired or missing login makes `npm publish` of a scoped package fail with a misleading
// 404 on the PUT, so check the session first.
let user = "";
try {
    user = out("npm", ["whoami"], { stdio: ["ignore", "pipe", "ignore"] });
} catch {
    fail("You are not logged in to npm (`npm whoami` failed). Run `npm login`, then run this again.");
}
console.log(`Publishing as npm user ${user}.`);
if (!out("git", ["ls-remote", "--tags", "origin", `refs/tags/${tag}`])) fail(`Tag ${tag} is not on origin; a release is its pushed tag.`);

let published = "";
try {
    published = out("npm", ["view", `${pkg.name}@${version}`, "version"], { stdio: ["ignore", "pipe", "ignore"] });
} catch {
    // npm view exits 1 when the version does not exist, which is what we want.
}
if (published === version) fail(`${pkg.name}@${version} is already on npm.`);

rmSync(DIR, { recursive: true, force: true });
mkdirSync(DIR, { recursive: true });
console.log(`Downloading the tarball of release ${tag}…`);
run("gh", ["release", "download", tag, "--pattern", "*.tgz", "--dir", DIR]);
const tarballs = readdirSync(DIR).filter((name) => name.endsWith(".tgz"));
if (tarballs.length !== 1) fail(`Release ${tag} carries ${tarballs.length} tarballs; expected one.`);
const tarball = resolve(DIR, tarballs[0]);

if (version !== pkg.version) {
    console.log(`Note: this tree is ${pkg.version}; the tarball's own package.json is checked against ${version}.`);
}
const packed = JSON.parse(out("tar", ["-xzOf", tarball, "package/package.json"]));
if (packed.version !== version) fail(`The tarball's package.json says ${packed.version}, not ${version}.`);
if (version === pkg.version) run("node", [resolve(ROOT, "tasks", "check-pack.mjs"), tarball]);

console.log(`Publishing ${tarballs[0]} as ${pkg.name}@${version}…`);
run("npm", ["publish", tarball, "--access", "public"]);
console.log(`Published ${pkg.name}@${version}.`);
