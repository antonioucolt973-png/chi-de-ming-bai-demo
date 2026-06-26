# 吃得明白 — AI 饮食记录助手

面向老人和慢性病家庭的 AI 饮食记录工具。拍一张餐食照片、或说一句话，AI 自动识别食物、估算份量、计算营养，生成每日饮食图谱和就医报告。

## 技术栈

- **后端**：Python + Flask
- **AI 模型**：小米 MiMo-V2.5（多模态大模型，OpenAI 兼容格式）
- **前端**：原生 HTML/CSS/JS + ECharts 图表
- **数据存储**：浏览器 localStorage（无需数据库）

## 环境要求

- Python 3.8+
- pip
- 现代浏览器（Chrome / Edge / Safari）

## 快速开始

### 1. 安装依赖

```bash
pip install -r requirements.txt
```

### 2. 配置 MiMo API Key

本项目使用小米 MiMo-V2.5 大模型，需配置 API Key。

**获取 API Key：**
1. 前往 https://platform.xiaomimimo.com 注册账号（用小米账号登录）
2. 进入控制台 → API Keys → 创建 API Key（格式：`sk-xxxxx`）

**配置方式（二选一）：**

**方式一：环境变量（推荐，安全）**

Windows PowerShell：
```powershell
$env:MIMO_API_KEY="sk-你的key"
```

Linux / Mac：
```bash
export MIMO_API_KEY="sk-你的key"
```

**方式二：直接写入配置文件（仅本地开发）**

编辑 `mimo_config.py`，取消注释并填入 Key：
```python
MIMO_API_KEY = 'sk-你的key'
```

> 注意：`mimo_config.py` 已在 `.gitignore` 中排除，不会被提交到仓库。

