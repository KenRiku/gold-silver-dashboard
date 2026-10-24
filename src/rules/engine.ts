import type { WatchlistEntry } from '../../config/watchlist.js';
import { formatSigned } from '../format.js';
import type { Comparison, Condition, InputRef, Rule, RulePack, Status } from './types.js';

export interface RuleInput {
  value: number | null;
  chg_pct: number | null;
  chg_bp: number | null;
  chg_1m_pct: number | null;
}

export type RuleInputs = Map<string, RuleInput>;

export interface RuleCheck {
  rule: Rule;
  status: Status;
  reading: string;
  tickers: string[];
  inputKeys: string[];
}

const STATUS_ORDER: Record<Status, number> = { On: 0, Watch: 1, Off: 2, 'No reading': 3 };

export function checkRules(packs: RulePack[], inputs: RuleInputs, watchlist: WatchlistEntry[]): RuleCheck[] {
  return packs
    .flatMap((pack) => pack.rules)
    .map((rule) => ({
      rule,
      status: ruleStatus(rule, inputs),
      reading: renderReading(rule.reading, inputs),
      tickers: tickersTouchedBy(rule, watchlist),
      inputKeys: inputKeysOf(rule),
    }))
    .sort((a, b) => STATUS_ORDER[a.status] - STATUS_ORDER[b.status]);
}

export function tickersTouchedBy(rule: Rule, watchlist: WatchlistEntry[]): string[] {
  return watchlist.filter((entry) => entry.exposures.some((tag) => rule.tags.includes(tag))).map((entry) => entry.symbol);
}

function ruleStatus(rule: Rule, inputs: RuleInputs): Status {
  const present = (ref: InputRef) => valueOf(ref, inputs) !== null;
  const hasInputs = 'allOf' in rule.requires ? rule.requires.allOf.every(present) : rule.requires.anyOf.some(present);
  if (!hasInputs) return 'No reading';
  if (holds(rule.on, inputs)) return 'On';
  if (holds(rule.watch, inputs)) return 'Watch';
  return 'Off';
}

/** A condition with a missing input never holds; missing values are never treated as zero. */
export function holds(condition: Condition, inputs: RuleInputs): boolean {
  if ('allOf' in condition) return condition.allOf.every((part) => holds(part, inputs));
  if ('anyOf' in condition) return condition.anyOf.some((part) => holds(part, inputs));
  if ('threshold' in condition) {
    const { input, op, value } = condition.threshold;
    const actual = valueOf(input, inputs);
    return actual !== null && compare(actual, op, value);
  }
  if ('relative' in condition) {
    const { a, b, op, multiple } = condition.relative;
    const left = valueOf(a, inputs);
    const right = valueOf(b, inputs);
    return left !== null && right !== null && compare(left, op, multiple * right);
  }
  const { key, op, value } = condition.trend;
  const change = valueOf({ key, field: 'chg_1m_pct' }, inputs);
  return change !== null && compare(change, op, value);
}

function compare(actual: number, op: Comparison, limit: number): boolean {
  switch (op) {
    case '<': return actual < limit;
    case '<=': return actual <= limit;
    case '>': return actual > limit;
    case '>=': return actual >= limit;
  }
}

export function valueOf(ref: InputRef, inputs: RuleInputs): number | null {
  const raw = inputs.get(ref.key)?.[ref.field];
  return raw === null || raw === undefined || !Number.isFinite(raw) ? null : raw;
}

const PLACEHOLDER = /\{(\w+)\.(\w+):(\w+)\}/g;
const OPTIONAL_SEGMENT = /\[([^\]]*)\]/g;

export function renderReading(template: string, inputs: RuleInputs): string {
  const value = (key: string, field: string) => valueOf({ key, field: field as InputRef['field'] }, inputs);
  const withOptionals = template.replace(OPTIONAL_SEGMENT, (_, segment: string) =>
    [...segment.matchAll(PLACEHOLDER)].every(([, key, field]) => value(key, field) !== null) ? segment : '',
  );
  return withOptionals.replace(PLACEHOLDER, (_, key: string, field: string, format: string) => formatPlaceholder(value(key, field), format));
}

function formatPlaceholder(value: number | null, format: string): string {
  if (value === null) return 'n/a';
  switch (format) {
    case 'pct': return formatSigned(value, 1) + '%';
    case 'bp': return formatSigned(Math.round(value), 0) + ' bp';
    case 'usd0': return '$' + Math.round(value).toLocaleString('en-US');
    case 'usd2': return '$' + value.toFixed(2);
    default: return value.toFixed(1);
  }
}

function inputKeysOf(rule: Rule): string[] {
  const refs = 'allOf' in rule.requires ? rule.requires.allOf : rule.requires.anyOf;
  return inputKeysFrom(refs, rule.reading);
}

export function inputKeysFrom(refs: InputRef[], template: string): string[] {
  const fromTemplate = [...template.matchAll(PLACEHOLDER)].map(([, key]) => key);
  return [...new Set([...refs.map((ref) => ref.key), ...fromTemplate])];
}
