import { readFile, writeFile } from 'fs/promises';
import { join } from 'path';
import process from 'process';
import type { CivicService } from '../src/types/services.js';

const RAW_DIR = join(process.cwd(), 'data', 'raw');
const OUTPUT_PATH = join(process.cwd(), 'data', 'services', 'services.json');

interface ParsedService {
  id: string;
  name: string;
  rawContent: string;
}

const serviceConfigs = [
  { id: 'anagrafe-carta-identita', category: 'Servizi Demografici', department: 'Ufficio Anagrafe' },
  { id: 'certificato-residenza', category: 'Servizi Demografici', department: 'Ufficio Anagrafe' },
  { id: 'tributi-tari', category: 'Tributi', department: 'Ufficio Tributi' },
  { id: 'ufficio-tecnico', category: 'Urbanistica', department: 'Area Tecnica - Edilizia Privata' },
  { id: 'mensa-scolastica', category: 'Servizi Educativi', department: 'Area Servizi alla Persona' },
];

function extractSection(content: string, markers: string[]): string {
  for (const marker of markers) {
    const regex = new RegExp(`${marker}\\s*##\\s*([^#]+?)(?=##|$)`, 'is');
    const match = content.match(regex);
    if (match?.[1]) {
      return match[1].trim();
    }
  }
  return '';
}

function extractSummary(content: string): string {
  const desc = extractSection(content, ['Descrizione', 'A chi è rivolto']);
  if (desc) {
    return desc.split('\n')[0]?.trim().slice(0, 300) || 'Servizio comunale disponibile.';
  }
  return 'Servizio comunale disponibile.';
}