> 安全警告：不要把真实 API Key 写入任何前端文件（index.html、assets/*.js）、README 示例、控制台日志或提交包。

### 3. 启动服务器

```bash
python server.py
```

启动后看到以下输出表示成功：
```
吃得明白 - 后端服务已启动（MiMo-V2.5 版本）
MiMo API 状态: 已配置
模型: mimo-v2.5
访问 http://localhost:8080 体验 Demo
```

### 4. 打开浏览器

访问 http://localhost:8080

手机端使用：手机和电脑连同一 WiFi，用手机浏览器访问 `http://电脑IP:8080`（如 `http://192.168.1.100:8080`）。

### 本地一键启动

首次使用：

1. 复制 `.env.local.example` 为 `.env.local`
2. 打开 `.env.local`，填入自己的 `MIMO_API_KEY`
3. 双击 `start_demo.bat`

也可以用 PowerShell 启动：

```powershell
powershell -ExecutionPolicy Bypass -File .\start_demo.ps1
```

脚本会读取 `.env.local`、启动后端，并自动打开 `http://localhost:8080`。不要把 `.env.local` 上传到比赛附件或截图里。

### 5. 验证 MiMo 是否可用

浏览器访问健康检查接口：

```
http://localhost:8080/api/mimo_health
```

返回示例（成功）：
```json
{
  "configured": true,
  "ok": true,
  "model": "mimo-v2.5",
  "error": null,
  "raw_preview": "OK",
  "latency": "1.2秒"
}
```

返回示例（未配置）：
```json
{
  "configured": false,
  "ok": false,
  "model": "mimo-v2.5",
  "error": "未配置 MIMO_API_KEY",
  "raw_preview": "环境变量 MIMO_API_KEY 未设置，请在启动前设置"
}
```

也可以访问 `/api/mimo_status` 查看配置状态（不发起真实调用，响应更快）。

## 功能说明

| 功能 | 说明 | 依赖 MiMo |
|------|------|-----------|
| 拍照识别食物 | 拍一张饭菜照片，AI 自动识别食物并估算份量 | 是 |
| 语音/文字输入 | 说一句话（如"一碗米饭和鸡蛋"），AI 自动解析 | 是 |
| 营养成分表扫描 | 拍包装袋营养成分表，AI 自动读取营养数据 | 是 |
| 食物营养查询 | 手动添加食物时，AI 查询营养数据（无限食物库） | 是 |
| 今日营养概览 | 热量、蛋白质、脂肪、碳水等 28 种营养素 | 否 |
| AI 营养建议 | 根据今日摄入生成个性化建议 | 是 |
| 趋势分析 | 近 7 天/30 天饮食趋势 + AI 分析 | 是 |
| 报告导出 | 生成 HTML 报告，含营养达标分析和就医话术 | 是 |
| 常用食物快捷记录 | 12 种常用食物一键记录 | 否 |
| 营养目标计算 | 根据年龄/性别/身高/体重自动计算 | 否 |

## API 接口

| 接口 | 方法 | 说明 |
|------|------|------|
| `/api/mimo_status` | GET | 检查 MiMo 是否已配置（不调用 API） |
| `/api/mimo_health` | GET | 健康检查：真实调用 MiMo 验证可用性 |
| `/api/recognize` | POST | 上传图片识别食物 |
| `/api/result/<task_id>` | GET | 获取识别结果（轮询） |
| `/api/scan_label` | POST | 扫描营养成分表 |
| `/api/parse_voice` | POST | 语音/文字解析食物 |
| `/api/search_food` | POST | 搜索食物（本地库 + MiMo AI） |
| `/api/ai_advice` | POST | AI 营养建议 |
| `/api/ai_trend` | POST | AI 趋势分析 |
| `/api/export_report` | POST | 导出饮食报告 |

## MiMo API 调用格式

本项目遵循小米 MiMo 官方文档（https://mimo.mi.com）：

- **请求 URL**：`https://api.xiaomimimo.com/v1/chat/completions`
- **认证头**：`api-key: sk-xxxxx`（不是 `Authorization: Bearer`）
- **token 参数**：`max_completion_tokens`（不是 `max_tokens`）
- **模型名**：`mimo-v2.5`
- **多模态图片**：OpenAI `image_url` 格式，支持 URL 和 Base64

## 比赛部署说明

### 本地运行

**开发模式（带热重载）：**

```powershell
# Windows PowerShell
$env:MIMO_API_KEY="sk-你的key"
python server.py
```

```bash
# Linux / Mac
export MIMO_API_KEY="sk-你的key"
python server.py
```

本地调试时可以开启 Debug 模式（代码热重载）：
```powershell
$env:FLASK_DEBUG="1"
$env:MIMO_API_KEY="sk-你的key"
python server.py
```

**生产模式（waitress WSGI，推荐部署用）：**

```bash
# 安装依赖
pip install -r requirements.txt

# 设置环境变量后启动
$env:MIMO_API_KEY="sk-你的key"  # Windows
export MIMO_API_KEY="sk-你的key" # Linux
python start_prod.py
```

`start_prod.py` 使用 waitress 作为 WSGI 服务器：
- 8 个工作线程，支持并发
- `debug=False`，不暴露调试信息
- Windows/Linux 通用

**Linux 也可用 gunicorn：**

```bash
pip install gunicorn
export MIMO_API_KEY="sk-你的key"
gunicorn -w 4 -b 0.0.0.0:8080 server:app
```

### 公开部署

**方案 A：Render / Railway / Zeabur 部署（推荐，适合 TRAE 比赛初赛 Demo）**

这三个平台都支持常驻 Python 服务，部署步骤基本相同：

**1. 准备 GitHub 仓库**

```bash
# 初始化并推送到 GitHub（确保 mimo_config.py、baidu_config.py、.env.local 不在提交中）
git add -A
git commit -m "参赛部署版本"
git push origin main
```

**2. 在平台创建服务**

| 平台 | 操作 |
|------|------|
| Render | New → Web Service → 连接 GitHub 仓库 |
| Railway | New Project → Deploy from GitHub repo |
| Zeabur | New Project → Deploy from GitHub |

**3. 配置部署参数**

| 参数 | 值 |
|------|------|
| Runtime / Environment | Python 3 |
| Build Command | `pip install -r requirements.txt` |
| Start Command | `python start_prod.py` |
| Environment Variable | `MIMO_API_KEY` = 你的真实 key |
| Environment Variable | `MIMO_TIMEOUT` = `90`（Render 免费实例较慢，建议增大超时） |

> 注意：`start_prod.py` 会自动读取 `PORT` 环境变量（云平台自动注入），绑定 `0.0.0.0`，使用 waitress 8 线程，debug=False。
>
> Render 免费实例性能较低，MiMo 营养成分表 OCR + 结构化可能耗时超过 30 秒。请务必设置 `MIMO_TIMEOUT=90`，否则会超时失败。

**4. 部署后验证**

部署完成后，访问以下地址确认服务正常：

```
https://你的域名/api/mimo_status    → 应返回 configured: true
https://你的域名/api/mimo_health     → 应返回 ok: true
```

**5. 绑定自定义域名（可选）**

按平台给出的 CNAME 或 A 记录，到你的域名 DNS 配置中添加解析。配置完成后平台自动签发 HTTPS 证书。

**方案 B：云服务器 + Nginx 反向代理（适合需要完全控制的场景）**

1. 上传代码到云服务器（不含 `mimo_config.py`、`baidu_config.py`、`.env.local`）
2. 设置环境变量：`export MIMO_API_KEY="sk-你的key"`
3. 启动：`python start_prod.py`（或 `gunicorn -w 4 -b 0.0.0.0:8080 server:app`）
4. 配置 Nginx 反向代理实现 HTTPS

```nginx
server {
    listen 443 ssl;
    server_name your-domain.com;

    ssl_certificate     /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    location / {
        proxy_pass http://127.0.0.1:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

**安全红线：**
- 不要把 key 写进代码或 Zip 包
- 在服务器平台的环境变量中设置 `MIMO_API_KEY`
- 作品帖只放体验链接，不放 key
- 截图和视频中必须打码 `sk-` 开头的密钥
- 公开部署不要开启 Debug 模式（不设置 `FLASK_DEBUG` 环境变量即可）

### 健康检查

部署后，访问以下地址确认 MiMo 是否真的可用：

```
http://你的域名/api/mimo_health
```

确认返回中 `ok: true` 即表示 MiMo 端到端可用。

也可以访问 `/api/mimo_status` 查看配置状态（不发起真实调用，响应更快）。

### 安全措施

本项目已内置以下安全措施：

- API Key 只从环境变量读取，不硬编码在代码中
- `/api/mimo_status` 和 `/api/mimo_health` 不返回 API Key
- 日志中不打印 API Key
- 图片上传限制 4MB
- 每个 IP 每分钟最多 20 次 MiMo API 调用（防刷额度）
- Debug 模式默认关闭

## 常见问题

**Q: 启动后显示"MiMo API 未配置"**
A: 请按上方"配置 MiMo API Key"步骤设置环境变量，然后重启服务器。

**Q: 拍照识别提示"鉴权失败"**
A: API Key 无效或已过期，请前往 https://platform.xiaomimimo.com 重新创建。

**Q: 拍照识别提示"请求超时"**
A: 网络不通或 MiMo 服务响应慢，可尝试增大 `mimo_config.py` 中的 `MIMO_TIMEOUT`。

**Q: 识别返回空内容**
A: MiMo-V2.5 有思考模式，会消耗 token。代码中已设置足够的 `max_completion_tokens`，如仍有问题请检查网络。

**Q: 不配置 MiMo 能用吗**
A: 可以使用常用食物快捷记录、营养目标计算、今日概览等基础功能，但拍照识别、语音解析、AI 建议、报告导出需要 MiMo。

## 注意事项

- 数据存储在浏览器 localStorage 中，清除浏览器数据会丢失记录
- 营养数据为估算值，不替代医生或营养师的专业建议
- `mimo_config.py` 和 `baidu_config.py` 已在 `.gitignore` 中排除

## 参赛 Demo 体验说明

### 体验流程（3 分钟）

1. 打开 Demo 链接，点击"👤 点我设置"填写用户档案（年龄/性别/健康情况）
2. 点击"📷 拍照"上传一张饭菜照片，AI 自动识别食物和营养
3. 点击"🎤 语音"输入"我吃了一碗米饭和番茄炒蛋"，AI 自动解析
4. 查看"今日营养概览"，点击"今日建议"获取 AI 个性化建议
5. 点击"📊 趋势"查看多日饮食趋势分析

### 体验亮点

- **拍照识别**：MiMo-V2.5 多模态识别，支持中餐、食材摆拍、包装食品
- **语音/文字解析**：口语化输入自动拆分食物和份量
- **个性化建议**：根据健康情况（胃病/高血压/糖尿病等）生成针对性建议
- **营养成分表扫描**：拍包装袋自动读取营养数据
- **全离线数据**：无需注册，数据存浏览器本地

### 技术亮点

- 使用小米 MiMo-V2.5 多模态大模型，一个 API 同时完成 OCR + 图像理解 + 营养推理
- API Key 只通过服务器环境变量读取，前端/代码/日志中不出现密钥
- 内置 IP 限流（每分钟 20 次）和图片大小限制（4MB），防止额度被刷
- 跨平台部署：waitress（Windows/Linux）或 gunicorn（Linux）
