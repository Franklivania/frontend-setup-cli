# Hosting and release checklist

This document is the checklist for publishing the CLI to npm and hosting the static docs site plus community catalog. It matches the automation already in the repository.

## Hosting model

Two surfaces, kept separate on purpose:

| Surface | Where it lives | How it ships |
| --- | --- | --- |
| CLI package (`frontend-setup`) | npm registry | Git tag `v*` → [`.github/workflows/publish.yml`](./.github/workflows/publish.yml) (trusted publishing / OIDC) |
| Docs site + catalog | Cloudflare Pages from [`site/`](./site/) | Push to `main` (no build; output directory `site`) |

The npm tarball includes only what [`package.json`](./package.json) lists under `files` (`dist/`, `registry/`, `references/`, README, PRIVACY, LICENSE). The site, this file, tests, and GitHub workflows are **not** published to npm.

```text
GitHub main ──► Cloudflare Pages ──► site/ + /catalog/v1/catalog.json
     │
     └── version bump commit ──► git tag vX.Y.Z ──► publish.yml ──► npm
```

Primary path: **GitHub + npm trusted publishing + Cloudflare Pages**. For a Vercel alternative for the static site only, see [site/README.md](./site/README.md). Privacy expectations for network and local inspection are in [PRIVACY.md](./PRIVACY.md).

---

## Prerequisites

- GitHub repository with default branch `main` and Actions enabled.
- Local Node.js ≥ 20.19 (see `engines` in `package.json`).
- An npm account that will own the package name `frontend-setup`. Confirm the name is free (or already yours) before the first publish: `npm view frontend-setup` should fail if unpublished.
- A Cloudflare account for Pages.
- Custom domain for the docs site / catalog: `https://setup.grabby.lol` (already the canonical public URL).

---

## Initial hosting (one-time)

### 1. Repo readiness

1. Push the project to GitHub on `main`.
2. Confirm [`.github/workflows/ci.yml`](./.github/workflows/ci.yml) is green on `main` (typecheck, test, build).
3. `package-lock.json` is already in the repo. When you are happy with it, switch both CI and publish workflows from `npm install` to `npm ci` for reproducible installs (the workflows still comment that they expect this).

### 2. Cloudflare Pages (docs + catalog)

1. In Cloudflare, open **Workers & Pages** → create a Pages project from the GitHub repository.
2. Use these settings:
   - Production branch: `main`
   - Build command: `exit 0`
   - Build output directory: `site`
3. Deploy. Attach a custom domain from the project settings if desired.
4. Verify:
   - `https://setup.grabby.lol/` loads the product page
   - `https://setup.grabby.lol/catalog/v1/catalog.json` returns the catalog JSON
   - Security/cache headers from [`site/_headers`](./site/_headers) are present (especially for `/catalog/v1/catalog.json`)
5. Consumers can point the CLI at the catalog:

```sh
frontend-setup connect https://setup.grabby.lol/catalog/v1/catalog.json
frontend-setup sync
```

Catalog content is read-only guidance. It does not change local scaffold templates and is never executed by the CLI. More site detail: [site/README.md](./site/README.md).

### 3. npm trusted publishing

Publishing uses GitHub Actions OIDC (`id-token: write` in `publish.yml`). Do **not** add an `NPM_TOKEN` secret for this workflow.

