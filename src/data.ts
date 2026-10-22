import catalystsFile from '../data/catalysts.json';
import changesFile from '../data/changes.json';
import historyFile from '../data/history.json';
import regimeFile from '../data/regime.json';
import snapshotFile from '../data/snapshot.json';
import type { CatalystRow, ChangeRow, HistoryRow, RegimeRow } from '../shared/data-files.js';
import type { Snapshot } from '../shared/quotes.js';

declare const __DATA_COMMITS__: Record<string, string | null>;

export const regime = (regimeFile as RegimeRow[])[0];
export const changes = changesFile as ChangeRow[];
export const catalysts = catalystsFile as CatalystRow[];
export const history = historyFile as HistoryRow[];
export const snapshot = snapshotFile as Snapshot;

export const dataCommitTimes: Record<string, string | null> = __DATA_COMMITS__;
