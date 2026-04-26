import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

import {
  assertExportOutputs,
  buildBookManuscript,
  collectChapterAndReviewWarnings,
  collectMetadataWarnings,
  copyPrintStyles,
  findPlaywrightBrowserExecutable,
  getDefaultMacOsBrowserPaths,
  getExportTargets,
  getPandocMetadataFilePath,
  getPdfRenderOptions,
  getMetadataCoverPath,
  getPdfBrowserEnvironmentMessage,
  getPdfBrowserInstallPlan,
  getInstalledFontsFromMacSystemProfiler,
  getResolvedFonts,
  materializePandocDefaultsFile,
  newPandocCommand,
  parseDeliveryMetadata,
  resolveNovelProjectRoot,
  setWorkflowDeliveryStatus,
  testDeliveryPreflight,
  writeExportWarnings,
  writeExportFailureLog,
} from "../scripts/export-book.mts";

const skillRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function makeTempDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), "novel-delivery-"));
}

function writeFile(targetPath, content) {
  fs.mkdirSync(path.dirname(targetPath), { recursive: true });
  fs.writeFileSync(targetPath, content, "utf8");
}

test("fails when metadata.md is missing", () => {
  const novelRoot = makeTempDir();
  writeFile(
    path.join(novelRoot, "00-project", "workflow-status.md"),
    "- **当前阶段**：创作完成 (draft_complete)\n",
  );
  writeFile(
    path.join(novelRoot, "30-draft", "chapter-plan.md"),
    "## Planned Chapters\n- chapter-01\n",
  );

  assert.throws(
    () => testDeliveryPreflight(novelRoot, process.execPath, ["Source Han Serif SC", "Source Han Sans SC"], process.execPath),
    /metadata\.md/,
  );
});

test("assembles frontmatter before planned chapters", () => {
  const novelRoot = makeTempDir();
  writeFile(path.join(novelRoot, "50-delivery", "frontmatter.md"), "# 扉页\n");
  writeFile(
    path.join(novelRoot, "30-draft", "chapter-plan.md"),
    "## Planned Chapters\n- chapter-02\n- chapter-01\n",
  );
  writeFile(path.join(novelRoot, "30-draft", "chapters", "chapter-01.md"), "# 第一章\n");
  writeFile(path.join(novelRoot, "30-draft", "chapters", "chapter-02.md"), "# 第二章\n");

  const bookPath = path.join(novelRoot, "50-delivery", "book.md");
  buildBookManuscript(novelRoot, bookPath);

  assert.equal(fs.readFileSync(bookPath, "utf8"), `# 扉页${os.EOL}${os.EOL}# 第二章${os.EOL}${os.EOL}# 第一章${os.EOL}`);
});

test("builds latte, mocha html, pdf, and epub output paths from the project slug", () => {
  const paths = getExportTargets(path.join("C:", "books", "snake-bite-revenge"));

  assert.equal(paths.latteHtml, path.join("C:", "books", "snake-bite-revenge", "50-delivery", "output", "snake-bite-revenge-latte.html"));
  assert.equal(paths.mochaHtml, path.join("C:", "books", "snake-bite-revenge", "50-delivery", "output", "snake-bite-revenge-mocha.html"));
  assert.equal(paths.lattePdf, path.join("C:", "books", "snake-bite-revenge", "50-delivery", "output", "snake-bite-revenge-latte.pdf"));
  assert.equal(paths.mochaPdf, path.join("C:", "books", "snake-bite-revenge", "50-delivery", "output", "snake-bite-revenge-mocha.pdf"));
  assert.equal(paths.epub, path.join("C:", "books", "snake-bite-revenge", "50-delivery", "output", "snake-bite-revenge.epub"));
});

test("writes export-log.md when browser-based pdf execution fails", () => {
  const outputRoot = path.join(makeTempDir(), "50-delivery", "output");
  fs.mkdirSync(outputRoot, { recursive: true });

  writeExportFailureLog(outputRoot, "latte-pdf", "msedge --headless ...", "browser print failed");

  const logPath = path.join(outputRoot, "export-log.md");
  assert.equal(fs.existsSync(logPath), true);
  assert.match(fs.readFileSync(logPath, "utf8"), /browser print failed/);
});

test("writes delivery-warnings.md for non-blocking export issues", () => {
  const outputRoot = path.join(makeTempDir(), "50-delivery", "output");
  fs.mkdirSync(outputRoot, { recursive: true });

  const warningPath = writeExportWarnings(outputRoot, [
    "metadata.md is missing optional field: keywords",
    "Chapter review not passed: chapter-02; continuing export because review status is non-blocking",
  ]);

  assert.equal(fs.existsSync(warningPath), true);
  assert.match(fs.readFileSync(warningPath, "utf8"), /metadata\.md is missing optional field: keywords/);
});

