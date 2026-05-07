# novel-research 访谈流程阶段化改造

## 背景

`novel-research` 当前的需求访谈是扁平化的：8 个话题逐项提问后直接写 11 个产物文件，中间没有确认节点，也没有方案探索环节。对比 `brainstorming` skill 的阶段化、增量验证、用户审阅闸门等设计模式，存在以下差距：

1. 无增量验证 —— 用户可能在 8 个问题答完后才发现方向偏了
2. 无方案探索 —— agent 默认按自己的理解走，不给用户比较选择的机会
3. 无用户审阅闸门 —— agent 自判 `research_complete` 即推进，用户没看过文件

## 目标

参照 brainstorming 的流程设计，将 novel-research 的访谈阶段重构为 6 个编号阶段，保持产物文件和 validator 不变，不影响下游 `novel-drafting`。

## 新流程：6 个阶段

### Phase 1: 范围评估与分解

**何时触发：** 用户提出任何新小说构想时首先执行此阶段。

**判断逻辑：**
- 项目是否过于庞大需要拆分？信号包括：三部曲/系列、超过 3 条主线 POV、横跨多时代/大陆、用户明确提到「系列」「多部」
- 若需拆分：帮助用户理清子项目关系与顺序，当前 session 聚焦第一个子项目
- 若正常范围：执行项目创建规则（slug 命名、目录结构、模板实例化），进入 Phase 2

**参考：** brainstorming 的「scope assessment and decomposition」

### Phase 2: 方案探索

**目的：** 在细节访谈之前，向用户呈现 2-3 个不同的大方向，让用户主动选择而非被动跟随。

**方向卡片格式**（每个 3-5 句）：
- 一句话定位
- 叙事视角 + 体裁
- 基调与气质
- 与其它方向的本质区别

**流程：**
1. Agent 基于用户初始描述提炼方向
2. 逐个呈现方向卡片
3. 等待用户选择（可单选、混合、自提新方向）

**跳过条件：** 用户初始表述已非常具体时可缩短为一次确认。

**参考：** brainstorming 的「exploring approaches」

### Phase 3: 增量访谈

**分组结构：**

| 组 | 话题 | 确认问题 |
|----|------|----------|
| A. 外部形态 | 类型与体裁、目标读者、篇幅目标 | 「这是一个什么样的故事，给谁看，多长？」 |
| B. 内在驱动 | 语气与氛围、核心冲突、主角欲望 | 「故事的情感底色和推动力是什么？」 |
| C. 边界条件 | 结局倾向、禁忌内容 | 「哪些方向不能走，终点大概在哪里？」 |

**组内规则：**
- 一次只问一个问题，尽量使用选择题
- 组内全部答完后，agent 用 3-5 句话总结本组理解
- 询问用户确认后才进入下一组
- 若用户纠正，迭代修改后再次确认

**角色卡导入时机：** B 组完成、进入 C 组之前询问。

**最终确认：** 三组全部通过后，agent 给出覆盖所有 8 个话题的整体摘要，确认后进入 Phase 4。

**参考：** brainstorming 的「incremental validation」+「one question at a time」

### Phase 4: 调研与文件撰写

继承现有机制，所有规则不变：

- **联网调研：** 默认进行，除非用户明确禁止
- **调研转化：** 每个发现转为设定约束/术语说明/真实性风险/风格规则/禁忌或连续性风险
- **产物文件：**
  - `00-project/project-brief.md`
  - `00-project/success-criteria.md`
  - `00-project/workflow-status.md`
  - `10-research/topic-research.md`
  - `10-research/setting-research.md`
  - `10-research/style-research.md`
  - `10-research/references.md`
  - `20-story/characters.md`
  - `20-story/plot-outline.md`
  - `20-story/foreshadowing.md`
  - `30-draft/chapter-plan.md`
- **文件约束：** 可追溯到 Phase 3 确认结论，文件间不得矛盾

### Phase 5: 自检

两道检查，必须全部通过才能进入 Phase 6：

**第一道：完整性清单**
- 主角、核心冲突、故事目标明确
- 篇幅目标已设定且与章节计划一致
- 章节计划与篇幅和推进节奏匹配
- 伏笔出现在对应收束点之前
- 风格约束足够约束后续起草
- 世界观/设定/真实性无明显空白

**第二道：机械验证**
```
node --experimental-strip-types scripts/validate-research-project.mts --project-root <path>
```

失败时状态保持 `research_in_progress`，回到对应阶段补充。

### Phase 6: 用户审阅闸门

**硬约束：** 在用户明确确认之前，`workflow-status.md` 状态绝对不能写为 `research_complete`。

**流程：**
1. Agent 列出全部产物文件路径 + 简洁摘要
2. 询问用户审阅确认
3. 用户提出修改 → 修改后回到步骤 1
4. 用户确认 → 更新 `00-project/workflow-status.md`:
   - `Status` → `research_complete`
   - `Next Allowed Skill` → `novel-drafting`
   - 更新 `Last Updated`

**参考：** brainstorming 的「user review gate」

## 保留不变

以下现有内容分配到各阶段的子说明中，规则本身不变：

- 项目创建规则（slug、目录结构）→ Phase 1
- 角色卡导入（parse-charcard 脚本）→ Phase 3
- 搜索策略 → Phase 4
- 调研转化规则 → Phase 4
- 反模式/自我说服表 → 独立章节保留
- 状态流转定义 → 独立章节保留

## 不做改动

- 产物文件列表和格式不变
- validator 脚本不变
- `novel-drafting` skill 不做联动调整
- `completion-gate.md` 检查项不变（被 Phase 5 引用）
- `novel-workflow-overview.md` 中的阶段定义不变

## 状态流转

保持现有状态机，仅对 `research_complete` 的判定增加 Phase 6 闸门：

```
initialized → research_in_progress → research_blocked（可恢复）
                                   → research_complete（需通过 Phase 5 + Phase 6）
```

## 与其他 skill 的关系

- **上游：** 无（research 是起点）
- **下游：** `novel-drafting` —— 读取 research 的产物文件，不受本次改造影响
- **同级：** `brainstorming` —— 设计参考来源，不产生运行时依赖
