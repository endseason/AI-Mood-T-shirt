# TRIE - AI Mood T-shirt

TRIE 是一个 AI 驱动的潮流 T 恤设计体验。支持从“话题/灵感 → 印花 → 平铺白底 T 恤前后视图 → 生产单 PDF”的完整链路。

线上地址：[https://www.tire-design.top/](https://www.tire-design.top/)

## 核心功能

- **AI 印花生成**：基于 Gemini 生图生成 1:1 印花设计
- **平铺白底 T 恤 Mockup（无模特）**：生成前/后视图，保持同一件衣服风格一致
- **生产单 PDF**：后端使用 Puppeteer 渲染与前端一致的模板（Garment/Print Order）
- **SSE 内部接口**：面向 OpenClaw/内部脚本，流式返回进度与资产

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
HTTP_PROXY=http://127.0.0.1:8001
HTTPS_PROXY=http://127.0.0.1:8001
```

## 生产单 PDF 渲染（Puppeteer）

后端使用 `puppeteer-core` + `@sparticuz/chromium` 渲染与前端一致的 HTML 版式。

- 本地需要可用 Chrome（默认路径 `/Applications/Google Chrome.app/Contents/MacOS/Google Chrome`）
- Vercel 运行时使用 `@sparticuz/chromium` 自动提供可执行文件

## 内部 API（SSE）

详见：`INTERNAL_API_README.md`

