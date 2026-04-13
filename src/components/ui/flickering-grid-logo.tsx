"use client";

import { ClassValue, clsx } from "clsx";
import * as Color from "color-bits";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const getRGBA = (
  cssColor: React.CSSProperties["color"],
  fallback: string = "rgba(180, 180, 180)",
): string => {
  if (typeof window === "undefined") return fallback;
  if (!cssColor) return fallback;

  try {
    if (typeof cssColor === "string" && cssColor.startsWith("var(")) {
      const element = document.createElement("div");
      element.style.color = cssColor;
      document.body.appendChild(element);
      const computedColor = window.getComputedStyle(element).color;
      document.body.removeChild(element);
      return Color.formatRGBA(Color.parse(computedColor));
    }

    return Color.formatRGBA(Color.parse(cssColor));
  } catch {
    return fallback;
  }
};

const colorWithOpacity = (color: string, opacity: number): string => {
  if (!color.startsWith("rgb")) return color;
  return Color.formatRGBA(Color.alpha(Color.parse(color), opacity));
};

type FlickeringGridProps = React.HTMLAttributes<HTMLDivElement> & {
  squareSize?: number;
  gridGap?: number;
  flickerChance?: number;
  color?: string;
  width?: number;
  height?: number;
  maxOpacity?: number;
  text?: string;
  fontSize?: number;
  fontWeight?: number | string;
};

function FlickeringGrid({
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
}: FlickeringGridProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isInView, setIsInView] = useState(false);
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });

  const memoizedColor = useMemo(() => getRGBA(color), [color]);

  const drawGrid = useCallback(
    (
      ctx: CanvasRenderingContext2D,
      canvasWidth: number,
      canvasHeight: number,
      cols: number,
      rows: number,
      squares: Float32Array,
      dpr: number,
    ) => {
      ctx.clearRect(0, 0, canvasWidth, canvasHeight);

      const maskCanvas = document.createElement("canvas");
      maskCanvas.width = canvasWidth;
      maskCanvas.height = canvasHeight;
      const maskCtx = maskCanvas.getContext("2d", { willReadFrequently: true });
      if (!maskCtx) return;

      if (text) {
        maskCtx.save();
        maskCtx.scale(dpr, dpr);
        maskCtx.fillStyle = "white";
        maskCtx.font = `${fontWeight} ${fontSize}px "Manrope", "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
        maskCtx.textAlign = "center";
        maskCtx.textBaseline = "middle";
        maskCtx.fillText(text, canvasWidth / (2 * dpr), canvasHeight / (2 * dpr));
        maskCtx.restore();
      }

      for (let i = 0; i < cols; i += 1) {
        for (let j = 0; j < rows; j += 1) {
          const x = i * (squareSize + gridGap) * dpr;
          const y = j * (squareSize + gridGap) * dpr;
          const squareWidth = squareSize * dpr;
          const squareHeight = squareSize * dpr;

          const maskData = maskCtx.getImageData(x, y, squareWidth, squareHeight).data;
          const hasText = maskData.some(
            (value, index) => index % 4 === 0 && value > 0,
          );

          const opacity = squares[i * rows + j];
          const finalOpacity = hasText ? Math.min(1, opacity * 3 + 0.4) : opacity;

          ctx.fillStyle = colorWithOpacity(memoizedColor, finalOpacity);
          ctx.fillRect(x, y, squareWidth, squareHeight);
        }
      }
    },
    [fontSize, fontWeight, gridGap, memoizedColor, squareSize, text],
  );

  const setupCanvas = useCallback(
    (canvas: HTMLCanvasElement, nextWidth: number, nextHeight: number) => {
      const dpr = window.devicePixelRatio || 1;
      canvas.width = nextWidth * dpr;
      canvas.height = nextHeight * dpr;
      canvas.style.width = `${nextWidth}px`;
      canvas.style.height = `${nextHeight}px`;
      const cols = Math.ceil(nextWidth / (squareSize + gridGap));
      const rows = Math.ceil(nextHeight / (squareSize + gridGap));

      const squares = new Float32Array(cols * rows);
      for (let i = 0; i < squares.length; i += 1) {
        squares[i] = Math.random() * maxOpacity;
      }

      return { cols, rows, squares, dpr };
    },
    [gridGap, maxOpacity, squareSize],
  );

  const updateSquares = useCallback(
    (squares: Float32Array, deltaTime: number) => {
      for (let i = 0; i < squares.length; i += 1) {
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

    let animationFrameId = 0;
    let gridParams = setupCanvas(canvas, width || container.clientWidth, height || container.clientHeight);

    const updateCanvasSize = () => {
      const nextWidth = width || container.clientWidth;
      const nextHeight = height || container.clientHeight;
      setCanvasSize({ width: nextWidth, height: nextHeight });
      gridParams = setupCanvas(canvas, nextWidth, nextHeight);
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
      animationFrameId = window.requestAnimationFrame(animate);
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
      animationFrameId = window.requestAnimationFrame(animate);
    }

    return () => {
      window.cancelAnimationFrame(animationFrameId);
      resizeObserver.disconnect();
      intersectionObserver.disconnect();
    };
  }, [drawGrid, height, isInView, setupCanvas, updateSquares, width]);

  return (
    <div ref={containerRef} className={cn(`h-full w-full ${className}`)} {...props}>
      <canvas
        ref={canvasRef}
        className="pointer-events-none"
        style={{ width: canvasSize.width, height: canvasSize.height }}
      />
    </div>
  );
}

export function FlickeringGridLogo() {
  const [fontSize, setFontSize] = useState(80);

  useEffect(() => {
    const update = () => {
      setFontSize(window.innerWidth <= 1024 ? 60 : 80);
    };

    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  return (
    <FlickeringGrid
      text="ShipBoost"
      fontSize={fontSize}
      className="h-full w-full"
      squareSize={2}
      gridGap={fontSize === 60 ? 2 : 3}
      color="#6B7280"
      maxOpacity={0.2}
      flickerChance={0.1}
    />
  );
}
