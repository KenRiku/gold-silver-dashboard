import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { markets } from '../config/markets.js';

const dataDir = process.argv[2] ?? 'data';
const marketKeys = new Set(markets.map((market) => market.key));
const errors: string[] = [];

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const ISO_DATETIME = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d+)?)?(Z|[+-]\d{2}:\d{2})$/;
const MAX_FUTURE_MS = 60 * 60_000;

type Row = Record<string, unknown>;

function load(file: string): unknown {
  try {
    return JSON.parse(readFileSync(join(dataDir, file), 'utf8'));
  } catch (error) {
    errors.push(`${file}: cannot read or parse (${(error as Error).message})`);
    return undefined;
  }
}

function fail(file: string, where: string, problem: string): void {
  errors.push(`${file} ${where}: ${problem}`);
}

function rowsOf(file: string, data: unknown, { min = 0, max = Infinity } = {}): Row[] {
  if (!Array.isArray(data)) {
    if (data !== undefined) fail(file, '', 'must be an array');
    return [];
  }
  if (data.length < min || data.length > max) fail(file, '', `must have ${min}–${max === Infinity ? 'any' : max} rows, has ${data.length}`);
  return data.filter((row, index) => {
    const isObject = typeof row === 'object' && row !== null && !Array.isArray(row);
    if (!isObject) fail(file, `row ${index}`, 'must be an object');
    return isObject;
  });
}

function expectFields(file: string, where: string, row: Row, allowed: string[]): void {
  for (const field of Object.keys(row)) if (!allowed.includes(field)) fail(file, where, `unknown field "${field}"`);
}

function expectText(file: string, where: string, row: Row, field: string, { optional = false } = {}): void {
  const value = row[field];
  if (typeof value !== 'string') return fail(file, where, `"${field}" must be a string`);
  if (!optional && value.trim() === '') fail(file, where, `"${field}" must not be empty`);
}

function expectUrl(file: string, where: string, row: Row, field: string): void {
  expectText(file, where, row, field, { optional: true });
  const value = row[field];
  if (typeof value === 'string' && value !== '' && !value.startsWith('https://')) fail(file, where, `"${field}" must be an https:// URL or ""`);
}

function expectNumberOrNull(file: string, where: string, row: Row, field: string): void {
  const value = row[field];
  if (value !== null && (typeof value !== 'number' || !Number.isFinite(value))) fail(file, where, `"${field}" must be a number or null`);
}

function expectPastTime(file: string, where: string, value: unknown, pattern: RegExp): void {
  if (typeof value !== 'string' || !pattern.test(value) || Number.isNaN(Date.parse(value))) return fail(file, where, `must be ${pattern === ISO_DATE ? 'YYYY-MM-DD' : 'an ISO date-time with zone'}, got ${JSON.stringify(value)}`);
  if (Date.parse(value) > Date.now() + MAX_FUTURE_MS) fail(file, where, `${value} is in the future`);
}

function validateRegime(): void {
  const file = 'regime.json';
  rowsOf(file, load(file), { min: 1, max: 1 }).forEach((row, index) => {
    const where = `row ${index}`;
    expectFields(file, where, row, ['regime', 'takeaway', 'as_of', 'run']);
    for (const field of ['regime', 'takeaway', 'as_of', 'run']) expectText(file, where, row, field);
  });
}

function validateChanges(): void {
  const file = 'changes.json';
  rowsOf(file, load(file), { min: 1, max: 20 }).forEach((row, index) => {
    const where = `row ${index}`;
    expectFields(file, where, row, ['n', 'text', 'source', 'url']);
    if (!Number.isInteger(row.n)) fail(file, where, '"n" must be an integer');
    expectText(file, where, row, 'text');
    expectText(file, where, row, 'source');
    expectUrl(file, where, row, 'url');
  });
}

function validateCatalysts(): void {
  const file = 'catalysts.json';
  rowsOf(file, load(file), { max: 30 }).forEach((row, index) => {
    const where = `row ${index}`;
    expectFields(file, where, row, ['date', 'when', 'event', 'why', 'url']);
    if (typeof row.date !== 'string' || !ISO_DATE.test(row.date)) fail(file, where, '"date" must be YYYY-MM-DD');
    for (const field of ['when', 'event', 'why']) expectText(file, where, row, field);
    expectUrl(file, where, row, 'url');
  });
}

function validateHistory(): void {
  const file = 'history.json';
  let previousDate = '';
  rowsOf(file, load(file), { min: 1 }).forEach((row, index) => {
    const where = `row ${index}`;
    expectPastTime(file, `${where} "date"`, row.date, ISO_DATE);
    if (typeof row.date === 'string') {
      if (row.date <= previousDate) fail(file, where, `dates must be unique and ascending (${row.date} after ${previousDate})`);
      previousDate = row.date;
    }
    for (const field of Object.keys(row)) {
      if (field === 'date') continue;
      if (!marketKeys.has(field)) fail(file, where, `unknown market "${field}"`);
      else expectNumberOrNull(file, where, row, field);
    }
  });
}

function validateSnapshot(): void {
  const file = 'snapshot.json';
  const data = load(file) as Row | undefined;
  if (data === undefined) return;
  if (typeof data !== 'object' || data === null || Array.isArray(data)) return fail(file, '', 'must be an object { asOf, readings }');
  expectFields(file, '', data, ['asOf', 'readings']);
  expectPastTime(file, '"asOf"', data.asOf, ISO_DATETIME);
  const seen = new Set<string>();
  rowsOf(file, data.readings, { min: 1 }).forEach((row, index) => {
    const where = `reading ${index}${typeof row.key === 'string' ? ` (${row.key})` : ''}`;
    expectFields(file, where, row, ['key', 'group', 'label', 'value', 'chg_pct', 'chg_bp', 'chg_1m_pct', 'shown', 'change_shown', 'note', 'source', 'url']);
    if (typeof row.key !== 'string' || !marketKeys.has(row.key)) fail(file, where, `"key" must be one of ${[...marketKeys].join(', ')}`);
    else if (seen.has(row.key)) fail(file, where, 'duplicate key');
    else seen.add(row.key);
    for (const field of ['group', 'label', 'shown', 'change_shown']) expectText(file, where, row, field);
    expectText(file, where, row, 'note', { optional: true });
    for (const field of ['value', 'chg_pct', 'chg_bp', 'chg_1m_pct']) expectNumberOrNull(file, where, row, field);
    if (row.value !== null) expectText(file, where, row, 'source');
    else expectText(file, where, row, 'source', { optional: true });
    expectUrl(file, where, row, 'url');
  });
}

validateRegime();
validateChanges();
validateCatalysts();
validateHistory();
validateSnapshot();

if (errors.length) {
  console.error(`validate-data: ${errors.length} problem(s) in ${dataDir}/\n` + errors.map((error) => `  - ${error}`).join('\n'));
  process.exit(1);
}
console.log(`validate-data: all 5 files in ${dataDir}/ are valid`);
