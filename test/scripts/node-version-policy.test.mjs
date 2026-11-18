import assert from 'node:assert/strict';
import {readFileSync, readdirSync} from 'node:fs';
import path from 'node:path';
import {describe, it} from 'node:test';
import {fileURLToPath} from 'node:url';

const repositoryRoot = fileURLToPath(new URL('../..', import.meta.url));

function readRepositoryFile(relativePath) {
    return readFileSync(path.join(repositoryRoot, relativePath), 'utf8');
}

describe('Node.js support policy', () => {
    it('keeps the declared minimum, local version, and CI versions aligned', () => {
        const packageJson = JSON.parse(readRepositoryFile('package.json'));
        const packageLock = JSON.parse(readRepositoryFile('package-lock.json'));
        const testWorkflow = readRepositoryFile('.github/workflows/test.yml');
        const workflowDirectory = path.join(repositoryRoot, '.github/workflows');
        const workflowFiles = readdirSync(workflowDirectory).filter((file) => file.endsWith('.yml'));

        assert.equal(packageJson.engines.node, '>=22.0.0');
        assert.equal(packageLock.packages[''].engines.node, packageJson.engines.node);
        assert.equal(readRepositoryFile('.nvmrc').trim(), '22');
        assert.match(testWorkflow, /node-version:\s*\[22\.x,\s*26\.x\]/);
        assert.match(readRepositoryFile('.circleci/config.yml'), /cimg\/node:22\b/);

        for (const workflowFile of workflowFiles) {
            const workflow = readRepositoryFile(path.join('.github/workflows', workflowFile));
            const explicitVersions = [...workflow.matchAll(/node-version:\s*['"]?(\d+)(?:\.x)?['"]?/g)];
            for (const [, version] of explicitVersions) {
                assert(Number(version) >= 22, `${workflowFile} configures unsupported Node.js ${version}`);
            }
        }
    });
});
