# Release checks

What to run by hand before a release is tagged. The automated suites cover
the library inside the test extension, across the contexts Playwright can
drive; these steps cover the package as a consumer receives it, the
browsers Playwright does not drive, and the documents that ship with the
release. Budget about fifteen minutes.

Each step says what to do and what to expect. A step that does not behave
as written is a release blocker until it is explained.

## 1. Build and test

1. Run `npm run test`. The Playwright suite passes against the development
   build of the extension and the library.
2. Run `npm run pack`. It builds `dist/` in production mode, writes
   `rshaker-context-detect-X.Y.Z.tgz` and checks it. The checker prints the
   file count and the version, and the version is the one being released.
   A failed check names the reason and the script exits with an error.
3. Run `npm run test:compat`. It builds the previous release in
   `work/previous/` (the first run installs that tree's dependencies, which
   takes a minute) and the API test passes, printing the versions compared
   and the number of exports and context types checked. A reported removal
   is a breaking change: either restore the export or make this a major
   release.

## 2. The package as installed

4. In a scratch directory outside the repository, run
   `npm init -y && npm install /path/to/rshaker-context-detect-X.Y.Z.tgz`.
   `node_modules/@rshaker/context-detect/` holds `dist/contextDetect.js`,
   its map, `dist/src/index.d.ts`, `dist/src/contextDetect.d.ts`, the README,
   the licence and `package.json`, and nothing else.
5. In that directory, a TypeScript or JavaScript file with
   `import { detectContext, getBrowserName, BrowserContextType } from "@rshaker/context-detect";`
   resolves the three names; `tsc --noEmit` on the TypeScript file reports no
   errors.

## 3. Browsers by hand

6. Open `test/browser/unpkg.html` from the repository in Chrome, with
   `dist/` holding the production build from step 2. The console shows
   `detectContext main-world` and `getBrowserName chrome`.
7. Open the same file in Firefox. The console shows `main-world` and
   `firefox`.
8. Run `npm run build:webext:prod`. In Chrome, open `chrome://extensions`,
   turn on Developer mode, Load unpacked, choose `webext/chrome`. The card
   shows the version being released and no errors button. Click the
   extension's service worker link and, in its console, run
   `contextDetect` is not defined there by design; instead confirm the
   worker logged no errors on start, then open the toolbar popup: it renders
   its menu and the console of the popup shows no errors.

## 4. Documents

9. Run `npm run docs` and open `docs/dist/index.html`. The API reference
   lists `detectContext`, `getBrowserName` and `BrowserContextType`, and the
   descriptions match the source.
10. Run `node tasks/release-notes.mjs X.Y.Z`. It prints the section for this
    version from `CHANGELOG.md`, and that section reads as release notes:
    every notable change of the cycle is there, under the right heading, and
    nothing is left under `[Unreleased]`.
11. Read the README's Installation and Usage sections against the package:
    the npm and unpkg snippets name the right paths and the examples match
    the exported API.
