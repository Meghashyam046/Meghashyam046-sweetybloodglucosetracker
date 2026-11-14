import path from 'path';
import express from 'express';
import { initDb } from './backend/config/db.ts';
import { createApp } from './backend/app.ts';

async function startServer() {
  initDb()
    .then(() => {
      console.log('Database initialization completed.');
    })
    .catch((err) => {
      console.error('Database initialization failed:', err);
    });

  const app = createApp();
  const PORT = Number(process.env.PORT || 3000);

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Sweety server listening on http://localhost:${PORT}`);
  });
}

startServer();
