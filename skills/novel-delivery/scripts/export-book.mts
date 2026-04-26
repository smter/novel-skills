import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import process from 'node:process';
import { spawnSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';

const BODY_FONT_CANDIDATES = [
  'Source Han Serif SC',
  'Noto Serif CJK SC',
  'Songti SC',
  'SimSun',
];

const HEADING_FONT_CANDIDATES = [
  'Source Han Sans SC',
  'Noto Sans CJK SC',
  'PingFang SC',
  'Heiti SC',
  'STHeiti',
  'Microsoft YaHei',
  'SimHei',
];

const PDF_BROWSER_CANDIDATES: Record<string, string[]> = {
  Windows: ['msedge', 'chrome', 'chromium', 'brave'],
  macOS: ['Microsoft Edge', 'Google Chrome', 'Chromium', 'Brave Browser'],
  Linux: ['microsoft-edge', 'google-chrome', 'chromium', 'chromium-browser', 'brave-browser'],
};

const PRINT_STYLES_FILENAME = 'novel-book.css';
const STATUS_FIELD_PATTERN = /^(\s*-\s*Status:\s*)(.+)$/m;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export interface PdfBrowserInstallPlan {
  platform: string;
  browser: string;
  primaryCommand: string;
  fallbackCommands: string[];
}

export interface ResolvedFonts {
  mainFont: string;
  mainFontRegular: string | null;
  sansFont: string;
}

export interface ExportTargets {
  slug: string;
  outputDirectory: string;
  latteHtml: string;
  mochaHtml: string;
  lattePdf: string;
  mochaPdf: string;
  epub: string;
}

export interface DeliveryPreflightResult extends ResolvedFonts {
  chapterIds: string[];
  metadataPath: string;
  pandocMetadataPath: string;
  frontmatterPath: string;
  workflowStatusPath: string;
  warnings: string[];
  pdfBrowserPath: string;
}

interface PandocCommandOptions {
  pandocPath: string;
  projectRoot: string;
  defaultsFile: string;
  outputPath: string;
  metadataFile: string;
  mainFont?: string | null;
  mainFontRegular?: string | null;
  sansFont?: string | null;
  coverPath?: string | null;
}

interface DeliveryExportOptions {
  projectRoot?: string;
  pandocPath?: string;
  pdfBrowserPath?: string | null;
  installedFonts?: string[];
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

async function loadPlaywrightModule(): Promise<any> {
  try {
    // @ts-expect-error playwright-core is installed in the skill-local package.
    return await import('playwright-core');
  } catch (error) {
    throw new Error(
      'Playwright module not found. Run npm install from the skill directory that contains this export script.',
      { cause: error },
    );
  }
}

function exists(targetPath: string): boolean {
  return fs.existsSync(targetPath);
}

function readText(targetPath: string): string {
  return fs.readFileSync(targetPath, 'utf8');
}

function writeText(targetPath: string, content: string): void {
  fs.writeFileSync(targetPath, content, 'utf8');
}

function ensureDirectory(targetPath: string): void {
  fs.mkdirSync(targetPath, { recursive: true });
}

export function getWorkflowStatusValue(workflowContent: string): string | null {
  const match = String(workflowContent ?? '').match(STATUS_FIELD_PATTERN);
  return match ? match[2].trim() : null;
}

function normalizeSlashes(targetPath: string): string {
  return targetPath.split(path.sep).join('/');
}

function escapeYamlScalar(value: string): string {
  return JSON.stringify(value);
}

function looksTruthy(value: string): boolean {
  return /^(yes|true|1|y)$/i.test(value.trim());
}

function markdownFieldPattern(names: string[]): RegExp {
  return new RegExp(
    `^\\s*[-*]?\\s*(?:${names.map(escapeRegExp).join('|')})\\s*[:：]\\s*(.*?)\\s*$`,
    'imu',
  );
}

function getMarkdownFieldValue(content: string, names: string[]): string | null {
  const match = content.match(markdownFieldPattern(names));
  const value = match?.[1]?.trim() ?? '';
  return value || null;
}

export function getCurrentPlatform(): string {
  switch (process.platform) {
    case 'win32':
      return 'Windows';
    case 'darwin':
      return 'macOS';
    case 'linux':
      return 'Linux';
    default:
      return 'Unknown';
  }
}

function findCommand(commandName: string): boolean {
  const whichCommand = process.platform === 'win32' ? 'where' : 'which';
  const result = spawnSync(whichCommand, [commandName], { encoding: 'utf8' });
  return result.status === 0;
}

export function getPdfBrowserInstallPlan(platform = getCurrentPlatform()): PdfBrowserInstallPlan {
  switch (platform) {
    case 'Windows':
      return {
        platform: 'Windows',
        browser: 'Chromium',
        primaryCommand: 'npx playwright install chromium',
        fallbackCommands: [
          'winget install Microsoft.Edge',
          'winget install Google.Chrome',
        ],
      };
    case 'macOS':
      return {
        platform: 'macOS',
        browser: 'Chromium',
        primaryCommand: 'npx playwright install chromium',
        fallbackCommands: [
          'brew install --cask microsoft-edge',
          'brew install --cask google-chrome',
        ],
      };
    case 'Linux':
      return {
        platform: 'Linux',
        browser: 'Chromium',
        primaryCommand: 'npx playwright install chromium',
        fallbackCommands: [
          'sudo apt-get install -y chromium-browser',
          'sudo dnf install -y chromium',
          'sudo pacman -S --needed chromium',
        ],
      };
    default:
      return {
        platform,
        browser: 'Chromium',
        primaryCommand: 'npx playwright install chromium',
        fallbackCommands: [],
      };
  }
}

export function getPdfBrowserEnvironmentMessage(installPlan: PdfBrowserInstallPlan): string {
  const fallback =
    installPlan.fallbackCommands.length > 0
      ? ` Fallbacks: ${installPlan.fallbackCommands.join(' | ')}`
      : '';
  return `Missing Chromium-compatible browser on ${installPlan.platform}. Primary install command: ${installPlan.primaryCommand}.${fallback}`;
}

export function getDefaultMacOsBrowserPaths(applicationsDirectory = '/Applications'): string[] {
  return [
    path.join(applicationsDirectory, 'Microsoft Edge.app', 'Contents', 'MacOS', 'Microsoft Edge'),
    path.join(applicationsDirectory, 'Google Chrome.app', 'Contents', 'MacOS', 'Google Chrome'),
    path.join(applicationsDirectory, 'Chromium.app', 'Contents', 'MacOS', 'Chromium'),
    path.join(applicationsDirectory, 'Brave Browser.app', 'Contents', 'MacOS', 'Brave Browser'),
  ];
}

export function findPlaywrightBrowserExecutable(
  platform = getCurrentPlatform(),
  homeDirectory = os.homedir(),
): string | null {
  const cacheRootByPlatform: Record<string, string> = {
    Windows: path.join(homeDirectory, 'AppData', 'Local', 'ms-playwright'),
    macOS: path.join(homeDirectory, 'Library', 'Caches', 'ms-playwright'),
    Linux: path.join(homeDirectory, '.cache', 'ms-playwright'),
  };
  const executableNames: Record<string, string[]> = {
    Windows: ['chrome.exe'],
    macOS: ['Chromium.app'],
    Linux: ['chrome'],
  };
  const cacheRoot = cacheRootByPlatform[platform];
  if (!cacheRoot || !exists(cacheRoot)) {
    return null;
  }

  const matchedPaths: string[] = [];
  for (const entry of fs.readdirSync(cacheRoot, { withFileTypes: true })) {
    if (!entry.isDirectory() || !entry.name.startsWith('chromium-')) {
      continue;
    }

    const candidateRoot = path.join(cacheRoot, entry.name);
    if (platform === 'Windows') {
      for (const subdirectory of ['chrome-win64', 'chrome-win']) {
        const candidate = path.join(candidateRoot, subdirectory, 'chrome.exe');
        if (exists(candidate)) {
          matchedPaths.push(candidate);
        }
      }
      continue;
    }

    if (platform === 'macOS') {
      const candidate = path.join(
        candidateRoot,
        'chrome-mac',
        'Chromium.app',
        'Contents',
        'MacOS',
        'Chromium',
      );
      if (exists(candidate)) {
        matchedPaths.push(candidate);
      }
      continue;
    }

    for (const executableName of executableNames[platform] || []) {
      const candidate = path.join(candidateRoot, 'chrome-linux', executableName);
      if (exists(candidate)) {
        matchedPaths.push(candidate);
      }
    }
  }

  return matchedPaths.sort().at(-1) || null;
}

export function resolvePdfBrowserPath(pdfBrowserPath: string | null = null): string {
  if (pdfBrowserPath) {
    if (exists(pdfBrowserPath)) {
      return path.resolve(pdfBrowserPath);
    }

    if (findCommand(pdfBrowserPath)) {
      return pdfBrowserPath;
    }

    throw new Error(getPdfBrowserEnvironmentMessage(getPdfBrowserInstallPlan()));
  }

  const platform = getCurrentPlatform();
  for (const candidate of PDF_BROWSER_CANDIDATES[platform] || []) {
    if (findCommand(candidate)) {
      return candidate;
    }
  }

  if (platform === 'macOS') {
    for (const candidate of getDefaultMacOsBrowserPaths()) {
      if (exists(candidate)) {
        return candidate;
      }
    }
  }

  const playwrightBrowserPath = findPlaywrightBrowserExecutable(platform);
  if (playwrightBrowserPath) {
    return playwrightBrowserPath;
  }

  throw new Error(getPdfBrowserEnvironmentMessage(getPdfBrowserInstallPlan(platform)));
}

function parseWindowsRegistryFonts(output: string): string[] {
  const fonts = new Set<string>();
  for (const line of output.split(/\r?\n/)) {
    const match = line.match(/^\s+(.+?)\s+REG_\w+\s+.+$/);
    if (!match) {
      continue;
    }

    const cleanName = match[1].replace(/\s*\(.*\)$/, '').trim();
    if (cleanName && !cleanName.startsWith('PS')) {
      fonts.add(cleanName);
      const ampersandIndex = cleanName.indexOf(' & ');
      if (ampersandIndex > 0) {
        fonts.add(cleanName.substring(0, ampersandIndex).trim());
      }
    }
  }

  return [...fonts];
}

export function getInstalledFontsFromMacSystemProfiler(output: string): string[] {
  const fonts = new Set<string>();
  const styleSuffixPattern = /\s+(Regular|Bold|Light|Medium|Black|Thin|Heavy|Semibold|SemiBold|ExtraBold|ExtraLight|W\d+|常规体|粗体|细体|黑体|中黑体|特黑体)$/i;

  const addName = (value: string): void => {
    const normalized = value.trim();
    if (!normalized) {
      return;
    }
    fonts.add(normalized);

    const simplified = normalized.replace(styleSuffixPattern, '').trim();
    if (simplified) {
      fonts.add(simplified);
    }
  };

  for (const rawLine of output.split(/\r?\n/)) {
    const line = rawLine.trim();
    const familyMatch = line.match(/^Family:\s+(.+)$/);
    if (familyMatch) {
      addName(familyMatch[1]);
      continue;
    }

    const fullNameMatch = line.match(/^Full Name:\s+(.+)$/);
    if (fullNameMatch) {
      addName(fullNameMatch[1]);
      continue;
    }

    const uniqueNameMatch = line.match(/^Unique Name:\s+(.+?)(?:;\s.*)?$/);
    if (uniqueNameMatch) {
      addName(uniqueNameMatch[1]);
    }
  }

  return [...fonts].sort((left, right) => left.localeCompare(right));
}

function getInstalledFonts(): string[] {
  try {
    if (process.platform === 'win32') {
      const outputs = [
        spawnSync(
          'reg',
          ['query', 'HKLM\\SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion\\Fonts'],
          { encoding: 'utf8' },
        ),
        spawnSync(
          'reg',
          ['query', 'HKCU\\SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion\\Fonts'],
          { encoding: 'utf8' },
        ),
      ];

      return outputs
        .filter((result) => result.status === 0)
        .flatMap((result) => parseWindowsRegistryFonts(result.stdout))
        .sort((left, right) => left.localeCompare(right));
    }

    if (process.platform === 'darwin') {
      const result = spawnSync('system_profiler', ['SPFontsDataType'], {
        encoding: 'utf8',
      });
      if (result.status === 0) {
        return getInstalledFontsFromMacSystemProfiler(result.stdout);
      }
    }

    const result = spawnSync('fc-list', [':', 'family'], { encoding: 'utf8' });
    if (result.status === 0) {
      return [...new Set(result.stdout.split(/\r?\n/).flatMap((line) => line.split(',')))]
        .map((line) => line.trim())
        .filter(Boolean);
    }
  } catch {
    return [];
  }

  return [];
}

export function resolveFirstInstalledFont(
  candidates: string[],
  installedFonts = getInstalledFonts(),
): string {
  for (const candidate of candidates) {
    if (installedFonts.includes(candidate)) {
      return candidate;
    }
  }

  throw new Error(`No supported fonts found. Candidates: ${candidates.join(', ')}`);
}

export function getResolvedFonts(installedFonts = getInstalledFonts()): ResolvedFonts {
  const mainFont = resolveFirstInstalledFont(BODY_FONT_CANDIDATES, installedFonts);
  return {
    mainFont,
    mainFontRegular: mainFont === 'SimSun' ? null : 'Medium',
    sansFont: resolveFirstInstalledFont(HEADING_FONT_CANDIDATES, installedFonts),
  };
}

export function getExportTargets(projectRoot: string): ExportTargets {
  const slug = path.basename(projectRoot);
  const outputDirectory = path.join(projectRoot, '50-delivery', 'output');

  return {
    slug,
    outputDirectory,
    latteHtml: path.join(outputDirectory, `${slug}-latte.html`),
    mochaHtml: path.join(outputDirectory, `${slug}-mocha.html`),
    lattePdf: path.join(outputDirectory, `${slug}-latte.pdf`),
    mochaPdf: path.join(outputDirectory, `${slug}-mocha.pdf`),
    epub: path.join(outputDirectory, `${slug}.epub`),
  };
}

export function getPlannedChapterIds(chapterPlanPath: string): string[] {
  const chapterPlan = readText(chapterPlanPath);
  const explicitMatches = chapterPlan.match(/chapter-\d{2}/g) || [];
  const ordered = [...new Set(explicitMatches)];

  if (ordered.length > 0) {
    return ordered;
  }

  const headingMatches = [...chapterPlan.matchAll(/^\s{0,3}#{2,6}\s+(?:Chapter\s+|第)\s*(\d{1,3})\s*(?:章)?\s*$/gimu)];
  for (const match of headingMatches) {
    const chapterNumber = Number.parseInt(match[1], 10);
    if (!Number.isNaN(chapterNumber)) {
      ordered.push(`chapter-${String(chapterNumber).padStart(2, '0')}`);
    }
  }

  if (ordered.length === 0) {
    throw new Error('No planned chapters found in chapter-plan.md. Add chapter-01 style ids or Markdown headings like "### Chapter 1".');
  }

  return ordered;
}

export function parseDeliveryMetadata(metadata: string): Record<string, string | string[] | boolean> {
  const parsed: Record<string, string | string[] | boolean> = {};

  const title = getMarkdownFieldValue(metadata, ['Title', 'title', '书名']);
  const author = getMarkdownFieldValue(metadata, ['Author', 'author', '作者', '署名']);
  const language = getMarkdownFieldValue(metadata, ['Language', 'language', '语言']);
  const summary = getMarkdownFieldValue(metadata, ['Summary', 'summary', '简介']);
  const keywords = getMarkdownFieldValue(metadata, ['Keywords', 'keywords', '关键词']);
  const publicationDate = getMarkdownFieldValue(metadata, ['Publication Date', 'publication date', '发布日期']);
  const producePdf = getMarkdownFieldValue(metadata, ['Produce PDF', 'produce pdf']);
  const produceEpub = getMarkdownFieldValue(metadata, ['Produce EPUB', 'produce epub']);
  const coverPath = getMarkdownFieldValue(metadata, ['Cover Path', 'cover path', 'Cover', 'cover', '封面路径']);

  if (title) parsed.title = title;
  if (author) parsed.author = author;
  if (language) parsed.language = language;
  if (summary) parsed.summary = summary;
  if (keywords) {
    parsed.keywords = keywords.split(/[，,]/).map((keyword) => keyword.trim()).filter(Boolean);
  }
  if (publicationDate) parsed.date = publicationDate;
  if (producePdf) parsed.producePdf = looksTruthy(producePdf);
  if (produceEpub) parsed.produceEpub = looksTruthy(produceEpub);
  if (coverPath) parsed.coverPath = coverPath;

  return parsed;
}

export function getPandocMetadataFilePath(metadataPath: string): string {
  const metadata = parseDeliveryMetadata(readText(metadataPath));
  const tempDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'novel-delivery-metadata-'));
  const yamlPath = path.join(tempDirectory, 'metadata.yaml');
  const lines: string[] = [];

  if (typeof metadata.title === 'string') lines.push(`title: ${escapeYamlScalar(metadata.title)}`);
  if (typeof metadata.author === 'string') lines.push(`author: ${escapeYamlScalar(metadata.author)}`);
  if (typeof metadata.language === 'string') lines.push(`lang: ${escapeYamlScalar(metadata.language)}`);
  if (typeof metadata.summary === 'string') lines.push(`summary: ${escapeYamlScalar(metadata.summary)}`);
  if (typeof metadata.date === 'string') lines.push(`date: ${escapeYamlScalar(metadata.date)}`);
  if (Array.isArray(metadata.keywords) && metadata.keywords.length > 0) {
    lines.push('keywords:');
    for (const keyword of metadata.keywords) {
      lines.push(`  - ${escapeYamlScalar(keyword)}`);
    }
  }
  if (typeof metadata.producePdf === 'boolean') lines.push(`produce-pdf: ${metadata.producePdf}`);
  if (typeof metadata.produceEpub === 'boolean') lines.push(`produce-epub: ${metadata.produceEpub}`);
  if (typeof metadata.coverPath === 'string') lines.push(`cover-path: ${escapeYamlScalar(metadata.coverPath)}`);

  writeText(yamlPath, `${lines.join('\n')}\n`);
  return yamlPath;
}

export function collectMetadataWarnings(metadataPath: string): string[] {
  const metadata = readText(metadataPath);
  const minimalRequirements = [
    { name: 'title', pattern: /^\s*[-*]?\s*(title|书名)\s*[:：]/imu },
    { name: 'author', pattern: /^\s*[-*]?\s*(author|作者|署名)\s*[:：]/imu },
    { name: 'language', pattern: /^\s*[-*]?\s*(language|语言)\s*[:：]/imu },
  ];
  const optionalRequirements = [
    { name: 'summary', pattern: /^\s*[-*]?\s*(summary|简介)\s*[:：]/imu },
    { name: 'keywords', pattern: /^\s*[-*]?\s*(keywords|关键词)\s*[:：]/imu },
    { name: 'publication date', pattern: /^\s*[-*]?\s*(publication\s*date|发布日期)\s*[:：]/imu },
    { name: 'output formats', pattern: /^\s*[-*]?\s*(output\s*formats|目标格式|输出格式)\s*[:：]/imu },
  ];

  const missingMinimal = minimalRequirements
    .filter((requirement) => !requirement.pattern.test(metadata))
    .map((requirement) => requirement.name);

  if (missingMinimal.length > 0) {
    throw new Error(`Missing required metadata fields: ${missingMinimal.join(', ')}`);
  }

  return optionalRequirements
    .filter((requirement) => !requirement.pattern.test(metadata))
    .map((requirement) => `metadata.md is missing optional field: ${requirement.name}`);
}

export function getMetadataCoverPath(
  projectRoot: string,
  metadataPath: string,
): { coverPath: string | null; warnings: string[] } {
  const metadata = readText(metadataPath);
  const match = metadata.match(/^\s*[-*]?\s*(cover\s*path|cover|封面路径)\s*[:：]\s*(.+?)\s*$/imu);
  if (!match) {
    return { coverPath: null, warnings: [] };
  }

  const rawRelativePath = match[2].trim().replace(/^"(.*)"$/, '$1');
  if (!rawRelativePath) {
    return { coverPath: null, warnings: ['metadata.md includes an empty cover path; continuing without EPUB cover image'] };
  }

  const coverPath = path.isAbsolute(rawRelativePath)
    ? rawRelativePath
    : path.join(projectRoot, rawRelativePath);

  if (!exists(coverPath)) {
    return {
      coverPath: null,
      warnings: [`Cover path does not exist: ${rawRelativePath}; continuing without EPUB cover image`],
    };
  }

  return { coverPath: path.resolve(coverPath), warnings: [] };
}

export function collectChapterAndReviewWarnings(projectRoot: string, chapterIds: string[]): string[] {
  const warnings: string[] = [];
  for (const chapterId of chapterIds) {
    const chapterPath = path.join(projectRoot, '30-draft', 'chapters', `${chapterId}.md`);
    const reviewPath = path.join(
      projectRoot,
      '40-review',
      'chapter-reviews',
      `${chapterId}-review.md`,
    );

    if (!exists(chapterPath)) {
      throw new Error(`Missing chapter file: 30-draft/chapters/${chapterId}.md`);
    }

    if (!exists(reviewPath)) {
      warnings.push(`Missing chapter review: 40-review/chapter-reviews/${chapterId}-review.md`);
      continue;
    }

    const review = readText(reviewPath);
    if (review.includes('不通过')) {
      warnings.push(`Chapter review not passed: ${chapterId}; continuing export because review status is non-blocking`);
      continue;
    }

    if (!review.includes('通过')) {
      warnings.push(`Chapter review missing explicit pass marker: ${chapterId}; continuing export because review status is non-blocking`);
    }
  }

  return warnings;
}

function hasNovelProjectMarkers(candidateRoot: string): boolean {
  return exists(path.join(candidateRoot, '00-project', 'workflow-status.md'));
}

function discoverNovelProjectCandidates(searchRoot: string): string[] {
  const candidates: string[] = [];
  if (!exists(searchRoot)) {
    return candidates;
  }

  for (const entry of fs.readdirSync(searchRoot, { withFileTypes: true })) {
    if (!entry.isDirectory()) {
      continue;
    }

    const candidate = path.join(searchRoot, entry.name);
    if (hasNovelProjectMarkers(candidate)) {
      candidates.push(candidate);
    }
  }

  return candidates;
}

export function resolveNovelProjectRoot(projectRootInput = process.cwd()): string {
  const directRoot = path.resolve(projectRootInput);
  if (hasNovelProjectMarkers(directRoot)) {
    return directRoot;
  }

  const nestedCandidates = discoverNovelProjectCandidates(directRoot);
  if (nestedCandidates.length === 1) {
    return nestedCandidates[0];
  }

  if (nestedCandidates.length > 1) {
    throw new Error(
      `Multiple novel project roots found under ${normalizeSlashes(directRoot)}. Pass --project-root with the intended book directory.`,
    );
  }

  throw new Error(
    `Could not find a novel project root in ${normalizeSlashes(directRoot)}. Expected either 00-project/ at this level or exactly one child book directory containing it.`,
  );
}

export function testDeliveryPreflight(
  projectRoot: string,
  pandocPath: string,
  installedFonts = getInstalledFonts(),
  pdfBrowserPath: string | null = null,
): DeliveryPreflightResult {
  const requiredFiles = [
    path.join('00-project', 'workflow-status.md'),
    path.join('30-draft', 'chapter-plan.md'),
    path.join('50-delivery', 'metadata.md'),
    path.join('50-delivery', 'frontmatter.md'),
  ];

  for (const relativePath of requiredFiles) {
    const fullPath = path.join(projectRoot, relativePath);
    if (!exists(fullPath)) {
      throw new Error(`Missing required delivery file: ${normalizeSlashes(relativePath)}`);
    }
  }

  if (!findCommand(pandocPath) && !exists(pandocPath)) {
    throw new Error(`Pandoc executable not found: ${pandocPath}`);
  }

  const workflowStatusPath = path.join(projectRoot, '00-project', 'workflow-status.md');
  const workflowStatus = readText(workflowStatusPath);
  const workflowStatusValue = getWorkflowStatusValue(workflowStatus);
  if (!workflowStatusValue) {
    throw new Error('workflow-status.md is missing a structured Status field. Use `- Status: draft_complete` or `- Status: delivery_blocked`.');
  }
  if (!['draft_complete', 'delivery_blocked'].includes(workflowStatusValue)) {
    throw new Error(`Project is not ready for delivery export. Expected Status: draft_complete or delivery_blocked, got ${workflowStatusValue}.`);
  }

  const metadataPath = path.join(projectRoot, '50-delivery', 'metadata.md');
  const warnings = collectMetadataWarnings(metadataPath);

  const chapterIds = getPlannedChapterIds(path.join(projectRoot, '30-draft', 'chapter-plan.md'));
  warnings.push(...collectChapterAndReviewWarnings(projectRoot, chapterIds));

  const fonts = getResolvedFonts(installedFonts);
  return {
    chapterIds,
    mainFont: fonts.mainFont,
    mainFontRegular: fonts.mainFontRegular,
    sansFont: fonts.sansFont,
    metadataPath,
    pandocMetadataPath: getPandocMetadataFilePath(metadataPath),
    frontmatterPath: path.join(projectRoot, '50-delivery', 'frontmatter.md'),
    workflowStatusPath,
    warnings,
    pdfBrowserPath: resolvePdfBrowserPath(pdfBrowserPath),
  };
}

export function buildBookManuscript(
  projectRoot: string,
  outputPath: string,
  chapterIds: string[] | null = null,
): void {
  const resolvedChapterIds =
    chapterIds || getPlannedChapterIds(path.join(projectRoot, '30-draft', 'chapter-plan.md'));
  const sections = [
    readText(path.join(projectRoot, '50-delivery', 'frontmatter.md')).trimEnd(),
    ...resolvedChapterIds.map((chapterId) =>
      readText(path.join(projectRoot, '30-draft', 'chapters', `${chapterId}.md`)).trimEnd(),
    ),
  ];

  writeText(outputPath, `${sections.join(os.EOL.repeat(2))}${os.EOL}`);
}

export function newPandocCommand({
  pandocPath,
  projectRoot,
  defaultsFile,
  outputPath,
  metadataFile,
  mainFont,
  mainFontRegular,
  sansFont,
  coverPath,
}: PandocCommandOptions): string[] {
  const command = [
    pandocPath,
    path.join(projectRoot, '50-delivery', 'book.md'),
    '--defaults',
    defaultsFile,
    '--metadata-file',
    metadataFile,
    '--output',
    outputPath,
  ];

  if (mainFont) {
    command.push('-V', `mainfont=${mainFont}`);
  }

  if (mainFontRegular) {
    command.push('-V', `mainfontregular=${mainFontRegular}`);
  }

  if (sansFont) {
    command.push('-V', `sansfont=${sansFont}`);
  }

  if (coverPath && outputPath.endsWith('.epub')) {
    command.push('--epub-cover-image', coverPath);
  }

  return command;
}

export function materializePandocDefaultsFile(defaultsFile: string): string {
  const resolvedDefaultsFile = path.resolve(defaultsFile);
  const defaultsDirectory = path.dirname(resolvedDefaultsFile);
  const defaultsContent = readText(resolvedDefaultsFile);
  const templateMatch = defaultsContent.match(/^template:\s+(.+)$/m);

  if (!templateMatch) {
    return resolvedDefaultsFile;
  }

  const configuredTemplatePath = templateMatch[1].trim();
  const normalizedTemplatePath = configuredTemplatePath.replace(/^['"]|['"]$/g, '');
  const absoluteTemplatePath = path.isAbsolute(normalizedTemplatePath)
    ? normalizedTemplatePath
    : path.resolve(defaultsDirectory, normalizedTemplatePath);

  const rewrittenContent = defaultsContent.replace(
    new RegExp(`^template:\\s+${escapeRegExp(configuredTemplatePath)}$`, 'm'),
    `template: ${absoluteTemplatePath}`,
  );

  const tempDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'novel-delivery-pandoc-'));
  const materializedDefaultsPath = path.join(tempDirectory, path.basename(resolvedDefaultsFile));
  writeText(materializedDefaultsPath, rewrittenContent);
  return materializedDefaultsPath;
}

export function copyPrintStyles(outputDirectory: string): string {
  ensureDirectory(outputDirectory);
  const sourcePath = path.resolve(__dirname, '..', 'templates', PRINT_STYLES_FILENAME);
  const targetPath = path.join(outputDirectory, PRINT_STYLES_FILENAME);
  fs.copyFileSync(sourcePath, targetPath);
  return targetPath;
}

export function getPdfRenderOptions(pdfPath: string): Record<string, unknown> {
  const resolvedPdfPath =
    path.isAbsolute(pdfPath) || path.win32.isAbsolute(pdfPath)
      ? pdfPath
      : path.resolve(pdfPath);

  return {
    path: resolvedPdfPath,
    printBackground: true,
    preferCSSPageSize: true,
    displayHeaderFooter: false,
    margin: {
      top: '0',
      right: '0',
      bottom: '0',
      left: '0',
    },
  };
}

export function writeExportFailureLog(
  outputDirectory: string,
  targetName: string,
  commandLine: string,
  errorText: string,
  recoveryHint = '',
): void {
  ensureDirectory(outputDirectory);
  const logPath = path.join(outputDirectory, 'export-log.md');
  const body = [
    '# Export Failure',
    '',
    `- Time: ${new Date().toISOString()}`,
    `- Target: ${targetName}`,
    `- Command: ${commandLine}`,
    `- Error: ${errorText}`,
    '- Likely Cause: Pandoc, Chromium browser availability, fonts, metadata, or source files are invalid.',
    `- Next Fix: ${recoveryHint || 'Validate the browser path, Pandoc availability, and required delivery inputs, then rerun the export.'}`,
    '',
  ].join('\n');

  writeText(logPath, body);
}

export function writeExportWarnings(outputDirectory: string, warnings: string[]): string | null {
  if (!warnings || warnings.length === 0) {
    return null;
  }

  ensureDirectory(outputDirectory);
  const warningPath = path.join(outputDirectory, 'delivery-warnings.md');
  const body = [
    '# Delivery Warnings',
    '',
    `- Time: ${new Date().toISOString()}`,
    '',
    ...warnings.map((warning) => `- ${warning}`),
    '',
  ].join('\n');

  writeText(warningPath, body);
  return warningPath;
}

export function assertExportOutputs(targets: ExportTargets): void {
  for (const outputPath of [targets.latteHtml, targets.mochaHtml, targets.lattePdf, targets.mochaPdf, targets.epub]) {
    if (!exists(outputPath)) {
      throw new Error(`Missing export output: ${outputPath}`);
    }

    const stats = fs.statSync(outputPath);
    if (stats.size <= 0) {
      throw new Error(`Empty export output: ${outputPath}`);
    }
  }
}

export function setWorkflowDeliveryStatus(workflowStatusPath: string, status: string): void {
  const content = readText(workflowStatusPath);
  if (STATUS_FIELD_PATTERN.test(content)) {
    writeText(workflowStatusPath, content.replace(STATUS_FIELD_PATTERN, `$1${status}`));
    return;
  }

  const suffix = content.endsWith('\n') ? '' : os.EOL;
  writeText(workflowStatusPath, `${content}${suffix}- Status: ${status}${os.EOL}`);
}

function invokePandocExport(command: string[], targetName: string, outputDirectory: string): void {
  const [executable, ...argumentsList] = command;
  const result = spawnSync(executable, argumentsList, {
    encoding: 'utf8',
    stdio: 'inherit',
  });

  if (result.status !== 0) {
    writeExportFailureLog(
      outputDirectory,
      targetName,
      command.join(' '),
      `Pandoc exited with code ${result.status}`,
    );
    throw new Error(`Pandoc export failed for ${targetName}`);
  }
}

export async function renderPdfFromHtml({
  browserPath,
  htmlPath,
  pdfPath,
  targetName,
  outputDirectory,
}: {
  browserPath: string;
  htmlPath: string;
  pdfPath: string;
  targetName: string;
  outputDirectory: string;
}): Promise<void> {
  try {
    const { chromium } = await loadPlaywrightModule();
    const browser = await chromium.launch({
      executablePath: browserPath,
      headless: true,
    });

    try {
      const page = await browser.newPage();
      await page.goto(pathToFileURL(path.resolve(htmlPath)).href, {
        waitUntil: 'networkidle',
      });
      await page.emulateMedia({ media: 'print' });
      await page.pdf(getPdfRenderOptions(pdfPath));
    } finally {
      await browser.close();
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    writeExportFailureLog(
      outputDirectory,
      targetName,
      `playwright chromium launch ${browserPath} ${path.resolve(htmlPath)}`,
      message,
      getPdfBrowserEnvironmentMessage(getPdfBrowserInstallPlan()),
    );
    throw new Error(`Browser PDF render failed for ${targetName}`);
  }
}

export async function invokeNovelDeliveryExport({
  projectRoot,
  pandocPath = 'pandoc',
  pdfBrowserPath = null,
  installedFonts,
}: DeliveryExportOptions = {}): Promise<{ projectRoot: string; targets: ExportTargets; warnings: string[] }> {
  const resolvedProjectRoot = resolveNovelProjectRoot(projectRoot || process.cwd());
  const targets = getExportTargets(resolvedProjectRoot);
  ensureDirectory(targets.outputDirectory);

  try {
    const preflight = testDeliveryPreflight(
      resolvedProjectRoot,
      pandocPath,
      installedFonts,
      pdfBrowserPath,
    );
    setWorkflowDeliveryStatus(preflight.workflowStatusPath, 'delivery_in_progress');
    buildBookManuscript(
      resolvedProjectRoot,
      path.join(resolvedProjectRoot, '50-delivery', 'book.md'),
      preflight.chapterIds,
    );

    const coverResult = getMetadataCoverPath(resolvedProjectRoot, preflight.metadataPath);
    const warnings = [...preflight.warnings, ...coverResult.warnings];
    const latteHtmlDefaults = materializePandocDefaultsFile(
      path.resolve(__dirname, '..', 'pandoc', 'latte-html.yaml'),
    );
    const mochaHtmlDefaults = materializePandocDefaultsFile(
      path.resolve(__dirname, '..', 'pandoc', 'mocha-html.yaml'),
    );
    const epubDefaults = path.resolve(__dirname, '..', 'pandoc', 'epub.yaml');

    copyPrintStyles(targets.outputDirectory);

    invokePandocExport(
      newPandocCommand({
        pandocPath,
        projectRoot: resolvedProjectRoot,
        defaultsFile: latteHtmlDefaults,
        outputPath: targets.latteHtml,
        metadataFile: preflight.pandocMetadataPath,
        mainFont: preflight.mainFont,
        mainFontRegular: preflight.mainFontRegular,
        sansFont: preflight.sansFont,
      }),
      'latte-html',
      targets.outputDirectory,
    );

    invokePandocExport(
      newPandocCommand({
        pandocPath,
        projectRoot: resolvedProjectRoot,
        defaultsFile: mochaHtmlDefaults,
        outputPath: targets.mochaHtml,
        metadataFile: preflight.pandocMetadataPath,
        mainFont: preflight.mainFont,
        mainFontRegular: preflight.mainFontRegular,
        sansFont: preflight.sansFont,
      }),
      'mocha-html',
      targets.outputDirectory,
    );

    await renderPdfFromHtml({
      browserPath: preflight.pdfBrowserPath,
      htmlPath: targets.latteHtml,
      pdfPath: targets.lattePdf,
      targetName: 'latte-pdf',
      outputDirectory: targets.outputDirectory,
    });

    await renderPdfFromHtml({
      browserPath: preflight.pdfBrowserPath,
      htmlPath: targets.mochaHtml,
      pdfPath: targets.mochaPdf,
      targetName: 'mocha-pdf',
      outputDirectory: targets.outputDirectory,
    });

    invokePandocExport(
      newPandocCommand({
        pandocPath,
        projectRoot: resolvedProjectRoot,
        defaultsFile: epubDefaults,
        outputPath: targets.epub,
        metadataFile: preflight.pandocMetadataPath,
        coverPath: coverResult.coverPath,
      }),
      'epub',
      targets.outputDirectory,
    );

    assertExportOutputs(targets);
    writeExportWarnings(targets.outputDirectory, warnings);
    setWorkflowDeliveryStatus(preflight.workflowStatusPath, 'delivery_complete');
    return { projectRoot: resolvedProjectRoot, targets, warnings };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const workflowStatusPath = path.join(resolvedProjectRoot, '00-project', 'workflow-status.md');
    if (exists(workflowStatusPath)) {
      setWorkflowDeliveryStatus(workflowStatusPath, 'delivery_blocked');
    }

    const exportLogPath = path.join(targets.outputDirectory, 'export-log.md');
    if (!exists(exportLogPath)) {
      const recoveryHint = message.includes('Chromium-compatible browser')
        ? message
        : '';
      writeExportFailureLog(
        targets.outputDirectory,
        'delivery',
        'novel-delivery export pipeline',
        message,
        recoveryHint,
      );
    }

    throw error;
  }
}

function parseCliArguments(argv: string[]): {
  projectRoot: string;
  pandocPath: string;
  pdfBrowserPath: string | null;
} {
  const options = {
    projectRoot: process.cwd(),
    pandocPath: 'pandoc',
    pdfBrowserPath: null as string | null,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    switch (token) {
      case '--project-root':
        options.projectRoot = argv[index + 1];
        index += 1;
        break;
      case '--pandoc-path':
        options.pandocPath = argv[index + 1];
        index += 1;
        break;
      case '--pdf-browser-path':
        options.pdfBrowserPath = argv[index + 1];
        index += 1;
        break;
      default:
        throw new Error(`Unknown argument: ${token}`);
    }
  }

  return options;
}

const isEntrypoint = process.argv[1] && path.resolve(process.argv[1]) === __filename;

if (isEntrypoint) {
  try {
    const options = parseCliArguments(process.argv.slice(2));
    await invokeNovelDeliveryExport(options);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(message);
    process.exitCode = 1;
  }
}
