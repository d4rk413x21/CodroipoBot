import type { FastifyPluginAsync } from 'fastify';
import { findServiceById, listServices, searchFaqs } from '../data/services.js';

export const servicesRoutes: FastifyPluginAsync = async (app) => {
  app.get('/services', async () => {
    const services = listServices().map((service) => ({
      id: service.id,
      name: service.name,
      category: service.category,
      summary: service.summary,
      officeHours: service.officeHours,
      contact: service.contact,
    }));

    return { services };
  });

  app.get('/services/:serviceId', async (request, reply) => {
    const { serviceId } = request.params as { serviceId: string };
    const service = findServiceById(serviceId);

    if (!service) {
      return reply.code(404).send({ message: 'Servizio non trovato' });
    }

    return { service };
  });

  app.get('/services/:serviceId/faqs', async (request, reply) => {
    const { serviceId } = request.params as { serviceId: string };
    const service = findServiceById(serviceId);

    if (!service) {
      return reply.code(404).send({ message: 'Servizio non trovato' });
    }

    return { faqs: service.faqs };
  });

  app.get('/faqs/search', async (request) => {
    const { query } = request.query as { query?: string };
    if (!query) {
      return { faqs: [] };
    }

    return { faqs: searchFaqs(query) };
  });
};

export default servicesRoutes;
