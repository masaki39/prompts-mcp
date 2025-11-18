import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { loadPromptDefinitions, type PromptToolDefinition } from './promptLoader.js';

const mcpServer = new McpServer({
    name: 'prompts-mcp',
    version: '1.0.0'
});

const PROMPTS_DIR_ENV = 'PROMPTS_DIR';

function registerPromptTool(definition: PromptToolDefinition) {
    mcpServer.registerTool(
        definition.name,
        {
            title: definition.title,
            description: definition.description,
            outputSchema: {
                name: z.string(),
                description: z.string(),
                prompt: z.string(),
                sourcePath: z.string()
            }
        },
        async () => {
            const output = {
                name: definition.name,
                description: definition.description,
                prompt: definition.prompt,
                sourcePath: definition.relativePath
            };

            return {
                content: [
                    {
                        type: 'text' as const,
                        text: definition.prompt
                    }
                ],
                structuredContent: output
            };
        }
    );
}

async function main() {
    const promptDirectory = process.env[PROMPTS_DIR_ENV];

    if (!promptDirectory) {
        throw new Error(`Environment variable ${PROMPTS_DIR_ENV} must be set to the prompt directory path.`);
    }

    const promptDefinitions = await loadPromptDefinitions(promptDirectory);

    if (promptDefinitions.length === 0) {
        console.warn(`No Markdown prompts found in directory "${promptDirectory}".`);
    }

    const enabledDefinitions = promptDefinitions.filter(definition => definition.enabled);
    const disabledDefinitions = promptDefinitions.filter(definition => !definition.enabled);

    if (disabledDefinitions.length > 0) {
        console.warn(
            `Skipping ${disabledDefinitions.length} prompt(s) disabled via frontmatter: ${disabledDefinitions
                .map(def => def.relativePath)
                .join(', ')}`
        );
    }

    for (const definition of enabledDefinitions) {
        registerPromptTool(definition);
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
