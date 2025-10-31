import { mkdir, writeFile } from 'fs/promises';
import path from 'path';
import process from 'process';
import type { Page } from 'puppeteer';
import puppeteer from 'puppeteer';

interface ServiceTarget {
  id: string;
  name: string;
  url: string;
}

const OUTPUT_DIR = path.join(process.cwd(), 'data', 'raw');

const servicesToScrape: ServiceTarget[] = [
  {
    id: 'anagrafe-carta-identita',
    name: "Carta d'Identita' Elettronica (CIE)",
    url: 'https://www.comune.codroipo.ud.it/it/servizi-224003/carta-identita-elettronica-cie-cie-241620',
  },
  {
    id: 'certificato-residenza',
    name: 'Certificati anagrafici',
    url: 'https://www.comune.codroipo.ud.it/it/servizi-224003/certificati-anagrafici-239616',
  },
  {
    id: 'tributi-tari',
    name: 'TARI - Tassa rifiuti',
    url: 'https://www.comune.codroipo.ud.it/it/servizi-224003/tari-tassa-sui-rifiuti-241589',
  },
  {
    id: 'ufficio-tecnico',
    name: 'Accesso atti - Edilizia Privata',
    url: 'https://www.comune.codroipo.ud.it/it/servizi-224003/richiedere-laccesso-agli-atti-edilizia-privata-245573',
  },
  {
    id: 'mensa-scolastica',
    name: 'Refezione scolastica - Mensa',
    url: 'https://www.comune.codroipo.ud.it/it/servizi-224003/refezione-scolastica-mensa-iscrizione-e-diete-speciali-241655',
  },
];

function cleanText(raw: string) {
  return raw
    .replace(/\s+/g, ' ')
    .replace(/\s\./g, '.')
    .replace(/\s,/g, ',')
    .replace(/([a-z])([A-Z])/g, '$1\n\n## $2') // Aggiungi header dove cambia maiuscolo
    .replace(/(\d+)\./g, '\n$1.') // Numeri di lista su nuova riga
    .trim();
}

async function fetchService(service: ServiceTarget, page: Page) {
  console.log(`Caricamento ${service.url}...`);
  
  await page.goto(service.url, { 
    waitUntil: 'networkidle2',
    timeout: 30000 
  });

  // Attendi che il contenuto principale sia caricato
  await page.waitForSelector('main', { timeout: 10000 }).catch(() => {
    console.warn(`Selector 'main' non trovato per ${service.id}`);
  });

  // Estrai il testo dal contenuto principale
  const content = await page.evaluate(() => {
    // Rimuovi elementi non desiderati
    const elementsToRemove = document.querySelectorAll('script, style, noscript, svg, nav, header, footer, .cookie-bar, .breadcrumb');
    elementsToRemove.forEach(el => el.remove());

    // Prova vari selettori per il contenuto
    const selectors = ['main', '[role="main"]', '#main', 'article', '.container'];
    
    for (const selector of selectors) {
      const element = document.querySelector(selector);
      if (element && element.textContent && element.textContent.trim().length > 100) {
        return element.textContent.trim();
      }
    }
    
    return document.body.textContent?.trim() || '';
  });

  return cleanText(content);
}

async function run() {
  await mkdir(OUTPUT_DIR, { recursive: true });

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();

  await page.setUserAgent({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  });

  for (const service of servicesToScrape) {
    try {
      const content = await fetchService(service, page);
      const filePath = path.join(OUTPUT_DIR, `${service.id}.md`);
      const formatted = `# ${service.name}\n\nFonte: ${service.url}\n\n${content}\n`;
      await writeFile(filePath, formatted, 'utf8');
      console.log(`Salvato ${filePath}`);
    } catch (error) {
      console.error(`Errore durante lo scraping di ${service.id}:`, error);
    }
  }

  await browser.close();
}

run();
