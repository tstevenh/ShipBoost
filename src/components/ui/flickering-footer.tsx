"use client";

import { ChevronRightIcon } from "@radix-ui/react-icons";
import { ClassValue, clsx } from "clsx";
import * as Color from "color-bits";
import { motion } from "motion/react";
import Link from "next/link";
import Image from "next/image";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Helper function to convert any CSS color to rgba
export const getRGBA = (
  cssColor: React.CSSProperties["color"],
  fallback: string = "rgba(180, 180, 180)",
): string => {
  if (typeof window === "undefined") return fallback;
  if (!cssColor) return fallback;

  try {
    // Handle CSS variables
    if (typeof cssColor === "string" && cssColor.startsWith("var(")) {
      const element = document.createElement("div");
      element.style.color = cssColor;
      document.body.appendChild(element);
      const computedColor = window.getComputedStyle(element).color;
      document.body.removeChild(element);
      return Color.formatRGBA(Color.parse(computedColor));
    }

    return Color.formatRGBA(Color.parse(cssColor));
  } catch (e) {
    console.error("Color parsing failed:", e);
    return fallback;
  }
};

// Helper function to add opacity to an RGB color string
export const colorWithOpacity = (color: string, opacity: number): string => {
  if (!color.startsWith("rgb")) return color;
  return Color.formatRGBA(Color.alpha(Color.parse(color), opacity));
};

export const Icons = {
  logo: ({ className }: { className?: string }) => (
    <div className={cn("flex items-center gap-4 group h-14", className)}>
      <div className="relative h-14 w-14 shrink-0">
        <Image
          src="/logos/logo-black.png"
          alt=""
          fill
          className="object-contain block dark:hidden transition-transform group-hover:scale-110"
        />
        <Image
          src="/logos/logo-white.png"
          alt=""
          fill
          className="object-contain hidden dark:block transition-transform group-hover:scale-110"
        />
      </div>
      <span className="text-3xl font-black tracking-tighter text-foreground font-heading leading-none">
        ShipBoost
      </span>
    </div>
  ),
};

interface FlickeringGridProps extends React.HTMLAttributes<HTMLDivElement> {
  squareSize?: number;
  gridGap?: number;
  flickerChance?: number;
  color?: string;
  width?: number;
  height?: number;
  className?: string;
  maxOpacity?: number;
  text?: string;
  textColor?: string;
  fontSize?: number;
  fontWeight?: number | string;
}

