// Uploads the sample launch video (16:9 and 9:16) to Cloudinary and prints the
// public id to put in LAUNCH_VIDEO_DEMO_CLOUDINARY_ID.
//   node scripts/run-with-env.mjs node scripts/upload-launch-video-demo.mjs <name> <16x9.mp4> [9x16.mp4]
// <name> becomes the public id prefix, e.g. "tally-demo" -> launch-videos/tally-demo-16x9
import { v2 as cloudinary } from "cloudinary";

const [name, landscapePath, portraitPath] = process.argv.slice(2);

if (!name || !landscapePath) {
  console.error("Pass a name, the 16:9 mp4 path and optionally the 9:16 one.");
  process.exit(1);
}

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const folder = `${process.env.CLOUDINARY_UPLOAD_FOLDER ?? "ShipBoost"}/launch-videos`;

for (const [path, suffix] of [
  [landscapePath, "16x9"],
  [portraitPath, "9x16"],
]) {
  if (!path) continue;
  const result = await cloudinary.uploader.upload(path, {
    resource_type: "video",
    folder,
    public_id: `${name}-${suffix}`,
    overwrite: true,
    // Purge the CDN and the derived (resized) copies so a replaced sample shows up right away.
    invalidate: true,
  });
  console.log(`${suffix}: ${result.public_id} (${Math.round(result.bytes / 1024)} KB, ${result.duration}s)`);
}
