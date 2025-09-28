"use client";

import React, { useEffect, useMemo, useState } from "react";
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
  similarity: number; // 0..1
}

// --- Mock toggle ---
const USE_MOCK = false; // flip to false once your /api endpoints are ready

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
  course: string;      // courseId or courseName value
  minSim: number;
  grades: string[];
}): Promise<Peer[]> {
  const query = new URLSearchParams({
    name: params.studentName,
    by: params.courseMode,
    course: params.course,
    minSim: String(params.minSim),
    grades: params.grades.join(","),
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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [peers, setPeers] = useState<Peer[]>([]);

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

  const canSearch = studentName.trim().length > 0 && selectedGrades.length > 0 &&
    ((courseMode === "id" && courseId.trim().length > 0) || (courseMode === "name" && courseName.trim().length > 0));

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
          <Badge variant="secondary" className="gap-1"><Sparkles className="h-3.5 w-3.5"/> Hack-ready</Badge>
          <Badge variant="outline" className="gap-1"><TrendingUp className="h-3.5 w-3.5"/> Neo4j-powered</Badge>
        </div>
      </header>

      <Tabs defaultValue="search" className="space-y-6">
        <TabsList>
          <TabsTrigger value="search" className="gap-2"><Search className="h-4 w-4"/>Search</TabsTrigger>
          <TabsTrigger value="insights" className="gap-2"><Users className="h-4 w-4"/>Insights</TabsTrigger>
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
                  <Input id="student" placeholder="e.g., Bailey Morris" value={studentName} onChange={(e) => setStudentName(e.target.value)} />
                </div>

                <div className="space-y-2">
                  <Label>Course selector</Label>
                  <Select value={courseMode} onValueChange={(v: any) => setCourseMode(v)}>
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
                    <Input id="courseId" placeholder="e.g., CSCI-330" value={courseId} onChange={(e) => setCourseId(e.target.value)} />
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Label htmlFor="courseName">Course name</Label>
                    <Input id="courseName" placeholder="e.g., Algorithms" value={courseName} onChange={(e) => setCourseName(e.target.value)} />
                  </div>
                )}
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
                    {loading ? (<><Loader2 className="h-4 w-4 animate-spin"/>Searching</>) : (<><Search className="h-4 w-4"/>Search</>)}
                  </Button>
                </div>
              </div>

              {error && (
                <div className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</div>
              )}
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
                                <span className={`inline-flex h-6 items-center rounded-full px-2 text-xs font-medium text-white ${gradeColor(p.grade)}`}>
                                  {p.grade}
                                </span>
                              </TableCell>
                              <TableCell>
                                {(p.similarity * 100).toFixed(1)}%
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>

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
                Enter a <strong>student name</strong>, choose whether you want to select the course by <em>ID</em> or <em>Name</em>,
                then set the <strong>minimum similarity</strong> and which <strong>grades</strong> you consider successful.
              </p>
              <p>
                Press <em>Search</em> to query the backend. Results are sorted by similarity descending. You can wire this to Neo4j using
                your existing Cypher helpers.
              </p>
              <p className="text-zinc-500">Tip: expose two endpoints—<code>/api/peers?name=&courseId=</code> and <code>/api/peers/by-name?name=&courseName=</code>—that call your two query functions.</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <footer className="mt-10 text-center text-xs text-zinc-500">
        Built for rapid iteration. Swap <code>USE_MOCK</code> off when your API is ready.
      </footer>
    </div>
  );
}
