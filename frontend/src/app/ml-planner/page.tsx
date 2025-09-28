"use client";
import { useState, useMemo } from "react";
import { Loader2, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

type MLRec = { rank: number; course_name: string; suggested_term?: string | null };
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

  // Client-side limit to selected max number (Top K)
  const limitedRecs = useMemo(() => {
    const all = data?.recommendations ?? [];
    const limit = topK && topK > 0 ? topK : all.length;
    return all.slice(0, limit);
  }, [data, topK]);

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
                  onChange={(e) => {
                    const v = e.target.value;
                    setTopK(v ? Math.max(1, Number(v)) : undefined);
                  }}
                />
              </div>
              <div className="md:col-span-1 flex items-end">
                <Button type="submit" disabled={loading} className="w-full">
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Running…
                    </>
                  ) : (
                    "Get"
                  )}
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
              {/* Ranked list only (limited to Top K) */}
              <div>
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium">Top Recommendations</h3>
                  <span className="text-xs text-zinc-500">
                    Showing {limitedRecs.length}
                    {typeof topK === "number" ? ` / ${topK}` : ""} of {data.recommendations.length}
                  </span>
                </div>
                <ul className="space-y-2 mt-2">
                  {limitedRecs.map((r) => (
                    <li
                      key={r.rank}
                      className="flex items-center justify-between rounded-xl border p-3"
                    >
                      <div>
                        <span className="font-semibold">{r.course_name}</span>
                        {r.suggested_term && (
                          <div className="text-xs text-zinc-500">
                            Suggested: {r.suggested_term}
                          </div>
                        )}
                      </div>
                      <span className="text-xs text-zinc-600">#{r.rank}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
