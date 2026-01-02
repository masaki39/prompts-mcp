import { promises as fs } from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';

export type PromptToolDefinition = {
    name: string;
    title: string;
    description: string;
    prompt: string;
    filePath: string;
    relativePath: string;
    enabled: boolean;
};

const MARKDOWN_EXTENSION = '.md';

/**
 * Recursively loads Markdown prompt files from a directory and parses their frontmatter + content.
 */
export async function loadPromptDefinitions(promptDirectory: string): Promise<PromptToolDefinition[]> {
    const resolvedDirectory = path.resolve(promptDirectory);
    const stats = await safeStat(resolvedDirectory);
    if (!stats || !stats.isDirectory()) {
        throw new Error(`Prompt directory "${resolvedDirectory}" does not exist or is not a directory.`);
    }

    const markdownFiles = await collectMarkdownFiles(resolvedDirectory);
    const definitions = await Promise.all(markdownFiles.map(filePath => parsePromptFile(filePath, resolvedDirectory)));

    const seenNames = new Map<string, string>();
    for (const definition of definitions) {
        if (seenNames.has(definition.name)) {
            const existing = seenNames.get(definition.name);
            throw new Error(
                `Duplicate prompt name "${definition.name}" detected in "${existing}" and "${definition.relativePath}". Please ensure unique file names.`
            );
        }
        seenNames.set(definition.name, definition.relativePath);
    }

    return definitions.sort((a, b) => a.name.localeCompare(b.name));
}

async function parsePromptFile(filePath: string, rootDirectory: string): Promise<PromptToolDefinition> {
    const raw = await fs.readFile(filePath, 'utf8');
    const parsed = matter(raw);
    const name = typeof parsed.data.name === 'string' && parsed.data.name.trim().length > 0 ? parsed.data.name : path.basename(filePath, path.extname(filePath));
    const relativePath = path.relative(rootDirectory, filePath);
    const description = typeof parsed.data.description === 'string' ? parsed.data.description : `Prompt defined in ${relativePath}`;
    const title =
        typeof parsed.data.title === 'string' && parsed.data.title.trim().length > 0 ? parsed.data.title : name;
    const enabled =
        typeof parsed.data.enabled === 'boolean'
            ? parsed.data.enabled
            : typeof parsed.data.enabled === 'string'
              ? parsed.data.enabled.toLowerCase() !== 'false'
              : true;

    return {
        name,
        title,
        description,
        prompt: parsed.content.trim(),
        filePath,
        relativePath,
        enabled
    };
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
