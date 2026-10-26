import { PROJECTS } from "./data";
import { LocalCatalogSearch, type SearchProvider } from "./search";
import type { CategoryId, Project } from "./types";

/**
 * Read access to the catalog. Everything else in the app goes through these
 * functions so the local array can later be swapped for a database.
 */

export function listProjects(): Project[] {
  return PROJECTS;
}

export function getProject(slug: string): Project | undefined {
  return PROJECTS.find((p) => p.slug === slug);
}

export function getProjectByRepo(owner: string, name: string): Project | undefined {
  const o = owner.toLowerCase();
  const n = name.toLowerCase();
  return PROJECTS.find((p) => p.repo && p.repo.owner.toLowerCase() === o && p.repo.name.toLowerCase() === n);
}

export function featuredProjects(): Project[] {
  return PROJECTS.filter((p) => p.featured);
}

export function recentProjects(limit = 4): Project[] {
  return [...PROJECTS].sort((a, b) => b.addedAt.localeCompare(a.addedAt)).slice(0, limit);
}

export function popularProjects(limit = 4): Project[] {
  return [...PROJECTS].sort((a, b) => b.popularity - a.popularity).slice(0, limit);
}

export function projectsInCategory(category: CategoryId): Project[] {
  return PROJECTS.filter((p) => p.category === category);
}

export function resolveAlternatives(project: Project): Project[] {
  return (project.alternatives ?? []).map(getProject).filter((p): p is Project => Boolean(p));
}

/**
 * The active search provider. A future `GitHubSearchProvider` (public
 * repository search, read-only) would be selected here.
 */
export function getSearchProvider(): SearchProvider {
  return new LocalCatalogSearch(PROJECTS);
}

export * from "./types";
export { CATEGORIES, getCategory, isCategoryId } from "./categories";
export { isTryableHere } from "./search";
