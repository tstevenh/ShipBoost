"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  CalendarDays,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  Rocket,
} from "lucide-react";

import {
  SectionCard,
  StatusChip,
  type AdminLaunchEntry,
  type AdminLaunchMonth,
  type AdminLaunchWeek,
  type AdminNextFreeLaunchEstimate,
} from "@/components/admin/admin-console-shared";
import { LogoFallback } from "@/components/ui/logo-fallback";

function formatDate(date: string, options?: Intl.DateTimeFormatOptions) {
  const formatterOptions =
    options && Object.keys(options).length > 0
      ? options
      : ({ dateStyle: "medium" } satisfies Intl.DateTimeFormatOptions);

  return new Intl.DateTimeFormat("en-US", formatterOptions).format(
    new Date(date),
  );
}

function getLaunchTone(status: "PENDING" | "APPROVED" | "LIVE" | "ENDED") {
  if (status === "LIVE") {
    return "green" as const;
  }

  if (status === "APPROVED") {
    return "neutral" as const;
  }

  return "slate" as const;
}

function isPastPeriod(periodEnd: string) {
  return new Date(periodEnd).getTime() <= Date.now();
}

function getDefaultMonthExpanded(month: AdminLaunchMonth) {
  return !isPastPeriod(month.monthEnd);
}

function getDefaultWeekExpanded(week: AdminLaunchWeek) {
  return !isPastPeriod(week.weekEnd);
}

