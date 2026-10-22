# Releasing

How this project is branched, versioned, tagged and released. The manual
checks that precede a release are in [release-checks.md](release-checks.md).

## Branches

- One working branch, `main`, on one hosting remote, GitHub. All development
  lands there directly. The GitLab mirror and the old `dev` and `pre-dev`
  branches are frozen and unused.
- A release gets a `release-X.Y` branch off its tag only when a patch is
  needed: `git switch -c release-0.2 v0.2.7`. A release branch carries fixes
  only, each fix is merged back to `main`, and its patch releases are tagged
  and released from it like any other.
- Build outputs (`dist/`, `webext/`, `docs/dist/`), tarballs (`*.tgz`) and
  scratch directories (`work/`, `tmp/`) are git-ignored. No branch carries
  artifacts.

## Versions

- The version lives in one place, `package.json`, as plain semver. The
  webpack configs read it at build time: the library bundle gets it as
  `process.env.VERSION`, and the extension manifests under `src/manifests/`
  get it in place of `{{VERSION}}`. There is no separate build number.
- The bump happens at the start of a cycle, in the first commit after a
  release, so the whole cycle builds under the next version.
- `CHANGELOG.md` follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).
  Work accrues under `[Unreleased]` as it lands. At release time that heading
  becomes `[X.Y.Z] - YYYY-MM-DD` and an empty `[Unreleased]` is reopened above
  it.
- This project has no "last verified against" dates in its source; if one is
  added, it is updated in the release commit.

## Tags and releases

- A release is identified by its `vX.Y.Z` tag, never by commit text. The tag
  goes on the final release commit, after all checks pass, and is never
  moved. Tags are annotated, so each records who tagged it and when.
- Pushing the tag runs `.github/workflows/release.yml`. It checks out the
  tag, runs `npm run pack`, fails if the tag's version differs from
  `package.json`'s, and publishes a GitHub Release titled
  `context-detect X.Y.Z` with `rshaker-context-detect-X.Y.Z.tgz` attached and
  the changelog's section for that version as the notes
  (`tasks/release-notes.mjs`).
- `npm run pack` builds the library in production mode, runs `npm pack`, and
  runs `tasks/check-pack.mjs`, which rejects a tarball with files beyond the
  bundle, its map, the two declaration files, the README, the licence and
  `package.json`; a packed `package.json` whose version is not this tree's;
  or a bundle that is not a production build (unminified, `eval`, an inline
  source map, console calls, or not the `contextDetect` UMD library).
- The tags also drive the compatibility test. `npm run test:compat` finds the
  newest `vX.Y.Z` tag reachable from `HEAD` whose version is not the current
  one, builds it in a git worktree under `work/previous/`
  (`tasks/build-previous.mjs`), and `test/compat/api.test.mjs` checks that
  every export and every `BrowserContextType` member of that release is
  still in the current build. Because it looks only at tags merged into
  `HEAD`, a release branch tests against its own line. A removal passes only
  when the major version changed.
- npm is the distribution channel, and publishing is manual.
  `npm run release:publish` downloads the tarball from the GitHub Release,
  checks it, and runs `npm publish` on it, so the registry and the Release
  hold byte-identical archives and the `gitHead` npm records is the tagged
  commit.

## Release sequence

1. Finish the cycle on `main` with the version already bumped and the
   changelog under `[Unreleased]`.
2. Roll the changelog over: rename `[Unreleased]` to `[X.Y.Z] - YYYY-MM-DD`
   and add an empty `[Unreleased]` above it. Commit as
   `Bump version to X.Y.Z`.
3. Run the checks, in this order, fixing and committing until all pass:

   ```sh
   npm run test          # the Playwright suite against the dev build
   npm run pack          # production build, tarball and its checker
   npm run test:compat   # the previous release's API is still here
   ```

   Then work through [release-checks.md](release-checks.md).
4. Commit the final state as `context-detect X.Y.Z` and tag it:

   ```sh
   git tag -a vX.Y.Z -m "context-detect X.Y.Z"
   ```

5. Push the branch and the tag. CI publishes the GitHub Release. When it is
   done, publish the same tarball to npm:

   ```sh
   git push origin main vX.Y.Z
   gh run watch            # the release workflow
   npm run release:publish
   ```

6. Start the next cycle: bump the version in `package.json` in the first
   commit after the release.
