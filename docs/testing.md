# 测试策略

> 最后更新: 2026-05-09 | 版本: 1.0

## 测试框架

- **运行器**: Node.js 原生测试框架（`node --test`）
- **TS 加载器**: `tsx`（通过 `--import tsx` 标志）
- **断言**: Node 内置 `assert` 模块

## 测试文件位置

- 跨技能测试: `tests/validators.test.js`（仓库根路径，因为测试的是开发环境内的技能组合，而非生产部署形态）
- 技能内部测试: 各技能的 `scripts/` 目录下（待添加）

## 运行测试

```bash
# 全部测试
rtk npm test

# 仅运行可移植性检查
rtk node --import tsx --test tests/validators.test.js --test-name-pattern "skill source files do not depend on repo-root shared script paths"
```

## 类型检查

```bash
rtk npx tsc --noEmit
```

## 测试分类

### 业务行为测试

- 校验各技能验证器对正确/错误输入的表现
- 验证产物文件结构符合契约

### 可移植性测试

- 确认技能源文件不依赖仓库根路径的共享脚本
- 确认技能命令中不含环境特定绝对路径

### 架构边界测试（待添加）

- 导入方向检查：技能不从兄弟技能或仓库根路径 import
- 文件契约完整性：阶段间文件路径和字段名称

## 测试编写约定

- 测试即规范——Agent 通过阅读测试来理解预期行为
- 每个真实失败案例写一条测试
- 错误消息要 Agent 可读：什么错了、为什么重要、如何修复、在哪里找

## Agent 验证工作流

Agent 在关闭任务前必须:

1. 运行 `npm test`，确认全部通过
2. 运行 `npx tsc --noEmit`，确认无类型错误
3. 新脚本必须通过可移植性检查
