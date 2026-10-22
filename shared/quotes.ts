export type MarketGroup = 'Metals' | 'Miners' | 'Funds' | 'Rates' | 'FX' | 'Risk' | 'Energy' | 'Equities';

export type SourceKind = 'snapshot' | 'daily' | 'computed';

export interface Source {
  name: string;
  url: string;
  kind: SourceKind;
  symbol?: string;
}

export interface Reading {
  key: string;
  label: string;
  group: MarketGroup;
  value: number;
  prevClose: number | null;
  chg_pct: number | null;
  chg_bp: number | null;
  chg_1m_pct: number | null;
  asOf: string;
  delayMinutes: number | null;
  note: string;
  source: Source;
}

export interface QuoteError {
  key: string;
  reason: string;
}

export interface QuotesResponse {
  asOf: string;
  readings: Reading[];
  errors: QuoteError[];
}

export interface SnapshotRow {
  key: string;
  group: string;
  label: string;
  value: number | null;
  chg_pct: number | null;
  chg_bp: number | null;
  chg_1m_pct: number | null;
  shown: string;
  change_shown: string;
  note: string;
  source: string;
  url: string;
}

export interface Snapshot {
  asOf: string;
  readings: SnapshotRow[];
}
