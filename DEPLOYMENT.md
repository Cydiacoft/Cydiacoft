# Vernal / Digital Journal

Node.js 22 · zero npm dependencies · GitHub Profile README.

## 本地运行

使用 Node.js 22，执行 `npm test` 和 `npm run generate`。无需 npm install。
生成时需要进程环境变量 GITHUB_TOKEN；不要把令牌写入文件或提交。
本机已校验的便携 Node 位于 work/node-v22.23.3-win-x64/node.exe。
PowerShell 可在进程内从已登录的 gh 读取令牌，运行后立即清除：

```powershell
$env:TEMP = "$PWD\work"
$env:TMP = $env:TEMP
$env:npm_config_cache = "$PWD\work\npm-cache"
$env:GITHUB_TOKEN = gh auth token
try { & .\work\node-v22.23.3-win-x64\node.exe src/generate.mjs }
finally { Remove-Item Env:GITHUB_TOKEN }
```

## 配置与视觉

profile.config.json 配置用户名、标题、副标题、签名、探索方向及精选仓库。
项目仓库名已通过已登录 GitHub 账号核实：Cydiacoft/Videoder、Cydiacoft/teaWords。
探索方向与签名是本项目的编辑文案，可随时修改，不来自私人使用记录。
840×400 Hero：48px 内边距、Georgia 标题、系统无衬线正文、蓝色 1.6px 折线。
浅色 #fbfcfe / #2c65b3；深色 #0d1117 / #79afff。
两套 SVG 用 picture 媒体查询切换。一次性 2.4 秒描线，reduced-motion 关闭动画。
SVG 有 title/desc；README 保留项目文本链接，图片加载失败仍可访问项目。
窄屏按比例缩放；正文保持原生 Markdown。

## 数据口径与隐私

仅从 GitHub GraphQL 获取用户过去 30 个 UTC 自然日（含今日，今日未结束）的
公开提交、Issue、PR、Review 和仓库创建贡献；只累加 repository.isPrivate 严格为 false 的条目。
提交使用 commitCount，其他事件每项计 1。匿名 restricted contributions 不查询、不发布。
因此曲线可能与包含私人贡献的 GitHub 日历不同；不会虚构或补造活动。
只保存最终 SVG 和 README，不保存原始 API 响应、私有仓库名或令牌。
精选项目 REST 查询不携带令牌，拒绝非公开仓库。
没有读取音乐、浏览记录、Cookie、应用使用时间、位置或任何设备私人使用数据。

GraphQL 每类最多 100 个仓库、每仓库最多 100 条贡献，遇到边界或未完分页立即失败，
保留上次结果，不会静默截断。需覆盖极高活动量时可扩展分页逻辑。
网络超时 20 秒，瞬态网络错误及 HTTP 429/5xx 最多尝试 3 次。
全部数据取回并渲染成功后再暂存输出；写入失败尽力回滚旧文件。
进程被强制终止不保证跨文件原子性；GitHub Actions 仅在全部生成成功后提交三个输出文件。
README 只更新 vernal 标记包围的区块；首次遇到已有正文会追加，标记异常则停止。

## 发布与自动更新

Profile 仓库必须公开、名称等于用户名：Cydiacoft/Cydiacoft；README 位于默认 main 分支根目录。
本地已确认账号与空目录，发布前再次检查远端，若同名仓库新出现则先读取并合并，禁止强推。
推送前检查暂存清单，只包含本项目源文件、文档、测试、工作流和生成图片；work 完全排除。

工作流每天 02:23 UTC（香港 10:23）刷新，也支持手动触发。
PR 仅测试，不拥有写权限；更新任务只请求 contents:write。
使用仓库自动提供的 GITHUB_TOKEN，不需要长期 PAT 或额外 Secret。
Actions 已固定已核实的提交 SHA；Node 版本固定主版本 22。
API 失败使工作流失败，旧图与旧日期保留，不提交空图或假数据。
推送非快进会失败而不是覆盖远端修改；下次运行重新取最新内容。
若分支保护禁止机器人直接提交，请改用 PR 流程；不要关闭已有保护。
GitHub 定时任务可能延迟，长期不活跃的公开仓库可能需重新启用 schedule。

## 验证

`npm test` 使用 Node 原生测试框架，覆盖隐私过滤、时间窗口、完整性拒绝、
错误处理、转义、README 保护、无障碍链接、主题和失败保留旧文件。
本地浏览器预览保存在 work，既不发布也不增加项目依赖。

参考：[GitHub GraphQL Users](https://docs.github.com/en/graphql/reference/users)
· [Profile README](https://docs.github.com/en/account-and-profile/how-tos/profile-customization/managing-your-profile-readme)
