import type { Category, CategoryId } from "./types";

export const CATEGORIES: Category[] = [
  { id: "social", label: "Social apps", blurb: "Talk, post and share" },
  { id: "ai-ml", label: "AI & machine learning", blurb: "Tools that learn from data" },
  { id: "design-creativity", label: "Design & creativity", blurb: "Make, draw and play" },
  { id: "productivity", label: "Productivity", blurb: "Get everyday things done" },
  { id: "research", label: "Research tools", blurb: "Collect, read and analyse" },
  { id: "data-viz", label: "Data visualization", blurb: "Turn numbers into pictures" },
  { id: "writing", label: "Writing & communication", blurb: "Words, documents, diagrams" },
  { id: "dev-tools", label: "Developer tools, made accessible", blurb: "Power tools without the jargon" },
];

export function getCategory(id: CategoryId): Category {
  const category = CATEGORIES.find((c) => c.id === id);
  if (!category) throw new Error(`Unknown category: ${id}`);
  return category;
}

export function isCategoryId(value: string | undefined | null): value is CategoryId {
  return CATEGORIES.some((c) => c.id === value);
}
