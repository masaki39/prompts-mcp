import { promises as fs } from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';
import type { PromptDefinition } from './types.js';

const MARKDOWN_EXTENSION = '.md';

/**
 * Recursively loads Markdown prompt files from a directory and parses their frontmatter + content.
 */
export async function loadPromptDefinitions(promptDirectory: string): Promise<PromptDefinition[]> {
    const resolvedDirectory = path.resolve(promptDirectory);
    const stats = await safeStat(resolvedDirectory);
    if (!stats || !stats.isDirectory()) {
        throw new Error(`Prompt directory "${resolvedDirectory}" does not exist or is not a directory.`);
    }

    const markdownFiles = await collectMarkdownFiles(resolvedDirectory);
    const definitions = await Promise.all(markdownFiles.map(filePath => parsePromptFile(filePath, resolvedDirectory)));

    const seenNames = new Map<string, string>();
    for (const definition of definitions) {
        if (seenNames.has(definition.generatedName)) {
            const existing = seenNames.get(definition.generatedName);
            throw new Error(
                `Duplicate prompt name "${definition.generatedName}" detected in "${existing}" and "${definition.relativePath}". This is caused by having files with the same path structure.`
            );
        }
        seenNames.set(definition.generatedName, definition.relativePath);
    }

    return definitions.sort((a, b) => a.generatedName.localeCompare(b.generatedName));
}

async function parsePromptFile(filePath: string, rootDirectory: string): Promise<PromptDefinition> {
    const raw = await fs.readFile(filePath, 'utf8');
    const parsed = matter(raw);

    // PROMPTSDIRからの相対パスを取得
    const relativePath = path.relative(rootDirectory, filePath);

    // 拡張子を除去して名前を生成（Windows対応でバックスラッシュをスラッシュに変換）
    const generatedName = relativePath
        .replace(/\.md$/i, '')
        .replace(/\\/g, '/');  // Windows対応

    // バリデーション
    validatePromptName(generatedName, relativePath);

    // frontmatterからdescriptionとenabledのみを読み込む
    const description = typeof parsed.data.description === 'string'
        ? parsed.data.description
        : `Prompt defined in ${relativePath}`;

    const enabled =
        typeof parsed.data.enabled === 'boolean'
            ? parsed.data.enabled
            : typeof parsed.data.enabled === 'string'
              ? parsed.data.enabled.toLowerCase() !== 'false'
              : true;

    return {
        generatedName,
        description,
        prompt: parsed.content.trim(),
        filePath,
        relativePath,
        enabled
    };
}

/**
 * Validates that the generated prompt name conforms to MCP specifications.
 */
function validatePromptName(name: string, relativePath: string): void {
    if (name.length === 0 || name.length > 64) {
        throw new Error(
            `Invalid prompt name length in "${relativePath}": must be 1-64 characters (got ${name.length})`
        );
    }
    if (!/^[A-Za-z0-9_\-.\/]+$/.test(name)) {
        throw new Error(
            `Invalid characters in prompt name "${name}" from "${relativePath}": only A-Z, a-z, 0-9, _, -, ., / are allowed`
        );
    }
}

async function collectMarkdownFiles(directory: string): Promise<string[]> {
    const entries = await fs.readdir(directory, { withFileTypes: true });
    const files: string[] = [];

    for (const entry of entries) {
        const fullPath = path.join(directory, entry.name);
        if (entry.isDirectory()) {
            files.push(...(await collectMarkdownFiles(fullPath)));
        } else if (entry.isFile() && entry.name.toLowerCase().endsWith(MARKDOWN_EXTENSION)) {
            files.push(fullPath);
        }
    }

    return files;
}

async function safeStat(targetPath: string) {
    try {
        return await fs.stat(targetPath);
    } catch {
        return undefined;
    }
}
