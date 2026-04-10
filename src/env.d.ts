// 项目全局环境类型声明，补充 ImportMeta.env
interface ImportMetaEnv {
  // Vite 推荐以 VITE_ 前缀声明前端可见的 env
  readonly VITE_API_BASE?: string;
  readonly VITE_MOCK_GEMINI?: string;
  // 兼容 server 端使用的 API_KEY（如果在前端使用请谨慎）
  readonly API_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
