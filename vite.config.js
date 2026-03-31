/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const dirname = typeof __dirname !== 'undefined' ? __dirname : path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    open: true,
    // Permite que o HMR (hot-reload) funcione no Safari e em redes locais.
    // O Safari bloqueia WebSocket para 'localhost' em algumas versões —
    // usar '127.0.0.1' resolve o problema.
    hmr: {
      host: '127.0.0.1',
      protocol: 'ws'
    },
    // Garante que o servidor não tente outra porta se 5173 estiver ocupada,
    // evitando confusão entre porta do HTTP e do WebSocket.
    strictPort: true
  }
});