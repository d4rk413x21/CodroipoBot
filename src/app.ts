import Fastify from 'fastify';
import autoload from '@fastify/autoload';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { env } from './config/env.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export async function buildServer() {
  const app = Fastify({
    logger: true,
  });

  // Load plugins
  await app.register(autoload, {
    dir: join(__dirname, 'plugins'),
  });

  // Load routes with /api prefix
  await app.register(autoload, {
    dir: join(__dirname, 'routes'),
    options: { prefix: '/api' },
  });

  return app;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const app = await buildServer();
  
  try {
    await app.listen({ port: env.PORT, host: '0.0.0.0' });
    app.log.info(`Server listening on port ${env.PORT} (${env.NODE_ENV})`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}
