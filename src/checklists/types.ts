import type { Condition, InputRef, Status } from '../rules/types.js';

export type ItemStatus = 'Met' | 'Not met' | 'No reading';

/**
 * How one checklist item is tested:
 * - `rule`: met when an existing rule's status is one of `metWhen` (No reading when the rule has no reading)
 * - `condition`: met when the condition holds on the latest readings
 * - `noEvent`: met when no catalyst whose event matches a keyword falls within the next `withinDays` days
 */
export type ChecklistTest =
  | { rule: { id: string; metWhen: Status[] } }
  | { condition: { requires: InputRef[]; met: Condition; reading: string } }
  | { noEvent: { withinDays: number; keywords: string[] } };

export interface ChecklistItem {
  id: string;
  name: string;
  test: ChecklistTest;
  why: string;
}

export interface Checklist {
  id: string;
  name: string;
  description: string;
  /** Watchlist symbols this checklist is about. */
  tickers: string[];
  items: ChecklistItem[];
}
