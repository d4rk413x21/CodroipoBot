import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { KnowledgeBaseService } from '../services/knowledgeBaseService.js';

const searchSchema = z.object({
  question: z.string().min(3),
  serviceId: z.string().optional(),
});

export const knowledgeBaseRoutes: FastifyPluginAsync = async (app) => {
  const service = new KnowledgeBaseService();

  app.get('/knowledge-base/services', async () => ({
    services: service.listServices().map((item) => ({
      id: item.id,
      name: item.name,
      category: item.category,
      summary: item.summary,
    })),
  }));

  app.get('/knowledge-base/services/:serviceId', async (request, reply) => {
    const { serviceId } = request.params as { serviceId: string };
    const result = service.getService(serviceId);

    if (!result) {
      return reply.code(404).send({ message: 'Servizio non trovato' });
    }

    return { service: result };
  });

  app.get('/knowledge-base/answer', async (request, reply) => {
    const parseResult = searchSchema.safeParse(request.query);

    if (!parseResult.success) {
      return reply.code(400).send({ errors: parseResult.error.flatten() });
    }

    const answer = service.answerQuestion(parseResult.data.question, parseResult.data.serviceId);

    if (!answer) {
      return reply.code(404).send({ message: 'Nessuna risposta trovata' });
    }

    return { answer };
  });
};

export default knowledgeBaseRoutes;
