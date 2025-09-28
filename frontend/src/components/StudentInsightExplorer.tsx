"use client";

import React, { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Loader2, GraduationCap, Search, Users, Sparkles, TrendingUp } from "lucide-react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from "recharts";

// --- Types ---
interface Peer {
  id: string;
  name: string;
  grade: "A" | "A-" | "B+" | string;
  similarity: number;
  textbooks?: string[];
}

// --- Helpers ---
function gradeColor(grade: string) {
  switch (grade) {
    case "A":
      return "bg-emerald-600";
    case "A-":
      return "bg-emerald-500";
    case "B+":
      return "bg-sky-500";
    default:
      return "bg-zinc-500";
  }
}

async function fetchPeers(params: {
  studentName: string;
  courseMode: "id" | "name";
  course: string; // courseId or courseName value
  minSim: number;
  grades: string[];
  withTextbooks?: boolean;
}): Promise<Peer[]> {
  const query = new URLSearchParams({
    name: params.studentName,
    by: params.courseMode,
    course: params.course,
    minSim: String(params.minSim),
    grades: params.grades.join(","),
    withTextbooks: String(params.withTextbooks ?? false),
  });
  const res = await fetch(`/api/peers?${query.toString()}`);
  if (!res.ok) throw new Error("Failed to fetch peers");
  return (await res.json()) as Peer[];
}

