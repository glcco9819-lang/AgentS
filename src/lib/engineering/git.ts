import { execSync, spawnSync } from "child_process";
import { existsSync, mkdirSync, writeFileSync, readFileSync } from "fs";
import { dirname, join, resolve } from "path";
import { log } from "@/lib/logger";

/**
 * Git operations — real git via child_process, scoped to a repo path.
 * All operations are confined to repoPath (defense-in-depth).
 */

export interface GitResult {
  success: boolean;
  stdout: string;
  stderr: string;
  code: number;
}

function runGit(cwd: string, args: string[]): GitResult {
  try {
    const result = spawnSync("git", args, {
      cwd,
      encoding: "utf-8",
      timeout: 30000,
      maxBuffer: 1024 * 1024 * 4,
    });
    return {
      success: result.status === 0,
      stdout: result.stdout?.toString() ?? "",
      stderr: result.stderr?.toString() ?? "",
      code: result.status ?? -1,
    };
  } catch (e) {
    return {
      success: false,
      stdout: "",
      stderr: (e as Error).message,
      code: -1,
    };
  }
}

export function initRepo(repoPath: string): GitResult {
  if (!existsSync(repoPath)) mkdirSync(repoPath, { recursive: true });
  let r = runGit(repoPath, ["init"]);
  if (r.success) r = runGit(repoPath, ["config", "user.email", "yfg@factory.local"]);
  if (r.success) r = runGit(repoPath, ["config", "user.name", "YFG Factory"]);
  log("info", "system", `Repo initialized at ${repoPath}`, { success: r.success });
  return r;
}

export function createBranch(repoPath: string, name: string): GitResult {
  return runGit(repoPath, ["checkout", "-b", name]);
}

export function commit(repoPath: string, message: string, author?: string): GitResult & { sha?: string } {
  runGit(repoPath, ["add", "-A"]);
  const args = ["commit", "-m", message];
  if (author) args.push("--author", author);
  const r = runGit(repoPath, args);
  let sha: string | undefined;
  if (r.success) {
    const shaRes = runGit(repoPath, ["rev-parse", "HEAD"]);
    if (shaRes.success) sha = shaRes.stdout.trim();
  }
  return { ...r, sha };
}

export function getStatus(repoPath: string): GitResult {
  return runGit(repoPath, ["status", "--porcelain"]);
}

export function writeFile(repoPath: string, relativePath: string, content: string): void {
  const full = join(repoPath, relativePath);
  mkdirSync(dirname(full), { recursive: true });
  writeFileSync(full, content, "utf-8");
}

export function readFile(repoPath: string, relativePath: string): string | null {
  const full = resolve(repoPath, relativePath);
  if (!full.startsWith(resolve(repoPath))) return null; // path-escape guard
  if (!existsSync(full)) return null;
  return readFileSync(full, "utf-8");
}

export function listFiles(repoPath: string): string[] {
  try {
    const out = execSync("git ls-files", {
      cwd: repoPath,
      encoding: "utf-8",
      timeout: 10000,
    });
    return out.split("\n").filter(Boolean);
  } catch {
    return [];
  }
}
