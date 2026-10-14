# Frontend Setup website

A no-build, static landing page for the Frontend Setup CLI. The page uses plain HTML, CSS, and JavaScript so the documentation site adds no framework runtime or package dependencies. It uses system font stacks. The only intentional third-party fetch is a read of the npm registry to display the latest package version in the UI. Cloudflare Pages applies security/cache headers from `_headers`.

**Canonical site:** [https://setup.grabby.lol/](https://setup.grabby.lol/)  
**Catalog:** [https://setup.grabby.lol/catalog/v1/catalog.json](https://setup.grabby.lol/catalog/v1/catalog.json)

## Preview locally

From the repository root:

```sh
python3 -m http.server 4173 --directory site
```

Open `http://localhost:4173`.

Or serve the `site/` directory with any static file server. There is no build step. After deployment, connect a project with:

```sh
frontend-setup connect https://setup.grabby.lol/catalog/v1/catalog.json
frontend-setup sync
```

## Deploy to Cloudflare Pages

1. Push the repository to GitHub.
2. In Cloudflare, open **Workers & Pages** and create a Pages project from that repository.
3. Use these settings:
   - Production branch: `main`
   - Build command: `exit 0`
   - Build output directory: `site`
4. Deploy. Custom domain should be `setup.grabby.lol`.

The project is plain static HTML, CSS, and JavaScript. No server-side adapter or environment secrets are required. Cloudflare Pages supports static sites built this way; see <https://developers.cloudflare.com/pages/framework-guides/deploy-anything/>.

## Deploy to Vercel

Import the Git repository in Vercel and set the output directory to `site`. This site has no build step. If Vercel's project configuration expects a build command, set it to `echo static site` or use Cloudflare Pages as described above.

## SEO and brand assets

Already wired in `index.html` and `site/assets/`:

- Canonical URL: `https://setup.grabby.lol/`
- Open Graph / Twitter card image: `assets/og-hero.png`
- Favicons: `favicon.svg`, `favicon-32.png`, `apple-touch-icon.png`
- Web app manifest: `site.webmanifest`
- Author links: Franklivania (email, GitHub, X)

Keep install commands aligned with published CLI behavior and the `frontend-setup` package name. Review `catalog/v1/catalog.json` before publishing catalog guidance changes.
