import type { VercelRequest, VercelResponse } from '@vercel/node';
import { buildServer } from '../src/app.js';

let app: Awaited<ReturnType<typeof buildServer>> | null = null;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!app) {
    app = await buildServer();
    await app.ready();
  }
  app.server.emit('request', req, res);
}
