"use client";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const ReactECharts = dynamic(() => import("echarts-for-react"), { ssr: false });

export default function Home() {
  return (
    <div className="font-sans min-h-screen p-8 sm:p-20">
      <main className="flex flex-col gap-6 max-w-5xl mx-auto">
        <h1 className="text-3xl font-bold">BHSA Participle Explorer</h1>
        <p>Explore Hebrew participle patterns across the BHSA corpus.</p>
        <div className="flex gap-6">
          <Link className="underline" href="/explore">Explorer</Link>
          <Link className="underline" href="/methodology">Methodology</Link>
          <Link className="underline" href="/data">Data</Link>
        </div>

        <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader><CardTitle>Totals</CardTitle></CardHeader>
            <CardContent>
              <OverviewTotals />
            </CardContent>
          </Card>
          <Card className="md:col-span-2">
            <CardHeader><CardTitle>Binyan × Voice</CardTitle></CardHeader>
            <CardContent>
              <OverviewBinyanVoice />
            </CardContent>
          </Card>
        </section>
      </main>
    </div>
  );
}

function useJson<T>(path: string, initial: T): T {
  const base = process.env.NEXT_PUBLIC_BASE_PATH || "";
  const [data, setData] = useState<T>(initial);
  useEffect(() => {
    const url = `${base}${path}`;
    fetch(url).then((r) => r.json()).then(setData).catch(() => {});
  }, [path, base]);
  return data;
}

function OverviewTotals() {
  const summary = useJson<{ totalRows?: number }>("/data/meta/summary.json", {});
  const byUsage = useJson<Record<string, number>>("/data/agg/by_usage.json", {});
  const total = summary.totalRows ?? 0;
  const parts = [
    { label: "Total participles", value: total },
    { label: "Verbal", value: byUsage["verbal"] || 0 },
    { label: "Adjectival", value: byUsage["adjectival"] || 0 },
    { label: "Substantive", value: byUsage["substantive"] || 0 },
  ];
  return (
    <ul className="text-sm space-y-1">
      {parts.map((p) => (
        <li key={p.label} className="flex justify-between"><span>{p.label}</span><span className="font-semibold">{p.value.toLocaleString()}</span></li>
      ))}
    </ul>
  );
}

function OverviewBinyanVoice() {
  const byBinyan = useJson<Record<string, { active: number; passive: number }>>("/data/agg/by_binyan.json", {});
  const binyans = Object.keys(byBinyan);
  const active = binyans.map((b) => byBinyan[b].active);
  const passive = binyans.map((b) => byBinyan[b].passive);
  const option: {
    tooltip: { trigger: string };
    legend: { data: string[] };
    xAxis: { type: string; data: string[] };
    yAxis: { type: string };
    series: Array<{ name: string; type: string; stack: string; data: number[] }>;
  } = {
    tooltip: { trigger: "axis" },
    legend: { data: ["Active", "Passive"] },
    xAxis: { type: "category", data: binyans },
    yAxis: { type: "value" },
    series: [
      { name: "Active", type: "bar", stack: "v", data: active },
      { name: "Passive", type: "bar", stack: "v", data: passive },
    ],
  };
  return <ReactECharts option={option} style={{ height: 320 }} />;
}
