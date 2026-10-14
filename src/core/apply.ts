import { lstat, mkdir, readFile, realpath, rename, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import type { PlannedFile } from "./types.js";

export interface ApplyResult {
  written: string[];
  skipped: string[];
  backedUp: string[];
}

function resolveInside(root: string, relativePath: string): string {
  const absoluteRoot = path.resolve(root);
  const absolutePath = path.resolve(absoluteRoot, relativePath);
  const relative = path.relative(absoluteRoot, absolutePath);
  if (!relative || relative.startsWith(`..${path.sep}`) || relative === ".." || path.isAbsolute(relative)) {
    throw new Error(`Unsafe generated path: ${relativePath}`);
  }
  return absolutePath;
}

async function exists(file: string): Promise<boolean> {
  try {
    await stat(file);
    return true;
  } catch {
    return false;
  }
}

async function assertNoEscapingParentSymlinks(root: string, relativePath: string): Promise<void> {
  const canonicalRoot = await realpath(root);
  const parentParts = path.dirname(relativePath).split(path.sep).filter(Boolean);
  let current = root;
  for (const part of parentParts) {
    current = path.join(current, part);
    try {
      await lstat(current);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") break;
      throw error;
    }
    const canonicalParent = await realpath(current);
    const relative = path.relative(canonicalRoot, canonicalParent);
    if (relative === ".." || relative.startsWith(`..${path.sep}`) || path.isAbsolute(relative)) {
      throw new Error(`Refusing to write through a symlink outside the project root: ${relativePath}`);
    }
  }
}

export async function applyPlan(root: string, files: PlannedFile[], force: boolean): Promise<ApplyResult> {
  await mkdir(root, { recursive: true });
  const result: ApplyResult = { written: [], skipped: [], backedUp: [] };
  const backupStamp = new Date().toISOString().replace(/[:.]/g, "-");

  for (const file of files) {
    const destination = resolveInside(root, file.path);
    await assertNoEscapingParentSymlinks(root, file.path);
    if (await exists(destination)) {
      if (!force) {
        result.skipped.push(file.path);
        continue;
      }
      const backupRelative = path.join(".setup", "backups", backupStamp, file.path);
      const backupPath = resolveInside(root, backupRelative);
      await assertNoEscapingParentSymlinks(root, backupRelative);
      await mkdir(path.dirname(backupPath), { recursive: true });
      await rename(destination, backupPath);
      result.backedUp.push(path.relative(root, backupPath));
    }

    await mkdir(path.dirname(destination), { recursive: true });
    await writeFile(destination, file.content, "utf8");
    result.written.push(file.path);
  }

  return result;
}

export async function readText(file: string): Promise<string | null> {
  try {
    return await readFile(file, "utf8");
  } catch {
    return null;
  }
}
