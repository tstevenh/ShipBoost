"use client";

/* eslint-disable @next/next/no-img-element -- Dynamic brand/custom icon URLs cannot use the fixed next/image host allowlist. */

import { Camera, Download, Flashlight, ImagePlus } from "lucide-react";
import { useRef, useState } from "react";

type PlatformKey =
  | "paypal"
  | "stripe"
  | "instagram"
  | "x"
  | "tiktok"
  | "linkedin"
  | "shopify"
  | "gmail"
  | "spark"
  | "snapchat"
  | "discord"
  | "custom";
type ThemeKey = "light" | "dark";
type WallpaperKey = "aurora" | "graphite" | "blueprint" | "prism";
type PositionKey = "top" | "middle" | "bottom";
type StyleKey = "classic" | "glass";

type PlatformPreset = {
  label: string;
  title: string;
  message: string;
  accent: string;
  iconUrl: string;
};

const platformPresets: Record<PlatformKey, PlatformPreset> = {
  paypal: {
    label: "PayPal",
    title: "PayPal",
    message: "You received $49.00 from a new customer.",
    accent: "#003087",
    iconUrl: "https://cdn.simpleicons.org/paypal/003087",
  },
  stripe: {
    label: "Stripe",
    title: "Stripe",
    message: "You received a payment of $XX.XX from founder@example.com.",
    accent: "#635BFF",
    iconUrl: "https://cdn.simpleicons.org/stripe/635BFF",
  },
  instagram: {
    label: "Instagram",
    title: "Instagram",
    message: "shipboosthq liked your launch post.",
    accent: "#E4405F",
    iconUrl: "https://cdn.simpleicons.org/instagram/E4405F",
  },
  x: {
    label: "X / Twitter",
    title: "X",
    message: "Your launch thread is getting new replies.",
    accent: "#111111",
    iconUrl: "https://cdn.simpleicons.org/x/111111",
  },
  tiktok: {
    label: "TikTok",
    title: "TikTok",
    message: "Your demo clip is getting more views.",
    accent: "#000000",
    iconUrl: "https://cdn.simpleicons.org/tiktok/000000",
  },
  linkedin: {
    label: "LinkedIn",
    title: "LinkedIn",
    message: "A founder commented on your launch update.",
    accent: "#0A66C2",
    iconUrl:
      "data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2064%2064%22%3E%3Crect%20width%3D%2264%22%20height%3D%2264%22%20rx%3D%2212%22%20fill%3D%22%230A66C2%22%2F%3E%3Ccircle%20cx%3D%2218%22%20cy%3D%2218%22%20r%3D%226%22%20fill%3D%22white%22%2F%3E%3Cpath%20fill%3D%22white%22%20d%3D%22M13%2028h10v24H13zM29%2028h9v4c2-3%205-5%2010-5%208%200%2013%205%2013%2016v9H51v-8c0-6-2-8-6-8s-6%203-6%208v8H29z%22%2F%3E%3C%2Fsvg%3E",
  },
  shopify: {
    label: "Shopify",
    title: "Shopify",
    message: "New order #1042 was placed from your storefront.",
    accent: "#7AB55C",
    iconUrl: "https://cdn.simpleicons.org/shopify/7AB55C",
  },
  gmail: {
    label: "Gmail",
    title: "Gmail",
    message: "New inquiry: Partnership request for your SaaS.",
    accent: "#EA4335",
    iconUrl: "https://cdn.simpleicons.org/gmail/EA4335",
  },
  spark: {
    label: "Spark",
    title: "Spark",
    message: "New email from a launch partner.",
    accent: "#F97316",
    iconUrl: "https://cdn.simpleicons.org/sparkpost/F97316",
  },
  snapchat: {
    label: "Snapchat",
    title: "Snapchat",
    message: "Alex sent you a snap.",
    accent: "#FFFC00",
    iconUrl: "https://cdn.simpleicons.org/snapchat/FFFC00",
  },
  discord: {
    label: "Discord",
    title: "Discord",
    message: "New message in #launch-room: your product is live.",
    accent: "#5865F2",
    iconUrl: "https://cdn.simpleicons.org/discord/5865F2",
  },
  custom: {
    label: "Custom app",
    title: "Your App",
    message: "A new product milestone is ready to share.",
    accent: "#111827",
    iconUrl: "",
  },
};

