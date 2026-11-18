import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {describe, it} from 'node:test';
import {fileURLToPath} from 'node:url';
import {isValidPullRequestTitle, shouldValidatePullRequestTitle} from '../../.github/scripts/validate-pr-title.mjs';

const validatorPath = fileURLToPath(new URL('../../.github/scripts/validate-pr-title.mjs', import.meta.url));

describe('pull request title validation', () => {
    it('skips title validation only for Dependabot-authored pull requests', () => {
        assert.equal(shouldValidatePullRequestTitle('dependabot[bot]'), false);
        assert.equal(shouldValidatePullRequestTitle('vlavrynovych'), true);
        assert.equal(shouldValidatePullRequestTitle(''), true);
    });

    it('skips a generated Dependabot title in the CLI validator', () => {
        const result = spawnSync(process.execPath, [validatorPath], {
            encoding: 'utf8',
            env: {
                ...process.env,
                PR_AUTHOR: 'dependabot[bot]',
                PR_TITLE: 'Bump lodash from 4.17.21 to 4.17.23',
                PR_HEAD_REF: 'dependabot/npm_and_yarn/lodash-4.17.23'
            }
        });

        assert.equal(result.status, 0);
        assert.match(result.stdout, /Skipping title validation for Dependabot pull requests/);
    });

    it('allows issue-formatted task titles', () => {
        assert.equal(isValidPullRequestTitle('#178: Add remediation workflow', 'feature/workflow'), true);
    });

    it('allows release titles', () => {
        assert.equal(isValidPullRequestTitle('Release v1.0.0', 'release/1.0.0'), true);
    });

    it('allows the exact Sonar Fix title only on the matching reserved branch', () => {
        assert.equal(isValidPullRequestTitle('[Sonar Fix] Fix findings for #166', 'automation/sonar-fix/pr-166'), true);
        assert.equal(isValidPullRequestTitle('[Sonar Fix] Fix findings for #167', 'automation/sonar-fix/pr-166'), false);
        assert.equal(isValidPullRequestTitle('[Sonar Fix] Fix findings for #166', 'feature/sonar-fix'), false);
    });

    it('rejects unrelated title formats', () => {
        assert.equal(isValidPullRequestTitle('Fix findings', 'automation/sonar-fix/pr-166'), false);
        assert.equal(isValidPullRequestTitle('', ''), false);
    });
});
