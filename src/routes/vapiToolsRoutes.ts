import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { listServices, findServiceById } from '../data/services.js';

/**
 * Route per gestire le chiamate dei Vapi Tools
 * Questi endpoint vengono chiamati dall'assistente Vapi quando usa i Google Calendar tools
 */

// Schema per la richiesta di verifica disponibilità
const checkAvailabilitySchema = z.object({
  message: z.object({
    type: z.literal('tool-calls'),
    toolCallList: z.array(z.object({
      id: z.string(),
      type: z.literal('function'),
      function: z.object({
        name: z.string(),
        arguments: z.object({
          startTime: z.string(), // ISO 8601
          endTime: z.string(),   // ISO 8601
          timeZone: z.string().optional(),
        }),
      }),
    })),
  }),
});

// Schema per la creazione di un evento
const createEventSchema = z.object({
  message: z.object({
    type: z.literal('tool-calls'),
    toolCallList: z.array(z.object({
      id: z.string(),
      type: z.literal('function'),
      function: z.object({
        name: z.string(),
        arguments: z.object({
          title: z.string(),
          startTime: z.string(), // ISO 8601
          endTime: z.string(),   // ISO 8601
          description: z.string().optional(),
          attendees: z.array(z.object({
            email: z.string().email(),
            name: z.string().optional(),
          })).optional(),
        }),
      }),
    })),
  }),
});

export const vapiToolsRoutes: FastifyPluginAsync = async (app) => {
  
  /**
   * Webhook per il tool "Check Availability" di Google Calendar
   * Chiamato da Vapi quando l'assistente vuole verificare gli slot disponibili
   */
  app.post('/vapi/tools/check-availability', async (request, reply) => {
    const parseResult = checkAvailabilitySchema.safeParse(request.body);

    if (!parseResult.success) {
      return reply.code(400).send({ 
        error: 'Invalid request format',
        details: parseResult.error.flatten() 
      });
    }

    const toolCall = parseResult.data.message.toolCallList[0];
    if (!toolCall) {
      return reply.code(400).send({ error: 'No tool call found' });
    }
    const { startTime, endTime, timeZone = 'Europe/Rome' } = toolCall.function.arguments;

    try {
      const start = new Date(startTime);
      const end = new Date(endTime);
      
      // Genera slot disponibili (ogni 30 minuti)
      const slots = [];
      const current = new Date(start);
      
      while (current < end) {
        const slotEnd = new Date(current);
        slotEnd.setMinutes(current.getMinutes() + 30);
        
        // Escludi pause pranzo (12:00-14:00) e fuori orario (9:00-18:00)
        const hour = current.getHours();
        if (hour >= 9 && hour < 18 && !(hour >= 12 && hour < 14)) {
          slots.push({
            start: current.toISOString(),
            end: slotEnd.toISOString(),
            available: true,
          });
        }
        
        current.setMinutes(current.getMinutes() + 30);
      }

      return reply.send({
        results: [{
          toolCallId: toolCall.id,
          result: JSON.stringify({
            available: slots.length > 0,
            slots: slots.slice(0, 10), // Prime 10 fasce
            timeZone,
          }),
        }],
      });
    } catch (error) {
      request.log.error({ err: error }, 'Errore check availability');
      return reply.code(500).send({
        results: [{
          toolCallId: toolCall.id,
          error: 'Errore durante la verifica disponibilità',
        }],
      });
    }
  });

  /**
   * Webhook per il tool "Create Event" di Google Calendar
   * Chiamato da Vapi quando l'assistente conferma la prenotazione
   */
  app.post('/vapi/tools/create-event', async (request, reply) => {
    const parseResult = createEventSchema.safeParse(request.body);

    if (!parseResult.success) {
      return reply.code(400).send({ 
        error: 'Invalid request format',
        details: parseResult.error.flatten() 
      });
    }

    const toolCall = parseResult.data.message.toolCallList[0];
    if (!toolCall) {
      return reply.code(400).send({ error: 'No tool call found' });
    }
    const { title, startTime, endTime, description, attendees } = toolCall.function.arguments;

    try {
      const eventId = `evt_${Date.now()}`;
      
      const event = {
        id: eventId,
        title,
        startTime,
        endTime,
        description: description || '',
        attendees: attendees || [],
        status: 'confirmed',
        link: `https://comune.codroipo.ud.it/appuntamenti/${eventId}`,
      };

      request.log.info({ event }, 'Evento creato');

      return reply.send({
        results: [{
          toolCallId: toolCall.id,
          result: JSON.stringify({
            success: true,
            event,
            message: `Appuntamento confermato per ${new Date(startTime).toLocaleString('it-IT')}`,
          }),
        }],
      });
    } catch (error) {
      request.log.error({ err: error }, 'Errore create event');
      return reply.code(500).send({
        results: [{
          toolCallId: toolCall.id,
          error: 'Errore durante la creazione dell\'evento',
        }],
      });
    }
  });

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
