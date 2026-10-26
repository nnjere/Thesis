import { getCategory } from "./categories";
import type { CategoryId, Project, ProjectType, RunStatus } from "./types";

/**
 * Keyword search over the local catalog.
 *
 * This is not AI. It handles natural-language queries by dropping filler
 * words, applying light stemming and expanding a small hand-written synonym
 * list. A future provider (GitHub search, embeddings) implements the same
 * `SearchProvider` interface.
 */

export interface SearchFilters {
  category?: CategoryId;
  type?: ProjectType;
  /** Only projects you can try in this app right now (for real). */
  runnableOnly?: boolean;
}

export interface SearchHit {
  project: Project;
  score: number;
  matchedTerms: string[];
}

export interface SearchResult {
  query: string;
  hits: SearchHit[];
  /** True when nothing matched strongly and hits are only loose matches. */
  approximate: boolean;
  /** Which engine produced the results, shown to users for transparency. */
  engine: "local-keyword";
}

export interface SearchProvider {
  readonly id: string;
  search(query: string, filters?: SearchFilters): Promise<SearchResult>;
}

const STOPWORDS = new Set(
  "a an the and or of for to in on with without that which who what is are be can could something some any anything tool tools app apps application program software thing things me my i want need find looking help helps lets let do does using use make makes it its from into by like".split(
    " ",
  ),
);

/** Groups of words treated as near-synonyms. */
const SYNONYM_GROUPS: string[][] = [
  ["visualize", "visualise", "visualization", "visualisation", "chart", "graph", "plot", "dashboard", "dataviz"],
  ["background", "cutout", "transparent"],
  ["remove", "erase", "delete", "strip"],
  ["summarize", "summarise", "summary", "tldr", "digest"],
  ["art", "generative", "creative", "artwork", "drawing", "sketch"],
  ["document", "doc", "docs", "pdf", "file", "word"],
  ["color", "colour", "palette", "swatch"],
  ["transcribe", "transcription", "speech", "audio", "voice", "subtitle", "caption"],
  ["diagram", "flowchart", "whiteboard"],
  ["note", "notebook", "knowledge", "journal"],
  ["image", "photo", "picture", "img"],
  ["ai", "ml", "model", "intelligence", "learning"],
  ["write", "writing", "text", "prose", "essay"],
  ["convert", "conversion", "transform", "converter"],
  ["research", "academic", "science", "study", "thesis"],
  ["data", "dataset", "spreadsheet", "csv", "numbers"],
];

const SYNONYMS = new Map<string, string[]>();
for (const group of SYNONYM_GROUPS) {
  for (const word of group) {
    const stem = stemWord(word);
    const existing = SYNONYMS.get(stem) ?? [];
    SYNONYMS.set(stem, [...new Set([...existing, ...group.map(stemWord).filter((w) => w !== stem)])]);
  }
}

export function stemWord(word: string): string {
  let w = word.toLowerCase();
  if (w.length > 5 && w.endsWith("ing")) w = w.slice(0, -3);
  else if (w.length > 4 && w.endsWith("ies")) w = w.slice(0, -3) + "y";
  else if (w.length > 4 && (w.endsWith("ses") || w.endsWith("xes"))) w = w.slice(0, -2);
  else if (w.length > 4 && w.endsWith("ed")) w = w.slice(0, -2);
  else if (w.length > 3 && w.endsWith("s") && !w.endsWith("ss")) w = w.slice(0, -1);
  if (w.length > 5 && w.endsWith("e")) w = w.slice(0, -1);
  return w;
}

export function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\p{L}\p{N}\s.-]/gu, " ")
    .split(/[\s-]+/)
    .map((t) => t.replace(/^\.+|\.+$/g, ""))
    .filter(Boolean);
}

export function queryTerms(query: string): string[] {
  return [...new Set(tokenize(query).filter((t) => !STOPWORDS.has(t)).map(stemWord))];
}

