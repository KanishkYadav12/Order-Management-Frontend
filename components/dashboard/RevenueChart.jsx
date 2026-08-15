"use client";

import { useMemo, useRef, useState } from "react";
import { formatCompactMoney, formatMoney, formatDate } from "@/lib/format";
import { EmptyState } from "@/components/ui/empty-state";
import { LineChart } from "lucide-react";

/**
 * Revenue over time.
 *
 * Hand-drawn SVG rather than a charting library: `react-chartjs-2` was a
 * dependency but `chart.js` — its required peer — was never installed, so any
 * screen importing it would have thrown at runtime. An area chart this simple
 * is also more legible built directly, and inherits the theme tokens for free.
 *
 * One measure, one axis. A crosshair and tooltip carry the per-day detail
 * instead of labelling every point.
 */

const PADDING = { top: 16, right: 16, bottom: 26, left: 46 };
const VIEW = { width: 760, height: 240 };

export function RevenueChart({ series = [], loading = false }) {
  const [hoverIndex, setHoverIndex] = useState(null);
  const svgRef = useRef(null);

  const model = useMemo(() => {
    if (series.length === 0) return null;

    const plotWidth = VIEW.width - PADDING.left - PADDING.right;
    const plotHeight = VIEW.height - PADDING.top - PADDING.bottom;

    const values = series.map((point) => point.revenue ?? 0);
    const peak = Math.max(...values, 1);
    // Round the ceiling up to something a human would pick, so gridlines
    // land on readable numbers rather than 8,431.
    const magnitude = 10 ** Math.floor(Math.log10(peak));
    const ceiling = Math.ceil(peak / magnitude) * magnitude;

    const x = (index) =>
      series.length === 1
        ? PADDING.left + plotWidth / 2
        : PADDING.left + (index / (series.length - 1)) * plotWidth;

    const y = (value) =>
      PADDING.top + plotHeight - (value / ceiling) * plotHeight;

    const points = series.map((point, index) => ({
      ...point,
      x: x(index),
      y: y(point.revenue ?? 0),
    }));

    const line = points
      .map((point, index) => `${index === 0 ? "M" : "L"}${point.x},${point.y}`)
      .join(" ");

    const area = `${line} L${points.at(-1).x},${PADDING.top + plotHeight} L${points[0].x},${PADDING.top + plotHeight} Z`;

    const ticks = [0, 0.25, 0.5, 0.75, 1].map((fraction) => ({
      value: ceiling * fraction,
      y: y(ceiling * fraction),
    }));

    return { points, line, area, ticks, ceiling, plotHeight, plotWidth };
  }, [series]);

  const handleMove = (event) => {
    if (!model || !svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const relative = ((event.clientX - rect.left) / rect.width) * VIEW.width;

    let closest = 0;
    let distance = Infinity;
    model.points.forEach((point, index) => {
      const delta = Math.abs(point.x - relative);
      if (delta < distance) {
        distance = delta;
        closest = index;
      }
    });
    setHoverIndex(closest);
  };

  const active = hoverIndex !== null ? model?.points[hoverIndex] : null;
  const latest = model?.points.at(-1);

  return (
    <section className="rounded-xl border bg-card">
      <header className="flex flex-wrap items-baseline justify-between gap-2 border-b px-4 py-3">
        <h2 className="text-sm font-semibold tracking-tight">Revenue</h2>
        {latest && !loading && (
          <p className="text-xs text-muted-foreground">
            Latest{" "}
            <span className="font-semibold tabular text-foreground">
              {formatMoney(latest.revenue)}
            </span>
          </p>
        )}
      </header>

      {loading ? (
        <div className="p-4">
          <div className="shimmer h-[240px] rounded-lg" />
        </div>
      ) : !model ? (
        <EmptyState
          Icon={LineChart}
          className="border-0 bg-transparent py-12"
          title="No revenue yet"
          description="Settle your first bill and the trend will show up here."
        />
      ) : (
        <div className="relative p-2">
          <svg
            ref={svgRef}
            viewBox={`0 0 ${VIEW.width} ${VIEW.height}`}
            className="w-full"
            role="img"
            aria-label={`Revenue over the last ${series.length} days`}
            onMouseMove={handleMove}
            onMouseLeave={() => setHoverIndex(null)}
          >
            <defs>
              <linearGradient id="revenue-fill" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="0%"
                  stopColor="hsl(var(--chart-1))"
                  stopOpacity="0.26"
                />
                <stop
                  offset="100%"
                  stopColor="hsl(var(--chart-1))"
                  stopOpacity="0.02"
                />
              </linearGradient>
            </defs>

            {/* Recessive gridlines and value axis */}
            {model.ticks.map((tick) => (
              <g key={tick.value}>
                <line
                  x1={PADDING.left}
                  x2={VIEW.width - PADDING.right}
                  y1={tick.y}
                  y2={tick.y}
                  stroke="hsl(var(--border))"
                  strokeWidth="1"
                />
                <text
                  x={PADDING.left - 8}
                  y={tick.y + 3.5}
                  textAnchor="end"
                  className="fill-muted-foreground"
                  style={{ fontSize: 10, fontVariantNumeric: "tabular-nums" }}
                >
                  {formatCompactMoney(tick.value)}
                </text>
              </g>
            ))}

            <path d={model.area} fill="url(#revenue-fill)" />
            <path
              d={model.line}
              fill="none"
              stroke="hsl(var(--chart-1))"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Emphasised endpoint */}
            {latest && (
              <circle
                cx={latest.x}
                cy={latest.y}
                r="4"
                fill="hsl(var(--chart-1))"
                stroke="hsl(var(--card))"
                strokeWidth="2"
              />
            )}

            {/* Crosshair */}
            {active && (
              <g>
                <line
                  x1={active.x}
                  x2={active.x}
                  y1={PADDING.top}
                  y2={PADDING.top + model.plotHeight}
                  stroke="hsl(var(--muted-foreground))"
                  strokeWidth="1"
                  strokeDasharray="3 3"
                />
                <circle
                  cx={active.x}
                  cy={active.y}
                  r="5"
                  fill="hsl(var(--chart-1))"
                  stroke="hsl(var(--card))"
                  strokeWidth="2"
                />
              </g>
            )}

            {/* Date axis: first, middle and last only — a label per day is
                unreadable at 90 points. */}
            {[0, Math.floor(series.length / 2), series.length - 1]
              .filter((index, position, all) => all.indexOf(index) === position)
              .map((index) => (
                <text
                  key={index}
                  x={model.points[index].x}
                  y={VIEW.height - 8}
                  textAnchor={
                    index === 0
                      ? "start"
                      : index === series.length - 1
                        ? "end"
                        : "middle"
                  }
                  className="fill-muted-foreground"
                  style={{ fontSize: 10 }}
                >
                  {formatDate(series[index].date, {
                    day: "numeric",
                    month: "short",
                    year: undefined,
                  })}
                </text>
              ))}
          </svg>

          {active && (
            <div
              className="pointer-events-none absolute z-10 -translate-x-1/2 rounded-lg border bg-popover px-3 py-2 shadow-lg"
              style={{
                left: `${(active.x / VIEW.width) * 100}%`,
                top: 8,
              }}
              role="status"
            >
              <p className="text-2xs font-semibold uppercase tracking-wider text-muted-foreground">
                {formatDate(active.date)}
              </p>
              <p className="mt-0.5 text-sm font-bold tabular">
                {formatMoney(active.revenue)}
              </p>
              <p className="text-xs text-muted-foreground tabular">
                {active.bills} bill{active.bills === 1 ? "" : "s"}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Table view: the same data, reachable by screen reader and keyboard. */}
      {model && (
        <details className="border-t px-4 py-2">
          <summary className="cursor-pointer text-xs text-muted-foreground hover:text-foreground">
            View as table
          </summary>
          <div className="scroll-x mt-2 max-h-56">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-card">
                <tr className="text-left text-2xs uppercase tracking-wider text-muted-foreground">
                  <th className="py-1.5 font-semibold">Date</th>
                  <th className="py-1.5 text-right font-semibold">Revenue</th>
                  <th className="py-1.5 text-right font-semibold">Bills</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {series.map((point) => (
                  <tr key={point.date}>
                    <td className="py-1.5">{formatDate(point.date)}</td>
                    <td className="py-1.5 text-right tabular">
                      {formatMoney(point.revenue)}
                    </td>
                    <td className="py-1.5 text-right tabular">{point.bills}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </details>
      )}
    </section>
  );
}

export default RevenueChart;
