import { access, readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { FRAMEWORKS, type DetectionResult, type Framework, type PackageManager } from "./types.js";

async function exists(file: string): Promise<boolean> {
  try {
    await access(file);
    return true;
  } catch {
    return false;
  }
}

async function readJson(file: string): Promise<Record<string, unknown> | null> {
  try {
    const raw = await readFile(file, "utf8");
    const value: unknown = JSON.parse(raw);
    return value && typeof value === "object" && !Array.isArray(value)
      ? (value as Record<string, unknown>)
      : null;
  } catch {
    return null;
  }
}

function asString(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}

function dependencyNames(pkg: Record<string, unknown> | null): string[] {
  if (!pkg) return [];
  const names = new Set<string>();
  for (const field of ["dependencies", "devDependencies", "peerDependencies", "optionalDependencies"]) {
    const value = pkg[field];
    if (value && typeof value === "object" && !Array.isArray(value)) {
      for (const key of Object.keys(value)) names.add(key);
    }
  }
  return [...names].sort();
}

function detectFramework(dependencies: string[], configNames: string[], hasNextAppRouter: boolean): Framework | null {
  const deps = new Set(dependencies);
  const configs = new Set(configNames);
  if (deps.has("next") || [...configs].some((name) => /^next\.config\./.test(name))) return hasNextAppRouter ? "next-app-router" : null;
  if (deps.has("expo")) return "expo";
  if (deps.has("astro") || [...configs].some((name) => /^astro\.config\./.test(name))) return "astro";
  if (deps.has("react-router") || deps.has("react-router-dom")) return "react-router";
  if (deps.has("react") && (deps.has("vite") || [...configs].some((name) => /^vite\.config\./.test(name)))) return "react-vite";
  if (!deps.has("react") && !deps.has("next") && !deps.has("astro") && !deps.has("vite") && !deps.has("expo")) {
    if (configs.has("index.html") || configs.has("main.js") || configs.has("styles.css")) return "vanilla";
  }
  return null;
}

function detectPackageManager(pkg: Record<string, unknown> | null, files: string[]): {
  manager: PackageManager;
  source: DetectionResult["packageManagerSource"];
  warnings: string[];
} {
  const warnings: string[] = [];
  const packageManager = asString(pkg?.packageManager);
  if (packageManager) {
    const normalized = packageManager.split("@")[0] ?? "";
    if (["npm", "pnpm", "yarn", "bun"].includes(normalized)) {
      const found = normalized as PackageManager;
      const lockfiles: Record<string, PackageManager> = {
        "package-lock.json": "npm",
        "pnpm-lock.yaml": "pnpm",
        "yarn.lock": "yarn",
        "bun.lock": "bun",
        "bun.lockb": "bun"
      };
      const conflicting = Object.entries(lockfiles).filter(([name, manager]) => files.includes(name) && manager !== found);
      if (conflicting.length) warnings.push(`package.json declares ${found}, but another package-manager lockfile is present. The packageManager field takes precedence; check the repository manually.`);
      return { manager: found, source: "packageManager-field", warnings };
    }
  }

  const foundManagers = new Set<PackageManager>();
  if (files.includes("pnpm-lock.yaml")) foundManagers.add("pnpm");
  if (files.includes("yarn.lock")) foundManagers.add("yarn");
  if (files.includes("package-lock.json")) foundManagers.add("npm");
  if (files.includes("bun.lock") || files.includes("bun.lockb")) foundManagers.add("bun");
  if (foundManagers.size > 1) {
    warnings.push(`Multiple package-manager lockfiles were found (${[...foundManagers].join(", ")}). Set packageManager in package.json to make the choice explicit.`);
    return { manager: "unknown", source: "unknown", warnings };
  }
  const manager = [...foundManagers][0];
  return manager
    ? { manager, source: "lockfile", warnings }
    : { manager: "unknown", source: "unknown", warnings };
}

export async function detectProject(root: string): Promise<DetectionResult> {
  const absoluteRoot = path.resolve(root);
  const entries = await readdir(absoluteRoot, { withFileTypes: true }).catch(() => []);
  const names = entries.map((entry) => entry.name);
  const pkgPath = path.join(absoluteRoot, "package.json");
  const pkg = await readJson(pkgPath);
  const dependencies = dependencyNames(pkg);
  const relevantConfigs = names.filter((name) =>
    /^(next|astro|vite|metro|babel|jest|vitest|playwright|prettier|biome)\.config\./.test(name)
    || ["app.json", "index.html", "main.js", "styles.css", "package.json", "package-lock.json", "pnpm-lock.yaml", "yarn.lock", "bun.lock", "bun.lockb"].includes(name)
  );
  const packageResult = detectPackageManager(pkg, names);
  const hasNextAppRouter = await exists(path.join(absoluteRoot, "app")) || await exists(path.join(absoluteRoot, "src", "app"));
  const framework = detectFramework(dependencies, relevantConfigs, hasNextAppRouter);
  const frameworkLabel = framework ? FRAMEWORKS.find((item) => item.value === framework)?.label ?? framework : null;
  const warnings = [...packageResult.warnings];
  if (dependencies.includes("next") && !hasNextAppRouter) {
    warnings.push("Next.js is present but no app/ or src/app/ directory was found. This skill targets the App Router. Choose next-app-router explicitly when bootstrapping a new App Router project; Pages Router projects need a separate adapter.");
  }
  if (dependencies.includes("react-native") && !dependencies.includes("expo")) {
    warnings.push("React Native is present without Expo. The supported mobile adapter targets React Native + Expo; select it only if this repository uses Expo.");
  }
  if (names.includes("package.json") && !pkg) warnings.push("package.json exists but could not be parsed as valid JSON; package metadata was not used.");
  if (!framework && names.includes("package.json")) warnings.push("The framework could not be inferred from package metadata. Select it explicitly to avoid generating the wrong setup.");

  return {
    root: absoluteRoot,
    hasPackageJson: await exists(pkgPath),
    framework,
    frameworkLabel,
    packageManager: packageResult.manager,
    packageManagerSource: packageResult.source,
    detectedDependencies: dependencies,
    detectedConfigs: relevantConfigs,
    warnings
  };
}

export function frameworkLabel(framework: Framework): string {
  return FRAMEWORKS.find((item) => item.value === framework)?.label ?? framework;
}
