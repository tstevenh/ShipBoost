#!/usr/bin/env node
import { PrismaClient } from "@prisma/client";

import {
  configureCloudinaryFromEnv,
  uploadFaviconLogoToCloudinary,
} from "./favicon-logo-cloudinary.mjs";

const prisma = new PrismaClient();
const sourceLogoUrl = "https://favicon.im/microsoft.com?larger=true";
const slugs = ["azure-devops", "azure-pipelines"];

async function main() {
  const uploadFolder = configureCloudinaryFromEnv();
  const tools = await prisma.tool.findMany({
    where: { slug: { in: slugs } },
    select: { id: true, slug: true, name: true, logoMediaId: true },
  });

  const results = [];

  for (const tool of tools) {
    const uploadedLogo = await uploadFaviconLogoToCloudinary({
      sourceUrl: sourceLogoUrl,
      slug: tool.slug,
      uploadFolder,
    });

    if (tool.logoMediaId) {
      await prisma.toolMedia.update({
        where: { id: tool.logoMediaId },
        data: {
          type: "LOGO",
          url: uploadedLogo.url,
          publicId: uploadedLogo.publicId,
          format: uploadedLogo.format,
          width: uploadedLogo.width,
          height: uploadedLogo.height,
          sortOrder: 0,
        },
      });
    } else {
      const logoMedia = await prisma.toolMedia.create({
        data: {
          toolId: tool.id,
          type: "LOGO",
          url: uploadedLogo.url,
          publicId: uploadedLogo.publicId,
          format: uploadedLogo.format,
          width: uploadedLogo.width,
          height: uploadedLogo.height,
          sortOrder: 0,
        },
        select: { id: true },
      });

      await prisma.tool.update({
        where: { id: tool.id },
        data: { logoMediaId: logoMedia.id },
      });
    }

    results.push({
      slug: tool.slug,
      name: tool.name,
      sourceLogoUrl,
      cloudinaryUrl: uploadedLogo.url,
      publicId: uploadedLogo.publicId,
    });
  }

  console.log(JSON.stringify({ processedCount: results.length, results }, null, 2));
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
