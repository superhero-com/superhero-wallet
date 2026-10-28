const fs = require('node:fs');
const path = require('node:path');

const workflowPath = path.join(__dirname, '..', '.github', 'workflows', 'test.yml');
const repositoryRoot = path.join(__dirname, '..');
const integrationDirectory = path.join(repositoryRoot, 'tests', 'e2e', 'integration');
const workflow = fs.readFileSync(workflowPath, 'utf8');
const excludedPatterns = require('../cypress.config').e2e.excludeSpecPattern;

function listSpecs(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      return listSpecs(entryPath);
    }
    return /\.cy\.(js|jsx|ts|tsx)$/.test(entry.name)
      ? [path.relative(repositoryRoot, entryPath).replaceAll(path.sep, '/')]
      : [];
  });
}

function matchesGlob(value, pattern) {
  const expression = pattern.split(/(\*\*|\*|\?)/g).map((part) => {
    if (part === '**') return '.*';
    if (part === '*') return '[^/]*';
    if (part === '?') return '[^/]';
    return part.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }).join('');
  return new RegExp(`^${expression}$`).test(value);
}

const patterns = [...workflow.matchAll(/^\s*spec_pattern:\s*['"]?([^'"\r\n]+)['"]?\s*$/gm)]
  .map(([, pattern]) => pattern);
const assignmentCounts = new Map();
const errors = [];

if (patterns.length === 0) {
  errors.push('No E2E spec_pattern entries were found in the workflow.');
}

patterns.forEach((pattern) => {
  const match = pattern.match(/^tests\/e2e\/integration\/\{([^}]+)\}\.cy\.js$/);
  if (!match) {
    errors.push(`Unsupported E2E shard pattern: ${pattern}`);
    return;
  }
  match[1].split(',').forEach((name) => {
    const spec = `tests/e2e/integration/${name}.cy.js`;
    assignmentCounts.set(spec, (assignmentCounts.get(spec) || 0) + 1);
  });
});

const specs = listSpecs(integrationDirectory)
  .filter((spec) => !excludedPatterns.some((pattern) => matchesGlob(spec, pattern)));

specs.forEach((spec) => {
  const count = assignmentCounts.get(spec) || 0;
  if (count === 0) {
    errors.push(`Eligible E2E spec is not assigned to a shard: ${spec}`);
  } else if (count > 1) {
    errors.push(`Eligible E2E spec is assigned to ${count} shards: ${spec}`);
  }
});

assignmentCounts.forEach((count, spec) => {
  if (!specs.includes(spec)) {
    errors.push(`Shard references a missing or excluded E2E spec: ${spec}`);
  }
});

if (errors.length) {
  console.error(errors.join('\n'));
  process.exitCode = 1;
} else {
  console.log(`Verified ${specs.length} eligible E2E specs are assigned exactly once.`);
}
