import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {describe, it} from 'node:test';
import yaml from 'js-yaml';
import {
    SONAR_COMMENT_MARKER,
    SONAR_FIX_BRANCH_PREFIX,
    SONAR_FIX_LABEL,
    combineSonarContext,
    createPullRequestBody,
    getDisallowedChangedPaths,
    getAgentInstructionChanges,
    getFindingPath,
    getPullRequestSkipReason,
    getSonarReportPullRequest
} from '../../.github/scripts/sonar-fix.mjs';

const reportBody = [
    '[2 New issues](https://sonarcloud.io/project/issues?id=vlavrynovych_msr&pullRequest=166&issueStatuses=OPEN,CONFIRMED&sinceLeakPeriod=true)',
    SONAR_COMMENT_MARKER
].join('\n');

function makePullRequest(overrides = {}) {
    return {
        state: 'open',
        title: 'Feature PR',
        author_association: 'OWNER',
        head: {ref: 'release/1.0.0', repo: {full_name: 'migration-script-runner/msr-core'}},
        labels: [],
        ...overrides
    };
}

describe('Sonar remediation helpers', () => {
    it('wires the workflow to the Sonar comment and targets the source PR head branch', async () => {
        const workflowText = await readFile(new URL('../../.github/workflows/sonarcloud-remediation.yml', import.meta.url), 'utf8');
        const workflow = yaml.load(workflowText);
        const createPrStep = workflow.jobs['create-remediation-pr'].steps.find(step => step.uses === 'peter-evans/create-pull-request@v8');
        const reportStep = workflow.jobs.prepare.steps.find(step => step.id === 'sonar-report');
        const codexStep = workflow.jobs.codex.steps.find(step => step.uses === 'openai/codex-action@v1');
        const titleWorkflowText = await readFile(new URL('../../.github/workflows/pr-validation.yml', import.meta.url), 'utf8');
        const titleWorkflow = yaml.load(titleWorkflowText);
        const titleCheckout = titleWorkflow.jobs.title.steps.find(step => step.uses === 'actions/checkout@v4');
        assert.deepEqual(workflow.on.issue_comment.types, ['created', 'edited']);
        assert.equal(createPrStep.with.base, '${{ needs.prepare.outputs.source_head_ref }}');
        assert.equal(createPrStep.with.branch, 'automation/sonar-fix/pr-${{ needs.prepare.outputs.source_pr_number }}');
        assert.equal(createPrStep.with.draft, 'always-true');
        assert.equal(createPrStep.with.labels, SONAR_FIX_LABEL);
        assert.match(reportStep.run, /\.agents\/skills\/msr-sonar-report\/scripts\/get-sonar-report\.mjs/);
        assert.equal(workflow.jobs.prepare.outputs.has_findings, '${{ steps.sonar-report.outputs.has_findings }}');
        assert.equal(codexStep.with['openai-api-key'], '${{ secrets.OMNIROUTE_API_KEY }}');
        assert.equal(codexStep.with['responses-api-endpoint'], 'https://omniroute.lavrynovych.net/v1/responses');
        assert.equal(codexStep.with.model, 'combo/github');
        assert.equal(titleCheckout.with.ref, '${{ github.event.pull_request.base.sha }}');
        assert.equal(workflow.jobs.codex.permissions.contents, 'read');
        assert.equal(workflow.jobs.codex.permissions['pull-requests'], 'read');
        assert.deepEqual(workflow.jobs['create-remediation-pr'].permissions, {contents: 'read'});
    });

    it('accepts only SonarCloud bot comments containing the expected PR report link', () => {
        const payload = {
            issue: {number: 166, pull_request: {url: 'https://api.github.com/repos/example/repo/pulls/166'}},
            comment: {user: {login: 'sonarqubecloud[bot]', id: 39514782, type: 'Bot'}, body: reportBody}
        };
        assert.equal(getSonarReportPullRequest(payload, 'vlavrynovych_msr'), 166);
        assert.equal(getSonarReportPullRequest(payload, 'another_project'), undefined);
    });

    it('rejects issue comments, untrusted authors, mismatched PRs, and incomplete reports', () => {
        const comment = {user: {login: 'sonarqubecloud[bot]', id: 39514782, type: 'Bot'}, body: reportBody};
        assert.equal(getSonarReportPullRequest({issue: {number: 166}, comment}, 'vlavrynovych_msr'), undefined);
        assert.equal(getSonarReportPullRequest({issue: {number: 166, pull_request: {}}, comment: {...comment, user: {login: 'someone', type: 'User'}}}, 'vlavrynovych_msr'), undefined);
        assert.equal(getSonarReportPullRequest({issue: {number: 166, pull_request: {}}, comment: {...comment, user: {login: 'sonarqubecloud[bot]', id: 1, type: 'Bot'}}}, 'vlavrynovych_msr'), undefined);
        assert.equal(getSonarReportPullRequest({issue: {number: 166, pull_request: {}}, comment: {...comment, body: 'Sonar report'}}, 'vlavrynovych_msr'), undefined);
        assert.equal(getSonarReportPullRequest({issue: {number: 167, pull_request: {}}, comment}, 'vlavrynovych_msr'), undefined);
    });

    it('skips generated Sonar Fix PRs by branch, label, or title before processing', () => {
        const generatedByBranch = makePullRequest({head: {ref: `${SONAR_FIX_BRANCH_PREFIX}pr-166`, repo: {full_name: 'migration-script-runner/msr-core'}}});
        const generatedByLabel = makePullRequest({labels: [{name: SONAR_FIX_LABEL}]});
        const generatedByTitle = makePullRequest({title: '[Sonar Fix] Fix findings for #166'});
        assert.match(getPullRequestSkipReason(generatedByBranch, 'migration-script-runner/msr-core'), /Sonar Fix/);
        assert.match(getPullRequestSkipReason(generatedByLabel, 'migration-script-runner/msr-core'), /Sonar Fix/);
        assert.match(getPullRequestSkipReason(generatedByTitle, 'migration-script-runner/msr-core'), /Sonar Fix/);
    });

    it('rejects closed, forked, and untrusted source PRs', () => {
        assert.match(getPullRequestSkipReason(makePullRequest({state: 'closed'}), 'migration-script-runner/msr-core'), /not open/);
        assert.match(getPullRequestSkipReason(makePullRequest({head: {ref: 'feature', repo: {full_name: 'fork/msr-core'}}}), 'migration-script-runner/msr-core'), /must belong/);
        assert.match(getPullRequestSkipReason(makePullRequest({author_association: 'CONTRIBUTOR'}), 'migration-script-runner/msr-core'), /not a repository owner/);
        assert.equal(getPullRequestSkipReason(makePullRequest(), 'migration-script-runner/msr-core'), undefined);
    });

    it('extracts safe source paths from Sonar component keys', () => {
        assert.equal(getFindingPath({component: 'vlavrynovych_msr:src/service/Runner.ts'}), 'src/service/Runner.ts');
        assert.equal(getFindingPath({component: 'vlavrynovych_msr:src/../AGENTS.md'}), undefined);
        assert.equal(getFindingPath({component: 'vlavrynovych_msr:.github/workflows/ci.yml'}), undefined);
        assert.equal(getFindingPath({}), undefined);
    });

    it('allows remediation diffs only in source, tests, and docs', () => {
        assert.deepEqual(getDisallowedChangedPaths(['src/Runner.ts', 'test/Runner.test.ts', 'docs/guide.md']), []);
        assert.deepEqual(getDisallowedChangedPaths(['.github/workflows/ci.yml', '../AGENTS.md', '/tmp/file']), ['.github/workflows/ci.yml', '../AGENTS.md', '/tmp/file']);
    });

    it('refuses Codex runs when the source PR changes agent instructions', () => {
        assert.deepEqual(getAgentInstructionChanges(['src/Runner.ts', 'AGENTS.md', 'test/AGENTS.md', '.codex/config.toml']), ['AGENTS.md', 'test/AGENTS.md', '.codex/config.toml']);
    });

    it('creates a human-review PR summary without including raw issue messages', () => {
        const body = createPullRequestBody({
            projectKey: 'vlavrynovych_msr',
            sourcePullRequest: {number: 166},
            findings: [{key: 'ISSUE-1', rule: 'typescript:S1234', severity: 'MAJOR', component: 'vlavrynovych_msr:src/file.ts', line: 12, message: 'Do not include me'}]
        }, 'migration-script-runner/msr-core');
        assert.match(body, /source PR #166/);
        assert.match(body, /ISSUE-1/);
        assert.match(body, /src\/file\.ts:12/);
        assert.match(body, /Proposed changes/);
        assert.doesNotMatch(body, /Do not include me/);
        assert.throws(() => createPullRequestBody({}, 'invalid'), /no source pull request/);
    });

    it('combines the standardized report only with matching verified PR metadata', () => {
        const sourceContext = {projectKey: 'project', sourcePullRequest: {number: 42, head: {sha: 'abc'}}};
        const report = {projectKey: 'project', organization: 'org', pullRequestNumber: 42, query: {}, findings: [{key: 'A'}]};
        assert.deepEqual(combineSonarContext(sourceContext, report), {
            projectKey: 'project', organization: 'org', sourcePullRequest: sourceContext.sourcePullRequest,
            query: {}, findings: [{key: 'A'}]
        });
        assert.throws(() => combineSonarContext(sourceContext, {...report, pullRequestNumber: 43}), /does not match/);
    });
});
