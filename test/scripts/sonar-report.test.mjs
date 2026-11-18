import assert from 'node:assert/strict';
import {describe, it} from 'node:test';
import {
    DEFAULT_SONAR_ORGANIZATION,
    DEFAULT_SONAR_PROJECT_KEY,
    buildSonarIssueSearchUrl,
    fetchSonarReport,
    formatSonarReportMarkdown,
    parseArguments
} from '../../.agents/skills/msr-sonar-report/scripts/get-sonar-report.mjs';

describe('MSR SonarCloud report helper', () => {
    it('builds the complete paged issue query used by the repository workflow', () => {
        const url = buildSonarIssueSearchUrl('project', 'org', 166, 2, 50);
        assert.equal(url.origin, 'https://sonarcloud.io');
        assert.equal(url.pathname, '/api/issues/search');
        assert.equal(url.searchParams.get('pullRequest'), '166');
        assert.equal(url.searchParams.get('componentKeys'), 'project');
        assert.equal(url.searchParams.get('organization'), 'org');
        assert.equal(url.searchParams.get('p'), '2');
        assert.equal(url.searchParams.get('ps'), '50');
        assert.equal(url.searchParams.get('issueStatuses'), 'OPEN,CONFIRMED');
        assert.equal(url.searchParams.get('sinceLeakPeriod'), 'true');
        assert.equal(url.searchParams.get('s'), 'IMPACT_RANK');
        assert.equal(url.searchParams.get('facets'), 'impactSoftwareQualities,impactSeverities');
        assert.equal(url.searchParams.get('additionalFields'), '_all');
    });

    it('retrieves every result page without any Sonar authorization token', async () => {
        const requests = [];
        const pages = [
            {paging: {total: 3}, issues: [{key: 'A'}, {key: 'B'}]},
            {paging: {total: 3}, issues: [{key: 'C'}]}
        ];
        const report = await fetchSonarReport({
            projectKey: 'project', organization: 'org', pullRequestNumber: 166, pageSize: 2,
            fetchImpl: async (url, options) => {
                requests.push({url: String(url), options});
                return {ok: true, json: async () => pages[requests.length - 1]};
            }
        });
        assert.equal(report.total, 3);
        assert.deepEqual(report.findings.map(finding => finding.key), ['A', 'B', 'C']);
        assert.equal(report.pullRequestNumber, 166);
        assert.equal(requests.length, 2);
        assert.match(requests[0].url, /p=1/);
        assert.match(requests[1].url, /p=2/);
        assert.deepEqual(requests[0].options.headers, {Accept: 'application/json'});
    });

    it('supports SonarCloud responses with a legacy top-level total', async () => {
        const report = await fetchSonarReport({
            projectKey: 'project', organization: 'org', pullRequestNumber: 1,
            fetchImpl: async () => ({ok: true, json: async () => ({total: 1, issues: [{key: 'A'}]})})
        });
        assert.equal(report.total, 1);
        assert.equal(report.findings[0].key, 'A');
    });

    it('fails closed for HTTP errors, malformed data, count changes, missing pages, and duplicates', async () => {
        const base = {projectKey: 'project', organization: 'org', pullRequestNumber: 1};
        await assert.rejects(fetchSonarReport({...base, fetchImpl: async () => ({ok: false, status: 403})}), /HTTP 403/);
        await assert.rejects(fetchSonarReport({...base, fetchImpl: async () => ({ok: true, json: async () => ({issues: []})})}), /invalid response/);
        let emptyPage = 0;
        await assert.rejects(fetchSonarReport({...base, pageSize: 1, fetchImpl: async () => ({ok: true, json: async () => ({paging: {total: 2}, issues: ++emptyPage === 1 ? [{key: 'A'}] : []})})}), /fewer findings/);
        let changingPage = 0;
        await assert.rejects(fetchSonarReport({...base, pageSize: 1, fetchImpl: async () => ({ok: true, json: async () => ({paging: {total: ++changingPage === 1 ? 2 : 3}, issues: [{key: `A${changingPage}`}]})})}), /count changed/);
        await assert.rejects(fetchSonarReport({...base, pageSize: 1, fetchImpl: async () => ({ok: true, json: async () => ({paging: {total: 2}, issues: [{key: 'A'}]})})}), /duplicate finding/);
    });

    it('validates PR number, page size, output format, and arguments', () => {
        assert.deepEqual(parseArguments(['--pr', '166']), {
            pullRequestNumber: 166,
            projectKey: DEFAULT_SONAR_PROJECT_KEY,
            organization: DEFAULT_SONAR_ORGANIZATION,
            pageSize: 50,
            format: 'markdown',
            outputPath: undefined
        });
        assert.equal(parseArguments(['--pull-request', '7', '--project', 'p', '--organization', 'o', '--page-size', '25', '--format', 'json', '--output', '/tmp/report.json']).pageSize, 25);
        assert.throws(() => parseArguments([]), /positive pull request number/);
        assert.throws(() => parseArguments(['--pr', '0']), /positive pull request number/);
        assert.throws(() => parseArguments(['--pr', '1', '--page-size', '0']), /page-size/);
        assert.throws(() => parseArguments(['--pr', '1', '--format', 'xml']), /format/);
        assert.throws(() => parseArguments(['--pr']), /value after/);
        assert.throws(() => parseArguments(['--pr', '1', '--unknown', 'x']), /Unknown argument/);
    });

    it('renders all key finding fields as readable Markdown and escapes content', () => {
        const markdown = formatSonarReportMarkdown({
            pullRequestNumber: 166,
            projectKey: 'project',
            organization: 'org',
            pageSize: 50,
            total: 1,
            findings: [{
                key: 'ISSUE-1', rule: 'typescript:S1234', severity: 'HIGH',
                impacts: [{softwareQuality: 'RELIABILITY', severity: 'HIGH'}],
                component: 'project:src/Runner.ts', line: 12, message: 'Unsafe <value> | `input`'
            }]
        });
        assert.match(markdown, /SonarCloud findings for PR #166/);
        assert.match(markdown, /ISSUE-1 — HIGH/);
        assert.match(markdown, /typescript:S1234/);
        assert.match(markdown, /src\/Runner\.ts:12/);
        assert.match(markdown, /RELIABILITY/);
        assert.match(markdown, /Unsafe &lt;value&gt; \\| \\`input\\`/);
    });

    it('reports empty findings clearly', () => {
        const markdown = formatSonarReportMarkdown({pullRequestNumber: 3, projectKey: 'p', organization: 'o', pageSize: 50, total: 0, findings: []});
        assert.match(markdown, /No open or confirmed findings/);
    });
});
