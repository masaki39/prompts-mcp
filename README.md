# prompts-mcp

![NPM Downloads](https://img.shields.io/npm/dt/%40masaki39%2Fprompts-mcp)

Simple MCP server that turns Markdown files into MCP tools or prompts (slash commands). Point it at a directory and every `.md` file inside becomes callable.

## Features

- **Path-based naming**: File structure determines the tool/prompt name (e.g., `project/feature.md` → `project/feature`)
- **Multiple registration modes**: Register as tools, prompts (slash commands), or both
- **MCP specification compliant**: Follows [SEP-986](https://github.com/modelcontextprotocol/modelcontextprotocol/issues/986) naming conventions

## Prompt format

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

### As tools (backward compatible)
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

## Command-line options

- `--register-as=MODE` - Registration mode: `tool`, `prompt`, or `both` (default: `tool`)
  - `tool`: Register as MCP tools (backward compatible with v1.x)
  - `prompt`: Register as MCP prompts (for slash commands like `/project/feature`)
  - `both`: Register as both tools and prompts
- `--help`, `-h` - Show help message

## Environment variables

- `PROMPTS_DIR` (required) - Directory containing `.md` prompt files
- `REGISTER_AS` - Same as `--register-as` option (CLI argument takes precedence)

## Migration from 1.x

**Breaking changes in 2.0:**
- `name` and `title` frontmatter fields are no longer supported
- Names are now automatically generated from file paths
- Nested directories create namespaced names (e.g., `dir/file` instead of just `file`)

**Migration steps:**
1. Remove `name` and `title` from all frontmatter
2. Organize files into directories if you want namespaced names
3. Keep `description` and `enabled` fields as-is

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

**Using as slash commands:**
```
/brief
/review
/project/init
/project/deploy
```