const FIELD_WEIGHTS = {
  name: 6,
  tags: 4,
  keywords: 4,
  tagline: 3,
  category: 2,
  uses: 2,
  description: 1,
} as const;

type IndexedProject = { project: Project; fields: Record<keyof typeof FIELD_WEIGHTS, Set<string>> };

function indexProject(project: Project): IndexedProject {
  const stems = (text: string) => new Set(tokenize(text).map(stemWord));
  return {
    project,
    fields: {
      name: stems(project.name),
      tags: stems(project.tags.join(" ")),
      keywords: stems(project.keywords.join(" ")),
      tagline: stems(project.tagline),
      category: stems(getCategory(project.category).label),
      uses: stems(project.uses.join(" ")),
      description: stems(project.description),
    },
  };
}

function scoreTerm(indexed: IndexedProject, term: string): number {
  let best = 0;
  for (const [field, weight] of Object.entries(FIELD_WEIGHTS) as [keyof typeof FIELD_WEIGHTS, number][]) {
    if (indexed.fields[field].has(term)) best = Math.max(best, weight);
  }
  if (best > 0) return best;
  // Synonyms count, but less than the exact word.
  for (const synonym of SYNONYMS.get(term) ?? []) {
    for (const [field, weight] of Object.entries(FIELD_WEIGHTS) as [keyof typeof FIELD_WEIGHTS, number][]) {
      if (indexed.fields[field].has(synonym)) best = Math.max(best, weight * 0.6);
    }
  }
  if (best > 0) return best;
  // Prefix match on the name, so "excali" finds Excalidraw.
  if (term.length >= 3) {
    for (const word of indexed.fields.name) if (word.startsWith(term)) return FIELD_WEIGHTS.name * 0.8;
  }
  return 0;
}

const STATUS_ORDER: Record<RunStatus, number> = { verified: 0, ready: 1, experimental: 2, "not-runnable": 3 };

export function isTryableHere(project: Project): boolean {
  return project.launch.kind === "embedded-web-app" || project.launch.kind === "tool-form";
}

export function matchesFilters(project: Project, filters: SearchFilters): boolean {
  if (filters.category && project.category !== filters.category) return false;
  if (filters.type && project.type !== filters.type) return false;
  if (filters.runnableOnly && !isTryableHere(project)) return false;
  return true;
}

export function searchCatalog(projects: Project[], query: string, filters: SearchFilters = {}): SearchResult {
  const candidates = projects.filter((p) => matchesFilters(p, filters));
  const terms = queryTerms(query);

  if (terms.length === 0) {
    const hits = [...candidates]
      .sort((a, b) => STATUS_ORDER[a.status] - STATUS_ORDER[b.status] || b.popularity - a.popularity)
      .map((project) => ({ project, score: 0, matchedTerms: [] }));
    return { query, hits, approximate: false, engine: "local-keyword" };
  }

  const hits: SearchHit[] = [];
  for (const project of candidates) {
    const indexed = indexProject(project);
    let score = 0;
    const matchedTerms: string[] = [];
    for (const term of terms) {
      const s = scoreTerm(indexed, term);
      if (s > 0) {
        score += s;
        matchedTerms.push(term);
      }
    }
    if (score === 0) continue;
    // Reward projects that match more of what was asked for.
    const coverage = matchedTerms.length / terms.length;
    score = score * (0.5 + coverage) + project.popularity / 200;
    hits.push({ project, score, matchedTerms });
  }

  hits.sort((a, b) => b.score - a.score);
  const best = hits[0];
  // Be candid: unless the best hit covers most of what was asked, say so.
  const approximate = !best || best.matchedTerms.length / terms.length < 0.75;
  return { query, hits, approximate, engine: "local-keyword" };
}

export class LocalCatalogSearch implements SearchProvider {
  readonly id = "local-catalog";
  constructor(private readonly projects: Project[]) {}
  async search(query: string, filters?: SearchFilters): Promise<SearchResult> {
    return searchCatalog(this.projects, query, filters);
  }
}
