# Changelog

All notable changes to this project are recorded here. The format is
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/); versions follow
[Semantic Versioning](https://semver.org/spec/v2.0.0.html). A release is the
`vX.Y.Z` tag on its commit, and the GitHub Release for that tag carries the
npm tarball and this file's section for the version.

## [Unreleased]

## [0.2.7] - 2026-10-22

### Added

- This changelog, and a documented release process: `docs/releasing.md`
  describes the branches, versions, tags and the release sequence;
  `docs/release-checks.md` is the manual checklist run before a release.
- `npm run pack` builds the library in production mode, writes the npm
  tarball and checks it: the exact set of files, the version from
  package.json, and a minified bundle with no debug markers.
- `npm run test:compat` builds the previous release, found by its `vX.Y.Z`
  tag, in a git worktree under `work/previous/` and checks that every export
  and `BrowserContextType` member it had is still in the current build.
- A GitHub Release for every pushed `vX.Y.Z` tag, made by a workflow: the
  tarball, named with the version, is attached, and this file's section for
  that version is the notes. `npm run release:publish` downloads that
  tarball and publishes it to npm, so the registry and the release hold the
  same archive.
- A test workflow that builds the extension and the library, runs the
  Playwright suite and packs the library on every push to `main`.

### Changed

- The documentation site builds from `main` through GitHub Actions only;
  TypeDoc writes to `docs/dist/`, and `docs/` now holds the tracked process
  documents.
- Development dependencies upgraded to clear 22 `npm audit` findings, all in
  dev tooling: Playwright 1.52 to 1.64, webpack 5.99 to 5.112, webpack-cli 4
  to 7, copy-webpack-plugin 11 to 14, ts-loader 9.6.2, and
  terser-webpack-plugin declared explicitly, since both webpack configs
  import it. The published package has no runtime dependencies.
- `moduleResolution` is `Bundler`; `Node` is deprecated in TypeScript 5.

### Fixed

- `npm run playwright:test:prod` could never pass: the production extension
  build omitted the Playwright harness that the spec reads. The harness is
  always emitted into the test extension under `webext/`; it is not part of
  the published `dist/` bundle.

## [0.2.6] - 2026-07-16

The published bundle is byte-identical to 0.2.5's; this release changed only
the package metadata.

### Changed

- The package description now says what the library does: it detects which
  browser and JavaScript execution context a script is running in.

### Fixed

- A typo in the README's build instructions.

## [0.2.5] - 2025-05-03

### Added

- First release kept on npm: `detectContext()`, `getBrowserName()` and the
  `BrowserContextType` enum, as a UMD bundle with TypeScript declarations.
  Versions 0.2.0 through 0.2.4, published on 2025-05-01 and 2025-05-02 while
  the packaging was worked out, were unpublished.
