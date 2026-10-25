// Snapshots one page of TVMaze /shows into src/catalog/fixtures/shows.json,
// trimmed to the fields TvMazeShow declares. Run: npm run fixtures
import { writeFile } from 'node:fs/promises';

const KEEP = [
  'id', 'name', 'language', 'genres', 'status', 'runtime', 'averageRuntime',
  'premiered', 'rating', 'weight', 'network', 'webChannel', 'image', 'summary',
];

const res = await fetch('https://api.tvmaze.com/shows?page=0');
if (!res.ok) throw new Error(`TVMaze responded ${res.status}`);
const shows = await res.json();

const trimmed = shows.map((show) => {
  const out = Object.fromEntries(KEEP.map((k) => [k, show[k] ?? null]));
  out.network = show.network && { name: show.network.name };
  out.webChannel = show.webChannel && { name: show.webChannel.name };
  return out;
});

const target = new URL('../src/catalog/fixtures/shows.json', import.meta.url);
await writeFile(target, JSON.stringify(trimmed, null, 1) + '\n');
console.log(`Wrote ${trimmed.length} shows to ${target.pathname}`);
