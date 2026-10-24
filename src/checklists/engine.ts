import type { CatalystRow } from '../../shared/data-files.js';
import { holds, inputKeysFrom, renderReading, valueOf, type RuleCheck, type RuleInputs } from '../rules/engine.js';
import type { Checklist, ChecklistItem, ItemStatus } from './types.js';

export interface ItemCheck {
  item: ChecklistItem;
  status: ItemStatus;
  reading: string;
  inputKeys: string[];
  /** For event items: the first matching event inside the window, if any. */
  event?: CatalystRow;
}

export interface ChecklistResult {
  checklist: Checklist;
  items: ItemCheck[];
  met: number;
  noReading: number;
  total: number;
  verdict: string;
}

const DAY_MS = 86_400_000;

export function evaluateChecklist(
  checklist: Checklist,
  checks: RuleCheck[],
  inputs: RuleInputs,
  catalysts: CatalystRow[],
  now: Date,
): ChecklistResult {
  const items = checklist.items.map((item) => checkItem(item, checks, inputs, catalysts, now));
  const met = items.filter((check) => check.status === 'Met').length;
  const noReading = items.filter((check) => check.status === 'No reading').length;
  return { checklist, items, met, noReading, total: items.length, verdict: verdictFor(met, noReading, items.length) };
}

function checkItem(item: ChecklistItem, checks: RuleCheck[], inputs: RuleInputs, catalysts: CatalystRow[], now: Date): ItemCheck {
  const { test } = item;

  if ('rule' in test) {
    const check = checks.find((candidate) => candidate.rule.id === test.rule.id);
    if (!check || check.status === 'No reading') {
      return { item, status: 'No reading', reading: check?.reading ?? 'Rule not found', inputKeys: check?.inputKeys ?? [] };
    }
    return { item, status: test.rule.metWhen.includes(check.status) ? 'Met' : 'Not met', reading: check.reading, inputKeys: check.inputKeys };
  }

  if ('condition' in test) {
    const { requires, met, reading } = test.condition;
    const inputKeys = inputKeysFrom(requires, reading);
    const rendered = renderReading(reading, inputs);
    if (!requires.every((ref) => valueOf(ref, inputs) !== null)) return { item, status: 'No reading', reading: rendered, inputKeys };
    return { item, status: holds(met, inputs) ? 'Met' : 'Not met', reading: rendered, inputKeys };
  }

  const { withinDays, keywords } = test.noEvent;
  const event = upcomingEvents(catalysts, keywords, now, withinDays)[0];
  return event
    ? { item, status: 'Not met', reading: `${event.event} · ${event.when}`, inputKeys: [], event }
    : { item, status: 'Met', reading: `None in the next ${withinDays} days`, inputKeys: [] };
}

/** Catalysts from today (Pacific) through today + `withinDays`, whose event mentions any keyword, soonest first. */
export function upcomingEvents(catalysts: CatalystRow[], keywords: string[], now: Date, withinDays: number): CatalystRow[] {
  const today = pacificDate(now);
  const last = new Date(Date.parse(today + 'T00:00:00Z') + withinDays * DAY_MS).toISOString().slice(0, 10);
  const lowered = keywords.map((keyword) => keyword.toLowerCase());
  return catalysts
    .filter((row) => row.date >= today && row.date <= last)
    .filter((row) => lowered.some((keyword) => row.event.toLowerCase().includes(keyword)))
    .sort((a, b) => a.date.localeCompare(b.date));
}

export function pacificDate(now: Date): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Los_Angeles', year: 'numeric', month: '2-digit', day: '2-digit' }).format(now);
}

function verdictFor(met: number, noReading: number, total: number): string {
  if (total === 0 || noReading === total) return 'No readings yet';
  if (met === total) return 'All conditions in place';
  const share = met / total;
  if (share >= 0.75) return 'Most conditions in place';
  if (share >= 0.4) return 'Mixed: some conditions in place';
  return 'Few conditions in place';
}
