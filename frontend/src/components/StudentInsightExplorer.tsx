"use client";

import React, { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Loader2, Sparkles, Search, Wand2 } from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  Legend
} from "recharts";

interface Peer {
  id: string;
  name: string;
  grade: "A" | "A-" | "B+" | string;
  similarity: number;
  textbooks?: string[];
}

type LearnerRow = {
  c_id: string;
  c_name: string;
  grade: string;
  learning_style: string;
  students: number;
};

const PALETTE = [
  "#2563eb", // blue
  "#16a34a", // green
  "#f59e0b", // amber
  "#db2777", // pink
  "#7c3aed", // violet
  "#06b6d4", // cyan
  "#dc2626", // red
  "#0891b2", // teal
];

// --- Color helpers ---
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

const GRADE_FILLS: Record<string, string> = {
  A: PALETTE[1],   // green
  "A-": PALETTE[5], // cyan
  "B+": PALETTE[0], // blue
};
function gradeFill(g: string) {
  return GRADE_FILLS[g] ?? "#71717a";
}

function PixelDog() {
  return (
    <div className="pointer-events-none fixed bottom-[-32px] inset-x-0 z-50">
      <div className="dog-walker" aria-hidden="true">
        <div className="dog-sprite" />
      </div>

      <style jsx>{`
        .dog-walker {
          width: 64px;
          height: 64px;
          will-change: transform;
          animation: dog-walk 20s linear infinite;
        }
        .dog-sprite {
          width: 32px;
          height: 32px;
          background-image: url("/goldie.png");
          background-repeat: no-repeat;
          background-position-y: -128px;   /* 5th row */
          background-position-x: -32px;    /* skip label column */
          image-rendering: pixelated;
          transform: scale(4);
          transform-origin: bottom left;
          animation: dog-run 1.2s steps(3) infinite;
        }
        @keyframes dog-walk {
          0%   { transform: translateX(0) scaleX(1); }
          50%  { transform: translateX(calc(100vw - 64px)) scaleX(1); }
          50.01% { transform: translateX(calc(100vw - 64px)) scaleX(-1); }
          100% { transform: translateX(0) scaleX(-1); }
        }
        @keyframes dog-run {
          from { background-position-x: -32px; }
          to   { background-position-x: -128px; }
        }
      `}</style>
    </div>
  );
}

