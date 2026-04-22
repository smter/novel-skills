import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import process from "node:process";
import { fileURLToPath, pathToFileURL } from "node:url";
import { spawnSync } from "node:child_process";

const BODY_FONT_CANDIDATES = [
  "Source Han Serif SC",
  "Noto Serif CJK SC",
  "Songti SC",
  "SimSun",
];

const HEADING_FONT_CANDIDATES = [
  "Source Han Sans SC",
  "Noto Sans CJK SC",
  "Microsoft YaHei",
  "SimHei",
];

const PDF_BROWSER_CANDIDATES = {
  Windows: ["msedge", "chrome", "chromium", "brave"],
  macOS: ["Microsoft Edge", "Google Chrome", "Chromium", "Brave Browser"],
  Linux: ["microsoft-edge", "google-chrome", "chromium", "chromium-browser", "brave-browser"],
};

const PRINT_STYLES_FILENAME = "novel-book.css";

const STATUS_PATTERN =
  /\((initialized|research_in_progress|research_blocked|research_complete|draft_in_progress|draft_blocked|draft_complete|delivery_in_progress|delivery_blocked|delivery_complete)\)/;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function loadPlaywrightModule() {
  try {
    return await import("playwright-core");
  } catch (error) {
    throw new Error(
      "Playwright module not found. Run npm install from the skill directory that contains this export script.",
      { cause: error },
    );
  }
}

function exists(targetPath) {
  return fs.existsSync(targetPath);
}

function readText(targetPath) {
  return fs.readFileSync(targetPath, "utf8");
}

function writeText(targetPath, content) {
  fs.writeFileSync(targetPath, content, "utf8");
}

function ensureDirectory(targetPath) {
  fs.mkdirSync(targetPath, { recursive: true });
}

function normalizeSlashes(targetPath) {
  return targetPath.split(path.sep).join("/");
}

function getCurrentPlatform() {
  switch (process.platform) {
    case "win32":
      return "Windows";
    case "darwin":
      return "macOS";
    case "linux":
      return "Linux";
    default:
      return "Unknown";
  }
}

function findCommand(commandName) {
  const whichCommand = process.platform === "win32" ? "where" : "which";
  const result = spawnSync(whichCommand, [commandName], { encoding: "utf8" });
  return result.status === 0;
}

function getPdfBrowserInstallPlan(platform = getCurrentPlatform()) {
  switch (platform) {
    case "Windows":
      return {
        platform: "Windows",
        browser: "Chromium",
        primaryCommand: "npx playwright install chromium",
        fallbackCommands: [
          "winget install Microsoft.Edge",
          "winget install Google.Chrome",
        ],
      };
    case "macOS":
      return {
        platform: "macOS",
        browser: "Chromium",
        primaryCommand: "npx playwright install chromium",
        fallbackCommands: [
          "brew install --cask microsoft-edge",
          "brew install --cask google-chrome",
        ],
      };
    case "Linux":
      return {
        platform: "Linux",
        browser: "Chromium",
        primaryCommand: "npx playwright install chromium",
        fallbackCommands: [
          "sudo apt-get install -y chromium-browser",
          "sudo dnf install -y chromium",
          "sudo pacman -S --needed chromium",
        ],
      };
    default:
      return {
        platform,
        browser: "Chromium",
        primaryCommand: "npx playwright install chromium",
        fallbackCommands: [],
      };
  }
}

function getPdfBrowserEnvironmentMessage(installPlan) {
  const fallback =
    installPlan.fallbackCommands.length > 0
      ? ` Fallbacks: ${installPlan.fallbackCommands.join(" | ")}`
      : "";
  return `Missing Chromium-compatible browser on ${installPlan.platform}. Primary install command: ${installPlan.primaryCommand}.${fallback}`;
}

