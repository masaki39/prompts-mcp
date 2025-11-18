# prompts-mcp

Simple MCP server that turns Markdown files into zero-argument tools. Point it at a directory and every `.md` inside becomes a callable prompt.

## Prompt format

Each Markdown file is parsed **once at startup**. The file name becomes the tool name and the YAML frontmatter controls metadata:

```markdown
---
title: Write A Brief
description: Produce a concise project brief.
enabled: true # set to false to skip registering this prompt
---
Prompt body goes here...
```

- `title` – optional display label (falls back to file name)
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
