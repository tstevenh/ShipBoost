type ToolPageSeoInput = {
  name: string;
  tagline: string;
  richDescription: string;
  metaTitle: string | null;
  metaDescription: string | null;
};

type ToolTimelineInput = {
  createdAt: Date;
  launches: Array<{
    launchDate: Date;
  }>;
};

function collapseWhitespace(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function stripMarkdown(value: string) {
  return collapseWhitespace(
    value
      .replace(/```[\s\S]*?```/g, " ")
      .replace(/`([^`]*)`/g, "$1")
      .replace(/!\[([^\]]*)\]\([^)]+\)/g, "$1")
      .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
      .replace(/^>\s?/gm, "")
      .replace(/^#{1,6}\s+/gm, "")
      .replace(/[*_~]/g, "")
      .replace(/^\s*[-*+]\s+/gm, "")
      .replace(/^\s*\d+\.\s+/gm, "")
      .replace(/\|/g, " "),
  );
}

function ensureSentence(value: string) {
  const trimmed = collapseWhitespace(value).replace(/[.!?\s]+$/, "");

  if (!trimmed) {
    return "";
  }

  return `${trimmed}.`;
}

function trimAtWordBoundary(value: string, maxLength: number) {
  const normalized = collapseWhitespace(value);

  if (normalized.length <= maxLength) {
    return normalized;
  }

  const sliced = normalized.slice(0, maxLength + 1);
  const boundaryIndex = sliced.lastIndexOf(" ");
  const safeSlice =
    boundaryIndex > Math.floor(maxLength * 0.6)
      ? sliced.slice(0, boundaryIndex)
      : normalized.slice(0, maxLength);

  return `${safeSlice.trim()}...`;
}

function extractBenefitSentence(richDescription: string, tagline: string) {
  const plain = stripMarkdown(richDescription);
  const firstSentence =
    plain.match(/.+?[.!?](?:\s|$)/)?.[0] ?? plain.slice(0, 160);
  const normalizedSentence = collapseWhitespace(firstSentence);
  const normalizedTagline = collapseWhitespace(tagline).toLowerCase();

  if (!normalizedSentence) {
    return "";
  }

  if (normalizedSentence.toLowerCase() === normalizedTagline) {
    return "";
  }

  return ensureSentence(normalizedSentence);
}

export function buildToolPageDescription(tool: ToolPageSeoInput) {
  if (tool.metaDescription?.trim()) {
    return trimAtWordBoundary(tool.metaDescription.trim(), 160);
  }

  const tagline = collapseWhitespace(trimAtWordBoundary(tool.tagline, 72));
  const descriptor = `${tool.name}: ${tagline}`;
  const productSentence = ensureSentence(descriptor);
  const followUp = trimAtWordBoundary(
    "Explore pricing, features, screenshots, and similar tools on ShipBoost.",
    90,
  );
  const benefitSentence = extractBenefitSentence(tool.richDescription, tool.tagline);

  if (productSentence && followUp) {
    return trimAtWordBoundary(`${productSentence} ${followUp}`, 160);
  }

  if (productSentence && benefitSentence) {
    return trimAtWordBoundary(`${productSentence} ${benefitSentence}`, 160);
  }

  return trimAtWordBoundary(
    `${tool.name}. Explore pricing, features, screenshots, and similar tools on ShipBoost.`,
    160,
  );
}

export function buildToolPageTitle(tool: ToolPageSeoInput) {
  if (tool.metaTitle?.trim()) {
    return trimAtWordBoundary(tool.metaTitle.trim(), 70);
  }

  const primaryTitle = `${tool.name} Pricing, Features & Alternatives | ShipBoost`;

  if (primaryTitle.length <= 70) {
    return primaryTitle;
  }

  return trimAtWordBoundary(
    `${tool.name} Features & Pricing | ShipBoost`,
    70,
  );
}

export function getToolTimelineDisplay(input: ToolTimelineInput) {
  const latestLaunch = [...input.launches].sort(
    (left, right) => right.launchDate.getTime() - left.launchDate.getTime(),
  )[0];

  if (latestLaunch) {
    return {
      label: "Launch Date",
      date: latestLaunch.launchDate,
    };
  }

  return {
    label: "Listed",
    date: input.createdAt,
  };
}
