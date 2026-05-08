import type { CharacterCardV2, ParseWarning } from './charcard-parser.mts';

export interface TransformOptions {
  truncate: boolean;
  truncateLength: number;
}

export interface TransformResult {
  markdown: string;
  warnings: ParseWarning[];
}

const DEFAULT_OPTIONS: TransformOptions = {
  truncate: true,
  truncateLength: 1500,
};

function sanitizeFilename(name: string): string {
  if (!name || !name.trim()) {
    return `unknown-${Date.now()}`;
  }

  return name
    .trim()
    .replace(/[\/\\:*?"<>|]/g, '')
    .replace(/ /g, '-')
    .replace(/\n/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

function hasNonEmpty(val: unknown): boolean {
  if (typeof val === 'string') {
    return val.trim().length > 0;
  }
  if (Array.isArray(val)) {
    return val.length > 0;
  }
  return val != null;
}

function truncateText(text: string, maxLen: number): { truncated: string; wasTruncated: boolean } {
  if (text.length <= maxLen) {
    return { truncated: text, wasTruncated: false };
  }
  const cutPoint = text.lastIndexOf('\n', maxLen);
  if (cutPoint > maxLen * 0.5) {
    return { truncated: text.slice(0, cutPoint), wasTruncated: true };
  }
  return { truncated: text.slice(0, maxLen), wasTruncated: true };
}

function formatTags(tags: string[]): string {
  if (!tags || tags.length === 0) {
    return '(无标签)';
  }
  return tags.join(', ');
}

function renderLoreEntries(
  book: NonNullable<CharacterCardV2['data']['character_book']>,
): string {
  if (!book.entries || book.entries.length === 0) {
    return '';
  }

  let result = '## 深层设定\n\n';

  for (const entry of book.entries) {
    if (!entry.content || !entry.content.trim()) {
      continue;
    }

    const name = entry.name || '未命名条目';
    const keys = entry.keys?.join(', ') || '无触发词';
    const constant = entry.constant ? ' ⚠️ 全局生效' : '';

    result += `### ${name} \`[触发词: ${keys}]\`${constant}\n\n`;
    result += `${entry.content.trim()}\n\n`;
  }

  return result;
}

function renderSystemInstructions(card: CharacterCardV2): string {
  const hasSystem = hasNonEmpty(card.data.system_prompt);
  const hasPost = hasNonEmpty(card.data.post_history_instructions);

  if (!hasSystem && !hasPost) {
    return '';
  }

  let result = '## ⚠️ 角色扮演指令（需代理总结）\n\n';
  result += '> 以下内容为 SillyTavern 角色扮演用系统/破限提示词。\n';
  result += '> **不可直接注入小说写作上下文**，否则将导致模型切换至角色扮演模式而非作者模式。\n';
  result += '> \n';
  result += '> 代理在访谈阶段应：分析其意图 → 过滤角色扮演框架 → 提取对角色塑造有用的信息\n';
  result += '> （如语言风格、行为约束、一致性规则）→ 总结写入 `characters/` 目录下对应角色卡的对应字段。\n\n';

  if (hasSystem) {
    result += '### System Prompt (原始)\n\n';
    result += `${card.data.system_prompt.trim()}\n\n`;
  }

  if (hasPost) {
    result += '### Post-History Instructions (原始)\n\n';
    result += `${card.data.post_history_instructions.trim()}\n\n`;
  }

  return result;
}

export function transformCharcard(
  card: CharacterCardV2,
  additionalWarnings: ParseWarning[],
  options: TransformOptions = DEFAULT_OPTIONS,
): TransformResult {
  const warnings: ParseWarning[] = [...additionalWarnings];
  const opts = { ...DEFAULT_OPTIONS, ...options };

  const d = card.data;
  const filename = sanitizeFilename(d.name);

  if (!d.name || !d.name.trim()) {
    warnings.push({ level: 'warning', message: '角色卡缺少 name 字段，将使用时间戳作为文件名' });
  }

  let output = '';

  output += `# ${d.name || '(未知)'}\n\n`;
  output += '> 来源：角色卡导入\n';
  output += `> 导入时间：${new Date().toISOString().replace('T', ' ').replace(/\.\d+Z$/, '')}\n\n`;
  output += '---\n\n';

  // 身份定位 — placeholders for interview completion
  output += '## 身份定位\n\n';
  output += '<!-- 待访谈补全 -->\n\n';
  output += '- **身份**：\n';
  output += '- **目标**：\n';
  output += '- **动机**：\n';
  output += '- **核心冲突**：\n';
  output += '- **弧光笔记**：\n\n';

  output += '## 角色档案\n\n';
  output += `- **简介**：${d.description || '(未提供)'}\n`;
  output += `- **性格**：${d.personality || '(未提供)'}\n`;
  output += `- **标签**：${formatTags(d.tags)}\n\n`;

  const hasLoreBook = d.character_book && d.character_book.entries && d.character_book.entries.length > 0;
  const descEmpty = !d.description || d.description.trim().length === 0;
  const persEmpty = !d.personality || d.personality.trim().length === 0;

  if (descEmpty && persEmpty && hasLoreBook) {
    warnings.push({
      level: 'warning',
      message: '[LORE_BIAS] description 和 personality 为空，角色设定可能在 character_book 的 Associated Lore 中。代理请从 Lore entries 提取角色基础信息。',
    });
  }

  output += '## 情景设定\n\n';
  output += `${d.scenario || '(未提供)'}\n\n`;

  output += '## 开场呈现\n\n';
  output += `${d.first_mes || '(未提供)'}\n\n`;

  output += '## 对话风格\n\n';
  if (hasNonEmpty(d.mes_example)) {
    const { truncated, wasTruncated } = opts.truncate
      ? truncateText(d.mes_example, opts.truncateLength)
      : { truncated: d.mes_example, wasTruncated: false };

    output += `${truncated}`;
    if (wasTruncated) {
      output += `\n\n…[截断：原文共 ${d.mes_example.length} 字符，已截断至 ${truncated.length} 字符]`;
      warnings.push({
        level: 'info',
        message: `[截断提示] mes_example 共 ${d.mes_example.length} 字符，已截断至 ${truncated.length} 字符。使用 --no-truncate 保留全文`,
      });
    }
    output += '\n\n';
  } else {
    output += '(未提供)\n\n';
  }



  output += '## Creator Notes\n\n';
  output += '> ⚠️ 以下为角色卡作者的备忘笔记，非角色自身设定。仅供参考作者意图。\n\n';
  output += `${d.creator_notes || '(未提供)'}\n\n`;

  if (d.character_book) {
    output += renderLoreEntries(d.character_book);
  }

  const systemBlock = renderSystemInstructions(card);
  if (systemBlock) {
    output += systemBlock;
  }

  if (warnings.length > 0) {
    output += '## Warnings\n\n';
    for (const w of warnings) {
      output += `- [${w.level.toUpperCase()}] ${w.message}\n`;
    }
    output += '\n';
  }

  return { markdown: output, warnings };
}

export { sanitizeFilename };
