import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { EmptyState } from "@/components/ui/EmptyState";
import type { MonthCount, SourceStat, StageAvgDays, StageJobCount } from "@/types";

// Validated categorical palette (dataviz skill reference instance) — used only
// for the by-source bars, which have at most 8 categories (one per default source).
const CATEGORICAL = ["#2a78d6", "#eb6834", "#1baf7a", "#eda100", "#e87ba4", "#008300", "#4a3aa7", "#e34948"];

const AXIS_STYLE = { fontSize: 11, fill: "rgb(var(--color-muted))" };
const GRID_STROKE = "rgb(var(--color-border))";

interface StageColorLookup {
  [stageName: string]: string;
}

export function ApplicationsOverTimeChart({ data }: { data: MonthCount[] }) {
  if (data.length === 0) return <EmptyState title="No applications yet" />;
  return (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart data={data} margin={{ left: -20 }}>
        <CartesianGrid stroke={GRID_STROKE} vertical={false} />
        <XAxis dataKey="month" tick={AXIS_STYLE} axisLine={{ stroke: GRID_STROKE }} tickLine={false} />
        <YAxis allowDecimals={false} tick={AXIS_STYLE} axisLine={false} tickLine={false} width={30} />
        <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
        <Line type="monotone" dataKey="count" stroke="rgb(var(--color-accent))" strokeWidth={2} dot={{ r: 3 }} />
      </LineChart>
    </ResponsiveContainer>
  );
}

export function BySourceChart({ data }: { data: SourceStat[] }) {
  const filtered = data.filter((d) => d.applications > 0);
  if (filtered.length === 0) return <EmptyState title="No sourced applications yet" />;
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={filtered} margin={{ left: -20 }}>
        <CartesianGrid stroke={GRID_STROKE} vertical={false} />
        <XAxis dataKey="source" tick={AXIS_STYLE} axisLine={{ stroke: GRID_STROKE }} tickLine={false} />
        <YAxis allowDecimals={false} tick={AXIS_STYLE} axisLine={false} tickLine={false} width={30} />
        <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
        <Bar dataKey="applications" radius={[4, 4, 0, 0]}>
          {filtered.map((entry, index) => (
            <Cell key={entry.source} fill={CATEGORICAL[index % CATEGORICAL.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

export function MonthlyBarChart({ data, color = "rgb(var(--color-accent))" }: { data: MonthCount[]; color?: string }) {
  if (data.length === 0) return <EmptyState title="No data yet" />;
  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={data} margin={{ left: -20 }}>
        <CartesianGrid stroke={GRID_STROKE} vertical={false} />
        <XAxis dataKey="month" tick={AXIS_STYLE} axisLine={{ stroke: GRID_STROKE }} tickLine={false} />
        <YAxis allowDecimals={false} tick={AXIS_STYLE} axisLine={false} tickLine={false} width={30} />
        <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
        <Bar dataKey="count" fill={color} radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function ByStageChart({ data, stageColors }: { data: StageJobCount[]; stageColors: StageColorLookup }) {
  const filtered = data.filter((d) => d.jobs > 0);
  if (filtered.length === 0) return <EmptyState title="No active jobs yet" />;
  return (
    <div className="flex flex-col items-center gap-3 sm:flex-row">
      <ResponsiveContainer width="100%" height={220} className="sm:max-w-[220px]">
        <PieChart>
          <Pie data={filtered} dataKey="jobs" nameKey="stage" innerRadius={45} outerRadius={80} paddingAngle={2}>
            {filtered.map((entry) => (
              <Cell key={entry.stage} fill={stageColors[entry.stage] ?? "#94a3b8"} />
            ))}
          </Pie>
          <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
        </PieChart>
      </ResponsiveContainer>
      <ul className="w-full space-y-1 text-sm">
        {filtered.map((entry) => (
          <li key={entry.stage} className="flex items-center justify-between gap-2">
            <span className="flex items-center gap-2 text-text">
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: stageColors[entry.stage] ?? "#94a3b8" }}
              />
              {entry.stage}
            </span>
            <span className="text-muted">{entry.jobs}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function AvgDaysPerStageChart({ data, stageColors }: { data: StageAvgDays[]; stageColors: StageColorLookup }) {
  const filtered = data.filter((d) => d.avg_days !== null);
  if (filtered.length === 0) return <EmptyState title="Not enough history yet" />;
  return (
    <ResponsiveContainer width="100%" height={Math.max(160, filtered.length * 36)}>
      <BarChart data={filtered} layout="vertical" margin={{ left: 10 }}>
        <CartesianGrid stroke={GRID_STROKE} horizontal={false} />
        <XAxis type="number" tick={AXIS_STYLE} axisLine={false} tickLine={false} />
        <YAxis
          type="category"
          dataKey="stage_name"
          tick={AXIS_STYLE}
          axisLine={false}
          tickLine={false}
          width={110}
        />
        <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} formatter={(value: number) => [`${value} days`, "Avg. time in stage"]} />
        <Bar dataKey="avg_days" radius={[0, 4, 4, 0]}>
          {filtered.map((entry) => (
            <Cell key={entry.stage_name} fill={stageColors[entry.stage_name] ?? "rgb(var(--color-accent))"} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
