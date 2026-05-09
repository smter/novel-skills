# 珠矶提取缺口补全 — 实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 补全珠矶工具提取项目三个剩余缺口——创建 theory/ 5 文件、narrative-structure-guide.md，并将方法论注入 SKILL.md ×2 和 lint-contract.md

**Architecture:** 三阶段推进。Phase 1 创建 5 个理论参考文件（被后续依赖）；Phase 2 创建叙事结构操作手册（修复僵尸引用）；Phase 3 修改 SKILL.md 和 lint-contract.md 完成集成注入。所有产出从 JSON 源 propmts 中提取→重写，不留源标记

**Tech Stack:** Markdown 文件操作，JSON 源数据读取，无代码依赖

---

## 文件结构

### 新建

| 文件 | 职责 | 源 JSON prompt |
|------|------|---------------|
| `skills/novel-research/references/theory/mckee-character.md` | 麦基《人物》理论摘要，六维度+人物vs人+弧光 | [#70] |
| `skills/novel-research/references/theory/mckee-dialogue.md` | 麦基《对白》理论摘要，对白即行动+三大功能+潜文本动词 | [#71] |
| `skills/novel-research/references/theory/mckee-story.md` | 麦基《故事》理论摘要，故事三角+幕设计+场景分析 | [#72][#73] |
| `skills/novel-research/references/theory/harmon-story-circle.md` | 哈蒙故事圈，8 阶段循环+弧光应用 | [#74] |
| `skills/novel-research/references/theory/zhuji-character-theory.md` | 珠矶自有角色理论，三轴解构 | [#69] |
| `skills/novel-research/references/narrative-structure-guide.md` | 叙事结构 agent 操作手册，四层框架+网络梳理+章节细化 | [#135][#138][#139] |

### 修改

| 文件 | 变更 |
|------|------|
| `skills/novel-research/SKILL.md` | Phase 3 新增前置段落；Phase 4 重写叙事步骤；参考文件列表扩展 |
| `skills/novel-drafting/SKILL.md` | Writer 契约新增对话条款；Reviewer 契约新增角色/叙事条款；新增 COT 小节 |
| `skills/novel-drafting/lint-contract.md` | 新增第二部分"起草自检清单"（15+ 维度） |

---

### Task 1: 创建 theory 目录并读取 JSON 源 prompts

**Files:**
- Create: `skills/novel-research/references/theory/` (directory)

- [ ] **Step 1: 创建 theory 目录**

```bash
mkdir skills/novel-research/references/theory
```

- [ ] **Step 2: 读取 JSON 中 theory 相关的全部源 prompt 内容**

使用以下脚本读取并保存到临时文件供后续步骤参考：

```bash
node -e "
const fs = require('fs');
const files = fs.readdirSync('ref/example');
const j = JSON.parse(fs.readFileSync('ref/example/' + files[0], 'utf8'));
const prompts = j.prompts;
for (let idx of [69,70,71,72,73,74]) {
  const p = prompts[idx];
  console.log('=== [' + idx + '] ' + p.name + ' ===');
  console.log(p.content);
  console.log('\n\n');
}
" > temp-theory-sources.txt
```

- [ ] **Step 3: 确认 temp-theory-sources.txt 包含 6 个 prompt 的完整内容**

```bash
node -e "const fs=require('fs');const c=fs.readFileSync('temp-theory-sources.txt','utf8');const m=c.match(/=== \[/g);console.log('Found',m?m.length:0,'prompt sections');"
```

Expected: `Found 6 prompt sections`

- [ ] **Step 4: Commit**

```bash
rtk git add skills/novel-research/references/theory/
rtk git commit -m "feat(research): create theory directory for zhuji theory references"
```

---

### Task 2: 写入 mckee-character.md

**Files:**
- Create: `skills/novel-research/references/theory/mckee-character.md`
- Source: JSON prompt [70]（`temp-theory-sources.txt` 中有完整内容）

- [ ] **Step 1: 从 temp-theory-sources.txt 提取 prompt [70] 的核心内容**

prompt [70] 的原始内容包含以下结构体系：
- `general_principles`: "人物即故事，故事即人物"
- `人物vs人`: 透明度/复杂性/吸引力，人物携带"过去容器"和"未来海绵"
- 人物内心矛盾的设计
- 六维度调整体系
- 情节-人物辩题

- [ ] **Step 2: 将以上内容改写为 agent 可查阅的理论参考，写入文件**

文件内容（完全重写，不留源标记）：

````markdown
# 麦基《人物》理论参考

本文件提炼罗伯特·麦基《人物》的核心概念，供 agent 在角色审查和人物设计时查阅。

---

## 一、人物 vs 人

虚构角色与现实中的人不同——角色被设计为在故事框架内具有更高程度的：

- **透明度** — 读者可以看到角色的内心运作，比现实中理解他人更清晰
- **复杂性** — 角色承载精心设计的矛盾（善与恶、爱与恨、慷慨与自私）
- **吸引力** — 角色通过其行动和经历含蓄地触动读者的想象

**操作要点：** 设计角色时，确保其携带一个"过去"的容器（历史、创伤、成就）和一个吸收"未来"的海绵（通过故事经历展现人性变化）。

---

## 二、圆形人物与扁平人物

**圆形人物（Round Character）：**
- 拥有内在矛盾——表面特质与深层特质的张力
- 不同情境下展现不同侧面（压力下的行为 vs 放松时的行为）
- 拥有不可知的盲点和自我认知的差距
- 读者无法用简单标签概括

**扁平人物（Flat Character）：**
- 一个主导特质贯穿始终
- 行为可预测，缺乏变化
- 适用于功能性配角，但主角不应停留在扁平层

**操作要点：** 角色审查阶段，对每个角色判断属于圆形还是扁平。主角必须是圆形人物。若配角为扁平人物，确认其在故事中的功能（催化剂/对照/气氛）是否成立。

---

## 三、六维度诊断体系

对角色的六个维度进行逐项诊断，检查完整性和深度：

| 维度 | 诊断问题 | 对应角色卡字段 |
|------|---------|--------------|
| 身体维度 | 角色的外貌/身体/声音/气味是否具体到可感知？外表与内在是否存在反差？ | 简介（外貌部分） |
| 心理维度 | 角色的核心驱动力、压力行为、盲点是否明确定义？MBTI/Enneagram 框架下的性格特征是否一致？ | 性格 |
| 社会维度 | 角色的阶层、出身、教育、职业是否可以追溯？这些社会因素如何影响其行为？ | 情景设定 |
| 道德维度 | 角色的核心信念是什么？在什么情况下他会打破自己的道德准则？ | 深层设定 |
| 行为维度 | 角色的特质是否有具体行为支撑？能否写出 5 个不同情境下的行为反应？ | 性格（特质细化） |
| 语言维度 | 角色的说话方式是否独特？词汇选择、句式偏好、口头禅是否与人格一致？ | 对话风格 |

**操作要点：** 角色创建完成后，按此六维度逐项检查。任何维度空白或模糊视为未完成，需回到对应的 char_step 补充。

---

## 四、情节-人物辩题

麦基的核心命题：人物和情节哪个驱动故事？

- **人物驱动（Character-Driven）：** 故事的核心是人物内在的变化（弧光）。情节事件的作用是逼迫人物面对其内在矛盾，推动其做出改变。角色的个人欲望→道德选择→代价→改变是主线。
- **情节驱动（Plot-Driven）：** 故事的核心是外部事件序列。人物是事件的载体，其主要功能是做出一系列推进情节的决定。角色的变化是次要的。
- **融合型：** 多数优秀故事是两者的融合。外在情节迫使内在变化，内在变化反过来推动外在情节走向。

**操作要点：** 在 char0 概念设计阶段明确本故事属于哪种类型。如果是人物驱动型，角色弧光必须完整；如果是情节驱动型，事件因果链必须紧凑。

---

## 五、审查流程中的应用

在角色审查阶段，按以下三阶段流程使用本文件：

### 第一阶段：一致性诊断

对照六维度体系，逐项检查：
- 各维度间是否存在自相矛盾？（如"胆小的性格"+"挑衅性的穿着"）
- 行为描述是否与人格标签一致？（如果标签是"温柔"，是否有具体的温柔行为支撑？）
- 语言风格是否与人格/社会背景匹配？

### 第二阶段：深度与维度诊断

对照圆形人物标准：
- 角色是否拥有内在矛盾？
- 不同情境下是否展现不同侧面？
- 是否存在读者无法预测的行为维度？
- 如果是扁平配角，确认其功能性是否成立。

### 第三阶段：漏洞优化

- 空白的维度 → 补全
- 模糊的描述 → 具体化（追问行为示例）
- 矛盾的设计 → 决定保留哪一个，或解释矛盾作为角色深度的一部分
````

- [ ] **Step 3: 验证文件行数 ≥ 100**

```bash
node -e "const fs=require('fs');const c=fs.readFileSync('skills/novel-research/references/theory/mckee-character.md','utf8');console.log('Lines:',c.split('\n').length);"
```

Expected: `Lines: ≥100`

- [ ] **Step 4: Commit**

```bash
rtk git add skills/novel-research/references/theory/mckee-character.md
rtk git commit -m "feat(research): add mckee-character theory reference"
```

---

### Task 3: 写入 mckee-dialogue.md

**Files:**
- Create: `skills/novel-research/references/theory/mckee-dialogue.md`
- Source: JSON prompt [71]

- [ ] **Step 1: 从 temp-theory-sources.txt 提取 prompt [71] 核心内容并重写写入**

````markdown
# 麦基《对白》理论参考

本文件提炼罗伯特·麦基《对白》的核心概念，供 agent 在对话场景写作和审查时查阅。

---

## 一、核心纲领：对白即行动

对白的根本定义：**角色为达成其欲望而执行的一种语言形式的行动**。

每一句台词，无论是对他人、对自己、还是对读者说的，都必须是一个由内在需求驱动的、带有明确目的的行动策略。

**评估对白的第一准则：这句话在"做什么"，而不仅仅是"说什么"。**

---

## 二、对白的三大核心功能

所有对白必须服务于以下至少一个功能。优秀对白往往同时服务于多个。

### 功能一：解说

解说意指将故事的设定、背景历史、角色信息等必要事实，策略性地传递给读者。

**核心执行原则：**

1. **最少必要信息** — 只在读者绝对需要知道某个信息来理解当前或即将发生的行动时，才予以揭露。分批次、渐进式释放信息，始终让读者保持信息饥渴和好奇。
2. **演出来，不要讲出来** — 将解说信息作为武器、工具或障碍，融入到角色的冲突与行动之中，而非让角色像百科一样"介绍"背景。
3. **冲突中的解说** — 最有效的解说发生在角色之间的冲突场景中。争论、威胁、劝说、讽刺都是天然的解说载体。

### 功能二：人物塑造

对白是展现人物性格的核心工具。通过对话暴露角色的：

- **欲望** — 角色想从对方那里得到什么？
- **策略** — 角色用什么方式达成欲望？（直接要求/迂回试探/情感绑架/…）
- **局限性** — 角色的盲点、偏见、自欺通过对话中的措辞和回避自然暴露
- **社会身份** — 用词层次、句式复杂度、礼貌程度反映角色的社会属性

### 功能三：行动推动

对白本身即是行动——它能：

- **改变权力平衡** — 对话中的信息交换改变两方或多方的权力关系
- **制造或消解冲突** — 一句话可以挑起冲突，也可以缓和冲突
- **推动事件进展** — 关键决策通过对话做出、关键信息通过对话传递

---

## 三、潜文本动词体系

麦基提出：评估每段对白时，不应只看表面内容（角色说了什么），而要识别其**潜文本动词**——角色在通过这段话真正"做"什么。

### 三大类潜文本动词

#### A. 暴露类

角色通过对话**暴露**自身：

- 暴露：主动展示内心/秘密
- 泄露：无意中暴露真实想法
- 坦白：在压力下承认
- 自我辩护：为自己行为辩解（同时暴露内疚）
- 炫耀：展示能力/地位（同时暴露不安全感）

#### B. 操控类

角色通过对话**操控**他人：

- 说服：试图改变对方信念
- 引诱：试图引发对方欲望
- 威胁：用负面后果施压
- 试探：测试对方立场/忠诚/能力
- 误导：故意传递错误信息
- 激将：刺激对方做出冲动行为

#### C. 维护类

角色通过对话**维护**自身：

- 回避：有意避开话题
- 否认：拒绝承认事实/感受
- 伪装：用虚假形象遮掩真实自我
- 淡化：降低事件的严重性
- 转移：将焦点从自身移到他人

**操作要点：** 编写每段对话时，先确定角色的潜文本动词——"角色 A 在做什么（暴露/操控/维护）？角色 B 在做什么？" 一段好对话是两个不同潜文本动词的碰撞。

---

## 四、三种言说路径

| 路径 | 特点 | 适用场景 |
|------|------|---------|
| **戏剧化对白** | 精简、浓缩，每句话推动情节/暴露性格/传达主题。与日常对话不同，不允许闲聊。 | 关键场景（冲突/揭示/转折） |
| **自然主义对白** | 模拟日常口语，有停顿/重复/跑题，看似"废话"实则暗示角色状态。 | 日常场景（建立关系/氛围铺垫） |
| **诗意化对白** | 高度修辞，隐喻/排比/节奏感，接近诗歌。与日常口语拉开距离。 | 史诗/哲思/情感高潮 |

**操作要点：** 根据场景功能选择合适的言说路径。关键冲突场景优先选择戏剧化对白；建立角色关系时可用自然主义；情感高潮可考虑诗意化。

---

## 五、Writer 契约中的应用

起草对话场景时，必须满足以下硬性要求：

- [ ] 每段对话至少体现一个潜文本动词（暴露/操控/维护中的一类）
- [ ] 对话的核心功能明确（这段对话是解说？人物塑造？行动推动？）
- [ ] 言说路径与场景功能匹配
- [ ] 没有"为对话而对话"的空转——如果删除这段对话后场景信息不受损，则对话不合格
````

- [ ] **Step 2: 验证文件**

```bash
node -e "const fs=require('fs');const c=fs.readFileSync('skills/novel-research/references/theory/mckee-dialogue.md','utf8');console.log('Lines:',c.split('\n').length);"
```

- [ ] **Step 3: Commit**

```bash
rtk git add skills/novel-research/references/theory/mckee-dialogue.md
rtk git commit -m "feat(research): add mckee-dialogue theory reference"
```

---

### Task 4: 写入 mckee-story.md

**Files:**
- Create: `skills/novel-research/references/theory/mckee-story.md`
- Source: JSON prompts [72][73]

- [ ] **Step 1: 从 temp-theory-sources.txt 提取 prompts [72][73] 核心内容并重写写入**

````markdown
# 麦基《故事》理论参考

本文件提炼罗伯特·麦基《故事》的核心概念，供 agent 在叙事框架设计和故事结构构建时查阅。

---

## 一、核心指导思想

- **基于"原理"而非"规则"创作** — 遵循故事艺术的永恒原理，而非僵化规则或流行公式
- **以"原始模型"为内核** — 挖掘普遍性的人生体验（爱恨、生死、依赖与独立）
- **追求"独创性"** — 用独特、新颖、充满文化细节的方式表现原始模型

---

## 二、故事三角

麦基将故事分为三种基本类型，形成叙事光谱：

```
           大情节（古典设计）
          /                  \
         /                    \
  小情节（极简主义） ——— 反情节（反结构）
```

### 大情节（古典设计）

**特征：**
- 单一主动主人公
- 线性时间，因果关联的事件序列
- 主人公与外部力量持续对抗
- 闭合式结局——故事的所有问题得到解答，情感得到释放

**适用：** 绝大多数商业小说、网络文学、传统长篇

### 小情节（极简主义）

**特征：**
- 被动主人公或多重主人公
- 开放式结局——留给读者未解答的问题
- 内在冲突为主，外部冲突为辅
- 对因果关系的淡化

**适用：** 文学小说、艺术短片、心理现实主义

### 反情节（反结构）

**特征：**
- 没有明确的主人公，或主人公为荒诞角色
- 非线性/碎片化时间
- 因果逻辑被打破，对现实前提的彻底颠覆
- 开放式结局，甚至拒绝给出结局

**适用：** 实验文学、荒诞主义、先锋作品

**操作要点：** 在叙事框架设计阶段，明确本故事落在三角中的哪个位置。网络小说通常是大情节；追求文学性的作品可在大小情节之间混合。

---

## 三、幕结构与激励事件

### 激励事件

激励事件是故事的发动机——一个打乱主人公生活常态的事件，迫使其进入故事。

**激励事件的特征：**
- 彻底打破主人公的日常平衡（好的激励事件是不可逆的）
- 激起主人公的最强欲望（对抗导火索的力量）
- 将主人公推向不可选择的选择（必须行动，否则损失会更大）
- 提出"故事问题"——激励事件蕴含了整个故事的核心悬念

**操作要点：** 检查故事开头——是否有一个明确的事件迫使主人公采取行动？如果前几章只是"日常描写"而无激励事件，故事缺乏引擎。

### 三幕结构

```
第一幕（建制）          第二幕（对抗）          第三幕（解决）
[激励事件]→[对抗开始]→[中点转折]→[低谷/危机]→[高潮]→[结局]
```

**第一幕 — 建制：**
- 展现主人公的日常生活和内在缺陷
- 激励事件打破平衡
- 主人公做出进入第二幕的决定

**第二幕 — 对抗：**
- 主人公主动寻求目标，遭遇越来越大的阻力
- 中点转折：主人公从被动反应转向主动行动（或反过来）
- 危机：主人公面临最黑暗时刻，所有希望似乎破灭

**第三幕 — 解决：**
- 高潮：主人公面对核心冲突的最终对决，做出体现其弧光变化的关键选择
- 结局：展示变化后的新平衡

### 五幕结构

```
第一幕 → 第二幕 → 第三幕（中点）→ 第四幕 → 第五幕
建制     发展     转折            深化     解决
```

适用于更复杂的长篇叙事，每幕有明确的功能和情感基调转换。

---

## 四、场景分析原则

每个场景必须满足以下至少两项功能：

| 功能 | 说明 |
|------|------|
| 推进情节 | 场景是否改变了故事的进程？（如果删除它，后续事件是否受影响？） |
| 揭示人物 | 场景是否展示了角色的新侧面？（压力下的反应/隐藏欲望/矛盾） |
| 传递主题 | 场景是否在暗示故事的核心思想？（通过行动/对白/意象） |
| 建立氛围 | 场景是否强化了故事的基调？（压迫感/希望/荒诞） |

**操作要点：** 在章节细化阶段，检查每个计划中的场景是否至少满足两条。不满足的场景考虑合并或删除。

---

## 五、危机与高潮设计

### 危机

危机是主人公面临的最艰难选择——两个选项都代价极大，没有"正确"的答案。好的危机设计体现主人公的内在矛盾。

**危机设计原则：**
- 必须是真正的两难（不可以有"正确的选择"）
- 必须与主人公的核心欲望/核心价值观相关
- 做出的选择必须定义这个角色是什么样的人

### 高潮

高潮是危机的解决——主人公做出选择，并承担后果。

**高潮设计原则：**
- 必须是主人公的主动行动（不是外部力量替他解决的）
- 必须展现角色弧光的完成/变化
- 必须回答故事激励事件中提出的"故事问题"
- 必须释放读者蓄积的情感

---

## 六、叙事框架设计中的应用

在 narrative-structure-guide 的情节结构选型步骤中：

1. 先根据故事三角判定本作品的基本类型
2. 选择幕结构（三幕/五幕/故事圈）
3. 设计激励事件（确保具备不可逆性+驱动力）
4. 为每幕分配对应的 story beats
5. 设计危机中的两难选择
````

- [ ] **Step 2: 验证文件**

```bash
node -e "const fs=require('fs');const c=fs.readFileSync('skills/novel-research/references/theory/mckee-story.md','utf8');console.log('Lines:',c.split('\n').length);"
```

- [ ] **Step 3: Commit**

```bash
rtk git add skills/novel-research/references/theory/mckee-story.md
rtk git commit -m "feat(research): add mckee-story theory reference"
```

---

### Task 5: 写入 harmon-story-circle.md

**Files:**
- Create: `skills/novel-research/references/theory/harmon-story-circle.md`
- Source: JSON prompt [74]

- [ ] **Step 1: 从 temp-theory-sources.txt 提取 prompt [74] 并重写写入**

````markdown
# 哈蒙故事圈理论参考

本文件提炼丹·哈蒙（Dan Harmon）的故事圈理论，供 agent 在角色弧光设计时使用。

故事圈是约瑟夫·坎贝尔"英雄之旅"原型的精炼版本，将角色驱动型叙事浓缩为 8 个阶段。

---

## 一、故事圈原理

核心思想：叙事的本质是**一个角色为满足内在需求而进入失衡状态，最终通过行动回归到全新平衡的循环过程**。

整个叙事被划分为两个对称的半球：
- **上半环（阶段 1-4）：** 意识与秩序。角色从熟悉的环境出发，跨越阈值，进入未知的挑战领域——"出走"与"求索"
- **下半环（阶段 5-8）：** 混乱与重新适应。角色在经历最深刻的转变后，带着改变的结果回归——"回归"与"改变"

---

## 二、8 阶段详解

### 阶段 1：均衡 — A character is in a zone of comfort

角色生活在熟悉的环境中，处于某种形式的平衡。

**操作要点：**
- 展示角色的日常状态——这是后续所有变化的对照基线
- 暗示角色的内在需求（the need）——均衡表面下埋藏着不满或缺失
- 建立读者对"常态"的认知，以便后续感受到"失衡"

**对应角色卡字段：** 情景设定中的"起点状态"

### 阶段 2：需求 — But they want something

角色产生欲望，或外部事件迫使其认识到一个需求。

**操作要点：**
- 欲望分为两层：**表层欲望（Want）**——角色意识到的具体目标；**深层需求（Need）**——角色不自知的根本需求
- 好的故事里，Want 和 Need 之间存在张力。角色追求 Want 的过程中，被迫面对 Need
- 阶段 2 结束时，角色做出"跨越"的决定

**对应角色卡字段：** 目标、动机

### 阶段 3：跨越 — They enter an unfamiliar situation

角色离开熟悉的世界，进入未知领域。

**操作要点：**
- 这是故事的第一个重大转折点——从此角色无法回到均衡状态
- 未知领域不仅是物理空间的改变，更是规则、身份、关系的彻底重组
- "跨越"必须是角色主动做出的决定（即使是被迫的，也要展现其选择的一刻）

**对应角色卡字段：** 核心冲突

### 阶段 4：适应 — Adapt to it

角色在未知领域中摸索、学习、适应。

**操作要点：**
- 角色尝试用旧世界的方法解决新世界的问题（通常失败）
- 结识盟友、遭遇敌人、学习新规则
- 初步取得一些成功，但真正的考验还在后面
- 这是角色从被动到主动的过渡阶段

### 阶段 5：胜利 — Get what they wanted

角色获得了其表层欲望。

**操作要点：**
- 表面上的"胜利"——角色得到了在阶段 2 中想要的
- 但这个胜利伴随着巨大的代价——角色牺牲/失去/背叛了某些重要的东西
- 读者和角色开始意识到：得到 Want 并没有带来满足，真正的需求（Need）仍然缺失

### 阶段 6：代价 — But pay a heavy price for it

角色承受胜利的后果。

**操作要点：**
- 这是故事的最黑暗时刻——角色失去了最重要的东西
- 角色被迫面对自己一直逃避的真相（Need 的核心）
- 角色陷入绝望，旧有的身份和世界观崩塌

### 阶段 7：回归 — Return to their familiar situation

角色带着变化回归（物理上或心理上）。

**操作要点：**
- 回归不是回到原点——角色已经发生了不可逆的变化
- 用新的眼光看待旧的环境
- 在回归的过程中完成最后的转变

### 阶段 8：改变 — Having changed

角色到达新的均衡——与阶段 1 的均衡本质不同。

**操作要点：**
- 明确展示角色的变化：他做了什么旧版本的自己不会做的事？
- 展示变化后的角色如何与旧环境互动
- 新均衡暗示未来的可能性（为续集留下空间，或给出闭合感）

---

## 三、弧光完整性校验

在 char0 概念设计或叙事框架设计完成后，对每个角色按以下步骤校验弧光完整性：

| 校验项 | 问题 | 检查方法 |
|--------|------|---------|
| 阶段覆盖 | 角色的弧光是否覆盖了全部 8 个阶段？ | 逐阶段检查是否有对应情节事件 |
| Want vs Need | 角色的表层欲望和深层需求是否明确区分？ | 检查 char0 的目标/动机字段 |
| 不可逆变化 | 角色在阶段 8 是否发生了不可逆的变化？ | 对比阶段 1 和阶段 8 的角色状态，是否有本质差异 |
| 代价真实性 | 角色在阶段 6 付出的代价是否足够沉重？ | 代价是否与角色的核心价值观相关 |
| 主动跨越 | 角色是否在阶段 3 做出了主动选择？ | 检查激励事件后角色的决定是否由自身做出 |

**如果某个阶段缺失：** 标明缺失原因（如"本角色为配角，弧光仅覆盖阶段 1-4"），并确认其在主角弧光中的功能。

---

## 四、与幕结构的对照

| 故事圈阶段 | 三幕结构 | 五幕结构 |
|-----------|---------|---------|
| 1 均衡 | 第一幕建制 | 第一幕 |
| 2 需求 + 3 跨越 | 第一幕→第二幕转折 | 第二幕 |
| 4 适应 | 第二幕前半 | 第二幕→第三幕 |
| 5 胜利 + 6 代价 | 第二幕后半→危机 | 第三幕→第四幕 |
| 7 回归 + 8 改变 | 第三幕解决 | 第五幕 |

**操作要点：** 故事圈是角色弧光模型，幕结构是情节组织模型。两者配合使用——幕结构确定章节布局，故事圈校验每个角色的弧光完整性。
````

- [ ] **Step 2: Commit**

```bash
rtk git add skills/novel-research/references/theory/harmon-story-circle.md
rtk git commit -m "feat(research): add harmon-story-circle theory reference"
```

---

### Task 6: 写入 zhuji-character-theory.md

**Files:**
- Create: `skills/novel-research/references/theory/zhuji-character-theory.md`
- Source: JSON prompt [69]

- [ ] **Step 1: 从 temp-theory-sources.txt 提取 prompt [69] 核心内容并重写写入**

````markdown
# 珠矶角色理论参考

本文件提炼珠矶预设中的自有角色理论框架——三轴解构体系，供 agent 在角色创建管线开始前查阅。

---

## 一、核心框架：三轴解构

珠矶角色理论将一个虚构角色解构为三个相互关联的轴，每个轴负责角色的一个侧面。三轴共同构成角色的完整画像。

```
        外显轴（你看到什么）
       /                    \
      /                      \
  内质轴 —————— 外延轴
（你是谁）        （你从哪里来 / 你与谁相连）
```

---

## 二、外显轴 — 角色的外在表象

**定义：** 读者/其他角色可以通过感官直接感知的特征。

**子维度：**
- 面容 — 面部特征、表情习惯、长相给人的第一印象
- 身体 — 体型、体态、习惯性动作、身体与年龄/身份的匹配度
- 声音 — 音色、音量、语速、口音、说话时的身体语言
- 气味 — 常带的气味（香水/烟味/书卷气/……），气味的叙事功能
- 服装 — 穿衣风格、颜色偏好、配饰选择，以及它们与社会身份/人格的关联

**联动规则：**
- 外显轴必须与内质轴呼应——反常的外显（如"幼小身躯+成熟气质"）本身就是角色深度
- 外显轴的每个维度必须有具体描述，不能只用抽象形容词（"美丽""帅气"→追问具体特征）

---

## 三、内质轴 — 角色的内在世界

**定义：** 角色的人格、心理结构、价值观、驱动力系统。

**子维度：**
- 人格类型 — MBTI/Enneagram 框架下的大致分类（非绝对标签，仅为快速定位参考）
- 核心驱动力 — 角色"为什么早上起床"？最深层的动机是什么？
- 压力行为 vs 放松行为 — 角色在不同状态下的行为差异（这是自然暴露性格的关键）
- 盲点 — 角色不自知的弱点、偏见、自我欺骗
- 自我认知 vs 他人评价 — 角色如何看待自己 vs 别人如何看待他，两者之间的差距就是戏剧张力
- 核心价值观 — 角色在什么事情上绝不让步？什么情况下会打破自己的规则？

**联动规则：**
- 内质轴驱动外显轴的表征方式（同样穿黑色，可以是"低调"也可以是"威慑"）
- 内质轴决定外延轴中的成长轨迹和关键选择

---

## 四、外延轴 — 角色的社会嵌入

**定义：** 角色与其所处社会环境的关系网络和历史纵深。

**子维度：**
- 社会属性 — 阶层、身份、职业、权力位置
- 人际关系 — 关键关系（家人/导师/对手/爱慕对象）、关系质量、关系变化
- 成长经历 — 出身、教育、关键转折事件
- 时间线 — 角色生命中的重要时间节点（发生了什么→改变了什么）

**联动规则：**
- 外延轴为内质轴的"为什么你是这样的人"提供解释（不是简单因果，而是复杂互动）
- 外延轴的"关系网络"与 character-relationships.md 共享数据，但要区分角色的主观视角和客观分析

---

## 五、三轴联动校验

角色创建完成后，按以下规则校验三轴之间的一致性：

| 校验项 | 检查内容 | 通过标准 |
|--------|---------|---------|
| 外显↔内质呼应 | 外貌特征是否反映内在人格？ | 至少 2 个外显维度能追溯到内质驱动 |
| 外显↔外延一致 | 外貌/服装是否与社会身份/出身匹配？ | 有不匹配时必须有合理的故事内解释 |
| 内质↔外延支撑 | 人格形成是否能在成长经历中找到脉络？ | 至少 1 个关键人格特质能追溯到 1 个关键人生事件 |
| 三轴一体 | 三轴描述是否存在矛盾？ | 所有矛盾都有叙事意图（弧光/二元性格设计） |

---

## 六、Agent 使用方式

开始 char0~7 角色创建管线前，阅读本文件理解三轴体系。
- **char0（概念设计）：** 在"三选一"模板中融入三轴框架——与用户探讨角色时，始终围绕"外显是什么、内质是什么、外延是什么"
- **char1（外显模块）：** 对应外显轴的 5 个子维度
- **char2（内质模块）：** 对应内质轴的 6 个子维度
- **char3（外延模块）：** 对应外延轴的社会属性和成长经历部分
- **角色审查——一致性诊断：** 直接应用三轴联动校验表
````

- [ ] **Step 2: Commit**

```bash
rtk git add skills/novel-research/references/theory/zhuji-character-theory.md
rtk git commit -m "feat(research): add zhuji-character-theory reference"
```

---

### Task 7: 读取 narrative 相关 JSON 源 prompts

**Files:** None

- [ ] **Step 1: 提取叙事相关 prompt 内容**

```bash
node -e "
const fs = require('fs');
const files = fs.readdirSync('ref/example');
const j = JSON.parse(fs.readFileSync('ref/example/' + files[0], 'utf8'));
const prompts = j.prompts;
for (let idx of [135,138,139]) {
  const p = prompts[idx];
  console.log('=== [' + idx + '] ' + p.name + ' ===');
  console.log(p.content);
  console.log('\n\n');
}
" > temp-narrative-sources.txt
```

---

### Task 8: 写入 narrative-structure-guide.md

**Files:**
- Create: `skills/novel-research/references/narrative-structure-guide.md`
- Source: JSON prompts [135][138][139]

- [ ] **Step 1: 从 temp-narrative-sources.txt 提取三个 prompt 的内容，重写为 agent 操作手册写入**

````markdown
# 叙事结构指导 — Agent 操作手册

本文件指导 agent 在 novel-research Phase 4 撰写叙事结构和章节计划，将模糊的情节构想转化为可逐章执行的框架。

**使用方式：**
1. 先按第一部分建立叙事框架 → 产出写入 `20-story/plot-outline.md` 的叙事约束段落
2. 再按第二部分梳理叙事网络 → 更新 `plot-outline.md` 和 `foreshadowing.md`
3. 最后按第三部分逐章细化 → 产出写入 `30-draft/chapter-plan.md` 的章节条目

**前置条件：** 角色创建全部完成，世界观构建全部完成。

---

## 第一部分：叙事框架设计

将故事的整体叙事原则固化为可执行的约束。

### 步骤 1：预设作者与语境

**目标：** 定义叙事声音的人格面具和故事语境。

**操作要点：**

1. **预设作者（叙事声音）：**
   - 这个人格面具的**知识范围**是什么？（全知 / 第三人称有限 / 多角色交替）
   - 其**价值立场**是什么？（中立观察者 / 同情某一方 / 讽刺批判）
   - 其**情感倾向**是什么？（温暖 / 冷峻 / 幽默 / 忧郁）
   - 这个声音在故事中是否会变化？（如在喜剧段落更轻松，悲剧段落更沉重）

2. **历史/文化语境：**
   - 故事发生的时代背景在叙事上的含义——它对人物的思维方式和行为规范有何影响？
   - 是否有特殊的文化规则需要在叙事中解释或暗示？

**产出（写入 `plot-outline.md`）：**

```markdown
### 预设作者
- **知识范围**：{全知/有限/多视角}
- **价值立场**：{1-2 句}
- **情感基调**：{1-2 句}
- **时代语境**：{关键的时代/文化约束}
```

### 步骤 2：情节结构与叙事序列

**目标：** 选定叙事结构骨架——用哪种幕结构组织故事？事件的因果关系如何安排？

**操作要点：**

1. **幕结构选型** — 根据故事类型选择合适的幕结构：
   - **三幕** — 适合大多数中短篇和线性叙事
   - **五幕** — 适合长篇、多线索、需要更多转折的叙事
   - **故事圈** — 角色驱动型叙事的推荐选择

   **必须查阅 `references/theory/mckee-story.md`** 了解各幕结构的设计原则和优缺点。

2. **叙事序列设计** — 确定事件的因果链：
   - 故事从哪个事件开始？（激励事件的位置）
   - 哪些事件是因果必然、哪些可以重新排序？
   - 是否存在非线性时段？（倒叙/插叙/预叙——如有，在哪里插入？为什么？）

3. **弧光校验** — **必须查阅 `references/theory/harmon-story-circle.md`** 的 8 阶段循环：
   - 主角的弧光是否覆盖了 8 个阶段？
   - 如有缺失，哪几个阶段？为什么缺失？（配角可以省略部分阶段）
   - 激励事件、中点转折、危机、高潮分别对应故事圈的哪个阶段？

**产出（写入 `plot-outline.md`）：**

```markdown
### 叙事结构
- **幕结构类型**：{三幕/五幕/故事圈}
- **激励事件**：{一句话描述}
- **各幕概览**：
  - 第一幕：{建制 — 1-2 句}
  - 第二幕：{对抗 — 1-2 句}
  - 第三幕：{解决 — 1-2 句}
- **主角弧光覆盖**：{8 阶段的覆盖情况，缺失阶段说明原因}
- **非线性设计**：{如有倒叙/插叙，说明位置和意图}
```

### 步骤 3：叙述视角与时间处理

**目标：** 确定"谁在讲故事"和"时间如何流动"。

**操作要点：**

1. **叙述视角：**
   - 人称选择（第一/第三人称，第二人称极少用于长篇小说）
   - 如果是第三人称：全知还是有限？聚焦于单一角色还是多角色切换？
   - 多视角切换的规则（每章切换？每节切换？每个角色有独立的时间线？）

2. **时间处理：**
   - 主叙事线的时间方向（顺叙为主/倒叙开篇/插叙穿插）
   - 时间跳跃的合法性规则（什么情况下可以跳跃？最小/最大跳跃跨度？）
   - 不同时间线的并行/交错方式

3. **叙述距离：**
   - 贴近人物内心（大量内心独白/心理描写）vs 上帝视角叙事（客观/距离感）
   - 叙事距离在哪些场景需要拉近？哪些场景需要拉远？

**产出（写入 `plot-outline.md`）：**

```markdown
### 叙述视角与时间
- **人称**：{第一/第三人称}
- **视角规则**：{全知/有限/多角色切换规则}
- **时间结构**：{顺叙为主/倒叙开篇/…}
- **时间跳跃规则**：{跳跃的条件和跨度}
- **叙述距离**：{贴近/疏离，变化规则}
```

### 步骤 4：预期读者体验

**目标：** 设计读者在阅读过程中的信息差和情感节奏。

**操作要点：**

1. **信息不对称设计：**
   - 读者知道而角色不知道的信息？（戏剧反讽）
   - 角色知道而读者不知道的信息？（悬疑/揭示）
   - 两者都不知道，逐步共同发现？（探索型叙事）

2. **悬念节奏：**
   - 大悬念（贯穿全篇的核心问题）是什么？
   - 小悬念（每章/每场景未解答的问题）如何布置？
   - 悬念的"提问→延迟→回答"节奏

3. **空白策略：**
   - 哪些信息明确展示，哪些留给读者推断？
   - 留白的地方是否会影响读者理解关键情节？

**产出（写入 `plot-outline.md`）：**

```markdown
### 读者体验设计
- **核心悬念**：{贯穿全篇的核心问题}
- **信息差策略**：{读者知道/角色知道/共同发现的分配}
- **空白设计**：{留给读者推断的关键信息}
```

---

## 第二部分：叙事网络梳理

将第一部分的框架原则落实到具体的章节布局。

### 步骤 1：章节概览

**操作要点：**

1. 列出所有计划章节（从第一章到最后一章）
2. 每章用一句话概括剧情
3. 标注每章在"起承转合"中的位置：
   - **起** — 建制/引入
   - **承** — 发展/对抗
   - **转** — 转折/危机
   - **合** — 解决/收束

**产出（写入 `plot-outline.md`）：**

```markdown
### 章节概览
| 章节 | 定位 | 剧情概要 |
|------|------|---------|
| Ch01 | 起 | {一句话} |
| Ch02 | 承 | {一句话} |
| ...
```

### 步骤 2：情感弧线与紧张度曲线

**操作要点：**

1. 标注每章的整体情感基调（希望/绝望/紧张/温馨/恐怖/幽默/……）
2. 检查全篇情感曲线的合理变化：
   - 不能全程紧绷（读者疲劳）——紧张与舒缓必须有交替
   - 不能全程松散（读者无聊）——必须有持续上升的紧张基线
3. 标注紧张度的峰谷位置和原因

**产出（写入 `plot-outline.md`）：**

```markdown
### 情感弧线
| 章节 | 情感基调 | 紧张度（1-10） | 变化原因 |
|------|---------|---------------|---------|
| Ch01 | 平静/好奇 | 3 | {原因} |
| ...
```

### 步骤 3：伏笔与呼应管理

**操作要点：**

1. 列出已有伏笔（从 `foreshadowing.md` 读取）
2. 标注每个伏笔的：
   - **设置章** — 在哪一章埋下伏笔
   - **揭示章** — 在哪一章收束
   - **提示方式** — 如何让读者在揭示前能隐约察觉到
3. 检查是否有"只埋不收"的伏笔
4. 检查揭示顺序是否符合因果逻辑（A 必须在 B 之前揭示）

**产出（写入 `plot-outline.md` + 更新 `foreshadowing.md`）：**

```markdown
### 伏笔管理
| 伏笔 | 设置章 | 提示方式 | 揭示章 | 收束方式 |
|------|--------|---------|--------|---------|
```

---

## 第三部分：章节细化

逐章深度设计，每章写入 `30-draft/chapter-plan.md` 一个条目。

### 每章填写以下字段：

| 字段 | 说明 | 来源 |
|------|------|------|
| **本章目标** | 本章推进哪条线索 / 塑造哪个角色 / 揭示什么信息 | 从第二部分章节概览细化 |
| **出场角色** | 本章出现的角色列表，必须与 `20-story/characters/` 中的角色名对齐 | 角色卡列表 |
| **时空起止** | 发生地点 + 时间跨度 | 世界观设定 + 情节逻辑 |
| **关键场景** | 2-5 个场景，每个一句话概括 | 从本章目标拆解 |
| **前后衔接** | 承接前章的什么事件 → 为后章埋下什么线索 | 叙事网络中的因果链 |
| **预期字数** | 本章目标字数范围 | 与 Phase 3 确认的篇幅目标对齐 |

**产出（写入 `30-draft/chapter-plan.md` 的对应章节条目）：**

```markdown
### Chapter-XX

- **目标**：{本章核心任务}
- **出场角色**：{角色列表}
- **时空**：{地点，时间跨度}
- **关键场景**：
  1. {场景概括}
  2. {场景概括}
- **衔接**：{承接前章X → 为后章Y铺垫}
- **预期字数**：{范围}
```

### 场景功能校验

对每个计划场景，按麦基的场景分析原则检查：

- [ ] 该场景是否推进了情节？
- [ ] 该场景是否揭示了人物新侧面？
- [ ] 该场景是否传递了主题或建立了氛围？

一个场景必须至少满足两条，否则考虑合并到相邻场景。

---

## 产出清单

| # | 内容 | 写入文件 | 必填 |
|---|------|---------|------|
| 1 | 预设作者 | `plot-outline.md` | ✓ |
| 2 | 叙事结构（幕选型 + 弧光校验） | `plot-outline.md` | ✓ |
| 3 | 叙述视角与时间 | `plot-outline.md` | ✓ |
| 4 | 读者体验设计 | `plot-outline.md` | ✓ |
| 5 | 章节概览 | `plot-outline.md` | ✓ |
| 6 | 情感弧线 | `plot-outline.md` | ✓ |
| 7 | 伏笔管理 | `plot-outline.md` + `foreshadowing.md` | ✓ |
| 8 | 逐章细化 | `chapter-plan.md` | ✓ |
````

- [ ] **Step 2: 验证文件**

```bash
node -e "const fs=require('fs');const c=fs.readFileSync('skills/novel-research/references/narrative-structure-guide.md','utf8');console.log('Lines:',c.split('\n').length);"
```

- [ ] **Step 3: Commit**

```bash
rtk git add skills/novel-research/references/narrative-structure-guide.md
rtk git commit -m "feat(research): add narrative-structure-guide agent handbook"
```

---

### Task 9: 修改 novel-research/SKILL.md — Phase 3 前置段落

**Files:**
- Modify: `skills/novel-research/SKILL.md`

- [ ] **Step 1: 在 Phase 3"角色创建管线"段落之前插入前置阅读说明**

原文第 154 行：
```
**角色创建管线：** agent 在创建角色时，按 `references/character-interview-guide.md` 第一部分的 char0~7 步骤逐步骤执行，角色创建完成后运行第二部分「角色审查」进行自检。
```

替换为：

```
**角色创建前置：**
- agent 在开始角色创建前，必须阅读 `references/theory/zhuji-character-theory.md` 理解三轴解构体系（外显轴/内质轴/外延轴）
- 在后续 char0~3 中以三轴框架引导用户访谈：char0 聚焦三轴概念设计，char1 聚焦外显轴，char2 聚焦内质轴，char3 聚焦外延轴

**角色创建管线：** agent 在创建角色时，按 `references/character-interview-guide.md` 第一部分的 char0~7 步骤逐步骤执行，角色创建完成后运行第二部分「角色审查」进行自检。审查中的一致性诊断依据 `references/theory/mckee-character.md` 的六维度体系，弧光校验依据 `references/theory/harmon-story-circle.md` 的 8 阶段循环。
```

- [ ] **Step 2: Commit**

```bash
rtk git add skills/novel-research/SKILL.md
rtk git commit -m "feat(research): add theory pre-reading gate for Phase 3 character creation"
```

---

### Task 10: 修改 novel-research/SKILL.md — Phase 4 叙事步骤重写

**Files:**
- Modify: `skills/novel-research/SKILL.md`

- [ ] **Step 1: 重写 Phase 4 的"风格与叙事构建"段落（原文第 175 行）**

原文：
```
**风格与叙事构建：** agent 在撰写 `10-research/style-research.md` 时，按 `references/style-analysis-guide.md` 的文体分析流程和风格复现宪章产出风格约束。在撰写 `30-draft/chapter-plan.md` 和 `20-story/plot-outline.md` 时，按 `references/narrative-structure-guide.md` 的叙事框架设计 → 叙事网络梳理 → 章节细化流程构建故事结构。
```

替换为：

```
**风格构建：** agent 在撰写 `10-research/style-research.md` 时，按 `references/style-analysis-guide.md` 的文体分析流程和风格复现宪章产出风格约束。

**叙事构建：** agent 分两步进行 —
1. 按 `references/narrative-structure-guide.md` 第一部分建立叙事框架（预设作者、情节结构选型、叙述视角、读者体验），产出写入 `20-story/plot-outline.md` 的叙事约束段落。**情节结构选型时，必须查阅 `references/theory/mckee-story.md` 了解幕设计原则，并用 `references/theory/harmon-story-circle.md` 的 8 阶段循环校验主角弧光完整性。**
2. 按 `references/narrative-structure-guide.md` 第二、三部分梳理叙事网络并逐章细化，产出写入 `20-story/plot-outline.md`、`20-story/foreshadowing.md` 和 `30-draft/chapter-plan.md`。
```

- [ ] **Step 2: Commit**

```bash
rtk git add skills/novel-research/SKILL.md
rtk git commit -m "feat(research): rewrite Phase 4 narrative step with theory gate"
```

---

### Task 11: 修改 novel-research/SKILL.md — 参考文件列表扩展

**Files:**
- Modify: `skills/novel-research/SKILL.md`

- [ ] **Step 1: 在参考文件列表（原文第 270-274 行附近）新增条目**

原文：
```
- 自检细则：[references/completion-gate.md](references/completion-gate.md)
- 角色访谈方法指引：[references/character-interview-guide.md](references/character-interview-guide.md)
- 世界观构建方法指引：[references/worldbuilding-guide.md](references/worldbuilding-guide.md)
- 风格分析方法指引：[references/style-analysis-guide.md](references/style-analysis-guide.md)
- 叙事结构方法指引：[references/narrative-structure-guide.md](references/narrative-structure-guide.md)
```

替换为：

```
- 自检细则：[references/completion-gate.md](references/completion-gate.md)
- 角色访谈方法指引：[references/character-interview-guide.md](references/character-interview-guide.md)
- 世界观构建方法指引：[references/worldbuilding-guide.md](references/worldbuilding-guide.md)
- 风格分析方法指引：[references/style-analysis-guide.md](references/style-analysis-guide.md)
- 叙事结构方法指引：[references/narrative-structure-guide.md](references/narrative-structure-guide.md)
- 理论参考 — 麦基《人物》：[references/theory/mckee-character.md](references/theory/mckee-character.md)
- 理论参考 — 麦基《对白》：[references/theory/mckee-dialogue.md](references/theory/mckee-dialogue.md)
- 理论参考 — 麦基《故事》：[references/theory/mckee-story.md](references/theory/mckee-story.md)
- 理论参考 — 哈蒙故事圈：[references/theory/harmon-story-circle.md](references/theory/harmon-story-circle.md)
- 理论参考 — 珠矶角色理论：[references/theory/zhuji-character-theory.md](references/theory/zhuji-character-theory.md)
```

- [ ] **Step 2: Commit**

```bash
rtk git add skills/novel-research/SKILL.md
rtk git commit -m "feat(research): add theory references to reference file list"
```

---

### Task 12: 修改 novel-drafting/SKILL.md — Writer 契约 + COT 注入

**Files:**
- Modify: `skills/novel-drafting/SKILL.md`

- [ ] **Step 1: 在 Writer 契约之前新增 COT 思维链模板小节**

在 `## Writer 子 Agent 契约`（原文第 84 行）之前插入：

```markdown
## Subagent 思维链模板

Writer 和 Reviewer 子代理在执行起草或审查前，按以下模板推进：

1. **上下文理解** — 本章在全书的位置？本章的核心目标是什么？出场角色有哪些？
2. **约束回顾** — 本章需要遵守的风格约束（对照 `10-research/style-research.md` 和 `references/style-analysis-guide.md` 的四层宪章）？角色声线要求（对照角色卡）？伏笔/揭示要求（对照 `20-story/foreshadowing.md`）？
3. **执行方案** — 拟写几幕？每幕的起止和功能？每幕关键场景？
4. **自检** — 产出是否覆盖上述所有要求？是否对照 `lint-contract.md` 的起草自检清单逐项通过？

subagent 在实际产出之前，先输出以上四步的简短摘要。
```

- [ ] **Step 2: 在 Writer 契约中新增对话条款**

在 Writer 契约（`只向 writer 提供：` 列表）的最后新增一条：

原文契约（第 84-97 行）末尾是 `writer 输出当前章节草稿，并写出当前章节的 continuity state。`

在其后新增：

```markdown

**Writer 硬性要求：**
- 对话场景中，每段对话必须至少体现一种潜文本动词（暴露/操控/维护）。对照 `references/theory/mckee-dialogue.md` 的三大功能和潜文本动词体系检查。
- 起草时对照 `references/style-analysis-guide.md` 的四层宪章（神/骨/皮/肉）逐层校验风格一致性。
```

- [ ] **Step 3: Commit**

```bash
rtk git add skills/novel-drafting/SKILL.md
rtk git commit -m "feat(drafting): add COT template and writer dialogue gate"
```

---

### Task 13: 修改 novel-drafting/SKILL.md — Reviewer 契约

**Files:**
- Modify: `skills/novel-drafting/SKILL.md`

- [ ] **Step 1: 在 Reviewer 契约的检查项中新增两条**

在 `reviewer 需要检查：` 列表（第 101-110 行）末尾，`- 节奏与可读性` 之后新增：

```markdown
- 角色行为一致性：对照 `references/theory/mckee-character.md` 的六维度体系检查角色行为是否与角色卡定义一致，是否存在矛盾。确认本角色在本章中是否有可感知的弧光推进
- 叙事结构校验：本章是否达成 `30-draft/chapter-plan.md` 中的本章目标？是否正确承接前章事件、为后章铺垫线索？
```

- [ ] **Step 2: Commit**

```bash
rtk git add skills/novel-drafting/SKILL.md
rtk git commit -m "feat(drafting): add theory gates to reviewer contract"
```

---

### Task 14: 修改 lint-contract.md — 新增起草自检清单

**Files:**
- Modify: `skills/novel-drafting/lint-contract.md`

- [ ] **Step 1: 在文件末尾（第 73 行 `## 概述` 之后的内容结束后）新增第二部分**

在文件末尾追加：

```markdown

---

## 起草自检清单

以下维度供 agent 在提交验证前做自我审查。Writer 子代理在产出草稿后逐项自检，Reviewer 子代理在审查时逐项核实。

### 结构维度
- [ ] 章节目标达成 — 本章是否完成了 `chapter-plan.md` 中定义的本章目标？
- [ ] 前后衔接正确 — 承接的前章事件是否准确？为后章埋的线索是否到位？

### 角色维度
- [ ] 角色声线一致 — 角色说的话是否符合其对话风格定义？
- [ ] 角色行为一致 — 行为是否与角色卡的性格/特质描述一致？对照 `references/theory/mckee-character.md` 的六维度诊断体系
- [ ] 角色弧光推进 — 角色在本章中是否有可感知的变化？对照 `references/theory/harmon-story-circle.md` 的 8 阶段

### 叙事维度
- [ ] 叙事视角一致 — 是否遵守了 `narrative-structure-guide.md` 定义的视角规则？
- [ ] 节奏合理 — 本章的紧张与舒缓是否符合全篇情感曲线的预期位置？

### 风格维度
- [ ] 四层宪章逐层校验 — 神层（核心法则）/ 骨层（结构法则）/ 皮层（语言积木）/ 肉层（风格化段落）是否各有体现？对照 `style-analysis-guide.md`
- [ ] 对话功能校验 — 每段对话是否至少体现一种潜文本动词（暴露/操控/维护）？对照 `references/theory/mckee-dialogue.md`

### 质量维度
- [ ] 信息密度达标 — 本章是否提供了新信息 / 推进了至少一条线索？
- [ ] 字数达标 — 是否符合 `chapter-plan.md` 的预期字数范围？（使用 `WordCount` 模式验证）
- [ ] 无伏笔遗漏 — 是否有应在本章收束但未收束的伏笔？对照 `foreshadowing.md`
- [ ] 无设定矛盾 — 本章内容是否与 `worldbuilding-guide.md` 的设定约束冲突？

### 连续性维度
- [ ] 时间线一致 — 本章事件发生的时间是否与前后章一致？
- [ ] 空间转换有交代 — 场景切换时是否有转场说明？
```

- [ ] **Step 2: Commit**

```bash
rtk git add skills/novel-drafting/lint-contract.md
rtk git commit -m "feat(drafting): add 15-dimension self-check checklist to lint-contract"
```

---

### Task 15: 更新 character-interview-guide.md — 修复"待补充"标记

**Files:**
- Modify: `skills/novel-research/references/character-interview-guide.md`

- [ ] **Step 1: 找到并修复第 478 行的"待补充"标记**

原文第 478 行：
```
> **前置依赖：** `references/theory/mckee-character.md`（子项目四产出，如尚未完成则标注「待补充」）
```

替换为：
```
> **审查依据：** 对照 `references/theory/mckee-character.md` 的六维度诊断体系和圆形/扁平人物标准进行审查。
```

- [ ] **Step 2: Commit**

```bash
rtk git add skills/novel-research/references/character-interview-guide.md
rtk git commit -m "fix(research): resolve pending dependency marker for mckee-character"
```

---

### Task 16: 验证 — tsc + test

**Files:** None

- [ ] **Step 1: 运行 TypeScript 类型检查**

```bash
rtk npx tsc --noEmit
```

Expected: 无错误

- [ ] **Step 2: 运行测试套件**

```bash
rtk npm test
```

Expected: 全部通过

- [ ] **Step 3: 运行端口性回归**

```bash
rtk node --import tsx --test tests/validators.test.js --test-name-pattern "skill source files do not depend on repo-root shared script paths"
```

Expected: 通过

- [ ] **Step 4: 确认无僵尸引用**

```bash
node -e "
const fs=require('fs');
const refs=['references/theory/mckee-character.md','references/theory/mckee-dialogue.md','references/theory/mckee-story.md','references/theory/harmon-story-circle.md','references/theory/zhuji-character-theory.md','references/narrative-structure-guide.md'];
const base='skills/novel-research';
refs.forEach(r=>{const exists=fs.existsSync(base+'/'+r);console.log(r,exists?'EXISTS':'MISSING');});
"
```

Expected: 全部 EXISTS

- [ ] **Step 5: Commit**

```bash
rtk git add progress.md
rtk git commit -m "chore: update progress.md after zhuji gap fill completion"
```

---

### Task 17: 清理临时文件

**Files:**
- Delete: `temp-theory-sources.txt`
- Delete: `temp-narrative-sources.txt`
- Delete: `temp-inspect.mjs`

- [ ] **Step 1: 删除临时文件**

```bash
rm temp-theory-sources.txt temp-narrative-sources.txt temp-inspect.mjs
```

- [ ] **Step 2: Commit**

```bash
rtk git add -u
rtk git commit -m "chore: clean up temp inspection files"
```
