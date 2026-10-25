import type { Show } from './types';

/** The subset of a TVMaze show payload we read. Fixtures are trimmed to this shape. */
export type TvMazeShow = {
  id: number;
  name: string;
  language: string | null;
  genres: string[];
  status: string;
  runtime: number | null;
  averageRuntime: number | null;
  premiered: string | null;
  rating: { average: number | null };
  weight: number;
  network: { name: string } | null;
  webChannel: { name: string } | null;
  image: { medium: string; original: string } | null;
  summary: string | null;
};

const ENTITIES: Record<string, string> = { amp: '&', lt: '<', gt: '>', quot: '"', '#39': "'", nbsp: ' ' };

// Summaries are HTML; we render plain text rather than pull in an HTML renderer.
export function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, '')
    .replace(/&(amp|lt|gt|quot|#39|nbsp);/g, (_, e: string) => ENTITIES[e])
    .trim();
}

export function toShow(raw: TvMazeShow): Show {
  return {
    id: raw.id,
    name: raw.name,
    genres: raw.genres,
    rating: raw.rating.average,
    weight: raw.weight,
    premiered: raw.premiered,
    runtime: raw.runtime ?? raw.averageRuntime,
    language: raw.language,
    status: raw.status,
    network: raw.network?.name ?? raw.webChannel?.name ?? null,
    summary: raw.summary ? stripHtml(raw.summary) : '',
    image: raw.image,
  };
}
