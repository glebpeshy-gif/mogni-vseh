import { defineConfig } from 'vite';

// base: './' — относительные пути, иначе на Яндекс Играх не найдутся файлы
export default defineConfig({
  base: './',
  build: { assetsInlineLimit: 0, chunkSizeWarningLimit: 2000 },
});
