# Canvas Web Nav | 无限画布形态网站导航工具

现代化、高流畅度的**无限画布形态网站导航工具**，结合桌面级交互体验（无限平移与缩放、边缘/居中/网格对齐辅助线自动吸附、框选与多选成组拖动、链接跨块拖拽排序）与云端持久化能力（Supabase 用户维度隔离、实时同步、离线重试），**支持一键静态部署于 GitHub Pages**。

---

## 🌟 核心特性

1. **无限画布 (Infinite Canvas)**
   - **平移与缩放**：支持按住空格键/鼠标中键拖动画布、触控板平移；鼠标滚轮以指针为中心平滑缩放（15% ~ 300%），支持重置视角。
   - **自适应点阵网格**：随平移和缩放无缝延展的 Dot Grid 现代桌面质感背景。
   - **智能对齐与自动吸附**：
     - **边缘对齐**：左左、右右、左右、右左、顶顶、底底、顶底、底顶边缘贴合吸附。
     - **中心对齐**：水平中心线、垂直中心线对齐。
     - **网格对齐**：步长 20px 网格规整对齐，支持工具栏/菜单一键切换开关。
     - **发光辅助线**：吸附瞬间在画布渲染高亮对齐线，松手即隐。

2. **文件夹块管理 (Folder Blocks)**
   - **快捷新建**：画布任意空白处右键唤出菜单，直接在右键点击处创建文件夹。
   - **内联编辑与配色**：双击文件夹标题即可内联修改，提供 7 种配色标识。
   - **框选多选与临时成组 (Marquee & Group Drag)**：
     - 空白处拉出半透明矩形选框，批量选中多个块；
     - 支持按住 `Shift` 增量多选/反选；
     - 多个块成组后拖动任意一个块，所有块按相同位移协同移动；
     - 单击空白画布或按下 `Esc` 键，临时组即刻解散。

3. **智能链接管理 (Link Items)**
   - **自动抓取元数据**：添加网址时，通过 Supabase Edge Function 自动抓取站点标题与 Favicon 图标。
   - **首字母图标兜底**：抓取失败或图片失效时，根据标题哈希自动生成多彩渐变首字母卡片。
   - **手动微调**：悬浮点击编辑按钮可自定义标题与图标 URL。

4. **高自由度拖拽交互 (Drag & Drop)**
   - 基于 `@dnd-kit`，支持同文件夹内自由拖拽排序。
   - 支持跨文件夹拖拽移动，具备实时占位预览与目标块高亮光环，松手即时批量持久化。

5. **云端持久化与离线韧性 (Persistence & Resilience)**
   - **Supabase 存储**：按用户维度严格 RLS 数据隔离。
   - **乐观更新**：所有交互本地优先响应（60fps 丝滑体感），后台异步队列持久化。
   - **实时同步 (Realtime)**：监听 `postgres_changes`，多设备与多标签页毫秒级同步。
   - **离线重试队列**：断网状态自动转为本地安全缓存，网络恢复后指数退避自动重试，状态栏实时指示。
   - **免门槛体验**：支持访客模式（无需注册即刻体验）与邮箱注册/登录无缝切换。

6. **GitHub Pages 静态部署**
   - 采用相对路径打包（`base: './'`），兼容根域名与仓库子路径。
   - 配套 `.github/workflows/deploy.yml` 自动化 CI/CD 流水线。

---

## 🛠️ 技术栈

- **前端框架**：React 19 + TypeScript + Vite 8
- **样式方案**：Tailwind CSS (暗黑极简磨砂质感)
- **拖拽引擎**：`@dnd-kit/core` + `@dnd-kit/sortable`
- **状态管理**：Zustand
- **图标系统**：Lucide React
- **后端持久化**：Supabase (PostgreSQL + RLS + Realtime + Edge Functions)

---

## 🚀 本地开发与启动

```bash
# 1. 安装依赖
npm install

# 2. 启动开发服务器
npm run dev

# 3. 生产打包 (验证 GitHub Pages 静态构建)
npm run build

# 4. 本地预览打包产物
npm run preview
```

---

## 🌐 部署至 GitHub Pages

本项目内置了 GitHub Actions 自动部署流水线：

1. 将代码推送到 GitHub 仓库的 `main` 分支：
   ```bash
   git add .
   git commit -m "feat: initial canvas web nav"
   git branch -M main
   git remote add origin <你的GitHub仓库地址>
   git push -u origin main
   ```
2. 进入 GitHub 仓库设置：**Settings** -> **Pages** -> **Build and deployment** -> **Source** 选择 **GitHub Actions**。
3. 流水线执行完毕后，即可在 `https://<用户名>.github.io/<仓库名>/` 访问在线应用！