// --- Fetchers ---
async function fetchPeers(params: {
  studentName: string;
  courseMode: "id" | "name";
  course: string;
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

async function fetchLearnerTypes(params: {
  courseMode: "id" | "name";
  course: string;
}): Promise<LearnerRow[]> {
  const qs = new URLSearchParams({ by: params.courseMode, course: params.course });
  const res = await fetch(`/api/course/learner-types?${qs.toString()}`);
  if (!res.ok) throw new Error("Failed to fetch learner types");
  return await res.json();
}

// ⬇️ Returns plain text from your FastAPI AI endpoint
async function fetchAISummary(payload: unknown): Promise<string> {
  const res = await fetch("/api/ai/summary", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const text = await res.text();
  if (!res.ok) throw new Error(text || "AI summary failed");
  return text;
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
  const [showLearnerTypes, setShowLearnerTypes] = useState(false);

  const [loading, setLoading] = useState(false);
  const [loadingLearners, setLoadingLearners] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [peers, setPeers] = useState<Peer[]>([]);
  const [learnerRows, setLearnerRows] = useState<LearnerRow[] | null>(null);

  // 👇 AI states
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiText, setAiText] = useState<string | null>(null);

  const hasTextbooks = useMemo(
    () => peers.some((p) => (p.textbooks?.length ?? 0) > 0),
    [peers]
  );

  const selectedGrades = useMemo(
    () =>
      [gradeA && "A", gradeAMinus && "A-", gradeBPlus && "B+"].filter(
        Boolean
      ) as string[],
    [gradeA, gradeAMinus, gradeBPlus]
  );

  const course = courseMode === "id" ? courseId : courseName;

  const gradeChartData = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const g of selectedGrades) counts[g] = 0;
    peers.forEach((p) => {
      if (counts[p.grade] != null) counts[p.grade] += 1;
    });
    return Object.entries(counts).map(([grade, count]) => ({ grade, count }));
  }, [peers, selectedGrades]);

  const similarityHist = useMemo(() => {
    const buckets = Array.from({ length: 10 }, (_, i) => ({
      bucket: `${i * 10}-${i * 10 + 10}`,
      count: 0,
    }));
    peers.forEach((p) => {
      const idx = Math.min(9, Math.floor(p.similarity * 10));
      buckets[idx].count += 1;
    });
    return buckets;
  }, [peers]);

  const textbooksByGradeData = useMemo(() => {
    if (!hasTextbooks) return [] as any[];
    const map: Record<string, Record<string, number>> = {};
    peers.forEach((p) => {
      const g = p.grade;
      map[g] = map[g] || {};
      (p.textbooks || []).forEach((t) => {
        map[g][t] = (map[g][t] || 0) + 1;
      });
    });
    return Object.entries(map).map(([grade, books]) => ({ grade, ...books }));
  }, [peers, hasTextbooks]);

  function gradeBucket(g: string) {
    if (g.startsWith("A")) return "A";
    if (g.startsWith("B")) return "B";
    if (g.startsWith("C")) return "C";
    if (g.startsWith("D")) return "D";
    return null;
  }

  const learnerTypeKeys = useMemo(() => {
    if (!learnerRows) return [];
    const s = new Set<string>();
    learnerRows.forEach((r) => r.learning_style && s.add(r.learning_style));
    return Array.from(s);
  }, [learnerRows]);

  const gradeLearnerDistData = useMemo(() => {
    if (!learnerRows) return [];
    const base: Record<string, Record<string, number>> = {
      A: {},
      B: {},
      C: {},
      D: {},
    };
    learnerRows.forEach((r) => {
      const bucket = gradeBucket(r.grade);
      if (!bucket) return;
      const lt = r.learning_style || "Unknown";
      base[bucket][lt] = (base[bucket][lt] || 0) + r.students;
    });
    return ["A", "B", "C", "D"].map((g) => ({ grade: g, ...base[g] }));
  }, [learnerRows]);

  // --- Color Maps for Charts ---
  const textbookKeys = useMemo(() => {
    if (!textbooksByGradeData || !textbooksByGradeData.length) return [];
    // CORRECTED: Scan ALL rows to find every unique textbook key
    const allKeys = new Set<string>();
    textbooksByGradeData.forEach(row => {
      Object.keys(row).forEach(key => {
        if (key !== 'grade') {
          allKeys.add(key);
        }
      });
    });
    return Array.from(allKeys);
  }, [textbooksByGradeData]);

  const textbookColorMap = useMemo(() => {
    const map: Record<string, string> = {};
    textbookKeys.forEach((key, i) => {
      map[key] = PALETTE[i % PALETTE.length];
    });
    return map;
  }, [textbookKeys]);

  const learnerTypeColorMap = useMemo(() => {
    const map: Record<string, string> = {};
    learnerTypeKeys.forEach((key, i) => {
      map[key] = PALETTE[i % PALETTE.length];
    });
    return map;
  }, [learnerTypeKeys]);


  const canSearch =
    studentName.trim().length > 0 &&
    selectedGrades.length > 0 &&
    ((courseMode === "id" && courseId.trim().length > 0) ||
      (courseMode === "name" && courseName.trim().length > 0));

  async function onSearch() {
    setLoading(true);
    setLoadingLearners(false);
    setError(null);
    setLearnerRows(null);

    // Reset AI panel on new searches to avoid stale summaries
    setAiError(null);
    setAiText(null);
    setAiLoading(false);

    try {
      const peersRes = await fetchPeers({
        studentName: studentName.trim(),
        courseMode,
        course: course.trim(),
        minSim,
        grades: selectedGrades,
        withTextbooks: includeTextbooks,
      });
      setPeers(peersRes);

      if (showLearnerTypes) {
        setLoadingLearners(true);
        const lrows = await fetchLearnerTypes({
          courseMode,
          course: course.trim(),
        });
        setLearnerRows(lrows);
      }
    } catch (e: any) {
      setError(e?.message || "Something went wrong");
    } finally {
      setLoading(false);
      setLoadingLearners(false);
    }
  }

  // --- AI payload & action ---
