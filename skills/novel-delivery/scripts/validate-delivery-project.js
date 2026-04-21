#!/usr/bin/env node

const {
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
} = require('../../../scripts/lib/validator-utils');

function main() {
  let args;
  try {
    args = parseArgs(process.argv.slice(2), { required: ['project-root'] });
  } catch (error) {
    console.log(`Delivery validation failed for mode Preflight:\n- ${error.message}`);
    process.exit(1);
  }

  const mode = args.mode ?? 'Preflight';
  if (!['Preflight', 'Output'].includes(mode)) {
    console.log(`Delivery validation failed for mode ${mode}:\n- Invalid mode: ${mode}`);
    process.exit(1);
  }

  const state = createValidator(args['project-root']);

  if (mode === 'Preflight') {
    for (const relativePath of [
      '00-project/workflow-status.md',
      '30-draft/chapter-plan.md',
      '50-delivery/metadata.md',
      '50-delivery/frontmatter.md',
    ]) {
      requireFile(state, relativePath);
    }

    requireHeadings(state, '50-delivery/metadata.md', [
      '# Metadata',
      '## Bibliographic Data',
      '## Output Targets',
    ]);

    requireHeadings(state, '50-delivery/frontmatter.md', [
      '# Title Page',
      '## Book Title',
      '## Author',
      '## Rights',
      '## Summary',
    ]);

    if (!hasCommand('pandoc')) {
      addError(state, 'Pandoc is not available on PATH.');
    }
  }

  if (mode === 'Output') {
    const metadataContent = readFile(state, '50-delivery/metadata.md') ?? '';
    let needsPdf = /^(yes|true|1|y)$/i.test(getMetadataFlag(metadataContent, 'Produce PDF:') ?? '');
    let needsEpub = /^(yes|true|1|y)$/i.test(getMetadataFlag(metadataContent, 'Produce EPUB:') ?? '');
    if (!needsPdf && !needsEpub) {
      needsPdf = true;
      needsEpub = true;
    }

    const bookContent = readFile(state, '50-delivery/book.md');
    if (bookContent !== null) {
      if (!bookContent.includes('# Title Page')) {
        addError(state, 'book.md is missing frontmatter content.');
      }
      if (!/^#\s+Chapter/m.test(bookContent) && !/^##\s+Chapter/m.test(bookContent)) {
        addError(state, 'book.md does not appear to include chapter headings.');
      }
    } else {
      addError(state, 'Missing generated manuscript: 50-delivery/book.md');
    }

    const artifacts = listFiles(state, '50-delivery/output');
    if (artifacts === null) {
      addError(state, 'Missing output directory: 50-delivery/output');
    } else {
      const pdfArtifacts = artifacts.filter((artifact) => artifact.extension === '.pdf');
      const epubArtifacts = artifacts.filter((artifact) => artifact.extension === '.epub');

      if (needsPdf && pdfArtifacts.length === 0) {
        addError(state, 'No PDF artifact found in 50-delivery/output.');
      } else if (needsPdf && pdfArtifacts.reduce((sum, artifact) => sum + artifact.size, 0) <= 0) {
        addError(state, 'PDF artifact is empty.');
      }

      if (needsEpub && epubArtifacts.length === 0) {
        addError(state, 'No EPUB artifact found in 50-delivery/output.');
      } else if (needsEpub && epubArtifacts.reduce((sum, artifact) => sum + artifact.size, 0) <= 0) {
        addError(state, 'EPUB artifact is empty.');
      }
    }
  }

  finish(
    state,
    `Delivery validation passed for mode ${mode}.`,
    `Delivery validation failed for mode ${mode}:`,
  );
}

main();
