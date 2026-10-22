export interface RegimeRow {
  regime: string;
  takeaway: string;
  as_of: string;
  run: string;
}

export interface ChangeRow {
  n: number;
  text: string;
  source: string;
  url: string;
}

export interface CatalystRow {
  date: string;
  when: string;
  event: string;
  why: string;
  url: string;
}

export interface HistoryRow {
  date: string;
  [marketKey: string]: number | string | null;
}