const wallpapers: Record<WallpaperKey, string> = {
  aurora:
    "radial-gradient(circle at 70% 8%, rgba(79,124,255,0.82) 0 13%, transparent 36%), radial-gradient(circle at 18% 14%, #effdf4 0 28%, transparent 55%), linear-gradient(145deg, #dcfff2 0%, #8ccbf8 54%, #244fbc 100%)",
  graphite: "linear-gradient(145deg, #050505 0%, #1c1c21 58%, #54545f 100%)",
  blueprint: "linear-gradient(145deg, #06182f 0%, #1664ad 48%, #93c5fd 100%)",
  prism: "linear-gradient(145deg, #2e1065 0%, #db2777 45%, #facc15 100%)",
};

const wallpaperLabels: Record<WallpaperKey, string> = {
  aurora: "Aurora",
  graphite: "Graphite",
  blueprint: "Blueprint",
  prism: "Prism",
};

function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + width, y, x + width, y + height, radius);
  ctx.arcTo(x + width, y + height, x, y + height, radius);
  ctx.arcTo(x, y + height, x, y, radius);
  ctx.arcTo(x, y, x + width, y, radius);
  ctx.closePath();
}

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
) {
  const words = text.split(" ");
  const lines: string[] = [];
  let line = "";

  for (const word of words) {
    const testLine = line ? `${line} ${word}` : word;
    if (ctx.measureText(testLine).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = testLine;
    }
  }

  lines.push(line);
  lines.slice(0, 3).forEach((lineText, index) => {
    ctx.fillText(lineText, x, y + index * lineHeight);
  });
}

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = src;
  });
}

