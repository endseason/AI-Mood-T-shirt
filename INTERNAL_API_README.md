# 内部 API 使用手册（SSE）

本接口仅供后端或 OpenClaw 等可信调用方使用，**前端不可直接访问**。

## 基础地址

线上地址：[https://www.tire-design.top/](https://www.tire-design.top/)

## 接口说明

### 1. 生成接口（SSE 流式）

**URL**

`POST /api/internal/stream`

**鉴权 Header**

`x-internal-token: <INTERNAL_TOKEN>`

**Content-Type**

`application/json`

**请求体**

```json
{
  "input": {
    "type": "topic",
    "topic_text": "我真的会谢"
  },
  "options": {
    "light_mode": true,
    "generate_pdf": true,
    "generate_print": false,
    "custom_prompt": ""
  }
}
```

#### input 字段

1. `type: "topic"`
- `topic_text`: 热梗/话题文案（字符串）

2. `type: "image"`
- `image_base64`: 参考图（Data URI base64）

#### options 字段

- `light_mode`（布尔值）
  - `true`：跳过印花资产提取，**先返回 mockup**，再生成 PDF（更快）
  - `false`：完整链路（更慢）
- `generate_pdf`（布尔值，默认 `true`）
  - `false` 则不生成生产单 PDF
- `generate_print`（布尔值，默认 `true` 但在 light_mode 下会被跳过）
  - `false` 则不生成印花资产
- `custom_prompt`（字符串，可选）
  - 追加到印花草图的提示词

## SSE 事件流格式

接口返回 SSE 流，一行一条事件：

```
data: {"step":"start","message":"收到指令，初始化中..."}

data: {"step":"analyze","message":"生成风格结构中（本地）..."}

data: {"step":"render","message":"生成印花图（轻量）..."}

data: {"step":"render","message":"生成模特效果图（图生图/轻量）..."}

data: {"step":"mockup_ready","result":{"images":{"mockup":"data:image/png;base64,..."}}}

data: {"step":"pdf","message":"生成生产单 PDF..."}

data: {"step":"completed","result":{"images":{"mockup":"...","print_asset":"..."},"pdfs":{"garment_order":"...","print_order":"..."}}}
```

### 关键说明

- `mockup_ready`：**mockup 先返回**（适合快速预览）
  - `images.mockup`：正面平铺白底 T 恤
  - `images.mockup_back`：背面平铺白底 T 恤（同一件衣服风格一致）
- `completed`：最终结果，包含
  - `images.mockup`
  - `images.mockup_back`
  - `images.print_asset`（light mode 下可能复用 mockup）
  - `pdfs.garment_order`
  - `pdfs.print_order`
- SSE 心跳：服务端会定期发送 `: ping`（注释行），客户端应忽略

## 示例（curl）

```bash
curl -N -X POST https://www.tire-design.top/api/internal/stream \
  -H "Content-Type: application/json" \
  -H "x-internal-token: YOUR_INTERNAL_TOKEN" \
  -d '{
    "input": {
      "type": "topic",
      "topic_text": "我真的会谢"
    },
    "options": {
      "light_mode": true,
      "generate_pdf": true
    }
  }'
```

## 输出字段

- **Mockup 图片**：`result.images.mockup`
- **Mockup 背面**：`result.images.mockup_back`
- **印花资产**：`result.images.print_asset`
- **Garment_Order PDF**：`result.pdfs.garment_order`
- **Print_Order PDF**：`result.pdfs.print_order`

全部返回值均为 Data URI，可直接保存为文件。

## 推荐配置（快速演示）

适合演示和减少超时：

```json
{
  "input": {
    "type": "topic",
    "topic_text": "我真的会谢"
  },
  "options": {
    "light_mode": true,
    "generate_pdf": true
  }
}
```

说明：
- 先返回 `mockup_ready`，可快速展示
- PDF 仍会生成，但使用 mockup 作为生产图

## 常见问题 / 故障排查

1. **返回 `Unknown error`**
- 说明服务端内部异常，可能是 PDF 字体编码或模型响应异常
- 建议先重试一次；若持续出现，请查看服务端日志

2. **前端/客户端超时**
- SSE 需要保持长连接，客户端不要提前超时断开
- 若使用 Vercel 免费额度，请避免并发过高

3. **返回数据过大**
- Data URI 体积大，客户端应使用流式处理，不要一次性加载到内存

4. **鉴权失败**
- 检查 `x-internal-token` 与服务端 `INTERNAL_TOKEN` 是否一致
- 浏览器端不要暴露 token

## 生成规则说明

- Mockup 为 **平铺白底 T 恤（无模特）**
- 同时生成 **正面与背面**，保持为同一件衣服
- 风格关键词只影响 **图案/色彩风格**，不生成文字

## 安全约束

- 本接口为内部接口，**严禁前端直接调用**
- 仅允许可信服务/脚本在服务端环境调用

## OpenClaw 流式解析示例（伪代码）

以下示例演示如何逐行读取 SSE，并在收到 `mockup_ready` / `completed` 时处理结果：

```pseudo
function callInternalStream(input, options):
  resp = http.post(
    url = "https://www.tire-design.top/api/internal/stream",
    headers = {
      "Content-Type": "application/json",
      "x-internal-token": INTERNAL_TOKEN
    },
    body = { input, options },
    stream = true
  )

  for each line in resp.stream_lines():
    if not line.startsWith("data:"):
      continue
    payload = json.parse(line.replace("data:", "").trim())

    if payload.step == "mockup_ready":
      mockup = payload.result.images.mockup
      saveDataUriToFile(mockup, "mockup.png")
      print("Mockup ready")

    if payload.step == "completed":
      images = payload.result.images
      pdfs = payload.result.pdfs

      saveDataUriToFile(images.mockup, "mockup.png")
      saveDataUriToFile(images.print_asset, "print_asset.png")
      saveDataUriToFile(pdfs.garment_order, "Garment_Order.pdf")
      saveDataUriToFile(pdfs.print_order, "Print_Order.pdf")
      print("All assets ready")
      break
```

Data URI 保存示例（伪代码）：

```pseudo
function saveDataUriToFile(dataUri, filename):
  # "data:image/png;base64,AAA..."
  base64 = dataUri.split(",")[1]
  bytes = base64_decode(base64)
  write_file(filename, bytes)
```
