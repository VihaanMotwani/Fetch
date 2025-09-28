"use client";
import { useState, useMemo } from "react";
import { Loader2, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from "recharts";

type MLRec = { rank: number; course_id: string; suggested_term?: string | null };
type MLRecResponse = {
  student_name: string;
  avg_peer_score: number;
  recommendations: MLRec[];
};

async function fetchML(name: string, topK?: number): Promise<MLRecResponse> {
  const qs = new URLSearchParams({ name });
  if (topK != null) qs.set("top_k", String(topK));
  const res = await fetch(`/api/ml/recommendations?${qs}`);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export default function MLPlannerPage() {
  const [name, setName] = useState("");
  const [topK, setTopK] = useState<number | undefined>(8);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [data, setData] = useState<MLRecResponse | null>(null);

  const termAgg = useMemo(() => {
    if (!data?.recommendations?.length) return [];
    const counts: Record<string, number> = {};
    for (const r of data.recommendations) {
      const t = r.suggested_term || "Unspecified";
      counts[t] = (counts[t] || 0) + 1;
    }
    return Object.entries(counts).map(([term, count]) => ({ term, count }));
  }, [data]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    setData(null);
    if (!name.trim()) {
      setErr("Enter a student name");
      return;
    }
    setLoading(true);
    try {
      const out = await fetchML(name.trim(), topK);
      setData(out);
    } catch (e: any) {
      setErr(e?.message || "Failed to load recommendations");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-emerald-50 dark:bg-emerald-950">
    <div className="mx-auto max-w-6xl p-6 space-y-6">
      <h1 className="text-2xl font-semibold">ML Course Planner & GPA Predictor</h1>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Run Planner</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="grid grid-cols-1 gap-4 md:grid-cols-6">
            <div className="md:col-span-3">
              <Label htmlFor="name">Student name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Bailey Morris"
              />
            </div>
            <div className="md:col-span-2">
              <Label htmlFor="topk">Top K (optional)</Label>
              <Input
                id="topk"
                type="number"
                min={1}
                value={topK ?? ""}
                onChange={(e) => setTopK(e.target.value ? Number(e.target.value) : undefined)}
              />
            </div>
            <div className="md:col-span-1 flex items-end">
              <Button type="submit" disabled={loading} className="w-full">
                {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Running…</> : "Get"}
              </Button>
            </div>
          </form>
          {err && <p className="mt-3 text-sm text-red-700">{err}</p>}
        </CardContent>
      </Card>

      {loading && <p className="text-sm text-zinc-600">Loading results…</p>}

      {data && !loading && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Results for {data.student_name}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-sm text-zinc-600">
              <TrendingUp className="inline-block mr-1 h-4 w-4" />
              Avg peer score:{" "}
              <span className="font-semibold text-zinc-800">
                {Number(data.avg_peer_score).toFixed(2)}
              </span>
            </div>
            <Separator />
            <div className="grid gap-4 md:grid-cols-2">
              {/* Ranked list */}
              <div>
                <h3 className="text-sm font-medium">Top Recommendations</h3>
                <ul className="space-y-2 mt-2">
                  {data.recommendations.map((r) => (
                    <li key={r.rank} className="flex items-center justify-between rounded-xl border p-3">
                      <div>
                        <span className="font-semibold">{r.course_id}</span>
                        {r.suggested_term && (
                          <div className="text-xs text-zinc-500">Suggested: {r.suggested_term}</div>
                        )}
                      </div>
                      <span className="text-xs text-zinc-600">#{r.rank}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Term distribution chart */}
              <div>
                <h3 className="text-sm font-medium">Suggested Terms</h3>
                <div className="h-64 mt-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={termAgg}>
                      <CartesianGrid vertical={false} />
                      <XAxis dataKey="term" />
                      <YAxis allowDecimals={false} />
                      <Tooltip />
                      <Bar dataKey="count" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
    </div>
  );
}
