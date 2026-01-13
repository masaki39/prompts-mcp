import type { RegisteredTool, RegisteredPrompt } from '@modelcontextprotocol/sdk/server/mcp.js';
import { registerPromptsAsTools, registerPromptsAsPrompts, registerPrompts } from '../registerPrompts.js';
import type { PromptDefinition, RegistrationMode } from '../types.js';

function createDefinition(overrides: Partial<PromptDefinition> = {}): PromptDefinition {
    return {
        generatedName: overrides.generatedName ?? 'sample',
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

function createRegisteredPromptMock() {
    return {
        callback: jest.fn(),
        enable: jest.fn(),
        disable: jest.fn(),
        remove: jest.fn(),
        update: jest.fn(),
        enabled: true
    } as unknown as RegisteredPrompt;
}

describe('registerPromptsAsTools', () => {
    test('registers all prompts and disables ones marked as disabled', () => {
        const enabledTool = createRegisteredToolMock();
        const disabledTool = createRegisteredToolMock();

        const registerTool = jest
            .fn()
            .mockImplementation((definitionName: string) => (definitionName === 'enabled' ? enabledTool : disabledTool));

        const server = { registerTool } as const;
        const definitions = [
            createDefinition({ generatedName: 'enabled', enabled: true }),
            createDefinition({ generatedName: 'disabled', enabled: false })
        ];

        const result = registerPromptsAsTools(server, definitions);

        expect(registerTool).toHaveBeenCalledTimes(2);
        expect(enabledTool.disable).not.toHaveBeenCalled();
        expect(disabledTool.disable).toHaveBeenCalledTimes(1);
        expect(result.enabled.map(def => def.generatedName)).toEqual(['enabled']);
        expect(result.disabled.map(def => def.generatedName)).toEqual(['disabled']);
    });

    test('still registers tools when every prompt is disabled', () => {
        const registeredTool = createRegisteredToolMock();

        const registerTool = jest.fn().mockReturnValue(registeredTool);
        const definitions = [createDefinition({ generatedName: 'only', enabled: false })];

        const result = registerPromptsAsTools({ registerTool }, definitions);

        expect(registerTool).toHaveBeenCalledWith(
            'only',
            expect.objectContaining({
                description: expect.any(String)
            }),
            expect.any(Function)
        );
        expect(registeredTool.disable).toHaveBeenCalledTimes(1);
        expect(result.enabled).toHaveLength(0);
        expect(result.disabled).toHaveLength(1);
    });
});

describe('registerPromptsAsPrompts', () => {
    test('registers prompts with correct GetPromptResult format', () => {
        const registeredPrompt = createRegisteredPromptMock();
        const registerPrompt = jest.fn().mockReturnValue(registeredPrompt);

        const server = { registerPrompt } as const;
        const definitions = [createDefinition({ generatedName: 'test-prompt' })];

        const result = registerPromptsAsPrompts(server, definitions);

        expect(registerPrompt).toHaveBeenCalledWith(
            'test-prompt',
            expect.objectContaining({
                description: expect.any(String)
            }),
            expect.any(Function)
        );
        expect(result.enabled).toHaveLength(1);
        expect(result.disabled).toHaveLength(0);
    });

    test('handles disabled prompts', () => {
        const registeredPrompt = createRegisteredPromptMock();
        const registerPrompt = jest.fn().mockReturnValue(registeredPrompt);

        const server = { registerPrompt } as const;
        const definitions = [createDefinition({ generatedName: 'disabled-prompt', enabled: false })];

        const result = registerPromptsAsPrompts(server, definitions);

        expect(registeredPrompt.disable).toHaveBeenCalledTimes(1);
        expect(result.enabled).toHaveLength(0);
        expect(result.disabled).toHaveLength(1);
    });
});

describe('registerPrompts', () => {
    test('handles "tool" mode', () => {
        const registeredTool = createRegisteredToolMock();
        const registerTool = jest.fn().mockReturnValue(registeredTool);
        const registerPrompt = jest.fn();

        const server = { registerTool, registerPrompt } as any;
        const definitions = [createDefinition()];

        registerPrompts(server, definitions, 'tool');

        expect(registerTool).toHaveBeenCalledTimes(1);
        expect(registerPrompt).not.toHaveBeenCalled();
    });

    test('handles "prompt" mode', () => {
        const registeredPrompt = createRegisteredPromptMock();
        const registerTool = jest.fn();
        const registerPrompt = jest.fn().mockReturnValue(registeredPrompt);

        const server = { registerTool, registerPrompt } as any;
        const definitions = [createDefinition()];

        registerPrompts(server, definitions, 'prompt');

        expect(registerPrompt).toHaveBeenCalledTimes(1);
        expect(registerTool).not.toHaveBeenCalled();
    });

    test('handles "both" mode', () => {
        const registeredTool = createRegisteredToolMock();
        const registeredPrompt = createRegisteredPromptMock();
        const registerTool = jest.fn().mockReturnValue(registeredTool);
        const registerPrompt = jest.fn().mockReturnValue(registeredPrompt);

        const server = { registerTool, registerPrompt } as any;
        const definitions = [createDefinition()];

        registerPrompts(server, definitions, 'both');

        expect(registerTool).toHaveBeenCalledTimes(1);
        expect(registerPrompt).toHaveBeenCalledTimes(1);
    });
});
