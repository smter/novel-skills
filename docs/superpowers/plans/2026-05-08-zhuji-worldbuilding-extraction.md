# 珠矶世界观构建体系提取 — 实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将珠矶世界观制作模块提取为 `worldbuilding-guide.md`，替换 `templates/setting-research.md`。

**Architecture:** 新建 1 个 reference 文件（7 大板块操作手册），删除 1 个模板文件，更新 SKILL.md 引用。不修改 validator 逻辑。

**Tech Stack:** Markdown 文档工程。源数据取自 `ref/example/【珠矶预设化】V1.71.json` 的 [80] 和 [82]。

---

### Task 1: 写入 worldbuilding-guide.md（引言 + 板块一至四）

**Files:**
- Create: `skills/novel-research/references/worldbuilding-guide.md`

- [ ] **Step 1: 读取源 prompt [80] 和 [82]**

```bash
python3 -c "
import json
with open('ref/example/【珠矶预设化】V1.71.json','r') as f:
    data = json.load(f)
for i in [80,82]:
    p = data['prompts'][i]
    print(f'=== [{i}] {p[\"name\"]} ({len(p[\"content\"])} chars) ===')
    print(p['content'])
    print()
" | head -200
```

- [ ] **Step 2: 创建文件并写入引言 + 板块一至四**

在 `skills/novel-research/references/worldbuilding-guide.md` 创建：

```markdown
# 世界观构建指导 — Agent 操作手册

本文件指导 agent 在 novel-research Phase 4 撰写 `10-research/setting-research.md` 时按 7 大板块构建世界观。

> 源 prompt: [80] [82]

**使用方式：** agent 在 Phase 4 写入设定产物时，按板块一至七依次操作。每板块完成后检查产出是否已写入 setting-research.md。

---

## 引言：设定制作方法论

来自珠矶 prompt [80]，适用于全部板块：

1. **总—分结构** — 先确立世界观总则（基调/主题/风格），再逐板块细化。每个板块内如内容复合，可再次用「总—分」。
2. **专注深入，警惕发散** — 按用户已确认的基调/类型/篇幅确定世界观的详略程度，以「专注&深入&细化」代替「发散&延伸&扩充」。
3. **指导性而非剖析性** — 产出用于指导后续起草的世界观约束，是对创作指令的梳理和结构化，而非对用户输入的文本分析。
4. **以原型加速** — 可借鉴现实文化/时代背景或 ACGN 作品作为设计原型，但必须适配用户的具体需求。

---

## 板块一：基调与物理原则

**目标：** 确立世界的「规则感」——这个世界的运行原理是什么。

**操作要点：**

1. **基调确认：**
   - 「这个世界的整体氛围？」（黑暗写实 / 轻松幻想 / 架空史诗 / 末日废土 / 赛博朋克 / ……）
   - 回顾 Phase 2–3 已确认的基调，确保世界观与基调一致

2. **物理规则：**
   - 「这个世界是否存在于真实历史中？还是完全架空？」
   - 「是否存在魔法/灵力/超自然力量/异常科技？」→ 如有，描述基本规则和能力边界
   - 「哪些真实世界物理法则适用、哪些不适用？」（如：有重力吗？人会死吗？灵魂存在吗？）

3. **力量体系（如有）：**
   - 力量来源（血统/修炼/技术/信仰/……）
   - 等级或分层（如有）
   - 力量的社会影响（谁拥有力量？力量如何改变社会结构？）

**产出（写入 `10-research/setting-research.md`）：**

```markdown
## Setting Summary
- **基调**：{1–2 句}
- **物理规则**：{关键物理/魔法规则}
- **力量体系**：{如有}
```

---

## 板块二：自然禀赋

**目标：** 建立世界的物质基底——地形、气候、资源。

**操作要点：**

1. **地形与地域：**
   - 「世界的地理全貌？」（大陆分布/海洋/山脉/沙漠/森林）
   - 「主要区域划分？」（命名 2–5 个主要区域）

2. **气候：**
   - 「气候带分布？」（各区域的四季特征/极端气候/特殊天象）
   - 「气候变化如何影响居民生活方式？」

3. **自然资源：**
   - 「各区域的资源禀赋？」（矿产/水源/植被/特殊材料）
   - 「资源分布如何影响经济和冲突？」（某区域因资源而富有/被觊觎/因匮乏而尚武）

**产出（写入 `10-research/setting-research.md`）：**

```markdown
## 自然禀赋
- **地形**：{大陆/地域分布}
- **气候**：{各区域气候特征}
- **资源**：{关键资源分布及影响}
```

---

## 板块三：生物圈

**目标：** 世界中的生命形态——物种、生态、食物链。

**操作要点：**

1. **智慧种族（如非纯人类世界）：**
   - 「存在哪些智慧种族？」（人类/精灵/兽人/……）
   - 「各种族的基本特征和分布区域」
   - 「种族间的关系？」（共存/竞争/隔离/压迫）

2. **动植物：**
   - 「有无特殊的动植物？」（奇幻生物/变异物种/灭绝物种）
   - 「生态关系？」（捕食/共生/竞争）

3. **生态与社会：**
   - 「生态环境如何影响居民的生存方式？」（游牧/农耕/渔猎/采矿）

**产出（写入 `10-research/setting-research.md`）：**

```markdown
## 生物圈
- **智慧种族**：{列表，附基本特征和分布}
- **关键动植物**：{如有奇幻/特殊物种}
- **生态-社会关系**：{2–3 句}
```

---

## 板块四：世界历史

**目标：** 建立时间纵深——创世、纪元、大事件。

**操作要点：**

1. **起源：**
   - 「世界从何而来？」（创世神话 / 科学起源 / 已知但被遗忘的过去）
   - 这个世界的历史是被记录的还是口耳相传的？

2. **纪元划分：**
   - 「历史分为几个时代？每个时代的特征？」

3. **重大历史事件时间线：**
   - 列出 3–5 个塑造了当今世界格局的关键事件（战争/天灾/技术革命/种族灭绝/王朝更替）
   - 对每个事件标注：发生时间（绝对或相对）、影响范围、遗留后果

4. **历史对故事的影响：**
   - 「哪些历史事件直接影响故事主线或角色？」（关联 plot-outline）

**产出（写入 `10-research/setting-research.md`）：**

```markdown
## 世界历史
- **起源**：{创世/起源简述}
- **纪元**：{纪元划分}
- **关键事件**：
  - {事件1}（{时间}）：{影响}
  - {事件2}（{时间}）：{影响}
  - ...
