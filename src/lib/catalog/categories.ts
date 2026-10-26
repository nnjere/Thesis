import type { Category, CategoryId } from "./types";

export const CATEGORIES: Category[] = [
  { id: "ai-ml", label: "AI & machine learning", blurb: "Tools that learn from data", icon: "🤖" },
  { id: "design-creativity", label: "Design & creativity", blurb: "Make, draw and play", icon: "🎨" },
  { id: "productivity", label: "Productivity", blurb: "Get everyday things done", icon: "⚡" },
  { id: "research", label: "Research tools", blurb: "Collect, read and analyse", icon: "🔬" },
  { id: "data-viz", label: "Data visualization", blurb: "Turn numbers into pictures", icon: "📊" },
  { id: "writing", label: "Writing & communication", blurb: "Words, documents, diagrams", icon: "✍️" },
  { id: "dev-tools", label: "Developer tools, made accessible", blurb: "Power tools without the jargon", icon: "🧰" },
];

export function getCategory(id: CategoryId): Category {
  const category = CATEGORIES.find((c) => c.id === id);
  if (!category) throw new Error(`Unknown category: ${id}`);
  return category;
}

export function isCategoryId(value: string | undefined | null): value is CategoryId {
  return CATEGORIES.some((c) => c.id === value);
}
