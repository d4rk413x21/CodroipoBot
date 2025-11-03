import type { FastifyPluginAsync } from 'fastify';
import { isVapiConfigured, syncKnowledgeBase } from '../integrations/vapiClient.js';

export const integrationsRoutes: FastifyPluginAsync = async (app) => {
  app.post('/integrations/vapi/sync', async (request, reply) => {
    if (!isVapiConfigured()) {
      return reply.code(400).send({
        message: 'Configurazione Vapi assente. Imposta VAPI_API_KEY',
      });
    }

    await syncKnowledgeBase();
    return { message: 'Sincronizzazione avviata', success: true };
  });
};

export default integrationsRoutes;
