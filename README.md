# 免费节点资源聚合 (Proxy Resource Aggregator)

这是一个静态站点生成程序，可以自动抓取多个远程链接上的节点资源（支持base64解码和去重过滤），并生成带有分页、广告位和网站地图的 HTML 页面。

## 部署到 Cloudflare Pages 并实现每天自动更新

要将此程序托管到 Cloudflare Pages 并实现**每天自动抓取最新节点**，请按照以下步骤操作：

### 1. 将代码上传到 GitHub
1. 在 GitHub 上创建一个新的私有或公开仓库（Repository）。
2. 在本地电脑上，将当前文件夹的内容推送到你的 GitHub 仓库中：
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/你的用户名/你的仓库名.git
   git push -u origin main
   ```

### 2. 在 Cloudflare Pages 中部署站点
1. 登录 [Cloudflare 控制台](https://dash.cloudflare.com/)，转到 **Workers & Pages**。
2. 点击 **创建 (Create)** -> **Pages** -> **连接到 Git (Connect to Git)**。
3. 选择你刚才创建的 GitHub 仓库。
4. 在“设置构建和部署”页面，进行以下配置：
   - **框架预设 (Framework preset)**: `None`
   - **构建命令 (Build command)**: `npm run build`
   - **构建输出目录 (Build output directory)**: `dist`
5. 点击 **保存并部署 (Save and Deploy)**。Cloudflare 会自动运行抓取脚本并生成第一版网站。你可以绑定你的自定义域名。

### 3. 配置每天自动更新 (利用 GitHub Actions + Deploy Hook)
为了让网站每天自动去拉取最新的节点资源，我们需要配置一个触发器。本项目已经内置了 GitHub Actions 脚本 (`.github/workflows/daily-trigger.yml`)，只需配置密钥即可。

1. **获取 Cloudflare Deploy Hook：**
   - 在 Cloudflare Pages 的项目页面中，进入 **设置 (Settings)** -> **构建和部署 (Builds & deployments)**。
   - 往下滚动找到 **部署挂钩 (Deploy hooks)**，点击 **添加部署挂钩 (Add deploy hook)**。
   - 名字可以随便填（如 `Daily Update`），分支填写 `main`，然后点击保存。
   - 复制生成的那段 URL 链接。

2. **配置 GitHub Secrets：**
   - 回到你的 GitHub 仓库页面，点击顶部的 **Settings**。
   - 在左侧菜单栏中找到 **Secrets and variables** -> **Actions**。
   - 点击 **New repository secret** 绿色按钮。
   - **Name** 填入: `CF_PAGES_DEPLOY_HOOK`
   - **Secret** 填入: 刚刚从 Cloudflare 复制的那个 URL。
   - 点击 Add secret 保存。

**完成！** 
现在，GitHub 每天早上（北京时间 8:00 左右）会自动访问这个 Hook 链接，通知 Cloudflare Pages 重新运行 `npm run build`。这样你的网站每天都会自动抓取并更新最新的免费节点资源了。
