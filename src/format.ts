import type { LevelFormat, Market } from '../config/markets.js';
import type { Reading } from '../shared/quotes.js';

const MINUS = '−';

export function formatSigned(value: number, decimals: number): string {
  const fixed = Math.abs(value).toFixed(decimals);
  if (Number(fixed) === 0) return fixed;
  return (value < 0 ? MINUS : '+') + fixed;
}

const grouped = (decimals: number) => new Intl.NumberFormat('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
const LEVEL_FORMATTERS: Record<LevelFormat, (value: number) => string> = {
  usd0: (value) => '$' + grouped(0).format(value),
  usd2: (value) => '$' + grouped(2).format(value),
  percent2: (value) => value.toFixed(2) + '%',
  number0: (value) => grouped(0).format(value),
  number1: (value) => grouped(1).format(value),
  number2: (value) => grouped(2).format(value),
};

export function formatLevel(value: number, format: LevelFormat): string {
  return LEVEL_FORMATTERS[format](value);
}

export function formatDayChange(reading: Reading, market: Market): string {
  if (market.changeUnit === 'bp') return reading.chg_bp === null ? '—' : formatSigned(reading.chg_bp, 0) + ' bp';
  return reading.chg_pct === null ? '—' : formatSigned(reading.chg_pct, 2) + '%';
}

export function dayChangeDirection(reading: Reading): number {
  return Math.sign(reading.chg_pct ?? reading.chg_bp ?? 0);
}

export function formatAge(isoTime: string, now: Date): string {
  const seconds = Math.max(0, Math.round((now.getTime() - Date.parse(isoTime)) / 1000));
  if (seconds < 60) return `${seconds} s ago`;
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 48) return `${hours} h ago`;
  return `${Math.round(hours / 24)} days ago`;
}

export function formatTimestamp(isoTime: string): string {
  return new Date(isoTime).toLocaleString('en-US', {
    month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', timeZone: 'America/Los_Angeles', timeZoneName: 'short',
  });
}
