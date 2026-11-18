import * as fs from 'node:fs';
import * as path from 'node:path';

type ConfigFormat = 'TOML' | 'YAML';

/**
 * Reads and parses a configuration file, then validates that its root value is an object.
 *
 * @param filePath - Path to the configuration file
 * @param format - Configuration format used in validation errors
 * @param parse - Format-specific parser
 * @returns Parsed configuration object
 * @throws Error if the file cannot be read, parsed, or does not contain an object
 */
export function parseConfigFile<T>(filePath: string, format: ConfigFormat, parse: (content: string) => unknown): T {
    try {
        const resolvedPath = path.resolve(filePath);
        const content = fs.readFileSync(resolvedPath, 'utf8');
        const parsed = parse(content);

        if (parsed === null || parsed === undefined) {
            throw new Error(`${format} file is empty or contains only null/undefined`);
        }

        if (typeof parsed !== 'object' || Array.isArray(parsed)) {
            throw new TypeError(
                `Expected ${format} file to contain an object, got ${Array.isArray(parsed) ? 'array' : typeof parsed}`
            );
        }

        return parsed as T;
    } catch (error) {
        if (error instanceof Error && error.message.startsWith(`Cannot load ${format} file`)) {
            throw error;
        }

        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        throw new Error(`Failed to load configuration from ${filePath}: ${errorMessage}`, {cause: error});
    }
}
