import { capturePostHogEventSafely } from "@/server/posthog";
import type { LaunchFunnelEventInput } from "@/server/validators/launch-funnel";

/**
 * Launch step events, sent from the server so ad blockers don't drop them.
 * With premium_checkout_started, premium_launch_paid and free_launch_scheduled
 * they make the submit funnel.
 */
export async function trackLaunchFunnelEvent(
  input: LaunchFunnelEventInput,
  founder: { id: string },
) {
  await capturePostHogEventSafely(
    {
      distinctId: founder.id,
      event: input.event,
      properties: {
        submission_id: input.submissionId,
        launch_type: input.launchType,
      },
    },
    "trackLaunchFunnelEvent",
  );
}
