import { mkdir, writeFile } from 'fs/promises';
import path from 'path';
import process from 'process';
import servicesJson from '../data/services/services.json' with { type: 'json' };
import type { CivicService } from '../src/types/services.js';

const OUTPUT_PATH = path.join(process.cwd(), 'data', 'knowledge-base.json');

interface KnowledgeBaseDocument {
  id: string;
  title: string;
  type: 'markdown';
  tags: string[];
  content: string;
  metadata: Record<string, unknown>;
}

function buildOverviewContent(service: CivicService) {
  const lines = [
    `# ${service.name}`,
    '',
    `**Categoria:** ${service.category}`,
    `**Ufficio competente:** ${service.department}`,
    '',
    '## Descrizione breve',
    service.summary,
    '',
    '## Orari di apertura',
    ...service.officeHours.map((hour) => `- ${hour}`),
    '',
    '## Contatti',
  ];

  if (service.contact.phone) lines.push(`- Telefono: ${service.contact.phone}`);
  if (service.contact.email) lines.push(`- Email: ${service.contact.email}`);
  if (service.contact.office) lines.push(`- Sportello: ${service.contact.office}`);
  if (service.contact.address) lines.push(`- Indirizzo: ${service.contact.address}`);
  if (service.contact.bookingUrl) lines.push(`- Prenotazioni: ${service.contact.bookingUrl}`);

  lines.push('', '## Procedura');
  service.procedures.forEach((step, index) => {
    lines.push(`${index + 1}. ${step.title} - ${step.description}`);
  });

  lines.push('', '## Documenti richiesti');
  service.requiredDocuments.forEach((doc) => {
    const label = doc.mandatory ? 'Obbligatorio' : 'Facoltativo';
    lines.push(`- ${doc.name} (${label}): ${doc.description}`);
  });

  return lines.join('\n');
}

function buildFaqContent(service: CivicService) {
  return service.faqs.map((faq, index) => {
    const lines = [
      `# FAQ ${index + 1}: ${faq.question}`,
      '',
      faq.answer,
    ];

    if (faq.tags?.length) {
      lines.push('', `Tag: ${faq.tags.join(', ')}`);
    }

    return {
      id: `${service.id}-faq-${index + 1}`,
      title: `${service.name} - FAQ ${index + 1}`,
      type: 'markdown' as const,
      tags: [...(faq.tags ?? []), service.category],
      content: lines.join('\n'),
      metadata: {
        serviceId: service.id,
        question: faq.question,
      },
    } satisfies KnowledgeBaseDocument;
  });
}

function buildDocuments() {
  const services = servicesJson as unknown as CivicService[];

  const docs: KnowledgeBaseDocument[] = services.flatMap((service) => {
    const overviewDoc: KnowledgeBaseDocument = {
      id: `${service.id}-overview`,
      title: `${service.name} - Panoramica`,
      type: 'markdown',
      tags: [service.category, 'overview'],
      content: buildOverviewContent(service),
      metadata: {
        serviceId: service.id,
        department: service.department,
      },
    };

    const faqDocs = buildFaqContent(service);

    return [overviewDoc, ...faqDocs];
  });

  return docs;
}

async function run() {
  const documents = buildDocuments();
  await mkdir(path.dirname(OUTPUT_PATH), { recursive: true });
  await writeFile(OUTPUT_PATH, JSON.stringify(documents, null, 2), 'utf8');
  console.log(`Generata knowledge base in ${OUTPUT_PATH}`);
}

run();
