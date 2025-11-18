import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { loadPromptDefinitions } from '../promptLoader.js';

async function createTempDir() {
    const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'prompts-mcp-test-'));
    return dir;
}

async function cleanup(dir: string) {
    await fs.rm(dir, { recursive: true, force: true });
}

describe('loadPromptDefinitions', () => {
    test('loads markdown prompts and parses metadata', async () => {
        const tempDir = await createTempDir();
        try {
            const nested = path.join(tempDir, 'nested');
            await fs.mkdir(nested, { recursive: true });

            await fs.writeFile(
                path.join(tempDir, 'alpha.md'),
                `---\ntitle: Alpha Prompt\ndescription: Alpha description\n---\nAlpha prompt body\n`
            );

            await fs.writeFile(
                path.join(nested, 'beta.md'),
                `---\ndescription: Beta description\n---\nBeta prompt body\n`
            );

            const prompts = await loadPromptDefinitions(tempDir);

            expect(prompts).toHaveLength(2);
            const alpha = prompts.find(prompt => prompt.name === 'alpha');
            const beta = prompts.find(prompt => prompt.name === 'beta');

            expect(alpha).toMatchObject({
                title: 'Alpha Prompt',
                description: 'Alpha description',
                prompt: 'Alpha prompt body',
                enabled: true
            });

            expect(beta).toMatchObject({
                title: 'beta',
                description: 'Beta description',
                prompt: 'Beta prompt body',
                relativePath: path.join('nested', 'beta.md'),
                enabled: true
            });
        } finally {
            await cleanup(tempDir);
        }
    });

    test('throws if duplicate prompt names exist', async () => {
        const tempDir = await createTempDir();
        try {
            await fs.mkdir(path.join(tempDir, 'nested'), { recursive: true });
            const fileA = path.join(tempDir, 'duplicate.md');
            const fileB = path.join(tempDir, 'nested', 'duplicate.md');

            await fs.writeFile(fileA, '---\ndescription: First\n---\nFirst content\n');
            await fs.writeFile(fileB, '---\ndescription: Second\n---\nSecond content\n');

            await expect(loadPromptDefinitions(tempDir)).rejects.toThrow(/Duplicate prompt name/);
        } finally {
            await cleanup(tempDir);
        }
    });

    test('throws if directory does not exist', async () => {
        const missingDir = path.join(os.tmpdir(), 'prompts-mcp-missing', Date.now().toString());
        await expect(loadPromptDefinitions(missingDir)).rejects.toThrow(/does not exist/);
    });

    test('respects enabled flag in frontmatter', async () => {
        const tempDir = await createTempDir();
        try {
            await fs.writeFile(
                path.join(tempDir, 'disabled.md'),
                `---\ndescription: Disabled\nenabled: false\n---\nBody\n`
            );

            const prompts = await loadPromptDefinitions(tempDir);
            expect(prompts[0]).toMatchObject({
                name: 'disabled',
                enabled: false
            });
        } finally {
            await cleanup(tempDir);
        }
    });
});
