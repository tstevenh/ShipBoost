import { Resend } from "resend";

import { getEnv } from "@/server/env";

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

async function ensureContactInSegment(
  resend: Resend,
  contactId: string,
  segmentId?: string,
) {
  if (!segmentId) {
    return;
  }

  const segments = await resend.contacts.segments.list({ contactId });

  if (segments.error) {
    throw new Error(segments.error.message);
  }

  const isInSegment = segments.data?.data.some(
    (segment) => segment.id === segmentId,
  );

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

export async function upsertResendContact(input: {
  email: string;
  name?: string | null;
  resendContactId?: string | null;
  segmentId?: string;
}) {
  const resend = getResendClient();

  if (!resend) {
    return null;
  }

  const email = input.email.trim().toLowerCase();
  const { firstName, lastName } = splitName(input.name);
  const updatePayload = {
    firstName,
    lastName,
    unsubscribed: false,
  };

  if (input.resendContactId) {
    const response = await resend.contacts.update({
      id: input.resendContactId,
      ...updatePayload,
    });

    if (response.error) {
      throw new Error(response.error.message);
    }

    const contactId = response.data?.id ?? input.resendContactId;
    await ensureContactInSegment(resend, contactId, input.segmentId);
    return contactId;
  }

  const existing = await resend.contacts.get({ email });

  if (existing.error && existing.error.statusCode !== 404) {
    throw new Error(existing.error.message);
  }

  if (existing.data?.id) {
    const response = await resend.contacts.update({
      id: existing.data.id,
      ...updatePayload,
    });

    if (response.error) {
      throw new Error(response.error.message);
    }

    const contactId = response.data?.id ?? existing.data.id;
    await ensureContactInSegment(resend, contactId, input.segmentId);
    return contactId;
  }

  const response = await resend.contacts.create({
    email,
    ...updatePayload,
    ...(input.segmentId
      ? {
          segments: [{ id: input.segmentId }],
        }
      : {}),
  });

  if (response.error) {
    throw new Error(response.error.message);
  }

  return response.data?.id ?? null;
}

export async function syncSignupContactToResend(input: {
  email: string;
  name?: string | null;
}) {
  return upsertResendContact({
    email: input.email,
    name: input.name,
    segmentId: getEnv().RESEND_SIGNUP_SEGMENT_ID,
  });
}
