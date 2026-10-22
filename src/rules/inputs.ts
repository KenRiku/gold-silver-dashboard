import type { Comparison, Condition, InputRef } from './types.js';

export const dayPct = (key: string): InputRef => ({ key, field: 'chg_pct' });
export const dayBp = (key: string): InputRef => ({ key, field: 'chg_bp' });
export const level = (key: string): InputRef => ({ key, field: 'value' });
export const monthPct = (key: string): InputRef => ({ key, field: 'chg_1m_pct' });

export const when = (input: InputRef, op: Comparison, value: number): Condition => ({ threshold: { input, op, value } });
