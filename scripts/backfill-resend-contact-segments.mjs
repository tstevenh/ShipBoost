import "dotenv/config";

import { PrismaClient } from "@prisma/client";
import { Resend } from "resend";

const prisma = new PrismaClient();

const resendApiKey = process.env.RESEND_API_KEY;
const leadSegmentId = process.env.RESEND_LEADS_SEGMENT_ID;
const signupSegmentId = process.env.RESEND_SIGNUP_SEGMENT_ID;

if (!resendApiKey) {
  console.error("Missing RESEND_API_KEY.");
  process.exit(1);
}

const resend = new Resend(resendApiKey);

function splitName(name) {
  if (!name?.trim()) {
    return { firstName: undefined, lastName: undefined };
  }

  const parts = name.trim().split(/\s+/).filter(Boolean);

  return {
    firstName: parts[0],
    lastName: parts.length > 1 ? parts.slice(1).join(" ") : undefined,
  };
}

async function ensureContactInSegment(contactId, segmentId) {
  if (!segmentId) {
    return;
  }

  const segments = await resend.contacts.segments.list({ contactId });

  if (segments.error) {
    throw new Error(segments.error.message);
  }

  const isInSegment = segments.data?.data.some((segment) => segment.id === segmentId);

  if (isInSegment) {
    return;
  }

  const addToSegment = await resend.contacts.segments.add({
    contactId,
    segmentId,
  });

  if (addToSegment.error) {
    throw new Error(addToSegment.error.message);
  }
}

async function upsertContact({ email, name, segmentId }) {
  const normalizedEmail = email.trim().toLowerCase();
  const { firstName, lastName } = splitName(name);
  const existing = await resend.contacts.get({ email: normalizedEmail });

  if (existing.error && existing.error.statusCode !== 404) {
    throw new Error(existing.error.message);
  }

  if (existing.data?.id) {
    const response = await resend.contacts.update({
      id: existing.data.id,
      email: normalizedEmail,
      firstName,
      lastName,
      unsubscribed: false,
    });

    if (response.error) {
      throw new Error(response.error.message);
    }

    const contactId = response.data?.id ?? existing.data.id;
    await ensureContactInSegment(contactId, segmentId);
    return contactId;
  }

  const response = await resend.contacts.create({
    email: normalizedEmail,
    firstName,
    lastName,
    unsubscribed: false,
    ...(segmentId ? { segments: [{ id: segmentId }] } : {}),
  });

  if (response.error) {
    throw new Error(response.error.message);
  }

  return response.data?.id ?? null;
}

async function main() {
  const leads = await prisma.lead.findMany({
    where: { status: "ACTIVE" },
    select: {
      email: true,
      name: true,
      resendContactId: true,
    },
  });
  const users = await prisma.user.findMany({
    select: {
      email: true,
      name: true,
    },
  });

  let syncedLeads = 0;
  let syncedUsers = 0;

  for (const lead of leads) {
    const contactId = await upsertContact({
      email: lead.email,
      name: lead.name,
      segmentId: leadSegmentId,
    });

    if (contactId && contactId !== lead.resendContactId) {
      await prisma.lead.update({
        where: { email: lead.email },
        data: { resendContactId: contactId },
      });
    }

    syncedLeads += 1;
  }

  for (const user of users) {
    await upsertContact({
      email: user.email,
      name: user.name,
      segmentId: signupSegmentId,
    });

    syncedUsers += 1;
  }

  console.log(
    JSON.stringify(
      {
        syncedLeads,
        syncedUsers,
        leadSegmentId: leadSegmentId ?? null,
        signupSegmentId: signupSegmentId ?? null,
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
