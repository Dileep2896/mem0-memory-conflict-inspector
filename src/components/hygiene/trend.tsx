"use client";
import { Line, LineChart, YAxis } from "recharts";

export function Trend({ data }: { data: number[] }) {
  const points = (data.length === 1 ? [data[0], data[0]] : data).map((v, i) => ({ i, v }));
  return (
    <div aria-label={`Score trend: ${data.join(", ")}`} role="img">
      <LineChart width={140} height={40} data={points} margin={{ top: 4, right: 4, bottom: 4, left: 4 }}>
        <YAxis domain={[0, 100]} hide />
        <Line type="monotone" dataKey="v" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} isAnimationActive={false} />
      </LineChart>
    </div>
  );
}
