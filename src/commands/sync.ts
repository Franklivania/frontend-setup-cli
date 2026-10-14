import * as p from "@clack/prompts";
import path from "node:path";
import { getConnectedCatalogUrl, syncCatalog } from "../core/registry.js";

export async function runSync(cwd: string): Promise<void> {
  const root = path.resolve(cwd);
  const url = await getConnectedCatalogUrl(root);
  if (!url) {
    p.log.warn("No community catalog is configured.");
    p.log.message("Run `setup connect https://your-host/catalog.json` to connect a read-only catalog. The catalog endpoint should serve the schema in registry/catalog.example.json.");
    return;
  }
  const spin = p.spinner();
  spin.start("Checking the community catalog");
  try {
    const result = await syncCatalog(root, url);
    spin.stop(result.changed ? `Catalog updated to ${result.catalog.catalogVersion}` : `Catalog is current (${result.catalog.catalogVersion})`);
    if (result.catalog.summary) p.note(result.catalog.summary, "Catalog summary");
    p.log.success("Catalog cached under .setup/cache/catalog.json. Catalog data is not executed.");
    p.outro("Sync complete. No project files or metadata were uploaded.");
  } catch (error) {
    spin.stop("Catalog sync failed");
    throw error;
  }
}
