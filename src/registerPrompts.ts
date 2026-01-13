import type { McpServer, RegisteredTool, RegisteredPrompt } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { PromptDefinition, RegisterResult, RegistrationMode } from './types.js';

type ToolRegistrar = Pick<McpServer, 'registerTool'>;
type PromptRegistrar = Pick<McpServer, 'registerPrompt'>;

/**
 * Registers prompt definitions as MCP tools.
 */
export function registerPromptsAsTools(server: ToolRegistrar, definitions: PromptDefinition[]): RegisterResult {
    const enabled: PromptDefinition[] = [];
    const disabled: PromptDefinition[] = [];

    for (const definition of definitions) {
        const tool = registerPromptAsTool(server, definition);
        if (definition.enabled) {
            enabled.push(definition);
            continue;
        }

        disabled.push(definition);
        tool.disable();
    }

    return { enabled, disabled };
}

/**
 * Registers prompt definitions as MCP prompts (for slash commands).
 */
export function registerPromptsAsPrompts(server: PromptRegistrar, definitions: PromptDefinition[]): RegisterResult {
    const enabled: PromptDefinition[] = [];
    const disabled: PromptDefinition[] = [];

    for (const definition of definitions) {
        const prompt = server.registerPrompt(
            definition.generatedName,
            {
                description: definition.description
            },
            async () => ({
                description: definition.description,
                messages: [
                    {
                        role: 'user' as const,
                        content: {
                            type: 'text' as const,
                            text: definition.prompt
                        }
                    }
                ]
            })
        );

        if (definition.enabled) {
            enabled.push(definition);
        } else {
            disabled.push(definition);
            prompt.disable();
        }
    }

    return { enabled, disabled };
}

/**
 * Registers prompt definitions based on the specified registration mode.
 */
export function registerPrompts(
    server: McpServer,
    definitions: PromptDefinition[],
    mode: RegistrationMode
): RegisterResult {
    switch (mode) {
        case 'tool':
            return registerPromptsAsTools(server, definitions);
        case 'prompt':
            return registerPromptsAsPrompts(server, definitions);
        case 'both': {
            registerPromptsAsTools(server, definitions);
            return registerPromptsAsPrompts(server, definitions);
        }
    }
}

function registerPromptAsTool(server: ToolRegistrar, definition: PromptDefinition): RegisteredTool {
    return server.registerTool(
        definition.generatedName,
        {
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
                name: definition.generatedName,
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
