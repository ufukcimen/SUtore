#!/usr/bin/env node
import { apiDir, ensureApiVenv, run } from "./api-tools.mjs";

run(ensureApiVenv(), ["-B", "-m", "uvicorn", "app.main:app", "--reload"], {
  cwd: apiDir,
});

