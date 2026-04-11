import fs from "node:fs";
import path from "node:path";

import { PrismaClient } from "@prisma/client";
import { v2 as cloudinary } from "cloudinary";

const prisma = new PrismaClient();

const LOGO_SOURCE_DOMAINS = [
  "https://makerkit.dev",
  "https://supastarter.dev",
  "https://www.saasbrella.co/",
  "https://goilerplate.com",
  "https://directoryfa.st/",
  "https://www.nextjsdirectory.com/",
  "https://tapfiliate.com",
  "https://www.rewardful.com",
  "https://www.promotekit.com/",
  "https://www.partnero.com",
  "https://tolt.com/",
  "https://www.tracknow.io",
  "https://www.frase.io",
  "https://www.scalenut.com",
  "https://surferseo.com",
  "https://www.outranking.io",
  "https://www.rankability.com",
  "https://aiseo.ai",
  "https://seoengine.ai",
  "https://vistasocial.com",
  "https://skedsocial.com",
  "https://www.sociamonials.com",
  "https://manychat.com",
  "https://socialrails.com/",
  "https://www.waalaxy.com",
  "https://octolens.com",
  "https://www.close.com",
  "https://salesflare.com",
  "https://capsulecrm.com",
  "https://www.nutshell.com",
  "https://www.folk.app",
  "https://www.livechat.com",
  "https://www.intercom.com",
  "https://www.helpdesk.com",
  "https://www.chatbot.com",
  "https://respond.io",
];

const SCREENSHOT_FILE_BY_SLUG = {
  affonso: "affonoso.png",
  apollo: "apollo.png",
  blogseo: "blogseo.png",
  buffer: "buffer.png",
  directoryeasy: "directoryeasy.png",
  makerkit: "makerkit.png",
  supastarter: "supastarter.png",
  saasbrella: "saasbrella.png",
  goilerplate: "goilerplate.png",
  directoryfast: "directoryfast.png",
  directorystack: "directorystack.png",
  dirstarter: "Dirstarter.png",
  jivochat: "jivochat.png",
  mkdirs: "mkdirs.png",
  mksaas: "mksaas.png",
  monokit: "monokit.png",
  "nextjs-directory": "nestjsdirectory.png",
  pipedrive: "pipedrive.png",
  reply: "reply.png",
  shipfast: "shipfast.png",
  sleekflow: "sleekflow.png",
  tapfiliate: "tapfilliate.png",
  tidio: "tidio.png",
  trackdesk: "trackdesk.png",
  rewardful: "rewardful.png",
  promotekit: "promotekit.png",
  partnero: "partenero.png",
  tolt: "tolt.png",
  tracknow: "tracknow.png",
  frase: "frase.png",
  scalenut: "scalenut.png",
  surfer: "surfer.png",
  outranking: "outranking.png",
  rankability: "rankability.png",
  aiseo: "aiseo.png",
  seoengine: "seoengine.png",
  "vista-social": "vistasocial.png",
  "sked-social": "skedsocial.png",
  sociamonials: "sociamonials.png",
  manychat: "manychat.png",
  socialrails: "socialrails.png",
  waalaxy: "waalaxy.png",
  octolens: "octolens.png",
  close: "close.png",
  salesflare: "salesfire.png",
  capsulecrm: "capsule.png",
  nutshell: "nutshell.png",
  folk: "folk.png",
  livechat: "livechat.png",
  intercom: "intercom.png",
  helpdesk: "helpdesk.png",
  chatbot: "chatbot.png",
  "respond-io": "respond.png",
};

const args = new Set(process.argv.slice(2));
const shouldExecute = args.has("--execute");
const shouldKeepExistingScreenshots = args.has("--keep-existing-screenshots");
const shouldSkipRevalidation = args.has("--skip-revalidate");

function getRequiredEnv(name) {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Missing required env var: ${name}`);
  }
  return value;
}

function configureCloudinary() {
  cloudinary.config({
    cloud_name: getRequiredEnv("CLOUDINARY_CLOUD_NAME"),
    api_key: getRequiredEnv("CLOUDINARY_API_KEY"),
    api_secret: getRequiredEnv("CLOUDINARY_API_SECRET"),
    secure: true,
  });

  return getRequiredEnv("CLOUDINARY_UPLOAD_FOLDER");
}

function normalizeHostname(rawUrl) {
  const url = new URL(rawUrl);
  return url.hostname.replace(/^www\./, "").toLowerCase();
}

function buildFaviconUrl(hostname) {
  return `https://favicon.im/${hostname}?larger=true`;
}

