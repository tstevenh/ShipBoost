import { z } from "zod";

import {
  LAUNCH_VIDEO_AVOID_NOTE_MAX_LENGTH,
  LAUNCH_VIDEO_FOCUS_NOTE_MAX_LENGTH,
  LAUNCH_VIDEO_HIGHLIGHT_MAX_LENGTH,
} from "@/lib/launch-video";

const screenshotSchema = z.object({
  role: z.enum(["before", "after"]),
  url: z.url(),
  publicId: z.string().trim().min(1).max(300),
});

export const launchVideoBriefSchema = z.object({
  focusNote: z.string().trim().max(LAUNCH_VIDEO_FOCUS_NOTE_MAX_LENGTH),
  highlightClaim: z.string().trim().max(LAUNCH_VIDEO_HIGHLIGHT_MAX_LENGTH),
  avoidNote: z.string().trim().max(LAUNCH_VIDEO_AVOID_NOTE_MAX_LENGTH),
  screenshots: z
    .array(screenshotSchema)
    .max(2)
    .refine(
      (shots) => new Set(shots.map((shot) => shot.role)).size === shots.length,
      "Add at most one before and one after screenshot.",
    ),
});

export type LaunchVideoBriefInput = z.infer<typeof launchVideoBriefSchema>;
