#!/usr/bin/env node
import { apiDir, ensureApiVenv, run } from "./api-tools.mjs";

run(ensureApiVenv(), ["-m", "pytest"], { cwd: apiDir });

