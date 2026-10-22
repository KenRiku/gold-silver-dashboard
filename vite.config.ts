import { execFileSync } from 'node:child_process';
import { readdirSync } from 'node:fs';
import { defineConfig } from 'vite';

function lastCommitTime(path: string): string | null {
  try {
    return execFileSync('git', ['log', '-1', '--format=%cI', '--', path], { encoding: 'utf8' }).trim() || null;
  } catch {
    return null;
  }
}

const dataCommits = Object.fromEntries(
  readdirSync('data').filter((name) => name.endsWith('.json')).map((name) => [name, lastCommitTime(`data/${name}`)]),
);

export default defineConfig({
  define: { __DATA_COMMITS__: JSON.stringify(dataCommits) },
});
