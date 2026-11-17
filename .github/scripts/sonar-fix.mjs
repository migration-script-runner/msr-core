import {execFileSync} from 'node:child_process';
import {randomUUID} from 'node:crypto';
import {promises as fs} from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {fetchSonarReport} from '../../.agents/skills/msr-sonar-report/scripts/get-sonar-report.mjs';

export const SONAR_BOT_LOGIN = 'sonarqubecloud[bot]';
export const SONAR_BOT_ID = 39514782;
export const SONAR_COMMENT_MARKER = '<!-- sqra-placement-anchor -->';
export const SONAR_FIX_BRANCH_PREFIX = 'automation/sonar-fix/';
export const SONAR_FIX_LABEL = '🤖 Automation: Sonar Fix';
const trustedAuthorAssociations = new Set(['OWNER', 'MEMBER', 'COLLABORATOR']);

/**
 * Finds a SonarCloud report link for this repository's configured project and PR.
 * @param {Record<string, unknown>} payload GitHub workflow event payload.
 * @param {string} projectKey SonarCloud project key.
 * @returns {number | undefined} Source PR number when the event is a qualifying report.
 */
export function getSonarReportPullRequest(payload, projectKey) {
    const issue = payload.issue;
    const comment = payload.comment;
    if (!isRecord(issue) || !isRecord(comment) || !isRecord(comment.user)) {
        return undefined;
    }

    const issueNumber = issue.number;
    const body = comment.body;
    const user = comment.user;
    const isPullRequest = isRecord(issue.pull_request);
    const isSonarBot = user.login === SONAR_BOT_LOGIN && user.id === SONAR_BOT_ID && user.type === 'Bot';
    if (!isPullRequest || !Number.isInteger(issueNumber) || !isSonarBot || typeof body !== 'string' || !body.includes(SONAR_COMMENT_MARKER)) {
        return undefined;
    }

    const reportUrl = getMatchingSonarIssueUrl(body, projectKey, issueNumber);
    return reportUrl ? issueNumber : undefined;
}

/**
 * Returns a pull request's exclusion reason before Sonar or Codex work begins.
 * @param {Record<string, unknown>} pullRequest GitHub pull request REST response.
 * @param {string} repositoryFullName Expected owner/repository name.
 * @returns {string | undefined} A skip reason, or undefined when eligible.
 */
export function getPullRequestSkipReason(pullRequest, repositoryFullName) {
    if (pullRequest.state !== 'open') {
        return 'Pull request is not open';
    }

    if (!isRecord(pullRequest.head) || !isRecord(pullRequest.head.repo) || pullRequest.head.repo.full_name !== repositoryFullName) {
        return 'Pull request head must belong to this repository';
    }

    const headRef = pullRequest.head.ref;
    if (typeof headRef !== 'string') {
        return 'Pull request head branch is missing';
    }

    const labels = Array.isArray(pullRequest.labels) ? pullRequest.labels : [];
    const hasSonarFixLabel = labels.some(label => isRecord(label) && label.name === SONAR_FIX_LABEL);
    const hasSonarFixTitle = typeof pullRequest.title === 'string' && pullRequest.title.startsWith('[Sonar Fix]');
    if (headRef.startsWith(SONAR_FIX_BRANCH_PREFIX) || hasSonarFixLabel || hasSonarFixTitle) {
        return 'Pull request is a Sonar Fix remediation PR';
    }

    if (typeof pullRequest.author_association !== 'string' || !trustedAuthorAssociations.has(pullRequest.author_association)) {
        return 'Pull request author is not a repository owner, member, or collaborator';
    }

    return undefined;
}

/**
 * Extracts the repository path from a SonarCloud component key.
 * @param {Record<string, unknown>} finding SonarCloud issue object.
 * @returns {string | undefined} Repository-relative source path.
 */
export function getFindingPath(finding) {
    if (typeof finding.component !== 'string') {
        return undefined;
    }

    const separator = finding.component.indexOf(':');
    const componentPath = (separator < 0 ? finding.component : finding.component.slice(separator + 1)).replaceAll('\\', '/');
    if (!componentPath.startsWith('src/') || componentPath.split('/').includes('..') || path.posix.isAbsolute(componentPath)) {
        return undefined;
    }

    return componentPath;
}

/**
 * Checks that generated edits remain in source, tests, and documentation.
 * @param {string[]} changedPaths Repository-relative changed file paths.
 * @returns {string[]} Paths that are outside the allowed remediation scope.
 */
export function getDisallowedChangedPaths(changedPaths) {
    return changedPaths.filter(filePath => {
        const normalized = filePath.replaceAll('\\', '/');
        const hasTraversal = normalized.split('/').includes('..');
        const isAllowedRoot = /^(src|test|docs)\//.test(normalized);
        return hasTraversal || path.posix.isAbsolute(normalized) || !isAllowedRoot;
    });
}

