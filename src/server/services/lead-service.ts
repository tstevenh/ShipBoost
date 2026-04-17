import { prisma } from "@/server/db/client";
import { getEnv } from "@/server/env";
import { AppError } from "@/server/http/app-error";
import { upsertResendContact } from "@/server/services/resend-contact-service";
import type { LeadCaptureInput } from "@/server/validators/lead";

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function getLeadDelegate() {
  const leadDelegate = (prisma as typeof prisma & { lead?: typeof prisma.lead }).lead;

  if (!leadDelegate) {
    throw new AppError(
      500,
      "Lead capture schema is not loaded in the current Prisma client. Run `npm run prisma:generate`, apply the migration, and restart the dev server.",
    );
  }

  return leadDelegate;
}

function getResendLeadSegmentId() {
  return getEnv().RESEND_LEADS_SEGMENT_ID;
}

export async function captureLead(input: LeadCaptureInput) {
  const email = normalizeEmail(input.email);
  const now = new Date();
  const leadDelegate = getLeadDelegate();

  const existing = await leadDelegate.findUnique({
    where: { email },
  });

  const lead = existing
    ? await leadDelegate.update({
        where: { email },
        data: {
          lastSubmittedAt: now,
          name: existing.name || input.name,
          utmSource: existing.utmSource || input.utmSource,
          utmMedium: existing.utmMedium || input.utmMedium,
          utmCampaign: existing.utmCampaign || input.utmCampaign,
          utmContent: existing.utmContent || input.utmContent,
          utmTerm: existing.utmTerm || input.utmTerm,
        },
      })
    : await leadDelegate.create({
        data: {
          email,
          source: input.source,
          leadMagnet: input.leadMagnet,
          consentedAt: now,
          firstSubscribedAt: now,
          lastSubmittedAt: now,
          name: input.name,
          utmSource: input.utmSource,
          utmMedium: input.utmMedium,
          utmCampaign: input.utmCampaign,
          utmContent: input.utmContent,
          utmTerm: input.utmTerm,
        },
      });

  try {
    const resendContactId = await upsertResendContact({
      email: lead.email,
      name: lead.name,
      resendContactId: lead.resendContactId,
      segmentId: getResendLeadSegmentId(),
    });

    if (resendContactId && resendContactId !== lead.resendContactId) {
      lead.resendContactId = resendContactId;
      await leadDelegate.update({
        where: { id: lead.id },
        data: { resendContactId },
      });
    }
  } catch (error) {
    console.error("[shipboost lead:resend-sync-error]", error);
  }

  return {
    created: !existing,
    lead,
  };
}
