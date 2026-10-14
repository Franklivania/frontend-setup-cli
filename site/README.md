# Frontend Setup website

A no-build, static landing page for the Frontend Setup CLI. The page uses plain HTML, CSS, and JavaScript so the documentation site adds no framework runtime or package dependencies. It uses system font stacks and makes no background network requests. Cloudflare Pages will apply security/cache headers from `_headers`.

## Preview locally

From the repository root:

```sh
python3 -m http.server 4173 --directory site
```

Open `http://localhost:4173`.

Or serve the `site/` directory with any static file server. There is no build step. A versioned, read-only starter catalog is included at `catalog/v1/catalog.json`; once this site is deployed, it is available at `https://<your-domain>/catalog/v1/catalog.json`. Review changes to that file before publishing them. After deployment, connect a project with `frontend-setup connect https://<your-domain>/catalog/v1/catalog.json`, then run `frontend-setup sync`.

## Deploy to Cloudflare Pages

1. Push the repository to GitHub.
2. In Cloudflare, open **Workers & Pages** and create a Pages project from that repository.
3. Use these settings:
   - Production branch: `main`
   - Build command: `exit 0`
   - Build output directory: `site`
4. Deploy. Connect a custom domain from the project settings if desired.

The project is plain static HTML, CSS, and JavaScript. No server-side adapter or environment secrets are required. Cloudflare Pages supports static sites built this way; see <https://developers.cloudflare.com/pages/framework-guides/deploy-anything/>.

## Deploy to Vercel

Import the Git repository in Vercel and set the output directory to `site`. This site has no build step. If Vercel's project configuration expects a build command, set it to `echo static site` or use Cloudflare Pages as described above.

## Before making the website public

- Replace or add real repository, issue tracker, and community links once they exist.
- Update the package status in `index.html` after an npm release.
- Make sure the npm package name is registered to the project's maintainers.
- Keep install commands aligned with actual CLI behavior and published package name.
- Add a canonical URL and Open Graph image after the final domain is selected.
- The catalog path is included in source but is not publicly reachable until the site is deployed.
