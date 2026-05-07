import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { spawn } from "node:child_process";

const scriptsDir = dirname(fileURLToPath(import.meta.url));
export const repoRoot = join(scriptsDir, "..");
export const apiDir = join(repoRoot, "apps", "api");

export function commandName(name) {
  return process.platform === "win32" ? `${name}.cmd` : name;
}

export function apiPythonPath() {
  return process.platform === "win32"
    ? join(apiDir, ".venv", "Scripts", "python.exe")
    : join(apiDir, ".venv", "bin", "python");
}

export function ensureApiVenv() {
  const python = apiPythonPath();
  if (!existsSync(python)) {
    console.error(
      "API virtual environment was not found. Run `npm.cmd run setup` on Windows or `npm run setup` on macOS/Linux first.",
    );
    process.exit(1);
  }
  return python;
}

export function run(command, args, options = {}) {
  const child = spawn(command, args, {
    cwd: options.cwd ?? repoRoot,
    stdio: "inherit",
    shell: false,
    env: process.env,
  });

  child.on("exit", (code, signal) => {
    if (signal) {
      process.kill(process.pid, signal);
      return;
    }
    process.exit(code ?? 0);
  });
}

