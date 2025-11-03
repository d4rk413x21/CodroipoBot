# 🏛️ Assistente Virtuale Comune di Codroipo

> Backend TypeScript + Fastify per assistente vocale AI del Comune di Codroipo, integrato con [Vapi.ai](https://vapi.ai).

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/d4rk413x21/CodroipoBot)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue.svg)](https://www.typescriptlang.org/)
[![Fastify](https://img.shields.io/badge/Fastify-5.6-black.svg)](https://fastify.dev/)
[![Vapi](https://img.shields.io/badge/Vapi-AI-purple.svg)](https://vapi.ai)


## 🚀 Quick Start

### Prerequisiti

- Node.js 20+
- Account [Vapi.ai](https://vapi.ai)
- (Opzionale) Account Vercel per deployment

### Installazione

```bash
# Clone
git clone https://github.com/d4rk413x21/CodroipoBot.git
cd CodroipoBot

# Installa dipendenze
npm install

# Configura variabili ambiente
cp .env.example .env
# Modifica .env con le tue chiavi
```

### Configurazione `.env`

```bash
# Server
PORT=3333
NODE_ENV=development
SERVER_URL=http://localhost:3333  # In produzione: https://your-domain.vercel.app

# Vapi.ai
VAPI_API_KEY=your_vapi_api_key_here
```

### Avvio Sviluppo

```bash
npm run dev
# Server avviato su http://localhost:3333
```

Testa:
```bash
curl http://localhost:3333/health
# {"status":"ok"}
```

## 📦 Deployment su Vercel

### Deploy Automatico

```bash
npm install -g vercel
vercel --prod
```

### Configurazione Vercel

1. **Imposta variabili ambiente** nella dashboard:
   - `VAPI_API_KEY`
   - `SERVER_URL` (es: `https://codroipo-bot.vercel.app`)

2. **Deploy automatico** su push a `main`

3. **Configura Vapi Tools**:
   ```bash
   export SERVER_URL=https://your-domain.vercel.app
   npm run setup:vapi-tools
   ``

## 🛠️ Setup Assistente Vapi

### 1. Carica Knowledge Base

```bash
# Genera knowledge base dai servizi
npm run generate:kb

# Carica su Vapi
npm run sync:vapi
```

### 2. Configura Tools (Webhook)

```bash
npm run setup:vapi-tools
```

Crea 4 tools in Vapi:
- `getServices` - Lista servizi comunali
- `getServiceDetails` - Dettagli servizio

## 📁 Struttura Progetto

```
ai-assistant-vapi/
├── api/
│   └── index.ts              # Vercel serverless handler
├── src/
│   ├── app.ts                # Fastify app + autoload
│   ├── config/
│   │   └── env.ts            # Validazione env con Zod
│   ├── data/
│   │   └── services.ts       # Dati servizi comunali
│   ├── integrations/
│   │   └── vapiClient.ts     # SDK Vapi
│   ├── plugins/              # Autoload plugins
│   │   ├── cors.ts
│   │   └── health.ts
│   └── routes/               # Autoload routes
│       ├── servicesRoutes.ts
│       ├── vapiToolsRoutes.ts
│       └── integrationsRoutes.ts
├── scripts/
│   ├── scrape-services.ts           # Scraping sito comunale
│   ├── parse-scraped-data.ts        # Parsing dati
│   ├── generate-knowledge-base.ts   # Generazione KB
│   ├── sync-vapi.ts                 # Upload KB su Vapi
│   ├── setup-vapi-tools.ts          # Creazione Vapi Tools
├── data/
│   ├── services.json         # Servizi strutturati
│   ├── knowledge-base.json   # KB per Vapi
│   └── raw/                  # Dati scraping
└── docs/                     # Documentazione
```

## 🔌 API Endpoints

### Health Check
```bash
GET /health
```

### Servizi Comunali
```bash
GET /api/services                    # Lista tutti i servizi
GET /api/services/:id                # Dettagli servizio
GET /api/services/:id/faqs           # FAQ servizio
```

### Vapi Tools (Webhook)
```bash
POST /api/vapi/tools/check-availability    # Verifica disponibilità
POST /api/vapi/tools/create-event          # Crea appuntamento
POST /api/vapi/tools/get-services          # Lista servizi
POST /api/vapi/tools/get-service-details   # Dettagli servizio
```

### Integrazioni
```bash
POST /api/integrations/vapi/sync    # Sincronizza KB
```

## 🔧 Script NPM

| Comando | Descrizione |
|---------|-------------|
| `npm run dev` | Avvia server sviluppo con hot-reload |
| `npm run build` | Compila TypeScript |
| `npm run start` | Avvia server da build |
| `npm run lint` | Type-check TypeScript |
| `npm run scrape:services` | Scarica dati da sito comunale |
| `npm run parse:scraped` | Estrae dati strutturati |
| `npm run generate:kb` | Genera knowledge-base.json |
| `npm run sync:all` | Pipeline completa (scrape → parse → kb) |
| `npm run sync:vapi` | Carica KB su Vapi |
| `npm run setup:vapi-tools` | Configura Vapi Tools |
| `npm run update:assistant` | Aggiorna system prompt assistente |

## 🧩 Tecnologie

### Backend
- **[Fastify](https://fastify.dev/)** 5.6 - Framework web ad alte prestazioni
- **[TypeScript](https://www.typescriptlang.org/)** 5.9 - Type safety
- **[@fastify/autoload](https://github.com/fastify/fastify-autoload)** - Auto-discovery plugin/routes
- **[Zod](https://zod.dev/)** - Validazione runtime

### Deployment
- **[Vercel](https://vercel.com)** - Serverless functions
- **[@vercel/node](https://vercel.com/docs/functions/serverless-functions/runtimes/node-js)** - Runtime Node.js

### Scraping & Data
- **[Puppeteer](https://pptr.dev/)** - Web scraping

## 📊 Dati & Knowledge Base

### Servizi Configurati

Il sistema gestisce 5 servizi principali:
- 🪪 Carta d'Identità
- 🗑️ TARI (Tassa Rifiuti)
- 📄 Accesso Atti Edilizia
- 🍽️ Mensa Scolastica
- 🏛️ Servizi Demografici

### Aggiornamento Dati

```bash
# 1. Scraping automatico dal sito comunale
npm run scrape:services

# 2. Parsing ed estrazione dati strutturati
npm run parse:scraped

# 3. Generazione knowledge base
npm run generate:kb

# 4. Upload su Vapi
npm run sync:vapi
```

O tutto in un comando:
```bash
npm run sync:all && npm run sync:vapi
```