function findPlaywrightBrowserExecutable(platform = getCurrentPlatform(), homeDirectory = os.homedir()) {
  const cacheRootByPlatform = {
    Windows: path.join(homeDirectory, "AppData", "Local", "ms-playwright"),
    macOS: path.join(homeDirectory, "Library", "Caches", "ms-playwright"),
    Linux: path.join(homeDirectory, ".cache", "ms-playwright"),
  };
  const executableNames = {
    Windows: ["chrome.exe"],
    macOS: ["Chromium.app"],
    Linux: ["chrome"],
  };
  const cacheRoot = cacheRootByPlatform[platform];
  if (!cacheRoot || !exists(cacheRoot)) {
    return null;
  }

  const matchedPaths = [];
  for (const entry of fs.readdirSync(cacheRoot, { withFileTypes: true })) {
    if (!entry.isDirectory() || !entry.name.startsWith("chromium-")) {
      continue;
    }

    const candidateRoot = path.join(cacheRoot, entry.name);
    if (platform === "Windows") {
      for (const subdirectory of ["chrome-win64", "chrome-win"]) {
        const candidate = path.join(candidateRoot, subdirectory, "chrome.exe");
        if (exists(candidate)) {
          matchedPaths.push(candidate);
        }
      }
      continue;
    }

    if (platform === "macOS") {
      const candidate = path.join(
        candidateRoot,
        "chrome-mac",
        "Chromium.app",
        "Contents",
        "MacOS",
        "Chromium",
      );
      if (exists(candidate)) {
        matchedPaths.push(candidate);
      }
      continue;
    }

    for (const executableName of executableNames[platform] || []) {
      const candidate = path.join(candidateRoot, "chrome-linux", executableName);
      if (exists(candidate)) {
        matchedPaths.push(candidate);
      }
    }
  }

  return matchedPaths.sort().at(-1) || null;
}

function resolvePdfBrowserPath(pdfBrowserPath = null) {
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

  const playwrightBrowserPath = findPlaywrightBrowserExecutable(platform);
  if (playwrightBrowserPath) {
    return playwrightBrowserPath;
  }

  throw new Error(getPdfBrowserEnvironmentMessage(getPdfBrowserInstallPlan(platform)));
}

function parseWindowsRegistryFonts(output) {
  const fonts = new Set();
  for (const line of output.split(/\r?\n/)) {
    const match = line.match(/^\s+(.+?)\s+REG_\w+\s+.+$/);
    if (!match) {
      continue;
    }

    const cleanName = match[1].replace(/\s*\(.*\)$/, "").trim();
    if (cleanName && !cleanName.startsWith("PS")) {
      fonts.add(cleanName);
      const ampersandIndex = cleanName.indexOf(" & ");
      if (ampersandIndex > 0) {
        fonts.add(cleanName.substring(0, ampersandIndex).trim());
      }
    }
  }

  return [...fonts];
}

function getInstalledFonts() {
  try {
    if (process.platform === "win32") {
      const outputs = [
        spawnSync(
          "reg",
          ["query", "HKLM\\SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion\\Fonts"],
          { encoding: "utf8" },
        ),
        spawnSync(
          "reg",
          ["query", "HKCU\\SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion\\Fonts"],
          { encoding: "utf8" },
        ),
      ];

      return outputs
        .filter((result) => result.status === 0)
        .flatMap((result) => parseWindowsRegistryFonts(result.stdout))
        .sort((left, right) => left.localeCompare(right));
    }

    if (process.platform === "darwin") {
      const result = spawnSync("system_profiler", ["SPFontsDataType"], {
        encoding: "utf8",
      });
      if (result.status === 0) {
        return result.stdout
          .split(/\r?\n/)
          .map((line) => line.trim())
          .filter((line) => line.endsWith(":"))
          .map((line) => line.slice(0, -1).trim())
          .filter(Boolean);
      }
    }

    const result = spawnSync("fc-list", [":", "family"], { encoding: "utf8" });
    if (result.status === 0) {
      return [...new Set(result.stdout.split(/\r?\n/).flatMap((line) => line.split(",")))]
        .map((line) => line.trim())
        .filter(Boolean);
    }
  } catch {
    return [];
  }

  return [];
}

