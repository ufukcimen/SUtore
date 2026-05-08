#!/usr/bin/env node
import { commandName, repoRoot, run } from "./api-tools.mjs";

run(commandName("npm"), ["run", "dev"], { cwd: repoRoot });

