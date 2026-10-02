# 个人主页（场景版）

单页静态站点：英文版为默认首页，中文版在 `zh.html`，导航栏右上角可互相切换。
零外部依赖、零构建步骤，可直接托管到 GitHub Pages / 任意静态服务器。

## 目录结构

```
resume/personal-site/
├── index.html              # 唯一页面，所有内容都在这里改
├── assets/
│   ├── css/
│   │   └── style.css       # 全部样式；主题色在 :root，浅色覆盖在 [data-theme="light"]
│   ├── js/
│   │   └── main.js         # 全部交互；轮播文案在顶部 TYPING_PHRASES
│   └── img/
│       ├── avatar.svg              # 头像占位 → 换成你的照片
│       ├── project-placeholder.svg # 作品配图占位 → 换成 project-1.png 等
│       └── favicon.svg             # 浏览器标签图标
└── README.md
```

## 本地预览

```bash
cd resume/personal-site
python -m http.server 8000
# 打开 http://localhost:8000
```

## 内置交互一览

| 交互 | 实现位置 | 说明 |
| --- | --- | --- |
| 极光背景场景 | `.scene` + CSS `@keyframes drift*` | 三个大色块缓慢漂移 + 网格 + 暗角，纯 CSS |
| 鼠标光斑 | `.scene-spot` + `main.js` 第 6 节 | 仅指针设备生效，触屏不触发 |
| 顶部滚动进度条 | `.scroll-progress` | 随页面滚动填充 |
| 导航高亮 / 顶栏毛玻璃 | `main.js` onScroll | 滚动超过 12px 顶栏加底色 |
| 头像双环旋转 | `.avatar-ring` | 两个圆环反向旋转 |
| 打字机轮播 | `main.js` 顶部 `TYPING_PHRASES` | 一句话介绍多句循环打字 |
| 滚动入场 | `.reveal` + `--d` 序号 | 用 `style="--d:2"` 控制同组内错峰顺序 |
| 数字累加 | `[data-count]` | 进入视口后从 0 滚到目标值 |
| 技能条填充 | `.sk-bar > i[data-pct]` | 进入视口后按 data-pct 展开 |
| 时间线进度 | `.timeline::after` 的 `--tl` | 左侧竖线随滚动填充 |
| 卡片跟随高光 | `[data-tilt]` + `--cx/--cy` | 鼠标在卡片上移动时高光跟随 |
| 主题切换 | `#themeToggle` | 默认深色，切换结果记入 localStorage |
| 回到顶部 | `#toTop` | 滚动超过 420px 出现 |

全部交互都尊重 `prefers-reduced-motion: reduce`：系统开启「减少动态效果」时自动降级为静态。

## 已填好的真实信息

| 项目 | 内容 |
| --- | --- |
| 姓名 | 唐欣轶 |
| 邮箱 | 1564737607@qq.com（页首按钮、联系区、页脚三处，均为可点击 `mailto:`） |

## 需要替换的位置

全文搜索 `TODO` 即可定位，两类标记：`TODO(替换)` 必须改，`TODO(可选)` 增强项。

| 位置 | 内容 |
| --- | --- |
| `assets/js/main.js` 顶部 | 打字机轮播的一句话介绍 |
| 关于我 | 头像、`TYPING_PHRASES`、城市与状态、三个统计数字 |
| 技能 | 四条技能名 + `data-pct` 熟练度 + 工具关键词 |
| 经历 | 时间、机构、职位、成果 |
| 作品 | 名称、说明、技术标签、配图、链接 |
| 联系我 | 社交账号链接（没有就删整条 a 标签） |
| 页脚 | 简历 PDF 下载（可选） |

## 改主题

```css
/* assets/css/style.css 顶部 :root */
--primary: #00c2a8;   /* 主色：按钮、链接、进度条 */
--accent:  #7c5cff;   /* 辅助色：渐变另一端 */
--bg:      #05070f;   /* 深色底 */
```
浅色模式改 `[data-theme="light"]` 里那一组；默认主题改 `<html data-theme="...">`。

## 两个语言版本

| 文件 | 语言 | 说明 |
| --- | --- | --- |
| `index.html` | English | 默认首页，`<html lang="en">` |
| `zh.html` | 中文 | `<html lang="zh-CN">`，导航右上角 EN / 中文 互跳 |

两者共用 `assets/`，打字机轮播文案写在各自页面底部的 `window.PHRASES` 里，改文案不用动 `main.js`。

## 部署到 GitHub 用户站

仓库名固定为 `yxcwl.github.io`，站点地址 `https://yxcwl.github.io`（英文版）与 `https://yxcwl.github.io/zh.html`（中文版）。

```bash
# 在 Git Bash 中执行；Token 需要 repo 权限
GITHUB_TOKEN=ghp_xxxxxxxxxxxx ./deploy.sh
```

脚本依次完成：创建仓库 → 推送 `main` → 开启 Pages（`main` + `/`）→ 查询构建状态。
本体全部是相对路径，用户站直接可用，无需任何 base 配置。

## 扩展建议

- **加区块**：复制 `<section class="section" id="xxx">`，在 `.nav-menu` 里补一条 `<li><a href="#xxx">`。
- **加作品**：复制 `.project-card`，配图放 `assets/img/` 后用相对路径引用。
- **给元素加入场动画**：加 class `reveal`，再用 `style="--d:1"` 排顺序。
- **部署**：见工作区 `GitHub-Pages-建站流程清单.md`；本项目全部为相对路径，用户站 / 项目站都可直接用（项目站无需改 base，因为没有前端路由）。
