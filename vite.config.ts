/// <reference types="vitest/config" />
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { dataFilePlugin } from './server/dataFile';

export default defineConfig({
  plugins: [react(), dataFilePlugin()],
  server: { port: 5173, open: true },
  preview: { port: 5173 },
  test: {
    environment: 'node',
  },
});
