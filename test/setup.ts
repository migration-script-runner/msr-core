/**
 * Global Test Setup
 *
 * This file is loaded before all tests run. It configures chai plugins globally,
 * removing the need to import and configure them in every test file.
 *
 * Configured via .mocharc.json: "require": ["ts-node/register", "test/setup.ts"]
 */

import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import spies from 'chai-spies';
import {mkdirSync} from 'node:fs';

// Stryker runs tests from isolated sandboxes, so create runtime directories there.
mkdirSync('backups', {recursive: true});

// Configure chai plugins globally
chai.use(chaiAsPromised);  // Adds .to.be.rejectedWith(), .to.be.fulfilled, etc.
chai.use(spies);           // Adds spy.on(), spy.restore(), etc.

// Note: Global mocha hooks (before/after) are not available in setup files
// loaded via require. They must be defined in actual test files.
// This setup file is primarily for configuring test libraries.
