#!/usr/bin/env node
import * as p from "@clack/prompts";
import path from "node:path";
import { runConnect } from "./commands/connect.js";
import { runDoctor } from "./commands/doctor.js";
import { runInit } from "./commands/init.js";
import { runSync } from "./commands/sync.js";
import { CLI_VERSION } from "./commands/update.js";
import { runUpdate } from "./commands/update.js";
import { FRAMEWORKS, PROFILES, type Framework, type InitOptions, type MotionEngine, type PackageManager, type ProjectProfile } from "./core/types.js";

interface ParsedArgs {
  command: string;
  positional: string[];
  flags: Map<string, string | boolean>;
}

function parseArgs(args: string[]): ParsedArgs {
  const [first, ...rest] = args;
  const command = first && !first.startsWith("-") ? first : "help";
  const input = first && !first.startsWith("-") ? rest : args;
  const flags = new Map<string, string | boolean>();
  const positional: string[] = [];
  const valueFlags = new Set(["framework", "profile", "path", "motion-engine", "motion-package", "package-manager"]);

  for (let index = 0; index < input.length; index += 1) {
    const item = input[index]!;
    if (item === "-h" || item === "--help") { flags.set("help", true); continue; }
    if (item === "-v" || item === "--version") { flags.set("version", true); continue; }
    if (item === "-y" || item === "--yes") { flags.set("yes", true); continue; }
    if (item === "--dry-run") { flags.set("dryRun", true); continue; }
    if (item === "--force") { flags.set("force", true); continue; }
    if (item === "--motion") { flags.set("motion", true); continue; }
    if (item === "--no-motion") { flags.set("motion", false); continue; }
    if (item === "--api") { flags.set("api", true); continue; }
    if (item === "--no-api") { flags.set("api", false); continue; }
    if (item === "--install-deps") { flags.set("installDeps", true); continue; }
    if (item === "--no-install-deps") { flags.set("installDeps", false); continue; }
    if (item.startsWith("--")) {
      const equalIndex = item.indexOf("=");
      const key = equalIndex > -1 ? item.slice(2, equalIndex) : item.slice(2);
      const inlineValue = equalIndex > -1 ? item.slice(equalIndex + 1) : undefined;
      if (!valueFlags.has(key)) throw new Error(`Unknown option: --${key}`);
      const value = inlineValue ?? input[index + 1];
      if (value === undefined || value.startsWith("--")) throw new Error(`Option --${key} requires a value.`);
      flags.set(key, value);
      if (inlineValue === undefined) index += 1;
      continue;
    }
    positional.push(item);
  }
  return { command, positional, flags };
}

function hasFlag(args: ParsedArgs, key: string): boolean {
  return args.flags.get(key) === true;
}

function getFramework(value: string | boolean | undefined): Framework | undefined {
  if (value === undefined || typeof value === "boolean") return undefined;
  if (FRAMEWORKS.some((item) => item.value === value)) return value as Framework;
  throw new Error(`Unknown framework '${value}'. Valid values: ${FRAMEWORKS.map((item) => item.value).join(", ")}`);
}

function getProfile(value: string | boolean | undefined): ProjectProfile | undefined {
  if (value === undefined || typeof value === "boolean") return undefined;
  if (PROFILES.some((item) => item.value === value)) return value as ProjectProfile;
  throw new Error(`Unknown profile '${value}'. Valid values: ${PROFILES.map((item) => item.value).join(", ")}`);
}


function getMotionEngine(value: string | boolean | undefined): MotionEngine | undefined {
  if (value === undefined || typeof value === "boolean") return undefined;
  if (["gsap", "css", "reanimated", "native", "custom"].includes(value)) return value as MotionEngine;
  throw new Error("Unknown motion engine. Choose gsap, css, reanimated, native, or custom (the valid choice depends on the selected framework).");
}

