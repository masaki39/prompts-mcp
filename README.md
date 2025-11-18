# prompts-mcp

MCP (Model Context Protocol) server that exposes Markdown prompt files as zero-argument tools. Each `.md` file in a directory becomes an MCP tool whose output is the body of the file, letting clients reuse curated prompts directly inside an MCP-compatible IDE or agent.

## Features

- Loads prompts from a directory specified at startup via `PROMPTS_DIR`
- Parses Markdown frontmatter to populate MCP tool metadata
- Registers one tool per Markdown file with its name matching the file name
- Ships with Jest test coverage for the prompt-loading logic
- Ready for npm publishing with generated declaration files

## Requirements

- Node.js 18.17 or later
- npm 9+

## Prompt Directory

Point the server at a directory containing Markdown files via the `PROMPTS_DIR` environment variable. The directory is scanned recursively at startup and only files ending in `.md` are considered.

Each file should include YAML frontmatter for the tool metadata:

```markdown
---
title: Write A Brief
description: Produce a concise project brief given objectives and stakeholders.
---
Draft a concise project brief with the following structure:
- Objectives: {{objectives}}
- Stakeholders: {{stakeholders}}
- Deliverables: {{deliverables}}
- Timeline: {{timeline}}
```

| Field        | Source                                      |
|--------------|---------------------------------------------|
| Tool name    | Markdown file name without extension        |
| Tool title   | `title` in frontmatter (falls back to name) |
| Description  | `description` in frontmatter                |
| Prompt body  | Markdown body content                       |

## Getting Started

```bash
npm install
npm run build
PROMPTS_DIR=./examples/prompts npm start
```

The server listens over stdio. Connect using any MCP client that supports stdio transports (e.g., Claude Desktop, VS Code Copilot MCP, MCP Inspector) and ensure `PROMPTS_DIR` is set in the client's launch configuration.

> Tip: This repo ships with `examples/prompts/sample_brief.md` so you can point `PROMPTS_DIR=./examples/prompts` and verify everything works before adding your own prompts.

## Testing

```bash
npm test
```

Tests are written with Jest and cover the Markdown prompt loading behavior, including duplicate detection and error handling.

## Publishing

This package is configured for npm publishing:

- `npm run build` emits ESM output plus TypeScript declarations under `dist/`
- `package.json` marks `dist` and the README for publishing via the `files` field
- `prepare` script automatically rebuilds prior to `npm publish`

Publish with:

```bash
npm publish --access public
```

Ensure you have created the remote Git repository referenced in `package.json` (or update the metadata) before publishing.
