import { VapiClient } from '@vapi-ai/server-sdk';
import { createReadStream } from 'fs';
import { join } from 'path';
import process from 'process';
import { env } from '../config/env.js';
import { listServices } from '../data/services.js';

let client: VapiClient | undefined;

export function getVapiClient() {
  if (!env.VAPI_API_KEY) {
    return undefined;
  }

  if (!client) {
    client = new VapiClient({ token: env.VAPI_API_KEY });
  }

  return client;
}

export function isVapiConfigured() {
  return Boolean(env.VAPI_API_KEY);
}

export function buildKnowledgeBasePayload() {
  const services = listServices();

  return services.map((service) => ({
    serviceId: service.id,
    name: service.name,
    summary: service.summary,
    faqs: service.faqs,
  }));
}

/**
 * Carica il file knowledge-base.json su Vapi
 * Restituisce l'oggetto file caricato con il suo ID
 */
export async function uploadKnowledgeBaseFile(): Promise<any> {
  const vapi = getVapiClient();
  if (!vapi) {
    throw new Error('Vapi client non configurato. Imposta VAPI_API_KEY nel file .env');
  }

  const kbPath = join(process.cwd(), 'data', 'knowledge-base.json');

  console.info('Caricamento knowledge-base.json su Vapi...');
  
  const uploadedFile = await vapi.files.create(createReadStream(kbPath) as any);
  
  console.info(`File caricato con successo!`);
  console.info(`File ID: ${uploadedFile.id}`);
  console.info(`Nome: ${uploadedFile.name || 'knowledge-base.json'}`);
  
  return uploadedFile;
}

/**
 * Elenca tutti i file caricati su Vapi
 */
export async function listVapiFiles(): Promise<any[]> {
  const vapi = getVapiClient();
  if (!vapi) {
    throw new Error('Vapi client non configurato. Imposta VAPI_API_KEY nel file .env');
  }

  console.info('Recupero lista file da Vapi...');
  const files = await vapi.files.list();
  
  console.info(`\n Trovati ${files.length} file:`);
  files.forEach((file, index) => {
    console.info(`${index + 1}. ${file.name || 'Senza nome'} (ID: ${file.id})`);
  });
  
  return files;
}

/**
 * Sincronizza automaticamente la knowledge base con Vapi
 * Carica il file knowledge-base.json e restituisce l'ID del file
 */
export async function syncKnowledgeBase(): Promise<void | { file: any }> {
  if (!env.VAPI_API_KEY) {
    console.warn('VAPI_API_KEY mancante, salto sincronizzazione automatica.');
    console.info('Aggiungi VAPI_API_KEY nel file .env per abilitare il sync automatico.');
    return;
  }

  try {
    const uploadedFile = await uploadKnowledgeBaseFile();
    
    console.info('\n Sincronizzazione completata!');
    console.info('Usa questo File ID nel tuo assistente Vapi per abilitare la knowledge base.');
    
    return { file: uploadedFile };
  } catch (error) {
    console.error('Errore durante la sincronizzazione:', error);
    throw error;
  }
}
