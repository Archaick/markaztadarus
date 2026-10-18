import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Only loaded by the document stamping tool, so the dev server would
  // otherwise discover them late and stall; bundle them up front.
  optimizeDeps: { include: ['docx-preview', 'html-to-image'] },
  define: {
    // Changes with every build; src/i18n.js adds it to translation URLs so a
    // deploy never shows text from a translation file the browser kept.
    'import.meta.env.VITE_BUILD_ID': JSON.stringify(Date.now().toString(36)),
  },
})
