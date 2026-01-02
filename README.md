# prompts-mcp

![NPM Downloads](https://img.shields.io/npm/dt/%40masaki39%2Fprompts-mcp)

Simple MCP server that turns Markdown files into mcp tools, providing cutrom prompts. Point it at a directory and every `.md` inside becomes a callable prompt.

> [!important]
> Work similar with [Agent Skills](https://github.com/anthropics/skills), so format is compatible with SKILL.md

## Prompt format

Each Markdown file is parsed **once at startup**. The file name becomes the tool name and the YAML frontmatter controls metadata:

```markdown
---
name: brief
title: Write A Brief
description: Produce a concise project brief.
enabled: true
---
Prompt body goes here...
```

- `name` – optional tool name override (defaults to file name)
- `title` – optional display label (falls back to `name`)
- `description` – optional tool description (defaults to “Prompt defined in …”)
- `enabled` – defaults to `true`; set to `false` to keep the prompt out of MCP entirely

## MCP config example

Add the server to your MCP client (Claude Desktop, VS Code Copilot MCP, etc.) with a config entry like:

```json
{
  "mcpServers": {
    "prompts-mcp": {
      "command": "npx",
      "args": ["-y", "@masaki39/prompts-mcp"],
      "env": {
        "PROMPTS_DIR": "/absolute/path/to/prompts"
      }
    }
  }
}
```

Update the paths to match your system. The server communicates over stdio, so no additional ports are needed.
