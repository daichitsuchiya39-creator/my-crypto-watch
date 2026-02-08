"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Cell,
  LabelList,
} from "recharts";

import { RelativeStrength } from "@/lib/types";

interface RelativeStrengthChartProps {
  data: RelativeStrength[];
  highlightSymbol?: string;
}

export default function RelativeStrengthChart({ data, highlightSymbol }: RelativeStrengthChartProps) {
  return (
    <div className="panel-border h-[360px] rounded-2xl bg-slate-950/70 p-4">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
            相対強度バーチャート
          </p>
          <p className="text-sm text-slate-300">推しコインを基準に比較対象との差分を表示</p>
        </div>
      </div>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ top: 8, right: 16, left: 8, bottom: 8 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
          <XAxis type="number" tick={{ fill: "#94a3b8", fontSize: 12 }} />
          <YAxis
            type="category"
            dataKey="symbol"
            tick={{ fill: "#e2e8f0", fontSize: 12 }}
            width={80}
          />
          <ReferenceLine x={0} stroke="#64748b" />
          <Tooltip
            formatter={(value: number) => [`${value.toFixed(2)}%`, "RPD"]}
            contentStyle={{ background: "#0f172a", border: "1px solid #334155", color: "#e2e8f0" }}
          />
          <Bar dataKey="rpd" radius={[0, 8, 8, 0]}>
            {data.map((entry) => {
              const isHighlight = entry.symbol === highlightSymbol;
              const baseColor = entry.rpd >= 0 ? "#10b981" : "#f43f5e";
              return (
                <Cell
                  key={entry.symbol}
                  fill={isHighlight ? "#f59e0b" : baseColor}
                  opacity={isHighlight ? 1 : 0.8}
                />
              );
            })}
            <LabelList
              dataKey="rpd"
              position="right"
              formatter={(value: number) =>
                value === 0 ? "基準" : value > 0 ? "推しが強い" : "推しが弱い"
              }
              fill="#e2e8f0"
              fontSize={11}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