function resolveFirstInstalledFont(candidates, installedFonts = getInstalledFonts()) {
  for (const candidate of candidates) {
    if (installedFonts.includes(candidate)) {
      return candidate;
    }
  }

  throw new Error(`No supported fonts found. Candidates: ${candidates.join(", ")}`);
}

function getResolvedFonts(installedFonts = getInstalledFonts()) {
  const mainFont = resolveFirstInstalledFont(BODY_FONT_CANDIDATES, installedFonts);
  return {
    mainFont,
    mainFontRegular: mainFont === "SimSun" ? null : "Medium",
    sansFont: resolveFirstInstalledFont(HEADING_FONT_CANDIDATES, installedFonts),
  };
}

function getExportTargets(projectRoot) {
  const slug = path.basename(projectRoot);
  const outputDirectory = path.join(projectRoot, "50-delivery", "output");

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

function getPlannedChapterIds(chapterPlanPath) {
  const chapterPlan = readText(chapterPlanPath);
  const matches = chapterPlan.match(/chapter-\d{2}/g) || [];
  const ordered = [...new Set(matches)];

  if (ordered.length === 0) {
    throw new Error("No planned chapters found in chapter-plan.md");
  }

  return ordered;
}

function collectMetadataWarnings(metadataPath) {
  const metadata = readText(metadataPath);
  const minimalRequirements = [
    { name: "title", pattern: /^\s*[-*]?\s*(title|书名)\s*[:：]/imu },
    { name: "author", pattern: /^\s*[-*]?\s*(author|作者|署名)\s*[:：]/imu },
    { name: "language", pattern: /^\s*[-*]?\s*(language|语言)\s*[:：]/imu },
  ];
  const optionalRequirements = [
    { name: "summary", pattern: /^\s*[-*]?\s*(summary|简介)\s*[:：]/imu },
    { name: "keywords", pattern: /^\s*[-*]?\s*(keywords|关键词)\s*[:：]/imu },
    { name: "publication date", pattern: /^\s*[-*]?\s*(publication\s*date|发布日期)\s*[:：]/imu },
    { name: "output formats", pattern: /^\s*[-*]?\s*(output\s*formats|目标格式|输出格式)\s*[:：]/imu },
  ];

  const missingMinimal = minimalRequirements
    .filter((requirement) => !requirement.pattern.test(metadata))
    .map((requirement) => requirement.name);

  if (missingMinimal.length > 0) {
    throw new Error(`Missing required metadata fields: ${missingMinimal.join(", ")}`);
  }

  return optionalRequirements
    .filter((requirement) => !requirement.pattern.test(metadata))
    .map((requirement) => `metadata.md is missing optional field: ${requirement.name}`);
}

function getMetadataCoverPath(projectRoot, metadataPath) {
  const metadata = readText(metadataPath);
  const match = metadata.match(/^\s*[-*]?\s*(cover\s*path|cover|封面路径)\s*[:：]\s*(.+?)\s*$/imu);
  if (!match) {
    return { coverPath: null, warnings: [] };
  }

  const rawRelativePath = match[2].trim().replace(/^"(.*)"$/, "$1");
  if (!rawRelativePath) {
    return { coverPath: null, warnings: ["metadata.md includes an empty cover path; continuing without EPUB cover image"] };
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

function collectChapterAndReviewWarnings(projectRoot, chapterIds) {
  const warnings = [];
  for (const chapterId of chapterIds) {
    const chapterPath = path.join(projectRoot, "30-draft", "chapters", `${chapterId}.md`);
    const reviewPath = path.join(
      projectRoot,
      "40-review",
      "chapter-reviews",
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
    if (review.includes("不通过")) {
      warnings.push(`Chapter review not passed: ${chapterId}; continuing export because review status is non-blocking`);
      continue;
    }

    if (!review.includes("通过")) {
      warnings.push(`Chapter review missing explicit pass marker: ${chapterId}; continuing export because review status is non-blocking`);
    }
  }

  return warnings;
}

function hasNovelProjectMarkers(candidateRoot) {
  return exists(path.join(candidateRoot, "00-project", "workflow-status.md"));
}

function discoverNovelProjectCandidates(searchRoot) {
  const candidates = [];
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

function resolveNovelProjectRoot(projectRootInput = process.cwd()) {
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

function testDeliveryPreflight(
  projectRoot,
  pandocPath,
  installedFonts = getInstalledFonts(),
  pdfBrowserPath = null,
) {
  const requiredFiles = [
    path.join("00-project", "workflow-status.md"),
    path.join("30-draft", "chapter-plan.md"),
    path.join("50-delivery", "metadata.md"),
    path.join("50-delivery", "frontmatter.md"),
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

  const workflowStatusPath = path.join(projectRoot, "00-project", "workflow-status.md");
  const workflowStatus = readText(workflowStatusPath);
  if (!/draft_complete|delivery_blocked/.test(workflowStatus)) {
    throw new Error("Project is not ready for delivery export.");
  }

  const metadataPath = path.join(projectRoot, "50-delivery", "metadata.md");
  const warnings = collectMetadataWarnings(metadataPath);

  const chapterIds = getPlannedChapterIds(path.join(projectRoot, "30-draft", "chapter-plan.md"));
  warnings.push(...collectChapterAndReviewWarnings(projectRoot, chapterIds));

  const fonts = getResolvedFonts(installedFonts);
  return {
    chapterIds,
    mainFont: fonts.mainFont,
    mainFontRegular: fonts.mainFontRegular,
    sansFont: fonts.sansFont,
    metadataPath,
    frontmatterPath: path.join(projectRoot, "50-delivery", "frontmatter.md"),
    workflowStatusPath,
    warnings,
    pdfBrowserPath: resolvePdfBrowserPath(pdfBrowserPath),
  };
}

function buildBookManuscript(projectRoot, outputPath, chapterIds = null) {
  const resolvedChapterIds =
    chapterIds || getPlannedChapterIds(path.join(projectRoot, "30-draft", "chapter-plan.md"));
  const sections = [
    readText(path.join(projectRoot, "50-delivery", "frontmatter.md")).trimEnd(),
    ...resolvedChapterIds.map((chapterId) =>
      readText(path.join(projectRoot, "30-draft", "chapters", `${chapterId}.md`)).trimEnd(),
    ),
  ];

  writeText(outputPath, `${sections.join(os.EOL.repeat(2))}${os.EOL}`);
}

function newPandocCommand({
  pandocPath,
  projectRoot,
  defaultsFile,
  outputPath,
  metadataFile,
  mainFont,
  mainFontRegular,
  sansFont,
  coverPath,
}) {
  const command = [
    pandocPath,
    path.join(projectRoot, "50-delivery", "book.md"),
    "--defaults",
    defaultsFile,
    "--metadata-file",
    metadataFile,
    "--output",
    outputPath,
  ];

  if (mainFont) {
    command.push("-V", `mainfont=${mainFont}`);
  }

  if (mainFontRegular) {
    command.push("-V", `mainfontregular=${mainFontRegular}`);
  }

  if (sansFont) {
    command.push("-V", `sansfont=${sansFont}`);
  }

  if (coverPath && outputPath.endsWith(".epub")) {
    command.push("--epub-cover-image", coverPath);
  }

  return command;
}

function copyPrintStyles(outputDirectory) {
  ensureDirectory(outputDirectory);
  const sourcePath = path.resolve(__dirname, "..", "templates", PRINT_STYLES_FILENAME);
  const targetPath = path.join(outputDirectory, PRINT_STYLES_FILENAME);
  fs.copyFileSync(sourcePath, targetPath);
  return targetPath;
}

function getPdfRenderOptions(pdfPath) {
  return {
    path: path.resolve(pdfPath),
    printBackground: true,
    preferCSSPageSize: true,
    displayHeaderFooter: false,
    margin: {
      top: "0",
      right: "0",
      bottom: "0",
      left: "0",
    },
  };
}

function writeExportFailureLog(outputDirectory, targetName, commandLine, errorText, recoveryHint = "") {
  ensureDirectory(outputDirectory);
  const logPath = path.join(outputDirectory, "export-log.md");
  const body = [
    "# Export Failure",
    "",
    `- Time: ${new Date().toISOString()}`,
    `- Target: ${targetName}`,
    `- Command: ${commandLine}`,
    `- Error: ${errorText}`,
    "- Likely Cause: Pandoc, Chromium browser availability, fonts, metadata, or source files are invalid.",
    `- Next Fix: ${recoveryHint || "Validate the browser path, Pandoc availability, and required delivery inputs, then rerun the export."}`,
    "",
  ].join("\n");

  writeText(logPath, body);
}

function writeExportWarnings(outputDirectory, warnings) {
  if (!warnings || warnings.length === 0) {
    return null;
  }

  ensureDirectory(outputDirectory);
  const warningPath = path.join(outputDirectory, "delivery-warnings.md");
  const body = [
    "# Delivery Warnings",
    "",
    `- Time: ${new Date().toISOString()}`,
    "",
    ...warnings.map((warning) => `- ${warning}`),
    "",
  ].join("\n");

  writeText(warningPath, body);
  return warningPath;
}

function assertExportOutputs(targets) {
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

function setWorkflowDeliveryStatus(workflowStatusPath, status) {
  const content = readText(workflowStatusPath);
  if (STATUS_PATTERN.test(content)) {
    writeText(workflowStatusPath, content.replace(STATUS_PATTERN, `(${status})`));
    return;
  }

  const suffix = content.endsWith("\n") ? "" : os.EOL;
  writeText(workflowStatusPath, `${content}${suffix}- Status: ${status}${os.EOL}`);
}

function invokePandocExport(command, targetName, outputDirectory) {
  const [executable, ...argumentsList] = command;
  const result = spawnSync(executable, argumentsList, {
    encoding: "utf8",
    stdio: "inherit",
  });

  if (result.status !== 0) {
    writeExportFailureLog(
      outputDirectory,
      targetName,
      command.join(" "),
      `Pandoc exited with code ${result.status}`,
    );
    throw new Error(`Pandoc export failed for ${targetName}`);
  }
}

async function renderPdfFromHtml({
  browserPath,
  htmlPath,
  pdfPath,
  targetName,
  outputDirectory,
}) {
  try {
    const { chromium } = await loadPlaywrightModule();
    const browser = await chromium.launch({
      executablePath: browserPath,
      headless: true,
    });

    try {
      const page = await browser.newPage();
      await page.goto(pathToFileURL(path.resolve(htmlPath)).href, {
        waitUntil: "networkidle",
      });
      await page.emulateMedia({ media: "print" });
      await page.pdf(getPdfRenderOptions(pdfPath));
    } finally {
      await browser.close();
    }
  } catch (error) {
    writeExportFailureLog(
      outputDirectory,
      targetName,
      `playwright chromium launch ${browserPath} ${path.resolve(htmlPath)}`,
      error.message,
      getPdfBrowserEnvironmentMessage(getPdfBrowserInstallPlan()),
    );
    throw new Error(`Browser PDF render failed for ${targetName}`);
  }
}

async function invokeNovelDeliveryExport({
  projectRoot,
  pandocPath = "pandoc",
  pdfBrowserPath = null,
  installedFonts,
} = {}) {
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
    setWorkflowDeliveryStatus(preflight.workflowStatusPath, "delivery_in_progress");
    buildBookManuscript(
      resolvedProjectRoot,
      path.join(resolvedProjectRoot, "50-delivery", "book.md"),
      preflight.chapterIds,
    );

    const coverResult = getMetadataCoverPath(resolvedProjectRoot, preflight.metadataPath);
    const warnings = [...preflight.warnings, ...coverResult.warnings];
    const latteHtmlDefaults = path.resolve(__dirname, "..", "pandoc", "latte-html.yaml");
    const mochaHtmlDefaults = path.resolve(__dirname, "..", "pandoc", "mocha-html.yaml");
    const epubDefaults = path.resolve(__dirname, "..", "pandoc", "epub.yaml");

    copyPrintStyles(targets.outputDirectory);

    invokePandocExport(
      newPandocCommand({
        pandocPath,
        projectRoot: resolvedProjectRoot,
        defaultsFile: latteHtmlDefaults,
        outputPath: targets.latteHtml,
        metadataFile: preflight.metadataPath,
        mainFont: preflight.mainFont,
        mainFontRegular: preflight.mainFontRegular,
        sansFont: preflight.sansFont,
      }),
      "latte-html",
      targets.outputDirectory,
    );

    invokePandocExport(
      newPandocCommand({
        pandocPath,
        projectRoot: resolvedProjectRoot,
        defaultsFile: mochaHtmlDefaults,
        outputPath: targets.mochaHtml,
        metadataFile: preflight.metadataPath,
        mainFont: preflight.mainFont,
        mainFontRegular: preflight.mainFontRegular,
        sansFont: preflight.sansFont,
      }),
      "mocha-html",
      targets.outputDirectory,
    );

    await renderPdfFromHtml({
      browserPath: preflight.pdfBrowserPath,
      htmlPath: targets.latteHtml,
      pdfPath: targets.lattePdf,
      targetName: "latte-pdf",
      outputDirectory: targets.outputDirectory,
    });

    await renderPdfFromHtml({
      browserPath: preflight.pdfBrowserPath,
      htmlPath: targets.mochaHtml,
      pdfPath: targets.mochaPdf,
      targetName: "mocha-pdf",
      outputDirectory: targets.outputDirectory,
    });

    invokePandocExport(
      newPandocCommand({
        pandocPath,
        projectRoot: resolvedProjectRoot,
        defaultsFile: epubDefaults,
        outputPath: targets.epub,
        metadataFile: preflight.metadataPath,
        coverPath: coverResult.coverPath,
      }),
      "epub",
      targets.outputDirectory,
    );

    assertExportOutputs(targets);
    writeExportWarnings(targets.outputDirectory, warnings);
    setWorkflowDeliveryStatus(preflight.workflowStatusPath, "delivery_complete");
    return { projectRoot: resolvedProjectRoot, targets, warnings };
  } catch (error) {
    const workflowStatusPath = path.join(resolvedProjectRoot, "00-project", "workflow-status.md");
    if (exists(workflowStatusPath)) {
      setWorkflowDeliveryStatus(workflowStatusPath, "delivery_blocked");
    }

    const exportLogPath = path.join(targets.outputDirectory, "export-log.md");
    if (!exists(exportLogPath)) {
      const recoveryHint = error.message.includes("Chromium-compatible browser")
        ? error.message
        : "";
      writeExportFailureLog(
        targets.outputDirectory,
        "delivery",
        "novel-delivery export pipeline",
        error.message,
        recoveryHint,
      );
    }

    throw error;
  }
}

function parseCliArguments(argv) {
  const options = {
    projectRoot: process.cwd(),
    pandocPath: "pandoc",
    pdfBrowserPath: null,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    switch (token) {
      case "--project-root":
        options.projectRoot = argv[index + 1];
        index += 1;
        break;
      case "--pandoc-path":
        options.pandocPath = argv[index + 1];
        index += 1;
        break;
      case "--pdf-browser-path":
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
    console.error(error.message);
    process.exitCode = 1;
  }
}

export {
  assertExportOutputs,
  buildBookManuscript,
  collectChapterAndReviewWarnings,
  collectMetadataWarnings,
  copyPrintStyles,
  findPlaywrightBrowserExecutable,
  getCurrentPlatform,
  getExportTargets,
  getPdfRenderOptions,
  getMetadataCoverPath,
  getPdfBrowserEnvironmentMessage,
  getPdfBrowserInstallPlan,
  getPlannedChapterIds,
  getResolvedFonts,
  invokeNovelDeliveryExport,
  newPandocCommand,
  resolveFirstInstalledFont,
  resolveNovelProjectRoot,
  renderPdfFromHtml,
  resolvePdfBrowserPath,
  setWorkflowDeliveryStatus,
  testDeliveryPreflight,
  writeExportWarnings,
  writeExportFailureLog,
};
