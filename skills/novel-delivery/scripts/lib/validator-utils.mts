import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

export interface ParsedArgs {
  [key: string]: string;
}

export interface ValidatorState {
  errors: string[];
  projectRoot: string;
}

export interface ParseArgsOptions {
  required?: string[];
}

export function parseArgs(argv: string[], options: ParseArgsOptions = {}): ParsedArgs {
  const result: ParsedArgs = {};

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

export function createValidator(projectRoot: string): ValidatorState {
  return {
    errors: [],
    projectRoot: path.resolve(projectRoot),
  };
}

export function addError(state: ValidatorState, message: string): void {
  state.errors.push(message);
}

export function readFile(state: ValidatorState, relativePath: string): string | null {
  const fullPath = path.join(state.projectRoot, relativePath);
  if (!fs.existsSync(fullPath)) {
    return null;
  }

  return fs.readFileSync(fullPath, 'utf8');
}

export function requireFile(state: ValidatorState, relativePath: string): string | null {
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

export function requireHeadings(
  state: ValidatorState,
  relativePath: string,
  headings: string[],
): string | null {
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

export function getMetadataFlag(content: string, label: string): string | null {
  const escapedLabel = label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = content.match(new RegExp(`^-\\s*${escapedLabel}\\s*(.+)$`, 'im'));
  return match ? match[1].trim() : null;
}

export function finish(
  state: ValidatorState,
  successMessage: string,
  failureMessage: string,
): void {
  if (state.errors.length > 0) {
    console.log(failureMessage);
    for (const error of state.errors) {
      console.log(`- ${error}`);
    }
    process.exit(1);
  }

  console.log(successMessage);
}

export function hasCommand(command: string): boolean {
  const result = spawnSync(command, ['--version'], {
    stdio: 'ignore',
    shell: process.platform === 'win32',
  });

  if (result.error && 'code' in result.error && result.error.code === 'ENOENT') {
    return false;
  }

  return result.status === 0;
}
