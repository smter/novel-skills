const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

function parseArgs(argv, options = {}) {
  const result = {};

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (!token.startsWith('--')) {
      throw new Error(`Unexpected argument: ${token}`);
    }

    const key = token.slice(2);
    const value = argv[index + 1];
    if (!value || value.startsWith('--')) {
      throw new Error(`Missing value for --${key}`);
    }

    result[key] = value;
    index += 1;
  }

  for (const key of options.required ?? []) {
    if (!result[key]) {
      throw new Error(`Missing required argument: --${key}`);
    }
  }

  return result;
}

function createValidator(projectRoot) {
  return {
    errors: [],
    projectRoot: path.resolve(projectRoot),
  };
}

function resolveProjectPath(state, relativePath) {
  return path.join(state.projectRoot, relativePath);
}

function addError(state, message) {
  state.errors.push(message);
}

function readFile(state, relativePath) {
  const fullPath = resolveProjectPath(state, relativePath);
  if (!fs.existsSync(fullPath)) {
    return null;
  }

  return fs.readFileSync(fullPath, 'utf8');
}

function requireFile(state, relativePath) {
  const content = readFile(state, relativePath);
  if (content === null) {
    addError(state, `Missing required file: ${relativePath}`);
    return null;
  }

  if (content.trim() === '') {
    addError(state, `Empty required file: ${relativePath}`);
    return null;
  }

  return content;
}

function requireHeadings(state, relativePath, headings) {
  const content = requireFile(state, relativePath);
  if (content === null) {
    return null;
  }

  for (const heading of headings) {
    if (!content.includes(heading)) {
      addError(state, `Missing heading '${heading}' in ${relativePath}`);
    }
  }

  return content;
}

function requireWorkflowFields(state, relativePath, fields) {
  const content = readFile(state, relativePath);
  if (content === null) {
    return;
  }

  for (const field of fields) {
    if (!content.includes(field)) {
      addError(state, `Workflow status is missing field '${field}'`);
    }
  }
}

function getMetadataFlag(content, label) {
  const escapedLabel = label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = content.match(new RegExp(`^-\\s*${escapedLabel}\\s*(.+)$`, 'im'));
  return match ? match[1].trim() : null;
}

function listFiles(state, relativeDir) {
  const fullPath = resolveProjectPath(state, relativeDir);
  if (!fs.existsSync(fullPath)) {
    return null;
  }

  return fs.readdirSync(fullPath, { withFileTypes: true })
    .filter((entry) => entry.isFile())
    .map((entry) => ({
      name: entry.name,
      fullPath: path.join(fullPath, entry.name),
      extension: path.extname(entry.name).toLowerCase(),
      size: fs.statSync(path.join(fullPath, entry.name)).size,
    }));
}

function hasCommand(command) {
  const result = spawnSync(command, ['--version'], {
    stdio: 'ignore',
    shell: process.platform === 'win32',
  });

  if (result.error && result.error.code === 'ENOENT') {
    return false;
  }

  return result.status === 0;
}

function finish(state, successMessage, failureMessage) {
  if (state.errors.length > 0) {
    console.log(failureMessage);
    for (const error of state.errors) {
      console.log(`- ${error}`);
    }
    process.exit(1);
  }

  console.log(successMessage);
}

module.exports = {
  addError,
  createValidator,
  finish,
  getMetadataFlag,
  hasCommand,
  listFiles,
  parseArgs,
  readFile,
  requireFile,
  requireHeadings,
  requireWorkflowFields,
  resolveProjectPath,
};
