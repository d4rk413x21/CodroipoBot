import { getVapiClient } from '../src/integrations/vapiClient.js';
import { env } from '../src/config/env.js';


async function setupTools() {
  const vapi = getVapiClient();
  
  if (!vapi) {
    console.error('VAPI_API_KEY non configurata. Aggiungi la chiave nel file .env');
    process.exit(1);
  }

  console.log('Configurazione Google Calendar Tools per Vapi\n');

  try {
    // Tool 1: Get Services
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

    // Tool 2: Get Service Details
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
    console.log(`   - getServices: ${getServicesTool.id}`);
    console.log(`   - getServiceDetails: ${getServiceDetailsTool.id}`);
    console.log('\nAggiungi questi ID nella configurazione del tuo assistente Vapi.');
    
  } catch (error) {
    console.error('\nErrore durante la configurazione:', error);
    process.exit(1);
  }
}

setupTools();
