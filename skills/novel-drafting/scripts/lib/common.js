const path = require('node:path');

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function normalizeMarkdown(markdown) {
  return String(markdown ?? '').replace(/\r\n?/g, '\n');
}

function trimSectionContent(content) {
  return normalizeMarkdown(content).replace(/^\n+|\n+$/g, '').trim();
}

function getHeadingContent(markdown, heading) {
  const normalized = normalizeMarkdown(markdown);
  const headingLevel = (heading.match(/^#+/) ?? [''])[0].length;
  const startPattern = new RegExp(`^${escapeRegExp(heading)}\\s*$`, 'm');
  const startMatch = startPattern.exec(normalized);
  if (!startMatch) {
    return '';
  }

  const lineEndIndex = normalized.indexOf('\n', startMatch.index);
  const contentStart = lineEndIndex === -1 ? normalized.length : lineEndIndex + 1;
  const remaining = normalized.slice(contentStart);
  const headingPattern = /^#{1,6}\s+.*$/gm;
  let nextMatch;

  while ((nextMatch = headingPattern.exec(remaining)) !== null) {
    const nextHeading = nextMatch[0];
    const nextLevel = (nextHeading.match(/^#+/) ?? [''])[0].length;
    if (nextLevel <= headingLevel) {
      return trimSectionContent(remaining.slice(0, nextMatch.index));
    }
  }

  return trimSectionContent(remaining);
}

function getTitle(markdown) {
  const normalized = normalizeMarkdown(markdown);
  const match = normalized.match(/^#\s+(.+)$/m);
  return match ? match[1].trim() : '';
}

function parseLabeledList(markdown) {
  const fields = {};
  const normalized = normalizeMarkdown(markdown);
  let activeField = null;

  for (const line of normalized.split('\n')) {
    const fieldMatch = line.match(/^\s*-\s+([^:]+):\s*(.*)$/);
    if (fieldMatch) {
      const label = fieldMatch[1].trim();
      const value = fieldMatch[2].trim();
      fields[label] = {
        label,
        value,
        items: [],
      };
      activeField = fields[label];
      continue;
    }

    const itemMatch = line.match(/^\s+-\s*(.*)$/);
    if (itemMatch && activeField) {
      activeField.items.push(itemMatch[1].trim());
      continue;
    }

    activeField = null;
  }

  return fields;
}

function fieldValue(fields, label) {
  return fields[label] ? fields[label].value : '';
}

function fieldItems(fields, label) {
  return fields[label] ? fields[label].items.slice() : [];
}

function parseInteger(value) {
  const match = String(value ?? '').match(/-?\d+/);
  return match ? Number(match[0]) : null;
}

function parseRange(value) {
  const raw = String(value ?? '').trim();
  if (raw === '') {
    return {
      raw: '',
      min: null,
      max: null,
    };
  }

  const rangeMatch = raw.match(/^(\d+)\s*-\s*(\d+)$/);
  if (rangeMatch) {
    return {
      raw,
      min: Number(rangeMatch[1]),
      max: Number(rangeMatch[2]),
    };
  }

  const exactMatch = raw.match(/^(\d+)$/);
  if (exactMatch) {
    const valueNumber = Number(exactMatch[1]);
    return {
      raw,
      min: valueNumber,
      max: valueNumber,
    };
  }

  return {
    raw,
    min: null,
    max: null,
  };
}

function parseChapterSections(markdown) {
  const normalized = normalizeMarkdown(markdown);
  const sections = [];
  const headingPattern = /^###\s+Chapter\s+(\d+)\s*$/gm;
  const matches = Array.from(normalized.matchAll(headingPattern));

  for (let index = 0; index < matches.length; index += 1) {
    const match = matches[index];
    const nextMatch = matches[index + 1];
    const bodyStart = match.index + match[0].length;
    const bodyEnd = nextMatch ? nextMatch.index : normalized.length;
    sections.push({
      number: Number(match[1]),
      heading: match[0].trim(),
      body: trimSectionContent(normalized.slice(bodyStart, bodyEnd)),
    });
  }

  return sections;
}

function parseBulletList(markdown) {
  return normalizeMarkdown(markdown)
    .split('\n')
    .map((line) => line.match(/^\s*-\s+(.*)$/))
    .filter(Boolean)
    .map((match) => match[1].trim())
    .filter(Boolean);
}

function splitCommaList(value) {
  return String(value ?? '')
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function inferNumberFromPath(filePath) {
  if (!filePath) {
    return null;
  }

  const basename = path.basename(filePath);
  const match = basename.match(/chapter-(\d+)(?:-review)?\.md$/);
  return match ? Number(match[1]) : null;
}

function isPlaceholderList(items, rawValue = '') {
  const normalizedItems = items
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);
  const normalizedValue = String(rawValue ?? '').trim().toLowerCase();
  const placeholderValues = new Set(['-', 'none', 'n/a', 'na', 'todo', 'tbd', 'pending']);

  if (normalizedItems.length === 0) {
    return placeholderValues.has(normalizedValue) || normalizedValue === '';
  }

  return normalizedItems.every((item) => placeholderValues.has(item));
}

module.exports = {
  fieldItems,
  fieldValue,
  getHeadingContent,
  getTitle,
  inferNumberFromPath,
  isPlaceholderList,
  parseBulletList,
  parseChapterSections,
  parseInteger,
  parseLabeledList,
  parseRange,
  splitCommaList,
  trimSectionContent,
};
