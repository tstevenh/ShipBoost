import { v2 as cloudinary } from "cloudinary";
import { z } from "zod";

const cloudinaryEnvSchema = z.object({
  CLOUDINARY_CLOUD_NAME: z.string().trim().min(1),
  CLOUDINARY_API_KEY: z.string().trim().min(1),
  CLOUDINARY_API_SECRET: z.string().trim().min(1),
  CLOUDINARY_UPLOAD_FOLDER: z.string().trim().min(1).default("shipboost"),
});

let configured = false;

function getCloudinaryEnv() {
  return cloudinaryEnvSchema.parse({
    CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME,
    CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY,
    CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET,
    CLOUDINARY_UPLOAD_FOLDER: process.env.CLOUDINARY_UPLOAD_FOLDER,
  });
}

function ensureConfigured() {
  if (configured) {
    return getCloudinaryEnv();
  }

  const env = getCloudinaryEnv();

  cloudinary.config({
    cloud_name: env.CLOUDINARY_CLOUD_NAME,
    api_key: env.CLOUDINARY_API_KEY,
    api_secret: env.CLOUDINARY_API_SECRET,
    secure: true,
  });

  configured = true;

  return env;
}

export type UploadedCloudinaryAsset = {
  url: string;
  publicId: string;
  format: string | undefined;
  width: number | undefined;
  height: number | undefined;
};

export async function uploadImageToCloudinary(
  fileBuffer: Buffer,
  options: {
    kind: "logo" | "screenshot" | "blog-cover" | "blog-inline";
    filename: string;
  },
): Promise<UploadedCloudinaryAsset> {
  const env = ensureConfigured();
  const publicId = `${options.kind}-${crypto.randomUUID()}`;
  const folder =
    options.kind === "logo"
      ? `${env.CLOUDINARY_UPLOAD_FOLDER}/logos`
      : options.kind === "screenshot"
        ? `${env.CLOUDINARY_UPLOAD_FOLDER}/screenshots`
        : options.kind === "blog-cover"
          ? `${env.CLOUDINARY_UPLOAD_FOLDER}/blog/covers`
          : `${env.CLOUDINARY_UPLOAD_FOLDER}/blog/inline`;

  const result = await new Promise<{
    secure_url: string;
    public_id: string;
    format?: string;
    width?: number;
    height?: number;
  }>((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        resource_type: "image",
        folder,
        public_id: publicId,
        overwrite: false,
        use_filename: false,
        unique_filename: false,
        format: "webp",
        transformation: [{ quality: "auto:good" }],
        filename_override: options.filename,
      },
      (error, uploadResult) => {
        if (error || !uploadResult) {
          reject(error ?? new Error("Cloudinary upload failed."));
          return;
        }

        resolve(uploadResult);
      },
    );

    stream.end(fileBuffer);
  });

  return {
    url: result.secure_url,
    publicId: result.public_id,
    format: result.format,
    width: result.width,
    height: result.height,
  };
}

export async function deleteImageFromCloudinary(publicId: string) {
  ensureConfigured();

  if (!publicId) {
    return;
  }

  await cloudinary.uploader.destroy(publicId, {
    resource_type: "image",
  });
}
