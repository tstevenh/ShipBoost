import type { NextRequest } from "next/server";

import { AppError } from "@/server/http/app-error";
import { uploadImageToCloudinary } from "@/server/cloudinary";
import { requireSession } from "@/server/auth/session";
import { getEnv } from "@/server/env";
import {
  errorResponse,
  ok,
  startRouteTiming,
  withRouteTiming,
} from "@/server/http/response";
import { revalidateAllPublicContent } from "@/server/cache/public-content";
import {
  deleteFounderTool,
  updateFounderTool,
} from "@/server/services/tool-service";
import { founderToolUpdateSchema } from "@/server/validators/tool";

type RouteContext = {
  params: Promise<{ toolId: string }>;
};

function serializeFounderTool(tool: Awaited<ReturnType<typeof updateFounderTool>>) {
  return {
    id: tool.id,
    slug: tool.slug,
    name: tool.name,
    tagline: tool.tagline,
    websiteUrl: tool.websiteUrl,
    richDescription: tool.richDescription,
    pricingModel: tool.pricingModel,
    hasAffiliateProgram: tool.hasAffiliateProgram,
    founderXUrl: tool.founderXUrl,
    founderGithubUrl: tool.founderGithubUrl,
    founderLinkedinUrl: tool.founderLinkedinUrl,
    founderFacebookUrl: tool.founderFacebookUrl,
    logoMedia: tool.logoMedia
      ? {
          id: tool.logoMedia.id,
          url: tool.logoMedia.url,
          format: tool.logoMedia.format,
          width: tool.logoMedia.width,
          height: tool.logoMedia.height,
        }
      : null,
    screenshots: tool.media.map((media) => ({
      id: media.id,
      url: media.url,
      format: media.format,
      width: media.width,
      height: media.height,
    })),
    toolCategories: tool.toolCategories.map((item) => ({
      categoryId: item.categoryId,
    })),
    toolTags: tool.toolTags.map((item) => ({
      tagId: item.tagId,
    })),
  };
}

const allowedMimeTypes = new Set(["image/png", "image/jpeg", "image/webp"]);

function getStringValue(formData: FormData, key: string) {
  const value = formData.get(key);

  if (typeof value !== "string") {
    throw new AppError(400, `Missing field: ${key}.`);
  }

  return value;
}

function toOptionalString(value: string) {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function parseJsonStringArray(formData: FormData, key: string) {
  const value = getStringValue(formData, key);

  try {
    const parsed = JSON.parse(value);

    if (!Array.isArray(parsed)) {
      throw new Error();
    }

    return parsed;
  } catch {
    throw new AppError(400, `Invalid JSON array for ${key}.`);
  }
}

function assertValidFile(
  file: File,
  options: { kind: "logo" | "screenshot"; maxBytes: number },
) {
  if (!allowedMimeTypes.has(file.type)) {
    throw new AppError(400, "Only PNG, JPEG, and WebP images are allowed.");
  }

  if (file.size > options.maxBytes) {
    throw new AppError(
      400,
      options.kind === "logo"
        ? "Logo files must be 3MB or smaller."
        : "Screenshot files must be 8MB or smaller.",
    );
  }
}

async function parseMultipartFounderUpdate(request: NextRequest) {
  const formData = await request.formData();
  const maybeLogo = formData.get("logo");
  const screenshotFiles = formData.getAll("screenshots");

  const logoFile = maybeLogo instanceof File && maybeLogo.size > 0 ? maybeLogo : null;
  const typedScreenshots = screenshotFiles.filter(
    (file): file is File => file instanceof File && file.size > 0,
  );

  if (typedScreenshots.length > 3) {
    throw new AppError(400, "You can upload up to 3 new screenshots.");
  }

  if (logoFile) {
    assertValidFile(logoFile, { kind: "logo", maxBytes: 3 * 1024 * 1024 });
  }

  typedScreenshots.forEach((file) =>
    assertValidFile(file, { kind: "screenshot", maxBytes: 8 * 1024 * 1024 }),
  );

  const [logo, screenshots] = await Promise.all([
    logoFile
      ? uploadImageToCloudinary(Buffer.from(await logoFile.arrayBuffer()), {
          kind: "logo",
          filename: logoFile.name,
        })
      : Promise.resolve(undefined),
    Promise.all(
      typedScreenshots.map(async (file) =>
        uploadImageToCloudinary(Buffer.from(await file.arrayBuffer()), {
          kind: "screenshot",
          filename: file.name,
        }),
      ),
    ),
  ]);

  const parsedFields = founderToolUpdateSchema
    .omit({
      logo: true,
      screenshots: true,
    })
    .parse({
      slug: toOptionalString(getStringValue(formData, "slug")),
      name: getStringValue(formData, "name"),
      tagline: getStringValue(formData, "tagline"),
      websiteUrl: getStringValue(formData, "websiteUrl"),
      richDescription: getStringValue(formData, "richDescription"),
      pricingModel: getStringValue(formData, "pricingModel"),
      categoryIds: parseJsonStringArray(formData, "categoryIds"),
      tagIds: parseJsonStringArray(formData, "tagIds"),
      hasAffiliateProgram:
        getStringValue(formData, "hasAffiliateProgram") === "true",
      founderXUrl: toOptionalString(getStringValue(formData, "founderXUrl")),
      founderGithubUrl: toOptionalString(
        getStringValue(formData, "founderGithubUrl"),
      ),
      founderLinkedinUrl: toOptionalString(
        getStringValue(formData, "founderLinkedinUrl"),
      ),
      founderFacebookUrl: toOptionalString(
        getStringValue(formData, "founderFacebookUrl"),
      ),
      existingScreenshotIds: parseJsonStringArray(
        formData,
        "existingScreenshotIds",
      ),
    });

  return {
    ...parsedFields,
    logo,
    screenshots,
  };
}

async function parseFounderUpdate(request: NextRequest) {
  const contentType = request.headers.get("content-type") ?? "";

  if (contentType.includes("multipart/form-data")) {
    return parseMultipartFounderUpdate(request);
  }

  if (contentType.includes("application/json")) {
    return founderToolUpdateSchema.parse(await request.json());
  }

  throw new AppError(
    400,
    "Founder listing updates must be submitted as JSON or multipart form data.",
  );
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  const timing = startRouteTiming("founder-tool-save");

  try {
    getEnv();
    const session = await requireSession(request);
    const { toolId } = await context.params;
    const body = await parseFounderUpdate(request);

    const tool = await updateFounderTool(session.user.id, toolId, body);
    revalidateAllPublicContent();
    return withRouteTiming(ok(serializeFounderTool(tool)), timing);
  } catch (error) {
    return withRouteTiming(errorResponse(error), timing);
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    getEnv();
    const session = await requireSession(request);
    const { toolId } = await context.params;

    const deleted = await deleteFounderTool(session.user.id, toolId);
    revalidateAllPublicContent();
    return ok(deleted);
  } catch (error) {
    return errorResponse(error);
  }
}
