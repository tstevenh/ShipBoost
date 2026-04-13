import { Resend } from "resend";

import { prisma } from "@/server/db/client";
import { getEnv } from "@/server/env";
import { AppError } from "@/server/http/app-error";
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

function getResendClient() {
  const env = getEnv();

  if (!env.RESEND_API_KEY) {
    return null;
  }

  return new Resend(env.RESEND_API_KEY);
}

function splitName(name?: string | null) {
  if (!name?.trim()) {
    return { firstName: undefined, lastName: undefined };
  }

  const parts = name.trim().split(/\s+/).filter(Boolean);

  return {
    firstName: parts[0],
    lastName: parts.length > 1 ? parts.slice(1).join(" ") : undefined,
  };
}

async function syncLeadToResend(lead: {
  id: string;
  email: string;
  name: string | null;
  resendContactId: string | null;
  source: string;
  leadMagnet: string;
  utmSource: string | null;
  utmMedium: string | null;
  utmCampaign: string | null;
  utmContent: string | null;
  utmTerm: string | null;
}) {
  const resend = getResendClient();

  if (!resend) {
    return null;
  }

  const { firstName, lastName } = splitName(lead.name);
  const payload = {
    firstName,
    lastName,
    unsubscribed: false,
    properties: {
      source: lead.source,
      lead_magnet: lead.leadMagnet,
      utm_source: lead.utmSource ?? "",
      utm_medium: lead.utmMedium ?? "",
      utm_campaign: lead.utmCampaign ?? "",
      utm_content: lead.utmContent ?? "",
      utm_term: lead.utmTerm ?? "",
    },
  };

  if (lead.resendContactId) {
    const response = await resend.contacts.update({
      id: lead.resendContactId,
      ...payload,
    });

    if (response.error) {
      throw new Error(response.error.message);
    }

    return response.data?.id ?? lead.resendContactId;
  }

  const existing = await resend.contacts.get({
    email: lead.email,
  });

  if (existing.data?.id) {
    const response = await resend.contacts.update({
      id: existing.data.id,
      ...payload,
    });

    if (response.error) {
      throw new Error(response.error.message);
    }

    return response.data?.id ?? existing.data.id;
  }

  const response = await resend.contacts.create({
    email: lead.email,
    ...payload,
  });

  if (response.error) {
    throw new Error(response.error.message);
  }

  return response.data?.id ?? null;
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
    const resendContactId = await syncLeadToResend(lead);

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
