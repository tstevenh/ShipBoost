import type { NextRequest } from "next/server";

import { AppError } from "@/server/http/app-error";
import {
  deleteImageFromCloudinary,
  uploadImageToCloudinary,
} from "@/server/cloudinary";
import { requireSession } from "@/server/auth/session";
import { getEnv } from "@/server/env";
import { errorResponse, ok } from "@/server/http/response";
import {
  createSubmission,
  listFounderSubmissions,
} from "@/server/services/submission-service";
import {
  submissionCreateFieldsSchema,
  submissionCreateSchema,
  submissionListQuerySchema,
} from "@/server/validators/submission";

const allowedMimeTypes = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
]);

function getStringValue(formData: FormData, key: string) {
  const value = formData.get(key);

  if (typeof value !== "string") {
    throw new AppError(400, `Missing field: ${key}.`);
  }

  return value;
}

function getOptionalStringValue(formData: FormData, key: string) {
  const value = formData.get(key);

  if (typeof value !== "string") {
    return undefined;
  }

  return value;
}

function toOptionalString(value: string) {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function toOptionalDateString(value: string) {
  const trimmed = value.trim();

  if (!trimmed) {
    return undefined;
  }

  return `${trimmed}T00:00:00.000Z`;
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
    throw new AppError(
      400,
      "Only PNG, JPEG, and WebP images are allowed.",
    );
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

async function parseMultipartSubmission(request: NextRequest) {
  const formData = await request.formData();
    const parsedFields = submissionCreateFieldsSchema.parse({
      submissionId: toOptionalString(
        getOptionalStringValue(formData, "submissionId") ?? "",
      ),
      submissionType: getStringValue(formData, "submissionType"),
      requestedSlug: toOptionalString(
        getOptionalStringValue(formData, "requestedSlug") ?? "",
      ),
      preferredLaunchDate: toOptionalDateString(
        getOptionalStringValue(formData, "preferredLaunchDate") ?? "",
      ),
      name: getStringValue(formData, "name"),
      tagline: getStringValue(formData, "tagline"),
      websiteUrl: getStringValue(formData, "websiteUrl"),
      richDescription: getStringValue(formData, "richDescription"),
      pricingModel: getStringValue(formData, "pricingModel"),
      categoryIds: parseJsonStringArray(formData, "categoryIds"),
      tagIds: parseJsonStringArray(formData, "tagIds"),
      affiliateUrl: toOptionalString(
        getOptionalStringValue(formData, "affiliateUrl") ?? "",
      ),
      affiliateSource: toOptionalString(
        getOptionalStringValue(formData, "affiliateSource") ?? "",
      ),
      hasAffiliateProgram: (getOptionalStringValue(
        formData,
        "hasAffiliateProgram",
      ) ?? "") === "true",
      founderXUrl: toOptionalString(
        getOptionalStringValue(formData, "founderXUrl") ?? "",
      ),
      founderGithubUrl: toOptionalString(
        getOptionalStringValue(formData, "founderGithubUrl") ?? "",
      ),
      founderLinkedinUrl: toOptionalString(
        getOptionalStringValue(formData, "founderLinkedinUrl") ?? "",
      ),
      founderFacebookUrl: toOptionalString(
        getOptionalStringValue(formData, "founderFacebookUrl") ?? "",
      ),
    });

  const logoFile = formData.get("logo");
  const screenshotFiles = formData.getAll("screenshots");

  if (!(logoFile instanceof File)) {
    throw new AppError(400, "A logo file is required.");
  }

  if (screenshotFiles.some((file) => !(file instanceof File))) {
    throw new AppError(400, "Invalid screenshot upload.");
  }

  const typedScreenshots = screenshotFiles as File[];

  if (typedScreenshots.length > 3) {
    throw new AppError(400, "You can upload up to 3 screenshots.");
  }

  assertValidFile(logoFile, { kind: "logo", maxBytes: 3 * 1024 * 1024 });
  typedScreenshots.forEach((file) =>
    assertValidFile(file, {
      kind: "screenshot",
      maxBytes: 8 * 1024 * 1024,
    }),
  );

  const [logo, screenshots] = await Promise.all([
    uploadImageToCloudinary(Buffer.from(await logoFile.arrayBuffer()), {
      kind: "logo",
      filename: logoFile.name,
    }),
    Promise.all(
      typedScreenshots.map(async (file) =>
        uploadImageToCloudinary(Buffer.from(await file.arrayBuffer()), {
          kind: "screenshot",
          filename: file.name,
        }),
      ),
    ),
  ]);

  return {
    ...parsedFields,
    logo,
    screenshots,
  };
}

async function cleanupUploadedAssets(body: {
  logo?: { publicId?: string };
  screenshots?: Array<{ publicId?: string }>;
}) {
  const publicIds = [
    body.logo?.publicId,
    ...(body.screenshots?.map((asset) => asset.publicId) ?? []),
  ].filter((value): value is string => Boolean(value));

  if (publicIds.length === 0) {
    return;
  }

  await Promise.allSettled(
    publicIds.map((publicId) => deleteImageFromCloudinary(publicId)),
  );
}

export async function GET(request: NextRequest) {
  try {
    getEnv();
    submissionListQuerySchema.parse({});
    const session = await requireSession(request);
    const submissions = await listFounderSubmissions(session.user.id);
    return ok(submissions);
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    getEnv();
    const session = await requireSession(request);

    const contentType = request.headers.get("content-type") ?? "";
    const body = contentType.includes("multipart/form-data")
      ? await parseMultipartSubmission(request)
      : submissionCreateSchema.parse(await request.json());

    let submission;

    try {
      submission = await createSubmission(body, {
        id: session.user.id,
      });
    } catch (error) {
      if (contentType.includes("multipart/form-data")) {
        await cleanupUploadedAssets(body);
      }

      throw error;
    }

    return ok(submission, { status: submission.id === body.submissionId ? 200 : 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
