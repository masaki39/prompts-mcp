#!/usr/bin/env node
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { loadPromptDefinitions } from './promptLoader.js';
import { registerPromptTools } from './registerPrompts.js';

const mcpServer = new McpServer({
    name: 'prompts-mcp',
    version: '1.0.0'
});

const PROMPTS_DIR_ENV = 'PROMPTS_DIR';

async function main() {
    const promptDirectory = process.env[PROMPTS_DIR_ENV];

    if (!promptDirectory) {
        throw new Error(`Environment variable ${PROMPTS_DIR_ENV} must be set to the prompt directory path.`);
    }

    const promptDefinitions = await loadPromptDefinitions(promptDirectory);

    if (promptDefinitions.length === 0) {
        console.warn(`No Markdown prompts found in directory "${promptDirectory}".`);
    }

    const { enabled: enabledDefinitions, disabled: disabledDefinitions } = registerPromptTools(
        mcpServer,
        promptDefinitions
    );

    if (disabledDefinitions.length > 0) {
        console.warn(
            `Skipping ${disabledDefinitions.length} prompt(s) disabled via frontmatter: ${disabledDefinitions
                .map(def => def.relativePath)
                .join(', ')}`
        );
    }

    if (enabledDefinitions.length === 0) {
        console.warn(`All prompts are disabled via frontmatter. Server will start with zero tools.`);
    }

    const transport = new StdioServerTransport();
    await mcpServer.connect(transport);

    const shutdown = async () => {
        await mcpServer.close();
        process.exit(0);
    };

    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
}

main().catch(error => {
    console.error('Failed to start MCP server:', error);
    process.exit(1);
});
