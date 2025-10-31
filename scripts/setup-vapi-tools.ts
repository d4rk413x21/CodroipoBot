import { getVapiClient } from '../src/integrations/vapiClient.js';
import { env } from '../src/config/env.js';

/**
 * Script per configurare i Google Calendar tools di Vapi
 * Questi tools permettono all'assistente di gestire gli appuntamenti
 */

async function setupGoogleCalendarTools() {
  const vapi = getVapiClient();
  
  if (!vapi) {
    console.error('VAPI_API_KEY non configurata. Aggiungi la chiave nel file .env');
    process.exit(1);
  }

  console.log('Configurazione Google Calendar Tools per Vapi\n');

  try {
    // Tool 1: Check Availability
    console.log('Creazione tool "Check Availability"...');
    const checkAvailabilityTool = await vapi.tools.create({
      type: 'function',
      function: {
        name: 'checkAvailability',
        description: 'Verifica la disponibilità di slot per appuntamenti nel calendario. Usa questo tool prima di creare un appuntamento. La data corrente è {{"now" | date: "%Y-%m-%d", "Europe/Rome"}}. Usa questa data come riferimento per calcolare le date richieste dal cittadino.',
        parameters: {
          type: 'object',
          properties: {
            startTime: {
              type: 'string',
              description: 'Data e ora di inizio del periodo da verificare (formato ISO 8601, es: 2025-11-01T09:00:00+01:00). RICORDA: la data di oggi è {{"now" | date: "%Y-%m-%d", "Europe/Rome"}}. Calcola la data richiesta dal cittadino partendo da oggi.',
            },
            endTime: {
              type: 'string',
              description: 'Data e ora di fine del periodo da verificare (formato ISO 8601, es: 2025-11-01T18:00:00Z)',
            },
            timeZone: {
              type: 'string',
              description: 'Fuso orario (default: Europe/Rome)',
            },
          },
          required: ['startTime', 'endTime'],
        },
      },
      server: {
        url: `${env.SERVER_URL || 'http://localhost:3000'}/api/vapi/tools/check-availability`,
      },
    });
    console.log(`Tool creato: ${checkAvailabilityTool.id}\n`);

    // Tool 2: Create Event
    console.log('Creazione tool "Create Event"...');
    const createEventTool = await vapi.tools.create({
      type: 'function',
      function: {
        name: 'createEvent',
        description: 'Crea un nuovo appuntamento nel calendario. Usa questo tool dopo aver verificato la disponibilità e confermato con il cittadino. La data corrente è {{"now" | date: "%Y-%m-%d %H:%M", "Europe/Rome"}}.',
        parameters: {
          type: 'object',
          properties: {
            title: {
              type: 'string',
              description: 'Titolo dell\'appuntamento (es: "Rilascio Carta Identità - Mario Rossi")',
            },
            startTime: {
              type: 'string',
              description: 'Data e ora di inizio (formato ISO 8601, es: 2025-11-01T10:00:00Z)',
            },
            endTime: {
              type: 'string',
              description: 'Data e ora di fine (formato ISO 8601, es: 2025-11-01T10:30:00Z)',
            },
            description: {
              type: 'string',
              description: 'Descrizione dell\'appuntamento con dettagli aggiuntivi',
            },
            attendees: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  email: { type: 'string' },
                  name: { type: 'string' },
                },
                required: ['email'],
              },
              description: 'Lista dei partecipanti (email del cittadino)',
            },
          },
          required: ['title', 'startTime', 'endTime'],
        },
      },
      server: {
        url: `${env.SERVER_URL || 'http://localhost:3000'}/api/vapi/tools/create-event`,
      },
    });
    console.log(`Tool creato: ${createEventTool.id}\n`);

    // Tool 3: Get Services
    console.log('📋 Creazione tool "Get Services"...');
    const getServicesTool = await vapi.tools.create({
      type: 'function',
      function: {
        name: 'getServices',
        description: 'Ottieni la lista dei servizi disponibili del Comune di Codroipo',
        parameters: {
          type: 'object',
          properties: {},
        },
      },
      server: {
        url: `${env.SERVER_URL || 'http://localhost:3000'}/api/vapi/tools/get-services`,
      },
    });
    console.log(`Tool creato: ${getServicesTool.id}\n`);

    // Tool 4: Get Service Details
    console.log('🔍 Creazione tool "Get Service Details"...');
    const getServiceDetailsTool = await vapi.tools.create({
      type: 'function',
      function: {
        name: 'getServiceDetails',
        description: 'Ottieni i dettagli completi di un servizio specifico (procedura, documenti richiesti, orari)',
        parameters: {
          type: 'object',
          properties: {
            serviceId: {
              type: 'string',
              description: 'ID del servizio (es: "anagrafe-carta-identita")',
            },
          },
          required: ['serviceId'],
        },
      },
      server: {
        url: `${env.SERVER_URL || 'http://localhost:3000'}/api/vapi/tools/get-service-details`,
      },
    });
    console.log(`Tool creato: ${getServiceDetailsTool.id}\n`);

    // Riepilogo
    console.log('Configurazione completata!\n');
    console.log('Tool IDs da usare nell\'assistente:');
    console.log(`   - checkAvailability: ${checkAvailabilityTool.id}`);
    console.log(`   - createEvent: ${createEventTool.id}`);
    console.log(`   - getServices: ${getServicesTool.id}`);
    console.log(`   - getServiceDetails: ${getServiceDetailsTool.id}`);
    console.log('\nAggiungi questi ID nella configurazione del tuo assistente Vapi.');
    
  } catch (error) {
    console.error('\nErrore durante la configurazione:', error);
    process.exit(1);
  }
}

setupGoogleCalendarTools();
