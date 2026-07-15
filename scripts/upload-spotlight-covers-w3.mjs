import { v2 as cloudinary } from "cloudinary";
import fs from "node:fs";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

const folder = `${process.env.CLOUDINARY_UPLOAD_FOLDER || "ShipBoost"}/blog/covers`;
const dir = "/Users/tsth/Downloads/Directory-Badge";

const files = [
  { key: "visibai", path: `${dir}/VisibAI.png` },
  { key: "discme", path: `${dir}/discme.png` },
  { key: "mysoft-ai", path: `${dir}/mysoft.ai.png` },
];

const out = {};
for (const f of files) {
  const buf = fs.readFileSync(f.path);
  const result = await new Promise((resolve, reject) => {
    cloudinary.uploader
      .upload_stream(
        { folder, format: "webp", resource_type: "image", public_id: `blog-cover-${f.key}-${Date.now()}` },
        (err, res) => (err ? reject(err) : resolve(res)),
      )
      .end(buf);
  });
  out[f.key] = { url: result.secure_url, publicId: result.public_id };
  console.log(f.key, "->", result.secure_url);
}

fs.writeFileSync("/tmp/spotlight-covers-w3.json", JSON.stringify(out, null, 2));
console.log("\nWrote /tmp/spotlight-covers-w3.json");