/**
 * Finds source pull request changes that could override trusted agent behavior.
 * @param {string[]} changedPaths Source PR paths changed relative to its base branch.
 * @returns {string[]} Paths that invalidate an automated Codex run.
 */
export function getAgentInstructionChanges(changedPaths) {
    return changedPaths.filter(filePath => /(^|\/)AGENTS\.md$|(^|\/)\.codex\//.test(filePath));
}

/**
 * Creates a concise PR body without embedding raw issue messages as executable or markdown input.
 * @param {Record<string, unknown>} context Serialized source PR and Sonar findings.
 * @param {string} repositoryFullName Repository owner/name.
 * @returns {string} Human-review summary for the remediation PR.
 */
export function createPullRequestBody(context, repositoryFullName, changedPaths = []) {
    const sourcePr = context.sourcePullRequest;
    const findings = Array.isArray(context.findings) ? context.findings.filter(isRecord) : [];
    if (!isRecord(sourcePr) || !Number.isInteger(sourcePr.number)) {
        throw new Error('Sonar remediation context has no source pull request');
    }

    const ownerRepo = repositoryFullName.split('/');
    if (ownerRepo.length !== 2) {
        throw new Error('Repository must use owner/name format');
    }

    const findingRows = findings.map(finding => {
        const issueKey = safeInline(finding.key);
        const rule = safeInline(finding.rule);
        const severity = safeInline(finding.severity ?? 'not provided');
        const filePath = safeInline(getFindingPath(finding) ?? 'source path unavailable');
        const line = Number.isInteger(finding.line) ? `:${finding.line}` : '';
        return `- \`${issueKey}\` (${severity}; rule \`${rule}\`) in \`${filePath}${line}\``;
    });
    const changedFileRows = changedPaths.map(filePath => `- \`${safeInline(filePath)}\``);

    const sourceUrl = `https://github.com/${ownerRepo[0]}/${ownerRepo[1]}/pull/${sourcePr.number}`;
    const sonarUrl = `https://sonarcloud.io/project/issues?id=${encodeURIComponent(String(context.projectKey))}&pullRequest=${sourcePr.number}&issueStatuses=OPEN%2CCONFIRMED&sinceLeakPeriod=true`;
    return [
        '## Summary',
        '',
        `This draft proposes fixes for SonarCloud findings reported on [source PR #${sourcePr.number}](${sourceUrl}).`,
        '',
        `**Findings included:** ${findings.length}`,
        '',
        ...findingRows,
        '',
        '## Proposed changes',
        '',
        'Codex proposes changes in these files:',
        ...changedFileRows,
        '',
        `[View the SonarCloud report](${sonarUrl})`,
        '',
        'Please review the changes and checks before merging. This workflow does not merge remediation PRs automatically.'
    ].join('\n');
}

/**
 * Combines trusted pull request metadata with the standardized SonarCloud report.
 * @param {Record<string, unknown>} sourceContext Verified GitHub pull request metadata.
 * @param {Record<string, unknown>} report Standardized SonarCloud report.
 * @returns {Record<string, unknown>} Context supplied to the remediation agent.
 */
export function combineSonarContext(sourceContext, report) {
    const sourcePullRequest = sourceContext.sourcePullRequest;
    const reportPullRequestNumber = report.pullRequestNumber;
    if (!isRecord(sourcePullRequest) || !Number.isInteger(sourcePullRequest.number)) {
        throw new Error('Verified context has no source pull request');
    }
    if (sourceContext.projectKey !== report.projectKey || sourcePullRequest.number !== reportPullRequestNumber || !Array.isArray(report.findings)) {
        throw new Error('Sonar report does not match the verified source pull request');
    }

    return {
        projectKey: report.projectKey,
        organization: report.organization,
        sourcePullRequest,
        query: report.query,
        findings: report.findings
    };
}

function getMatchingSonarIssueUrl(body, projectKey, pullRequestNumber) {
    const links = body.matchAll(/\]\((https:\/\/sonarcloud\.io\/project\/issues\?[^)\s]+)\)/g);
    for (const link of links) {
        try {
            const url = new URL(link[1]);
            const statuses = url.searchParams.get('issueStatuses')?.split(',') ?? [];
            const isCorrectReport = url.searchParams.get('id') === projectKey
                && url.searchParams.get('pullRequest') === String(pullRequestNumber)
                && statuses.includes('OPEN')
                && statuses.includes('CONFIRMED')
                && url.searchParams.get('sinceLeakPeriod') === 'true';
            if (isCorrectReport) {
                return url;
            }
        } catch {
            continue;
        }
    }

    return undefined;
}

