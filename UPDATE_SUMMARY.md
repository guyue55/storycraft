# StoryCraft 更新总结 - 2025-12-05

## 完成的任务

### 1. 代码更新
- ✅ 从 GitHub 拉取最新代码 (commit: 76afde1)
- ✅ 更新了 service-account.json 文件

### 2. 添加 Gemini 3 Pro 模型支持

#### 修改的文件：

**app/components/create/create-tab.tsx**
- 添加了两个新的模型选项：
  - "Scenario with Gemini 3 Pro (Global)" (无思考模式)
  - "Scenario with Gemini 3 Pro 💡 (Global)" (带思考模式)
- 模型名称: `gemini-3-pro-preview`

**lib/gemini.ts**
- 更新 `generateContent()` 函数：
  - 自动检测 Gemini 3 模型（以 'gemini-3-' 开头）
  - 对 Gemini 3 模型使用 'global' endpoint
  - 其他模型继续使用环境变量中的 LOCATION
  
- 更新 `generateImage()` 函数：
  - 将图像生成模型从 'gemini-2.5-flash-image' 更新为 'gemini-3-pro-image-preview'
  - 使用 global endpoint

### 3. 技术细节

**Global Endpoint 逻辑：**
```typescript
const location = model.startsWith('gemini-3-') ? 'global' : process.env.LOCATION;
```

**新增模型配置：**
- 模型名称: gemini-3-pro-preview
- Endpoint: global
- 支持思考模式 (thinkingBudget: -1)

**图像生成模型：**
- 模型名称: gemini-3-pro-image-preview
- Endpoint: global

## 备份文件
- app/components/create/create-tab.tsx.backup
- lib/gemini.ts.backup

## 下一步
需要重启应用以使更改生效。
