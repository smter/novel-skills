import path from 'node:path';

export interface ParsedField {
  label: string;
  value: string;
  items: string[];
}

export interface ParsedRange {
  raw: string;
  min: number | null;
  max: number | null;
}

export type ParsedFields = Record<string, ParsedField>;

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function normalizeMarkdown(markdown: string): string {
  return String(markdown ?? '').replace(/\r\n?/g, '\n');
}

export function trimSectionContent(content: string): string {
  return normalizeMarkdown(content).replace(/^\n+|\n+$/g, '').trim();
}

export function getHeadingContent(markdown: string, heading: string): string {
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
  let nextMatch: RegExpExecArray | null;

  while ((nextMatch = headingPattern.exec(remaining)) !== null) {
    const nextHeading = nextMatch[0];
    const nextLevel = (nextHeading.match(/^#+/) ?? [''])[0].length;
    if (nextLevel <= headingLevel) {
      return trimSectionContent(remaining.slice(0, nextMatch.index));
    }
  }

  return trimSectionContent(remaining);
}

export function getTitle(markdown: string): string {
  const normalized = normalizeMarkdown(markdown);
  const match = normalized.match(/^#\s+(.+)$/m);
  return match ? match[1].trim() : '';
}

export function parseLabeledList(markdown: string): ParsedFields {
  const fields: ParsedFields = {};
  const normalized = normalizeMarkdown(markdown);
  let activeField: ParsedField | null = null;

  for (const line of normalized.split('\n')) {
    const fieldMatch = line.match(/^\s*(?:-\s+)?([^:\n]+):\s*(.*)$/);
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

    const itemMatch = line.match(/^\s{2,}-\s*(.*)$/);
    if (itemMatch && activeField) {
      activeField.items.push(itemMatch[1].trim());
      continue;
    }

    activeField = null;
  }

  return fields;
}

export function fieldValue(fields: ParsedFields, label: string): string {
  return fields[label] ? fields[label].value : '';
}

export function fieldItems(fields: ParsedFields, label: string): string[] {
  return fields[label] ? fields[label].items.slice() : [];
}

export function parseInteger(value: string): number | null {
  const match = String(value ?? '').match(/-?\d+/);
  return match ? Number(match[0]) : null;
}

export function parseRange(value: string): ParsedRange {
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

export interface ParsedChapterSection {
  number: number;
  heading: string;
  body: string;
}

export function parseChapterSections(markdown: string): ParsedChapterSection[] {
  const normalized = normalizeMarkdown(markdown);
  const sections: ParsedChapterSection[] = [];
  const headingPattern = /^###\s+Chapter\s+(\d+)\s*$/gm;
  const matches = Array.from(normalized.matchAll(headingPattern));

  for (let index = 0; index < matches.length; index += 1) {
    const match = matches[index];
    const nextMatch = matches[index + 1];
    const bodyStart = (match.index ?? 0) + match[0].length;
    const bodyEnd = nextMatch?.index ?? normalized.length;
    sections.push({
      number: Number(match[1]),
      heading: match[0].trim(),
      body: trimSectionContent(normalized.slice(bodyStart, bodyEnd)),
    });
  }

  return sections;
}

export function parseBulletList(markdown: string): string[] {
  return normalizeMarkdown(markdown)
    .split('\n')
    .map((line) => line.match(/^\s*-\s+(.*)$/))
    .filter(Boolean)
    .map((match) => match![1].trim())
    .filter(Boolean);
}

export function splitCommaList(value: string): string[] {
  return String(value ?? '')
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean);
}

export function inferNumberFromPath(filePath: string): number | null {
  if (!filePath) {
    return null;
  }

  const basename = path.basename(filePath);
  const match = basename.match(/chapter-(\d+)(?:-review)?\.md$/);
  return match ? Number(match[1]) : null;
}

export function isPlaceholderList(items: string[], rawValue = ''): boolean {
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