// --- Component ---
export default function StudentInsightExplorer() {
  const [studentName, setStudentName] = useState("");
  const [courseMode, setCourseMode] = useState<"id" | "name">("id");
  const [courseId, setCourseId] = useState("");
  const [courseName, setCourseName] = useState("");
  const [minSim, setMinSim] = useState(0.8);
  const [gradeA, setGradeA] = useState(true);
  const [gradeAMinus, setGradeAMinus] = useState(true);
  const [gradeBPlus, setGradeBPlus] = useState(true);
  const [includeTextbooks, setIncludeTextbooks] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [peers, setPeers] = useState<Peer[]>([]);

  const hasTextbooks = useMemo(
    () => peers.some((p) => (p.textbooks?.length ?? 0) > 0),
    [peers]
  );

  const selectedGrades = useMemo(
    () => [gradeA && "A", gradeAMinus && "A-", gradeBPlus && "B+"].filter(Boolean) as string[],
    [gradeA, gradeAMinus, gradeBPlus]
  );

  const gradeChartData = useMemo(() => {
    const aggregate = peers.reduce<Record<string, number>>((acc, p) => {
      acc[p.grade] = (acc[p.grade] || 0) + 1;
      return acc;
    }, {});
    return Object.entries(aggregate).map(([grade, count]) => ({ grade, count }));
  }, [peers]);

  // New derived charts
  const similarityChartData = useMemo(() => {
    if (peers.length === 0) return [];
    const buckets = Array.from({ length: 10 }, (_, i) => ({
      range: `${i * 10}-${(i + 1) * 10}%`,
      count: 0,
    }));
    peers.forEach((p) => {
      const pct = Math.round(p.similarity * 100);
      const idx = Math.max(0, Math.min(9, Math.floor(pct / 10)));
      buckets[idx].count += 1;
    });
    return buckets;
  }, [peers]);

  const topTextbooksData = useMemo(() => {
    const counts: Record<string, number> = {};
    peers.forEach((p) => {
      (p.textbooks ?? []).forEach((tb) => {
        counts[tb] = (counts[tb] || 0) + 1;
      });
    });
    return Object.entries(counts)
      .map(([textbook, count]) => ({ textbook, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }, [peers]);

  const canSearch =
    studentName.trim().length > 0 &&
    selectedGrades.length > 0 &&
    ((courseMode === "id" && courseId.trim().length > 0) ||
      (courseMode === "name" && courseName.trim().length > 0));

  async function onSearch() {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchPeers({
        studentName,
        courseMode,
        course: courseMode === "id" ? courseId : courseName,
        minSim,
        grades: selectedGrades,
        withTextbooks: includeTextbooks,
      });
      setPeers(data);
    } catch (e: any) {
      setError(e?.message || "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-white to-zinc-50 p-6">
      <header className="mb-6 flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-black text-white shadow">
          <GraduationCap className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Student Insight Explorer</h1>
          <p className="text-sm text-zinc-600">Find high-performing peers with similar learning styles.</p>
        </div>
        <div className="ml-auto hidden items-center gap-2 md:flex">
          <Badge variant="secondary" className="gap-1">
            <Sparkles className="h-3.5 w-3.5" /> Hack-ready
          </Badge>
          <Badge variant="outline" className="gap-1">
            <TrendingUp className="h-3.5 w-3.5" /> Neo4j-powered
          </Badge>
        </div>
      </header>

      <Tabs defaultValue="search" className="space-y-6">
        <TabsList>
          <TabsTrigger value="search" className="gap-2">
            <Search className="h-4 w-4" />
            Search
          </TabsTrigger>
          <TabsTrigger value="insights" className="gap-2">
            <Users className="h-4 w-4" />
            Insights
          </TabsTrigger>
        </TabsList>

        {/* Search Tab */}
        <TabsContent value="search" className="space-y-6">
          <Card className="rounded-2xl">
            <CardHeader>
              <CardTitle>Query Builder</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="student">Student name</Label>
                  <Input
                    id="student"
                    placeholder="e.g., Bailey Morris"
                    value={studentName}
                    onChange={(e) => setStudentName(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Course selector</Label>
                  <Select value={courseMode} onValueChange={(v: string) => setCourseMode(v as "id" | "name")}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="id">By Course ID</SelectItem>
                      <SelectItem value="name">By Course Name</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {courseMode === "id" ? (
                  <div className="space-y-2">
                    <Label htmlFor="courseId">Course ID</Label>
                    <Input
                      id="courseId"
                      placeholder="e.g., CSCI-330"
                      value={courseId}
                      onChange={(e) => setCourseId(e.target.value)}
                    />
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Label htmlFor="courseName">Course name</Label>
                    <Input
                      id="courseName"
                      placeholder="e.g., Algorithms"
                      value={courseName}
                      onChange={(e) => setCourseName(e.target.value)}
                    />
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label>Extras</Label>
                <div className="flex items-center gap-3 py-1">
                  <Checkbox
                    id="withTextbooks"
                    checked={includeTextbooks}
                    onCheckedChange={(v) => setIncludeTextbooks(Boolean(v))}
                  />
                  <Label htmlFor="withTextbooks">Include textbooks</Label>
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div className="space-y-3">
                  <Label>Minimum similarity ({Math.round(minSim * 100)}%)</Label>
                  <Slider value={[minSim]} min={0.5} max={0.99} step={0.01} onValueChange={(vals) => setMinSim(vals[0])} />
                  <p className="text-xs text-zinc-500">Adjust the learning-style similarity threshold.</p>
                </div>

                <div className="space-y-2">
                  <Label>Successful grades</Label>
                  <div className="flex items-center gap-3 py-1">
                    <Checkbox id="gA" checked={gradeA} onCheckedChange={(v) => setGradeA(Boolean(v))} />
                    <Label htmlFor="gA">A</Label>
                    <Checkbox id="gA-" checked={gradeAMinus} onCheckedChange={(v) => setGradeAMinus(Boolean(v))} />
                    <Label htmlFor="gA-">A-</Label>
                    <Checkbox id="gB+" checked={gradeBPlus} onCheckedChange={(v) => setGradeBPlus(Boolean(v))} />
                    <Label htmlFor="gB+">B+</Label>
                  </div>
                </div>

                <div className="flex items-end justify-start">
                  <Button onClick={onSearch} disabled={!canSearch || loading} className="gap-2">
                    {loading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Searching
                      </>
                    ) : (
                      <>
                        <Search className="h-4 w-4" />
                        Search
                      </>
                    )}
                  </Button>
                </div>
              </div>

              {error && <div className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</div>}
            </CardContent>
          </Card>

          <Card className="rounded-2xl">
            <CardHeader>
              <CardTitle>Results</CardTitle>
            </CardHeader>
            <CardContent>
              {peers.length === 0 ? (
                <p className="text-sm text-zinc-500">No results yet. Run a search to see peers.</p>
              ) : (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                    <div className="col-span-2">
                      <Table>
                        <TableCaption>Similar, successful peers for the selected course</TableCaption>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Peer</TableHead>
                            <TableHead className="w-32">Grade</TableHead>
                            <TableHead className="w-40">Similarity</TableHead>
                            {hasTextbooks && <TableHead className="min-w-[220px]">Textbooks</TableHead>}
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {peers.map((p) => (
                            <TableRow key={p.id}>
                              <TableCell>
                                <div className="flex flex-col">
                                  <span className="font-medium">{p.name}</span>
                                  <span className="text-xs text-zinc-500">{p.id}</span>
                                </div>
                              </TableCell>
                              <TableCell>
                                <span
                                  className={`inline-flex h-6 items-center rounded-full px-2 text-xs font-medium text-white ${gradeColor(
                                    p.grade
                                  )}`}
                                >
                                  {p.grade}
                                </span>
                              </TableCell>
                              <TableCell>{(p.similarity * 100).toFixed(1)}%</TableCell>
                              {hasTextbooks && (
                                <TableCell className="max-w-[280px]">
                                  {(p.textbooks ?? []).slice(0, 3).map((tb) => (
                                    <span key={tb} className="mr-2 mb-1 inline-flex rounded-full bg-zinc-100 px-2 py-0.5 text-xs">
                                      {tb}
                                    </span>
                                  ))}
                                  {(p.textbooks?.length ?? 0) > 3 && (
                                    <span className="text-xs text-zinc-500">+{p.textbooks!.length - 3} more</span>
                                  )}
                                </TableCell>
                              )}
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>

                    {/* Charts column */}
                    <div className="space-y-4">
                      {/* Grade distribution — always */}
                      <div className="rounded-2xl border p-3">
                        <h3 className="mb-2 text-sm font-medium text-zinc-700">Grade distribution</h3>
                        <div className="h-56">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={gradeChartData}>
                              <XAxis dataKey="grade" />
                              <YAxis allowDecimals={false} />
                              <Tooltip />
                              <Bar dataKey="count" />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      </div>

                      {/* If textbooks present → show Top textbooks; else → Similarity histogram */}
                      {!hasTextbooks ? (
                        <div className="rounded-2xl border p-3">
                          <h3 className="mb-2 text-sm font-medium text-zinc-700">Similarity histogram</h3>
                          <div className="h-56">
                            <ResponsiveContainer width="100%" height="100%">
                              <BarChart data={similarityChartData}>
                                <XAxis dataKey="range" />
                                <YAxis allowDecimals={false} />
                                <Tooltip />
                                <Bar dataKey="count" />
                              </BarChart>
                            </ResponsiveContainer>
                          </div>
                        </div>
                      ) : (
                        <div className="rounded-2xl border p-3">
                          <h3 className="mb-2 text-sm font-medium text-zinc-700">Top textbooks</h3>
                          <div className="h-56">
                            <ResponsiveContainer width="100%" height="100%">
                              <BarChart data={topTextbooksData}>
                                <XAxis dataKey="textbook" hide />
                                <YAxis allowDecimals={false} />
                                <Tooltip />
                                <Bar dataKey="count" />
                              </BarChart>
                            </ResponsiveContainer>
                          </div>
                          <p className="mt-2 text-xs text-zinc-500">
                            Showing top {topTextbooksData.length} textbooks across peers.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Insights Tab */}
        <TabsContent value="insights" className="space-y-6">
          <Card className="rounded-2xl">
            <CardHeader>
              <CardTitle>How to use this UI</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-zinc-700">
              <p>
                Enter a <strong>student name</strong>, choose whether you want to select the course by <em>ID</em> or{" "}
                <em>Name</em>, then set the <strong>minimum similarity</strong> and which <strong>grades</strong> you
                consider successful.
              </p>
              <p>
                Press <em>Search</em> to query the backend. Results are sorted by similarity descending. The backend
                supports a single endpoint and resolves course names to IDs:
              </p>
              <p className="text-zinc-500">
                <code>/api/peers?name=&by=id|name&course=&minSim=&grades=&withTextbooks=</code>
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <footer className="mt-10 text-center text-xs text-zinc-500">
        Built for rapid iteration. Toggle <code>Include textbooks</code> to enrich results and charts.
      </footer>
    </div>
  );
}
