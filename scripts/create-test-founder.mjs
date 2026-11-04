// Creates (or reuses) a verified founder account for manual QA of the
// submit flow. Credentials are read from / written to .env.local so the
// password never has to be pasted anywhere.
//   node scripts/run-with-env.mjs node scripts/create-test-founder.mjs
import { randomBytes } from "node:crypto";
import { appendFileSync } from "node:fs";
import { PrismaClient } from "@prisma/client";
import { hashPassword } from "better-auth/crypto";

const prisma = new PrismaClient();
const email = process.env.SHIPBOOST_TEST_FOUNDER_EMAIL || "qa-founder@shipboost.test";
let password = process.env.SHIPBOOST_TEST_FOUNDER_PASSWORD;

if (!password) {
  password = randomBytes(12).toString("base64url");
  appendFileSync(
    ".env.local",
    `\n# QA founder account for testing the submit flow (scripts/create-test-founder.mjs)\nSHIPBOOST_TEST_FOUNDER_EMAIL=${email}\nSHIPBOOST_TEST_FOUNDER_PASSWORD=${password}\n`,
  );
}

const user = await prisma.user.upsert({
  where: { email },
  update: { emailVerified: true },
  create: { email, name: "QA Founder", emailVerified: true },
});

const hashed = await hashPassword(password);
const existing = await prisma.account.findFirst({
  where: { userId: user.id, providerId: "credential" },
});

if (existing) {
  await prisma.account.update({ where: { id: existing.id }, data: { password: hashed } });
} else {
  await prisma.account.create({
    data: {
        id: randomBytes(16).toString("hex"),
        userId: user.id,
        providerId: "credential",
        accountId: user.id,
        password: hashed,
      },
  });
}

console.log(`Test founder ready: ${email} (user ${user.id})`);
await prisma.$disconnect();