test("builds Pandoc commands with the selected fonts and html defaults file", () => {
  const command = newPandocCommand({
    pandocPath: "pandoc",
    projectRoot: path.join("C:", "books", "snake-bite-revenge"),
    defaultsFile: path.join("C:", "skill", "pandoc", "latte-html.yaml"),
    outputPath: path.join("C:", "books", "snake-bite-revenge", "50-delivery", "output", "snake-bite-revenge-latte.html"),
    metadataFile: path.join("C:", "books", "snake-bite-revenge", "50-delivery", "metadata.md"),
    mainFont: "Source Han Serif SC",
    mainFontRegular: "Medium",
    sansFont: "Source Han Sans SC",
  });

  assert.equal(command.includes("--defaults"), true);
  assert.equal(command.includes(path.join("C:", "skill", "pandoc", "latte-html.yaml")), true);
  assert.equal(command.includes("--metadata-file"), true);
  assert.equal(command.includes("mainfont=Source Han Serif SC"), true);
  assert.equal(command.includes("mainfontregular=Medium"), true);
  assert.equal(command.includes("sansfont=Source Han Sans SC"), true);
});

test("materializes html defaults with an absolute template path for Pandoc 3.x", () => {
  const defaultsPath = path.join(skillRoot, "pandoc", "latte-html.yaml");

  const materializedPath = materializePandocDefaultsFile(defaultsPath);
  const materializedYaml = fs.readFileSync(materializedPath, "utf8");

  assert.notEqual(materializedPath, defaultsPath);
  assert.match(
    materializedYaml,
    new RegExp(`template:\\s+${path.join(skillRoot, "templates", "novel-book.html").replace(/[.*+?^${}()|[\\]\\\\]/g, "\\$&")}`),
  );
  assert.equal(materializedYaml.includes("template: ../templates/novel-book.html"), false);
});

test("sets workflow status to delivery_blocked when export fails", () => {
  const workflowPath = path.join(makeTempDir(), "workflow-status.md");
  writeFile(workflowPath, "- **当前阶段**：创作完成 (draft_complete)\n");

  setWorkflowDeliveryStatus(workflowPath, "delivery_blocked");

  assert.match(fs.readFileSync(workflowPath, "utf8"), /delivery_blocked/);
});

test("allows optional metadata fields to be missing while collecting warnings", () => {
  const metadataPath = path.join(makeTempDir(), "metadata.md");
  writeFile(
    metadataPath,
    ["title: 蛇吻", "author: 测试作者", "language: zh-CN", ""].join("\n"),
  );

  const warnings = collectMetadataWarnings(metadataPath);

  assert.deepEqual(warnings, [
    "metadata.md is missing optional field: summary",
    "metadata.md is missing optional field: keywords",
    "metadata.md is missing optional field: publication date",
    "metadata.md is missing optional field: output formats",
  ]);
});

test("parses markdown delivery metadata into Pandoc-friendly scalar and list values", () => {
  const metadata = parseDeliveryMetadata([
    "# Metadata",
    "",
    "## Bibliographic Data",
    "",
    "- Title: 和自己一起的异世界冒险",
    "- Author: 待补充",
    "- Language: zh",
    "- Summary: 两位主角在异世界相遇。",
    "- Keywords: 异世界, 转生, 冒险",
    "- Publication Date: 2026-04-26",
    "",
    "## Output Targets",
    "",
    "- Produce PDF: true",
    "- Produce EPUB: true",
    "- Cover Path: assets/cover.png",
  ].join("\n"));

  assert.deepEqual(metadata, {
    title: "和自己一起的异世界冒险",
    author: "待补充",
    language: "zh",
    summary: "两位主角在异世界相遇。",
    keywords: ["异世界", "转生", "冒险"],
    date: "2026-04-26",
    producePdf: true,
    produceEpub: true,
    coverPath: "assets/cover.png",
  });
});

