// Creates a launch video one-time product in Dodo Payments and prints its id.
// Uses DODO_PAYMENTS_MODE / DODO_PAYMENTS_API_KEY from the environment, so run it
// once per mode and per product:
//   node scripts/run-with-env.mjs node scripts/create-launch-video-product.mjs
//     -> $99, sold with Premium Launch   -> DODO_LAUNCH_VIDEO_PRODUCT_ID
//   node scripts/run-with-env.mjs node scripts/create-launch-video-product.mjs --standalone
//     -> $129, sold with a free launch   -> DODO_LAUNCH_VIDEO_STANDALONE_PRODUCT_ID
import DodoPayments from "dodopayments";

const standalone = process.argv.includes("--standalone");
const config = standalone
  ? {
      envName: "DODO_LAUNCH_VIDEO_STANDALONE_PRODUCT_ID",
      name: "Launch Video",
      description:
        "A 20-second motion film of your product, in 16:9 and 9:16, delivered within 7 days of your order.",
      priceCents: 12900,
      kind: "standalone",
    }
  : {
      envName: "DODO_LAUNCH_VIDEO_PRODUCT_ID",
      name: "Launch Video (with Premium Launch)",
      description:
        "A 20-second motion film of your product, in 16:9 and 9:16, delivered during your ShipBoost launch week.",
      priceCents: 9900,
      kind: "premium",
    };

const apiKey = process.env.DODO_PAYMENTS_API_KEY;
const mode = process.env.DODO_PAYMENTS_MODE === "live" ? "live_mode" : "test_mode";

if (!apiKey) {
  console.error("DODO_PAYMENTS_API_KEY is not set.");
  process.exit(1);
}

if (process.env[config.envName]) {
  console.error(
    `${config.envName} is already set (${process.env[config.envName]}). Unset it to create another product.`,
  );
  process.exit(1);
}

const dodo = new DodoPayments({ bearerToken: apiKey, environment: mode });

// Reuse the Premium Launch brand so the checkout looks the same.
const premiumProductId = process.env.DODO_PREMIUM_LAUNCH_PRODUCT_ID;
const brandId = premiumProductId
  ? (await dodo.products.retrieve(premiumProductId)).brand_id
  : undefined;

const product = await dodo.products.create({
  name: config.name,
  description: config.description,
  tax_category: "saas",
  brand_id: brandId ?? undefined,
  price: {
    type: "one_time_price",
    price: config.priceCents,
    currency: "USD",
    discount: 0,
    purchasing_power_parity: false,
    tax_inclusive: false,
  },
  metadata: { shipboostProduct: "launch_video", launchVideoKind: config.kind },
});

console.log(`Created ${mode} product: ${product.product_id}`);
console.log(`${config.envName}=${product.product_id}`);
