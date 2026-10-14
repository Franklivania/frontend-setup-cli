import * as p from "@clack/prompts";
import { detectProject } from "../core/detect.js";
import { latestPublishedVersion } from "../core/registry.js";
import packageJson from "../../package.json" with { type: "json" };

export const CLI_PACKAGE_NAME = packageJson.name;
export const CLI_VERSION = packageJson.version;

function compareVersions(left: string, right: string): number {
  const parse = (value: string) => value.replace(/^v/, "").split(/[.+-]/).slice(0, 3).map((part) => Number.parseInt(part, 10) || 0);
  const a = parse(left);
  const b = parse(right);
  for (let index = 0; index < 3; index += 1) {
    const delta = (a[index] ?? 0) - (b[index] ?? 0);
    if (delta !== 0) return delta;
  }
  return 0;
}

export async function runUpdate(cwd: string): Promise<void> {
  const detection = await detectProject(cwd);
  const spinner = p.spinner();
  spinner.start("Checking published CLI metadata");
  let latest: string | null;
  try {
    latest = await latestPublishedVersion(CLI_PACKAGE_NAME);
  } catch (error) {
    spinner.stop("Could not reach the npm registry");
    throw error;
  }

  if (!latest) {
    spinner.stop("The provisional package is not published yet");
    p.log.warn(`The CLI source is currently named ${CLI_PACKAGE_NAME}@${CLI_VERSION}. After publishing it, this command will check the npm latest tag.`);
    return;
  }

  spinner.stop(`Published latest version: ${latest}`);
  const comparison = compareVersions(latest, CLI_VERSION);
  if (comparison <= 0) {
    p.log.success(`This CLI source version (${CLI_VERSION}) is up to date with the published version.`);
    return;
  }

  const runCommand: Record<string, string> = {
    npm: `npx ${CLI_PACKAGE_NAME}@latest`,
    pnpm: `pnpm dlx ${CLI_PACKAGE_NAME}@latest`,
    yarn: `yarn dlx ${CLI_PACKAGE_NAME}@latest`,
    bun: `bunx ${CLI_PACKAGE_NAME}@latest`,
    unknown: `npx ${CLI_PACKAGE_NAME}@latest`
  };
  p.note(`${runCommand[detection.packageManager]} init`, "Update command");
  p.log.message("The check sends only the package name to the public npm registry; no project data is included.");
}
