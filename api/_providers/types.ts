import type { Reading } from '../../shared/quotes.js';

export type ProviderReading = Omit<Reading, 'label' | 'group'>;

export interface ProviderResult {
  readings: ProviderReading[];
  missingNotes: Record<string, string>;
}
