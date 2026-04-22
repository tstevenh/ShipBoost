import Link from "next/link";
import { CalendarDays, ExternalLink, Rocket } from "lucide-react";

import { SectionCard, StatusChip, type AdminLaunchWeek } from "@/components/admin/admin-console-shared";
import { LogoFallback } from "@/components/ui/logo-fallback";

function formatDate(date: string, options?: Intl.DateTimeFormatOptions) {
  const formatterOptions =
    options && Object.keys(options).length > 0
      ? options
      : ({ dateStyle: "medium" } satisfies Intl.DateTimeFormatOptions);

  return new Intl.DateTimeFormat("en-US", formatterOptions).format(new Date(date));
}

function getLaunchTone(status: "PENDING" | "APPROVED" | "LIVE") {
  if (status === "LIVE") {
    return "green" as const;
  }

  if (status === "APPROVED") {
    return "neutral" as const;
  }

  return "slate" as const;
}

function getLaunchTypeTone(type: "FREE" | "FEATURED" | "RELAUNCH") {
  if (type === "FEATURED") {
    return "amber" as const;
  }

  if (type === "RELAUNCH") {
    return "slate" as const;
  }

  return "neutral" as const;
}

export function LaunchSchedulePanel({
  weeks,
}: {
  weeks: AdminLaunchWeek[];
}) {
  return (
    <SectionCard
      eyebrow="Launch Ops"
      title="Launch Week Schedule"
      description="Scan upcoming launch weeks, then jump straight into the tool or submission that needs attention."
    >
      {weeks.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-muted/10 p-8 text-sm font-medium text-muted-foreground">
          No upcoming launches are scheduled yet.
        </div>
      ) : (
        <div className="space-y-6">
          {weeks.map((week) => (
            <section
              key={week.weekStart}
              className="rounded-3xl border border-border bg-card/60 p-5 shadow-sm"
            >
              <div className="flex flex-col gap-3 border-b border-border pb-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-[10px] font-black tracking-[0.28em] text-muted-foreground">
                    <CalendarDays size={12} />
                    Launch Week
                  </div>
                  <h3 className="text-xl font-black tracking-tight text-foreground">
                    {formatDate(week.weekStart)} to{" "}
                    {formatDate(week.weekEnd, {
                      month: "short",
                      day: "numeric",
                    })}
                  </h3>
                </div>
                <div className="inline-flex items-center gap-2 rounded-full border border-border bg-muted/20 px-3 py-1 text-[10px] font-black tracking-[0.2em] text-muted-foreground">
                  <Rocket size={12} />
                  {week.launchCount} launches
                </div>
              </div>

              <div className="mt-5 space-y-5">
                {week.days.map((day) => (
                  <div key={day.date} className="space-y-3">
                    <div className="text-xs font-black tracking-[0.18em] text-muted-foreground">
                      {formatDate(day.date, {
                        weekday: "long",
                        month: "short",
                        day: "numeric",
                      })}
                    </div>

                    <div className="space-y-3">
                      {day.entries.map((entry) => (
                        <article
                          key={entry.id}
                          className="flex flex-col gap-4 rounded-2xl border border-border bg-background/60 p-4 lg:flex-row lg:items-center lg:justify-between"
                        >
                          <div className="flex min-w-0 items-start gap-4">
                            <LogoFallback
                              name={entry.toolName}
                              src={entry.toolLogoUrl}
                              className="h-12 w-12 shrink-0 rounded-2xl border border-border"
                              imageClassName="object-cover"
                              sizes="48px"
                            />
                            <div className="min-w-0 space-y-2">
                              <div className="flex flex-wrap items-center gap-2">
                                <p className="truncate text-base font-black text-foreground">
                                  {entry.toolName}
                                </p>
                                <StatusChip
                                  label={entry.launchType}
                                  tone={getLaunchTypeTone(entry.launchType)}
                                />
                                {entry.status !== "APPROVED" ? (
                                  <StatusChip
                                    label={entry.status}
                                    tone={getLaunchTone(entry.status)}
                                  />
                                ) : null}
                              </div>
                              <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs font-medium text-muted-foreground">
                                <span>{formatDate(entry.launchDate, { dateStyle: "medium" })}</span>
                                {entry.latestSubmission?.founderEmail ? (
                                  <span>{entry.latestSubmission.founderEmail}</span>
                                ) : null}
                              </div>
                            </div>
                          </div>

                          <div className="flex flex-wrap items-center gap-2">
                            {entry.latestSubmission ? (
                              <Link
                                href={`/admin/submissions/${entry.latestSubmission.id}`}
                                className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-2 text-[10px] font-black tracking-[0.18em] text-foreground transition hover:bg-muted"
                              >
                                Submission
                              </Link>
                            ) : null}
                            <Link
                              href={`/tools/${entry.toolSlug}`}
                              target="_blank"
                              className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-2 text-[10px] font-black tracking-[0.18em] text-foreground transition hover:bg-muted"
                            >
                              Tool Page
                              <ExternalLink size={12} />
                            </Link>
                          </div>
                        </article>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </SectionCard>
  );
}
