import assert from 'node:assert/strict';
import {describe, it} from 'node:test';
import {isValidPullRequestTitle} from '../../.github/scripts/validate-pr-title.mjs';

describe('pull request title validation', () => {
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
