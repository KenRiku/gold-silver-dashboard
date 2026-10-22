import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import type { Snapshot } from '../shared/quotes.js';
import { buildQuotes } from './_quotes.js';

export default async function handler(_request: VercelRequest, response: VercelResponse) {
  const snapshot: Snapshot = JSON.parse(await readFile(join(process.cwd(), 'data', 'snapshot.json'), 'utf8'));
  const quotes = await buildQuotes(snapshot, new Date());
  response.setHeader('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300');
  response.status(200).json(quotes);
}
