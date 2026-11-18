#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const reportsDirectory = process.argv[2];
if (!reportsDirectory) {
  throw new Error('Usage: summarize-mutation-reports.mjs <reports-directory>');
}

const reportPaths = [];
function collectReports(directory) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      collectReports(entryPath);
    } else if (entry.name === 'mutation.json') {
      reportPaths.push(entryPath);
    }
  }
}
collectReports(reportsDirectory);
if (reportPaths.length !== 1) {
  throw new Error(`Expected one mutation report, found ${reportPaths.length}`);
}

const counts = new Map();
for (const reportPath of reportPaths) {
  const report = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
  for (const file of Object.values(report.files)) {
    for (const mutant of file.mutants) {
      counts.set(mutant.status, (counts.get(mutant.status) ?? 0) + 1);
    }
  }
}

const killed = counts.get('Killed') ?? 0;
const timedOut = counts.get('Timeout') ?? 0;
const survived = counts.get('Survived') ?? 0;
const noCoverage = counts.get('NoCoverage') ?? 0;
const scoreable = killed + timedOut + survived + noCoverage;
const score = scoreable === 0 ? 0 : ((killed + timedOut) / scoreable) * 100;
const errors = (counts.get('CompileError') ?? 0) + (counts.get('RuntimeError') ?? 0);
const ignored = counts.get('Ignored') ?? 0;
const pending = counts.get('Pending') ?? 0;
const rows = [
  '| Result | Count |',
  '| --- | ---: |',
  `| Mutation score | ${score.toFixed(2)}% |`,
  `| Killed | ${killed} |`,
  `| Timed out | ${timedOut} |`,
  `| Survived | ${survived} |`,
  `| No coverage | ${noCoverage} |`,
  `| Compile/runtime errors (excluded from score) | ${errors} |`,
  `| Ignored / pending | ${ignored + pending} |`,
].join('\n');
const selectedFiles = (process.env.MUTATION_SAMPLE_FILES ?? '').split(',').filter(Boolean);
const details = [
  `Selected files (${selectedFiles.length}): ${selectedFiles.join(', ') || 'not provided'}`,
  `Candidate pool: ${process.env.MUTATION_POOL_SIZE ?? 'not provided'}`,
  `Random seed: ${process.env.MUTATION_SEED ?? 'not provided'}`,
].join('\n');

console.log(`${rows}\n\n${details}`);
const summaryPath = process.env.GITHUB_STEP_SUMMARY;
if (summaryPath) {
  fs.appendFileSync(summaryPath, `## Mutation testing sample summary\n\n${rows}\n\n${details}\n`);
}
