import type { RegistrationMode } from './types.js';

export function parseCliArgs(): {
    registerAs: RegistrationMode;
    help: boolean;
} {
    const args = process.argv.slice(2);
    let registerAs: RegistrationMode = 'tool'; // デフォルト
    let help = false;

    for (const arg of args) {
        if (arg === '--help' || arg === '-h') {
            help = true;
        } else if (arg.startsWith('--register-as=')) {
            const value = arg.split('=')[1] as RegistrationMode;
            if (['tool', 'prompt', 'both'].includes(value)) {
                registerAs = value;
            } else {
                throw new Error(`Invalid --register-as value: ${value}. Must be tool, prompt, or both.`);
            }
        }
    }

    // 環境変数からも読み込み（CLI引数が優先）
    if (args.length === 0 && process.env.REGISTER_AS) {
        const envValue = process.env.REGISTER_AS as RegistrationMode;
        if (['tool', 'prompt', 'both'].includes(envValue)) {
            registerAs = envValue;
        }
    }

    return { registerAs, help };
}

export function showHelp(): void {
    console.log(`
prompts-mcp - MCP server for Markdown prompts

Usage:
  prompts-mcp [options]

Options:
  --register-as=MODE    Registration mode: tool, prompt, or both (default: tool)
  --help, -h           Show this help message

Environment Variables:
  PROMPTS_DIR          Directory containing .md prompt files (required)
  REGISTER_AS          Same as --register-as option (CLI takes precedence)

Examples:
  # Register as tools (default, backward compatible)
  prompts-mcp

  # Register as prompts (for slash commands)
  prompts-mcp --register-as=prompt

  # Register as both tools and prompts
  prompts-mcp --register-as=both
  `);
}