function buildHeroImagePath(filename) {
  return path.resolve(
    process.cwd(),
    "../ShipBoost-Docs/hero-image",
    filename,
  );
}

function getAppUrl() {
  return process.env.NEXT_PUBLIC_APP_URL?.trim() ?? "";
}

async function revalidatePublicContent() {
  const appUrl = getAppUrl();

  if (!appUrl) {
    return {
      attempted: false,
      reason: "NEXT_PUBLIC_APP_URL is not configured.",
    };
  }

  const endpoint = new URL("/api/cron/public-content/revalidate", appUrl);
  const secret = process.env.CRON_SECRET?.trim();

  const response = await fetch(endpoint, {
    method: "POST",
    headers: secret
      ? {
          "x-cron-secret": secret,
        }
      : undefined,
  });

  const body = await response.text();

  if (!response.ok) {
    throw new Error(
      `Public cache revalidation failed with ${response.status}: ${body}`,
    );
  }

  return {
    attempted: true,
    endpoint: endpoint.toString(),
    status: response.status,
    body,
  };
}

async function uploadHeroScreenshot(filePath, slug, uploadFolder) {
  const filename = path.basename(filePath, path.extname(filePath));
  const publicId = `seeded-hero-${slug}`;

  const result = await cloudinary.uploader.upload(filePath, {
    resource_type: "image",
    folder: `${uploadFolder}/screenshots`,
    public_id: publicId,
    overwrite: true,
    invalidate: true,
    format: "webp",
    transformation: [{ quality: "auto:good" }],
    filename_override: filename,
  });

  return {
    url: result.secure_url,
    publicId: result.public_id,
    format: result.format ?? undefined,
    width: result.width ?? undefined,
    height: result.height ?? undefined,
  };
}

async function destroyCloudinaryImage(publicId) {
  if (!publicId) {
    return;
  }

  await cloudinary.uploader.destroy(publicId, {
    resource_type: "image",
    invalidate: true,
  });
}

async function ensureLogoMedia(tx, tool, faviconUrl) {
  if (tool.logoMediaId) {
    await tx.toolMedia.update({
      where: { id: tool.logoMediaId },
      data: {
        url: faviconUrl,
        type: "LOGO",
        publicId: null,
        format: null,
        width: null,
        height: null,
        sortOrder: 0,
      },
    });
    return "updated";
  }

  const logoMedia = await tx.toolMedia.create({
    data: {
      toolId: tool.id,
      type: "LOGO",
      url: faviconUrl,
      sortOrder: 0,
    },
    select: { id: true },
  });

  await tx.tool.update({
    where: { id: tool.id },
    data: {
      logoMediaId: logoMedia.id,
    },
  });

  return "created";
}

