# prompts-mcp

![NPM Downloads](https://img.shields.io/npm/dt/%40masaki39%2Fprompts-mcp)

Simple MCP server that turns Markdown files into MCP tools or prompts (slash commands).

# Prompt format

Each Markdown file is parsed **once at startup**. The file path becomes the tool/prompt name:

- **Root level**: `file.md` → `file`
- **Nested**: `project/feature.md` → `project/feature`

YAML frontmatter controls metadata:

```markdown
---
description: Produce a concise project brief.
enabled: true
---
Prompt body goes here...
```

- `description` – optional tool/prompt description (defaults to "Prompt defined in …")
- `enabled` – defaults to `true`; set to `false` to disable

## MCP config examples

### As tools

```json
{
  "mcpServers": {
    "prompts-mcp": {
      "command": "npx",
      "args": ["-y", "@masaki39/prompts-mcp@latest"],
      "env": {
        "PROMPTS_DIR": "/absolute/path/to/prompts"
      }
    }
  }
}
```

### As prompts (slash commands)

```json
{
  "mcpServers": {
    "prompts-mcp": {
      "command": "npx",
      "args": [
        "-y",
        "@masaki39/prompts-mcp@latest",
        "--register-as=prompt"
      ],
      "env": {
        "PROMPTS_DIR": "/absolute/path/to/prompts"
      }
    }
  }
}
```

### As both tools and prompts

```json
{
  "mcpServers": {
    "prompts-mcp": {
      "command": "npx",
      "args": [
        "-y",
        "@masaki39/prompts-mcp@latest",
        "--register-as=both"
      ],
      "env": {
        "PROMPTS_DIR": "/absolute/path/to/prompts"
      }
    }
  }
}
```

## Examples

**File structure:**

```
prompts/
├── brief.md           → brief
├── review.md          → review
└── project/
    ├── init.md        → project/init
    └── deploy.md      → project/deploy
```

**Using as MCP tool/prompts :**

```
/brief
/review
/project/init
/project/deploy
```
