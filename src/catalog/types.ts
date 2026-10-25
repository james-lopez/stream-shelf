export type Show = {
  id: number;
  name: string;
  genres: string[];
  rating: number | null;
  /** TVMaze popularity score (0–100); our stand-in for "trending". */
  weight: number;
  premiered: string | null;
  runtime: number | null;
  language: string | null;
  status: string;
  network: string | null;
  summary: string;
  image: { medium: string; original: string } | null;
};

/** Enough to draw a tile; what My List persists. */
export type ShowSummary = Pick<Show, 'id' | 'name' | 'image'>;

export interface CatalogService {
  getShows(): Promise<Show[]>;
  getShow(id: number): Promise<Show>;
}

export class CatalogError extends Error {
  constructor(
    message: string,
    readonly kind: 'network' | 'not_found' | 'simulated',
  ) {
    super(message);
    this.name = 'CatalogError';
  }
}