function getMonthTitle(month: AdminLaunchMonth) {
  return formatDate(month.monthStart, {
    month: "long",
    year: "numeric",
  });
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

function LaunchEntryCard({ entry }: { entry: AdminLaunchEntry }) {
  return (
    <article className="flex flex-col gap-4 rounded-2xl border border-border bg-background/60 p-4 lg:flex-row lg:items-center lg:justify-between">
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
              <StatusChip label={entry.status} tone={getLaunchTone(entry.status)} />
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
  );
}

export function LaunchSchedulePanel({
  months,
  nextFreeLaunch,
}: {
  months: AdminLaunchMonth[];
  nextFreeLaunch: AdminNextFreeLaunchEstimate | null;
}) {
  const [expandedMonths, setExpandedMonths] = useState<Record<string, boolean>>({});
  const [expandedWeeks, setExpandedWeeks] = useState<Record<string, boolean>>({});

  const allWeeks = useMemo(
    () => months.flatMap((month) => month.weeks),
    [months],
  );
  const expandedMonthCount = useMemo(
    () =>
      months.filter(
        (month) =>
          expandedMonths[month.monthStart] ?? getDefaultMonthExpanded(month),
      ).length,
    [expandedMonths, months],
  );
  const expandedWeekCount = useMemo(
    () =>
      months.reduce((total, month) => {
        const isMonthExpanded =
          expandedMonths[month.monthStart] ?? getDefaultMonthExpanded(month);

        if (!isMonthExpanded) {
          return total;
        }

        return (
          total +
          month.weeks.filter(
            (week) =>
              expandedWeeks[week.weekStart] ?? getDefaultWeekExpanded(week),
          ).length
        );
      }, 0),
    [expandedMonths, expandedWeeks, months],
  );

  function toggleMonth(month: AdminLaunchMonth) {
    setExpandedMonths((current) => ({
      ...current,
      [month.monthStart]:
        !(current[month.monthStart] ?? getDefaultMonthExpanded(month)),
    }));
  }

  function toggleWeek(week: AdminLaunchWeek) {
    setExpandedWeeks((current) => ({
      ...current,
      [week.weekStart]:
        !(current[week.weekStart] ?? getDefaultWeekExpanded(week)),
    }));
  }

  function setAll(expanded: boolean) {
    setExpandedMonths(
      Object.fromEntries(months.map((month) => [month.monthStart, expanded])),
    );
    setExpandedWeeks(
      Object.fromEntries(allWeeks.map((week) => [week.weekStart, expanded])),
    );
  }

  return (
    <SectionCard
      eyebrow="Launch Ops"
      title="Launch History"
      description="Scan launch history and upcoming launch weeks, then jump straight into the tool or submission that needs attention."
    >
      {nextFreeLaunch ? (
        <div className="mb-6 flex flex-col gap-3 rounded-2xl border border-border bg-muted/10 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <div className="text-[10px] font-black tracking-[0.28em] text-muted-foreground">
              Next Free Launch Slot
            </div>
            <p className="text-sm font-black text-foreground">
              {formatDate(nextFreeLaunch.launchDate, {
                weekday: "long",
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </p>
            <p className="text-xs font-medium text-muted-foreground">
              {nextFreeLaunch.daysFromNow === 0
                ? "Available today"
                : `In ${nextFreeLaunch.daysFromNow} day${nextFreeLaunch.daysFromNow === 1 ? "" : "s"}`}
            </p>
          </div>
          <div className="inline-flex items-center gap-2 self-start rounded-full border border-border bg-card px-3 py-1 text-[10px] font-black tracking-[0.2em] text-muted-foreground sm:self-auto">
            <Rocket size={12} />
            ETA for next founder submission
          </div>
        </div>
      ) : null}
      {months.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-muted/10 p-8 text-sm font-medium text-muted-foreground">
          No launches are scheduled yet.
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex flex-col gap-3 rounded-2xl border border-border bg-muted/10 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
              <p className="text-xs font-black text-foreground">
                {expandedMonthCount} of {months.length} months expanded
              </p>
              <p className="text-xs font-medium text-muted-foreground">
                {expandedWeekCount} of {allWeeks.length} weeks expanded. Past
                months and past weeks start collapsed.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setAll(true)}
                className="inline-flex items-center justify-center rounded-xl border border-border bg-card px-3 py-2 text-[10px] font-black tracking-[0.18em] text-foreground transition hover:bg-muted"
              >
                Expand all
              </button>
              <button
                type="button"
                onClick={() => setAll(false)}
                className="inline-flex items-center justify-center rounded-xl border border-border bg-card px-3 py-2 text-[10px] font-black tracking-[0.18em] text-foreground transition hover:bg-muted"
              >
                Collapse all
              </button>
            </div>
          </div>

          {months.map((month) => {
            const isMonthExpanded =
              expandedMonths[month.monthStart] ?? getDefaultMonthExpanded(month);
            const pastMonth = isPastPeriod(month.monthEnd);

            return (
              <section
                key={month.monthStart}
                className="rounded-3xl border border-border bg-card/60 p-5 shadow-sm"
              >
                <button
                  type="button"
                  onClick={() => toggleMonth(month)}
                  aria-expanded={isMonthExpanded}
                  className={`flex w-full flex-col gap-3 text-left sm:flex-row sm:items-center sm:justify-between ${
                    isMonthExpanded ? "border-b border-border pb-4" : ""
                  }`}
                >
                  <div className="flex min-w-0 items-start gap-3">
                    <span className="mt-1 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-border bg-background text-muted-foreground">
                      {isMonthExpanded ? (
                        <ChevronDown size={16} />
                      ) : (
                        <ChevronRight size={16} />
                      )}
                    </span>
                    <div className="min-w-0 space-y-1">
                      <div className="flex items-center gap-2 text-[10px] font-black tracking-[0.28em] text-muted-foreground">
                        <CalendarDays size={12} />
                        {pastMonth ? "Past Month" : "Launch Month"}
                      </div>
                      <h3 className="text-xl font-black tracking-tight text-foreground">
                        {getMonthTitle(month)}
                      </h3>
                    </div>
                  </div>
                  <div className="inline-flex items-center gap-2 rounded-full border border-border bg-muted/20 px-3 py-1 text-[10px] font-black tracking-[0.2em] text-muted-foreground">
                    <Rocket size={12} />
                    {month.launchCount} launches
                  </div>
                </button>

                {isMonthExpanded ? (
                  <div className="mt-5 space-y-4">
                    {month.weeks.map((week) => {
                      const isWeekExpanded =
                        expandedWeeks[week.weekStart] ??
                        getDefaultWeekExpanded(week);
                      const pastWeek = isPastPeriod(week.weekEnd);

                      return (
                        <section
                          key={week.weekStart}
                          className="rounded-2xl border border-border bg-background/50 p-4"
                        >
                          <button
                            type="button"
                            onClick={() => toggleWeek(week)}
                            aria-expanded={isWeekExpanded}
                            className={`flex w-full flex-col gap-3 text-left sm:flex-row sm:items-center sm:justify-between ${
                              isWeekExpanded ? "border-b border-border pb-3" : ""
                            }`}
                          >
                            <div className="flex items-start gap-3">
                              <span className="mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground">
                                {isWeekExpanded ? (
                                  <ChevronDown size={14} />
                                ) : (
                                  <ChevronRight size={14} />
                                )}
                              </span>
                              <div className="min-w-0">
                                <div className="text-[10px] font-black tracking-[0.2em] text-muted-foreground">
                                  {pastWeek ? "Past Week" : "Launch Week"}
                                </div>
                                <h4 className="mt-1 text-sm font-black text-foreground">
                                  {formatDate(week.weekStart)} to{" "}
                                  {formatDate(week.weekEnd, {
                                    month: "short",
                                    day: "numeric",
                                  })}
                                </h4>
                              </div>
                            </div>
                            <div className="inline-flex items-center gap-2 rounded-full border border-border bg-muted/20 px-3 py-1 text-[10px] font-black tracking-[0.2em] text-muted-foreground">
                              <Rocket size={12} />
                              {week.launchCount} launches
                            </div>
                          </button>

                          {isWeekExpanded ? (
                            <div className="mt-4 space-y-5">
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
                                      <LaunchEntryCard key={entry.id} entry={entry} />
                                    ))}
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="mt-3 text-xs font-medium text-muted-foreground">
                              Hidden. Expand this week to review {week.launchCount}
                              scheduled launch{week.launchCount === 1 ? "" : "es"}.
                            </div>
                          )}
                        </section>
                      );
                    })}
                  </div>
                ) : (
                  <div className="mt-3 text-xs font-medium text-muted-foreground">
                    Hidden. Expand {getMonthTitle(month)} to review{" "}
                    {month.weeks.length} week{month.weeks.length === 1 ? "" : "s"} and{" "}
                    {month.launchCount} scheduled launch
                    {month.launchCount === 1 ? "" : "es"}.
                  </div>
                )}
              </section>
            );
          })}
        </div>
      )}
    </SectionCard>
  );
}
