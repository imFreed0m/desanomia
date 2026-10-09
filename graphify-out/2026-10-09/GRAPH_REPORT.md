# Graph Report - desanomia  (2026-10-01)

## Corpus Check
- Corpus is ~440 words - fits in a single context window. You may not need a graph.

## Summary
- 4 nodes · 3 edges · 2 communities (0 shown, 2 thin omitted)
- Extraction: 0% EXTRACTED · 100% INFERRED · 0% AMBIGUOUS · INFERRED: 3 edges (avg confidence: 1.0)
- Token cost: 100 input · 150 output

## Community Hubs (Navigation)
- Session & Context Memory
- MCP Integration

## God Nodes (most connected - your core abstractions)
1. `Session Start Protocol` - 2 edges
2. `OpenViking Context Database` - 2 edges
3. `OpenViking MCP Endpoint` - 1 edges
4. `Memory Fallback Hierarchy` - 1 edges

## Surprising Connections (you probably didn't know these)
- `Session Start Protocol` --queries_memory_from--> `OpenViking Context Database`  [INFERRED]
  .agents/rules/session_start_protocol.md → .agents/rules/session_start_protocol.md  _Bridges community 0 → community 1_

## Communities (2 total, 2 thin omitted)

## Knowledge Gaps
- **2 isolated node(s):** `OpenViking MCP Endpoint`, `Memory Fallback Hierarchy`
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 2 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **2 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Session Start Protocol` connect `Session & Context Memory` to `MCP Integration`?**
  _High betweenness centrality (0.667) - this node is a cross-community bridge._
- **Why does `OpenViking Context Database` connect `MCP Integration` to `Session & Context Memory`?**
  _High betweenness centrality (0.667) - this node is a cross-community bridge._
- **Are the 2 inferred relationships involving `Session Start Protocol` (e.g. with `Memory Fallback Hierarchy` and `OpenViking Context Database`) actually correct?**
  _`Session Start Protocol` has 2 INFERRED edges - model-reasoned connections that need verification._
- **Are the 2 inferred relationships involving `OpenViking Context Database` (e.g. with `OpenViking MCP Endpoint` and `Session Start Protocol`) actually correct?**
  _`OpenViking Context Database` has 2 INFERRED edges - model-reasoned connections that need verification._
- **What connects `OpenViking MCP Endpoint`, `Memory Fallback Hierarchy` to the rest of the system?**
  _2 weakly-connected nodes found - possible documentation gaps or missing edges._