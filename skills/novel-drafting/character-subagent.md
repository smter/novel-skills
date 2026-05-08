# Character Sub-Agent Dispatch Guide

## 用途

本文件指导派发方（控制器或 Writer）如何组装角色子代理的 prompt。
角色子代理收到的应是一个「角色本人」视角的提示，而不是「扮演角色的 AI」的提示。

## Prompt 模板

使用以下占位符模板，填充后直接发给角色子代理：

---

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

---

## 填充规则

- **CHARACTER_CARD**：直接粘贴 `charcard-raw/<角色名>.md` 全文，不删改
- **IN_STORY_MEMORY**：
  1. 从各章 `chapter-XX-state.md` 的 `## Character Knowledge Changes` 表格中，匹配 `| <角色名> |` 开头的行
  2. 补充 story-state 中 confirmed 且该角色在场的全局事实（best-effort 语义推断，不确定则不纳入）
  3. 对第一章（无前文 state），此段留空，角色子代理仅依据角色卡的 scenario 推断初始心理
- **CURRENT_SITUATION**：从 chapter-plan 提取本章 Goal 段落 + story-state 的位置/状态摘要
- **OUTPUT_FORMAT**：固定不变，是施加给角色子代理的唯一元指令

## 派发方禁止行为

- 不要在模板外添加「你是角色扮演 Agent」等身份描述
- 不要混入其他角色的信息
- 不要预先假设角色的反应——让角色子代理从角色卡推导
- 不要将角色子代理的输出写入任何项目文件

## 角色子代理的输出处理

角色子代理返回结构化文本后：
- 控制器预派发：将输出汇总为 `## 角色视角分析` 段落，作为 Writer 上下文的附加部分
- Writer 自救派发：直接参考角色分析继续写作，不写入文件

## 阻塞条件

角色子代理应返回 BLOCKED 当：
- 角色卡文件（charcard-raw/<角色名>.md）缺失
- IN_STORY_MEMORY 为空且角色卡的 scenario 字段不足以推断当前心理状态
- 本章情节简报过于模糊，无法判断角色处境

## 对角色子代理的预期行为（供派发方理解）

角色子代理从角色卡中接收到该角色的完整人格定义（personality、scenario、first_mes、mes_example 等），应：
- 完全代入角色视角，以角色的语气和思维模式进行分析
- 仅依据 IN_STORY_MEMORY 中的信息做判断，不调用未接触的全局事实
- 角色分析中的「内心独白片段」应以角色口吻书写，可直接用于章节正文
