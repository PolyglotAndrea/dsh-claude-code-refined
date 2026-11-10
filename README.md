# Claude Code Refined · 0.3.0

为已经安装 **dsh-claude-style 0.19.7** 的 DeepSeek Harness 制作的独立界面增强插件，按照 Claude Code 桌面端的视觉方向精修现有主题。基础主题继续提供会话、模型选择、权限、附件及工具记录等功能。

这是非官方主题，不包含 Claude 模型、Claude Code 运行时或 Anthropic 私有字体。它改变界面呈现，不改变模型的回答能力或执行策略。

## 这版改变了什么

- **轻量的思考与执行记录**：移除旧版大边框和逐行分隔，改为细线分组；完成摘要使用紧凑折叠入口，思考正文使用次级字号，保留展开、运行中及错误提示。
- **人工交互卡片**：问题选项使用独立行和清晰的选中状态，说明文字单独成行，页码和提交按钮位于底部；权限批准突出待确认事项和命令详情，计划确认沿用同一套视觉层级。
- **保留原生决策行为**：问题推荐、翻页、多选、提交、拒绝、一次性允许、持久允许（宿主提供时）、倒计时和错误恢复均由宿主管理。增强层不新增默认批准，也不改写工具调用或回答内容。
- **固定的品牌和搜索入口**：Claude 标识和搜索分两行显示，悬停不再切换或重叠，搜索仍支持点击和 ⌘K。
- **紧凑的账户菜单**：去除基础主题注入的重复用户名与空白区域，保留设置、反馈、退出及键盘操作。
- **统一设置窗口**：暖灰导航、清晰的选中状态、无衬线标题和一致的选项控件，同时适配普通设置和 Claude Style 设置页。
- **完整对话样式**：统一用户气泡、正文层级、代码块、引用、表格和工具过程的间距、边框与配色。
- **专注的开始页**：将旧版默认 Studio 首页改为居中的问候语、工作区选择和任务输入区，隐藏首页统计看板与装饰宠物。
- **暖色层次**：米白画布 `#faf9f5`、暖灰侧栏 `#f0eee6`、白色输入卡片；深色为暖炭灰 `#262624`，强调色使用陶土橙。
- **完整的输入卡片**：移除内外双重边框，首页提供多行输入空间；模型、权限和附件仍使用原有控件，发送按钮位于底部右侧。
- **清楚的阅读层级**：问候语用衬线字体，界面与对话正文用无衬线字体，代码使用等宽字体；继续读取宿主字号设置。
- **任务记录样式**：工具过程使用细线分组、紧凑行距和无衬线标题，路径与代码保留等宽字体；错误、审批及运行状态仍由原组件显示。
- **可撤回的增强层**：全部 CSS 只在两个插件同时启用时生效，卸载清除本插件的样式和属性。没有全页面轮询或内容替换。

基础主题来源：[Nwflower/dsh-claude-style](https://github.com/Nwflower/dsh-claude-style)。宿主样式约定：[DeepSeek Harness Web UI style reference](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/web-styling.md)。视觉方向参考：[Claude Code Desktop](https://code.claude.com/docs/en/desktop)。这是一版风格适配，不是逐像素复刻。

## 安装

从 [GitHub Releases](https://github.com/PolyglotAndrea/dsh-claude-code-refined/releases/latest) 下载完整 ZIP 安装包或单独的 `.tgz` 插件文件。

1. 解压 `Claude-Code-Refined-0.3.0.zip`。
2. 保留现有 `dsh-claude-style 0.19.7` 并保持启用，双击 **安装.command**。
3. 完成当前任务后，退出并重新打开 DeepSeek Harness。

安装脚本使用 App 自带的 dsh，不要求配置全局命令。默认安装到 `desktop` profile，安装前检查基础主题的版本。也可以在终端执行：

```bash
"/Applications/DeepSeek Harness.app/Contents/Resources/runtime/cli/bin/dsh" \
  plugin --profile desktop add "/绝对路径/dsh-claude-code-refined-0.3.0.tgz"
```

独立 Web 版在已有基础主题的前提下，将 profile 换成 `web`：

```bash
dsh plugin --profile web add /绝对路径/dsh-claude-code-refined-0.3.0.tgz
```

桌面和 Web profile 各自管理插件。无需卸载基础主题；这个包明确依赖它，并在它的客户端模块之后加载。

## 恢复原主题

双击同一目录的 **恢复原主题.command**，然后重新打开 App。或执行：

```bash
"/Applications/DeepSeek Harness.app/Contents/Resources/runtime/cli/bin/dsh" \
  plugin --profile desktop remove dsh-claude-code-refined
```

基础主题的设置、会话、提供商和密钥配置均不由本插件读写。增强层启用期间，本文描述的配色、首页布局、品牌与搜索布局、账户菜单和宠物显示由增强层决定；若要恢复旧版外观设置的显示效果，移除增强层即可。

## 兼容与验证

目标组合为 **DeepSeek Harness 0.2.2-rc.1 + dsh-claude-style 0.19.7**，与本次检查到的桌面内置运行时一致。0.2.0 已验证首页、搜索、设置和生命周期。0.3.0 专项检查宿主实际思考、提问、权限批准和计划确认组件，使用示例数据、模拟回答通道与基础主题样式；验证范围详见 `验证结果.json`。不提交真实聊天或批准，不修改权限设置。

测试结果在发布压缩包的 `验证结果.json`。没有进行真实模型回答、真实权限操作或所有第三方插件组合的回归测试。工具记录规则依据当前宿主和基础主题的 DOM 约定编写；后续版本修改 DOM 时需重新验证。

## 源码

```text
src/client.js       客户端装载、热更新和清理
src/refined.css     配色、布局与组件样式
src/sidebar.css     品牌、搜索和账户菜单
src/settings.css    设置窗口、导航和控件
src/conversation.css 对话正文、气泡、代码和工具记录
src/process.css     思考过程、执行记录和折叠摘要
src/interaction.css 提问、批准、计划确认与回答记录
src/host.js         无业务副作用的宿主入口
scripts/build.mjs   构建 Harness 客户端模块
tests/browser.mjs   实际浏览器与生命周期检查
tests/desktop-surfaces.mjs 桌面交互回归检查（本地 CDP 9231）
cordis.patch.yml    profile 插件注册
```

```bash
npm ci
npm run build
npm pack --pack-destination dist
```

生成带 macOS 安装与恢复脚本的完整发布包（需要 Python 3）：

```bash
python3 scripts/package-release.py
```

产物位于 `dist/Claude-Code-Refined-0.3.0.zip`。脚本会重新构建插件、核对包内容、生成 SHA-256 校验值，并附上该版本已记录的验证报告；打包本身不会运行界面回归检查。

开发验证：在 `.debug/harness/profiles/web/` 建立隔离 profile，依次启用 `@deepseek-ai/dsh-base`、`@deepseek-ai/dsh-web-app`、基础主题和本插件，并将两者链接到该 profile 的 `node_modules`。添加一个指向本地不可用端口的 `visual-test` 模型供模型菜单检查，测试不发送请求。启动日志保存在本地且不要分享认证 URL：

```bash
DSH_HOME="$PWD/.debug/harness" \
  "/Applications/DeepSeek Harness.app/Contents/Resources/runtime/cli/bin/dsh" \
  web --no-open --port 5188 > .debug/harness.log 2>&1
# 另一个终端
npm test
```

源码和构建产物使用 MIT。基础主题及其字体、角色资源保留各自授权；本包没有复制分发这些资源。