function buildAISummaryPayload() {
  return {
    student_name: studentName?.trim() || null,
    filters: {
      min_similarity: minSim,
      selected_grades: selectedGrades,
      course_mode: courseMode,
      course: course?.trim() || null,
    },
    // ✅ grade distribution already matches [{ grade, count }]
    grade_distribution: gradeChartData,

    // ✅ transform learnerRows into [{ label, count }]
    learner_type_distribution: learnerRows
      ? learnerRows.map(r => ({
          label: r.learning_style || "Unknown",
          count: r.students,
        }))
      : [],

    // ✅ peers is already good
    peers: peers.map(p => ({
      id: p.id,
      grade: p.grade,
      similarity: p.similarity,
      textbooks: p.textbooks ?? [],
    })),
  };
}

  async function onGenerateAISummary() {
    setAiError(null);
    setAiText(null);
    setAiLoading(true);
    try {
      const payload = buildAISummaryPayload();
      const text = await fetchAISummary(payload); // returns plain text
      setAiText(text);
    } catch (e: any) {
      setAiError(e?.message || "Failed to generate summary");
    } finally {
      setAiLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-emerald-50 dark:bg-emerald-950">
      <div className="mx-auto max-w-6xl px-4 py-8">
        {/* Header */}
        <div className="mb-6 flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              Student Insight Explorer
            </h1>
            <p className="mt-1 text-sm text-zinc-500">
              Find peers with similar learning styles who succeeded in a course,
              and visualize distributions.
            </p>
          </div>
          <Badge variant="secondary" className="gap-1">
            <Sparkles size={14} /> Demo
          </Badge>
        </div>

        {/* Query builder */}
        <Card className="mb-6 rounded-2xl">
          <CardHeader>
            <CardTitle>Query</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="student">Student</Label>
                <Input
                  id="student"
                  placeholder="e.g., Bailey Morris"
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Course selection</Label>
                <div className="grid grid-cols-2 gap-3">
                  <Select
                    value={courseMode}
                    onValueChange={(v: "id" | "name") => setCourseMode(v)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="id">By Course ID</SelectItem>
                      <SelectItem value="name">By Course Name</SelectItem>
                    </SelectContent>
                  </Select>
                  {courseMode === "id" ? (
                    <Input
                      placeholder="e.g., CSCI-330"
                      value={courseId}
                      onChange={(e) => setCourseId(e.target.value)}
                    />
                  ) : (
                    <Input
                      placeholder="e.g., Algorithms"
                      value={courseName}
                      onChange={(e) => setCourseName(e.target.value)}
                    />
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="space-y-3">
                <Label>Minimum similarity ({Math.round(minSim * 100)}%)</Label>
                <Slider
                  value={[minSim]}
                  min={0.5}
                  max={0.99}
                  step={0.01}
                  onValueChange={(vals) => setMinSim(vals[0])}
                />
                <p className="text-xs text-zinc-500">
                  Adjust the learning-style similarity threshold.
                </p>
              </div>

              <div className="space-y-2">
                <Label>Successful grades</Label>
                <div className="flex items-center gap-3 py-1">
                  <Checkbox
                    id="gA"
                    checked={gradeA}
                    onCheckedChange={(v) => setGradeA(Boolean(v))}
                  />
                  <Label htmlFor="gA">A</Label>
                  <Checkbox
                    id="gA-"
                    checked={gradeAMinus}
                    onCheckedChange={(v) => setGradeAMinus(Boolean(v))}
                  />
                  <Label htmlFor="gA-">A-</Label>
                  <Checkbox
                    id="gB+"
                    checked={gradeBPlus}
                    onCheckedChange={(v) => setGradeBPlus(Boolean(v))}
                  />
                  <Label htmlFor="gB+">B+</Label>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Extras</Label>
                <div className="flex items-center gap-3 py-1">
                  <Checkbox
                    id="tb"
                    checked={includeTextbooks}
                    onCheckedChange={(v) => setIncludeTextbooks(Boolean(v))}
                  />
                  <Label htmlFor="tb">Include textbooks</Label>
                  <Separator orientation="vertical" className="mx-2 h-4" />
                  <Checkbox
                    id="lt"
                    checked={showLearnerTypes}
                    onCheckedChange={(v) => setShowLearnerTypes(Boolean(v))}
                  />
                  <Label htmlFor="lt">Show course learner types</Label>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Button onClick={onSearch} disabled={!canSearch || loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Searching
                  </>
                ) : (
                  <>
                    <Search className="mr-2 h-4 w-4" /> Search
                  </>
                )}
              </Button>
              {loadingLearners && (
                <span className="inline-flex items-center text-sm text-zinc-500">
                  <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" /> Loading
                  learner types…
                </span>
              )}
            </div>

            {error && (
              <div className="rounded-xl bg-red-50 p-3 text-sm text-red-700">
                {error}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Results */}
        <Card className="rounded-2xl">
          <CardHeader>
            <CardTitle>Results</CardTitle>
          </CardHeader>
          <CardContent>
            {peers.length === 0 ? (
              <p className="text-sm text-zinc-500">
                No results yet. Run a search to see peers.
              </p>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-zinc-500">
                    {peers.length} peers · minSim {(minSim * 100).toFixed(0)}% ·
                    grades {selectedGrades.join(", ")}
                  </div>
                </div>

                <Tabs defaultValue="overview" className="w-full">
                  <TabsList>
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="table">Table</TabsTrigger>
                  </TabsList>

                  <TabsContent value="overview" className="mt-2">
                    <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                      {/* 🔹 AI Summary Card (full-width on first row) */}
                      <div className="rounded-2xl border p-3 xl:col-span-2">
                        <div className="mb-2 flex items-center justify-between">
                          <h3 className="text-sm font-medium text-zinc-700">
                            AI summary & recommendations
                          </h3>
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={onGenerateAISummary}
                            disabled={aiLoading}
                            className="gap-1"
                            title="Generate personalized summary from the current results"
                          >
                            {aiLoading ? (
                              <>
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Generating…
                              </>
                            ) : (
                              <>
                                <Wand2 className="h-4 w-4" />
                                Generate
                              </>
                            )}
                          </Button>
                        </div>

                        {aiError && (
                          <div className="rounded-lg bg-red-50 p-2 text-sm text-red-700">
                            {aiError}
                          </div>
                        )}

                        {!aiError && aiText && (
                          <div className="prose prose-sm max-w-none whitespace-pre-wrap text-zinc-800">
                            {aiText}
                          </div>
                        )}

                        {!aiError && !aiText && !aiLoading && (
                          <div className="text-sm text-zinc-500">
                            Click “Generate” to produce a personalized summary based on the
                            peers and distributions below.
                          </div>
                        )}
                      </div>

                      {/* Grade distribution */}
                      <div className="rounded-2xl border p-3">
                        <h3 className="mb-2 text-sm font-medium text-zinc-700">
                          Grade distribution
                        </h3>
                        <div className="h-64">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                              data={gradeChartData}
                              margin={{ top: 8, right: 16, bottom: 24, left: 0 }}
                              barCategoryGap={8}
                              barGap={4}
                            >
                              <XAxis dataKey="grade" padding={{ left: 0, right: 8 }} />
                              <YAxis allowDecimals={false} width={28} />
                              <Tooltip />
                              <Legend />
                              <Bar dataKey="count">
                                {gradeChartData.map((d, i) => (
                                  <Cell key={i} fill={gradeFill(d.grade)} />
                                ))}
                              </Bar>
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      </div>

                      {/* If no textbooks → similarity histogram; else → Textbooks × Grade */}
                      {!hasTextbooks ? (
                        <div className="rounded-2xl border p-3">
                          <h3 className="mb-2 text-sm font-medium text-zinc-700">
                            Similarity histogram
                          </h3>
                          <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                              <BarChart
                                data={similarityHist}
                                margin={{ top: 8, right: 16, bottom: 24, left: 0 }}
                                barCategoryGap={2}
                              >
                                <XAxis
                                  dataKey="bucket"
                                  padding={{ left: 0, right: 8 }}
                                />
                                <YAxis allowDecimals={false} width={28} />
                                <Tooltip />
                                <Bar dataKey="count">
                                  {similarityHist.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={PALETTE[index % PALETTE.length]} />
                                  ))}
                                </Bar>
                              </BarChart>
                            </ResponsiveContainer>
                          </div>
                        </div>
                      ) : (
                        <div className="rounded-2xl border p-3">
                          <h3 className="mb-2 text-sm font-medium text-zinc-700">
                            Textbooks × Grade
                          </h3>
                          <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                              <BarChart
                                data={textbooksByGradeData}
                                margin={{ top: 8, right: 16, bottom: 24, left: 0 }}
                              >
                                <XAxis dataKey="grade" padding={{ left: 0, right: 8 }} />
                                <YAxis allowDecimals={false} width={28} />
                                <Tooltip />
                                <Legend />
                                {textbookKeys.map((k) => (
                                  <Bar key={k} dataKey={k} stackId="tb" fill={textbookColorMap[k]} />
                                ))}
                              </BarChart>
                            </ResponsiveContainer>
                          </div>
                        </div>
                      )}

                      {!!showLearnerTypes && (
                        <div className="rounded-2xl border p-3 xl:col-span-2">
                          <h3 className="mb-2 text-sm font-medium text-zinc-700">
                            Learner types by grade
                          </h3>
                          <div className="h-72">
                            <ResponsiveContainer width="100%" height="100%">
                              <BarChart
                                data={gradeLearnerDistData}
                                margin={{ top: 8, right: 16, bottom: 24, left: 0 }}
                              >
                                <XAxis dataKey="grade" padding={{ left: 0, right: 8 }} />
                                <YAxis allowDecimals={false} width={28} />
                                <Tooltip />
                                <Legend />
                                {learnerTypeKeys.map((k) => (
                                  <Bar key={k} dataKey={k} stackId="lt" fill={learnerTypeColorMap[k]} />
                                ))}
                              </BarChart>
                            </ResponsiveContainer>
                          </div>
                        </div>
                      )}
                    </div>
                  </TabsContent>

                  <TabsContent value="table" className="mt-2">
                    <div className="rounded-2xl border p-3">
                      <Table>
                        <TableCaption>
                          Similar, successful peers for the selected course
                        </TableCaption>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Peer</TableHead>
                            <TableHead className="w-32">Grade</TableHead>
                            <TableHead className="w-40">Similarity</TableHead>
                            {hasTextbooks && (
                              <TableHead className="min-w-[220px]">Textbooks</TableHead>
                            )}
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
                                  {(p.textbooks ?? [])
                                    .slice(0, 3)
                                    .map((tb) => (
                                      <span
                                        key={tb}
                                        className="mr-2 mb-1 inline-flex rounded-full bg-zinc-100 px-2 py-0.5 text-xs"
                                      >
                                        {tb}
                                      </span>
                                    ))}
                                  {(p.textbooks?.length ?? 0) > 3 && (
                                    <span className="text-xs text-zinc-500">
                                      +{p.textbooks!.length - 3} more
                                    </span>
                                  )}
                                </TableCell>
                              )}
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
            )}
          </CardContent>
        </Card>
        <PixelDog />
      </div>
    </div>
  );
}