"use client";

import { Download, RotateCcw, Share2, Timer, Trophy } from "lucide-react";
import type { KeyboardEvent } from "react";
import { useEffect, useMemo, useRef, useState } from "react";

type TestState = "idle" | "waiting" | "ready" | "early" | "complete";

export function getReactionSummary(rounds: number[]) {
  if (rounds.length === 0) {
    return { best: null, average: null };
  }

  const best = Math.min(...rounds);
  const average = Math.round(
    rounds.reduce((total, round) => total + round, 0) / rounds.length,
  );

  return { best, average };
}

export function getReactionInterpretation(average: number | null) {
  if (average === null) {
    return "Complete a round to see your benchmark.";
  }

  if (average < 180) {
    return "Exceptionally quick for a browser-based reflex test.";
  }

  if (average < 240) {
    return "Fast and competitive for most online reaction time tests.";
  }

  if (average < 320) {
    return "Typical for casual desktop and mobile reaction tests.";
  }

  return "Slower than typical. Try again with fewer distractions and the same device.";
}

function drawReactionCard(
  ctx: CanvasRenderingContext2D,
  input: {
    best: number | null;
    average: number | null;
    rounds: number[];
    interpretation: string;
  },
) {
  const width = 1200;
  const height = 675;
  const gradient = ctx.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, "#fafafa");
  gradient.addColorStop(0.55, "#f4f4f5");
  gradient.addColorStop(1, "#d4d4d8");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  ctx.fillStyle = "#0a0a0a";
  ctx.font = "900 56px Arial";
  ctx.fillText("Reaction Time Test", 72, 110);
  ctx.font = "700 26px Arial";
  ctx.fillStyle = "#71717a";
  ctx.fillText("Generated with ShipBoost free tools", 72, 152);

  ctx.fillStyle = "#ffffff";
  ctx.shadowColor = "rgba(0,0,0,0.12)";
  ctx.shadowBlur = 28;
  ctx.beginPath();
  ctx.roundRect(72, 220, 330, 210, 36);
  ctx.roundRect(435, 220, 330, 210, 36);
  ctx.roundRect(798, 220, 330, 210, 36);
  ctx.fill();
  ctx.shadowBlur = 0;

  ctx.fillStyle = "#71717a";
  ctx.font = "900 18px Arial";
  ctx.fillText("BEST", 112, 275);
  ctx.fillText("AVERAGE", 475, 275);
  ctx.fillText("ROUNDS", 838, 275);

  ctx.fillStyle = "#0a0a0a";
  ctx.font = "900 58px Arial";
  ctx.fillText(input.best === null ? "--" : `${input.best} ms`, 112, 352);
  ctx.fillText(input.average === null ? "--" : `${input.average} ms`, 475, 352);
  ctx.fillText(`${input.rounds.length}/5`, 838, 352);

  ctx.fillStyle = "#27272a";
  ctx.font = "700 28px Arial";
  ctx.fillText(input.interpretation, 72, 530);
}

