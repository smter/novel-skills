# 角色子代理设计（Character Sub-Agent） for novel-drafting

## 动机

在 novel-drafting 的章节写作中，Writer 子代理有时无法设身处地以某个角色的视角进行思考。Writer 拥有全知叙事视角，但缺少角色内在的心理逻辑。引入角色子代理——一个代入指定角色人格和记忆的 AI——让 Writer 获得更真实的角色视角反馈，提升人物行为的一致性和深度。

## 总体架构

角色子代理作为 Writer 的前置增强层，插入现有的章节循环。两层派发：

1. **控制器预派发（主路径）**：控制器在派发 Writer 之前，根据 chapter-plan 标注的关键角色，预派发角色子代理，收集角色视角分析，注入 Writer 上下文。
2. **Writer 自救派发（辅助路径）**：Writer 在写作中遇到角色视角困难时，自行派发角色子代理，获取角色分析反馈。

角色子代理**不写任何文件**，只返回结构化文本。这避免了验证器改动和新产物类型。

```
Controller (chapter-loop.md)
│
├─ 1. 读取 chapter-plan.md，获取本章「关键角色」列表
├─ 2. 对每个有关键角色卡的角色，派发角色子代理  ← 新增
│    输入：角色卡 + 过滤后知识账本 + 本章情节简报
│    输出：结构化角色分析（纯文本返回）
├─ 3. 将角色分析注入 Writer 上下文              ← 新增
├─ 4. 派发 Writer（上下文包含角色分析）
│    Writer 可自行派发角色子代理（自救工具）    ← 新增
├─ 5. 验证产物 → 派发 Reviewer
└─ 6. 根据 Decision 推进或重试
```

## 文件改动清单

| 文件 | 改动类型 | 说明 |
|------|----------|------|
| `character-subagent.md` | **新建** | 派发方指南 + Prompt 占位符模板 |
| `chapter-loop.md` | 修改 | Writer 派发前插入预派发步骤 |
| `chapter-plan.md`（模板） | 修改 | 每章新增可选 `关键角色` 字段 |
| `writer-subagent.md` | 修改 | 新增角色子代理自救派发章节 |

无其他文件改动。角色子代理不写文件，验证器不变。

## character-subagent.md 设计

### 文件定位

`character-subagent.md` 是**派发方（控制器或 Writer）的操作手册**，不是角色子代理阅读的 self-identity 文件。派发方按模板填充占位符后，发给角色子代理的 prompt 是纯粹的「角色本人视角」内容，避免「你是角色扮演 Agent」与「你是张三」的双重身份冲突。

### Prompt 模板

派发方将以下模板填充后直接发给角色子代理：

```
<CHARACTER_CARD>
（完整 charcard-raw/<角色名>.md 内容）
</CHARACTER_CARD>

<IN_STORY_MEMORY>
（从 chapter-state 的 Character Knowledge Changes 按角色名过滤后的条目）
</IN_STORY_MEMORY>

<CURRENT_SITUATION>
（本章情节简报 + story-state 情节摘要）
</CURRENT_SITUATION>

<OUTPUT_FORMAT>
请以以下格式回复：

当前情绪/心理状态：
<...>

对当前情境的本能反应：
<...>

可能的行动倾向：
1. <行动A> — 动机：<...>
2. <行动B> — 动机：<...>
3. <行动C> — 动机：<...>

内心独白片段：
<原文>

角色此刻不知道/误解的事：
- <...>
</OUTPUT_FORMAT>
```

### 填充规则

- **CHARACTER_CARD**：直接粘贴 `charcard-raw/<角色名>.md` 全文，不删改
- **IN_STORY_MEMORY**：只取该角色作为主体的 Knowledge Changes + 该角色 confirmed 的全局事实
- **CURRENT_SITUATION**：从 chapter-plan 提取本章目标段落 + story-state 的位置摘要
- **OUTPUT_FORMAT**：固定不变，是施加给角色子代理的唯一元指令

### 派发方禁止行为

- 不在模板外添加「你是角色扮演 Agent」等身份描述
- 不混入其他角色的信息
- 不预先假设角色的反应——让角色子代理从角色卡推导

## 控制器预派发流程

`chapter-loop.md` 在「派发 Writer」步骤之前插入以下流程：

1. 读取 `chapter-plan.md`，提取本章的「关键角色」字段
2. 对每个关键角色：
   - 检查 `charcard-raw/<角色名>.md` 是否存在
   - 存在：读取角色卡全文 → 从上一章 `chapter-XX-state.md` 的 Knowledge Changes 过滤该角色行 → 加上 `story-state.md` 中 confirmed 且该角色见证的全局事实 → 按模板组装 prompt → 派发角色子代理 → 获取结构化分析
   - 不存在：跳过该角色
