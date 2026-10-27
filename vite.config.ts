import { defineConfig } from 'vite';
export default defineConfig({
  base: '/gabi-os/',
  build: { rollupOptions: { output: { manualChunks: { phaser: ['phaser'] } } }, chunkSizeWarningLimit: 1600 },
  server: { port: 5173, strictPort: true, proxy: {
    '/__desktop': {target:'http://127.0.0.1:8787',changeOrigin:true,rewrite:path=>path.replace(/^\/__desktop/,'')},
  } },
});