1. Sign in at [npmjs.com](https://www.npmjs.com/) with the account that will own the package.
2. Configure **trusted publishing** for this package so GitHub Actions can publish:
   - Repository: your GitHub org/user and this repo
   - Workflow filename: `publish.yml`
   - Follow current npm docs for “trusted publishers” / OIDC if the UI labels differ
3. If npm requires the package to exist before you can attach a trusted publisher, use npm’s documented bootstrap for the first publish with a trusted publisher (still prefer OIDC over a long-lived token). After that, every release is tag-driven only.

### 4. First CLI release

The publish job fails unless the git tag equals `v` + `package.json` `version`. Current source aims at the next release after any local bump (see `package.json`).

1. On `main`, confirm the intended `"version"` in `package.json`.
2. Keep site copy/SEO assets aligned with the live product (`setup.grabby.lol`). Push that with the release commit or immediately after.
3. Commit any remaining release-ready changes on `main` and push:

```sh
git push origin main
```

4. Create and push an annotated tag that matches the version:

```sh
git tag -a vX.Y.Z -m "Release vX.Y.Z"
git push origin vX.Y.Z
```

5. In GitHub Actions, watch **Publish CLI to npm**. It typechecks, tests, builds, then runs `npm publish`.
6. Verify the registry and a local smoke test:

```sh
npm view frontend-setup version
npx frontend-setup@latest --help
npx frontend-setup update
```

---

## Subsequent releases (version bumps)

Use this ritual for every CLI release after the first.

### Semver choice

| Bump | When |
| --- | --- |
| **patch** | Bug fixes, docs-in-package, no intentional CLI/API behavior change |
| **minor** | New backward-compatible commands, flags, adapters, or generated foundations |
| **major** | Breaking CLI flags, removed adapters, or incompatible scaffold/config changes |

Catalog and site content have their own versioning (`catalogVersion` / deploy); they do not have to match the npm version.

### Release steps

1. Land all intended changes on `main` and wait for CI to pass.
2. Bump the package version **without** letting npm create a tag yet (the publish workflow owns the tag contract):

```sh
npm version patch --no-git-tag-version
# or: npm version minor --no-git-tag-version
# or: npm version major --no-git-tag-version
```

This updates `package.json` and `package-lock.json` version fields. Commit that bump (and any release notes you keep in-repo):

```sh
git add package.json package-lock.json
git commit -m "Release vX.Y.Z"
git push origin main
```

3. If catalog guidance changed in this release (or earlier on `main`), update [`site/catalog/v1/catalog.json`](./site/catalog/v1/catalog.json):
   - Bump `catalogVersion` (for example `2026.10.2`)
   - Set `publishedAt` to an ISO timestamp
   - Push on `main` so Pages picks it up (can be the same commit as the npm bump or a prior one)
4. Update [`site/index.html`](./site/index.html) install/status wording if the published story changed.
5. Tag and push exactly `vX.Y.Z` matching `package.json`:

```sh
git tag -a vX.Y.Z -m "Release vX.Y.Z"
git push origin vX.Y.Z
```

6. Confirm **Publish CLI to npm** succeeds, then verify:

```sh
npm view frontend-setup version
npx frontend-setup@latest --help
npx frontend-setup update
```

7. Confirm Cloudflare Pages deployed the same `main` commit if you changed `site/` or the catalog.

### Site-only or catalog-only updates

- Push to `main` only. No npm version bump and no git tag.
- Review catalog JSON before publish; treat guidance like source code.

### CLI-only updates

- Bump `package.json` version, tag `vX.Y.Z`, push the tag.
- Site and catalog can stay unchanged.

### What not to do

- Do not retag or reuse an npm version that already published (versions are immutable).
- Do not push a tag that does not match `package.json` (the workflow exits immediately).
- Do not force-push release tags after they have been published.
- Do not expect `frontend-setup sync` to alter local templates; catalog notes are display-only.
- Do not put long-lived npm tokens in GitHub secrets for this workflow while using trusted publishing.

---

## Rollback and recovery

| Problem | What to do |
| --- | --- |
| Bad npm release | Publish a fix-forward patch (`npm version patch --no-git-tag-version`, commit, tag, push). You cannot overwrite a published version. |
| Bad docs/catalog on Pages | Revert the commit on `main` or redeploy a previous Cloudflare Pages deployment. |
| Publish workflow fails on tag check | Tag name is not `v` + `package.json` version. Delete the bad remote tag only if it never published, fix the version/tag, push again. |
| Publish fails on auth | Trusted publisher is missing or points at the wrong repo/workflow. Fix npm package settings; do not switch to a permanent token unless you intentionally change the publish model. |
| CI fails before publish | Fix on `main`, retag only after the version commit is corrected; never publish a broken commit. |

---

## Quick reference

```sh
# First or later CLI release (after version is set on main)
git tag -a vX.Y.Z -m "Release vX.Y.Z"
git push origin vX.Y.Z

# Bump without creating a tag
npm version patch --no-git-tag-version   # or minor | major

# Registry / smoke
npm view frontend-setup version
npx frontend-setup@latest --help
npx frontend-setup update

# Catalog
frontend-setup connect https://setup.grabby.lol/catalog/v1/catalog.json
frontend-setup sync
```

Preview the site locally (no build step):

```sh
python3 -m http.server 4173 --directory site
```
