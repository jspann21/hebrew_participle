"use client";
import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type Row = {
  bookName: string;
  chapter: number;
  verse: number;
  binyan: string;
  voice: "active" | "passive";
  usage: "verbal" | "adjectival" | "substantive";
  gender?: string;
  number?: string;
  hasArticle: boolean;
  negated: boolean;
  wordUnpointed: string;
  wordPointed: string;
  gloss: string;
};

export default function Explore() {
  const [rows, setRows] = useState<Row[]>([]);
  const [book, setBook] = useState<string>("");
  const [binyan, setBinyan] = useState<string>("");
  const [voice, setVoice] = useState<string>("");
  const [usage, setUsage] = useState<string>("");
  const [definite, setDefinite] = useState<string>("");
  const [neg, setNeg] = useState<string>("");
  const [query, setQuery] = useState<string>("");

  useEffect(() => {
    const base = process.env.NEXT_PUBLIC_BASE_PATH || "";
    async function load() {
      try {
        const res = await fetch(`${base}/data/participles.rows.json`);
        if (res.ok) {
          const data = await res.json();
          setRows((data.rows ?? data) as Row[]);
          return;
        }
      } catch {}
      // fallback: chunk pattern
      let chunk = 0;
      const all: Row[] = [];
      while (true) {
        const r = await fetch(`${base}/data/participles.rows.${chunk}.json`);
        if (!r.ok) break;
        const d = await r.json();
        all.push(...(d.rows ?? d));
        chunk++;
      }
      if (all.length) setRows(all);
    }
    load();
  }, []);

  const filtered = useMemo(() => {
    return rows.filter((r) =>
      (!book || r.bookName === book) &&
      (!binyan || r.binyan === binyan) &&
      (!voice || r.voice === voice) &&
      (!usage || r.usage === usage) &&
      (!definite || (definite === "yes" ? r.hasArticle : !r.hasArticle)) &&
      (!neg || (neg === "yes" ? r.negated : !r.negated)) &&
      (!query || r.wordUnpointed.includes(query) || r.wordPointed.includes(query) || (r.gloss || "").includes(query))
    );
  }, [rows, book, binyan, voice, usage, definite, neg, query]);

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <h1 className="text-2xl font-semibold mb-4">Explorer</h1>
      <div className="grid grid-cols-2 md:grid-cols-8 gap-4 mb-6">
        <Input placeholder="Search word/gloss" value={query} onChange={(e) => setQuery(e.target.value)} />
        <Select value={book} onValueChange={setBook}>
          <SelectTrigger><SelectValue placeholder="Book" /></SelectTrigger>
          <SelectContent>
            {[...new Set(rows.map(r => r.bookName))].sort().map(b => (
              <SelectItem key={b} value={b}>{b}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={binyan} onValueChange={setBinyan}>
          <SelectTrigger><SelectValue placeholder="Binyan" /></SelectTrigger>
          <SelectContent>
            {[...new Set(rows.map(r => r.binyan))].sort().map(b => (
              <SelectItem key={b} value={b}>{b}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={voice} onValueChange={setVoice}>
          <SelectTrigger><SelectValue placeholder="Voice" /></SelectTrigger>
          <SelectContent>
            {(["active","passive"] as const).map(v => (
              <SelectItem key={v} value={v}>{v}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={usage} onValueChange={setUsage}>
          <SelectTrigger><SelectValue placeholder="Usage" /></SelectTrigger>
          <SelectContent>
            {(["verbal","adjectival","substantive"] as const).map(u => (
              <SelectItem key={u} value={u}>{u}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={definite} onValueChange={setDefinite}>
          <SelectTrigger><SelectValue placeholder="Definite?" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="yes">Yes</SelectItem>
            <SelectItem value="no">No</SelectItem>
          </SelectContent>
        </Select>
        <Select value={neg} onValueChange={setNeg}>
          <SelectTrigger><SelectValue placeholder="Negated?" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="yes">Yes</SelectItem>
            <SelectItem value="no">No</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Results ({filtered.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b">
                  <th className="py-2">Ref</th>
                  <th className="py-2">Word</th>
                  <th className="py-2">Binyan</th>
                  <th className="py-2">Voice</th>
                  <th className="py-2">Usage</th>
                  <th className="py-2">Gn</th>
                  <th className="py-2">Nu</th>
                </tr>
              </thead>
              <tbody>
                {filtered.slice(0, 500).map((r, i) => (
                  <tr key={i} className="border-b">
                    <td className="py-1">{r.bookName} {r.chapter}:{r.verse}</td>
                    <td className="py-1 rtl font-hebrew">{r.wordPointed || r.wordUnpointed}</td>
                    <td className="py-1">{r.binyan}</td>
                    <td className="py-1">{r.voice}</td>
                    <td className="py-1">{r.usage}</td>
                    <td className="py-1">{r.gender || "-"}</td>
                    <td className="py-1">{r.number || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}


