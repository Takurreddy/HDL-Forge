"use client";

import { useMemo } from "react";
import { WaveformSignal as WaveformSignalType, WaveformDisplayMode } from "@/lib/types";

interface WaveformSignalRowProps {
  signal: WaveformSignalType;
  duration: number;
  timescale: string;
  zoom?: number;
  cursorTime: number | null;
  displayMode?: WaveformDisplayMode;
  onSignalClick: (time: number) => void;
  cursorValue: string;
}

export default function WaveformSignalRow({
  signal,
  duration,
  cursorTime,
  onSignalClick,
  cursorValue,
}: WaveformSignalRowProps) {
  const segments = useMemo(() => {
    if (signal.changes.length === 0) return [];

    const segs: Array<{
      startTime: number;
      endTime: number;
      value: string;
    }> = [];

    for (let i = 0; i < signal.changes.length; i++) {
      const change = signal.changes[i];
      const nextChange = signal.changes[i + 1];

      segs.push({
        startTime: change.time,
        endTime: nextChange ? nextChange.time : duration,
        value: change.value,
      });
    }

    return segs;
  }, [signal.changes, duration]);

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = x / rect.width;
    const time = Math.round(percentage * duration);
    onSignalClick(time);
  };

  return (
    <div className="flex h-10 items-center border-b border-border/30">
      <div className="w-32 flex-shrink-0 border-r border-border px-2 py-1">
        <div className="truncate text-xs font-medium text-text-secondary">{signal.name}</div>
        {signal.width > 1 && (
          <div className="text-[9px] text-text-dim">
            [{signal.width - 1}:0]
          </div>
        )}
      </div>

      <div className="relative flex-1 h-full" onClick={handleClick}>
        <svg
          className="h-full w-full"
          viewBox={`0 0 ${duration || 1} 20`}
          preserveAspectRatio="none"
        >
          {segments.map((seg, i) => {
            const x1 = (seg.startTime / (duration || 1)) * 100;
            const x2 = (seg.endTime / (duration || 1)) * 100;
            const width = Math.max(0.1, x2 - x1);

            if (signal.width === 1) {
              return (
                <SingleBitSegment
                  key={i}
                  x={x1}
                  width={width}
                  value={seg.value}
                />
              );
            }

            return (
              <MultiBitSegment
                key={i}
                x={x1}
                width={width}
                value={seg.value}
                signalWidth={signal.width}
              />
            );
          })}
        </svg>

        {cursorTime !== null && (
          <div
            className="absolute bottom-0 top-0 w-px bg-accent/50"
            style={{ left: `${(cursorTime / duration) * 100}%` }}
          />
        )}
      </div>

      {signal.width > 1 && cursorTime !== null && (
        <div className="w-16 flex-shrink-0 border-l border-border px-2 py-1 text-right">
          <span className="font-mono text-xs text-accent">{cursorValue}</span>
        </div>
      )}
    </div>
  );
}

function SingleBitSegment({
  x,
  width,
  value,
}: {
  x: number;
  width: number;
  value: string;
}) {
  const isHigh = value === "1";
  const isX = value === "x" || value === "X";
  const isZ = value === "z" || value === "Z";

  const color = isX
    ? "text-warning"
    : isZ
      ? "text-text-dim"
      : "text-accent";

  return (
    <g className={color}>
      <line
        x1={x}
        y1={isHigh ? 5 : 15}
        x2={x + width}
        y2={isHigh ? 5 : 15}
        stroke="currentColor"
        strokeWidth="0.3"
        vectorEffect="non-scaling-stroke"
      />
      {x > 0 && (
        <line
          x1={x}
          y1={isHigh ? 15 : 5}
          x2={x}
          y2={isHigh ? 5 : 15}
          stroke="currentColor"
          strokeWidth="0.3"
          vectorEffect="non-scaling-stroke"
        />
      )}
      {isX && (
        <text
          x={x + width / 2}
          y={12}
          textAnchor="middle"
          fontSize="3"
          fill="currentColor"
          fontFamily="monospace"
        >
          X
        </text>
      )}
      {isZ && (
        <text
          x={x + width / 2}
          y={12}
          textAnchor="middle"
          fontSize="3"
          fill="currentColor"
          fontFamily="monospace"
        >
          Z
        </text>
      )}
    </g>
  );
}

function MultiBitSegment({
  x,
  width,
  value,
  signalWidth,
}: {
  x: number;
  width: number;
  value: string;
  signalWidth: number;
}) {
  const isX = value.includes("x") || value.includes("X");
  const isZ = value.includes("z") || value.includes("Z");

  const displayValue = (() => {
    if (isX) return "XXXX";
    if (isZ) return "ZZZZ";

    const cleaned = value.replace(/[^01]/g, "");
    if (cleaned.length !== value.length) return value;

    const hexLen = Math.ceil(signalWidth / 4);
    const padded = cleaned.padStart(signalWidth, "0");
    let hex = "";
    for (let i = 0; i < padded.length; i += 4) {
      const nibble = padded.substring(i, i + 4);
      hex += parseInt(nibble, 2).toString(16).toUpperCase();
    }
    return hex.padStart(hexLen, "0");
  })();

  const color = isX ? "text-warning" : isZ ? "text-text-dim" : "text-accent";

  return (
    <g>
      <line
        x1={x}
        y1={7}
        x2={x + width}
        y2={7}
        stroke="var(--accent)"
        strokeWidth="0.3"
        vectorEffect="non-scaling-stroke"
      />
      <line
        x1={x}
        y1={13}
        x2={x + width}
        y2={13}
        stroke="var(--accent)"
        strokeWidth="0.3"
        vectorEffect="non-scaling-stroke"
      />
      {width > 5 && (
        <text
          x={x + width / 2}
          y={12}
          textAnchor="middle"
          fontSize="2.5"
          fill="currentColor"
          className={color}
          fontFamily="monospace"
        >
          {displayValue}
        </text>
      )}
    </g>
  );
}