function isRecord(value) {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function safeInline(value) {
    if (typeof value !== 'string') {
        return 'unknown';
    }

    return value.replaceAll('`', '\\`').replaceAll('\n', ' ').replaceAll('\r', ' ');
}

function writeOutputs(values) {
    const outputPath = process.env.GITHUB_OUTPUT;
    if (!outputPath) {
        throw new Error('GITHUB_OUTPUT is not set');
    }

    return fs.appendFile(outputPath, Object.entries(values).map(([name, value]) => `${name}=${value}`).join('\n') + '\n');
}

async function githubRequest(url, token) {
    const response = await fetch(url, {
        headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/vnd.github+json',
            'X-GitHub-Api-Version': '2022-11-28'
        }
    });
    if (!response.ok) {
        throw new Error(`GitHub API request failed with HTTP ${response.status}`);
    }

    return response.json();
}

async function prepareRun() {
    const eventPayload = JSON.parse(await fs.readFile(process.env.GITHUB_EVENT_PATH, 'utf8'));
    const eventName = process.env.GITHUB_EVENT_NAME;
    const repository = process.env.GITHUB_REPOSITORY;
    const projectKey = process.env.SONAR_PROJECT_KEY;
    let pullRequestNumber;
    let dryRun = false;

    if (eventName === 'issue_comment') {
        pullRequestNumber = getSonarReportPullRequest(eventPayload, projectKey);
    } else if (eventName === 'workflow_dispatch' && isRecord(eventPayload.inputs)) {
        pullRequestNumber = Number(eventPayload.inputs.pr_number);
        dryRun = eventPayload.inputs.dry_run === true || eventPayload.inputs.dry_run === 'true';
        if (!Number.isInteger(pullRequestNumber) || pullRequestNumber < 1) {
            throw new Error('Manual runs require a positive pull request number');
        }
    }

    if (!pullRequestNumber) {
        await writeOutputs({should_run: 'false', has_findings: 'false', dry_run: String(dryRun)});
        return;
    }

    const [owner, repositoryName] = repository.split('/');
    const apiBase = process.env.GITHUB_API_URL ?? 'https://api.github.com';
    const pullRequest = await githubRequest(`${apiBase}/repos/${owner}/${repositoryName}/pulls/${pullRequestNumber}`, process.env.GITHUB_TOKEN);
    const skipReason = getPullRequestSkipReason(pullRequest, repository);
    if (skipReason) {
        console.log(`Skipping Sonar remediation: ${skipReason}.`);
        await writeOutputs({should_run: 'false', has_findings: 'false', dry_run: String(dryRun)});
        return;
    }

    const context = {
        projectKey,
        sourcePullRequest: {
            number: pullRequestNumber,
            title: pullRequest.title,
            head: {ref: pullRequest.head.ref, sha: pullRequest.head.sha},
            base: {ref: pullRequest.base.ref, sha: pullRequest.base.sha}
        }
    };

    const contextPath = path.join(process.env.RUNNER_TEMP, 'sonar-fix-source-context.json');
    await fs.writeFile(contextPath, JSON.stringify(context, null, 2));
    await writeOutputs({
        should_run: 'true',
        source_pr_number: String(pullRequestNumber),
        source_head_ref: pullRequest.head.ref,
        source_head_sha: pullRequest.head.sha,
        dry_run: String(dryRun)
    });
}

async function combineSonarContextFiles() {
    const sourceContext = JSON.parse(await fs.readFile(process.env.SOURCE_CONTEXT_PATH, 'utf8'));
    const report = JSON.parse(await fs.readFile(process.env.SONAR_REPORT_PATH, 'utf8'));
    const combined = combineSonarContext(sourceContext, report);
    await fs.writeFile(process.env.SONAR_CONTEXT_OUTPUT, JSON.stringify(combined, null, 2));
}

function readChangedPaths(sourceDirectory) {
    const changed = execFileSync('git', ['diff', '--name-only'], {cwd: sourceDirectory, encoding: 'utf8'});
    const untracked = execFileSync('git', ['ls-files', '--others', '--exclude-standard'], {cwd: sourceDirectory, encoding: 'utf8'});
    return [...new Set(`${changed}\n${untracked}`.split('\n').filter(Boolean))];
}