```

---

- [ ] **Step 3: Commit**

```bash
git add skills/novel-research/references/worldbuilding-guide.md
git commit -m "docs: add worldbuilding guide introduction and boards 1-4"
```

---

### Task 2: 写入板块五至七 + 产出清单

**Files:**
- Modify: `skills/novel-research/references/worldbuilding-guide.md`（append）

- [ ] **Step 1: 追加板块五至七 + 产出清单**

在文件末尾追加：

```markdown
## 板块五：人文文化

**目标：** 社会中的人——社会结构、信仰、日常生活。

**操作要点：**

1. **社会结构：**
   - 「社会阶层如何划分？」（贵族/平民/奴隶 / 士农工商 / 其他）
   - 「权力如何分配？」（君主/议会/宗教/军事/……）
   - 「社会流动可能吗？」（人能否改变自己的阶层？）

2. **信仰体系：**
   - 「人们信仰什么？」（宗教/哲学/祖先崇拜/自然崇拜/无信仰）
   - 「信仰如何影响日常生活和法律？」

3. **日常生活（选一个代表性区域深入描写）：**
   - **饮食** — 「典型的一餐吃什么？饮食禁忌？」
   - **服饰** — 「各阶层穿什么？服饰如何反映身份？」
   - **节日** — 「最重要的节日？庆祝方式？」
   - **婚丧嫁娶** — 「仪式惯例？」
   - **教育与职业** — 「谁接受教育？常见职业？」

4. **建筑与审美：**
   - 「代表性建筑风格？」（与板块一的基调匹配）
   - 「什么被认为是美的？」

**产出（写入 `10-research/setting-research.md`）：**

```markdown
## 人文文化
- **社会结构**：{2–3 句}
- **信仰**：{信仰体系简述}
- **日常生活**：{饮食/服饰/节日/婚丧/教育}
- **建筑与审美**：{1–2 句}
```

---

## 板块六：区域差异化

**目标：** 避免「统一世界观」——不同区域的文化和制度差异。

**操作要点：**

1. **势力/国家/区域：**
   - 列出 2–5 个主要势力/国家/区域
   - 每个区域的：政体 / 核心文化特征 / 经济支柱 / 军事实力

2. **区域关系：**
   - 「各区域之间的关系？」（同盟/敌对/竞争/隔离/朝贡）
   - 「有无潜在的冲突爆发点？」

3. **流动与交流：**
   - 「人员和货物在各区域间的流动？」（通行顺畅/严格管控/基本隔绝）
   - 「跨区域交流的媒介？」（商队/信使/传送门/……）

**产出（写入 `10-research/setting-research.md`）：**

```markdown
## 区域差异化

### {区域A}
- **政体**：{简述}
- **文化特征**：{简述}
- **经济**：{简述}
- **军事**：{简述}

### {区域B}
- ...
```

---

## 板块七：文化符号

**目标：** 深层文化内核——象征物、精神内核。本板块可选，不做强制。

**操作要点：**

1. **核心象征物：**
   - 「这个世界有无核心的文化符号？」（如某种颜色/动物/图腾/节气代表什么）

2. **神话与传说：**
   - 「有无创世神话或民间传说可作为故事主题的隐喻？」

3. **精神内核：**
   - 「这个世界的居民普遍相信什么？活着的意义是什么？」

