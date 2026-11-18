#!/usr/bin/env node
import { execFileSync } from 'node:child_process';

const options = new Map();
for (let index = 2; index < process.argv.length; index += 2) {
  options.set(process.argv[index], process.argv[index + 1]);
}

const sampleSize = Number(options.get('--count') ?? 5);
const seed = Number(options.get('--seed') ?? Date.now());
if (!Number.isInteger(sampleSize) || sampleSize < 1) {
  throw new RangeError('--count must be a positive integer');
}
if (!Number.isSafeInteger(seed) || seed < 0) {
  throw new RangeError('--seed must be a non-negative safe integer');
}

const candidates = execFileSync('git', ['ls-files', '-z', '--', 'src'], { encoding: 'utf8' })
  .split('\0')
  .filter((file) => file.endsWith('.ts') && file !== 'src/index.ts');
if (candidates.length === 0) {
  throw new Error('No TypeScript source files found under src/');
}
if (sampleSize > candidates.length) {
  throw new RangeError(`--count cannot exceed the ${candidates.length} available source files`);
}

let state = seed >>> 0;
const random = () => {
  state += 0x6d2b79f5;
  let value = state;
  value = Math.imul(value ^ (value >>> 15), value | 1);
  value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
  return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
};

for (let index = candidates.length - 1; index > 0; index -= 1) {
  const swapIndex = Math.floor(random() * (index + 1));
  [candidates[index], candidates[swapIndex]] = [candidates[swapIndex], candidates[index]];
}

const sample = {
  seed,
  candidateCount: candidates.length,
  files: candidates.slice(0, sampleSize),
};
console.error(`Seed ${seed}: selected ${sample.files.length} of ${sample.candidateCount} source files.`);
process.stdout.write(JSON.stringify(sample));
