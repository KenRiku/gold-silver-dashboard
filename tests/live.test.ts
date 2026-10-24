import { describe, expect, it } from 'vitest';
import { readingFromFinnhubQuote } from '../api/_providers/finnhub.js';
import { readingsFromLive, type LiveProvider } from '../api/_providers/live.js';
import type { Market } from '../config/markets.js';
import type { ProviderReading } from '../shared/provider.js';

const NOW = new Date('2026-10-23T18:00:00Z');
const gdx: Market = { key: 'gdx', label: 'GDX', group: 'Miners', format: 'usd2', changeUnit: 'pct', live: [{ provider: 'finnhub', symbol: 'GDX' }] };

describe('Finnhub quote', () => {
  it('turns a quote into a reading with the day change against the previous close', () => {
    const reading = readingFromFinnhubQuote(gdx, 'GDX', { c: 82.5, pc: 84, t: 1792778400 }, NOW)!;
    expect(reading.value).toBe(82.5);
    expect(reading.prevClose).toBe(84);
    expect(reading.chg_pct).toBe(-1.79);
    expect(reading.asOf).toBe(new Date(1792778400 * 1000).toISOString());
    expect(reading.source).toMatchObject({ name: 'Finnhub', kind: 'live', symbol: 'GDX' });
  });

  it('treats a zero price as not covered', () => {
    expect(readingFromFinnhubQuote(gdx, 'GDX', { c: 0, pc: 0, t: 0 }, NOW)).toBeNull();
  });

  it('leaves the change empty without a previous close', () => {
    expect(readingFromFinnhubQuote(gdx, 'GDX', { c: 82.5 }, NOW)!.chg_pct).toBeNull();
  });
});

function fakeProvider(id: string, answer: ProviderReading | null | Error, configured = true): LiveProvider {
  return {
    id,
    name: id,
    isConfigured: () => configured,
    fetchReading: async () => {
      if (answer instanceof Error) throw answer;
      return answer;
    },
  };
}

const reading = (name: string): ProviderReading => ({
  key: 'gdx', value: 80, prevClose: 81, chg_pct: -1.23, chg_bp: null, chg_1m_pct: null,
  asOf: NOW.toISOString(), delayMinutes: null, note: '', source: { name, url: 'https://example.com', kind: 'live' },
});

describe('live provider chain', () => {
  const twoSources: Market = { ...gdx, live: [{ provider: 'finnhub', symbol: 'GDX' }, { provider: 'finnhub', symbol: 'GDX.backup' }] };

  it('uses the first provider that answers', async () => {
    const result = await readingsFromLive([gdx], NOW, [fakeProvider('finnhub', reading('primary'))]);
    expect(result.readings[0].source.name).toBe('primary');
    expect(result.misses).toEqual({});
  });

  it('falls through to the next source when the first has no data', async () => {
    let calls = 0;
    const provider: LiveProvider = {
      ...fakeProvider('finnhub', null),
      fetchReading: async (_market, symbol) => (++calls === 1 ? null : { ...reading('backup'), source: { ...reading('backup').source, symbol } }),
    };
    const result = await readingsFromLive([twoSources], NOW, [provider]);
    expect(result.readings[0].source.symbol).toBe('GDX.backup');
  });

  it('records why a market got no live reading', async () => {
    const failing = await readingsFromLive([gdx], NOW, [fakeProvider('finnhub', new Error('HTTP 429'))]);
    expect(failing.readings).toHaveLength(0);
    expect(failing.misses.gdx).toContain('HTTP 429');

    const unconfigured = await readingsFromLive([gdx], NOW, [fakeProvider('finnhub', reading('primary'), false)]);
    expect(unconfigured.misses.gdx).toContain('API key not set');
  });
});
