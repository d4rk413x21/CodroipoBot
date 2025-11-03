import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { listServices, findServiceById } from '../data/services.js';

/**
 * Route per gestire le chiamate dei Vapi Tools
 */

export const vapiToolsRoutes: FastifyPluginAsync = async (app) => {

  /**
   * Endpoint helper per ottenere i servizi disponibili
   * Può essere usato dall'assistente per mostrare i servizi
   */
  app.post('/vapi/tools/get-services', async (request, reply) => {
    try {
      const services = listServices().map(s => ({
        id: s.id,
        name: s.name,
        summary: s.summary,
        category: s.category,
      }));

      return reply.send({
        results: [{
          toolCallId: (request.body as any)?.message?.toolCallList?.[0]?.id || 'service-list',
          result: JSON.stringify({ services }),
        }],
      });
    } catch (error) {
      request.log.error({ err: error }, 'Errore get services');
      return reply.code(500).send({ error: 'Errore recupero servizi' });
    }
  });

  /**
   * Endpoint per ottenere i dettagli di un servizio specifico
   */
  app.post('/vapi/tools/get-service-details', async (request, reply) => {
    const body = request.body as any;
    const serviceId = body?.message?.toolCallList?.[0]?.function?.arguments?.serviceId;

    if (!serviceId) {
      return reply.code(400).send({ error: 'serviceId required' });
    }

    try {
      const service = findServiceById(serviceId);
      
      if (!service) {
        return reply.code(404).send({
          results: [{
            toolCallId: body.message.toolCallList[0].id,
            error: 'Servizio non trovato',
          }],
        });
      }

      return reply.send({
        results: [{
          toolCallId: body.message.toolCallList[0].id,
          result: JSON.stringify({
            id: service.id,
            name: service.name,
            summary: service.summary,
            procedures: service.procedures,
            requiredDocuments: service.requiredDocuments,
            officeHours: service.officeHours,
            contact: service.contact,
          }),
        }],
      });
    } catch (error) {
      request.log.error({ err: error }, 'Errore get service details');
      return reply.code(500).send({ error: 'Errore recupero dettagli servizio' });
    }
  });
};

export default vapiToolsRoutes;
