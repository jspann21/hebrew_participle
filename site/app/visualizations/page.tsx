"use client";
import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// ECharts option types
interface EChartsOption {
  tooltip?: {
    trigger?: string;
    formatter?: (params: unknown) => string;
  };
  legend?: {
    data?: string[];
  };
  xAxis?: {
    type?: string;
    data?: string[];
  };
  yAxis?: {
    type?: string;
    axisLabel?: {
      formatter?: (value: number) => string;
    };
  };
  visualMap?: {
    min?: number;
    max?: number;
    orient?: string;
    left?: string;
  };
  series?: Array<{
    type?: string;
    name?: string;
    stack?: string;
    data?: number[] | Array<[number, number, number]> | Array<{ name: string; value: number }>;
    radius?: number[];
    roseType?: string;
  }>;
}

const ReactECharts = dynamic(() => import("echarts-for-react"), { ssr: false });

function useJson<T>(path: string, initial: T): T {
  const base = process.env.NEXT_PUBLIC_BASE_PATH || "";
  const [data, setData] = useState<T>(initial);
  useEffect(() => {
    fetch(`${base}${path}`).then(r => r.json()).then(setData).catch(() => {});
  }, [path, base]);
  return data;
}

export default function Visualizations() {
  const byBinyan = useJson<Record<string, { active: number; passive: number }>>("/data/agg/by_binyan.json", {});
  const byUsage = useJson<Record<string, number>>("/data/agg/by_usage.json", {});
  const byBookBinyan = useJson<Record<string, Record<string, number>>>("/data/agg/by_book_binyan.json", {});
  const genderNumber = useJson<Record<string, Record<string, number>>>("/data/agg/gender_number.json", {});
  const prefixContext = useJson<Record<string, number>>("/data/agg/prefix_context.json", {});
  const negByBinyan = useJson<Record<string, { neg: number; total: number }>>("/data/agg/negation_by_binyan.json", {});
  const defByUsage = useJson<Record<string, { def: number; total: number }>>("/data/agg/definiteness_by_usage.json", {});
  const stateByUsage = useJson<Record<string, Record<string, number>>>("/data/agg/state_by_usage.json", {});
  const prefixCombo = useJson<Record<string, Record<string, number>>>("/data/agg/prefix_combo_by_binyan.json", {});
  const personDist = useJson<Record<string, number>>("/data/agg/person_distribution.json", {});
  const relByBinyan = useJson<Record<string, { rel: number; total: number }>>("/data/agg/relative_by_binyan.json", {});
  const etByBinyan = useJson<Record<string, { et: number; total: number }>>("/data/agg/et_marker_by_binyan.json", {});
  const prepTypeByBinyan = useJson<Record<string, Record<string, number>>>("/data/agg/prep_type_by_binyan.json", {});
  const positionBins = useJson<Record<string, number>>("/data/agg/position_bins.json", {});
  const followingPos = useJson<Record<string, number>>("/data/agg/following_pos.json", {});

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      <h1 className="text-2xl font-semibold">Visualizations</h1>

      <Grid title="Binyan × Voice">
        <BarStackBinyanVoice data={byBinyan} />
      </Grid>

      <Grid title="Usage distribution">
        <PieUsage data={byUsage} />
      </Grid>

      <Grid title="Book × Binyan heatmap">
        <HeatBookBinyan data={byBookBinyan} />
      </Grid>

      <Grid title="Gender × Number">
        <StackedBarsMatrix data={genderNumber} />
      </Grid>

      <Grid title="Prefix context prevalence">
        <BarSimple data={prefixContext} />
      </Grid>

      <Grid title="Negation rate by binyan">
        <RateByKey data={negByBinyan} rateKey="neg" />
      </Grid>

      <Grid title="Definiteness by usage">
        <RateByKey data={defByUsage} rateKey="def" />
      </Grid>

      <Grid title="State by usage">
        <HeatSimple data={stateByUsage} />
      </Grid>

      <Grid title="Prefix combos by binyan (top 12 per binyan)">
        <TopCombos data={prefixCombo} />
      </Grid>

      <Grid title="Person distribution">
        <BarSimple data={personDist} />
      </Grid>

      <Grid title="Relative-clause association by binyan">
        <RateByKey data={relByBinyan} rateKey="rel" />
      </Grid>

      <Grid title="Object marker (את) before participle by binyan">
        <RateByKey data={etByBinyan} rateKey="et" />
      </Grid>

      <Grid title="Preposition initial letter by binyan">
        <HeatSimple data={prepTypeByBinyan} />
      </Grid>

      <Grid title="Position in verse (quartiles)">
        <BarSimple data={positionBins} />
      </Grid>

      <Grid title="Following part-of-speech after participle">
        <BarSimple data={followingPos} />
      </Grid>
    </div>
  );
}

function Grid({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card>
      <CardHeader><CardTitle>{title}</CardTitle></CardHeader>
      <CardContent>
        <div className="w-full overflow-x-auto">{children}</div>
      </CardContent>
    </Card>
  );
}

function BarSimple({ data }: { data: Record<string, number> }) {
  const keys = Object.keys(data);
  const option = {
    tooltip: { trigger: "axis" },
    xAxis: { type: "category", data: keys },
    yAxis: { type: "value" },
    series: [{ type: "bar", data: keys.map(k => data[k]) }],
  } as EChartsOption;
  return <ReactECharts option={option} style={{ height: 360, minWidth: 600 }} />;
}

