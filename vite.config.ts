
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  // 可通过 VITE_API_PROXY_TARGET 覆盖，避免前后端端口不一致导致 500
  const apiProxyTarget = env.VITE_API_PROXY_TARGET || 'http://localhost:8081';

  return {
    plugins: [react()],
    define: {
      'process.env': {
        API_KEY: process.env.API_KEY
      }
    },
    server: {
      proxy: {
        '^/api': {
          target: apiProxyTarget,
          changeOrigin: true,
          secure: false,
        },
      },
    },
    build: {
      outDir: 'dist',
      emptyOutDir: true
    }
  };
});
