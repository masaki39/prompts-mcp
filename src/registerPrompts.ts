import type { McpServer, RegisteredTool } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { PromptToolDefinition } from './promptLoader.js';

type ToolRegistrar = Pick<McpServer, 'registerTool'>;

export type RegisterPromptResult = {
    enabled: PromptToolDefinition[];
    disabled: PromptToolDefinition[];
};

/**
 * Registers all prompt definitions on the provided MCP server and toggles disabled prompts off.
 */
export function registerPromptTools(server: ToolRegistrar, definitions: PromptToolDefinition[]): RegisterPromptResult {
    const enabled: PromptToolDefinition[] = [];
    const disabled: PromptToolDefinition[] = [];

    for (const definition of definitions) {
        const tool = registerPromptTool(server, definition);
        if (definition.enabled) {
            enabled.push(definition);
            continue;
        }

        disabled.push(definition);
        tool.disable();
    }

    return { enabled, disabled };
}

function registerPromptTool(server: ToolRegistrar, definition: PromptToolDefinition): RegisteredTool {
    return server.registerTool(
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