export function ReactionTimeTestTool() {
  const [state, setState] = useState<TestState>("idle");
  const [rounds, setRounds] = useState<number[]>([]);
  const [lastResult, setLastResult] = useState<number | null>(null);
  const readyAtRef = useRef<number | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const downloadLinkRef = useRef<HTMLAnchorElement>(null);
  const summary = useMemo(() => getReactionSummary(rounds), [rounds]);
  const roundsRemaining = Math.max(0, 5 - rounds.length);
  const interpretation = getReactionInterpretation(summary.average);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  function clearWaitTimer() {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }

  function startRound() {
    clearWaitTimer();
    setLastResult(null);
    setState("waiting");

    const delay = 1200 + Math.floor(Math.random() * 2200);
    timeoutRef.current = setTimeout(() => {
      readyAtRef.current = Date.now();
      setState("ready");
    }, delay);
  }

  function recordReaction() {
    if (state === "waiting") {
      clearWaitTimer();
      readyAtRef.current = null;
      setState("early");
      return;
    }

    if (state !== "ready" || readyAtRef.current === null) {
      return;
    }

    const result = Math.max(0, Date.now() - readyAtRef.current);
    const nextRounds = [...rounds, result].slice(-5);
    readyAtRef.current = null;
    setRounds(nextRounds);
    setLastResult(result);
    setState(nextRounds.length >= 5 ? "complete" : "idle");
  }

  function reset() {
    clearWaitTimer();
    readyAtRef.current = null;
    setState("idle");
    setRounds([]);
    setLastResult(null);
  }

  function getShareText() {
    if (summary.average === null) {
      return "I am about to take the ShipBoost reaction time test.";
    }

    return `I scored a ${summary.average} ms average and ${summary.best} ms best on the ShipBoost reaction time test.`;
  }

  async function shareResult() {
    const text = getShareText();
    const url = window.location.href;

    if (navigator.share) {
      await navigator.share({
        title: "Reaction Time Test result",
        text,
        url,
      });
      return;
    }

    await navigator.clipboard?.writeText(`${text} ${url}`);
  }

  function downloadResult() {
    const canvas = document.createElement("canvas");
    canvas.width = 1200;
    canvas.height = 675;
    const ctx = canvas.getContext("2d");

    if (!ctx) {
      return;
    }

    drawReactionCard(ctx, {
      best: summary.best,
      average: summary.average,
      rounds,
      interpretation,
    });

    const link = downloadLinkRef.current;

    if (link) {
      link.href = canvas.toDataURL("image/png");
      link.download = "reaction-time-result.png";
      link.click();
    }
  }

  function handlePanelKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    if (event.key !== " " && event.key !== "Enter") {
      return;
    }

    event.preventDefault();

    if (state === "idle" || state === "early" || state === "complete") {
      startRound();
    } else {
      recordReaction();
    }
  }

  const panelCopy = {
    idle: rounds.length === 0 ? "Start test" : "Next round",
    waiting: "Wait for green",
    ready: "Click now",
    early: "Too soon. Try again",
    complete: "Run another test",
  }[state];

  const panelTone =
    state === "ready"
      ? "border-emerald-500 bg-emerald-500 text-white"
      : state === "waiting"
        ? "border-zinc-950 bg-zinc-950 text-white dark:border-zinc-50 dark:bg-zinc-50 dark:text-zinc-950"
        : state === "early"
          ? "border-red-500 bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-200"
          : "border-border bg-card text-foreground";

  return (
    <section
      aria-label="Reaction time test"
      className="grid gap-6 rounded-[2rem] border border-border bg-card p-5 shadow-sm lg:grid-cols-[1.15fr_0.85fr] lg:p-6"
    >
      <div className="space-y-4">
        <button
          type="button"
          onClick={
            state === "idle" || state === "early" || state === "complete"
              ? startRound
              : recordReaction
          }
          onKeyDown={handlePanelKeyDown}
          className={`flex aspect-[4/3] w-full flex-col items-center justify-center rounded-[1.5rem] border-2 px-6 text-center transition-colors ${panelTone}`}
          aria-live="polite"
        >
          <Timer size={42} aria-hidden="true" />
          <span className="mt-4 text-4xl font-black tracking-tight sm:text-5xl">
            {panelCopy}
          </span>
          <span className="mt-3 max-w-md text-sm font-bold opacity-75">
            {state === "waiting"
              ? "Clicking before the color changes marks the round as too early."
              : "Use mouse, tap, Space, or Enter. Keep your device consistent when comparing scores."}
          </span>
        </button>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={startRound}
            className="inline-flex items-center justify-center rounded-2xl bg-foreground px-5 py-3 text-sm font-black text-background transition-opacity hover:opacity-90"
          >
            Start round
          </button>
          <button
            type="button"
            onClick={reset}
            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-border bg-background px-5 py-3 text-sm font-black text-foreground transition-colors hover:bg-muted"
          >
            <RotateCcw size={16} aria-hidden="true" />
            Reset
          </button>
          <span className="text-sm font-bold text-muted-foreground">
            {roundsRemaining} {roundsRemaining === 1 ? "round" : "rounds"} until a
            full five-round set
          </span>
        </div>
      </div>

      <aside className="rounded-[1.5rem] border border-border bg-background p-5">
        <div className="flex items-center gap-2">
          <Trophy size={18} className="text-foreground" aria-hidden="true" />
          <h2 className="text-xl font-black tracking-tight">Session results</h2>
        </div>

        <dl className="mt-5 grid grid-cols-2 gap-3">
          <div className="rounded-2xl border border-border bg-card p-4">
            <dt className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
              Best
            </dt>
            <dd className="mt-2 text-3xl font-black">
              {summary.best === null ? "--" : `${summary.best} ms`}
            </dd>
          </div>
          <div className="rounded-2xl border border-border bg-card p-4">
            <dt className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
              Average
            </dt>
            <dd className="mt-2 text-3xl font-black">
              {summary.average === null ? "--" : `${summary.average} ms`}
            </dd>
          </div>
        </dl>

        <p className="mt-4 rounded-2xl bg-muted/50 p-4 text-sm font-bold leading-6 text-muted-foreground">
          {lastResult === null
            ? interpretation
            : `Last round: ${lastResult} ms. ${interpretation}`}
        </p>

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => void shareResult()}
            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-border bg-card px-4 py-3 text-sm font-black text-foreground transition-colors hover:bg-muted"
          >
            <Share2 size={16} aria-hidden="true" />
            Share result
          </button>
          <button
            type="button"
            onClick={downloadResult}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-foreground px-4 py-3 text-sm font-black text-background transition-opacity hover:opacity-90"
          >
            <Download size={16} aria-hidden="true" />
            Download PNG
          </button>
          <a ref={downloadLinkRef} className="hidden" aria-hidden="true">
            Download reaction result
          </a>
        </div>

        <ol className="mt-5 grid gap-2" aria-label="Recorded rounds">
          {Array.from({ length: 5 }, (_, index) => {
            const value = rounds[index];

            return (
              <li
                key={index}
                className="flex items-center justify-between rounded-xl border border-border bg-card px-4 py-3 text-sm font-bold"
              >
                <span className="text-muted-foreground">Round {index + 1}</span>
                <span>{value === undefined ? "--" : `${value} ms`}</span>
              </li>
            );
          })}
        </ol>

      </aside>
    </section>
  );
}
