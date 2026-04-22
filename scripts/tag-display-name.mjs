import { normalizedTags } from "./tag-taxonomy.mjs";

const normalizedTagNameBySlug = new Map(
  normalizedTags.map((tag) => [tag.slug, tag.name]),
);

const acronymByWord = new Map([
  ["ai", "AI"],
  ["api", "API"],
  ["crm", "CRM"],
  ["seo", "SEO"],
  ["sms", "SMS"],
  ["hr", "HR"],
  ["ui", "UI"],
  ["ux", "UX"],
  ["b2b", "B2B"],
  ["b2c", "B2C"],
]);

export function slugify(value) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 80);
}

function humanizeSlug(slug) {
  return slug
    .split("-")
    .filter(Boolean)
    .map((word) => {
      const acronym = acronymByWord.get(word);

      if (acronym) {
        return acronym;
      }

      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(" ");
}

export function getTagDisplayName(rawValue) {
  const normalizedSlug = slugify(rawValue);

  if (!normalizedSlug) {
    return "";
  }

  return normalizedTagNameBySlug.get(normalizedSlug) ?? humanizeSlug(normalizedSlug);
}
