import { spawn } from "node:child_process";
import { access, readFile } from "node:fs/promises";
import path from "node:path";
import type { Framework, MotionEngine, PackageManager } from "./types.js";

export interface InstallPlan {
  command: string;
  args: string[];
  packages: string[];
  display: string;
}

const REACT_FRAMEWORKS = new Set<Framework>(["next-app-router", "react-vite", "react-router"]);

export function missingMotionDependencies(
  framework: Framework,
  engine: MotionEngine,
  installedDependencies: string[]
): string[] {
  const installed = new Set(installedDependencies);
  let required: string[] = [];

  if (framework === "expo") {
    if (engine !== "reanimated") return [];
    required = ["react-native-reanimated", "react-native-worklets"];
  } else {
    if (engine !== "gsap") return [];
    required = REACT_FRAMEWORKS.has(framework) ? ["gsap", "@gsap/react"] : ["gsap"];
  }

  return required.filter((name) => !installed.has(name));
}

function planCommand(framework: Framework, packages: string[], manager: PackageManager): Omit<InstallPlan, "packages" | "display"> {
  if (framework === "expo") {
    switch (manager) {
      case "npm": return { command: "npx", args: ["expo", "install", ...packages] };
      case "pnpm": return { command: "pnpm", args: ["expo", "install", ...packages] };
      case "yarn": return { command: "yarn", args: ["expo", "install", ...packages] };
      case "bun": return { command: "bun", args: ["expo", "install", ...packages] };
      default: throw new Error("Choose a package manager before installing Expo dependencies.");
    }
  }

  switch (manager) {
    case "npm": return { command: "npm", args: ["install", ...packages] };
    case "pnpm": return { command: "pnpm", args: ["add", ...packages] };
    case "yarn": return { command: "yarn", args: ["add", ...packages] };
    case "bun": return { command: "bun", args: ["add", ...packages] };
    default: throw new Error("Choose a package manager before installing dependencies.");
  }
}

export function createInstallPlan(
  framework: Framework,
  packages: string[],
  manager: PackageManager
): InstallPlan | null {
  if (packages.length === 0) return null;
  const base = planCommand(framework, packages, manager);
  const argsDisplay = base.args.map((part) => /[^a-zA-Z0-9_./@:-]/.test(part) ? JSON.stringify(part) : part).join(" ");
  return { ...base, packages, display: `${base.command} ${argsDisplay}` };
}

export async function hasPackageManifest(root: string): Promise<boolean> {
  try {
    await access(path.join(root, "package.json"));
    return true;
  } catch {
    return false;
  }
}

export async function installDependencies(root: string, plan: InstallPlan): Promise<void> {
  const manifestPath = path.join(root, "package.json");
  let manifest: unknown;
  try {
    manifest = JSON.parse(await readFile(manifestPath, "utf8")) as unknown;
  } catch {
    throw new Error("Dependency installation requires a valid package.json. Create the framework project first, then rerun setup init.");
  }
  if (!manifest || typeof manifest !== "object" || Array.isArray(manifest)) {
    throw new Error("package.json must contain a JSON object before dependencies can be installed.");
  }

  await new Promise<void>((resolve, reject) => {
    const child = spawn(plan.command, plan.args, {
      cwd: root,
      stdio: "inherit",
      // Windows package-manager shims are commonly .cmd files. Arguments here come only
      // from an allow-listed package manager and fixed package names, never user input.
      shell: process.platform === "win32"
    });
    child.once("error", reject);
    child.once("close", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${plan.command} exited with code ${code ?? "unknown"}. Generated files remain in place; rerun the install command shown above after resolving the package-manager error.`));
    });
  });
}
