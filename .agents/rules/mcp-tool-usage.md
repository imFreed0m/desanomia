# MCP Tool Usage

Use only when invoking a lazy-loaded MCP tool whose schema is not already known.

- Never guess tool parameter names or argument shapes.
- Inspect the tool's local JSON schema before calling it.
- Use the schema as the source of truth for the invocation.
- If the schema is unavailable, do not fabricate parameters.