3. 将所有角色分析汇总，作为 `## 角色视角分析` 段落注入 Writer 上下文（紧跟 chapter-plan 本章目标之后）
4. 读取 `writer-subagent.md` → 派发 Writer

多个关键角色的角色子代理可并行派发（互不依赖），汇总后再派发 Writer。

## 角色记忆过滤算法

输入：各 `chapter-XX-state.md` 的 Character Knowledge Changes 表格（格式：`角色 | 事实 | unknown|suspected|confirmed | source=chapter-XX`）。

三步过滤：

### 第一步：提取该角色为主体的行

角色 == 目标角色名 → 保留。不匹配 → 进入第二步。

### 第二步：该角色 confirmed 的全局事实

- 状态 == confirmed
- source <= 当前章节（不能是本章尚未发生的事）
- 该事实不属于「只有某人才知道的秘密」（检查 foreshadowing.md）→ 保留

### 第三步：该角色直接见证的全局事件（best-effort）

- `story-state.md` 中的全局事件
- 该角色在场（控制器根据各章 scene 描述做语义推断，非确定性计算）
- 状态 == confirmed → 保留

**注意**：第三步是辅助性启发式。主过滤路径为第一、二步（基于 Knowledge Changes 账本的结构化字段）。第三步中「该角色是否在场」和第二步中「是否为他人秘密」均依赖控制器对自然语言场景描述的推断，遇到歧义时采取保守策略——存疑则不纳入记忆。

### 实现

纯文本操作，控制器可直接 grep `chapter-XX-state.md` 中 `| <角色名> |` 的行。不需要新解析器。

### 冲突处理

如果角色知识账本中同一事实出现冲突终态（如一章写 confirmed、另一章写 unknown），优先采信 latest source，并在角色分析中标注「该角色对此事存在认知冲突」。

## 章节大纲扩展

`chapter-plan.md` 每章新增可选字段：

```
## Chapter-01: <标题>
- 关键角色：张三, 李四
- 目标：<...>
- 场景：<...>
```

**规则：**
- `关键角色` 为可选字段，为空时控制器跳过预派发
- 角色名必须与 `charcard-raw/` 下文件名（不含 `.md`）匹配
- 角色名也需与 `characters.md` 中该角色的 Name 一致
- 控制器按角色名查 charcard-raw/，找不到就跳过（不影响流程）

## Writer 自救派发

### writer-subagent.md 新增章节

在 Writer 的「允许读取的文件」列表后，新增：

```
## 角色子代理（自救工具）

当你在写作中觉得难以代入某个角色的视角时，可以派发角色子代理。步骤：

1. 读取 character-subagent.md 中的 Prompt 模板
2. 按模板填充：
   - CHARACTER_CARD：读取 charcard-raw/<角色名>.md 全文
   - IN_STORY_MEMORY：从当前 chapter-state 的 Knowledge Changes 过滤该角色行
   - CURRENT_SITUATION：当前场景上下文 + 角色此刻处境
   - OUTPUT_FORMAT：固定模板
3. 派发角色子代理，获取结构化角色分析
4. 参考角色分析继续写作

注意：
- 自救派发应在同一次 Writer 回合内完成（不返回控制器）
- 仅在确实需要时使用
- 角色分析结果不写入文件，仅作写作参考
```

### 触发信号

Writer 的 `Concerns` 字段中新增一种情况：「角色视角不确定性」—— Writer 标注自己对某角色行为的把握度低，控制器可据此在下轮重试时额外派发角色子代理。

## 边界情况

| 情况 | 处理 |
|------|------|
| 章节无关键角色字段 | 跳过预派发，Writer 自行判断 |
| 角色名在 charcard-raw/ 中不存在 | 跳过该角色，不影响流程 |
| 角色知识账本为空（第一章） | 仅用角色卡的 scenario 字段推断初始心理状态 |
| 角色子代理返回 BLOCKED | 日志记录，跳过，Writer 上下文标注「X 角色视角缺失」 |
| 输出偏离格式 | 不重试，将原文作为非结构化参考传给 Writer |
| 多角色并行派发部分失败 | 成功的注入上下文，失败的标注缺失 |

## 验证

不新增验证器。角色子代理不写文件，不改变项目产物结构，现有 `Progress` 验证器不变。

行为正确性通过 chat 观察验证：
- 控制器确实读取 chapter-plan 的关键角色字段
- 角色知识账本过滤准确性
- 角色分析成功注入 Writer 上下文

## 与现有系统的关系

- **novel-research**：charact-card 解析已完成，无需改动。角色子代理直接消费 `charcard-raw/*.md` 和 `characters.md`。
- **novel-drafting**：仅修改上述四个文件。Writer / Reviewer 的核心行为不变。
- **novel-delivery**：无影响。
- **验证器**：无改动。角色子代理不产生需验证的文件。
