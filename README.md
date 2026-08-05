# ✦ 个人网站 · 宇宙科技风

一个以 **宇宙 / 深空** 为题材的炫酷个人作品集网站，用于展示个人能力与可承接的项目。

- **技术栈**：纯静态 `HTML + CSS + JavaScript + Three.js`（零构建、零后端依赖）
- **核心效果**：Three.js 星空 / 星云 / 流星 / 中心旋转行星 / 鼠标视差、玻璃拟态卡片、霓虹辉光、自定义光标、打字机、滚动显现、3D 卡片倾斜、技能条与数字动画

---

## 📁 项目结构

```
个人简介/
├── index.html          # 单页结构（首页/关于/技能/服务/项目/合作流程）
├── css/
│   └── style.css       # 全部样式（深空主题 + 响应式）
├── js/
│   ├── background.js   # Three.js 宇宙背景（ES Module）
│   └── main.js         # 交互逻辑（光标/导航/动画/统计等）
└── README.md
```

---

## 🚀 本地预览

需要网络加载 Three.js（CDN）与 Google Fonts。任选一种方式启动本地静态服务器：

```bash
# 方式一：VS Code 插件 Live Server（推荐，右键 index.html → Open with Live Server）
# 方式二：Python
python -m http.server 8080
# 方式三：Node.js
npx serve .
```

然后访问 `http://localhost:8080`。

> 注意：`background.js` 是 ES Module，直接双击 `index.html`（file://）打开可能因 CORS 受限，请务必用本地服务器方式打开。

---

## ✏️ 个性化配置（上线前必改）

把下面这些**占位符**替换成你自己的真实信息：

| 位置 | 占位符 | 改成 |
| --- | --- | --- |
| 全站 | `你的名字` / `YOUR NAME` | 你的真实姓名 / 品牌名 |
| `index.html` `<title>` 与 `meta description` | 你的名字 · 品牌策划 / 新媒体运营 / 平面设计... | 你的标题与简介 |
| 首屏 `#heroName` | `你的名字` | 你的名字 |
| 关于区块 `#about` | 「你的名字」及介绍文字 | 你的真实经历 |
| 技能进度 `data-level` | 92 / 88 / 80... | 按实际情况调整 |
| 服务卡片 | 服务描述与列表 | 你真正能提供的服务 |
| 项目卡片 | 示例项目 | 你的真实作品（可替换 `pv-1~4` 占位图） |

> 说明：当前为**纯作品展示页**，已按需求移除「联系」板块（导航、按钮、表单、社交图标）。如需重新开放联系：仿照 `index.html` 中其他 `<section>` 的写法在页尾新增联系板块，并在 `main.js` 中补充表单提交逻辑即可。

---

## 🌐 部署上线

### GitHub Pages（免费）
1. 在 GitHub 新建仓库并上传本项目全部文件；
2. 仓库 → **Settings → Pages** → Source 选择 `Deploy from a branch` → 分支 `main` / 根目录；
3. 保存后等待 1~2 分钟，访问 `https://<你的用户名>.github.io/<仓库名>/`。

### Vercel / Netlify（免费，全球加速）
- **Vercel**：`vercel` 命令行或导入 Git 仓库，框架预设选 `Other`，构建命令留空，输出目录为根目录。
- **Netlify**：拖拽整个文件夹到 Netlify 后台即可自动部署。

### 自定义域名
在对应平台配置 `CNAME` / 域名解析即可。

---

## 🛠 二次开发建议

- **想换主色**：修改 `style.css` 顶部的 `:root` 变量（`--cyan`、`--violet`、`--magenta` 等）。
- **调整星空密度/速度**：修改 `js/background.js` 中的 `starCount`、旋转速度系数等。
- **新增区块**：在 `index.html` 中仿照已有 `<section>` 复制，并同步更新导航链接。
- **移动端**：页面已内置响应式，断点 1024 / 860 / 640px，手机端自动收起导航为汉堡菜单、关闭自定义光标。

---

## ✨ 功能清单

- [x] Three.js 动态宇宙背景（星海 / 星云 / 流星 / 行星 / 鼠标视差）
- [x] 加载动画 + 自定义霓虹光标
- [x] 打字机式职业轮播
- [x] 滚动显现动画（IntersectionObserver）
- [x] 卡片 3D 倾斜跟随鼠标
- [x] 技能条 / 统计数字滚动动画
- [x] 服务卡片（可承接项目）+ 合作流程
- [x] 深空主题响应式布局 + 减少动效偏好支持

---

MIT License · 用代码在宇宙中闪烁 ✦