test("writes a temporary YAML metadata file for Pandoc instead of passing metadata.md directly", () => {
  const novelRoot = makeTempDir();
  const metadataPath = path.join(novelRoot, "50-delivery", "metadata.md");
  writeFile(
    metadataPath,
    [
      "# Metadata",
      "",
      "## Bibliographic Data",
      "",
      "- Title: 蛇吻",
      "- Author: 测试作者",
      "- Language: zh-CN",
      "- Keywords: 复仇, 惊悚",
      "",
      "## Output Targets",
      "",
      "- Produce PDF: true",
      "- Produce EPUB: false",
    ].join("\n"),
  );

  const yamlPath = getPandocMetadataFilePath(metadataPath);
  const yaml = fs.readFileSync(yamlPath, "utf8");

  assert.notEqual(yamlPath, metadataPath);
  assert.match(yaml, /^title:\s*"蛇吻"$/m);
  assert.match(yaml, /^author:\s*"测试作者"$/m);
  assert.match(yaml, /^lang:\s*"zh-CN"$/m);
  assert.match(yaml, /^keywords:\n\s*-\s*"复仇"\n\s*-\s*"惊悚"/m);
  assert.match(yaml, /^produce-pdf:\s*true$/m);
  assert.equal(yaml.includes("# Metadata"), false);
});

test("parses macOS system_profiler output into family names usable for font matching", () => {
  const parsedFonts = getInstalledFontsFromMacSystemProfiler([
    "Fonts:",
    "",
    "    Songti.ttc:",
    "",
    "      Kind: TrueType",
    "      Typefaces:",
    "        STSongti-SC-Regular:",
    "          Full Name: Songti SC Regular",
    "          Family: Songti SC",
    "          Style: Regular",
    "        STSongti-SC-Bold:",
    "          Full Name: Songti SC Bold",
    "          Family: Songti SC",
    "          Style: Bold",
    "    PingFang.ttc:",
    "",
    "      Typefaces:",
    "        PingFangSC-Regular:",
    "          Full Name: PingFang SC Regular",
    "          Family: PingFang SC",
    "          Style: Regular",
  ].join("\n"));

  assert.equal(parsedFonts.includes("Songti SC"), true);
  assert.equal(parsedFonts.includes("Songti SC Regular"), true);
  assert.equal(parsedFonts.includes("PingFang SC"), true);
});

test("parses localized macOS font names through Unique Name aliases", () => {
  const parsedFonts = getInstalledFontsFromMacSystemProfiler([
    "Fonts:",
    "",
    "    Songti.ttc:",
    "      Typefaces:",
    "        STSongti-SC-Regular:",
    "          Full Name: 宋体-简 常规体",
    "          Family: 宋体-简",
    "          Style: 常规体",
    "          Unique Name: Songti SC Regular; 17.0d2e3; 2021-06-30",
    "    PingFang.ttc:",
    "      Typefaces:",
    "        PingFangSC-Regular:",
    "          Full Name: 苹方-简 常规体",
    "          Family: 苹方-简",
    "          Style: 常规体",
    "          Unique Name: PingFang SC Regular; 20.0d1e1; 2024-01-26",
  ].join("\n"));

  assert.equal(parsedFonts.includes("Songti SC"), true);
  assert.equal(parsedFonts.includes("PingFang SC"), true);
});

test("resolves delivery fonts from macOS family names exposed by system_profiler", () => {
  const resolved = getResolvedFonts([
    "Songti SC",
    "PingFang SC",
  ]);

  assert.equal(resolved.mainFont, "Songti SC");
  assert.equal(resolved.sansFont, "PingFang SC");
});

test("does not block export when review files are missing or failed", () => {
  const novelRoot = makeTempDir();
  writeFile(path.join(novelRoot, "30-draft", "chapters", "chapter-01.md"), "# 第一章\n");
  writeFile(path.join(novelRoot, "30-draft", "chapters", "chapter-02.md"), "# 第二章\n");
  writeFile(
    path.join(novelRoot, "40-review", "chapter-reviews", "chapter-01-review.md"),
    "结论：不通过\n",
  );

  const warnings = collectChapterAndReviewWarnings(novelRoot, ["chapter-01", "chapter-02"]);

  assert.deepEqual(warnings, [
    "Chapter review not passed: chapter-01; continuing export because review status is non-blocking",
    "Missing chapter review: 40-review/chapter-reviews/chapter-02-review.md",
  ]);
});

test("treats invalid cover paths as warnings instead of blockers", () => {
  const novelRoot = makeTempDir();
  const metadataPath = path.join(novelRoot, "50-delivery", "metadata.md");
  writeFile(
    metadataPath,
    ['title: 蛇吻', 'author: 测试作者', 'language: zh-CN', 'cover path: assets/cover.png', ""].join("\n"),
  );

  const result = getMetadataCoverPath(novelRoot, metadataPath);

  assert.equal(result.coverPath, null);
  assert.deepEqual(result.warnings, [
    "Cover path does not exist: assets/cover.png; continuing without EPUB cover image",
  ]);
});

