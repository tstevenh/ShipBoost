import type { JsonLd } from "@/server/seo/schema-types";

function normalizeJsonLd(input: JsonLd) {
  return Array.isArray(input) ? input : [input];
}

export function JsonLdScript({ data }: { data: JsonLd }) {
  return (
    <>
      {normalizeJsonLd(data).map((entry, index) => (
        <script
          key={index}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(entry) }}
        />
      ))}
    </>
  );
}
