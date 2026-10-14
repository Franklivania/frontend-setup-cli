import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { loadConfig, CONFIG_FILE } from "./config.js";

const MAX_CATALOG_BYTES = 1_000_000;
const CATALOG_CACHE = path.join(".setup", "cache", "catalog.json");
const META_CACHE = path.join(".setup", "cache", "registry-meta.json");

export interface CatalogManifest {
  schemaVersion: 1;
  catalogVersion: string;
  publishedAt?: string;
  summary?: string;
  frameworks?: Record<string, unknown>;
  profiles?: Record<string, unknown>;
  recipes?: unknown[];
}

/** Read bounded, plain-text guidance for the selected framework/profile.
 * Catalog data is informational only: it is never evaluated or used as executable code.
 */
export function getCatalogGuidance(
  catalog: CatalogManifest | null,
  framework: string,
  profile: string
): string[] {
  if (!catalog) return [];
  const values = [catalog.frameworks?.[framework], catalog.profiles?.[profile]];
  const guidance: string[] = [];
  const seen = new Set<string>();

  for (const value of values) {
    if (!isObject(value) || !Array.isArray(value.guidance)) continue;
    for (const raw of value.guidance) {
      if (typeof raw !== "string") continue;
      const cleaned = raw.replace(/[\u0000-\u001f\u007f-\u009f]/g, " ").replace(/\s+/g, " ").trim();
      if (!cleaned || cleaned.length > 280 || seen.has(cleaned)) continue;
      seen.add(cleaned);
      guidance.push(cleaned);
      if (guidance.length >= 8) return guidance;
    }
  }
  return guidance;
}

interface RegistryMeta {
  url?: string;
  etag?: string;
  lastModified?: string;
  syncedAt?: string;
  catalogVersion?: string;
}