function extractOfficeHours(content: string): string[] {
  const match = content.match(/Apertura al pubblico\s+([^#]+?)(?:Su appuntamento|Contatti|##)/is);
  if (!match?.[1]) return [];
  
  const text = match[1].trim();
  const hours: string[] = [];
  
  // Trova tutti i pattern "Giorno: HH:MM - HH:MM"
  const dayPattern = /(Lunedì|Martedì|Mercoledì|Giovedì|Venerdì|Sabato|Domenica):\s*(\d{1,2}:\d{2}\s*-\s*\d{1,2}:\d{2}(?:\s*\/\s*\d{1,2}:\d{2}\s*-\s*\d{1,2}:\d{2})?)/gi;
  let dayMatch;
  
  while ((dayMatch = dayPattern.exec(text)) !== null) {
    hours.push(`${dayMatch[1]}: ${dayMatch[2]}`);
  }
  
  return hours;
}

function extractContact(content: string): { phone?: string; email?: string; office?: string; address?: string } {
  const contact: { phone?: string; email?: string; office?: string; address?: string } = {};
  
  const phoneMatch = content.match(/Telefono\s+(\d{4}\/\d+)/i);
  if (phoneMatch) contact.phone = phoneMatch[1];
  
  const emailMatch = content.match(/PEC\s+([\w.@-]+)/i);
  if (emailMatch) contact.email = emailMatch[1];
  
  const addressMatch = content.match(/(Piazza|Via|Viale)\s+[^,\n]+,\s*\d{5}\s+\w+/i);
  if (addressMatch) contact.address = addressMatch[0].trim();
  
  return contact;
}

function extractCost(content: string): string {
  const costSection = extractSection(content, ['Quanto Costa']);
  if (!costSection) return 'Gratuito';
  
  const euroMatch = costSection.match(/Euro\s+(\d+[,.]?\d*)/i);
  if (euroMatch) return `€${euroMatch[1].replace(',', '.')}`;
  
  if (/gratuito|gratis|senza costi/i.test(costSection)) return 'Gratuito';
  
  return 'Consultare ufficio';
}

function extractProcedures(content: string): Array<{ title: string; description: string }> {
  const procedureSection = extractSection(content, ['Come fare']);
  
  if (!procedureSection) {
    return [{ title: 'Presentazione richiesta', description: 'Contattare l\'ufficio competente per informazioni sulla procedura.' }];
  }

  const procedures: Array<{ title: string; description: string }> = [];
  const numbered = procedureSection.match(/\d+\.\s+([^\d]+?)(?=\d+\.|$)/gs);
  
  if (numbered && numbered.length > 0) {
    numbered.slice(0, 5).forEach((step, i) => {
      const clean = step.replace(/^\d+\.\s*/, '').trim();
      const sentences = clean.split(/[.;]/).filter(s => s.length > 10);
      procedures.push({
        title: `Passo ${i + 1}`,
        description: sentences[0]?.trim().slice(0, 250) || clean.slice(0, 250)
      });
    });
  } else {
    const sentences = procedureSection.split(/[.;]/).filter(s => s.length > 20).slice(0, 3);
    sentences.forEach((sent, i) => {
      procedures.push({
        title: `Modalità ${i + 1}`,
        description: sent.trim().slice(0, 250)
      });
    });
  }
  
  return procedures.length > 0 ? procedures : [{ title: 'Presentazione richiesta', description: procedureSection.slice(0, 250) }];
}

function extractDocuments(content: string): Array<{ name: string; description: string; mandatory: boolean }> {
  const docSection = extractSection(content, ['Cosa serve']);
  
  if (!docSection) {
    return [{ name: 'Documento di identità', description: 'Documento valido del richiedente', mandatory: true }];
  }

  const docs: Array<{ name: string; description: string; mandatory: boolean }> = [];
  const lines = docSection.split(/[;\n]/).filter(line => line.length > 15);
  
  for (const line of lines.slice(0, 6)) {
    const cleaned = line.trim();
    if (cleaned.length < 10) continue;
    
    const isMandatory = /obbligatori|necessari|richiesti|deve/i.test(cleaned);
    
    if (cleaned.length < 100) {
      docs.push({
        name: cleaned,
        description: cleaned,
        mandatory: isMandatory
      });
    } else {
      const parts = cleaned.split(/[:(]/);
      docs.push({
        name: parts[0]?.trim() || 'Documento richiesto',
        description: cleaned.slice(0, 200),
        mandatory: isMandatory
      });
    }
  }
  
  return docs.length > 0 ? docs : [{ name: 'Documentazione da verificare presso l\'ufficio', description: 'Contattare l\'ufficio per l\'elenco completo', mandatory: false }];
}

function generateFaqs(service: ParsedService, config: typeof serviceConfigs[0]): Array<{ question: string; answer: string; tags?: string[] }> {
  const { rawContent } = service;
  const faqs: Array<{ question: string; answer: string; tags?: string[] }> = [];

  const hours = extractOfficeHours(rawContent);
  if (hours.length > 0) {
    faqs.push({
      question: `Quali sono gli orari di apertura?`,
      answer: hours.join('\n'),
      tags: ['orari', 'apertura'],
    });
  }

  const cost = extractCost(rawContent);
  faqs.push({
    question: `Quanto costa?`,
    answer: `Il costo del servizio è: ${cost}`,
    tags: ['pagamenti', 'costi', 'tariffe'],
  });

  const docs = extractDocuments(rawContent);
  if (docs.length > 0) {
    const docList = docs.map(d => `- ${d.name}${d.mandatory ? ' (obbligatorio)' : ''}`).join('\n');
    faqs.push({
      question: `Quali documenti sono necessari?`,
      answer: `Documentazione richiesta:\n${docList}`,
      tags: ['documenti', 'requisiti'],
    });
  }

  const procedures = extractProcedures(rawContent);
  if (procedures.length > 0) {
    faqs.push({
      question: `Come si richiede il servizio?`,
      answer: procedures.map((p, i) => `${i + 1}. ${p.description}`).join('\n'),
      tags: ['procedura', 'come-fare'],
    });
  }

  if (/appuntamento|prenotare|prenotazione|prenota/i.test(rawContent)) {
    const bookingInfo = extractSection(rawContent, ['Come fare']).slice(0, 400);
    if (bookingInfo.includes('appuntamento')) {
      faqs.push({
        question: `Come posso prenotare un appuntamento?`,
        answer: bookingInfo.split(/[.!]/).find(s => /prenotar|appuntamento/i.test(s))?.trim() || 
                'È possibile prenotare tramite il sito comunale o telefonando all\'ufficio.',
        tags: ['prenotazioni', 'appuntamenti'],
      });
    }
  }

  const timeSection = extractSection(rawContent, ['Tempi e scadenze']);
  if (timeSection) {
    const timeMatch = timeSection.match(/(\d+)\s*(giorni|ore|settimane|mesi)/i);
    if (timeMatch) {
      faqs.push({
        question: `Quali sono i tempi di rilascio?`,
        answer: `Il servizio viene erogato entro ${timeMatch[1]} ${timeMatch[2].toLowerCase()}.`,
        tags: ['tempistiche', 'tempi'],
      });
    }
  }

  const contact = extractContact(rawContent);
  if (contact.phone || contact.email) {
    const contactInfo = [];
    if (contact.phone) contactInfo.push(`Telefono: ${contact.phone}`);
    if (contact.email) contactInfo.push(`Email: ${contact.email}`);
    if (contact.address) contactInfo.push(`Indirizzo: ${contact.address}`);
    
    faqs.push({
      question: `Come posso contattare l'ufficio?`,
      answer: contactInfo.join('\n'),
      tags: ['contatti', 'informazioni'],
    });
  }

  return faqs;
}

async function parseRawService(id: string): Promise<ParsedService | null> {
  try {
    const filePath = join(RAW_DIR, `${id}.md`);
    const content = await readFile(filePath, 'utf8');
    
    const nameMatch = content.match(/^#\s+(.+)$/m);
    const name = nameMatch?.[1] || id;

    return { id, name, rawContent: content };
  } catch (error) {
    console.warn(`Impossibile leggere ${id}:`, error);
    return null;
  }
}

async function run() {
  const services: CivicService[] = [];

  for (const config of serviceConfigs) {
    const parsed = await parseRawService(config.id);
    if (!parsed) continue;

    const service: CivicService = {
      id: parsed.id,
      name: parsed.name,
      category: config.category,
      summary: extractSummary(parsed.rawContent),
      department: config.department,
      officeHours: extractOfficeHours(parsed.rawContent),
      contact: extractContact(parsed.rawContent),
      procedures: extractProcedures(parsed.rawContent),
      requiredDocuments: extractDocuments(parsed.rawContent),
      faqs: generateFaqs(parsed, config),
      bookingNotes: extractSection(parsed.rawContent, ['Come fare']).slice(0, 300) || 'Contattare l\'ufficio per informazioni.',
    };

    services.push(service);
    console.log(`✓ Processato: ${service.name}`);
  }

  await writeFile(OUTPUT_PATH, JSON.stringify(services, null, 2), 'utf8');
  console.log(`\n✅ Generato ${OUTPUT_PATH} con ${services.length} servizi`);
}

run();