test("preflight keeps review and optional metadata issues as warnings", () => {
  const novelRoot = makeTempDir();
  writeFile(
    path.join(novelRoot, "00-project", "workflow-status.md"),
    "- **当前阶段**：创作完成 (draft_complete)\n",
  );
  writeFile(
    path.join(novelRoot, "30-draft", "chapter-plan.md"),
    "## Planned Chapters\n- chapter-01\n",
  );
  writeFile(path.join(novelRoot, "30-draft", "chapters", "chapter-01.md"), "# 第一章\n");
  writeFile(
    path.join(novelRoot, "40-review", "chapter-reviews", "chapter-01-review.md"),
    "结论：不通过\n",
  );
  writeFile(path.join(novelRoot, "50-delivery", "frontmatter.md"), "# 扉页\n");
  writeFile(
    path.join(novelRoot, "50-delivery", "metadata.md"),
    ["title: 蛇吻", "author: 测试作者", "language: zh-CN", ""].join("\n"),
  );

  const result = testDeliveryPreflight(
    novelRoot,
    "node",
    ["Source Han Serif SC", "Source Han Sans SC"],
    process.execPath,
  );

  assert.equal(result.chapterIds.length, 1);
  assert.equal(result.pdfBrowserPath, process.execPath);
  assert.deepEqual(result.warnings, [
    "metadata.md is missing optional field: summary",
    "metadata.md is missing optional field: keywords",
    "metadata.md is missing optional field: publication date",
    "metadata.md is missing optional field: output formats",
    "Chapter review not passed: chapter-01; continuing export because review status is non-blocking",
  ]);
});

test("returns Chromium-friendly install guidance instead of latex setup", () => {
  const plan = getPdfBrowserInstallPlan("Windows");

  assert.equal(plan.platform, "Windows");
  assert.equal(plan.browser, "Chromium");
  assert.match(plan.primaryCommand, /playwright|Edge|Chrome/i);
});

test("builds a browser environment message with concise next steps", () => {
  const message = getPdfBrowserEnvironmentMessage({
    platform: "Windows",
    browser: "Chromium",
    primaryCommand: "npx playwright install chromium",
    fallbackCommands: ["winget install Microsoft.Edge"],
  });

  assert.match(message, /Chromium-compatible browser/i);
  assert.match(message, /playwright install chromium/i);
});

test("resolves the project root from a workspace root that contains one book directory", () => {
  const workspaceRoot = makeTempDir();
  const novelRoot = path.join(workspaceRoot, "snake-bite-revenge");
  writeFile(path.join(novelRoot, "00-project", "workflow-status.md"), "(draft_complete)\n");

  assert.equal(resolveNovelProjectRoot(workspaceRoot), novelRoot);
});

test("prefers Medium weight for body fonts except SimSun", () => {
  const sourceHanFonts = getResolvedFonts(["Source Han Serif SC", "Source Han Sans SC"]);
  const simSunFonts = getResolvedFonts(["SimSun", "SimHei"]);

  assert.equal(sourceHanFonts.mainFont, "Source Han Serif SC");
  assert.equal(sourceHanFonts.mainFontRegular, "Medium");
  assert.equal(simSunFonts.mainFont, "SimSun");
  assert.equal(simSunFonts.mainFontRegular, null);
});

test("builds Playwright PDF options that disable browser chrome and honor CSS sizing", () => {
  const options = getPdfRenderOptions("C:\\books\\snake.pdf");

  assert.equal(options.path, "C:\\books\\snake.pdf");
  assert.equal(options.printBackground, true);
  assert.equal(options.preferCSSPageSize, true);
  assert.equal(options.displayHeaderFooter, false);
  assert.deepEqual(options.margin, {
    top: "0",
    right: "0",
    bottom: "0",
    left: "0",
  });
});

test("finds a Playwright-downloaded Chromium executable from the local cache", () => {
  const homeRoot = makeTempDir();
  const browserPath = path.join(
    homeRoot,
    "AppData",
    "Local",
    "ms-playwright",
    "chromium-1200",
    "chrome-win64",
    "chrome.exe",
  );
  writeFile(browserPath, "binary");

  assert.equal(
    findPlaywrightBrowserExecutable("Windows", homeRoot),
    browserPath,
  );
});

test("includes common absolute application paths when scanning for macOS browsers", () => {
  const candidatePaths = getDefaultMacOsBrowserPaths("/Applications");

  assert.deepEqual(candidatePaths.slice(0, 3), [
    "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge",
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/Applications/Chromium.app/Contents/MacOS/Chromium",
  ]);
});

