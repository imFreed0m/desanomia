---
description: Autonomous Memory Provider Failover protocol for claude-mem when token quota or allowance is exhausted.
globs: ["*"]
always_on: true
---

# Autonomous Memory Provider Routing & Failover Invariant

## Topology & Roles
* **Primary Provider**: `openrouter` (Local Host 2 `lenovo-latop` Ollama at `http://100.125.131.95:11434/v1`, model `qwen2.5-coder:3b-8k`). 100% private and zero external API quota dependency.
* **Automated Helper**: `gemini` (Cloud Google standard tier, model `gemini-3.5-flash-lite`). Fast high-capacity assistant for deep transcripts or when local node is under load.

## Autonomous Switching Protocol
When local Ollama connection fails, times out, or triggers context overflow warnings:
1. Immediately edit `~/.claude-mem/settings.json` with `replace_file_content` to switch `CLAUDE_MEM_PROVIDER` to `"gemini"`.
2. Do **not** restart the worker (it reloads configuration dynamically).
3. Print a single-line confirmation at the start of the response acknowledging the helper routing.

When running on `gemini` and quota or rate limit warnings appear, or when local Host 2 is verified healthy:
1. Toggle `CLAUDE_MEM_PROVIDER` back to `"openrouter"`.
2. Do **not** restart the worker.
3. Print a single-line confirmation acknowledging return to local inference.
