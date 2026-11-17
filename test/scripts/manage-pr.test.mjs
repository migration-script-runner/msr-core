import assert from 'node:assert/strict';
import {describe, it} from 'node:test';
import {deriveBaseBranch, parseArgs, pullRequestLabels, validatePullRequestInput} from '../../.agents/skills/msr-github-pr/scripts/manage-pr.mjs';

describe('manage-pr helpers', () => {
    it('parses required arguments and optional base branch', () => {
        assert.deepEqual(parseArgs([
            '--issue', '175',
            '--title', '#175: Resolve findings',
            '--body-file', '/tmp/pr.md',
            '--base', 'release/1.0.0'
        ]), {
            issueNumber: 175,
            title: '#175: Resolve findings',
            bodyFile: '/tmp/pr.md',
            base: 'release/1.0.0',
            head: undefined
        });
    });

    it('requires an issue number and PR body file', () => {
        assert.throws(() => parseArgs(['--title', '#175: Resolve findings']), /--issue must be a positive integer/);
        assert.throws(() => parseArgs(['--issue', '175', '--title', '#175: Resolve findings']), /--body-file is required/);
    });

    it('derives and enforces the release branch from a versioned milestone', () => {
        assert.equal(deriveBaseBranch('v1.0.0', undefined), 'release/1.0.0');
        assert.throws(() => deriveBaseBranch('v1.0.0', 'master'), /requires base branch release\/1\.0\.0/);
    });

    it('requires an explicit base for non-versioned milestones', () => {
        assert.equal(deriveBaseBranch('Backlog', 'develop'), 'develop');
        assert.throws(() => deriveBaseBranch('Backlog', undefined), /Pass --base/);
    });

    it('copies issue labels except the investigation-needed workflow label', () => {
        assert.deepEqual(pullRequestLabels([
            '🧹 Type: Tech Debt',
            '⚡ Priority: High',
            '🔴 Test: High',
            '🔍 Needs: Investigation'
        ]), ['🧹 Type: Tech Debt', '⚡ Priority: High', '🔴 Test: High']);
    });

    it('requires a repository-formatted title and keeps issue references out of the body', () => {
        assert.doesNotThrow(() => validatePullRequestInput(175, '#175: Resolve findings', '## Summary\nFix findings.'));
        assert.throws(() => validatePullRequestInput(175, 'Resolve findings', 'Summary'), /PR title must start/);
        assert.throws(() => validatePullRequestInput(175, '#175: Resolve findings', 'Closes #175'), /link it through Development/);
        assert.doesNotThrow(() => validatePullRequestInput(175, '#175: Resolve findings', 'Discusses issue #1750.'));
    });
});
