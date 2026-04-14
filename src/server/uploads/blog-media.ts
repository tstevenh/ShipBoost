import {
  uploadImageToCloudinary,
  type UploadedCloudinaryAsset,
} from "@/server/cloudinary";
import { AppError } from "@/server/http/app-error";

const allowedMimeTypes = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
]);

export function assertValidBlogImageFile(file: File) {
  if (!allowedMimeTypes.has(file.type)) {
    throw new AppError(400, "Only PNG, JPEG, and WebP images are allowed.");
  }

  if (file.size > 8 * 1024 * 1024) {
    throw new AppError(400, "Blog images must be 8MB or smaller.");
  }
}

export async function uploadBlogImage(
  file: File,
  kind: "blog-cover" | "blog-inline",
): Promise<UploadedCloudinaryAsset> {
  assertValidBlogImageFile(file);

  return uploadImageToCloudinary(Buffer.from(await file.arrayBuffer()), {
    kind,
    filename: file.name,
  });
}
