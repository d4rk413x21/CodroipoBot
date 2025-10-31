import { syncKnowledgeBase, listVapiFiles } from '../src/integrations/vapiClient.js';

async function run() {
  console.log('Avvio sincronizzazione Knowledge Base con Vapi\n');
  
  try {
    // Sincronizza la knowledge base
    const result = await syncKnowledgeBase();
    
    if (result) {
      console.log('\n Lista completa file su Vapi:');
      await listVapiFiles();
    }
  } catch (error) {
    console.error('\n Errore:', error);
    process.exit(1);
  }
}

run();
