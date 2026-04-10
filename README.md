# TRIE - AI Mood T-shirt

TRIE 是一个 AI 驱动的潮流 T 恤设计体验。支持从“话题/灵感 → 印花 → 平铺白底 T 恤前后视图 → 生产单 PDF”的完整链路。

线上地址：[https://www.tire-design.top/](https://www.tire-design.top/)

## 核心功能

- **AI 印花生成**：后端调用 Gemini 生成 1:1 印花设计
- **平铺白底 T 恤 Mockup（无模特）**：同时生成前视图与后视图（同一件衣服风格）
- **生产单 PDF**：后端使用 Puppeteer + Chromium 渲染 Garment/Print Order
- **SSE 内部接口**：面向 OpenClaw/内部脚本，流式返回进度与资产

## 最新更新（2026-04）

- Mockup 改为“无模特平铺白底 T 恤”
- 新增 `mockup_back`（后视图）并用于 `Print_Order` 后视图展示
- PDF 渲染改为 Puppeteer 模板渲染，版式对齐 `Checkout.tsx`
- SSE 错误信息增加 `detail`（包含 message/name/stack）
- `Print_Order` 空位图改为“灰色占位卡片 + 默认版型”文案

## 目录结构

- `components/Checkout.tsx`：前端生产单模板（HTML 结构）
- `server.js`：Express 后端 + SSE + Gemini + PDF 渲染
- `INTERNAL_API_README.md`：内部 API 使用说明（SSE）

## 本地运行

```bash
npm install
npm run dev
```

本地启动后端：

```bash
node server.js
```

默认监听 `PORT=8080`，可用 `PORT=8081 node server.js` 自定义端口。

## 环境变量

`.env` 示例：

```
API_KEY="YOUR_GEMINI_API_KEY"
INTERNAL_TOKEN="YOUR_INTERNAL_TOKEN"
HTTP_PROXY=http://127.0.0.1:57890
HTTPS_PROXY=http://127.0.0.1:57890
NO_PROXY=localhost,127.0.0.1
```

说明：
- 代理端口必须是当前可用端口（例如 Clash/VPN 本地端口）
- `INTERNAL_TOKEN` 仅供服务端/OpenClaw 使用，前端不要暴露

## 生产单 PDF 渲染（Puppeteer）

后端使用 `puppeteer-core` + `@sparticuz/chromium` 渲染与前端一致的 HTML 版式。

- 本地需要可用 Chrome（默认路径 `/Applications/Google Chrome.app/Contents/MacOS/Google Chrome`）
- Vercel 运行时使用 `@sparticuz/chromium` 自动提供可执行文件

## OpenClaw 调用方法（推荐）

OpenClaw 通过后端内部 SSE API 调用：

- 方法：`POST /api/internal/stream`
- Header：`x-internal-token: <INTERNAL_TOKEN>`
- Body：`input + options`

请求示例：

```json
{
  "input": {
    "type": "topic",
    "topic_text": "Neon Pink / Electric Blue / Soft Pastel"
  },
  "options": {
    "light_mode": true,
    "generate_pdf": true
  }
}
```

关键返回字段：

- `result.images.mockup`：前视图平铺 T 恤图
- `result.images.mockup_back`：后视图平铺 T 恤图
- `result.images.print_asset`：印花资产（light mode 下通常复用 mockup）
- `result.pdfs.garment_order`：Garment_Order.pdf（data URI）
- `result.pdfs.print_order`：Print_Order.pdf（data URI）

SSE 关键步骤（成功链路）：

- `start -> analyze -> render -> render -> mockup_ready -> pdf -> completed`

## 模型与可用性说明

- 当前 `server.js` 默认生图模型是 `gemini-3-pro-image-preview`
- 实测 `gemini-2.5-flash-image` 也可调用（需按需切换代码）
- 若出现 `429 RESOURCE_EXHAUSTED`，是 Gemini 配额问题，不是接口逻辑故障
- 若出现 `fetch failed / ECONNREFUSED 127.0.0.1:<port>`，是本地代理未监听或端口错误

## 内部 API 详细文档

详见：`INTERNAL_API_README.md`
