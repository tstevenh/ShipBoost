import type { UploadedCloudinaryAsset } from "@/server/cloudinary";

import {
  deleteImageFromCloudinary,
  uploadImageToCloudinary,
} from "@/server/cloudinary";
import { AppError } from "@/server/http/app-error";

const allowedMimeTypes = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
]);

export type UploadedSubmissionMedia = {
  logo?: UploadedCloudinaryAsset;
  screenshots: UploadedCloudinaryAsset[];
};

export function assertValidSubmissionImageFile(
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

export async function cleanupUploadedSubmissionAssets(body: {
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

export async function uploadSubmissionMedia(input: {
  logoFile?: File | null;
  screenshotFiles?: File[];
}): Promise<UploadedSubmissionMedia> {
  const logoFile = input.logoFile ?? null;
  const screenshotFiles = input.screenshotFiles ?? [];

  if (!logoFile && screenshotFiles.length === 0) {
    throw new AppError(400, "Upload at least one image.");
  }

  if (logoFile) {
    assertValidSubmissionImageFile(logoFile, {
      kind: "logo",
      maxBytes: 3 * 1024 * 1024,
    });
  }

  if (screenshotFiles.length > 3) {
    throw new AppError(400, "You can upload up to 3 screenshots.");
  }

  screenshotFiles.forEach((file) =>
    assertValidSubmissionImageFile(file, {
      kind: "screenshot",
      maxBytes: 8 * 1024 * 1024,
    }),
  );

  const uploaded: UploadedSubmissionMedia = {
    screenshots: [],
  };

  try {
    if (logoFile) {
      uploaded.logo = await uploadImageToCloudinary(
        Buffer.from(await logoFile.arrayBuffer()),
        {
          kind: "logo",
          filename: logoFile.name,
        },
      );
    }

    uploaded.screenshots = await Promise.all(
      screenshotFiles.map(async (file) =>
        uploadImageToCloudinary(Buffer.from(await file.arrayBuffer()), {
          kind: "screenshot",
          filename: file.name,
        }),
      ),
    );

    return uploaded;
  } catch (error) {
    await cleanupUploadedSubmissionAssets(uploaded);
    throw error;
  }
}
