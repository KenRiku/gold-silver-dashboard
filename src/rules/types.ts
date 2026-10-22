export type Status = 'On' | 'Watch' | 'Off' | 'No reading';

export type Field = 'value' | 'chg_pct' | 'chg_bp' | 'chg_1m_pct';

export type Comparison = '<' | '<=' | '>' | '>=';

export interface InputRef {
  key: string;
  field: Field;
}

export type Condition =
  | { threshold: { input: InputRef; op: Comparison; value: number } }
  | { relative: { a: InputRef; b: InputRef; op: Comparison; multiple: number } }
  | { trend: { key: string; period: '1m'; op: Comparison; value: number } }
  | { allOf: Condition[] }
  | { anyOf: Condition[] };

export interface Rule {
  id: string;
  name: string;
  tags: string[];
  requires: { allOf: InputRef[] } | { anyOf: InputRef[] };
  on: Condition;
  watch: Condition;
  /** `{key.field:format}` placeholders; a `[...]` segment is dropped when any placeholder in it has no value. */
  reading: string;
  condition: string;
  pattern: string;
}

export interface RulePack {
  id: string;
  name: string;
  rules: Rule[];
}
