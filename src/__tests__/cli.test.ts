import { parseCliArgs } from '../cli.js';

describe('parseCliArgs', () => {
    let originalArgv: string[];
    let originalEnv: NodeJS.ProcessEnv;

    beforeEach(() => {
        originalArgv = process.argv;
        originalEnv = process.env;
        process.env = { ...originalEnv };
    });

    afterEach(() => {
        process.argv = originalArgv;
        process.env = originalEnv;
    });

    test('defaults to tool mode', () => {
        process.argv = ['node', 'index.js'];
        const result = parseCliArgs();
        expect(result.registerAs).toBe('tool');
        expect(result.help).toBe(false);
    });

    test('parses --register-as=prompt flag', () => {
        process.argv = ['node', 'index.js', '--register-as=prompt'];
        const result = parseCliArgs();
        expect(result.registerAs).toBe('prompt');
    });

    test('parses --register-as=both flag', () => {
        process.argv = ['node', 'index.js', '--register-as=both'];
        const result = parseCliArgs();
        expect(result.registerAs).toBe('both');
    });

    test('parses --help flag', () => {
        process.argv = ['node', 'index.js', '--help'];
        const result = parseCliArgs();
        expect(result.help).toBe(true);
    });

    test('parses -h flag', () => {
        process.argv = ['node', 'index.js', '-h'];
        const result = parseCliArgs();
        expect(result.help).toBe(true);
    });

    test('throws on invalid mode', () => {
        process.argv = ['node', 'index.js', '--register-as=invalid'];
        expect(() => parseCliArgs()).toThrow(/Invalid --register-as value/);
    });

    test('reads from REGISTER_AS env var when no CLI args', () => {
        process.argv = ['node', 'index.js'];
        process.env.REGISTER_AS = 'prompt';
        const result = parseCliArgs();
        expect(result.registerAs).toBe('prompt');
    });

    test('CLI arg takes precedence over env var', () => {
        process.argv = ['node', 'index.js', '--register-as=tool'];
        process.env.REGISTER_AS = 'prompt';
        const result = parseCliArgs();
        expect(result.registerAs).toBe('tool');
    });
});