export function FakeNotificationGenerator() {
  const [platform, setPlatform] = useState<PlatformKey>("stripe");
  const [theme, setTheme] = useState<ThemeKey>("light");
  const [wallpaper, setWallpaper] = useState<WallpaperKey>("aurora");
  const [wallpaperImage, setWallpaperImage] = useState<string | null>(null);
  const [customIcon, setCustomIcon] = useState<string | null>(null);
  const [position, setPosition] = useState<PositionKey>("top");
  const [style, setStyle] = useState<StyleKey>("glass");
  const [showHeader, setShowHeader] = useState(false);
  const [showButtons, setShowButtons] = useState(true);
  const [title, setTitle] = useState(platformPresets.stripe.title);
  const [message, setMessage] = useState(platformPresets.stripe.message);
  const [timestamp, setTimestamp] = useState("2m ago");
  const [carrier, setCarrier] = useState("ShipBoost");
  const [lockTime, setLockTime] = useState("23:42");
  const [lockDate, setLockDate] = useState("Saturday, May 9");
  const downloadLinkRef = useRef<HTMLAnchorElement>(null);

  const preset = platformPresets[platform];
  const iconSrc = customIcon ?? preset.iconUrl;
  const isDarkCard = theme === "dark";
  const notificationPosition =
    position === "middle"
      ? "top-1/2 -translate-y-1/2"
      : position === "bottom"
        ? "bottom-24"
        : "top-[15.5rem]";
  const phoneBackground = wallpaperImage
    ? { backgroundImage: `url(${wallpaperImage})` }
    : { background: wallpapers[wallpaper] };

  function handlePlatformChange(nextPlatform: PlatformKey) {
    const nextPreset = platformPresets[nextPlatform];
    setPlatform(nextPlatform);
    setTitle(nextPreset.title);
    setMessage(nextPreset.message);
    if (nextPlatform !== "custom") {
      setCustomIcon(null);
    }
  }

  async function handleIconUpload(file: File | undefined) {
    if (!file) {
      return;
    }

    setCustomIcon(await readFileAsDataUrl(file));
    setPlatform("custom");
  }

  async function handleWallpaperUpload(file: File | undefined) {
    if (!file) {
      return;
    }

    setWallpaperImage(await readFileAsDataUrl(file));
  }

  async function exportPng() {
    const canvas = document.createElement("canvas");
    const width = 900;
    const height = 1600;
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");

    if (!ctx) {
      return;
    }

    if (wallpaperImage) {
      try {
        const background = await loadImage(wallpaperImage);
        ctx.drawImage(background, 0, 0, width, height);
      } catch {
        ctx.fillStyle = "#111827";
        ctx.fillRect(0, 0, width, height);
      }
    } else {
      const gradient = ctx.createLinearGradient(0, 0, width, height);
      const stops: Record<WallpaperKey, [string, string, string]> = {
        aurora: ["#dcfff2", "#8ccbf8", "#244fbc"],
        graphite: ["#050505", "#1c1c21", "#54545f"],
        blueprint: ["#06182f", "#1664ad", "#93c5fd"],
        prism: ["#2e1065", "#db2777", "#facc15"],
      };
      const [start, middle, end] = stops[wallpaper];
      gradient.addColorStop(0, start);
      gradient.addColorStop(0.5, middle);
      gradient.addColorStop(1, end);
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);
    }

    ctx.fillStyle = "rgba(255,255,255,0.92)";
    ctx.font = "700 32px Arial";
    ctx.fillText(carrier || "Carrier", 76, 88);
    ctx.fillText(lockTime || "9:41", 398, 230);
    ctx.font = "700 28px Arial";
    ctx.fillText(lockDate || "Today", 326, 278);

    if (showHeader) {
      ctx.fillStyle = "rgba(255,255,255,0.74)";
      ctx.font = "800 28px Arial";
      ctx.fillText("Notification Center", 76, 410);
    }

    const cardY = position === "middle" ? 700 : position === "bottom" ? 1110 : 470;
    ctx.shadowColor = "rgba(0,0,0,0.28)";
    ctx.shadowBlur = 34;
    ctx.fillStyle =
      style === "glass"
        ? isDarkCard
          ? "rgba(22,22,26,0.76)"
          : "rgba(255,255,255,0.78)"
        : isDarkCard
          ? "#16161a"
          : "#f7f7f8";
    drawRoundedRect(ctx, 56, cardY, 788, 190, 48);
    ctx.fill();
    ctx.shadowBlur = 0;

    ctx.fillStyle = preset.accent;
    drawRoundedRect(ctx, 94, cardY + 38, 88, 88, 22);
    ctx.fill();

    if (iconSrc) {
      try {
        const icon = await loadImage(iconSrc);
        ctx.drawImage(icon, 112, cardY + 56, 52, 52);
      } catch {
        ctx.fillStyle = "#fff";
        ctx.font = "900 36px Arial";
        ctx.fillText(title.slice(0, 1).toUpperCase() || "A", 123, cardY + 94);
      }
    }

    ctx.fillStyle = isDarkCard ? "#ffffff" : "#111827";
    ctx.font = "900 32px Arial";
    ctx.fillText(title || "Notification", 210, cardY + 72);
    ctx.fillStyle = isDarkCard ? "#d4d4d8" : "#52525b";
    ctx.font = "800 24px Arial";
    ctx.fillText(timestamp || "now", 720, cardY + 72);
    ctx.font = "650 28px Arial";
    wrapText(ctx, message || "Write your notification message.", 210, cardY + 114, 560, 35);

    if (showButtons) {
      ctx.fillStyle = "rgba(255,255,255,0.28)";
      ctx.beginPath();
      ctx.arc(186, 1450, 54, 0, Math.PI * 2);
      ctx.arc(714, 1450, 54, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = "#ffffff";
      ctx.fillRect(172, 1425, 28, 28);
      ctx.fillRect(179, 1453, 14, 26);
      ctx.beginPath();
      ctx.arc(186, 1483, 10, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 7;
      drawRoundedRect(ctx, 696, 1432, 36, 30, 6);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(714, 1447, 8, 0, Math.PI * 2);
      ctx.stroke();
    }

    const url = canvas.toDataURL("image/png");
    const link = downloadLinkRef.current;

    if (link) {
      link.href = url;
      link.download = `${platform}-notification-mockup.png`;
      link.click();
    }
  }

  return (
    <section
      aria-label="Fake notification generator"
      className="grid gap-6 rounded-[2rem] border border-border bg-card p-4 shadow-sm lg:grid-cols-[minmax(0,0.9fr)_minmax(380px,1.1fr)] lg:p-6"
    >
      <div className="space-y-5">
        <div>
          <label
            htmlFor="platform"
            className="text-xs font-black uppercase tracking-widest text-muted-foreground"
          >
            Application
          </label>
          <div className="mt-3 grid grid-cols-4 gap-2 sm:grid-cols-6">
            {Object.entries(platformPresets).map(([key, item]) => (
              <button
                key={key}
                type="button"
                onClick={() => handlePlatformChange(key as PlatformKey)}
                className={`flex h-14 items-center justify-center rounded-2xl border transition-colors ${
                  platform === key
                    ? "border-foreground bg-foreground text-background"
                    : "border-border bg-background hover:bg-muted"
                }`}
                aria-label={`Use ${item.label} preset`}
              >
                {item.iconUrl ? (
                  <img
                    src={item.iconUrl}
                    alt=""
                    className="h-7 w-7 rounded-xl bg-white p-1 object-contain shadow-sm ring-1 ring-black/5"
                    crossOrigin="anonymous"
                  />
                ) : (
                  <span className="text-xs font-black">+</span>
                )}
              </button>
            ))}
          </div>
          <select
            id="platform"
            value={platform}
            onChange={(event) => handlePlatformChange(event.target.value as PlatformKey)}
            className="sr-only"
          >
            {Object.entries(platformPresets).map(([key, item]) => (
              <option key={key} value={key}>
                {item.label}
              </option>
            ))}
          </select>
          <label className="mt-3 inline-flex cursor-pointer items-center gap-2 rounded-2xl border border-dashed border-border bg-background px-4 py-3 text-xs font-black text-muted-foreground transition-colors hover:bg-muted">
            <ImagePlus size={16} aria-hidden="true" />
            Upload custom app icon
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="sr-only"
              onChange={(event) => void handleIconUpload(event.target.files?.[0])}
            />
          </label>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="text-sm font-bold text-foreground">
            Title
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              className="mt-2 h-12 w-full rounded-2xl border border-input bg-background px-4 text-sm font-bold outline-none focus:ring-2 focus:ring-ring"
            />
          </label>
          <label className="text-sm font-bold text-foreground">
            Time
            <input
              value={timestamp}
              onChange={(event) => setTimestamp(event.target.value)}
              className="mt-2 h-12 w-full rounded-2xl border border-input bg-background px-4 text-sm font-bold outline-none focus:ring-2 focus:ring-ring"
            />
          </label>
        </div>

        <label className="block text-sm font-bold text-foreground">
          Description
          <textarea
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            rows={4}
            className="mt-2 w-full resize-none rounded-2xl border border-input bg-background px-4 py-3 text-sm font-bold leading-6 outline-none focus:ring-2 focus:ring-ring"
          />
        </label>

        <div className="grid gap-4 sm:grid-cols-3">
          <label className="text-sm font-bold text-foreground">
            Carrier
            <input
              value={carrier}
              onChange={(event) => setCarrier(event.target.value)}
              className="mt-2 h-12 w-full rounded-2xl border border-input bg-background px-4 text-sm font-bold outline-none focus:ring-2 focus:ring-ring"
            />
          </label>
          <label className="text-sm font-bold text-foreground">
            Custom time
            <input
              value={lockTime}
              onChange={(event) => setLockTime(event.target.value)}
              className="mt-2 h-12 w-full rounded-2xl border border-input bg-background px-4 text-sm font-bold outline-none focus:ring-2 focus:ring-ring"
            />
          </label>
          <label className="text-sm font-bold text-foreground">
            Position
            <select
              value={position}
              onChange={(event) => setPosition(event.target.value as PositionKey)}
              className="mt-2 h-12 w-full rounded-2xl border border-input bg-background px-4 text-sm font-bold outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="top">Top</option>
              <option value="middle">Middle</option>
              <option value="bottom">Bottom</option>
            </select>
          </label>
        </div>

        <label className="block text-sm font-bold text-foreground">
          Custom date
          <input
            value={lockDate}
            onChange={(event) => setLockDate(event.target.value)}
            className="mt-2 h-12 w-full rounded-2xl border border-input bg-background px-4 text-sm font-bold outline-none focus:ring-2 focus:ring-ring"
          />
        </label>

        <div>
          <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">
            Wallpaper
          </p>
          <div className="mt-3 grid grid-cols-4 gap-2">
            {Object.entries(wallpapers).map(([key, value]) => (
              <button
                key={key}
                type="button"
                onClick={() => {
                  setWallpaper(key as WallpaperKey);
                  setWallpaperImage(null);
                }}
                className={`h-16 rounded-2xl border ${wallpaper === key && !wallpaperImage ? "border-foreground" : "border-border"}`}
                style={{ background: value }}
                aria-label={`Use ${wallpaperLabels[key as WallpaperKey]} wallpaper`}
              />
            ))}
          </div>
          <label className="mt-3 inline-flex cursor-pointer items-center gap-2 rounded-2xl border border-dashed border-border bg-background px-4 py-3 text-xs font-black text-muted-foreground transition-colors hover:bg-muted">
            <ImagePlus size={16} aria-hidden="true" />
            Upload wallpaper
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="sr-only"
              onChange={(event) => void handleWallpaperUpload(event.target.files?.[0])}
            />
          </label>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="text-sm font-bold text-foreground">
            Theme
            <select
              value={theme}
              onChange={(event) => setTheme(event.target.value as ThemeKey)}
              className="mt-2 h-12 w-full rounded-2xl border border-input bg-background px-4 text-sm font-bold outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="light">Light</option>
              <option value="dark">Dark</option>
            </select>
          </label>
          <label className="text-sm font-bold text-foreground">
            Style
            <select
              value={style}
              onChange={(event) => setStyle(event.target.value as StyleKey)}
              className="mt-2 h-12 w-full rounded-2xl border border-input bg-background px-4 text-sm font-bold outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="classic">Classic</option>
              <option value="glass">Liquid glass</option>
            </select>
          </label>
        </div>

        <div className="grid gap-3 rounded-2xl border border-border bg-background p-4">
          <label className="flex items-center justify-between gap-4 text-sm font-bold">
            Show Notification Center header
            <input
              type="checkbox"
              checked={showHeader}
              onChange={(event) => setShowHeader(event.target.checked)}
              className="h-5 w-5 accent-foreground"
            />
          </label>
          <label className="flex items-center justify-between gap-4 text-sm font-bold">
            Show flashlight and camera buttons
            <input
              type="checkbox"
              checked={showButtons}
              onChange={(event) => setShowButtons(event.target.checked)}
              className="h-5 w-5 accent-foreground"
            />
          </label>
        </div>

        <button
          type="button"
          onClick={() => void exportPng()}
          className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-foreground px-5 py-3 text-sm font-black text-background transition-opacity hover:opacity-90 sm:w-auto"
        >
          <Download size={16} aria-hidden="true" />
          Download image
        </button>
        <a ref={downloadLinkRef} className="hidden" aria-hidden="true">
          Download mockup
        </a>
      </div>

      <div className="flex items-center justify-center rounded-[1.5rem] border border-border bg-[radial-gradient(circle_at_top,#ffffff_0,#f4f4f5_38%,#e5e5e5_100%)] p-4 sm:p-6">
        <div className="relative h-[610px] w-[282px] max-w-full rounded-[3rem] bg-zinc-950 p-3 shadow-2xl shadow-black/30 sm:h-[680px] sm:w-[314px]">
          <span className="absolute -left-1 top-28 h-16 w-1 rounded-l-full bg-zinc-800" aria-hidden="true" />
          <span className="absolute -left-1 top-52 h-12 w-1 rounded-l-full bg-zinc-800" aria-hidden="true" />
          <span className="absolute -right-1 top-44 h-20 w-1 rounded-r-full bg-zinc-800" aria-hidden="true" />
          <div
            className="relative h-full overflow-hidden rounded-[2.45rem] bg-cover bg-center px-5 py-5 text-white shadow-inner"
            style={phoneBackground}
          >
            <div className="absolute inset-0 bg-[linear-gradient(115deg,rgba(255,255,255,0.24)_0%,transparent_22%,transparent_70%,rgba(255,255,255,0.12)_100%)]" aria-hidden="true" />
            <div className="absolute left-1/2 top-3 z-20 h-7 w-28 -translate-x-1/2 rounded-full bg-black/88 shadow-inner" />
            <div className="relative z-10 flex items-center justify-between pt-1 text-sm font-black text-white drop-shadow">
              <span>{carrier || "Carrier"}</span>
              <span className="flex items-center gap-1">
                <span className="h-2.5 w-4 rounded-sm border border-white/80" />
                <span className="h-2.5 w-2 rounded-sm bg-white/90" />
              </span>
            </div>

            <div className="relative z-10 mt-16 text-center drop-shadow">
              <p className="text-6xl font-black tracking-tight">{lockTime || "9:41"}</p>
              <p className="mt-2 text-sm font-bold text-white/85">
                {lockDate || "Today"}
              </p>
            </div>

            {showHeader ? (
              <p className="absolute left-7 top-[23.5rem] z-10 text-sm font-black text-white/80 drop-shadow">
                Notification Center
              </p>
            ) : null}

            <div
              className={`absolute left-5 right-5 z-10 ${notificationPosition} rounded-[1.65rem] border border-white/30 p-4 shadow-2xl shadow-black/25 backdrop-blur-2xl ${
                style === "glass"
                  ? isDarkCard
                    ? "bg-zinc-950/62 text-white"
                    : "bg-white/72 text-zinc-950"
                  : isDarkCard
                    ? "bg-zinc-950 text-white"
                    : "bg-zinc-100 text-zinc-950"
              }`}
              aria-live="polite"
            >
              <div className="flex items-start gap-3">
                <div
                  className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-white p-2 shadow-sm"
                  style={{ backgroundColor: platform === "custom" && !iconSrc ? preset.accent : "#ffffff" }}
                >
                  {iconSrc ? (
                    <img
                      src={iconSrc}
                      alt=""
                      className="h-full w-full object-contain"
                      crossOrigin="anonymous"
                    />
                  ) : (
                    <span className="text-sm font-black text-white">
                      {title.slice(0, 1).toUpperCase() || "A"}
                    </span>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-3">
                    <p className="truncate text-sm font-black">{title || "Notification"}</p>
                    <p className="shrink-0 text-xs font-bold opacity-60">
                      {timestamp || "now"}
                    </p>
                  </div>
                  <p className="mt-1 line-clamp-3 text-sm font-semibold leading-5 opacity-75">
                    {message || "Write your notification message."}
                  </p>
                </div>
              </div>
            </div>

            {showButtons ? (
              <div className="absolute bottom-8 left-8 right-8 z-10 flex items-center justify-between">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-black/35 text-white backdrop-blur-xl">
                  <Flashlight size={21} aria-hidden="true" />
                </div>
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-black/35 text-white backdrop-blur-xl">
                  <Camera size={21} aria-hidden="true" />
                </div>
              </div>
            ) : null}

            <div className="absolute bottom-3 left-1/2 z-10 h-1 w-28 -translate-x-1/2 rounded-full bg-white/85" />
          </div>
        </div>
      </div>
    </section>
  );
}