export const FlickeringGrid: React.FC<FlickeringGridProps> = ({
  squareSize = 3,
  gridGap = 3,
  flickerChance = 0.2,
  color = "#B4B4B4",
  width,
  height,
  className,
  maxOpacity = 0.15,
  text = "",
  fontSize = 140,
  fontWeight = 600,
  ...props
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isInView, setIsInView] = useState(false);
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });

  const memoizedColor = useMemo(() => {
    return getRGBA(color);
  }, [color]);

  const drawGrid = useCallback(
    (
      ctx: CanvasRenderingContext2D,
      width: number,
      height: number,
      cols: number,
      rows: number,
      squares: Float32Array,
      dpr: number,
    ) => {
      ctx.clearRect(0, 0, width, height);

      const maskCanvas = document.createElement("canvas");
      maskCanvas.width = width;
      maskCanvas.height = height;
      const maskCtx = maskCanvas.getContext("2d", { willReadFrequently: true });
      if (!maskCtx) return;

      if (text) {
        maskCtx.save();
        maskCtx.scale(dpr, dpr);
        maskCtx.fillStyle = "white";
        maskCtx.font = `${fontWeight} ${fontSize}px "Manrope", "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
        maskCtx.textAlign = "center";
        maskCtx.textBaseline = "middle";
        maskCtx.fillText(text, width / (2 * dpr), height / (2 * dpr));
        maskCtx.restore();
      }

      for (let i = 0; i < cols; i++) {
        for (let j = 0; j < rows; j++) {
          const x = i * (squareSize + gridGap) * dpr;
          const y = j * (squareSize + gridGap) * dpr;
          const squareWidth = squareSize * dpr;
          const squareHeight = squareSize * dpr;

          const maskData = maskCtx.getImageData(
            x,
            y,
            squareWidth,
            squareHeight,
          ).data;
          const hasText = maskData.some(
            (value, index) => index % 4 === 0 && value > 0,
          );

          const opacity = squares[i * rows + j];
          const finalOpacity = hasText
            ? Math.min(1, opacity * 3 + 0.4)
            : opacity;

          ctx.fillStyle = colorWithOpacity(memoizedColor, finalOpacity);
          ctx.fillRect(x, y, squareWidth, squareHeight);
        }
      }
    },
    [memoizedColor, squareSize, gridGap, text, fontSize, fontWeight],
  );

  const setupCanvas = useCallback(
    (canvas: HTMLCanvasElement, width: number, height: number) => {
      const dpr = window.devicePixelRatio || 1;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      const cols = Math.ceil(width / (squareSize + gridGap));
      const rows = Math.ceil(height / (squareSize + gridGap));

      const squares = new Float32Array(cols * rows);
      for (let i = 0; i < squares.length; i++) {
        squares[i] = Math.random() * maxOpacity;
      }

      return { cols, rows, squares, dpr };
    },
    [squareSize, gridGap, maxOpacity],
  );

  const updateSquares = useCallback(
    (squares: Float32Array, deltaTime: number) => {
      for (let i = 0; i < squares.length; i++) {
        if (Math.random() < flickerChance * deltaTime) {
          squares[i] = Math.random() * maxOpacity;
        }
      }
    },
    [flickerChance, maxOpacity],
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let gridParams: ReturnType<typeof setupCanvas>;

    const updateCanvasSize = () => {
      const newWidth = width || container.clientWidth;
      const newHeight = height || container.clientHeight;
      setCanvasSize({ width: newWidth, height: newHeight });
      gridParams = setupCanvas(canvas, newWidth, newHeight);
    };

    updateCanvasSize();

    let lastTime = 0;
    const animate = (time: number) => {
      if (!isInView) return;

      const deltaTime = (time - lastTime) / 1000;
      lastTime = time;

      updateSquares(gridParams.squares, deltaTime);
      drawGrid(
        ctx,
        canvas.width,
        canvas.height,
        gridParams.cols,
        gridParams.rows,
        gridParams.squares,
        gridParams.dpr,
      );
      animationFrameId = requestAnimationFrame(animate);
    };

    const resizeObserver = new ResizeObserver(() => {
      updateCanvasSize();
    });

    resizeObserver.observe(container);

    const intersectionObserver = new IntersectionObserver(
      ([entry]) => {
        setIsInView(entry.isIntersecting);
      },
      { threshold: 0 },
    );

    intersectionObserver.observe(canvas);

    if (isInView) {
      animationFrameId = requestAnimationFrame(animate);
    }

    return () => {
      cancelAnimationFrame(animationFrameId);
      resizeObserver.disconnect();
      intersectionObserver.disconnect();
    };
  }, [setupCanvas, updateSquares, drawGrid, width, height, isInView]);

  return (
    <div
      ref={containerRef}
      className={cn(`h-full w-full ${className}`)}
      {...props}
    >
      <canvas
        ref={canvasRef}
        className="pointer-events-none"
        style={{
          width: canvasSize.width,
          height: canvasSize.height,
        }}
      />
    </div>
  );
};

export function useMediaQuery(query: string) {
  const [value, setValue] = useState(false);

  useEffect(() => {
    function checkQuery() {
      const result = window.matchMedia(query);
      setValue(result.matches);
    }
    checkQuery();
    window.addEventListener("resize", checkQuery);
    const mediaQuery = window.matchMedia(query);
    mediaQuery.addEventListener("change", checkQuery);
    return () => {
      window.removeEventListener("resize", checkQuery);
      mediaQuery.removeEventListener("change", checkQuery);
    };
  }, [query]);

  return value;
}

export const siteConfig = {
  hero: {
    description:
      "ShipBoost helps bootstrapped SaaS founders earn trust, visibility, and real distribution — not vanity launches.",
  },
  footerLinks: [
    {
      title: "Categories",
      links: [
        { id: 1, title: "Marketing", url: "/categories/marketing" },
        { id: 2, title: "Sales", url: "/categories/sales" },
        { id: 3, title: "Analytics", url: "/categories/analytics" },
        { id: 4, title: "Development", url: "/categories/development" },
        { id: 5, title: "Support", url: "/categories/support" },
        { id: 6, title: "View all", url: "/categories" },
      ],
    },
    {
      title: "Alternatives",
      links: [
        { id: 7, title: "ShipFast Alternatives", url: "/alternatives/shipfast" },
        { id: 8, title: "DirStarter Alternatives", url: "/alternatives/dirstarter" },
        { id: 9, title: "Tapfiliate Alternatives", url: "/alternatives/tapfiliate" },
        { id: 10, title: "Frase Alternatives", url: "/alternatives/frase" },
        { id: 11, title: "Vista Social Alternatives", url: "/alternatives/vista-social" },
        { id: 12, title: "Browse all", url: "/alternatives" },
      ],
    },
    {
      title: "Best Tags",
      links: [
        { id: 13, title: "AI-Powered", url: "/best/tag/ai" },
        { id: 14, title: "Open Source", url: "/best/tag/open-source" },
        { id: 15, title: "Bootstrapped", url: "/best/tag/bootstrapped" },
        { id: 16, title: "Next.js Boilerplates", url: "/best/tag/nextjs" },
        { id: 17, title: "Indie Hackers", url: "/best/tag/indie-hackers" },
        { id: 18, title: "View all", url: "/tags" },
      ],
    },
    {
      title: "Company",
      links: [
        { id: 19, title: "Launchpad", url: "/" },
        { id: 20, title: "Pricing", url: "/pricing" },
        { id: 21, title: "Submit Product", url: "/submit" },
        { id: 22, title: "Terms", url: "/terms" },
        { id: 23, title: "Privacy", url: "/privacy" },
        { id: 24, title: "Contact", url: "/contact" },
      ],
    },
  ],
};

export const FlickeringFooter = () => {
  const tablet = useMediaQuery("(max-width: 1024px)");

  return (
    <footer id="footer" className="w-full pb-0 border-t border-border bg-background">
      <div className="flex flex-col md:flex-row md:items-start md:justify-between p-10 max-w-7xl mx-auto">
        <div className="flex flex-col items-start justify-start gap-y-5 max-w-xs mx-0">
          <Link href="/">
            <Icons.logo />
          </Link>
          <p className="text-sm tracking-tight text-muted-foreground font-medium leading-relaxed">
            {siteConfig.hero.description}
          </p>
        </div>
        <div className="pt-5 md:pt-0 md:w-2/3 lg:w-3/4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-10 lg:pl-10">
            {siteConfig.footerLinks.map((column, columnIndex) => (
              <ul key={columnIndex} className="flex flex-col gap-y-2">
                <li className="mb-2 text-[10px] font-black uppercase tracking-widest text-foreground/70">
                  {column.title}
                </li>
                {column.links.map((link) => (
                  <li
                    key={link.id}
                    className="group inline-flex cursor-pointer items-center justify-start gap-1 text-xs font-bold text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <Link href={link.url}>{link.title}</Link>
                    <div className="flex size-3 items-center justify-center border border-border rounded translate-x-0 transform opacity-0 transition-all duration-300 ease-out group-hover:translate-x-1 group-hover:opacity-100">
                      <ChevronRightIcon className="h-3 w-3 " />
                    </div>
                  </li>
                ))}
              </ul>
            ))}
          </div>
        </div>
      </div>
      <div className="w-full h-48 md:h-64 relative mt-12 z-0">
        <div className="absolute inset-0 bg-gradient-to-t from-transparent to-background z-10 from-40%" />
        <div className="absolute inset-0 mx-6">
          <FlickeringGrid
            text="ShipBoost"
            fontSize={tablet ? 60 : 80}
            className="h-full w-full"
            squareSize={2}
            gridGap={tablet ? 2 : 3}
            color="#6B7280"
            maxOpacity={0.2}
            flickerChance={0.1}
          />
        </div>
      </div>
      <div className="flex justify-center border-t border-border p-6 bg-muted/30 relative z-20">
        <p className="text-muted-foreground text-[10px] font-bold uppercase tracking-widest">
          © {new Date().getFullYear()} ShipBoost. All rights reserved.
        </p>
      </div>
    </footer>
  );
};
