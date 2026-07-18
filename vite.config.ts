import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { resolve } from 'path';

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
  build: {
    lib: {
      entry: {
        'localwatermark-main': resolve(__dirname, 'src/main.ts'),
        'localwatermark-files': resolve(__dirname, 'src/files.ts')
      },
      formats: ['umd'],
      name: 'LocalWatermark',
    },
    outDir: 'js',
    emptyOutDir: false,
    rollupOptions: {
      external: ['vue'],
      output: {
        globals: {
          vue: 'Vue',
        },
        entryFileNames: '[name].js',
        assetFileNames: (assetInfo) => {
          if (assetInfo.name === 'style.css') return 'css/style.css';
          return '[name].[ext]';
        },
      },
    },
  },
});
