import assert from 'node:assert/strict';
import {execFileSync, spawnSync} from 'node:child_process';
import {existsSync, mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {describe, it} from 'node:test';
import {fileURLToPath} from 'node:url';

const repositoryRoot = fileURLToPath(new URL('../..', import.meta.url));
const sampleSelectorPath = path.join(repositoryRoot, '.github/scripts/create-mutation-sample.mjs');
const reportSummarizerPath = path.join(repositoryRoot, '.github/scripts/summarize-mutation-reports.mjs');
const testSetupPath = path.join(repositoryRoot, 'test/setup.ts');
const tsNodeRegisterPath = path.join(repositoryRoot, 'node_modules/ts-node/register');

function selectSample(seed, count) {
    const output = execFileSync(process.execPath, [sampleSelectorPath, '--count', String(count), '--seed', String(seed)], {
        cwd: repositoryRoot,
        encoding: 'utf8'
    });
    return JSON.parse(output);
}

function writeMutationReport(directory, mutants) {
    const reportDirectory = path.join(directory, 'reports/mutation');
    mkdirSync(reportDirectory, {recursive: true});
    writeFileSync(path.join(reportDirectory, 'mutation.json'), JSON.stringify({
        files: {
            'src/sample.ts': {mutants: mutants.map((status) => ({status}))}
        }
    }));
}

describe('mutation workflow helpers', () => {
    it('creates runtime directories in the test runner working directory', () => {
        const directory = mkdtempSync(path.join(tmpdir(), 'msr-mutation-sandbox-'));
        try {
            const result = spawnSync(process.execPath, [
                '--require', tsNodeRegisterPath,
                '--require', testSetupPath,
                '--eval', ''
            ], {cwd: directory, encoding: 'utf8'});

            assert.equal(result.status, 0, result.stderr);
            assert.equal(existsSync(path.join(directory, 'backups')), true);
        } finally {
            rmSync(directory, {recursive: true, force: true});
        }
    });

    it('randomly selects the requested number of tracked source files reproducibly', () => {
        const sample = selectSample(12345, 5);
        assert.deepEqual(sample, selectSample(12345, 5));

        const trackedFiles = execFileSync('git', ['ls-files', '-z', '--', 'src'], {
            cwd: repositoryRoot,
            encoding: 'utf8'
        }).split('\0').filter((file) => file.endsWith('.ts') && file !== 'src/index.ts');

        assert.equal(sample.candidateCount, trackedFiles.length);
        assert.equal(sample.files.length, 5);
        assert.equal(new Set(sample.files).size, sample.files.length);
        assert(sample.files.every((file) => trackedFiles.includes(file)));
    });

    it('rejects a sample larger than the current candidate pool', () => {
        const result = spawnSync(process.execPath, [sampleSelectorPath, '--count', '9999', '--seed', '1'], {
            cwd: repositoryRoot,
            encoding: 'utf8'
        });
        assert.notEqual(result.status, 0);
        assert.match(result.stderr, /--count cannot exceed the/);
    });

    it('combines report metrics and records which files were sampled', () => {
        const directory = mkdtempSync(path.join(tmpdir(), 'msr-mutation-reports-'));
        const summaryPath = path.join(directory, 'summary.md');
        try {
            writeMutationReport(directory, ['Killed', 'Survived', 'Killed', 'Timeout', 'NoCoverage', 'RuntimeError']);
            const result = spawnSync(process.execPath, [reportSummarizerPath, directory], {
                cwd: repositoryRoot,
                encoding: 'utf8',
                env: {
                    ...process.env,
                    GITHUB_STEP_SUMMARY: summaryPath,
                    MUTATION_SAMPLE_FILES: 'src/one.ts,src/two.ts',
                    MUTATION_POOL_SIZE: '149',
                    MUTATION_SEED: '12345'
                }
            });

            assert.equal(result.status, 0);
            assert.match(result.stdout, /Mutation score \| 60\.00%/);
            assert.match(result.stdout, /Compile\/runtime errors \(excluded from score\) \| 1/);
            assert.match(result.stdout, /Selected files \(2\): src\/one\.ts, src\/two\.ts/);
            assert.match(readFileSync(summaryPath, 'utf8'), /Random seed: 12345/);
        } finally {
            rmSync(directory, {recursive: true, force: true});
        }
    });

    it('fails clearly when the mutation report is missing', () => {
        const directory = mkdtempSync(path.join(tmpdir(), 'msr-mutation-missing-'));
        try {
            const result = spawnSync(process.execPath, [reportSummarizerPath, directory], {
                cwd: repositoryRoot,
                encoding: 'utf8'
            });
            assert.notEqual(result.status, 0);
            assert.match(result.stderr, /Expected one mutation report, found 0/);
        } finally {
            rmSync(directory, {recursive: true, force: true});
        }
    });
});
