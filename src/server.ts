import { env } from './config/env.js';
import { buildServer } from './app.js';

const PORT = env.PORT;

async function start() {
  const app = await buildServer();

  try {
    await app.listen({ port: PORT, host: '0.0.0.0' });
    app.log.info(`Server listening on port ${PORT} (${env.NODE_ENV})`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

start();