function BarStackBinyanVoice({ data }: { data: Record<string, { active: number; passive: number }> }) {
  const binyans = Object.keys(data);
  const active = binyans.map(b => data[b].active);
  const passive = binyans.map(b => data[b].passive);
  const option = {
    tooltip: { trigger: "axis" },
    legend: { data: ["Active","Passive"] },
    xAxis: { type: "category", data: binyans },
    yAxis: { type: "value" },
    series: [
      { name: "Active", type: "bar", stack: "v", data: active },
      { name: "Passive", type: "bar", stack: "v", data: passive },
    ],
  } as EChartsOption;
  return <ReactECharts option={option} style={{ height: 360, minWidth: 600 }} />;
}

function PieUsage({ data }: { data: Record<string, number> }) {
  const option = {
    tooltip: { trigger: "item" },
    series: [
      {
        type: "pie",
        radius: [40, 160],
        roseType: "area",
        data: Object.entries(data).map(([name, value]) => ({ name, value })),
      },
    ],
  } as EChartsOption;
  return <ReactECharts option={option} style={{ height: 360 }} />;
}

function HeatBookBinyan({ data }: { data: Record<string, Record<string, number>> }) {
  const books = Object.keys(data);
  const binyans = Array.from(new Set(books.flatMap(b => Object.keys(data[b]))));
  const seriesData: Array<[number, number, number]> = [];
  books.forEach((book, i) => {
    binyans.forEach((bin, j) => {
      seriesData.push([j, i, data[book][bin] || 0]);
    });
  });
  const option = {
    tooltip: {},
    xAxis: { type: "category", data: binyans },
    yAxis: { type: "category", data: books },
    visualMap: { min: 0, max: Math.max(...seriesData.map((d) => d[2] || 0), 1), orient: "horizontal", left: "center" },
    series: [{ type: "heatmap", data: seriesData }],
  } as EChartsOption;
  return <ReactECharts option={option} style={{ height: 600, minWidth: 700 }} />;
}

function StackedBarsMatrix({ data }: { data: Record<string, Record<string, number>> }) {
  const genders = Object.keys(data);
  const numbers = Array.from(new Set(genders.flatMap(g => Object.keys(data[g]))));
  const option = {
    tooltip: { trigger: "axis" },
    legend: { data: numbers },
    xAxis: { type: "category", data: genders },
    yAxis: { type: "value" },
    series: numbers.map(n => ({ name: n, type: "bar", stack: "x", data: genders.map(g => data[g][n] || 0) })),
  } as EChartsOption;
  return <ReactECharts option={option} style={{ height: 360, minWidth: 600 }} />;
}

function HeatSimple({ data }: { data: Record<string, Record<string, number>> }) {
  const rows = Object.keys(data);
  const cols = Array.from(new Set(rows.flatMap(r => Object.keys(data[r]))));
  const seriesData: Array<[number, number, number]> = [];
  rows.forEach((r, i) => cols.forEach((c, j) => seriesData.push([j, i, data[r][c] || 0])));
  const option = {
    tooltip: {},
    xAxis: { type: "category", data: cols },
    yAxis: { type: "category", data: rows },
    visualMap: { min: 0, max: Math.max(...seriesData.map(d => d[2] || 0), 1), orient: "horizontal", left: "center" },
    series: [{ type: "heatmap", data: seriesData }],
  } as EChartsOption;
  return <ReactECharts option={option} style={{ height: 400, minWidth: 700 }} />;
}

function RateByKey({ data, rateKey }: { data: Record<string, { [k: string]: number; total: number }>; rateKey: string }) {
  const keys = Object.keys(data);
  const option = {
    tooltip: { trigger: "axis", formatter: (params: unknown) => {
      const paramArray = Array.isArray(params) ? params : [params];
      return paramArray.map((p: { name: string; value: number }) => `${p.name}: ${(p.value * 100).toFixed(1)}%`).join("<br/>");
    } },
    xAxis: { type: "category", data: keys },
    yAxis: { type: "value", axisLabel: { formatter: (v: number) => `${(v * 100).toFixed(0)}%` } },
    series: [{ type: "bar", data: keys.map(k => (data[k][rateKey] || 0) / Math.max(1, data[k].total)) }],
  } as EChartsOption;
  return <ReactECharts option={option} style={{ height: 360, minWidth: 600 }} />;
}

function TopCombos({ data }: { data: Record<string, Record<string, number>> }) {
  // Show a simple concatenated bar chart of top combos overall
  const merged = Object.entries(data).flatMap(([b, combos]) => Object.entries(combos).map(([k, v]) => ({ name: `${b}: ${k}`, value: v })));
  merged.sort((a, b) => b.value - a.value);
  const top = merged.slice(0, 50);
  const option = {
    tooltip: { trigger: "axis" },
    xAxis: { type: "category", data: top.map(t => t.name) },
    yAxis: { type: "value" },
    series: [{ type: "bar", data: top.map(t => t.value) }],
  } as EChartsOption;
  return <ReactECharts option={option} style={{ height: 480, minWidth: 900 }} />;
}


