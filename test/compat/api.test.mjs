import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { test } from "node:test";

/**
 * The library's public API against the previous release's. Both are UMD
 * bundles that load in Node, so the comparison needs no browser: every
 * export the previous release had is still exported, and every member of
 * BrowserContextType it had is still there with the same string value. A
 * removal is a breaking change, allowed only when the major version moved.
 *
 * `npm run test:compat` builds both: this tree with build:prod, and the
 * previous release (the newest vX.Y.Z tag in this branch's history with
 * another version) in a git worktree under work/previous/.
 */

const ROOT = resolve(import.meta.dirname, "..", "..");
const PREVIOUS = resolve(ROOT, "work", "previous");
const require = createRequire(import.meta.url);

const versionOf = (dir) => JSON.parse(readFileSync(resolve(dir, "package.json"), "utf8")).version;
const major = (version) => Number(version.split(".")[0]);

test("every export and BrowserContextType member of the previous release is in this build", () => {
    for (const dir of [PREVIOUS, ROOT]) {
        const bundle = resolve(dir, "dist", "contextDetect.js");
        assert.ok(existsSync(bundle), `No production build at ${bundle}: run \`npm run test:compat\`, which builds both.`);
    }
    const previousVersion = versionOf(PREVIOUS);
    const currentVersion = versionOf(ROOT);
    assert.notEqual(previousVersion, currentVersion, "the previous release must have another version");
    const breakingAllowed = major(previousVersion) !== major(currentVersion);

    const previous = require(resolve(PREVIOUS, "dist", "contextDetect.js"));
    const current = require(resolve(ROOT, "dist", "contextDetect.js"));

    const removed = [];
    for (const name of Object.keys(previous)) {
        if (!(name in current)) removed.push(`export ${name}`);
        else if (typeof previous[name] !== typeof current[name]) removed.push(`export ${name} changed from ${typeof previous[name]} to ${typeof current[name]}`);
    }
    for (const [member, value] of Object.entries(previous.BrowserContextType ?? {})) {
        if (!(member in (current.BrowserContextType ?? {}))) removed.push(`BrowserContextType.${member}`);
        else if (current.BrowserContextType[member] !== value) removed.push(`BrowserContextType.${member} changed from ${JSON.stringify(value)} to ${JSON.stringify(current.BrowserContextType[member])}`);
    }

    const summary = `${previousVersion} → ${currentVersion}: ${Object.keys(previous).length} exports, ${Object.keys(previous.BrowserContextType ?? {}).length} context types checked`;
    if (removed.length && breakingAllowed) {
        console.log(`${summary}; breaking changes allowed by the major version bump:\n  - ${removed.join("\n  - ")}`);
        return;
    }
    assert.deepEqual(removed, [], `${summary}; missing or changed in ${currentVersion}:\n  - ${removed.join("\n  - ")}`);
    console.log(summary);
});