test("parses chapter headings when chapter-plan.md omits chapter-01 tokens", () => {
  const novelRoot = makeTempDir();
  writeFile(
    path.join(novelRoot, "00-project", "workflow-status.md"),
    "- Status: draft_complete\n",
  );
  writeFile(
    path.join(novelRoot, "30-draft", "chapter-plan.md"),
    [
      "# Chapter Plan",
      "",
      "## Chapter List",
      "",
      "### Chapter 1",
      "- Title: First Crossing",
      "",
      "### Chapter 2",
      "- Title: Lantern Wake",
    ].join("\n"),
  );
  writeFile(path.join(novelRoot, "30-draft", "chapters", "chapter-01.md"), "# 第一章\n");
  writeFile(path.join(novelRoot, "30-draft", "chapters", "chapter-02.md"), "# 第二章\n");
  writeFile(path.join(novelRoot, "50-delivery", "frontmatter.md"), "# Title Page\n");
  writeFile(
    path.join(novelRoot, "50-delivery", "metadata.md"),
    [
      "# Metadata",
      "",
      "## Bibliographic Data",
      "",
      "- Title: 蛇吻",
      "- Author: 测试作者",
      "- Language: zh-CN",
      "",
      "## Output Targets",
      "",
      "- Produce PDF: true",
      "- Produce EPUB: true",
    ].join("\n"),
  );

  const result = testDeliveryPreflight(
    novelRoot,
    "node",
    ["Source Han Serif SC", "Source Han Sans SC"],
    process.execPath,
  );

  assert.deepEqual(result.chapterIds, ["chapter-01", "chapter-02"]);
});

test("latte html defaults use html output and catppuccin blue-lavender accents", () => {
  const latteYaml = fs.readFileSync(
    path.join(skillRoot, "pandoc", "latte-html.yaml"),
    "utf8",
  );

  assert.match(latteYaml, /to:\s*html5/);
  assert.match(latteYaml, /theme-name:\s*latte/);
  assert.match(latteYaml, /theme-accent:\s*1e66f5/);
  assert.match(latteYaml, /theme-accent-soft:\s*7287fd/);
});

test("html template exposes theme and stylesheet hooks", () => {
  const template = fs.readFileSync(
    path.join(skillRoot, "templates", "novel-book.html"),
    "utf8",
  );

  assert.match(template, /\$body\$/);
  assert.match(template, /novel-book\.css/);
  assert.match(template, /data-theme="\$theme-name\$"/);
  assert.match(template, /--body-font-weight:\s*"\$if\(mainfontregular\)\$\$mainfontregular\$\$else\$Medium\$endif\$"/);
});

test("print stylesheet uses magazine-grid page and chapter rules", () => {
  const stylesheet = fs.readFileSync(
    path.join(skillRoot, "templates", "novel-book.css"),
    "utf8",
  );

  assert.match(stylesheet, /@page/);
  assert.match(stylesheet, /margin:\s*0/);
  assert.match(stylesheet, /body\[data-theme="latte"\]/);
  assert.match(stylesheet, /\.book-shell\s*\{[\s\S]*padding:\s*18mm 14mm 20mm 16mm/);
  assert.match(stylesheet, /break-before:\s*page/);
  assert.match(stylesheet, /font-weight:\s*var\(--body-font-weight,\s*500\)/);
});

test("copies the shared print stylesheet into the output directory", () => {
  const outputRoot = path.join(makeTempDir(), "50-delivery", "output");
  fs.mkdirSync(outputRoot, { recursive: true });

  const cssPath = copyPrintStyles(outputRoot);

  assert.equal(path.basename(cssPath), "novel-book.css");
  assert.equal(fs.existsSync(cssPath), true);
});

test("asserts themed html, pdf, and epub outputs are non-empty", () => {
  const outputRoot = path.join(makeTempDir(), "50-delivery", "output");
  fs.mkdirSync(outputRoot, { recursive: true });

  const targets = {
    latteHtml: path.join(outputRoot, "book-latte.html"),
    mochaHtml: path.join(outputRoot, "book-mocha.html"),
    lattePdf: path.join(outputRoot, "book-latte.pdf"),
    mochaPdf: path.join(outputRoot, "book-mocha.pdf"),
    epub: path.join(outputRoot, "book.epub"),
  };

  for (const targetPath of Object.values(targets)) {
    fs.writeFileSync(targetPath, "ok", "utf8");
  }

  assert.doesNotThrow(() => assertExportOutputs(targets));
});
