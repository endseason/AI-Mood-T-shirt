# Checkout 上身图异步生成设计

## 目标
- 进入结算页后自动生成前/后白底 T 恤上身图
- 先显示 2D 合成图，生成完成后替换
- 同步更新 Checkout 预览与生产单（Garment/Print）缩略图

## 数据流
- MockupLab 继续输出 2D 合成图（front/back/side）传入 Checkout
- Checkout 使用 `useEffect` 监听 `previewImages`，并行调用 `/api/mockup`
- 生成完成后写入 `enhancedPreviews`，覆盖前/后视角

## 组件与状态
- `enhancedPreviews`: 2D 预览 + 3D 替换结果
- `effectivePreviews`: 优先使用增强图，作为最终渲染来源

## 错误与降级
- 单侧生成失败时保留 2D 图不变
- 不影响结算流程、生产单导出

## 影响范围
- `components/Checkout.tsx` 增加异步生成逻辑与预览替换
