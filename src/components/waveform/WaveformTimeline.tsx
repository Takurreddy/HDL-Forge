"use client";

import { useCallback } from "react";

interface WaveformTimelineProps {
  duration: number;
  timescale?: string;
  zoom: number;
  cursorTime: number | null;
  onCursorChange: (time: number | null) => void;
}

export default function WaveformTimeline({
  duration,
  zoom,
  cursorTime,
  onCursorChange,
}: WaveformTimelineProps) {
  const ticks = generateTicks(duration, zoom);

  const handleTimelineClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const percentage = x / rect.width;
      const time = Math.round(percentage * duration);
      onCursorChange(time);
    },
    [duration, onCursorChange]
  );

  return (
    <div
      className="relative h-8 cursor-crosshair border-b border-border bg-[#070707]"
      onClick={handleTimelineClick}
    >
      <div className="absolute inset-0 flex items-end">
        {ticks.map((tick) => (
          <div
            key={tick}
            className="absolute bottom-0 flex flex-col items-center"
            style={{ left: `${(tick / duration) * 100}%` }}
          >
            <span className="mb-0.5 font-mono text-[9px] text-text-dim">{tick}</span>
            <div className="h-2 w-px bg-border" />
          </div>
        ))}
      </div>

      {cursorTime !== null && (
        <div
          className="absolute bottom-0 top-0 w-px bg-accent"
          style={{ left: `${(cursorTime / duration) * 100}%` }}
        >
          <div className="absolute -top-1 left-1/2 h-2 w-2 -translate-x-1/2 rotate-45 bg-accent" />
        </div>
      )}

      <div className="absolute bottom-0 left-0 right-0 h-px bg-border" />
    </div>
  );
}

function generateTicks(duration: number, zoom: number): number[] {
  if (duration <= 0) return [];
  const targetTicks = Math.max(5, Math.min(20, Math.floor(10 * zoom)));
  const step = Math.max(1, Math.ceil(duration / targetTicks));
  const ticks: number[] = [];
  for (let i = 0; i <= duration; i += step) ticks.push(i);
  if (ticks[ticks.length - 1] !== duration && duration > 0) ticks.push(duration);
  return ticks;
}