**产出（写入 `10-research/setting-research.md`，可选）：**

```markdown
## 文化符号
- **核心象征物**：{如有}
- **代表性神话/传说**：{如有}
- **精神内核**：{1–2 句总结}
```

---

## 产出清单

| # | 内容 | 写入文件 | 必填 | 检查 |
|---|---|---|---|---|
| 1 | 基调与物理原则 | `10-research/setting-research.md` | ✓ | [ ] |
| 2 | 自然禀赋 | 同上 | ✓ | [ ] |
| 3 | 生物圈 | 同上 | ✓ | [ ] |
| 4 | 世界历史 | 同上 | ✓ | [ ] |
| 5 | 人文文化 | 同上 | ✓ | [ ] |
| 6 | 区域差异化 | 同上 | ✓ | [ ] |
| 7 | 文化符号 | 同上 | 可选 | [ ] |

---

> **全文结束。** agent 在 Phase 4 按此文档逐板块构建世界观。
> 板块一至六必须全部完成，板块七可选。
> 如某板块与用户故事无关（如纯人类世界跳过了板块三的种族区分），标注「本项目不适用」并跳过。
```

- [ ] **Step 2: Commit**

```bash
git add skills/novel-research/references/worldbuilding-guide.md
git commit -m "docs: add worldbuilding guide boards 5-7 and output checklist"
```

---

### Task 3: 更新 SKILL.md + 删除旧模板

**Files:**
- Modify: `skills/novel-research/SKILL.md` — Phase 4 引用更新
- Delete: `skills/novel-research/templates/setting-research.md`

- [ ] **Step 1: 更新 SKILL.md Phase 4**

读取 `skills/novel-research/SKILL.md` 的 Phase 4 章节。在 Phase 4 开头（第 171 行附近）添加 worldbuilding-guide 引用。

在第 171 行「将 Phase 2–3 确认的结论写入全部 11 个产物文件。」之后插入：

```markdown
**世界观构建：** agent 在撰写 `10-research/setting-research.md` 时，按 `references/worldbuilding-guide.md` 的 7 大板块（基调与物理原则 → 自然禀赋 → 生物圈 → 世界历史 → 人文文化 → 区域差异化 → 文化符号）逐板块构建。板块一至六必填，板块七可选。
```

- [ ] **Step 2: 在参考文件列表中添加 worldbuilding-guide.md**

在 SKILL.md 的 `## 参考文件` 章节（约第 265 行）末尾添加：

```markdown
- 世界观构建方法指引：[references/worldbuilding-guide.md](references/worldbuilding-guide.md)
```

- [ ] **Step 3: 删除旧模板文件**

```bash
rm skills/novel-research/templates/setting-research.md
```

- [ ] **Step 4: 检查是否有其他文件引用被删除的模板**

```bash
rg "setting-research\.md" skills/ --include "*.ts" --include "*.mts" --include "*.md"
```

预期：可能有 validator 引用，但 validator 检查的是 `10-research/setting-research.md`（产物文件），不是 `templates/setting-research.md`（模板）。产物文件名不变，不冲突。

如果有模板引用，更新路径为 `references/worldbuilding-guide.md`。

- [ ] **Step 5: Commit**

```bash
git add skills/novel-research/references/worldbuilding-guide.md skills/novel-research/SKILL.md
git rm skills/novel-research/templates/setting-research.md
git commit -m "feat: replace setting-research template with worldbuilding-guide reference"
```

---

### Task 4: 完整性验证 + 全量验证

**Files:**
- Verify: `skills/novel-research/references/worldbuilding-guide.md`
- Verify: `skills/novel-research/SKILL.md`

- [ ] **Step 1: 结构完整性**

```bash
echo "=== Checking worldbuilding-guide section headers ==="
grep -n "^#" skills/novel-research/references/worldbuilding-guide.md
```

预期包含：引言 + 板块一至七 + 产出清单。

- [ ] **Step 2: 产出清单覆盖**

```bash
echo "=== 产出清单 item count ==="
grep -c "| [0-9] |" skills/novel-research/references/worldbuilding-guide.md
```

预期：7 行（7 板块）。

- [ ] **Step 3: 无占位符**

```bash
grep -n "TODO\|TBD\|FIXME" skills/novel-research/references/worldbuilding-guide.md || echo "No placeholders found"
```

- [ ] **Step 4: SKILL.md 交叉引用**

```bash
echo "=== Cross-reference: SKILL.md → worldbuilding-guide.md ==="
grep -c "worldbuilding-guide" skills/novel-research/SKILL.md
```

预期：至少 2 处匹配（Phase 4 + 参考文件）。

- [ ] **Step 5: TypeScript 编译**

```bash
rtk npx tsc --noEmit
```

- [ ] **Step 6: 测试套件**

```bash
rtk npm test
```

预期全部通过。

- [ ] **Step 7: Commit**

```bash
git commit -m "chore: final validation for worldbuilding guide extraction" --allow-empty
```
