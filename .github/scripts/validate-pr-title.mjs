import {pathToFileURL} from 'node:url';

const taskTitlePattern = /^#[1-9][0-9]*: [A-Z].+$/;
const releaseTitlePattern = /^Release v[0-9]+\.[0-9]+\.[0-9]+$/;
const sonarFixBranchPattern = /^automation\/sonar-fix\/pr-([1-9][0-9]*)$/;

/**
 * Checks a pull request title against repository conventions.
 * Sonar remediation pull requests use a dedicated title, but only from their reserved head branch.
 * @param {string} title Pull request title.
 * @param {string} headRef Pull request head branch name.
 * @returns {boolean} Whether the title is allowed.
 */
export function isValidPullRequestTitle(title, headRef) {
    if (taskTitlePattern.test(title) || releaseTitlePattern.test(title)) {
        return true;
    }

    const branchMatch = sonarFixBranchPattern.exec(headRef);
    return branchMatch !== null && title === `[Sonar Fix] Fix findings for #${branchMatch[1]}`;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
    const title = process.env.PR_TITLE ?? '';
    const headRef = process.env.PR_HEAD_REF ?? '';

    if (isValidPullRequestTitle(title, headRef)) {
        process.exit(0);
    }

    console.error('Use "#<issue>: <imperative title>", "Release vX.Y.Z", or the approved Sonar Fix title on its reserved branch.');
    process.exit(1);
}