async function finalizeRun() {
    const sourceDirectory = process.env.SOURCE_DIRECTORY;
    const contextPath = process.env.SONAR_CONTEXT_PATH;
    const context = JSON.parse(await fs.readFile(contextPath, 'utf8'));
    const changedPaths = readChangedPaths(sourceDirectory);
    if (changedPaths.length === 0) {
        await writeOutputs({has_changes: 'false'});
        return;
    }

    const disallowedPaths = getDisallowedChangedPaths(changedPaths);
    if (disallowedPaths.length > 0) {
        throw new Error(`Codex changed files outside src/, test/, and docs/: ${disallowedPaths.join(', ')}`);
    }

    execFileSync('git', ['add', '--intent-to-add', '--all'], {cwd: sourceDirectory});
    const patch = execFileSync('git', ['diff', '--binary', '--no-ext-diff'], {cwd: sourceDirectory, encoding: null});
    if (patch.length === 0) {
        await writeOutputs({has_changes: 'false'});
        return;
    }

    const patchPath = path.join(process.env.RUNNER_TEMP, 'sonar-fix.patch');
    await fs.writeFile(patchPath, patch);
    await writeOutputs({has_changes: 'true'});
}

async function validateSourceInstructions() {
    const context = JSON.parse(await fs.readFile(process.env.SONAR_CONTEXT_PATH, 'utf8'));
    const sourceDirectory = process.env.SOURCE_DIRECTORY;
    const sourceBaseSha = context.sourcePullRequest.base.sha;
    const sourceHeadSha = context.sourcePullRequest.head.sha;
    const instructionChanges = getAgentInstructionChanges(execFileSync('git', [
        'diff', '--name-only', `${sourceBaseSha}...${sourceHeadSha}`
    ], {cwd: sourceDirectory, encoding: 'utf8'}).split('\n').filter(Boolean));
    if (instructionChanges.length > 0) {
        throw new Error(`Refusing to run Codex on PRs that change agent instructions: ${instructionChanges.join(', ')}`);
    }
}

async function writePullRequestBody() {
    const context = JSON.parse(await fs.readFile(process.env.SONAR_CONTEXT_PATH, 'utf8'));
    const changedPaths = readChangedPaths(process.env.SOURCE_DIRECTORY);
    const disallowedPaths = getDisallowedChangedPaths(changedPaths);
    if (changedPaths.length === 0 || disallowedPaths.length > 0) {
        throw new Error('Refusing to create a Sonar Fix pull request with no changes or out-of-scope files');
    }
    const body = createPullRequestBody(context, process.env.GITHUB_REPOSITORY, changedPaths);
    const delimiter = `SONAR_PR_BODY_${randomUUID()}`;
    const outputPath = process.env.GITHUB_OUTPUT;
    await fs.appendFile(outputPath, `pr_body<<${delimiter}\n${body}\n${delimiter}\n`);
}

async function ensureLabel() {
    const repository = process.env.GITHUB_REPOSITORY;
    const token = process.env.GITHUB_TOKEN;
    const apiBase = process.env.GITHUB_API_URL ?? 'https://api.github.com';
    const response = await fetch(`${apiBase}/repos/${repository}/labels/${encodeURIComponent(SONAR_FIX_LABEL)}`, {
        headers: {Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28'}
    });
    if (response.ok) {
        console.log(`Label already exists: ${SONAR_FIX_LABEL}`);
        return;
    }
    if (response.status !== 404) {
        throw new Error(`GitHub label lookup failed with HTTP ${response.status}`);
    }

    const [owner, repositoryName] = repository.split('/');
    const labelsUrl = `${apiBase}/repos/${owner}/${repositoryName}/labels`;
    const created = await fetch(labelsUrl, {
        method: 'POST',
        headers: {Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28', 'Content-Type': 'application/json'},
        body: JSON.stringify({name: SONAR_FIX_LABEL, color: '6f42c1', description: 'Pull request generated to remediate SonarCloud findings'})
    });
    if (created.ok) {
        console.log(`Created Sonar Fix label: ${SONAR_FIX_LABEL}`);
        return;
    }
    if (created.status !== 422) {
        throw new Error(`GitHub label creation failed with HTTP ${created.status}`);
    }

    const existing = await fetch(`${apiBase}/repos/${repository}/labels/${encodeURIComponent(SONAR_FIX_LABEL)}`, {
        headers: {Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28'}
    });
    if (!existing.ok) {
        throw new Error(`Could not verify the Sonar Fix label after a concurrent creation (HTTP ${existing.status})`);
    }
    console.log(`Verified Sonar Fix label: ${SONAR_FIX_LABEL}`);
}

async function main() {
    const command = process.argv[2];
    if (command === 'prepare') {
        await prepareRun();
    } else if (command === 'finalize') {
        await finalizeRun();
    } else if (command === 'ensure-label') {
        await ensureLabel();
    } else if (command === 'validate-source') {
        await validateSourceInstructions();
    } else if (command === 'combine-context') {
        await combineSonarContextFiles();
    } else if (command === 'write-pr-body') {
        await writePullRequestBody();
    } else {
        throw new Error('Expected prepare, validate-source, finalize, ensure-label, or write-pr-body command');
    }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
    main().catch(error => {
        console.error(error.message);
        process.exitCode = 1;
    });
}
