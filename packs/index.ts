import type { RulePack } from '../src/rules/types.js';
import { macro } from './macro.js';
import { preciousMetals } from './precious-metals.js';
import { tech } from './tech.js';

export const activePacks: RulePack[] = [preciousMetals, macro, tech];
