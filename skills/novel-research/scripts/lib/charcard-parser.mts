import fs from 'node:fs';
import path from 'node:path';
import ExifReader from './vendor/exifreader.js';

export interface Entry {
  keys: string[];
  content: string;
  enabled: boolean;
  insertion_order: number;
  case_sensitive?: boolean;
  name?: string;
  priority?: number;
  id?: number;
  comment?: string;
  selective?: boolean;
  secondary_keys?: string[];
  constant?: boolean;
  position?: 'before_char' | 'after_char';
  extensions: Record<string, unknown>;
}

export interface CharacterBook {
  name?: string;
  description?: string;
  scan_depth?: number;
  token_budget?: number;
  recursive_scanning?: boolean;
  extensions: Record<string, unknown>;
  entries: Entry[];
}

export interface CharacterData {
  name: string;
  description: string;
  personality: string;
  scenario: string;
  first_mes: string;
  mes_example: string;
  creator_notes: string;
  system_prompt: string;
  post_history_instructions: string;
  alternate_greetings: string[];
  tags: string[];
  creator: string;
  character_version: string;
  extensions: Record<string, unknown>;
  character_book?: CharacterBook;
}

export interface CharacterCardV2 {
  spec: string;
  spec_version: string;
  data: CharacterData;
}

export interface ParseWarning {
  level: 'error' | 'warning' | 'info';
  message: string;
}

export interface ParseResult {
  card: CharacterCardV2;
  warnings: ParseWarning[];
}

function emptyCard(name?: string): CharacterCardV2 {
  return {
    spec: 'chara_card_v2',
    spec_version: '2.0',
    data: {
      name: name ?? '',
      description: '',
      personality: '',
      scenario: '',
      first_mes: '',
      mes_example: '',
      creator_notes: '',
      system_prompt: '',
      post_history_instructions: '',
      alternate_greetings: [],
      tags: [],
      creator: '',
      character_version: '',
      extensions: {},
    },
  };
}

function cleanBase64(raw: string): string {
  return raw.replace(/^data:image\/[a-z]+;base64,/, '');
}

function extractCharaBase64(buffer: Buffer, warnings: ParseWarning[]): string | null {
  try {
    const tags = ExifReader.load(buffer) as Record<string, unknown>;

    for (const [key, value] of Object.entries(tags)) {
      if (key.toLowerCase() !== 'chara') continue;

      const exifValue = value as { description?: unknown };
      if (exifValue.description && typeof exifValue.description === 'string') {
        return cleanBase64(exifValue.description);
      }
    }

    warnings.push({
      level: 'warning',
      message: '[元数据解析] 未在 EXIF/XMP/tEXt 中找到 chara 键，此文件可能不是角色卡',
    });
    return null;
  } catch {
    warnings.push({
      level: 'error',
      message: '[元数据解析] 无法读取文件 EXIF/XMP 元数据，文件可能已损坏或格式不支持',
    });
    return null;
  }
}

function parseJSON(base64Text: string, warnings: ParseWarning[]): CharacterCardV2 | null {
  try {
    const decoded = Buffer.from(base64Text, 'base64').toString('utf8');

    try {
      const parsed = JSON.parse(decoded);

      if (parsed.data && typeof parsed.data === 'object') {
        const card = parsed as Partial<CharacterCardV2>;
        const data = card.data as Partial<CharacterData>;

        const v1Fields = ['name', 'description', 'personality', 'scenario', 'first_mes', 'mes_example'] as const;
        for (const field of v1Fields) {
          if ((!data[field] || (typeof data[field] === 'string' && data[field].trim() === ''))
              && typeof parsed[field] === 'string' && parsed[field].trim() !== '') {
            (data as Record<string, string>)[field] = parsed[field];
            warnings.push({ level: 'info', message: `[字段回退] data.${field} 为空，已从顶层 ${field} 回填` });
          }
        }

        return {
          spec: card.spec ?? 'chara_card_v2',
          spec_version: card.spec_version ?? '2.0',
          data: { ...emptyCard().data, ...data },
        };
      }

      if (parsed.name && typeof parsed.name === 'string') {
        const v1Fields: Partial<CharacterData> = {};
        for (const key of ['name', 'description', 'personality', 'scenario', 'first_mes', 'mes_example'] as const) {
          if (typeof parsed[key] === 'string') {
            (v1Fields as Record<string, string>)[key] = parsed[key];
          }
        }

        warnings.push({ level: 'info', message: '检测到 V1 格式角色卡，已自动提升为 V2 结构' });
        return { ...emptyCard(v1Fields.name), data: { ...emptyCard().data, ...v1Fields } };
      }

      warnings.push({
        level: 'error',
        message: '[JSON 解析] JSON 缺少 data 对象且无 name 字段，不是有效的 V2 或 V1 角色卡',
      });
      return null;
    } catch {
      warnings.push({ level: 'error', message: '[JSON 解析] Base64 解码后不是有效 JSON' });
      return null;
    }
  } catch {
    warnings.push({ level: 'error', message: '[Base64 解码] 无法解码 Base64 字符串，图片可能已损坏' });
    return null;
  }
}

export function parseCharcard(inputPath: string): ParseResult {
  const warnings: ParseWarning[] = [];
  let card: CharacterCardV2 | null = null;

  try {
    if (!fs.existsSync(inputPath)) {
      warnings.push({ level: 'error', message: `文件不存在: ${inputPath}` });
      return { card: emptyCard(), warnings };
    }

    const buffer = fs.readFileSync(inputPath);

    if (buffer.length === 0) {
      warnings.push({ level: 'error', message: '文件大小为 0 字节' });
      return { card: emptyCard(), warnings };
    }

    const ext = path.extname(inputPath).toLowerCase();
    if (ext !== '.png' && ext !== '.webp') {
      warnings.push({
        level: 'warning',
        message: `文件扩展名 ${ext} 不是 .png 或 .webp，将尝试以 PNG/WebP 格式读取元数据`,
      });
    }

    const base64Text = extractCharaBase64(buffer, warnings);

    if (!base64Text) {
      return { card: emptyCard(), warnings };
    }

    const parsed = parseJSON(base64Text, warnings);

    if (!parsed) {
      return { card: emptyCard(), warnings };
    }

    card = parsed;

    if (!card.data.name) {
      warnings.push({ level: 'warning', message: '角色卡缺少 name 字段' });
    }
  } catch (error) {
    warnings.push({
      level: 'error',
      message: `读取文件时发生异常: ${error instanceof Error ? error.message : String(error)}`,
    });
  }

  return { card: card ?? emptyCard(), warnings };
}
