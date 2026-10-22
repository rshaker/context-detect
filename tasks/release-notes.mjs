#!/usr/bin/env node
/**
 * Prints the notes for a GitHub Release: the CHANGELOG.md section for one
 * version, after a line saying what the attached tarball is.
 *
 *   node tasks/release-notes.mjs 0.2.7 > notes.md
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const version = process.argv[2];
if (!version) {
    console.error("Usage: node tasks/release-notes.mjs <version>");
    process.exit(2);
}

const lines = readFileSync(resolve(import.meta.dirname, "..", "CHANGELOG.md"), "utf8").split("\n");
const start = lines.findIndex((line) => line.startsWith(`## [${version}]`));
if (start < 0) {
    console.error(`CHANGELOG.md has no section for ${version}.`);
    process.exit(1);
}
let end = lines.findIndex((line, index) => index > start && line.startsWith("## "));
if (end < 0) end = lines.length;
const section = lines.slice(start + 1, end).join("\n").trim();

process.stdout.write(
    `The attached \`rshaker-context-detect-${version}.tgz\` is the npm package, the same archive published to the registry as \`@rshaker/context-detect@${version}\`. Install it with \`npm install @rshaker/context-detect@${version}\`, or from the file with \`npm install ./rshaker-context-detect-${version}.tgz\`. The two source-code archives are the repository at this tag.\n\n${section}\n`,
);