function isObject(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

export function parseCatalog(value: unknown): CatalogManifest {
  if (!isObject(value)) throw new Error("Catalog must be a JSON object.");
  if (value.schemaVersion !== 1) throw new Error("Unsupported catalog schemaVersion; expected 1.");
  if (typeof value.catalogVersion !== "string" || !value.catalogVersion.trim()) {
    throw new Error("Catalog must define a non-empty catalogVersion string.");
  }
  if (value.publishedAt !== undefined && typeof value.publishedAt !== "string") {
    throw new Error("Catalog publishedAt must be a string when provided.");
  }
  if (value.summary !== undefined && typeof value.summary !== "string") {
    throw new Error("Catalog summary must be a string when provided.");
  }
  const allowed = new Set(["schemaVersion", "catalogVersion", "publishedAt", "summary", "frameworks", "profiles", "recipes"]);
  for (const key of Object.keys(value)) {
    if (!allowed.has(key)) throw new Error(`Catalog field '${key}' is not supported by this CLI version.`);
  }
  if (value.frameworks !== undefined && !isObject(value.frameworks)) throw new Error("Catalog frameworks must be an object.");
  if (value.profiles !== undefined && !isObject(value.profiles)) throw new Error("Catalog profiles must be an object.");
  if (value.recipes !== undefined && !Array.isArray(value.recipes)) throw new Error("Catalog recipes must be an array.");
  return value as unknown as CatalogManifest;
}

async function readMeta(root: string): Promise<RegistryMeta> {
  try {
    const raw = await readFile(path.join(root, META_CACHE), "utf8");
    const parsed: unknown = JSON.parse(raw);
    return isObject(parsed) ? parsed as RegistryMeta : {};
  } catch {
    return {};
  }
}

export async function getConnectedCatalogUrl(root: string): Promise<string | null> {
  const config = await loadConfig(root);
  return config.registry.url;
}

export async function connectCatalog(root: string, url: string): Promise<void> {
  const parsed = new URL(url);
  const localHost = parsed.hostname === "localhost" || parsed.hostname === "127.0.0.1";
  if (parsed.protocol !== "https:" && !(parsed.protocol === "http:" && localHost)) {
    throw new Error("Catalog URLs must use HTTPS. HTTP is permitted only for localhost development.");
  }
  if (parsed.username || parsed.password) throw new Error("Do not embed credentials in a catalog URL.");
  const config = await loadConfig(root);
  config.registry.url = parsed.toString();
  config.registry.autoSync = false;
  await writeFile(path.join(root, CONFIG_FILE), `${JSON.stringify(config, null, 2)}\n`, "utf8");
}

async function readLimitedBody(response: Response, limitBytes: number): Promise<string> {
  const contentLength = Number(response.headers.get("content-length") ?? 0);
  if (contentLength > limitBytes) throw new Error("Catalog exceeds the 1 MB size limit.");
  if (!response.body) {
    const text = await response.text();
    if (Buffer.byteLength(text, "utf8") > limitBytes) throw new Error("Catalog exceeds the 1 MB size limit.");
    return text;
  }

  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > limitBytes) {
        await reader.cancel();
        throw new Error("Catalog exceeds the 1 MB size limit.");
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  return Buffer.concat(chunks.map((chunk) => Buffer.from(chunk))).toString("utf8");
}

export async function syncCatalog(root: string, url: string): Promise<{ changed: boolean; catalog: CatalogManifest }> {
  const parsedUrl = new URL(url);
  const localHost = parsedUrl.hostname === "localhost" || parsedUrl.hostname === "127.0.0.1";
  if (parsedUrl.protocol !== "https:" && !(parsedUrl.protocol === "http:" && localHost)) {
    throw new Error("Catalog URLs must use HTTPS. HTTP is permitted only for localhost development.");
  }
  if (parsedUrl.username || parsedUrl.password) throw new Error("Do not embed credentials in a catalog URL.");

  const meta = await readMeta(root);
  const sameUrl = meta.url === parsedUrl.toString();
  const headers = new Headers({ Accept: "application/json" });
  if (sameUrl && meta.etag) headers.set("If-None-Match", meta.etag);
  if (sameUrl && meta.lastModified) headers.set("If-Modified-Since", meta.lastModified);

  const response = await fetch(url, { method: "GET", headers, signal: AbortSignal.timeout(10_000) });
  if (response.status === 304) {
    const cached = await readFile(path.join(root, CATALOG_CACHE), "utf8").catch(() => null);
    if (!cached) throw new Error("The registry returned 304 but no local catalog cache exists. Retry setup sync.");
    return { changed: false, catalog: parseCatalog(JSON.parse(cached) as unknown) };
  }
  if (!response.ok) throw new Error(`Catalog request failed with HTTP ${response.status}.`);
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("json") && !url.toLowerCase().endsWith(".json")) {
    throw new Error("Catalog endpoint must serve JSON (Content-Type application/json or a .json URL).");
  }
  const text = await readLimitedBody(response, MAX_CATALOG_BYTES);
  let raw: unknown;
  try {
    raw = JSON.parse(text) as unknown;
  } catch {
    throw new Error("Catalog endpoint returned invalid JSON.");
  }
  const catalog = parseCatalog(raw);

  const cachePath = path.join(root, CATALOG_CACHE);
  const metaPath = path.join(root, META_CACHE);
  await mkdir(path.dirname(cachePath), { recursive: true });
  await writeFile(cachePath, `${JSON.stringify(catalog, null, 2)}\n`, "utf8");
  await writeFile(metaPath, `${JSON.stringify({
    url: parsedUrl.toString(),
    ...(response.headers.get("etag") ? { etag: response.headers.get("etag")! } : {}),
    ...(response.headers.get("last-modified") ? { lastModified: response.headers.get("last-modified")! } : {}),
    syncedAt: new Date().toISOString(),
    catalogVersion: catalog.catalogVersion
  }, null, 2)}\n`, "utf8");
  return { changed: true, catalog };
}

export async function readCachedCatalog(root: string): Promise<CatalogManifest | null> {
  try {
    return parseCatalog(JSON.parse(await readFile(path.join(root, CATALOG_CACHE), "utf8")) as unknown);
  } catch {
    return null;
  }
}

export async function latestPublishedVersion(packageName: string): Promise<string | null> {
  const endpoint = `https://registry.npmjs.org/${encodeURIComponent(packageName)}/latest`;
  const response = await fetch(endpoint, { headers: { Accept: "application/json" }, signal: AbortSignal.timeout(8_000) });
  if (response.status === 404) return null;
  if (!response.ok) throw new Error(`npm registry request failed with HTTP ${response.status}.`);
  const payload: unknown = await response.json();
  if (!isObject(payload) || typeof payload.version !== "string") throw new Error("npm registry returned unexpected version metadata.");
  return payload.version;
}
