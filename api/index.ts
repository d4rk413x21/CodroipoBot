import { buildServer } from '../src/app.js';
import type { VercelRequest, VercelResponse } from '@vercel/node';

let serverInstance: Awaited<ReturnType<typeof buildServer>> | null = null;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!serverInstance) {
    serverInstance = await buildServer();
    await serverInstance.ready();
  }
  serverInstance.routing(req, res);
}
