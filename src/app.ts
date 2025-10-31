import Fastify from 'fastify';
import cors from '@fastify/cors';
import { knowledgeBaseRoutes } from './routes/knowledgeBaseRoutes.js';
import { servicesRoutes } from './routes/servicesRoutes.js';
import { integrationsRoutes } from './routes/integrationsRoutes.js';
import { vapiToolsRoutes } from './routes/vapiToolsRoutes.js';

export async function buildServer() {
  const app = Fastify({
    logger: true,
  });

  await app.register(cors, {
    origin: true,
  });

  app.get('/health', async () => ({ status: 'ok' }));

  await app.register(servicesRoutes, { prefix: '/api' });
  await app.register(knowledgeBaseRoutes, { prefix: '/api' });
  await app.register(integrationsRoutes, { prefix: '/api' });
  await app.register(vapiToolsRoutes, { prefix: '/api' });

  return app;
}
