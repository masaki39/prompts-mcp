import type { RegisteredTool } from '@modelcontextprotocol/sdk/server/mcp.js';
import { registerPromptTools } from '../registerPrompts.js';
import type { PromptToolDefinition } from '../promptLoader.js';

function createDefinition(overrides: Partial<PromptToolDefinition> = {}): PromptToolDefinition {
    return {
        name: overrides.name ?? 'sample',
        title: overrides.title ?? 'Sample Title',
        description: overrides.description ?? 'Sample Description',
        prompt: overrides.prompt ?? 'Prompt Body',
        filePath: overrides.filePath ?? '/tmp/sample.md',
        relativePath: overrides.relativePath ?? 'sample.md',
        enabled: overrides.enabled ?? true
    };
}

function createRegisteredToolMock() {
    return {
        callback: jest.fn(),
        enable: jest.fn(),
        disable: jest.fn(),
        remove: jest.fn(),
        update: jest.fn(),
        enabled: true
    } as unknown as RegisteredTool;
}

describe('registerPromptTools', () => {
    test('registers all prompts and disables ones marked as disabled', () => {
        const enabledTool = createRegisteredToolMock();
        const disabledTool = createRegisteredToolMock();

        const registerTool = jest
            .fn()
            .mockImplementation((definitionName: string) => (definitionName === 'enabled' ? enabledTool : disabledTool));

        const server = { registerTool } as const;
        const definitions = [
            createDefinition({ name: 'enabled', enabled: true }),
            createDefinition({ name: 'disabled', enabled: false })
        ];

        const result = registerPromptTools(server, definitions);

        expect(registerTool).toHaveBeenCalledTimes(2);
        expect(enabledTool.disable).not.toHaveBeenCalled();
        expect(disabledTool.disable).toHaveBeenCalledTimes(1);
        expect(result.enabled.map(def => def.name)).toEqual(['enabled']);
        expect(result.disabled.map(def => def.name)).toEqual(['disabled']);
    });

    test('still registers tools when every prompt is disabled', () => {
        const registeredTool = createRegisteredToolMock();

        const registerTool = jest.fn().mockReturnValue(registeredTool);
        const definitions = [createDefinition({ name: 'only', enabled: false })];

        const result = registerPromptTools({ registerTool }, definitions);

        expect(registerTool).toHaveBeenCalledWith(
            'only',
            expect.objectContaining({
                title: expect.any(String),
                description: expect.any(String)
            }),
            expect.any(Function)
        );
        expect(registeredTool.disable).toHaveBeenCalledTimes(1);
        expect(result.enabled).toHaveLength(0);
        expect(result.disabled).toHaveLength(1);
    });
});
