import { defineConfig, minimal2023Preset } from '@vite-pwa/assets-generator/config';

// Generates PNG/ICO icons from public/icon.svg (run: npm run generate-pwa-assets)
export default defineConfig({
  preset: {
    ...minimal2023Preset,
    maskable: {
      ...minimal2023Preset.maskable,
      resizeOptions: { background: '#0A1628', fit: 'contain' },
    },
    apple: {
      ...minimal2023Preset.apple,
      resizeOptions: { background: '#0A1628', fit: 'contain' },
    },
  },
  images: ['public/icon.svg'],
});