function getPackageManager(value: string | boolean | undefined): Exclude<PackageManager, "unknown"> | undefined {
  if (value === undefined || typeof value === "boolean") return undefined;
  if (["npm", "pnpm", "yarn", "bun"].includes(value)) return value as Exclude<PackageManager, "unknown">;
  throw new Error("Unknown package manager. Choose npm, pnpm, yarn, or bun.");
}

function help(): void {
  console.log(`
Frontend Setup ${CLI_VERSION}
Configurable, framework-aware frontend architecture scaffolding.

USAGE
  frontend-setup init [options]
  frontend-setup connect [https://catalog-url/catalog.json]
  frontend-setup sync
  frontend-setup doctor
  frontend-setup update

  setup is also available as a bin alias.

INIT OPTIONS
  --framework <name>   next-app-router | react-vite | astro | expo | react-router | vanilla
  --profile <name>     landing-page | marketing-site | cms-blog | saas-dashboard |
                       general-web-app | design-system | interactive-experimental
  --path <directory>   Project directory (default: current directory)
  --motion             Include the framework-specific motion foundation
  --no-motion          Omit motion files
  --api                Include the typed API foundation where supported
  --no-api             Omit API files
  --motion-engine <id> gsap | css | reanimated | native | custom
  --motion-package <name> Name used when --motion-engine custom is selected
  --install-deps       Install missing dependencies for the selected motion engine
  --no-install-deps    Generate files without installing project dependencies
  --package-manager <id> npm | pnpm | yarn | bun (needed if auto-detection fails)
  --dry-run            Preview without writing files
  --force              Back up and replace conflicting generated files
  --yes, -y            Run without interactive prompts

PRIVACY
  No telemetry. No project files or metadata are uploaded. Catalog sync is an
  explicit, read-only download of validated JSON.
`);
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));
  if (hasFlag(args, "version")) {
    console.log(CLI_VERSION);
    return;
  }
  if (hasFlag(args, "help") || args.command === "help") {
    help();
    return;
  }

  const cwd = path.resolve(typeof args.flags.get("path") === "string" ? args.flags.get("path") as string : process.cwd());
  switch (args.command) {
    case "init": {
      const options: InitOptions = {
        cwd,
        yes: hasFlag(args, "yes"),
        dryRun: hasFlag(args, "dryRun"),
        force: hasFlag(args, "force"),
        ...(getFramework(args.flags.get("framework")) ? { framework: getFramework(args.flags.get("framework"))! } : {}),
        ...(getProfile(args.flags.get("profile")) ? { profile: getProfile(args.flags.get("profile"))! } : {}),
        ...(args.flags.has("motion") ? { motion: args.flags.get("motion") as boolean } : {}),
        ...(args.flags.has("api") ? { api: args.flags.get("api") as boolean } : {}),
        ...(args.flags.has("installDeps") ? { installDependencies: args.flags.get("installDeps") as boolean } : {}),
        ...(getMotionEngine(args.flags.get("motion-engine")) ? { motionEngine: getMotionEngine(args.flags.get("motion-engine"))! } : {}),
        ...(typeof args.flags.get("motion-package") === "string" ? { motionPackage: args.flags.get("motion-package") as string } : {}),
        ...(getPackageManager(args.flags.get("package-manager")) ? { packageManager: getPackageManager(args.flags.get("package-manager"))! } : {})
      };
      if (!options.yes && !process.stdin.isTTY) throw new Error("Interactive init requires a TTY. Use --yes with --framework and optionally --profile for CI/non-interactive usage.");
      await runInit(options);
      return;
    }
    case "connect": {
      const url = args.positional[0] ?? "";
      await runConnect(url, cwd);
      return;
    }
    case "sync":
      await runSync(cwd);
      return;
    case "doctor":
      await runDoctor(cwd);
      return;
    case "update":
      await runUpdate(cwd);
      return;
    default:
      throw new Error(`Unknown command '${args.command}'. Run 'frontend-setup --help' for usage.`);
  }
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  p.log.error(message);
  process.exitCode = 1;
});
