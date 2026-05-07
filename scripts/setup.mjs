#!/usr/bin/env node
import { copyFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import { apiDir, apiPythonPath, commandName, repoRoot } from "./api-tools.mjs";

function runChecked(command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd: options.cwd ?? repoRoot,
    stdio: "inherit",
    shell: false,
    env: process.env,
  });

  if (result.error) {
    console.error(result.error.message);
    process.exit(1);
  }

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

function findPythonCommand() {
  const candidates =
    process.platform === "win32"
      ? [
          ["py", ["-3.11"]],
          ["py", ["-3"]],
          ["python", []],
        ]
      : [
          ["python3.11", []],
          ["python3", []],
          ["python", []],
        ];

  for (const [command, args] of candidates) {
    const result = spawnSync(command, [...args, "--version"], {
      cwd: repoRoot,
      stdio: "ignore",
      shell: false,
    });
    if (result.status === 0) {
      return [command, args];
    }
  }

  console.error("Python 3.11 or newer was not found on PATH.");
  process.exit(1);
}

runChecked(commandName("npm"), ["install"]);

if (!existsSync(apiPythonPath())) {
  const [pythonCommand, pythonArgs] = findPythonCommand();
  runChecked(pythonCommand, [...pythonArgs, "-m", "venv", ".venv"], {
    cwd: apiDir,
  });
}

runChecked(apiPythonPath(), ["-m", "pip", "install", "-e", "."], { cwd: apiDir });

const envPath = join(apiDir, ".env");
if (!existsSync(envPath)) {
  copyFileSync(join(apiDir, ".env.example"), envPath);
}