async function main() {
  const targetHosts = new Set(LOGO_SOURCE_DOMAINS.map(normalizeHostname));
  const screenshotSlugs = new Set(Object.keys(SCREENSHOT_FILE_BY_SLUG));

  const tools = await prisma.tool.findMany({
    where: {
      publicationStatus: "PUBLISHED",
      moderationStatus: "APPROVED",
    },
    select: {
      id: true,
      slug: true,
      name: true,
      websiteUrl: true,
      logoMediaId: true,
      logoMedia: {
        select: {
          id: true,
          url: true,
        },
      },
      media: {
        where: {
          type: "SCREENSHOT",
        },
        orderBy: {
          sortOrder: "asc",
        },
        select: {
          id: true,
          url: true,
          publicId: true,
          sortOrder: true,
        },
      },
    },
    orderBy: {
      slug: "asc",
    },
  });

  const toolsWithHosts = tools
    .map((tool) => ({
      ...tool,
      normalizedHost: normalizeHostname(tool.websiteUrl),
    }));

  const matchedTools = toolsWithHosts.filter(
    (tool) => targetHosts.has(tool.normalizedHost) || screenshotSlugs.has(tool.slug),
  );

  const missingDomains = [...targetHosts].filter(
    (host) => !matchedTools.some((tool) => tool.normalizedHost === host),
  );

  const missingScreenshotMappings = [...screenshotSlugs].filter(
    (slug) => !toolsWithHosts.some((tool) => tool.slug === slug),
  );

  const plan = matchedTools.map((tool) => {
    const heroFilename = SCREENSHOT_FILE_BY_SLUG[tool.slug] ?? null;
    const heroPath = heroFilename ? buildHeroImagePath(heroFilename) : null;

    return {
      id: tool.id,
      slug: tool.slug,
      name: tool.name,
      faviconUrl: targetHosts.has(tool.normalizedHost)
        ? buildFaviconUrl(tool.normalizedHost)
        : null,
      currentLogoUrl: tool.logoMedia?.url ?? null,
      heroFilename,
      heroExists: heroPath ? fs.existsSync(heroPath) : false,
      existingScreenshotCount: tool.media.length,
    };
  });

  const summary = {
    execute: shouldExecute,
    keepExistingScreenshots: shouldKeepExistingScreenshots,
    skipRevalidation: shouldSkipRevalidation,
    matchedToolCount: matchedTools.length,
    missingDomains,
    missingScreenshotMappings,
    missingHeroMappings: plan
      .filter((item) => !item.heroFilename)
      .map((item) => item.slug),
    missingHeroFiles: plan
      .filter((item) => item.heroFilename && !item.heroExists)
      .map((item) => item.heroFilename),
    tools: plan,
  };

  if (!shouldExecute) {
    console.log(JSON.stringify(summary, null, 2));
    return;
  }

  const uploadFolder = configureCloudinary();
  const results = [];

  for (const tool of matchedTools) {
    const faviconUrl = targetHosts.has(tool.normalizedHost)
      ? buildFaviconUrl(tool.normalizedHost)
      : null;
    const heroFilename = SCREENSHOT_FILE_BY_SLUG[tool.slug] ?? null;
    const heroPath = heroFilename ? buildHeroImagePath(heroFilename) : null;
    const hasHero = Boolean(heroPath && fs.existsSync(heroPath));

    let uploadedAsset = null;
    let replacedScreenshotCount = 0;

    if (hasHero) {
      uploadedAsset = await uploadHeroScreenshot(heroPath, tool.slug, uploadFolder);
    }

    try {
      const previousScreenshotPublicIds = tool.media
        .map((media) => media.publicId)
        .filter(Boolean);

      await prisma.$transaction(async (tx) => {
        const logoAction = faviconUrl
          ? await ensureLogoMedia(tx, tool, faviconUrl)
          : null;

        if (hasHero && uploadedAsset) {
          const screenshotIdsToDelete = shouldKeepExistingScreenshots
            ? []
            : tool.media.map((media) => media.id);

          if (screenshotIdsToDelete.length > 0) {
            await tx.toolMedia.deleteMany({
              where: {
                id: {
                  in: screenshotIdsToDelete,
                },
              },
            });
          }

          await tx.toolMedia.create({
            data: {
              toolId: tool.id,
              type: "SCREENSHOT",
              url: uploadedAsset.url,
              publicId: uploadedAsset.publicId,
              format: uploadedAsset.format,
              width: uploadedAsset.width,
              height: uploadedAsset.height,
              sortOrder: shouldKeepExistingScreenshots
                ? tool.media.length
                : 0,
            },
          });

          replacedScreenshotCount = screenshotIdsToDelete.length;
        }

        results.push({
          slug: tool.slug,
          faviconUrl,
          logoAction,
          heroFilename,
          screenshotUploaded: Boolean(uploadedAsset),
          replacedScreenshotCount,
        });
      });

      if (hasHero && uploadedAsset && !shouldKeepExistingScreenshots) {
        await Promise.allSettled(
          tool.media
            .filter((media) => media.publicId && media.publicId !== uploadedAsset.publicId)
            .map((media) => destroyCloudinaryImage(media.publicId)),
        );
      }
    } catch (error) {
      if (uploadedAsset?.publicId) {
        await destroyCloudinaryImage(uploadedAsset.publicId);
      }
      throw error;
    }
  }

  let revalidation = {
    attempted: false,
    skipped: shouldSkipRevalidation,
  };

  if (!shouldSkipRevalidation) {
    try {
      revalidation = await revalidatePublicContent();
    } catch (error) {
      revalidation = {
        attempted: true,
        failed: true,
        message: error instanceof Error ? error.message : String(error),
      };
    }
  }

  console.log(
    JSON.stringify(
      {
        execute: true,
        processedCount: results.length,
        updatedLogoCount: results.filter((item) => item.logoAction).length,
        screenshotUploadCount: results.filter((item) => item.screenshotUploaded)
          .length,
        revalidation,
        results,
      },
      null,
      2,
    ),
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
