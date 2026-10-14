import * as p from "@clack/prompts";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { loadConfig, CONFIG_FILE } from "../core/config.js";
import { detectProject } from "../core/detect.js";
import { readCachedCatalog, getConnectedCatalogUrl } from "../core/registry.js";

export async function runDoctor(cwd: string): Promise<void> {
  const root = path.resolve(cwd);
  const detection = await detectProject(root);
  const config = await loadConfig(root);
  const catalogUrl = await getConnectedCatalogUrl(root);
  const catalog = await readCachedCatalog(root);
  const checks: string[] = [];

  checks.push(`${detection.frameworkLabel ? "✓" : "!"} Framework: ${detection.frameworkLabel ?? "not detected (select one during init)"}`);
  checks.push(`${detection.packageManager !== "unknown" ? "✓" : "!"} Package manager: ${detection.packageManager}`);
  checks.push(`${config.privacy.telemetry === false && config.privacy.uploadProjectFiles === false ? "✓" : "!"} Privacy settings: telemetry ${String(config.privacy.telemetry)}, project-file upload ${String(config.privacy.uploadProjectFiles)}`);
  checks.push(`${catalogUrl ? "✓" : "–"} Catalog URL: ${catalogUrl ? "configured" : "not configured (offline mode available)"}`);
  checks.push(`${catalog ? "✓" : "–"} Catalog cache: ${catalog?.catalogVersion ?? "none"}`);

  try {
    const raw = await readFile(path.join(root, CONFIG_FILE), "utf8");
    JSON.parse(raw) as unknown;
    checks.push("✓ Architecture config: valid JSON");
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code;
    checks.push(code === "ENOENT" ? "– Architecture config: not created yet" : "! Architecture config: missing or invalid JSON");
  }

  p.intro("Frontend Setup · doctor");
  p.note(checks.join("\n"), "Environment checks");
  for (const warning of detection.warnings) p.log.warn(warning);
  p.outro("Doctor completed. No project files were changed.");
}
